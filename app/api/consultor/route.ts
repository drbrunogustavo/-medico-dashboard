import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

const SYSTEM = `Você é o Consultor Estratégico do PRAXIS, especializado em gestão, marketing e escalabilidade de clínicas médicas no Brasil. Você conhece profundamente o mercado médico brasileiro, estratégias de precificação, marketing digital para médicos, gestão financeira de clínicas e estratégias de crescimento. Analise os dados da clínica fornecidos e dê direcionamentos específicos, práticos e acionáveis. Nunca dê respostas genéricas. Sempre baseie suas análises nos dados reais da clínica. Responda em português brasileiro.`

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      messages:  { role: "user" | "assistant"; content: string }[]
      contexto?: {
        especialidade?:   string
        cidade?:          string
        ticket_medio?:    number
        leads_total?:     number
        nps_score?:       number | null
        faturamento_mes?: number
        posicionamento?:  string
      }
    }

    const ctx   = body.contexto ?? {}
    const ctxTxt = [
      ctx.especialidade  && `Especialidade: ${ctx.especialidade}`,
      ctx.cidade         && `Cidade: ${ctx.cidade}`,
      ctx.ticket_medio   && `Ticket médio atual: R$ ${ctx.ticket_medio.toLocaleString("pt-BR")}`,
      ctx.leads_total    !== undefined && `Leads no CRM: ${ctx.leads_total}`,
      ctx.nps_score      !== null && ctx.nps_score !== undefined && `Score NPS: ${ctx.nps_score}`,
      ctx.faturamento_mes && `Faturamento último mês: R$ ${ctx.faturamento_mes.toLocaleString("pt-BR")}`,
      ctx.posicionamento && `Posicionamento salvo: ${JSON.stringify(ctx.posicionamento)}`,
    ].filter(Boolean).join("\n")

    // Inject protocolos + historico recente from memoria
    let memoriaExtra = ""
    try {
      const supabase = createSupabaseServerClient()
      const [{ data: protocolos }, { data: historico }] = await Promise.all([
        supabase.from("memoria_clinica").select("titulo,conteudo").eq("user_id", auth.userId).eq("tipo", "protocolo").eq("favorito", true).limit(3),
        supabase.from("copiloto_historico").select("tipo_consulta,created_at").eq("user_id", auth.userId).order("created_at", { ascending: false }).limit(5),
      ])
      if (protocolos?.length) memoriaExtra += "\n\nPROTOCOLOS FAVORITOS:\n" + protocolos.map(d => `• ${d.titulo}: ${d.conteudo.slice(0, 200)}`).join("\n")
      if (historico?.length) memoriaExtra += "\n\nÚLTIMAS CONSULTAS:\n" + historico.map(h => `• ${h.tipo_consulta ?? "Consulta"} (${new Date(h.created_at).toLocaleDateString("pt-BR")})`).join("\n")
    } catch { /* silent */ }

    const systemFull = ctxTxt
      ? `${SYSTEM}\n\nDADOS DA CLÍNICA DO USUÁRIO:\n${ctxTxt}${memoriaExtra}`
      : SYSTEM + memoriaExtra

    const stream = await ai.messages.stream({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system:     systemFull,
      messages:   body.messages,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    // Save to history async (non-blocking)
    stream.finalMessage().then(async final => {
      try {
        const supabase = createSupabaseServerClient()
        const lastUser = body.messages[body.messages.length - 1]
        const answer   = (final.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
        await supabase.from("consultor_historico").insert([
          { user_id: auth.userId, role: "user",      content: lastUser.content },
          { user_id: auth.userId, role: "assistant", content: answer },
        ])
      } catch {
        // Non-critical
      }
    }).catch(() => {})

    return new NextResponse(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (e) {
    console.error("[api/consultor]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
