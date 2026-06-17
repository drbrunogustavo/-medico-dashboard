import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

interface PacienteInput {
  nome?: string
  telefone?: string
  email?: string
  data_nascimento?: string
  cpf?: string
  endereco?: string
  observacao?: string
}

function normalizePhone(v: string): string {
  return v.replace(/\D/g, "").replace(/^55/, "").replace(/^0/, "")
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { pacientes: PacienteInput[]; addCrm?: boolean }
  const { pacientes, addCrm = false } = body

  if (!Array.isArray(pacientes) || pacientes.length === 0) {
    return NextResponse.json({ error: "Nenhum paciente enviado" }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  const importadoEm = new Date().toISOString()

  let importados = 0
  const erros: Array<{ linha: number; msg: string }> = []

  // Process in batches of 50 to avoid timeouts
  const BATCH = 50
  for (let batchStart = 0; batchStart < pacientes.length; batchStart += BATCH) {
    const slice = pacientes.slice(batchStart, batchStart + BATCH)

    const rows = slice.map((p, sliceIdx) => {
      const linhaOriginal = batchStart + sliceIdx + 2 // +2: header + 1-indexed

      const nome = (p.nome ?? "").trim()
      if (!nome) {
        erros.push({ linha: linhaOriginal, msg: "Nome obrigatório" })
        return null
      }

      const telefone = p.telefone ? normalizePhone(p.telefone) : null
      const email    = p.email?.trim()    || null
      const cpf      = p.cpf?.trim()      || null
      const endereco = p.endereco?.trim() || null

      let obs = (p.observacao ?? "").trim() || null
      if (cpf)     obs = obs ? `CPF: ${cpf} | ${obs}` : `CPF: ${cpf}`
      if (endereco) obs = obs ? `Endereço: ${endereco} | ${obs}` : `Endereço: ${endereco}`

      return {
        user_id:         auth.userId,
        nome,
        telefone:        telefone || null,
        email,
        data_nascimento: p.data_nascimento?.trim() || null,
        observacao:      obs,
        importado_de:    "importacao_csv",
        importado_em:    importadoEm,
      }
    }).filter(Boolean)

    if (!rows.length) continue

    // Upsert: match on (user_id, nome) to avoid obvious duplicates
    const { data: inserted, error } = await supabase
      .from("pacientes_local")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(rows as any[], { onConflict: "user_id,nome", ignoreDuplicates: false })
      .select("id, nome")

    if (error) {
      // Fallback: insert individually and collect per-row errors
      for (const row of rows) {
        if (!row) continue
        const { error: rowErr } = await supabase.from("pacientes_local").insert(row)
        if (rowErr) {
          erros.push({ linha: batchStart + rows.indexOf(row) + 2, msg: rowErr.message })
        } else {
          importados++
        }
      }
      continue
    }

    importados += (inserted ?? rows).length

    // Optionally add to CRM as leads
    if (addCrm && inserted && inserted.length > 0) {
      const leads = (inserted as Array<{ id: string; nome: string }>).map(p => ({
        user_id:    auth.userId,
        nome:       p.nome,
        paciente_id: p.id,
        estagio:    "paciente_ativo",
        origem:     "importacao",
      }))
      // Best-effort — ignore errors
      await supabase.from("leads").upsert(leads, { onConflict: "user_id,paciente_id", ignoreDuplicates: true })
    }
  }

  return NextResponse.json({ importados, erros })
}
