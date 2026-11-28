"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Bot, Camera, ChevronDown, ChevronUp, FileUp, Pill, Plus } from "lucide-react"
import { Field, LineSeries, Panel, PageHeader, PxButton, PxInput, PxSelect, Segmented, Tag } from "@/components/px"

/* ── Tipos ─────────────────────────────────────────────────────────────── */

interface PacienteLocal {
  id:                 string
  nome:               string
  telefone?:          string | null
  email?:             string | null
  data_nascimento?:   string | null
  observacao?:        string | null
  foto_url?:          string | null
  peso?:              number | null
  altura?:            number | null
  circunferencia_ab?: number | null
  medicamentos?:      string[] | null
  pendencias?:        string | null
  protocolo_ativo?:   string | null
  sexo?:              string | null
}

interface Exame {
  id:           string
  nome:         string
  valor:        string
  unidade?:     string | null
  referencia?:  string | null
  tendencia?:   string | null
  data_coleta?: string | null
  criado_em:    string
}

interface HistoricoEntry {
  id:             string
  tipo_consulta?: string | null
  relato:         string
  resultado?:     { resumo?: string; plano?: string; exames_solicitados?: string[] } | null
  created_at:     string
}

type TimelineEvent =
  | { kind: "consulta"; id: string; date: string; entry: HistoricoEntry }
  | { kind: "exame";    id: string; date: string; exame: Exame }

interface AlertaIA {
  tipo:      string
  titulo:    string
  descricao: string
  urgencia:  "alta" | "media" | "baixa"
}

type MetricaCampo = "peso" | "altura" | "circunferencia_ab"

const METRICAS: { campo: MetricaCampo; label: string; unidade: string; min: number; max: number }[] = [
  { campo: "peso",              label: "Peso",                 unidade: "kg", min: 1,  max: 500 },
  { campo: "altura",            label: "Altura",               unidade: "cm", min: 30, max: 260 },
  { campo: "circunferencia_ab", label: "Circunferência abdominal", unidade: "cm", min: 20, max: 300 },
]

const TENDENCIAS = [
  { value: "stable", label: "Estável" },
  { value: "up",     label: "Aumentou" },
  { value: "down",   label: "Diminuiu" },
]

const SEXOS = [
  { value: "M",     label: "Masculino" },
  { value: "F",     label: "Feminino" },
  { value: "outro", label: "Outro" },
]

const URGENCIA: Record<AlertaIA["urgencia"], { label: string; tone: "danger" | "warn" | "neutral" }> = {
  alta:  { label: "Urgente",     tone: "danger" },
  media: { label: "Atenção",     tone: "warn" },
  baixa: { label: "Informativo", tone: "neutral" },
}

const erroBox = "rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger"
const textareaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

/* ── Datas e cálculos ──────────────────────────────────────────────────── */

// "2026-11-01" vira o dia 1 no fuso local; new Date("2026-11-01") seria meia-noite UTC e cairia no dia 31.
function parseDia(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s)
}

function fmtData(s: string | null | undefined): string {
  if (!s) return "-"
  const d = parseDia(s)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function calcIdade(s: string | null | undefined): string {
  if (!s) return ""
  const n = parseDia(s)
  if (Number.isNaN(n.getTime())) return ""
  const hoje = new Date()
  let anos = hoje.getFullYear() - n.getFullYear()
  const fezAniversario = hoje.getMonth() > n.getMonth() || (hoje.getMonth() === n.getMonth() && hoje.getDate() >= n.getDate())
  if (!fezAniversario) anos -= 1
  return anos >= 0 ? `${anos} anos` : ""
}

function calcIMC(peso?: number | null, altura?: number | null): string {
  if (!peso || !altura || altura < 30) return ""
  return (peso / ((altura / 100) ** 2)).toFixed(1).replace(".", ",")
}

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function num(v: number | null | undefined): string {
  return typeof v === "number" ? String(v).replace(".", ",") : ""
}

/* ── Peças da página (fora do componente principal para não perder o foco) ── */

function Secao({ titulo, aside, children }: { titulo: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Panel as="section" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-px-ink">{titulo}</h2>
        {aside}
      </div>
      {children}
    </Panel>
  )
}

function Metrica({ def, valor, onSalvar }: {
  def:      typeof METRICAS[number]
  valor:    number | null | undefined
  onSalvar: (campo: MetricaCampo, v: number) => Promise<boolean>
}) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState("")
  const [erro, setErro] = useState("")
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(rascunho.replace(",", "."))
    if (!Number.isFinite(n) || n < def.min || n > def.max) { setErro(`Informe um valor entre ${def.min} e ${def.max} ${def.unidade}.`); return }
    setSalvando(true); setErro("")
    const ok = await onSalvar(def.campo, n)
    setSalvando(false)
    if (ok) setEditando(false); else setErro("Não foi possível salvar.")
  }

  return (
    <Panel className="space-y-2">
      <div className="text-[12.5px] text-px-muted">{def.label}</div>
      {editando ? (
        <form onSubmit={salvar} className="space-y-2">
          <PxInput aria-label={`${def.label} em ${def.unidade}`} inputMode="decimal" autoFocus value={rascunho} onChange={e => setRascunho(e.target.value)} />
          {erro && <p role="alert" className="text-[12px] text-px-danger">{erro}</p>}
          <div className="flex gap-2">
            <PxButton type="submit" size="sm" loading={salvando}>Salvar</PxButton>
            <PxButton type="button" size="sm" variant="quiet" disabled={salvando} onClick={() => { setEditando(false); setErro("") }}>Cancelar</PxButton>
          </div>
        </form>
      ) : (
        <>
          <div className="text-[24px] font-semibold leading-tight text-px-ink">
            {valor ? <>{num(valor)} <span className="text-[13px] font-normal text-px-muted">{def.unidade}</span></> : <span className="text-px-muted">Sem registro</span>}
          </div>
          <PxButton size="sm" variant="quiet" aria-label={`Editar ${def.label.toLowerCase()}`} onClick={() => { setRascunho(num(valor)); setErro(""); setEditando(true) }}>
            {valor ? "Editar" : "Registrar"}
          </PxButton>
        </>
      )}
    </Panel>
  )
}

function EditorTexto({ titulo, valor, vazio, onSalvar }: {
  titulo:   string
  valor:    string
  vazio:    string
  onSalvar: (v: string) => Promise<boolean>
}) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(valor)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const id = "ed-" + titulo.toLowerCase().replace(/\W+/g, "-")

  async function salvar() {
    setSalvando(true); setErro("")
    const ok = await onSalvar(rascunho)
    setSalvando(false)
    if (ok) setEditando(false); else setErro("Não foi possível salvar.")
  }

  return (
    <Secao titulo={titulo} aside={!editando && <PxButton size="sm" variant="quiet" aria-label={`Editar ${titulo.toLowerCase()}`} onClick={() => { setRascunho(valor); setErro(""); setEditando(true) }}>Editar</PxButton>}>
      {editando ? (
        <div className="space-y-2">
          <label htmlFor={id} className="sr-only">{titulo}</label>
          <textarea id={id} autoFocus rows={4} maxLength={4000} value={rascunho} onChange={e => setRascunho(e.target.value)} placeholder={vazio} className={textareaCls} />
          {erro && <p role="alert" className="text-[12px] text-px-danger">{erro}</p>}
          <div className="flex gap-2">
            <PxButton size="sm" onClick={salvar} loading={salvando}>Salvar</PxButton>
            <PxButton size="sm" variant="quiet" disabled={salvando} onClick={() => setEditando(false)}>Cancelar</PxButton>
          </div>
        </div>
      ) : valor ? <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-px-ink">{valor}</p>
        : <p className="text-[13.5px] text-px-muted">{vazio}</p>}
    </Secao>
  )
}

function ItemMedicamento({ nome, onRemover }: { nome: string; onRemover: () => Promise<boolean> }) {
  const [confirmando, setConfirmando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-px-card bg-white/70 px-3 py-2">
      <span className="min-w-0 break-words text-[13.5px] text-px-ink">{nome}</span>
      {confirmando ? (
        <span className="flex gap-2">
          <PxButton size="sm" variant="danger" loading={removendo} onClick={async () => { setRemovendo(true); const ok = await onRemover(); setRemovendo(false); if (!ok) setConfirmando(false) }}>Confirmar remoção</PxButton>
          <PxButton size="sm" variant="quiet" disabled={removendo} onClick={() => setConfirmando(false)}>Manter</PxButton>
        </span>
      ) : (
        <PxButton size="sm" variant="quiet" aria-label={`Remover ${nome}`} onClick={() => setConfirmando(true)}>Remover</PxButton>
      )}
    </li>
  )
}

function LinhaExame({ ex, onExcluir }: { ex: Exame; onExcluir: () => Promise<boolean> }) {
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const tend = ex.tendencia === "up" ? "Aumentou" : ex.tendencia === "down" ? "Diminuiu" : ex.tendencia === "stable" ? "Estável" : "-"
  return (
    <tr className="border-b border-px-line/60 align-top last:border-b-0">
      <td className="px-4 py-2.5 font-medium text-px-ink">{ex.nome}</td>
      <td className="px-3 py-2.5 tabular-nums text-px-ink">{ex.valor}{ex.unidade ? ` ${ex.unidade}` : ""}</td>
      <td className="px-3 py-2.5 text-px-muted">{ex.referencia ?? "-"}</td>
      <td className="px-3 py-2.5 text-px-ink">{tend}</td>
      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-px-muted">{fmtData(ex.data_coleta)}</td>
      <td className="px-3 py-2 text-right">
        {confirmando ? (
          <span className="inline-flex gap-1.5">
            <PxButton size="sm" variant="danger" loading={excluindo} onClick={async () => { setExcluindo(true); const ok = await onExcluir(); setExcluindo(false); if (!ok) setConfirmando(false) }}>Confirmar</PxButton>
            <PxButton size="sm" variant="quiet" disabled={excluindo} onClick={() => setConfirmando(false)}>Manter</PxButton>
          </span>
        ) : <PxButton size="sm" variant="quiet" aria-label={`Excluir exame ${ex.nome}`} onClick={() => setConfirmando(true)}>Excluir</PxButton>}
      </td>
    </tr>
  )
}

function EventoConsulta({ entry, pacienteId }: { entry: HistoricoEntry; pacienteId: string }) {
  const [aberto, setAberto] = useState(false)
  const plano = entry.resultado?.plano
  const exames = entry.resultado?.exames_solicitados ?? []
  const temExtra = !!plano || exames.length > 0
  const resumo = (entry.resultado?.resumo ?? entry.relato ?? "").slice(0, 220)
  const painel = "cons-" + entry.id
  return (
    <div className="rounded-px-card bg-white/70">
      <button
        type="button"
        disabled={!temExtra}
        aria-expanded={temExtra ? aberto : undefined}
        aria-controls={temExtra ? painel : undefined}
        onClick={() => setAberto(a => !a)}
        className="flex w-full items-start justify-between gap-2 rounded-px-card px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 disabled:cursor-default"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-medium text-px-ink">Consulta em {fmtData(entry.created_at)}</span>
            {entry.tipo_consulta && <Tag tone="neutral">{entry.tipo_consulta}</Tag>}
          </span>
          {resumo && <span className="mt-0.5 block text-[13px] leading-relaxed text-px-muted">{resumo}</span>}
        </span>
        {temExtra && (aberto ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-px-muted" aria-hidden /> : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-px-muted" aria-hidden />)}
      </button>
      {aberto && temExtra && (
        <div id={painel} className="space-y-3 border-t border-px-line px-4 py-3">
          {plano && (
            <div>
              <p className="text-[12px] text-px-muted">Conduta</p>
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-px-ink">{plano}</p>
            </div>
          )}
          {exames.length > 0 && (
            <div>
              <p className="mb-1 text-[12px] text-px-muted">Exames solicitados</p>
              <div className="flex flex-wrap gap-1.5">{exames.map((x, i) => <Tag key={i} tone="neutral">{x}</Tag>)}</div>
            </div>
          )}
          <Link href={`/copiloto?pacienteId=${pacienteId}`} className="inline-block text-[13px] font-medium text-px-accent underline underline-offset-2">Abrir no Copiloto</Link>
        </div>
      )}
    </div>
  )
}

function GraficoPeso({ exames }: { exames: Exame[] }) {
  const pontos = useMemo(() => exames
    .filter(e => /^peso$/i.test(e.nome.trim()) && Number.isFinite(parseFloat(e.valor.replace(",", "."))))
    .map(e => ({ data: (e.data_coleta ?? e.criado_em).slice(0, 10), peso: parseFloat(e.valor.replace(",", ".")) }))
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-8), [exames])

  if (pontos.length < 2) {
    return (
      <p className="text-[13.5px] leading-relaxed text-px-muted">
        {pontos.length === 0 ? "Nenhum peso registrado em exames." : "Só há um peso registrado em exames."} O gráfico usa exames de nome Peso, com data de coleta, porque o peso do
        cadastro não tem data. Para acompanhar a evolução, registre cada pesagem em Adicionar exame.
      </p>
    )
  }
  const valores = pontos.map(p => p.peso)
  const min = Math.floor(Math.min(...valores) - 2), max = Math.ceil(Math.max(...valores) + 2)
  const dif = Math.round((valores[valores.length - 1] - valores[0]) * 10) / 10
  return (
    <div className="space-y-2">
      <LineSeries
        label={`Evolução do peso de ${fmtData(pontos[0].data)} a ${fmtData(pontos[pontos.length - 1].data)}`}
        data={pontos.map(p => ({ rotulo: fmtData(p.data).slice(0, 5), valor: p.peso }))}
        min={min} max={max}
      />
      <p className="text-[13px] text-px-muted">
        De {num(valores[0])} kg em {fmtData(pontos[0].data)} para {num(valores[valores.length - 1])} kg em {fmtData(pontos[pontos.length - 1].data)}
        {" "}({dif > 0 ? "+" : ""}{num(dif)} kg). Últimos {pontos.length} registros de peso.
      </p>
    </div>
  )
}

/* ── Página ────────────────────────────────────────────────────────────── */

const FORM_VAZIO = { nome: "", valor: "", unidade: "", referencia: "", tendencia: "stable", data_coleta: "" }

export default function PacienteDashboard() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [erroCarga, setErroCarga] = useState("")
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [pac, setPac] = useState<PacienteLocal | null>(null)
  const [exames, setExames] = useState<Exame[]>([])
  const [historico, setHistorico] = useState<HistoricoEntry[]>([])
  const [fotoSrc, setFotoSrc] = useState<string | null>(null)
  const [aviso, setAviso] = useState("")
  const [avisoPdf, setAvisoPdf] = useState("")

  const [alertas, setAlertas] = useState<AlertaIA[] | null>(null)
  const [loadingAlertas, setLoadingAlertas] = useState(false)
  const [erroAlertas, setErroAlertas] = useState("")

  const [novoMed, setNovoMed] = useState("")
  const [addingMed, setAddingMed] = useState(false)
  const [showAddExame, setShowAddExame] = useState(false)
  const [savingExame, setSavingExame] = useState(false)
  const [erroExame, setErroExame] = useState("")
  const [exameForm, setExameForm] = useState(FORM_VAZIO)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [uploadingPDF, setUploadingPDF] = useState(false)

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setErroCarga(""); setNaoEncontrado(false)
    try {
      const res = await fetch(`/api/pacientes/${id}`)
      if (res.status === 404) { setNaoEncontrado(true); return }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { paciente: PacienteLocal; exames?: Exame[]; historico?: HistoricoEntry[] }
      setPac(data.paciente)
      setExames(data.exames ?? [])
      setHistorico(data.historico ?? [])
      if (data.paciente.foto_url) {
        // O banco guarda o caminho do arquivo; quem entrega o endereço de exibição é a rota de foto.
        fetch(`/api/pacientes/${id}/foto`).then(r => r.ok ? r.json() : null).then(d => setFotoSrc((d as { foto_url?: string | null } | null)?.foto_url ?? null)).catch(() => setFotoSrc(null))
      } else setFotoSrc(null)
    } catch (e) {
      console.error("[paciente] erro ao carregar:", e)
      setErroCarga("Não foi possível carregar a ficha.")
    } finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const patch = useCallback(async (updates: Record<string, unknown>): Promise<boolean> => {
    setAviso("")
    try {
      const res = await fetch(`/api/pacientes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPac(await res.json() as PacienteLocal)
      return true
    } catch (e) {
      console.error("[paciente] erro ao salvar:", e)
      setAviso("Não foi possível salvar a alteração. Tente de novo.")
      return false
    }
  }, [id])

  const gerarAlertas = async () => {
    setLoadingAlertas(true); setErroAlertas("")
    try {
      const res = await fetch(`/api/pacientes/${id}/alertas-ia`)
      const data = await res.json().catch(() => null) as { alertas?: AlertaIA[] } | null
      if (!res.ok || !Array.isArray(data?.alertas)) throw new Error(`HTTP ${res.status}`)
      const ordem = { alta: 0, media: 1, baixa: 2 }
      setAlertas([...data.alertas].sort((a, b) => ordem[a.urgencia] - ordem[b.urgencia]))
    } catch (e) {
      console.error("[paciente] alertas:", e)
      setErroAlertas("Não foi possível gerar os alertas agora. Tente de novo em instantes.")
    } finally { setLoadingAlertas(false) }
  }

  const salvarMetrica = (campo: MetricaCampo, v: number) => patch({ [campo]: v })

  const addMedicamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoMed.trim() || !pac) return
    const ok = await patch({ medicamentos: [...(pac.medicamentos ?? []), novoMed.trim()] })
    if (ok) { setNovoMed(""); setAddingMed(false) }
  }

  const removeMedicamento = (idx: number) => pac ? patch({ medicamentos: (pac.medicamentos ?? []).filter((_, i) => i !== idx) }) : Promise.resolve(false)

  const addExame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!exameForm.nome.trim() || !exameForm.valor.trim()) return
    setSavingExame(true); setErroExame("")
    try {
      const res = await fetch(`/api/pacientes/${id}/exames`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exameForm) })
      const data = await res.json().catch(() => null) as (Exame & { error?: string }) | null
      if (!res.ok || !data) { setErroExame(data?.error ?? "Não foi possível salvar o exame."); return }
      setExames(prev => [data, ...prev])
      setShowAddExame(false); setExameForm(FORM_VAZIO)
    } catch (err) {
      console.error("[paciente] addExame:", err)
      setErroExame("Erro de conexão. Tente de novo.")
    } finally { setSavingExame(false) }
  }

  const deleteExame = async (exameId: string): Promise<boolean> => {
    setAviso("")
    try {
      const res = await fetch(`/api/pacientes/${id}/exames?exameId=${encodeURIComponent(exameId)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setExames(prev => prev.filter(e => e.id !== exameId))
      return true
    } catch (e) {
      console.error("[paciente] deleteExame:", e)
      setAviso("Não foi possível excluir o exame.")
      return false
    }
  }

  const uploadFoto = async (file: File) => {
    setUploadingFoto(true); setAviso("")
    try {
      const form = new FormData(); form.append("file", file)
      const res = await fetch(`/api/pacientes/${id}/foto`, { method: "POST", body: form })
      const data = await res.json().catch(() => null) as { foto_url?: string | null; error?: string } | null
      if (!res.ok) { setAviso(data?.error ?? "Não foi possível enviar a foto."); return }
      setFotoSrc(data?.foto_url ?? null)
    } catch (e) {
      console.error("[paciente] uploadFoto:", e)
      setAviso("Erro de conexão ao enviar a foto.")
    } finally {
      setUploadingFoto(false)
      if (fotoInputRef.current) fotoInputRef.current.value = ""
    }
  }

  const importarPDF = async (file: File) => {
    setUploadingPDF(true); setAvisoPdf("")
    try {
      const form = new FormData(); form.append("file", file)
      const res = await fetch("/api/exames/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => null) as { exames?: Array<{ nome: string; valor: string; unidade?: string; referencia?: string; tendencia?: string }>; error?: string } | null
      if (!res.ok || !Array.isArray(data?.exames)) { setAvisoPdf(data?.error ?? "Não foi possível ler o PDF."); return }
      let ok = 0, falhas = 0
      for (const ex of data.exames) {
        const r = await fetch(`/api/pacientes/${id}/exames`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ex) })
        if (r.ok) ok++; else falhas++
      }
      const r = await fetch(`/api/pacientes/${id}`)
      if (r.ok) setExames(((await r.json()) as { exames?: Exame[] }).exames ?? [])
      setAvisoPdf(
        data.exames.length === 0 ? "Nenhum exame foi encontrado no PDF."
        : falhas === 0 ? `${ok} exame${ok > 1 ? "s" : ""} importado${ok > 1 ? "s" : ""}. Confira os valores antes de usar.`
        : `${ok} importado${ok !== 1 ? "s" : ""} e ${falhas} que não puderam ser salvo${falhas !== 1 ? "s" : ""}. Confira a lista.`
      )
    } catch (e) {
      console.error("[paciente] importarPDF:", e)
      setAvisoPdf("Erro ao importar o PDF.")
    } finally {
      setUploadingPDF(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ""
    }
  }

  const examesMarcados = exames.filter(e => e.tendencia === "up" || e.tendencia === "down")

  const porMes = useMemo(() => {
    const eventos: TimelineEvent[] = [
      ...historico.map(e => ({ kind: "consulta" as const, id: e.id, date: e.created_at, entry: e })),
      ...exames.map(e => ({ kind: "exame" as const, id: e.id, date: e.data_coleta ?? e.criado_em, exame: e })),
    ].sort((a, b) => parseDia(b.date).getTime() - parseDia(a.date).getTime())
    const grupos: { mes: string; eventos: TimelineEvent[] }[] = []
    for (const ev of eventos) {
      const raw = parseDia(ev.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      const mes = raw.charAt(0).toUpperCase() + raw.slice(1)
      const ultimo = grupos[grupos.length - 1]
      if (!ultimo || ultimo.mes !== mes) grupos.push({ mes, eventos: [ev] }); else ultimo.eventos.push(ev)
    }
    return { grupos, total: eventos.length }
  }, [historico, exames])

  const imc = pac ? calcIMC(pac.peso, pac.altura) : ""

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={loading ? "Paciente" : (pac?.nome ?? "Paciente")}
        caption="Ficha do paciente"
        back
        actions={pac ? (
          <>
            <PxButton variant="secondary" size="sm" leftIcon={Bot} href={`/copiloto?pacienteId=${id}`}>Copiloto</PxButton>
            <PxButton size="sm" leftIcon={Pill} href={`/prescricao?pacienteId=${id}`}>Prescrever</PxButton>
          </>
        ) : undefined}
      />

      <div className="space-y-4 px-4 pb-10 pt-4 md:px-10">
        {loading && <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando a ficha</p>}

        {naoEncontrado && (
          <Panel className="space-y-3 py-10 text-center">
            <p className="text-[15px] font-medium text-px-ink">Paciente não encontrado</p>
            <p className="text-[13.5px] text-px-muted">A ficha pode ter sido removida, ou o endereço está incorreto.</p>
            <div><PxButton variant="secondary" href="/pacientes">Voltar para pacientes</PxButton></div>
          </Panel>
        )}

        {erroCarga && (
          <Panel className="space-y-3 py-10 text-center">
            <p role="alert" className="text-[14px] text-px-danger">{erroCarga}</p>
            <div><PxButton onClick={load}>Tentar novamente</PxButton></div>
          </Panel>
        )}

        {aviso && <p role="alert" className={erroBox}>{aviso}</p>}

        {pac && (
          <>
            <Panel className="flex items-start gap-4">
              {fotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoSrc} alt={`Foto de ${pac.nome}`} className="h-20 w-20 shrink-0 rounded-full border border-px-line object-cover" />
              ) : (
                <span aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-px-ink text-[24px] font-semibold text-white">{initials(pac.nome)}</span>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-px-ink">
                  {pac.telefone && <span>{pac.telefone}</span>}
                  {pac.email && <span className="break-all">{pac.email}</span>}
                  {pac.data_nascimento && <span>{calcIdade(pac.data_nascimento)} ({fmtData(pac.data_nascimento)})</span>}
                  {!pac.telefone && !pac.email && !pac.data_nascimento && <span className="text-px-muted">Sem contato ou data de nascimento cadastrados.</span>}
                </p>
                {pac.observacao && <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-px-muted">{pac.observacao}</p>}
                <div>
                  <PxButton size="sm" variant="secondary" leftIcon={Camera} loading={uploadingFoto} onClick={() => fotoInputRef.current?.click()}>{fotoSrc ? "Trocar foto" : "Adicionar foto"}</PxButton>
                  <input ref={fotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Arquivo da foto do paciente" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f) }} />
                </div>
              </div>
            </Panel>

            <Secao titulo="Resumo clínico">
              <dl className="space-y-3 text-[13.5px]">
                <div>
                  <dt className="text-[12px] text-px-muted">Protocolo ativo</dt>
                  <dd className="text-px-ink">{pac.protocolo_ativo?.trim() ? pac.protocolo_ativo : <span className="text-px-muted">Nenhum registrado.</span>}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-px-muted">Medicamentos em uso</dt>
                  <dd className="text-px-ink">{(pac.medicamentos ?? []).length > 0 ? (pac.medicamentos ?? []).join(", ") : <span className="text-px-muted">Nenhum registrado.</span>}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-px-muted">Exames marcados como em alta ou em queda</dt>
                  <dd>
                    {examesMarcados.length > 0 ? (
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {examesMarcados.map(ex => <Tag key={ex.id} tone={ex.tendencia === "up" ? "warn" : "neutral"}>{ex.nome} {ex.valor}{ex.unidade ? ` ${ex.unidade}` : ""}, {ex.tendencia === "up" ? "em alta" : "em queda"}</Tag>)}
                      </span>
                    ) : <span className="text-px-muted">Nenhum exame marcado.</span>}
                  </dd>
                </div>
              </dl>
            </Secao>

            <Secao titulo="Alertas por IA" aside={<PxButton size="sm" variant="secondary" loading={loadingAlertas} onClick={gerarAlertas}>{alertas ? "Gerar de novo" : "Gerar alertas"}</PxButton>}>
              <p className="text-[12.5px] text-px-muted">Gerados por IA a partir do que está nesta ficha, sem o nome do paciente. São sugestões para conferir, não substituem o julgamento clínico e não ficam salvos.</p>
              {erroAlertas && <p role="alert" className={erroBox}>{erroAlertas}</p>}
              {alertas && alertas.length === 0 && <p className="text-[13.5px] text-px-ink">A IA não encontrou nada que mereça alerta com os dados disponíveis.</p>}
              {alertas && alertas.length > 0 && (
                <ul className="space-y-2">
                  {alertas.map((a, i) => (
                    <li key={i} className="rounded-px-card bg-white/70 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] font-medium text-px-ink">{a.titulo}</span>
                        <Tag tone={URGENCIA[a.urgencia]?.tone ?? "neutral"}>{URGENCIA[a.urgencia]?.label ?? "Informativo"}</Tag>
                      </div>
                      {a.descricao && <p className="mt-0.5 text-[13px] leading-relaxed text-px-ink">{a.descricao}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Secao>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {METRICAS.map(m => <Metrica key={m.campo} def={m} valor={pac[m.campo]} onSalvar={salvarMetrica} />)}
              <Panel className="space-y-2">
                <div className="text-[12.5px] text-px-muted">IMC</div>
                <div className="text-[24px] font-semibold leading-tight text-px-ink">{imc ? <>{imc} <span className="text-[13px] font-normal text-px-muted">kg/m²</span></> : <span className="text-px-muted">Sem dados</span>}</div>
                <p className="text-[12px] text-px-muted">Calculado de peso e altura.</p>
              </Panel>
            </div>

            <Secao titulo="Sexo biológico" aside={pac.sexo ? <PxButton size="sm" variant="quiet" onClick={() => patch({ sexo: null })}>Limpar</PxButton> : undefined}>
              <Segmented label="Sexo biológico" options={SEXOS} value={pac.sexo ?? ""} onChange={v => { if (pac.sexo !== v) patch({ sexo: v }) }} />
            </Secao>

            <Secao titulo="Medicamentos em uso">
              {(pac.medicamentos ?? []).length === 0 && !addingMed && <p className="text-[13.5px] text-px-muted">Nenhum medicamento cadastrado.</p>}
              {(pac.medicamentos ?? []).length > 0 && (
                <ul className="space-y-2">
                  {(pac.medicamentos ?? []).map((med, i) => <ItemMedicamento key={med + i} nome={med} onRemover={() => removeMedicamento(i)} />)}
                </ul>
              )}
              {addingMed ? (
                <form onSubmit={addMedicamento} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[220px] flex-1">
                    <Field label="Medicamento e posologia" htmlFor="novo-med">
                      <PxInput id="novo-med" autoFocus maxLength={200} value={novoMed} onChange={e => setNovoMed(e.target.value)} placeholder="Metformina 850 mg, 1 vez ao dia" />
                    </Field>
                  </div>
                  <PxButton type="submit" size="sm" disabled={!novoMed.trim()}>Adicionar</PxButton>
                  <PxButton type="button" size="sm" variant="quiet" onClick={() => { setAddingMed(false); setNovoMed("") }}>Cancelar</PxButton>
                </form>
              ) : <div><PxButton size="sm" variant="secondary" leftIcon={Plus} onClick={() => setAddingMed(true)}>Adicionar medicamento</PxButton></div>}
            </Secao>

            <Secao titulo="Exames recentes" aside={exames.length >= 20 ? <span className="text-[12.5px] text-px-muted">Mostrando os 20 mais recentes</span> : undefined}>
              {exames.length > 0 && (
                <div className="overflow-x-auto rounded-px-card bg-white/70">
                  <table className="w-full min-w-[640px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-px-line text-[12px] text-px-muted">
                        <th scope="col" className="px-4 py-2.5 font-medium">Exame</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Valor</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Referência</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Tendência</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Coleta</th>
                        <th scope="col" className="px-3 py-2.5"><span className="sr-only">Ações</span></th>
                      </tr>
                    </thead>
                    <tbody>{exames.map(ex => <LinhaExame key={ex.id} ex={ex} onExcluir={() => deleteExame(ex.id)} />)}</tbody>
                  </table>
                </div>
              )}
              {exames.length === 0 && !showAddExame && <p className="text-[13.5px] text-px-muted">Nenhum exame registrado.</p>}

              {showAddExame && (
                <form onSubmit={addExame} className="space-y-3 rounded-px-card bg-white/70 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Nome" htmlFor="ex-nome"><PxInput id="ex-nome" required maxLength={120} value={exameForm.nome} onChange={e => setExameForm(p => ({ ...p, nome: e.target.value }))} placeholder="HbA1c, TSH, Peso" /></Field>
                    <Field label="Valor" htmlFor="ex-valor"><PxInput id="ex-valor" required maxLength={60} value={exameForm.valor} onChange={e => setExameForm(p => ({ ...p, valor: e.target.value }))} placeholder="6,2" /></Field>
                    <Field label="Unidade" htmlFor="ex-un"><PxInput id="ex-un" maxLength={30} value={exameForm.unidade} onChange={e => setExameForm(p => ({ ...p, unidade: e.target.value }))} placeholder="%" /></Field>
                    <Field label="Referência" htmlFor="ex-ref"><PxInput id="ex-ref" maxLength={80} value={exameForm.referencia} onChange={e => setExameForm(p => ({ ...p, referencia: e.target.value }))} placeholder="Abaixo de 7" /></Field>
                    <Field label="Data da coleta" htmlFor="ex-data"><PxInput id="ex-data" type="date" value={exameForm.data_coleta} onChange={e => setExameForm(p => ({ ...p, data_coleta: e.target.value }))} /></Field>
                    <Field label="Tendência" htmlFor="ex-tend">
                      <PxSelect id="ex-tend" value={exameForm.tendencia} onChange={e => setExameForm(p => ({ ...p, tendencia: e.target.value }))}>
                        {TENDENCIAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </PxSelect>
                    </Field>
                  </div>
                  {erroExame && <p role="alert" className={erroBox}>{erroExame}</p>}
                  <div className="flex gap-2">
                    <PxButton type="submit" size="sm" loading={savingExame} disabled={!exameForm.nome.trim() || !exameForm.valor.trim()}>Salvar exame</PxButton>
                    <PxButton type="button" size="sm" variant="quiet" disabled={savingExame} onClick={() => { setShowAddExame(false); setErroExame("") }}>Cancelar</PxButton>
                  </div>
                </form>
              )}

              {!showAddExame && (
                <div className="flex flex-wrap gap-2">
                  <PxButton size="sm" variant="secondary" leftIcon={Plus} onClick={() => setShowAddExame(true)}>Adicionar exame</PxButton>
                  <PxButton size="sm" variant="secondary" leftIcon={FileUp} loading={uploadingPDF} onClick={() => pdfInputRef.current?.click()}>{uploadingPDF ? "Extraindo" : "Importar PDF"}</PxButton>
                  <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" aria-label="Arquivo PDF de exames" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importarPDF(f) }} />
                </div>
              )}
              {avisoPdf && <p role="status" className="text-[13px] text-px-ink">{avisoPdf}</p>}
            </Secao>

            <Secao titulo="Evolução de peso">
              <GraficoPeso exames={exames} />
            </Secao>

            <Secao titulo="Linha do tempo" aside={porMes.total > 0 ? <span className="text-[12.5px] text-px-muted">{porMes.total} evento{porMes.total !== 1 ? "s" : ""}</span> : undefined}>
              {porMes.total === 0 ? (
                <p className="text-[13.5px] text-px-muted">Nenhuma consulta ou exame registrado para este paciente.</p>
              ) : (
                <>
                  <p className="text-[12.5px] text-px-muted">As consultas são buscadas pelo nome do paciente no histórico do Copiloto. Pacientes com o mesmo nome compartilham o histórico.</p>
                  <div className="space-y-5">
                    {porMes.grupos.map(g => (
                      <div key={g.mes}>
                        <h3 className="mb-2 text-[12.5px] font-medium text-px-muted">{g.mes}</h3>
                        <ul className="space-y-2">
                          {g.eventos.map(ev => (
                            <li key={ev.kind + ev.id}>
                              {ev.kind === "consulta" ? <EventoConsulta entry={ev.entry} pacienteId={id} /> : (
                                <p className="flex flex-wrap items-baseline gap-x-2 px-1 text-[13px] text-px-ink">
                                  <span className="font-medium">{ev.exame.nome}</span>
                                  <span className="tabular-nums">{ev.exame.valor}{ev.exame.unidade ? ` ${ev.exame.unidade}` : ""}</span>
                                  {ev.exame.referencia && <span className="text-px-muted">referência {ev.exame.referencia}</span>}
                                  <span className="text-px-muted">Coleta em {fmtData(ev.exame.data_coleta ?? ev.exame.criado_em)}</span>
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Secao>

            <div className="grid gap-4 md:grid-cols-2">
              <EditorTexto titulo="Pendências" valor={pac.pendencias ?? ""} vazio="Exames pendentes, encaminhamentos, retorno." onSalvar={v => patch({ pendencias: v })} />
              <EditorTexto titulo="Protocolo ativo" valor={pac.protocolo_ativo ?? ""} vazio="Protocolo de tratamento em andamento." onSalvar={v => patch({ protocolo_ativo: v })} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
