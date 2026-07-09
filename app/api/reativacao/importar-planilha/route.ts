import { NextRequest, NextResponse } from "next/server"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

type FieldKey = "nome" | "telefone" | "ultimo_contato" | "motivo_saida" | "sexo" | "data_nascimento"

const ALIASES: Record<string, FieldKey> = {
  nome: "nome", name: "nome", paciente: "nome", patient: "nome",
  nomepaciente: "nome", nomecliente: "nome", cliente: "nome",
  telefone: "telefone", phone: "telefone", celular: "telefone",
  whatsapp: "telefone", fone: "telefone", tel: "telefone",
  numerowpp: "telefone", contato: "telefone",
  ultimavisita: "ultimo_contato", ultimaconsulta: "ultimo_contato",
  lastvisit: "ultimo_contato", dataconsulta: "ultimo_contato",
  ultimoatendimento: "ultimo_contato", ultimocontato: "ultimo_contato",
  data: "ultimo_contato",
  motivo: "motivo_saida", motivosaida: "motivo_saida", reason: "motivo_saida",
  observacao: "motivo_saida", obs: "motivo_saida", observacoes: "motivo_saida",
  anotacao: "motivo_saida",
  sexo: "sexo", genero: "sexo", gender: "sexo", sex: "sexo",
  datanascimento: "data_nascimento", nascimento: "data_nascimento",
  dtnascimento: "data_nascimento", datadenascimento: "data_nascimento",
  birthday: "data_nascimento", datanasc: "data_nascimento",
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function normalizeTelefone(v: string): string {
  return v.replace(/\D/g, "").replace(/^55/, "").replace(/^0/, "")
}

function parseDate(v: string): string | null {
  if (!v) return null
  const serial = Number(v)
  if (!isNaN(serial) && serial > 1000) {
    return new Date((serial - 25569) * 86400 * 1000).toISOString().split("T")[0]
  }
  const br = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const d = new Date(v)
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0]
  return null
}

interface RowParsed {
  nome?: string
  telefone?: string
  ultimo_contato?: string
  motivo_saida?: string
  sexo?: string
  data_nascimento?: string
}

function normalizeSexo(v: string): string | null {
  const s = v.trim().toUpperCase()
  if (s.startsWith("F")) return "F"
  if (s.startsWith("M")) return "M"
  return null
}

function mapRow(headers: string[], values: string[]): RowParsed {
  const row: RowParsed = {}
  headers.forEach((h, i) => {
    const field = ALIASES[normalizeKey(h)]
    if (!field) return
    const val = (values[i] ?? "").trim()
    if (val) (row as Record<string, string>)[field] = val
  })
  return row
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!["csv", "xlsx", "xls"].includes(ext))
    return NextResponse.json({ error: "Formato não suportado. Use .csv, .xlsx ou .xls" }, { status: 400 })

  let headers: string[] = []
  let rawRows: string[][] = []

  if (ext === "csv") {
    const text = await file.text()
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
    const all = result.data
    if (!all.length)
      return NextResponse.json({ error: "Arquivo CSV vazio" }, { status: 400 })
    headers = all[0].map(String)
    rawRows = all.slice(1) as string[][]
  } else {
    const buf = await file.arrayBuffer()
    const wb  = XLSX.read(buf, { type: "array" })
    const ws  = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" })
    if (!raw.length)
      return NextResponse.json({ error: "Arquivo Excel vazio" }, { status: 400 })
    headers = (raw[0] as string[]).map(String)
    rawRows = raw.slice(1) as string[][]
  }

  const rows = rawRows
    .map(r => mapRow(headers, r.map(String)))
    .filter(p => p.nome?.trim())

  if (!rows.length)
    return NextResponse.json(
      { error: "Nenhuma linha com nome encontrada. Verifique se os cabeçalhos usam: nome, telefone, etc." },
      { status: 400 }
    )

  const supabase = createSupabaseServiceClient()
  let importados = 0, atualizados = 0
  const erros: Array<{ nome: string; msg: string }> = []

  for (const p of rows) {
    const nome     = (p.nome ?? "").trim()
    const telefone = p.telefone ? normalizeTelefone(p.telefone) : ""

    if (!telefone) {
      erros.push({ nome, msg: "Sem telefone — ignorado" })
      continue
    }

    const payload = {
      nome,
      telefone,
      ultimo_contato:  p.ultimo_contato  ? parseDate(p.ultimo_contato)  : null,
      motivo_saida:    p.motivo_saida?.trim()  || null,
      sexo:            p.sexo            ? normalizeSexo(p.sexo)        : null,
      data_nascimento: p.data_nascimento ? parseDate(p.data_nascimento) : null,
    }

    const { data: existing, error: selErr } = await supabase
      .from("pacientes_reativacao")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("telefone", telefone)
      .is("medx_id", null)
      .maybeSingle()

    if (selErr) { erros.push({ nome, msg: selErr.message }); continue }

    if (existing) {
      const { error: updErr } = await supabase
        .from("pacientes_reativacao")
        .update(payload)
        .eq("id", existing.id)
      if (updErr) erros.push({ nome, msg: updErr.message })
      else        atualizados++
    } else {
      const { error: insErr } = await supabase
        .from("pacientes_reativacao")
        .insert({ ...payload, user_id: auth.userId, status: "inativo" })
      if (insErr) erros.push({ nome, msg: insErr.message })
      else        importados++
    }
  }

  return NextResponse.json({ importados, atualizados, erros })
}
