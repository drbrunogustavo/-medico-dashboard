import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import {
  getPacientes,
  getPacienteById,
  buscarPaciente,
  inserirContato,
  inserirProntuario,
} from "@/lib/medx"

const medxConfigured = () =>
  !!(process.env.MEDX_URL && process.env.MEDX_INTEGRATION_TOKEN)

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "list"

  try {
    if (medxConfigured()) {
      switch (action) {
        case "list":
          return NextResponse.json(await getPacientes())
        case "get": {
          const id = searchParams.get("id") ?? ""
          if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
          return NextResponse.json(await getPacienteById(id))
        }
        case "search": {
          const nome = searchParams.get("nome") ?? searchParams.get("q") ?? ""
          if (!nome.trim()) return NextResponse.json([])
          return NextResponse.json(await buscarPaciente(nome))
        }
        default:
          return NextResponse.json({ error: "Action inválida" }, { status: 400 })
      }
    }

    // Fallback: Supabase pacientes_local
    const supabase = createSupabaseServiceClient()

    switch (action) {
      case "list": {
        const { data, error } = await supabase
          .from("pacientes_local")
          .select("*")
          .eq("user_id", auth.userId)
          .order("created_at", { ascending: false })
        if (error) throw new Error(error.message)
        return NextResponse.json((data ?? []).map(p => ({ ...p, _fonte: "local" })))
      }

      case "get": {
        const id = searchParams.get("id") ?? ""
        if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })
        const { data, error } = await supabase
          .from("pacientes_local")
          .select("*")
          .eq("id", id)
          .eq("user_id", auth.userId)
          .single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ ...data, _fonte: "local" })
      }

      case "search": {
        const q = searchParams.get("nome") ?? searchParams.get("q") ?? ""
        if (!q.trim()) return NextResponse.json([])
        const { data, error } = await supabase
          .from("pacientes_local")
          .select("*")
          .eq("user_id", auth.userId)
          .ilike("nome", `%${q}%`)
          .limit(20)
        if (error) throw new Error(error.message)
        return NextResponse.json((data ?? []).map(p => ({ ...p, _fonte: "local" })))
      }

      default:
        return NextResponse.json({ error: "Action inválida" }, { status: 400 })
    }
  } catch (e) {
    console.error("[api/pacientes GET]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "contato"

  try {
    const body = await req.json()

    if (medxConfigured()) {
      switch (action) {
        case "contato":
          return NextResponse.json(await inserirContato(body))
        case "prontuario": {
          const { historico, idCliente } = body as { historico: string; idCliente: string }
          if (!historico || !idCliente)
            return NextResponse.json({ error: "historico e idCliente obrigatórios" }, { status: 400 })
          return NextResponse.json(await inserirProntuario(historico, idCliente))
        }
        default:
          return NextResponse.json({ error: "Action inválida" }, { status: 400 })
      }
    }

    // Fallback: Supabase pacientes_local
    const supabase = createSupabaseServiceClient()

    switch (action) {
      case "contato":
      case "local": {
        const { data, error } = await supabase
          .from("pacientes_local")
          .insert({
            user_id:         auth.userId,
            nome:            body.Nome  ?? body.nome  ?? "",
            telefone:        body.Telefone ?? body.telefone ?? "",
            email:           body.Email ?? body.email ?? "",
            data_nascimento: body.DataNascimento ?? body.dataNascimento ?? null,
            observacao:      body.Observacao ?? body.observacao ?? "",
          })
          .select()
          .single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ ...data, _fonte: "local" })
      }

      case "prontuario": {
        const { historico, idCliente } = body as { historico: string; idCliente: string }
        if (!historico || !idCliente)
          return NextResponse.json({ error: "historico e idCliente obrigatórios" }, { status: 400 })
        const { data, error } = await supabase
          .from("pacientes_local")
          .update({ observacao: historico })
          .eq("id", idCliente)
          .eq("user_id", auth.userId)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ ...data, _fonte: "local" })
      }

      default:
        return NextResponse.json({ error: "Action inválida" }, { status: 400 })
    }
  } catch (e) {
    console.error("[api/pacientes POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const id = searchParams.get("id") ?? ""
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 })

  try {
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase
      .from("pacientes_local")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/pacientes DELETE]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
