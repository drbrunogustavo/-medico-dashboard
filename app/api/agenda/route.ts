import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import {
  getAgenda, getAgendaByUsuario, getDisponibilidade,
  getUsuariosAgenda, getStatusAgenda, inserirAgendamento, atualizarAgendamento,
} from "@/lib/medx"

// ── MedX → camelCase normalization ────────────────────────────────────────────
// O MedX devolve campos PascalCase/underscore (Inicio, Descricao, Status numérico,
// Id_Agendamento, …). O frontend espera camelCase. Traduzimos aqui, num ponto só.

const STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Confirmado",
  3: "Aguardando",
  4: "Em atendimento",
  5: "Atendido",
  6: "Cancelado",
  7: "Falta",
  8: "Remarcado",
}

function normalizeMedXAppointment(a: Record<string, unknown>) {
  const descricao    = String(a.Descricao ?? "")
  const nomePaciente = descricao.split(",")[0].trim()
  const inicio       = String(a.Inicio ?? "")
  const statusNum    = Number(a.Status ?? 0)

  return {
    idAgendamento:    String(a.Id_Agendamento ?? ""),
    idContato:        String(a.Id_Paciente ?? ""),
    data:             inicio.split("T")[0] ?? "",
    dataAgendamento:  inicio.split("T")[0] ?? "",
    hora:             inicio.split("T")[1]?.slice(0, 5) ?? "",
    horaInicio:       inicio.split("T")[1]?.slice(0, 5) ?? "",
    horaFim:          String(a.Fim ?? "").split("T")[1]?.slice(0, 5) ?? "",
    paciente:         nomePaciente,
    nomePaciente:     nomePaciente,
    nomeContato:      nomePaciente,
    nomeStatus:       STATUS_MAP[statusNum] ?? String(statusNum),
    status:           STATUS_MAP[statusNum] ?? String(statusNum),
    procedimento:     String(a.TipoAgendamento ?? ""),
    nomeProcedimento: String(a.TipoAgendamento ?? ""),
    setor:            String(a.Setor ?? ""),
    descricao:        descricao,
    _raw:             a,
  }
}

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
        const raw    = await getAgenda(inicio, fim)
        const normalized = Array.isArray(raw) ? raw.map(normalizeMedXAppointment) : []
        return NextResponse.json(normalized)
      }
      case "agenda-usuario": {
        const inicio    = searchParams.get("inicio")    ?? ""
        const fim       = searchParams.get("fim")       ?? ""
        const idUsuario = searchParams.get("idUsuario") ?? ""
        const raw       = await getAgendaByUsuario(inicio, fim, idUsuario)
        const normalized = Array.isArray(raw) ? raw.map(normalizeMedXAppointment) : []
        return NextResponse.json(normalized)
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
