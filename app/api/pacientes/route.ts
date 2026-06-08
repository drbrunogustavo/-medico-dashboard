import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getPacientes, getPacienteById, buscarPaciente, inserirContato, inserirProntuario } from "@/lib/medx"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "list"

  try {
    switch (action) {
      case "list":
        return NextResponse.json(await getPacientes())
      case "get": {
        const id = searchParams.get("id") ?? ""
        return NextResponse.json(await getPacienteById(id))
      }
      case "search": {
        const nome = searchParams.get("nome") ?? ""
        return NextResponse.json(await buscarPaciente(nome))
      }
      default:
        return NextResponse.json({ error: "Action inválida" }, { status: 400 })
    }
  } catch (e) {
    console.error("[api/pacientes]", e)
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
    if (action === "prontuario") {
      const { historico, idCliente } = body as { historico: string; idCliente: string }
      return NextResponse.json(await inserirProntuario(historico, idCliente))
    }
    return NextResponse.json(await inserirContato(body))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
