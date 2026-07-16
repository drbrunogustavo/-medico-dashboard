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

export async function GET(_req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("regua_relacionamento")
      .select("*")
      .eq("user_id", auth.userId)
      .order("agendado_para", { ascending: true })
    if (error) throw new Error(error.message)
    return NextResponse.json(data ?? [])
  } catch (e) {
    captureAnthropicError(e, "/api/regua")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

// POST: cadastra paciente na régua e gera mensagens com IA
export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const ai = getAnthropicClient()
  const body = await req.json() as {
    paciente_nome:      string
    paciente_telefone:  string
    data_nascimento?:   string
    data_ultima_consulta?: string
    protocolo_ativo?:   string
  }

  if (!body.paciente_nome?.trim() || !body.paciente_telefone?.trim()) {
    return NextResponse.json({ error: "nome e telefone obrigatórios" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServerClient()

    const resp = await ai.messages.create({
      model:      AI_MODEL,
      max_tokens: 2000,
      messages: [{
        role: "user",
        content:
`Você é assistente de o médico usuário.
Crie mensagens de WhatsApp para régua de relacionamento do paciente. Curtas, pessoais, sem markdown.

Paciente: ${body.paciente_nome}
Protocolo: ${body.protocolo_ativo ?? "não informado"}
Data nascimento: ${body.data_nascimento ?? "não informada"}

Retorne APENAS JSON com exatamente estas chaves:
{
  "aniversario": "mensagem de parabéns personalizada, mencione saúde e protocolo",
  "retorno_30": "lembrete gentil de retorno, mencione a importância do acompanhamento",
  "dica_15": "dica de saúde personalizada para o protocolo do paciente",
  "dica_30": "outra dica de saúde/motivacional relacionada ao protocolo",
  "hidratacao_1": "lembrete divertido e motivacional para se hidratar",
  "hidratacao_2": "outro lembrete de hidratação, diferente do primeiro",
  "sono_1": "mensagem de boas noites com dica de sono",
  "sono_2": "outra mensagem de boas noites com dica diferente"
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json/g, "").replace(/```/g, "").trim()
    const s = clean.indexOf("{"); const e = clean.lastIndexOf("}")
    if (s === -1) throw new Error("JSON inválido")
    const msgs = parseAIJson(clean.slice(s, e + 1)) as Record<string, string>

    const now = new Date()
    const addDays = (d: number) => { const dt = new Date(now); dt.setDate(dt.getDate() + d); return dt.toISOString() }

    const rows: {
      user_id: string; paciente_nome: string; paciente_telefone: string
      tipo: string; mensagem: string; status: string; pausado: boolean; agendado_para: string
    }[] = []

    const base = { user_id: auth.userId, paciente_nome: body.paciente_nome, paciente_telefone: body.paciente_telefone, status: "pendente", pausado: false }

    // Birthday: next occurrence
    if (body.data_nascimento) {
      const [, mm, dd] = body.data_nascimento.split("-")
      const birthday = new Date(now.getFullYear(), parseInt(mm, 10) - 1, parseInt(dd, 10))
      if (birthday <= now) birthday.setFullYear(birthday.getFullYear() + 1)
      rows.push({ ...base, tipo: "aniversario", mensagem: msgs.aniversario ?? "", agendado_para: birthday.toISOString() })
    }

    // Return reminder: 30 days from last consultation
    const retornoBase = body.data_ultima_consulta ? new Date(body.data_ultima_consulta) : now
    retornoBase.setDate(retornoBase.getDate() + 30)
    rows.push({ ...base, tipo: "retorno", mensagem: msgs.retorno_30 ?? "", agendado_para: retornoBase.toISOString() })

    // Tips
    rows.push({ ...base, tipo: "dica_protocolo", mensagem: msgs.dica_15 ?? "", agendado_para: addDays(15) })
    rows.push({ ...base, tipo: "dica_protocolo", mensagem: msgs.dica_30 ?? "", agendado_para: addDays(30) })

    // Hydration (weekly)
    rows.push({ ...base, tipo: "hidratacao", mensagem: msgs.hidratacao_1 ?? "", agendado_para: addDays(7)  })
    rows.push({ ...base, tipo: "hidratacao", mensagem: msgs.hidratacao_2 ?? "", agendado_para: addDays(14) })

    // Sleep
    rows.push({ ...base, tipo: "sono", mensagem: msgs.sono_1 ?? "", agendado_para: addDays(3) })
    rows.push({ ...base, tipo: "sono", mensagem: msgs.sono_2 ?? "", agendado_para: addDays(10) })

    const { error: insertErr } = await supabase.from("regua_relacionamento").insert(rows)
    if (insertErr) throw new Error(insertErr.message)

    return NextResponse.json({ ok: true, count: rows.length })
  } catch (e) {
    captureAnthropicError(e, "/api/regua")
    console.error("[regua/post]", e)
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

// PATCH: atualizar status ou pausar
export async function PATCH(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id, ...updates } = await req.json() as { id: string; [k: string]: unknown }
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("regua_relacionamento")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    captureAnthropicError(e, "/api/regua")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

// DELETE: remove patient from régua
export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const nome = req.nextUrl.searchParams.get("paciente_nome")
  if (!nome) return NextResponse.json({ error: "paciente_nome obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from("regua_relacionamento")
      .delete()
      .eq("user_id", auth.userId)
      .eq("paciente_nome", nome)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    captureAnthropicError(e, "/api/regua")
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
