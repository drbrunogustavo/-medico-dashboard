import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import {
  getAgenda, getAgendaByUsuario, getDisponibilidade,
  getUsuariosAgenda, getStatusAgenda, inserirAgendamento, atualizarAgendamento,
} from "@/lib/medx"

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "agenda"

  try {
    switch (action) {
      case "agenda": {
        const inicio = searchParams.get("inicio") ?? ""
        const fim    = searchParams.get("fim")    ?? ""
        const data   = await getAgenda(inicio, fim)
        return NextResponse.json(data)
      }
      case "agenda-usuario": {
        const inicio    = searchParams.get("inicio")    ?? ""
        const fim       = searchParams.get("fim")       ?? ""
        const idUsuario = searchParams.get("idUsuario") ?? ""
        const data      = await getAgendaByUsuario(inicio, fim, idUsuario)
        return NextResponse.json(data)
      }
      case "disponibilidade": {
        const dti      = searchParams.get("dti")      ?? ""
        const dtf      = searchParams.get("dtf")      ?? ""
        const proId    = searchParams.get("proId")    ?? ""
        const intervalo= searchParams.get("intervalo")?? "30"
        const data     = await getDisponibilidade(dti, dtf, proId, intervalo)
        return NextResponse.json(data)
      }
      case "usuarios":
        return NextResponse.json(await getUsuariosAgenda())
      case "status":
        return NextResponse.json(await getStatusAgenda())
      default:
        return NextResponse.json({ error: "Action inválida" }, { status: 400 })
    }
  } catch (e) {
    console.error("[api/agenda]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  try {
    const body = await req.json()
    const data = await inserirAgendamento(body)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  try {
    const body = await req.json()
    const data = await atualizarAgendamento(body)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
