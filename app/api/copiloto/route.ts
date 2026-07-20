import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { inserirProntuario } from "@/lib/medx"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"
import { logAiUsage } from "@/lib/log-ai-usage"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const m1 = stripped.match(/\{[\s\S]*\}/)
  if (m1) { try { return JSON.parse(m1[0]) } catch { /* continua */ } }
  const m2 = stripped.match(/\[[\s\S]*\]/)
  if (m2) { try { return JSON.parse(m2[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta n\u00e3o parse\u00e1vel como JSON: ${text.slice(0, 120)}\u2026`)
}
export const maxDuration = 60

function buildSystemPrompt(especialidade: string): string {
  return `Você é o Copiloto de Consulta do PRAXIS — assistente clínico especialista em ${especialidade}.\nRetorne APENAS JSON válido, sem markdown, sem texto antes ou depois do JSON.`
}

async function getMemoriaContext(userId: string, protocoloId?: string): Promise<string> {
  try {
    const supabase = createSupabaseServerClient()
    const parts: string[] = []

    if (protocoloId) {
      // Protocolo específico selecionado — injeta com prioridade, substitui favoritos automáticos
      const [{ data: protocolo }, { data: conhecimento }] = await Promise.all([
        supabase.from("memoria_clinica").select("titulo,conteudo").eq("id", protocoloId).eq("user_id", userId).single(),
        supabase.from("memoria_clinica").select("titulo,conteudo").eq("user_id", userId).eq("tipo", "conhecimento").limit(5),
      ])
      if (protocolo) parts.push(`PROTOCOLO APLICADO — ${(protocolo as { titulo: string; conteudo: string }).titulo}:\n${(protocolo as { titulo: string; conteudo: string }).conteudo.slice(0, 1500)}`)
      if (conhecimento?.length) parts.push("BASE DE CONHECIMENTO:\n" + conhecimento.map(d => `• ${(d as { titulo: string; conteudo: string }).titulo}: ${(d as { titulo: string; conteudo: string }).conteudo.slice(0, 300)}`).join("\n"))
    } else {
      // Comportamento padrão: todos os favoritos (limite 600 chars)
      const [{ data: conhecimento }, { data: protocolos }] = await Promise.all([
        supabase.from("memoria_clinica").select("titulo,conteudo").eq("user_id", userId).eq("tipo", "conhecimento").limit(5),
        supabase.from("memoria_clinica").select("titulo,conteudo").eq("user_id", userId).eq("tipo", "protocolo").eq("favorito", true).limit(3),
      ])
      if (conhecimento?.length) parts.push("BASE DE CONHECIMENTO:\n" + conhecimento.map(d => `• ${(d as { titulo: string; conteudo: string }).titulo}: ${(d as { titulo: string; conteudo: string }).conteudo.slice(0, 300)}`).join("\n"))
      if (protocolos?.length) parts.push("PROTOCOLOS ATIVOS:\n" + protocolos.map(d => `• ${(d as { titulo: string; conteudo: string }).titulo}: ${(d as { titulo: string; conteudo: string }).conteudo.slice(0, 600)}`).join("\n"))
    }

    return parts.length ? "\n\n" + parts.join("\n\n") : ""
  } catch (e) { console.error("[copiloto/route] getMemoriaContext falhou:", e); return "" }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}

// ── GET: fetch history ────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("copiloto_historico")
      .select("id, paciente_nome, tipo_consulta, relato, resultado, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    captureAnthropicError(e, "/api/copiloto")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

// ── DELETE: remove history entry ──────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("copiloto_historico")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    captureAnthropicError(e, "/api/copiloto")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

// ── POST: generate or send to MedX ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()

  const action = req.nextUrl.searchParams.get("action") ?? "gerar"

  try {
    if (action === "prontuario") {
      const { prontuario, idPaciente } = await req.json() as {
        prontuario: string
        idPaciente: string
      }
      if (!prontuario || !idPaciente)
        return NextResponse.json({ error: "prontuario e idPaciente obrigatórios" }, { status: 400 })

      const data = await inserirProntuario(prontuario, idPaciente)
      return NextResponse.json({ ok: true, data })
    }

    // action === "gerar"
    const body = await req.json() as {
      relato:         string
      dados?:         string
      tipoConsulta?:  string
      nomePaciente?:  string
      pacienteId?:    string
      protocoloId?:   string
    }

    const nome = body.nomePaciente ?? "paciente"
    const tipo = body.tipoConsulta ?? "Consulta"
    const supabase = createSupabaseServerClient()
    const [memoriaCtx, { data: perfilEspec }] = await Promise.all([
      getMemoriaContext(auth.userId, body.protocoloId),
      supabase.from("perfis").select("especialidade").eq("user_id", auth.userId).maybeSingle(),
    ])
    const especialidade = (perfilEspec?.especialidade as string | null) || "Clínica Geral"
    const SYSTEM = buildSystemPrompt(especialidade) + memoriaCtx

    const resp = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: 7500,
      system:     SYSTEM,
      messages: [{
        role:    "user",
        content:
`Dados da consulta${nome !== "paciente" ? ` do(a) ${nome}` : ""}:
Tipo: ${tipo}

RELATO DA CONSULTA:
${body.relato}
${body.dados ? `\nDADOS OBJETIVOS:\n${body.dados}` : ""}

Retorne um JSON com exatamente estas 7 chaves:
{
  "resumo": "Resumo clínico estruturado em 2-3 parágrafos, incluindo quadro clínico, hipóteses diagnósticas e contexto",
  "plano": "Plano terapêutico narrativo: orientações não-farmacológicas, medicações com dose/posologia, data de retorno. Não listar exames aqui.",
  "exames_solicitados": ["Nome do exame 1", "Nome do exame 2"],
  "orientacoes": "Orientações claras e em linguagem acessível para o paciente seguir em casa",
  "followup": {
    "d1": "Mensagem completa e pronta para enviar via WhatsApp no dia seguinte à consulta (D+1)",
    "d7": "Mensagem completa e pronta para enviar via WhatsApp 7 dias após a consulta (D+7)",
    "d30": "Mensagem completa e pronta para enviar via WhatsApp 30 dias após a consulta (D+30)"
  },
  "conteudo": "2-3 ideias de conteúdo para redes sociais baseadas no tema clínico desta consulta, sem identificar o paciente",
  "prontuario": "QUEIXA PRINCIPAL:\\n...\\n\\nHISTÓRIA DA DOENÇA ATUAL:\\n...\\n\\nANTECEDENTES:\\n...\\n\\nEXAME FÍSICO:\\n...\\n\\nHIPÓTESES DIAGNÓSTICAS:\\n...\\n\\nCONDUTA:\\n...\\n\\nRETORNO:\\n..."
}`,
      }],
    })

    logAiUsage({ userId: auth.userId, rota: "copiloto", inputTokens: resp.usage.input_tokens, outputTokens: resp.usage.output_tokens })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
    const start = clean.indexOf("{")
    const end   = clean.lastIndexOf("}")

    if (start === -1 || end === -1) {
      console.error("[api/copiloto] JSON não encontrado:", clean.slice(0, 200))
      return NextResponse.json({ error: "Claude não retornou JSON válido. Tente novamente." }, { status: 502 })
    }

    const parsed = parseAIJson(clean.slice(start, end + 1))

    // Save to history — non-blocking, never fails the response
    try {
      const supabase = createSupabaseServerClient()
      await supabase.from("copiloto_historico").insert({
        user_id:         auth.userId,
        paciente_id:     body.pacienteId   ?? null,
        paciente_nome:   body.nomePaciente ?? null,
        tipo_consulta:   body.tipoConsulta ?? null,
        relato:          body.relato,
        dados_objetivos: body.dados ?? null,
        resultado:       parsed,
      })
    } catch (saveErr) {
      captureAnthropicError(saveErr, "/api/copiloto")
      console.error("[api/copiloto] Falha ao salvar histórico:", saveErr)
    }

    // Fire-and-forget: Primeira Consulta → schedule NPS + indicação D+1
    if (body.tipoConsulta?.toLowerCase() === "primeira consulta" && body.nomePaciente) {
      ;(async () => {
        try {
          const sbFF = createSupabaseServerClient()
          const d1   = new Date()
          d1.setDate(d1.getDate() + 1)
          const at = d1.toISOString()
          await sbFF.from("nps_pesquisas").insert({
            user_id:           auth.userId,
            paciente_nome:     body.nomePaciente,
            paciente_telefone: null,
            agendado_para:     at,
          })
          const indicacao = `Olá, ${body.nomePaciente}! Foi um prazer ter você em consulta. Se você conhece alguém que também pode se beneficiar do nosso cuidado, agradeço muito a sua indicação. Qualquer dúvida, estou à disposição!`
          await sbFF.from("nurturing_sequencias").insert({
            user_id:       auth.userId,
            lead_id:       null,
            dia:           1,
            mensagem:      indicacao,
            status:        "pendente",
            agendado_para: at,
          })
        } catch (e) {
          captureAnthropicError(e, "/api/copiloto")
          console.error("[copiloto] primeira-consulta automations:", e)
        }
      })()
    }

    return NextResponse.json(parsed)
  } catch (e) {
    captureAnthropicError(e, "/api/copiloto")
    console.error("[api/copiloto]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
