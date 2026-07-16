import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"


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
export const maxDuration = 30

interface Alerta {
  tipo:      string
  titulo:    string
  descricao: string
  urgencia:  "alta" | "media" | "baixa"
}

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  const supabase = createSupabaseServiceClient()
  const client   = getAnthropicClient()

  try {
    const { data: pac, error } = await supabase
      .from("pacientes_local")
      .select("nome, peso, altura, medicamentos, protocolo_ativo, data_nascimento")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single()
    if (error || !pac) return NextResponse.json({ alertas: [] })

    const [{ data: exames }, { data: historico }] = await Promise.all([
      supabase
        .from("paciente_exames")
        .select("nome, valor, unidade, data_coleta, criado_em")
        .eq("paciente_id", id)
        .eq("user_id", auth.userId)
        .order("data_coleta", { ascending: false })
        .limit(8),
      supabase
        .from("copiloto_historico")
        .select("tipo_consulta, created_at")
        .eq("user_id", auth.userId)
        .ilike("paciente_nome", pac.nome)
        .order("created_at", { ascending: false })
        .limit(3),
    ])

    const ultimaConsulta = historico?.[0]?.created_at ?? null
    const diasSemRetorno = ultimaConsulta
      ? Math.floor((Date.now() - new Date(ultimaConsulta).getTime()) / 86_400_000)
      : null

    const contexto = [
      `Paciente: ${pac.nome}`,
      pac.data_nascimento
        ? `Idade: ${Math.floor((Date.now() - new Date(pac.data_nascimento).getTime()) / (365.25 * 86_400_000))} anos`
        : null,
      pac.peso      ? `Peso: ${pac.peso} kg`     : null,
      pac.altura    ? `Altura: ${pac.altura} cm`  : null,
      pac.protocolo_ativo ? `Protocolo: ${pac.protocolo_ativo}` : null,
      pac.medicamentos?.length
        ? `Medicamentos: ${pac.medicamentos.join(", ")}`
        : null,
      diasSemRetorno !== null
        ? `Última consulta: há ${diasSemRetorno} dias (${historico?.length ?? 0} consultas registradas)`
        : "Sem consultas registradas",
      exames?.length
        ? `Exames recentes:\n${exames.map(e => `- ${e.nome}: ${e.valor}${e.unidade ? ` ${e.unidade}` : ""} (${(e.data_coleta ?? e.criado_em ?? "").split("T")[0]})`).join("\n")}`
        : "Sem exames registrados",
    ].filter(Boolean).join("\n")

    const resp = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: 800,
      system:     "Você é um assistente clínico especialista em Endocrinologia e Medicina Preventiva. Analise os dados do paciente e gere alertas clínicos proativos. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role:    "user",
        content: `Analise os dados abaixo e gere de 1 a 3 alertas clínicos proativos e úteis para o médico. Foque em: retorno atrasado, exames desatualizados, mudanças de peso relevantes, medicamentos que podem precisar de revisão, ou qualquer risco clínico identificável.

${contexto}

Retorne JSON:
{
  "alertas": [
    {
      "tipo": "retorno|exame|peso|medicamento|protocolo|outro",
      "titulo": "Título curto e direto (máx 60 chars)",
      "descricao": "Explicação clínica objetiva com a ação recomendada (máx 120 chars)",
      "urgencia": "alta|media|baixa"
    }
  ]
}

Regras:
- Apenas gere alertas quando houver evidência real nos dados
- Se os dados forem insuficientes para gerar alertas relevantes, retorne array vazio
- Nunca invente dados ou assuma informações não fornecidas
- Tom: clínico, direto, acionável`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
    const s = clean.indexOf("{"); const e = clean.lastIndexOf("}")
    if (s === -1 || e === -1) return NextResponse.json({ alertas: [] })

    const parsed = parseAIJson(clean.slice(s, e + 1)) as { alertas?: Alerta[] }
    return NextResponse.json({ alertas: parsed.alertas ?? [] })
  } catch (e) {
    captureAnthropicError(e, "/api/pacientes/[id]/alertas-ia")
    console.error("[alertas-ia]", errMsg(e))
    return NextResponse.json({ alertas: [] })
  }
}
