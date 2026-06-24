"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, Upload, Check, AlertTriangle, X,
  ChevronDown, ChevronUp, FileSpreadsheet, Users, Loader2, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types ────────────────────────────────────────────────────────────────────

type CampoDestino =
  | "nome" | "telefone" | "email" | "data_nascimento"
  | "cpf" | "endereco" | "ultima_consulta" | "observacao" | "ignorar"

interface PacienteMapeado {
  nome?: string
  telefone?: string
  email?: string
  data_nascimento?: string
  cpf?: string
  endereco?: string
  observacao?: string
}

interface ResultadoImport {
  importados: number
  erros: Array<{ linha: number; msg: string }>
}

const CAMPOS: { value: CampoDestino; label: string }[] = [
  { value: "ignorar",          label: "— Ignorar esta coluna —" },
  { value: "nome",             label: "Nome do paciente" },
  { value: "telefone",         label: "Telefone / WhatsApp" },
  { value: "email",            label: "Email" },
  { value: "data_nascimento",  label: "Data de nascimento" },
  { value: "cpf",              label: "CPF" },
  { value: "endereco",         label: "Endereço" },
  { value: "ultima_consulta",  label: "Última consulta" },
  { value: "observacao",       label: "Observações / Anotações" },
]

const STEP_LABELS = ["Upload", "Mapeamento", "Revisão", "Resultado"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizePhone(v: string): string {
  return v.replace(/\D/g, "").replace(/^55/, "").replace(/^0/, "")
}

function phoneValid(v: string): boolean {
  const n = normalizePhone(v)
  return n.length >= 10 && n.length <= 11
}

function guessField(header: string): CampoDestino {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (/nome|paciente|client|name/.test(h))      return "nome"
  if (/tel|fone|celular|whats|phone/.test(h))   return "telefone"
  if (/email|e-mail|correio/.test(h))           return "email"
  if (/nasc|birth|aniversario|data/.test(h))    return "data_nascimento"
  if (/cpf|cpnj|documento/.test(h))             return "cpf"
  if (/end|rua|cidade|bairro|address/.test(h))  return "endereco"
  if (/ultima|ultimo|last|visit|consul/.test(h)) return "ultima_consulta"
  if (/obs|anot|not|comment|remark/.test(h))    return "observacao"
  return "ignorar"
}

// ─── Parse functions ──────────────────────────────────────────────────────────

async function parseCSV(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const text = await file.text()
  const Papa = (await import("papaparse")).default
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true })
  const all = result.data as string[][]
  if (!all.length) return { headers: [], rows: [] }
  return { headers: all[0].map(String), rows: all.slice(1) }
}

async function parseExcel(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const XLSX = await import("xlsx")
  const buf  = await file.arrayBuffer()
  const wb   = XLSX.read(buf, { type: "array" })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const raw  = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" })
  if (!raw.length) return { headers: [], rows: [] }
  return {
    headers: (raw[0] as string[]).map(String),
    rows:    (raw.slice(1) as string[][]).map(r => r.map(String)),
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all flex-shrink-0",
      done   ? "bg-accent text-white"
             : active ? "bg-accent-dim border border-accent-border text-accent"
                      : "bg-surface-2 border border-border text-text-muted"
    )}>
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </div>
  )
}

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="text-[13px] font-medium text-text-primary">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ImportarPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step,       setStep]       = useState<0 | 1 | 2 | 3>(0)
  const [dragging,   setDragging]   = useState(false)
  const [fileName,   setFileName]   = useState("")
  const [loading,    setLoading]    = useState(false)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [headers,    setHeaders]    = useState<string[]>([])
  const [rows,       setRows]       = useState<string[][]>([])
  const [mapping,    setMapping]    = useState<Record<number, CampoDestino>>({})
  const [addCrm,     setAddCrm]     = useState(true)
  const [resultado,  setResultado]  = useState<ResultadoImport | null>(null)
  const [erroGlobal, setErroGlobal] = useState("")

  // ── File processing ──────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setErroGlobal("")
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!["csv","xlsx","xls"].includes(ext)) {
      setErroGlobal("Formato não suportado. Use .csv, .xlsx ou .xls")
      return
    }
    setLoading(true)
    setLoadingMsg("Lendo arquivo…")
    try {
      const parsed = ext === "csv" ? await parseCSV(file) : await parseExcel(file)
      if (!parsed.headers.length) { setErroGlobal("Arquivo vazio ou sem cabeçalho."); return }
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      const auto: Record<number, CampoDestino> = {}
      parsed.headers.forEach((h, i) => { auto[i] = guessField(h) })
      setMapping(auto)
      setStep(1)
    } catch (e) {
      setErroGlobal(`Erro ao ler arquivo: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { processFile(f); e.target.value = "" }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [processFile])

  // ── Build mapped data ────────────────────────────────────────────────────────

  function buildMapped(): PacienteMapeado[] {
    return rows.map(row => {
      const p: PacienteMapeado = {}
      Object.entries(mapping).forEach(([idxStr, campo]) => {
        if (campo === "ignorar") return
        const val = (row[Number(idxStr)] ?? "").trim()
        if (!val) return
        if (campo === "ultima_consulta") {
          p.observacao = p.observacao ? `${p.observacao} | Última consulta: ${val}` : `Última consulta: ${val}`
        } else {
          (p as Record<string, string>)[campo] = val
        }
      })
      return p
    }).filter(p => p.nome || p.telefone)
  }

  // ── Duplicate detection ───────────────────────────────────────────────────────

  function findDuplicates(data: PacienteMapeado[]): number {
    const seen = new Set<string>()
    let dupes = 0
    for (const p of data) {
      const key = `${normalizePhone(p.telefone ?? "")}|${(p.nome ?? "").toLowerCase().trim()}`
      if (seen.has(key)) dupes++
      else seen.add(key)
    }
    return dupes
  }

  // ── Import ────────────────────────────────────────────────────────────────────

  const doImport = async () => {
    const data = buildMapped()
    if (!data.length) return
    setLoading(true)
    setLoadingMsg(`Importando ${data.length} pacientes…`)
    try {
      const res = await fetch("/api/pacientes/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacientes: data, addCrm }),
      })
      const json = await res.json() as ResultadoImport & { error?: string }
      if (!res.ok) throw new Error(json.error ?? "Erro ao importar")
      setResultado(json)
      setStep(3)
    } catch (e) {
      setErroGlobal(e instanceof Error ? e.message : "Erro ao importar")
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const mapped     = step >= 2 ? buildMapped() : []
  const dupeCount  = step >= 2 ? findDuplicates(mapped) : 0
  const phoneErros = step >= 2 ? mapped.filter(p => p.telefone && !phoneValid(p.telefone)).length : 0

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Importar Pacientes" />
      {/* ── Header ── */}
      <div className="px-4 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/pacientes" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[17px] font-semibold text-text-primary">Importar Pacientes</h1>
            <p className="text-[11px] text-text-muted">Migração guiada de qualquer sistema para o PRAXIS</p>
          </div>
          <FileSpreadsheet className="w-5 h-5 text-text-muted" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Stepper ── */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <StepDot n={i + 1} active={step === i} done={step > i} />
                <span className={cn("text-[11px] font-medium hidden sm:block", step === i ? "text-accent" : step > i ? "text-text-secondary" : "text-text-muted")}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-px" style={{ background: step > i ? "var(--accent)" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Error banner ── */}
        {erroGlobal && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-[12px] text-red-400">{erroGlobal}</p>
            <button onClick={() => setErroGlobal("")} className="ml-auto text-red-400 hover:text-red-300"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* ─────────────────────── ETAPA 1 — UPLOAD ─────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-[18px] font-semibold text-text-primary">Importe seus pacientes de outro sistema</h2>
              <p className="text-[13px] text-text-muted">
                Aceita arquivos CSV ou Excel (.xlsx) exportados de qualquer sistema: prontuário eletrônico, planilha ou outro CRM.
              </p>
            </div>

            {/* Drop area */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative rounded-2xl border-2 border-dashed cursor-pointer transition-all py-14 flex flex-col items-center gap-3",
                dragging ? "border-accent bg-accent-dim" : "border-border hover:border-border-hover hover:bg-surface-2"
              )}
            >
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileInput} className="hidden" />
              {loading ? (
                <><Loader2 className="w-10 h-10 text-accent animate-spin" /><p className="text-[13px] text-text-secondary">{loadingMsg}</p></>
              ) : (
                <>
                  <Upload className={cn("w-10 h-10 transition-colors", dragging ? "text-accent" : "text-text-muted")} />
                  <div className="text-center">
                    <p className="text-[14px] font-medium text-text-primary">Arraste seu arquivo aqui</p>
                    <p className="text-[12px] text-text-muted mt-0.5">ou clique para selecionar — .csv, .xlsx, .xls</p>
                  </div>
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full border border-border text-text-muted">
                    Processamento 100% no seu navegador — nenhum dado sai do seu computador
                  </span>
                </>
              )}
            </div>

            {/* Instructions accordion */}
            <div className="space-y-2">
              <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest">Como exportar do seu sistema</p>

              <AccordionItem title="Excel / Google Sheets">
                <div className="mt-3 space-y-2 text-[12px] text-text-secondary">
                  <p><strong>Excel:</strong> Arquivo → Salvar como → CSV UTF-8 (delimitado por vírgula)</p>
                  <p><strong>Google Sheets:</strong> Arquivo → Fazer download → Valores separados por vírgula (.csv)</p>
                  <p className="text-text-muted">O arquivo deve ter uma linha de cabeçalho (nomes das colunas) na 1ª linha.</p>
                </div>
              </AccordionItem>

              <AccordionItem title="Prontuários eletrônicos comuns">
                <div className="mt-3 space-y-3 text-[12px] text-text-secondary">
                  <div><strong className="text-text-primary">iClinic:</strong> Pacientes → Exportar → Exportar em CSV</div>
                  <div><strong className="text-text-primary">Doctoralia:</strong> Configurações → Dados → Exportar pacientes</div>
                  <div><strong className="text-text-primary">MedPlus / Nibo:</strong> Relatórios → Pacientes → Exportar planilha</div>
                  <div><strong className="text-text-primary">Qualquer sistema:</strong> Procure por "Exportar", "Relatórios" ou "Backup" nas configurações. Selecione CSV ou Excel como formato.</div>
                </div>
              </AccordionItem>

              <AccordionItem title="Não sei como exportar — prefiro cadastrar manualmente">
                <div className="mt-3 text-[12px] text-text-secondary">
                  <p className="mb-3">Sem problema. Você pode cadastrar pacientes individualmente na tela de Gestão de Pacientes.</p>
                  <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium">
                    Ir para Gestão de Pacientes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </AccordionItem>
            </div>
          </div>
        )}

        {/* ─────────────────────── ETAPA 2 — MAPEAMENTO ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-semibold text-text-primary">{fileName}</span>
                <span className="text-[11px] text-text-muted">· {rows.length} registros · {headers.length} colunas</span>
              </div>
              <p className="text-[13px] text-text-muted">
                Identificamos estas colunas no seu arquivo. Indique o que cada uma representa:
              </p>
            </div>

            {/* Column mapping */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="grid grid-cols-2 gap-px text-[10px] font-mono text-text-muted uppercase tracking-widest px-4 py-2"
                style={{ background: "var(--surface-2, var(--card))", borderBottom: "1px solid var(--border)" }}>
                <span>Coluna no arquivo</span>
                <span>Representa</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {headers.map((h, i) => (
                  <div key={i} className="grid grid-cols-2 items-center gap-3 px-4 py-2.5">
                    <div>
                      <div className="text-[12px] font-medium text-text-primary truncate">{h}</div>
                      <div className="text-[10px] text-text-muted truncate mt-0.5">{rows[0]?.[i] ?? ""}</div>
                    </div>
                    <select
                      value={mapping[i] ?? "ignorar"}
                      onChange={e => setMapping(m => ({ ...m, [i]: e.target.value as CampoDestino }))}
                      className="w-full text-[12px] px-2.5 py-1.5 rounded-lg outline-none transition-all"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    >
                      {CAMPOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">Preview — primeiros 5 registros mapeados</p>
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                      {CAMPOS.filter(c => c.value !== "ignorar" && c.value !== "ultima_consulta").map(c => (
                        <th key={c.value} className="text-left px-3 py-2 font-mono text-text-muted whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {buildMapped().slice(0, 5).map((p, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                        {CAMPOS.filter(c => c.value !== "ignorar" && c.value !== "ultima_consulta").map(c => (
                          <td key={c.value} className="px-3 py-2 text-text-secondary truncate max-w-[140px]">
                            {(p as Record<string, string>)[c.value] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(0)} className="text-[12px] text-text-muted hover:text-text-primary flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Trocar arquivo
              </button>
              <button
                onClick={() => { if (buildMapped().length > 0) { setStep(2) } else { setErroGlobal("Nenhum registro válido encontrado. Verifique o mapeamento.") } }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
                style={{ background: "var(--accent)", color: "#080808" }}
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────── ETAPA 3 — REVISÃO ────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-[17px] font-semibold text-text-primary mb-1">Revisão antes de importar</h2>
              <p className="text-[13px] text-text-muted">Verifique os dados antes de confirmar a importação.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pacientes prontos",  value: mapped.length,  color: "var(--accent)"   },
                { label: "Telefones inválidos", value: phoneErros,     color: phoneErros > 0 ? "#f59e0b" : "var(--text-muted)" },
                { label: "Duplicados (est.)",   value: dupeCount,      color: dupeCount > 0 ? "#f59e0b" : "var(--text-muted)"  },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="text-[24px] font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] font-mono text-text-muted mt-1 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {(phoneErros > 0 || dupeCount > 0) && (
              <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-[12px] font-semibold text-amber-400">Avisos antes de importar</span>
                </div>
                {phoneErros > 0 && (
                  <p className="text-[12px] text-amber-300/80 pl-6">
                    {phoneErros} paciente{phoneErros > 1 ? "s" : ""} com telefone em formato inválido. Serão importados sem o telefone — você pode corrigir depois.
                  </p>
                )}
                {dupeCount > 0 && (
                  <p className="text-[12px] text-amber-300/80 pl-6">
                    Estimativa de {dupeCount} registro{dupeCount > 1 ? "s" : ""} duplicado{dupeCount > 1 ? "s" : ""} no arquivo. O sistema evitará duplicados por telefone ao salvar.
                  </p>
                )}
              </div>
            )}

            {/* CRM checkbox */}
            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-colors"
              style={{ background: addCrm ? "var(--accent-dim)" : "var(--card)", border: `1px solid ${addCrm ? "var(--accent-border)" : "var(--border)"}` }}>
              <input
                type="checkbox"
                checked={addCrm}
                onChange={e => setAddCrm(e.target.checked)}
                className="mt-0.5 w-4 h-4 cursor-pointer flex-shrink-0"
                style={{ accentColor: "var(--accent)" }}
              />
              <div>
                <span className="text-[13px] font-semibold text-text-primary block">
                  Também adicionar ao CRM como pacientes ativos
                </span>
                <span className="text-[11px] text-text-muted">
                  Os pacientes importados aparecerão no CRM de Leads na etapa "Paciente Ativo" para acompanhamento.
                </span>
              </div>
            </label>

            {/* Preview table */}
            <div>
              <p className="text-[11px] font-mono text-text-muted uppercase tracking-widest mb-2">Amostra ({Math.min(mapped.length, 10)} de {mapped.length})</p>
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                      {["Nome", "Telefone", "Email", "Nascimento"].map(h => (
                        <th key={h} className="text-left px-3 py-2 font-mono text-text-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mapped.slice(0, 10).map((p, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-3 py-2 text-text-primary font-medium truncate max-w-[160px]">{p.nome ?? "—"}</td>
                        <td className={cn("px-3 py-2 truncate", p.telefone && !phoneValid(p.telefone) ? "text-amber-400" : "text-text-secondary")}>{p.telefone ?? "—"}</td>
                        <td className="px-3 py-2 text-text-secondary truncate max-w-[140px]">{p.email ?? "—"}</td>
                        <td className="px-3 py-2 text-text-muted">{p.data_nascimento ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-[12px] text-text-muted hover:text-text-primary flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Ajustar mapeamento
              </button>
              <button
                onClick={doImport}
                disabled={loading || mapped.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#080808" }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg}</>
                ) : (
                  <><Users className="w-4 h-4" /> Importar {mapped.length} pacientes</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────── ETAPA 4 — RESULTADO ──────────────────────── */}
        {step === 3 && resultado && (
          <div className="space-y-5">
            <div className="text-center rounded-2xl p-10" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
                <Check className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-[22px] font-bold text-text-primary mb-1">
                {resultado.importados} paciente{resultado.importados !== 1 ? "s" : ""} importado{resultado.importados !== 1 ? "s" : ""}!
              </h2>
              <p className="text-[13px] text-text-muted">
                {addCrm ? "Pacientes adicionados ao banco de pacientes e ao CRM de Leads." : "Pacientes adicionados ao banco de pacientes."}
              </p>
            </div>

            {/* Errors */}
            {resultado.erros.length > 0 && (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: "rgba(220,38,38,0.06)", borderBottom: "1px solid rgba(220,38,38,0.15)" }}>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-[12px] font-semibold text-red-400">{resultado.erros.length} erro{resultado.erros.length > 1 ? "s" : ""} durante a importação</span>
                </div>
                <div className="divide-y max-h-52 overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                  {resultado.erros.map((e, i) => (
                    <div key={i} className="px-4 py-2 text-[11px] text-text-muted">
                      <span className="font-mono text-red-400">Linha {e.linha}:</span> {e.msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/pacientes" className="flex-1 text-center inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
                style={{ background: "var(--accent)", color: "#080808" }}>
                <Users className="w-4 h-4" /> Ver pacientes importados
              </Link>
              <button
                onClick={() => { setStep(0); setFileName(""); setHeaders([]); setRows([]); setMapping({}); setResultado(null) }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-medium transition-all hover:bg-surface-2"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <RefreshCw className="w-4 h-4" /> Importar mais arquivos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
