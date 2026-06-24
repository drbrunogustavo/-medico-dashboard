import { NextResponse } from "next/server"
import { getAgenda, getPacientes, getStatusAgenda } from "@/lib/medx"

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

  // 1. Status codes → nomes (tradução dos códigos de Status da agenda)
  try {
    const statusList = await getStatusAgenda()
    result.status_tabela = statusList   // ex: [{Id: 1, Nome: "Agendado"}, ...]
  } catch (e) {
    result.status_error = String(e)
  }

  // 2. Agenda: primeiros 5 registros + todas as chaves
  //    Campos de interesse: Status, Atendido_as, Id_Paciente, Inicio, Fim
  try {
    const agenda = await getAgenda(inicio, fim)
    result.agenda_total  = agenda.length
    result.agenda_sample = agenda.slice(0, 5)
    result.agenda_keys   = agenda[0] ? Object.keys(agenda[0]) : []
    // Extrai amostra de Atendido_as não-nulo para confirmar se o campo é preenchido em consultas realizadas
    result.agenda_atendido_nao_nulo = agenda.filter((a) => a.Atendido_as != null).slice(0, 3)
    // Distribuição dos valores de Status na janela de 12 meses
    const dist: Record<string, number> = {}
    for (const a of agenda) {
      const k = String(a.Status ?? "null")
      dist[k] = (dist[k] ?? 0) + 1
    }
    result.agenda_status_distribuicao = dist
  } catch (e) {
    result.agenda_error = String(e)
  }

  // 3. Pacientes: primeiros 3 registros + todas as chaves
  //    Campo de interesse: Id_do_Cliente (chave de cruzamento com Id_Paciente da agenda)
  try {
    const pacientes = await getPacientes()
    result.pacientes_total  = pacientes.length
    result.pacientes_sample = pacientes.slice(0, 3)
    result.pacientes_keys   = pacientes[0] ? Object.keys(pacientes[0]) : []
  } catch (e) {
    result.pacientes_error = String(e)
  }

  return NextResponse.json(result, { status: 200 })
}
