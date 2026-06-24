import { NextResponse } from "next/server"
import { getAgenda, getPacientes } from "@/lib/medx"

// Endpoint temporário para inspecionar o shape do JSON do MedX.
// Não grava nada, não envia mensagens — só leitura.
export async function GET() {
  const fim   = new Date().toISOString().split("T")[0]
  const start = new Date()
  start.setFullYear(start.getFullYear() - 1)
  const inicio = start.toISOString().split("T")[0]

  const result: Record<string, unknown> = {
    intervalo: { inicio, fim },
  }

  // 1. Agenda: primeiros 3 registros + todas as chaves do 1º
  try {
    const agenda = await getAgenda(inicio, fim)
    result.agenda_total  = agenda.length
    result.agenda_sample = agenda.slice(0, 3)
    result.agenda_keys   = agenda[0] ? Object.keys(agenda[0]) : []
  } catch (e) {
    result.agenda_error = String(e)
  }

  // 2. Pacientes: primeiros 2 registros + todas as chaves do 1º
  try {
    const pacientes = await getPacientes()
    result.pacientes_total  = pacientes.length
    result.pacientes_sample = pacientes.slice(0, 2)
    result.pacientes_keys   = pacientes[0] ? Object.keys(pacientes[0]) : []
  } catch (e) {
    result.pacientes_error = String(e)
  }

  return NextResponse.json(result, { status: 200 })
}
