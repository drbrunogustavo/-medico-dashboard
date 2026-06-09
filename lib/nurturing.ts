import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@supabase/supabase-js"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Used server-side without cookie context (fire-and-forget from CRM route)
export async function gerarNurturingInline(userId: string, leadId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: lead } = await supabase
    .from("crm_leads")
    .select("nome, origem, observacoes")
    .eq("id", leadId)
    .single()
  if (!lead) return

  const resp = await ai.messages.create({
    model:      "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content:
`Você é assistente de Dr. Bruno Gustavo (Endocrinologista, Nutrologista e especialista em Longevidade).
Crie 4 mensagens WhatsApp para sequência de nurturing. Cada uma CURTA (máx 3 parágrafos), pessoal, sem markdown.

Lead:
- Nome: ${lead.nome}
- Origem: ${lead.origem ?? "não informada"}
- Observações: ${lead.observacoes ?? "—"}

Retorne APENAS JSON:
{
  "dia1": "mensagem boas-vindas pessoal",
  "dia3": "mensagem educativa curta sobre saúde",
  "dia7": "benefício concreto + CTA suave para agendar",
  "dia14": "reativação com urgência suave"
}`,
    }],
  })

  const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
  const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim()
  const s = clean.indexOf("{"); const e = clean.lastIndexOf("}")
  if (s === -1) return
  const msgs = JSON.parse(clean.slice(s, e + 1)) as Record<string, string>

  const now = new Date()
  const rows = ([1, 3, 7, 14] as const).map(dia => {
    const at = new Date(now); at.setDate(at.getDate() + dia)
    return { user_id: userId, lead_id: leadId, dia, mensagem: msgs[`dia${dia}`] ?? "", status: "pendente", agendado_para: at.toISOString() }
  })

  await supabase.from("nurturing_sequencias").insert(rows)
}
