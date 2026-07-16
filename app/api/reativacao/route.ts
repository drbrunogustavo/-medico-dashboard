import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 60

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("pacientes_reativacao")
      .select("*")
      .eq("user_id", auth.userId)
      .order("ultimo_contato", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    captureAnthropicError(e, "/api/reativacao")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()

  try {
    const body = await req.json()

    // Action: gerar mensagem para um paciente
    if (body.action === "gerar_mensagem") {
      const resp = await ai.messages.create({
        model:      AI_MODEL,
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `Crie uma mensagem de reativação personalizada para este paciente inativo.

Paciente: ${body.nome}
Último contato: ${body.ultimo_contato ? new Date(body.ultimo_contato).toLocaleDateString("pt-BR") : "desconhecido"}
Motivo provável de saída: ${body.motivo_saida || "não identificado"}
Médico: Dr(a). ${body.nome_medico || "[seu nome]"}, ${body.especialidade || "[especialidade]"}

Crie uma mensagem curta, empática e personalizada para WhatsApp.
Deve parecer genuína, não de spam. Máximo 3 parágrafos.
Não use emojis excessivos. Retorne apenas o texto da mensagem.`,
        }],
      })
      const texto = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""

      const supabase = createSupabaseServerClient()
      await supabase.from("pacientes_reativacao")
        .update({ mensagem_gerada: texto })
        .eq("id", body.id)
        .eq("user_id", auth.userId)

      return NextResponse.json({ texto })
    }

    // Action: upsert paciente
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("pacientes_reativacao")
      .upsert({ ...body, user_id: auth.userId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    captureAnthropicError(e, "/api/reativacao")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
