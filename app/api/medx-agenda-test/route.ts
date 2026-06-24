import { NextResponse } from "next/server"
import { getAgenda, getStatusAgenda } from "@/lib/medx"

// Endpoint temporário de inspeção/diagnóstico. Somente leitura — sem gravar nada.
export async function GET() {
  const hoje  = new Date().toISOString().split("T")[0]

  // Janela principal: 12 meses (shape + distribuição de status)
  const inicio12m = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0] })()

  // Janela ampla: 2 anos (necessária para capturar pacientes inativos há 6-24 meses)
  const inicio2a  = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d.toISOString().split("T")[0] })()

  // Corte de inatividade: 6 meses atrás
  const corte6m   = (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().split("T")[0] })()

  const result: Record<string, unknown> = {
    datas: { hoje, inicio12m, inicio2a, corte6m },
  }

  // ── 1. Tabela de status (GetStatusNomeAgenda) ────────────────────────────────
  // Segunda tentativa — primeira falhou com "fetch failed" (possível timeout).
  try {
    const statusList = await getStatusAgenda()
    result.status_tabela         = statusList
    result.status_tabela_chaves  = statusList[0] ? Object.keys(statusList[0]) : []
  } catch (e) {
    result.status_tabela_erro = String(e)
    result.status_tabela_nota = "GetStatusNomeAgenda voltou a falhar. Verifique se o endpoint existe no MedX desta clínica."
  }

  // ── 2. Shape da agenda (12 meses) ───────────────────────────────────────────
  try {
    const agenda12m = await getAgenda(inicio12m, hoje)
    result.agenda_12m_total        = agenda12m.length
    result.agenda_12m_chaves       = agenda12m[0] ? Object.keys(agenda12m[0]) : []
    result.agenda_12m_sample       = agenda12m.slice(0, 5)

    // Distribuição de valores de Status
    const dist: Record<string, number> = {}
    for (const a of agenda12m) {
      const k = String(a.Status ?? "null")
      dist[k] = (dist[k] ?? 0) + 1
    }
    result.agenda_12m_status_dist = dist

    // Exemplos com Atendido_as preenchido (confirma semântica do campo)
    result.agenda_atendido_nao_nulo = agenda12m
      .filter((a) => a.Atendido_as != null)
      .slice(0, 5)
      .map((a) => ({ Id_Paciente: a.Id_Paciente, Status: a.Status, Inicio: a.Inicio, Atendido_as: a.Atendido_as }))
  } catch (e) {
    result.agenda_12m_erro = String(e)
  }

  // ── 3. Contagem de inativos (janela 2 anos, Status=11) ───────────────────────
  // ⚠️  AVISO: Status=11 usado como proxy de "consulta realizada" com base em
  //    correlação: todos os registros com Atendido_as preenchido tinham Status=11.
  //    NÃO confirmado via GetStatusNomeAgenda (endpoint falhou).
  //    Contagem pode estar incorreta se Status=11 não significar "Atendido".
  try {
    const agenda2a = await getAgenda(inicio2a, hoje)

    // Filtra apenas status=11 com Id_Paciente válido (exclui status=0 = bloqueio de agenda)
    const atendidas = agenda2a.filter(
      (a) => a.Status === 11 && a.Id_Paciente != null && a.Id_Paciente !== 0
    )

    // Última consulta realizada por paciente
    const ultimaConsulta: Record<string, string> = {}
    for (const a of atendidas) {
      const pid = String(a.Id_Paciente)
      if (!ultimaConsulta[pid] || String(a.Inicio) > ultimaConsulta[pid]) {
        ultimaConsulta[pid] = String(a.Inicio)
      }
    }

    const totalComAtendimento = Object.keys(ultimaConsulta).length
    const inativos = Object.entries(ultimaConsulta).filter(([, data]) => data < corte6m)

    // Distribuição de quando foi a última consulta dos inativos (em meses)
    const distMeses: Record<string, number> = { "6-9m": 0, "9-12m": 0, "12-18m": 0, "18m+": 0 }
    const d9m  = (() => { const d = new Date(); d.setMonth(d.getMonth() - 9);  return d.toISOString().split("T")[0] })()
    const d12m = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0] })()
    const d18m = (() => { const d = new Date(); d.setMonth(d.getMonth() - 18); return d.toISOString().split("T")[0] })()
    for (const [, data] of inativos) {
      if (data >= d9m)       distMeses["6-9m"]++
      else if (data >= d12m) distMeses["9-12m"]++
      else if (data >= d18m) distMeses["12-18m"]++
      else                   distMeses["18m+"]++
    }

    result.contagem_inativos = {
      aviso:                        "⚠️  Status=11 = proxy não confirmado. Correlação: Atendido_as sempre preenchido quando Status=11. GetStatusNomeAgenda falhou — confirme o nome oficial do status antes de usar em produção.",
      janela_usada:                 `${inicio2a} → ${hoje} (2 anos)`,
      corte_inatividade:            corte6m,
      total_agenda_2a:              agenda2a.length,
      total_atendimentos_status11:  atendidas.length,
      total_pacientes_com_atend:    totalComAtendimento,
      total_inativos_6m_mais:       inativos.length,
      distribuicao_por_tempo:       distMeses,
    }
  } catch (e) {
    result.contagem_inativos_erro = String(e)
  }

  return NextResponse.json(result, { status: 200 })
}
