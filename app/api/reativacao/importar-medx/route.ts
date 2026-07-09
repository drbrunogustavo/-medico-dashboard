import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { getMedxClientForUser } from "@/lib/medx"

// ⚠️  Status=11 usado como proxy de "consulta realizada".
//    Correlação: todos os registros com Atendido_as preenchido tinham Status=11.
//    GetStatusNomeAgenda falhou nas chamadas de teste — confirme o nome oficial
//    do status no painel do MedX antes de confiar 100% nessa lógica.

export async function POST() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const hoje     = new Date().toISOString().split("T")[0]
    const inicio2a = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d.toISOString().split("T")[0] })()
    const corte6m  = (() => { const d = new Date(); d.setMonth(d.getMonth() - 6);       return d.toISOString().split("T")[0] })()

    // 1. Agenda dos últimos 2 anos
    const medx   = await getMedxClientForUser(auth.userId)
    const agenda = await medx.getAgenda(inicio2a, hoje)

    // 2. Última consulta realizada (Status=11) por paciente
    const ultimaConsulta: Record<string, string> = {}
    for (const a of agenda) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = a as any
      if (item.Status !== 11 || !item.Id_Paciente || item.Id_Paciente === 0) continue
      const pid = String(item.Id_Paciente)
      const ini = String(item.Inicio ?? "")
      if (ini && (!ultimaConsulta[pid] || ini > ultimaConsulta[pid])) {
        ultimaConsulta[pid] = ini
      }
    }

    // 3. IDs de pacientes inativos há 6+ meses
    const inativoIds = new Set(
      Object.entries(ultimaConsulta)
        .filter(([, data]) => data < corte6m)
        .map(([id]) => id)
    )

    if (inativoIds.size === 0) {
      return NextResponse.json({ importados: 0, sem_telefone: 0, aviso: "Nenhum paciente inativo encontrado na janela de 2 anos." })
    }

    // 4. Dados cadastrais dos pacientes (nome, telefone)
    const pacientes = await medx.getPacientes()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pacienteMap = new Map(pacientes.map((p: any) => [String(p.Id_do_Cliente), p]))

    // 5. Monta linhas para upsert
    let semTelefone = 0
    const rows: Record<string, unknown>[] = []

    for (const medxId of Array.from(inativoIds)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = pacienteMap.get(medxId) as any
      if (!p) continue

      // Celular preferido (DDD incluso, 11 dígitos); fallback para telefones fixos
      const telefone = (p.Celular || p.Telefone_Residencial || p.Telefone_Residencial_1 || "")
        .replace(/\D/g, "")
        .trim()

      if (!telefone) { semTelefone++; continue }

      const sexoRaw = (p.Sexo ?? p.Genero ?? "") as string
      const sexo = sexoRaw
        ? (sexoRaw.trim().toUpperCase().startsWith("F") ? "F" : sexoRaw.trim().toUpperCase().startsWith("M") ? "M" : null)
        : null

      const dataNascRaw = (p.DataNascimento ?? p.Data_Nascimento ?? "") as string
      let dataNasc: string | null = null
      if (dataNascRaw) {
        const d = new Date(dataNascRaw)
        if (!isNaN(d.getTime())) dataNasc = d.toISOString().split("T")[0]
      }

      rows.push({
        user_id:         auth.userId,
        medx_id:         medxId,
        nome:            ((p.Nome_Social || p.Nome) as string ?? "").trim(),
        telefone,
        ultimo_contato:  ultimaConsulta[medxId].split("T")[0],
        status:          "inativo",
        sexo:            sexo,
        data_nascimento: dataNasc,
        // motivo_saida e mensagem_gerada NÃO enviados → preservados em re-importação
      })
    }

    if (rows.length === 0) {
      return NextResponse.json({
        importados:   0,
        sem_telefone: semTelefone,
        aviso:        "Todos os pacientes inativos estão sem telefone cadastrado no MedX.",
      })
    }

    // 6. Upsert: insere novos, atualiza nome/telefone/ultimo_contato nos existentes.
    //    Preserva motivo_saida e mensagem_gerada (não estão no payload).
    //    Requer: UNIQUE INDEX uniq_reativacao_medx ON (user_id, medx_id) WHERE medx_id IS NOT NULL
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase
      .from("pacientes_reativacao")
      .upsert(rows, { onConflict: "user_id,medx_id" })

    if (error) {
      console.error("[importar-medx] upsert:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      importados:   rows.length,
      sem_telefone: semTelefone,
      aviso:        "⚠️ Status=11 = proxy não confirmado via GetStatusNomeAgenda.",
    })
  } catch (e) {
    console.error("[importar-medx]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
