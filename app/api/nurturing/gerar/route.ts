import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
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
export const maxDuration = 60


function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()
  const { lead_id } = await req.json() as { lead_id?: string }
  if (!lead_id) return NextResponse.json({ error: "lead_id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()

    const { data: lead } = await supabase
      .from("crm_leads")
      .select("nome, origem, observacoes")
      .eq("id", lead_id)
      .eq("user_id", auth.userId)
      .single()

    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 1500,
      messages: [{
        role: "user",
        content:
`Você é um assistente de o médico usuário (especialista em Longevidade).
Crie 4 mensagens WhatsApp para sequência de nurturing. Cada uma CURTA (máx 3 parágrafos), pessoal, sem markdown.

Lead:
- Nome: ${lead.nome}
- Origem: ${lead.origem ?? "não informada"}
- Observações: ${lead.observacoes ?? "—"}

Retorne APENAS JSON:
{
  "dia1": "mensagem boas-vindas pessoal — se apresentar, agradecer pelo interesse, dizer que entrará em contato",
  "dia3": "mensagem educativa curta sobre saúde relacionada ao interesse do lead",
  "dia7": "mensagem com benefício concreto de cuidar da saúde + CTA suave para agendar",
  "dia14": "mensagem final de reativação, urgência suave, abertura para conversar"
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim()
    const s = clean.indexOf("{"); const e = clean.lastIndexOf("}")
    if (s === -1) throw new Error("JSON inválido da IA")
    const msgs = parseAIJson(clean.slice(s, e + 1)) as Record<string, string>

    const now = new Date()
    const rows = ([1, 3, 7, 14] as const).map(dia => {
      const at = new Date(now); at.setDate(at.getDate() + dia)
      const key = `dia${dia}` as keyof typeof msgs
      return { user_id: auth.userId, lead_id, dia, mensagem: msgs[key] ?? "", status: "pendente", agendado_para: at.toISOString() }
    })

    const { error } = await supabase.from("nurturing_sequencias").insert(rows)
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (e) {
    captureAnthropicError(e, "/api/nurturing/gerar")
    console.error("[nurturing/gerar]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
