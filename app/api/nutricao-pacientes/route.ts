import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


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

const ASSINATURA = `Nossa equipe médica
Endocrinologia & Nutrologia
PRAXIS Clínica`


export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "gerar"

  try {
    const body = await req.json() as {
      nomePaciente:    string
      idPacienteMedx?: string
      tipoTrilha:      "pre_consulta" | "pos_consulta"
      contexto?:       string
      linkAnamnese?:   string
      trilha?:         unknown
    }

    // ── Atualizar status ────────────────────────────────────────────────────
    if (action === "status") {
      const { id, status } = body as unknown as { id: string; status: string }
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("nutricao_pacientes_trilhas")
        .update({ status })
        .eq("id", id)
        .eq("user_id", auth.userId)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // ── Salvar trilha no Supabase ────────────────────────────────────────────
    if (action === "salvar") {
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("nutricao_pacientes_trilhas")
        .insert({
          id_paciente_medx: body.idPacienteMedx ?? null,
          nome_paciente:    body.nomePaciente,
          tipo_trilha:      body.tipoTrilha,
          mensagens:        body.trilha,
          status:           "ativa",
          user_id:          auth.userId,
        })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // ── Gerar mensagens com Claude ───────────────────────────────────────────
    const isPre = body.tipoTrilha === "pre_consulta"
    const linkAnamnese = body.linkAnamnese?.trim() || "[link gerado pelo MedX]"

    const trilhaSpec = isPre
      ? `TRILHA PRÉ-CONSULTA para ${body.nomePaciente}:

D-1 (dia anterior à consulta):
- Enviar o pedido de exames com assinatura digital: "Em breve você receberá seu pedido de exames com assinatura digital. Por favor, envie os resultados em PDF por este mesmo WhatsApp ou anexe diretamente na plataforma antes da consulta."
- Link de anamnese pré-consulta: "Preencha sua anamnese antes da consulta: ${linkAnamnese}"
- Orientações para bioimpedância: hidratação, não praticar exercícios no dia, não fazer refeição pesada nas 4h anteriores, não usar cremes hidratantes.

D-0 (manhã do dia da consulta):
- Horário da consulta, localização do consultório e pedido para chegar 15 minutos antes
- Lembrete das orientações de bioimpedância`
      : `TRILHA PÓS-CONSULTA para ${body.nomePaciente}:

H+2 (2 horas após a consulta):
- Mensagem empática de boas-vindas ao tratamento
- Link para avaliação Google Review: peça gentilmente que deixe uma avaliação

D+1 (dia seguinte):
- Reforço empático das 3 orientações principais da consulta
- Incentivo à adesão ao tratamento

D+15 (15 dias após a consulta):
- Check-in de adesão ao tratamento — como está se sentindo?
- Reforço motivacional

D-15 (15 dias antes do retorno):
- Lembrete para refazer os exames de controle com antecedência
- Instruções de preparo se necessário`

    const contexto = body.contexto ? `\nContexto clínico: ${body.contexto}` : ""

    const resp = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: 3000,
      messages: [{
        role:    "user",
        content: `Você é o assistente de comunicação clínica do médico usuário.

Crie as mensagens de WhatsApp para a seguinte trilha:

${trilhaSpec}${contexto}

INSTRUÇÕES OBRIGATÓRIAS:
- Tom: empático, profissional, humano. Use o primeiro nome do paciente.
- Não seja genérico. Personalize ao máximo.
- Cada mensagem deve terminar com a seguinte assinatura (exatamente como está):

${ASSINATURA}

- Para a trilha pré-consulta, inclua os links e instruções exatamente como especificado.
- Para a trilha pós-consulta D+1, mencione orientações gerais de Endocrinologia/Nutrologia.

Retorne JSON: [{"timing": "D-1", "titulo": "Título curto", "texto": "Mensagem completa de WhatsApp com a assinatura ao final"}]
Retorne APENAS o JSON array, sem markdown.`,
      }],
    })

    const raw  = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "[]"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx   = clean.indexOf("[")
    const msgs  = parseAIJson(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json({ mensagens: msgs })
  } catch (e) {
    console.error("[api/nutricao-pacientes]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("nutricao_pacientes_trilhas")
      .select("*")
      .eq("user_id", auth.userId)
      .order("criado_em", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
