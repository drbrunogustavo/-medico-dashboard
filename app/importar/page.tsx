"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Check, ChevronDown, ChevronUp, FileSpreadsheet, Users, RefreshCw, ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel, PxButton, Tag, PxSelect, PxCheckbox, PageHeader } from "@/components/px"

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
  { value: "ignorar",          label: "Ignorar esta coluna" },
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
  const { readSheet } = await import("read-excel-file/browser")
  const raw = (await readSheet(file)) as unknown[][]
  if (!raw.length) return { headers: [], rows: [] }
  const txt = (c: unknown) => c === null || c === undefined ? "" : c instanceof Date ? c.toISOString().split("T")[0] : String(c)
  return {
    headers: raw[0].map(txt),
    rows:    raw.slice(1).map(r => r.map(txt)),
  }
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function Passo({ n, rotulo, ativo, feito }: { n: number; rotulo: string; ativo: boolean; feito: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold",
        feito ? "bg-px-ink text-white" : ativo ? "bg-white text-px-ink ring-2 ring-px-ink" : "bg-px-ink/10 text-px-muted"
      )}>
        {feito ? <Check className="h-3.5 w-3.5" aria-hidden /> : n}
      </span>
      <span className={cn("hidden text-[12.5px] sm:block", ativo ? "font-semibold text-px-ink" : "text-px-muted")}>{rotulo}</span>
    </div>
  )
}

function Acordeao({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-px-card border border-px-line bg-white/50">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/60"
      >
        <span className="text-[13.5px] font-medium text-px-ink">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-px-muted" aria-hidden /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-px-muted" aria-hidden />}
      </button>
      {open && <div className="border-t border-px-line px-4 pb-4">{children}</div>}
    </div>
  )
}

function Tabela({ colunas, linhas }: { colunas: string[]; linhas: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-px-card border border-px-line bg-white/60">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-px-line text-left text-px-muted">
            {colunas.map(c => <th key={c} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-px-line">
              {l.map((c, j) => <td key={j} className="max-w-[160px] truncate px-3 py-2 text-px-ink">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

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
    if (!["csv","xlsx"].includes(ext)) {
      setErroGlobal("Formato não suportado. Use .csv ou .xlsx")
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
  const camposPreview = CAMPOS.filter(c => c.value !== "ignorar" && c.value !== "ultima_consulta")

  return (
    <div className="animate-fade-in">
      <PageHeader title="Importar" caption="Traga pacientes de outro sistema" back />

      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 md:px-10">

        <ol aria-label="Etapas" className="flex items-center gap-2 px-1">
          {STEP_LABELS.map((label, i) => (
            <li key={label} aria-current={step === i ? "step" : undefined} className="flex flex-1 items-center gap-2 last:flex-none">
              <Passo n={i + 1} rotulo={label} ativo={step === i} feito={step > i} />
              {i < STEP_LABELS.length - 1 && <span aria-hidden className={cn("h-px flex-1", step > i ? "bg-px-ink" : "bg-px-line")} />}
            </li>
          ))}
        </ol>

        {erroGlobal && (
          <Panel tone="light" className="flex items-center justify-between gap-3">
            <p role="alert" className="text-[13.5px] text-px-danger">{erroGlobal}</p>
            <PxButton size="sm" variant="secondary" onClick={() => setErroGlobal("")}>Fechar</PxButton>
          </Panel>
        )}

        {/* Etapa 1: envio do arquivo */}
        {step === 0 && (
          <Panel tone="light" className="space-y-5">
            <div>
              <h2 className="text-[17px] font-semibold text-px-ink">Importe pacientes de outro sistema</h2>
              <p className="mt-0.5 text-[13px] text-px-muted">
                Aceita CSV ou Excel (.xlsx) exportados de prontuário eletrônico, planilha ou outro CRM.
              </p>
            </div>

            <input ref={fileRef} id="imp-arquivo" type="file" accept=".csv,.xlsx" onChange={onFileInput} className="sr-only" />
            <label
              htmlFor="imp-arquivo"
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-3 rounded-px-card border-2 border-dashed py-12 text-center transition-colors focus-within:ring-2 focus-within:ring-px-ink",
                dragging ? "border-px-ink bg-white/80" : "border-px-ink/30 hover:bg-white/50"
              )}
            >
              {loading ? (
                <p role="status" className="text-[13.5px] text-px-ink">{loadingMsg}</p>
              ) : (
                <>
                  <Upload className="h-9 w-9 text-px-muted" aria-hidden />
                  <span>
                    <span className="block text-[14.5px] font-medium text-px-ink">Arraste o arquivo aqui ou clique para selecionar</span>
                    <span className="mt-0.5 block text-[12.5px] text-px-muted">.csv ou .xlsx</span>
                  </span>
                  <span className="text-[12px] text-px-muted">A leitura acontece no seu navegador. O arquivo não é enviado para nenhum servidor nesta etapa.</span>
                </>
              )}
            </label>

            <div className="space-y-2">
              <h3 className="text-[13px] font-semibold text-px-ink">Como exportar do seu sistema</h3>

              <Acordeao title="Excel e Google Sheets">
                <div className="mt-3 space-y-2 text-[13px] text-px-ink">
                  <p><strong>Excel:</strong> Arquivo, Salvar como, CSV UTF-8 (delimitado por vírgula).</p>
                  <p><strong>Google Sheets:</strong> Arquivo, Fazer download, Valores separados por vírgula (.csv).</p>
                  <p className="text-px-muted">A primeira linha deve ter os nomes das colunas.</p>
                </div>
              </Acordeao>

              <Acordeao title="Prontuários eletrônicos comuns">
                <div className="mt-3 space-y-2 text-[13px] text-px-ink">
                  <p><strong>iClinic:</strong> Pacientes, Exportar, Exportar em CSV.</p>
                  <p><strong>Doctoralia:</strong> Configurações, Dados, Exportar pacientes.</p>
                  <p><strong>MedPlus e Nibo:</strong> Relatórios, Pacientes, Exportar planilha.</p>
                  <p><strong>Outros:</strong> procure por Exportar, Relatórios ou Backup nas configurações e escolha CSV ou Excel.</p>
                </div>
              </Acordeao>

              <Acordeao title="Não sei exportar e prefiro cadastrar manualmente">
                <div className="mt-3 text-[13px] text-px-ink">
                  <p className="mb-3">Sem problema. Você pode cadastrar os pacientes um a um na tela de Pacientes.</p>
                  <PxButton size="sm" variant="secondary" href="/pacientes" rightIcon={ArrowRight}>Ir para Pacientes</PxButton>
                </div>
              </Acordeao>
            </div>
          </Panel>
        )}

        {/* Etapa 2: mapeamento */}
        {step === 1 && (
          <div className="space-y-4">
            <Panel tone="light" className="space-y-4">
              <div>
                <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-px-ink">
                  <FileSpreadsheet className="h-4 w-4 text-px-accent" aria-hidden /> {fileName}
                  <span className="text-[12.5px] font-normal text-px-muted">{rows.length} registros e {headers.length} colunas</span>
                </p>
                <p className="mt-1 text-[13px] text-px-muted">Indique o que cada coluna do arquivo representa.</p>
              </div>

              <ul className="divide-y divide-px-line rounded-px-card border border-px-line bg-white/50">
                {headers.map((h, i) => (
                  <li key={i} className="grid grid-cols-1 items-center gap-2 px-4 py-3 sm:grid-cols-2 sm:gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-px-ink">{h}</p>
                      <p className="truncate text-[12px] text-px-muted">Exemplo: {rows[0]?.[i] || "vazio"}</p>
                    </div>
                    <PxSelect
                      aria-label={`O que representa a coluna ${h}`}
                      value={mapping[i] ?? "ignorar"}
                      onChange={e => setMapping(m => ({ ...m, [i]: e.target.value as CampoDestino }))}
                      className="h-10 text-[13px]"
                    >
                      {CAMPOS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </PxSelect>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel tone="light" className="space-y-3">
              <h3 className="text-[14px] font-semibold text-px-ink">Primeiros 5 registros mapeados</h3>
              <Tabela
                colunas={camposPreview.map(c => c.label)}
                linhas={buildMapped().slice(0, 5).map(p => camposPreview.map(c => (p as Record<string, string>)[c.value] ?? "Sem dado"))}
              />
            </Panel>

            <div className="flex items-center justify-between gap-3">
              <PxButton variant="secondary" leftIcon={ArrowLeft} onClick={() => setStep(0)}>Trocar arquivo</PxButton>
              <PxButton rightIcon={ArrowRight} onClick={() => { if (buildMapped().length > 0) { setStep(2) } else { setErroGlobal("Nenhum registro válido encontrado. Verifique o mapeamento.") } }}>
                Continuar
              </PxButton>
            </div>
          </div>
        )}

        {/* Etapa 3: revisão */}
        {step === 2 && (
          <div className="space-y-4">
            <Panel tone="dark">
              <h2 className="mb-3 text-[15px] font-semibold text-white">Revise antes de importar</h2>
              <dl className="grid grid-cols-3 gap-4 text-white">
                <div>
                  <dt className="text-[12px] text-white/80">Pacientes prontos</dt>
                  <dd className="mt-1 text-[30px] font-semibold leading-none tabular-nums">{mapped.length}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-white/80">Telefones inválidos</dt>
                  <dd className="mt-1 text-[30px] font-semibold leading-none tabular-nums">{phoneErros}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-white/80">Duplicados (estimativa)</dt>
                  <dd className="mt-1 text-[30px] font-semibold leading-none tabular-nums">{dupeCount}</dd>
                </div>
              </dl>
            </Panel>

            {(phoneErros > 0 || dupeCount > 0) && (
              <Panel tone="light" className="space-y-2">
                <p className="text-[14px] font-semibold text-px-warn">Avisos antes de importar</p>
                {phoneErros > 0 && (
                  <p className="text-[13px] text-px-ink">
                    {phoneErros} paciente{phoneErros > 1 ? "s" : ""} com telefone em formato inválido. Serão importados sem o telefone e você pode corrigir depois.
                  </p>
                )}
                {dupeCount > 0 && (
                  <p className="text-[13px] text-px-ink">
                    Estimativa de {dupeCount} registro{dupeCount > 1 ? "s" : ""} duplicado{dupeCount > 1 ? "s" : ""} no arquivo. O sistema evita duplicados por telefone ao salvar.
                  </p>
                )}
              </Panel>
            )}

            <Panel tone="light" className="space-y-1">
              <PxCheckbox label="Também adicionar ao CRM como pacientes ativos" checked={addCrm} onChange={e => setAddCrm(e.target.checked)} />
              <p className="pl-[26px] text-[12.5px] text-px-muted">Os pacientes aparecem no CRM na etapa Paciente Ativo, para acompanhamento.</p>
            </Panel>

            <Panel tone="light" className="space-y-3">
              <h3 className="text-[14px] font-semibold text-px-ink">Amostra: {Math.min(mapped.length, 10)} de {mapped.length}</h3>
              <Tabela
                colunas={["Nome", "Telefone", "Email", "Nascimento"]}
                linhas={mapped.slice(0, 10).map(p => [
                  p.nome ?? "Sem dado",
                  p.telefone && !phoneValid(p.telefone) ? <span key="t" className="text-px-warn">{p.telefone} (inválido)</span> : (p.telefone ?? "Sem dado"),
                  p.email ?? "Sem dado",
                  p.data_nascimento ?? "Sem dado",
                ])}
              />
            </Panel>

            <div className="flex items-center justify-between gap-3">
              <PxButton variant="secondary" leftIcon={ArrowLeft} onClick={() => setStep(1)}>Ajustar mapeamento</PxButton>
              <PxButton leftIcon={Users} loading={loading} disabled={loading || mapped.length === 0} onClick={doImport}>
                {loading ? loadingMsg : `Importar ${mapped.length} pacientes`}
              </PxButton>
            </div>
          </div>
        )}

        {/* Etapa 4: resultado */}
        {step === 3 && resultado && (
          <div className="space-y-4">
            <Panel tone="light" className="py-10 text-center">
              <h2 className="text-[24px] font-semibold text-px-ink">
                {resultado.importados} paciente{resultado.importados !== 1 ? "s" : ""} importado{resultado.importados !== 1 ? "s" : ""}
              </h2>
              <p className="mt-1 text-[13.5px] text-px-muted">
                {addCrm ? "Adicionados ao banco de pacientes e ao CRM." : "Adicionados ao banco de pacientes."}
              </p>
            </Panel>

            {resultado.erros.length > 0 && (
              <Panel tone="light" className="overflow-hidden p-0">
                <p className="flex items-center gap-2 px-5 py-4 text-[14px] font-semibold text-px-danger">
                  <Tag tone="danger">{resultado.erros.length}</Tag> erro{resultado.erros.length > 1 ? "s" : ""} durante a importação
                </p>
                <ul className="max-h-52 divide-y divide-px-line overflow-y-auto border-t border-px-line">
                  {resultado.erros.map((e, i) => (
                    <li key={i} className="px-5 py-2.5 text-[13px] text-px-ink">
                      <span className="font-semibold text-px-danger">Linha {e.linha}:</span> {e.msg}
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <PxButton fullWidth href="/pacientes" leftIcon={Users}>Ver pacientes importados</PxButton>
              <PxButton fullWidth variant="secondary" leftIcon={RefreshCw} onClick={() => { setStep(0); setFileName(""); setHeaders([]); setRows([]); setMapping({}); setResultado(null) }}>
                Importar outro arquivo
              </PxButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
