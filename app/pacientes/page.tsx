"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { EmptyState } from "@/components/EmptyState"
import { cn } from "@/lib/utils"
import {
  Users, Search, Plus, X, Loader2, Bot, Calendar,
  FileText, Phone, Mail, User, ChevronRight, Check,
  AlertCircle, ClipboardList, RefreshCw, Trash2, Database,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Paciente {
  [key: string]: unknown
  _fonte?: string
}

// ── Field accessors (handles PascalCase and camelCase from MedX) ───────────────

function get(p: Paciente, ...keys: string[]): string {
  for (const k of keys) {
    if (p[k] != null && p[k] !== "") return String(p[k])
  }
  return ""
}

function getPacId(p: Paciente)       { return get(p, "Id", "id", "IdContato", "idContato") }
function getPacNome(p: Paciente)     { return get(p, "Nome", "nome", "NomeCompleto", "nomeCompleto") || "—" }
function getPacTelefone(p: Paciente) { return get(p, "Telefone", "telefone", "Celular", "celular", "Fone", "fone") }
function getPacEmail(p: Paciente)    { return get(p, "Email", "email") }
function getPacNasc(p: Paciente)     { return get(p, "DataNascimento", "dataNascimento", "DataNasc", "dataNasc") }
function getPacObs(p: Paciente)      { return get(p, "Observacao", "observacao", "Obs", "obs") }
function getPacUltConsulta(p: Paciente) { return get(p, "UltimaConsulta", "ultimaConsulta", "DataUltimaConsulta") }

function fmtDate(s: string): string {
  if (!s) return ""
  const d = s.split("T")[0]
  return d.split("-").reverse().join("/")
}

function calcIdade(nasc: string): string {
  if (!nasc) return ""
  const nascDate = new Date(nasc)
  if (isNaN(nascDate.getTime())) return ""
  const anos = Math.floor((Date.now() - nascDate.getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${anos} anos`
}

// Deterministic color from name string
const AVATAR_COLORS = [
  ["bg-blue-500/20  text-blue-400",    "#60a5fa"],
  ["bg-purple-500/20 text-purple-400", "#c084fc"],
  ["bg-emerald-500/20 text-emerald-400","#34d399"],
  ["bg-amber-500/20  text-amber-400",  "#fbbf24"],
  ["bg-pink-500/20   text-pink-400",   "#f472b6"],
  ["bg-cyan-500/20   text-cyan-400",   "#22d3ee"],
  ["bg-orange-500/20 text-orange-400", "#fb923c"],
]

function avatarColor(nome: string): string {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length][0]
}

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PacientesPage() {
  const router = useRouter()

  const [lista,       setLista]       = useState<Paciente[]>([])
  const [resultados,  setResultados]  = useState<Paciente[]>([])
  const [loading,     setLoading]     = useState(false)
  const [searching,   setSearching]   = useState(false)
  const [query,       setQuery]       = useState("")
  const [error,       setError]       = useState("")

  // Drawer state
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [drawerPac,      setDrawerPac]      = useState<Paciente | null>(null)
  const [drawerDetail,   setDrawerDetail]   = useState<Paciente | null>(null)
  const [drawerLoading,  setDrawerLoading]  = useState(false)

  // Prontuário form
  const [prontuarioText,  setProntuarioText]  = useState("")
  const [prontuarioSaving, setProntuarioSaving] = useState(false)
  const [prontuarioOk,    setProntuarioOk]    = useState(false)
  const [prontuarioError, setProntuarioError] = useState("")

  // Delete local patient
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deletePaciente = async (pac: Paciente, e: React.MouseEvent) => {
    e.stopPropagation()
    const id = getPacId(pac)
    if (!id || pac._fonte !== "local") return
    if (!confirm(`Excluir ${getPacNome(pac)}? Esta ação não pode ser desfeita.`)) return
    setDeletingId(id)
    try {
      await fetch(`/api/pacientes?id=${id}`, { method: "DELETE" })
      setLista(l => l.filter(p => getPacId(p) !== id))
      setResultados(r => r.filter(p => getPacId(p) !== id))
    } catch (e) { console.error("[pacientes] erro ao deletar paciente:", e) }
    finally { setDeletingId(null) }
  }

  // Novo paciente modal
  const [novoOpen,   setNovoOpen]   = useState(false)
  const [novoForm,   setNovoForm]   = useState({
    Nome:              "",
    Telefone:          "",
    Email:             "",
    DataNascimento:    "",
    Observacao:        "",
  })
  const [novoSaving, setNovoSaving] = useState(false)
  const [novoError,  setNovoError]  = useState("")
  const [novoOk,     setNovoOk]     = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load initial list ────────────────────────────────────────────────────────

  const fetchLista = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/pacientes?action=list")
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setLista(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLista() }, [fetchLista])

  // ── Live search ──────────────────────────────────────────────────────────────

  const handleSearch = (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResultados([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResultados(Array.isArray(data) ? data : [])
      } catch (e) { console.error("[pacientes] erro na busca de pacientes:", e) }
      finally { setSearching(false) }
    }, 400)
  }

  const exibidos = query.trim() ? resultados : lista

  // ── Open drawer ──────────────────────────────────────────────────────────────

  const openDrawer = async (pac: Paciente) => {
    setDrawerPac(pac)
    setDrawerDetail(null)
    setDrawerOpen(true)
    setProntuarioText("")
    setProntuarioOk(false)
    setProntuarioError("")

    const id = getPacId(pac)
    if (!id) return
    setDrawerLoading(true)
    try {
      const res  = await fetch(`/api/pacientes?action=get&id=${id}`)
      if (!res.ok) return
      const data = await res.json()
      setDrawerDetail(data && typeof data === "object" && !Array.isArray(data) ? data : null)
    } catch (e) { console.error("[pacientes] erro ao carregar detalhes do paciente:", e) }
    finally { setDrawerLoading(false) }
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerPac(null)
    setDrawerDetail(null)
  }

  // ── Save prontuário ──────────────────────────────────────────────────────────

  const salvarProntuario = async () => {
    const pac = drawerDetail ?? drawerPac
    if (!pac || !prontuarioText.trim()) return
    const idCliente = getPacId(pac)
    if (!idCliente) { setProntuarioError("ID do paciente não encontrado."); return }

    setProntuarioSaving(true)
    setProntuarioError("")
    try {
      const res = await fetch("/api/pacientes?action=prontuario", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ historico: prontuarioText, idCliente }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`)
      }
      setProntuarioOk(true)
      setProntuarioText("")
      setTimeout(() => setProntuarioOk(false), 3000)
    } catch (e) {
      setProntuarioError(e instanceof Error ? e.message : String(e))
    } finally {
      setProntuarioSaving(false)
    }
  }

  // ── Novo paciente ────────────────────────────────────────────────────────────

  const salvarNovo = async () => {
    if (!novoForm.Nome.trim()) { setNovoError("Nome é obrigatório."); return }
    setNovoSaving(true)
    setNovoError("")
    try {
      const res = await fetch("/api/pacientes?action=contato", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(novoForm),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`)
      }
      setNovoOk(true)
      setTimeout(() => {
        setNovoOpen(false)
        setNovoOk(false)
        setNovoForm({ Nome: "", Telefone: "", Email: "", DataNascimento: "", Observacao: "" })
        fetchLista()
      }, 1500)
    } catch (e) {
      setNovoError(e instanceof Error ? e.message : String(e))
    } finally {
      setNovoSaving(false)
    }
  }

  const pacDetail = drawerDetail ?? drawerPac

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gestão de Pacientes"
        subtitle="ALA CLÍNICA · MEDX"
        actions={
          <div className="flex items-center gap-2">
            {/* Live search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              {searching
                ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
                : query && <button
                    onClick={() => handleSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
              }
              <input
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Buscar paciente..."
                className="w-56 bg-surface border border-border rounded-lg pl-9 pr-8 py-1.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
              />
            </div>

            <button
              onClick={fetchLista}
              disabled={loading}
              className="flex items-center gap-1.5 text-[11px] border border-border text-text-secondary rounded-lg px-3 py-1.5 hover:border-border-hover transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>

            <button
              onClick={() => { setNovoOpen(true); setNovoError(""); setNovoOk(false) }}
              className="flex items-center gap-1.5 text-[11px] bg-blue-500 text-white font-semibold rounded-lg px-3 py-1.5 hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Paciente
            </button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="Total de Pacientes"
            value={loading ? "…" : lista.length}
            sub="cadastrados no MedX"
            icon={Users}
            accent="blue"
          />
          <StatCard
            label="Resultados"
            value={query ? (searching ? "…" : resultados.length) : lista.length}
            sub={query ? `para "${query}"` : "todos"}
            icon={Search}
            accent="blue"
          />
          <StatCard
            label="Fonte"
            value={lista[0]?._fonte === "local" ? "Local" : "MedX"}
            sub={lista[0]?._fonte === "local" ? "banco local Supabase" : "integração em tempo real"}
            icon={lista[0]?._fonte === "local" ? Database : ClipboardList}
            accent="amber"
          />
        </div>

        {/* Mobile search */}
        <div className="relative md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          {searching
            ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted animate-spin" />
            : query && <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
          }
          <input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar paciente pelo nome..."
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-8 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Patient list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-surface border border-border shimmer" />
            ))}
          </div>
        ) : exibidos.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            subtitle={
              query
                ? `Não encontramos resultados para "${query}". Tente um nome diferente.`
                : "Os pacientes cadastrados no MedX aparecerão aqui."
            }
            action={query ? { label: "Limpar busca", onClick: () => handleSearch("") } : undefined}
          />
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[1fr_160px_200px_140px_40px] gap-4 px-5 py-2.5 border-b border-border">
              {["Paciente", "Telefone", "E-mail", "Última Consulta", ""].map(h => (
                <span key={h} className="text-[9px] font-mono text-text-muted uppercase tracking-widest">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-border">
              {exibidos.map((pac, i) => {
                const nome   = getPacNome(pac)
                const tel    = getPacTelefone(pac)
                const email  = getPacEmail(pac)
                const ultima = getPacUltConsulta(pac)
                const nasc   = getPacNasc(pac)
                const ini    = initials(nome)
                const aColor = avatarColor(nome)

                return (
                  <button
                    key={i}
                    onClick={() => pac._fonte === "local" ? router.push(`/pacientes/${getPacId(pac)}`) : openDrawer(pac)}
                    className="w-full text-left px-5 py-3.5 hover:bg-blue-500/[0.03] hover:border-l-2 hover:border-l-blue-500/40 transition-all group flex items-center gap-4 md:grid md:grid-cols-[1fr_160px_200px_140px_40px]"
                  >
                    {/* Avatar + Nome */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                        aColor
                      )}>
                        {ini}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-text-primary truncate">{nome}</span>
                          {pac._fonte === "local" ? (
                            <span className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full border bg-amber-50 border-amber-200 text-amber-700 flex-shrink-0">LOCAL</span>
                          ) : (
                            <span className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-700 flex-shrink-0">MEDX</span>
                          )}
                        </div>
                        {nasc && (
                          <div className="text-[10px] text-text-muted mt-0.5">{calcIdade(nasc)}</div>
                        )}
                        {/* Mobile: show tel/email below name */}
                        <div className="md:hidden flex gap-3 mt-0.5">
                          {tel  && <span className="text-[10px] text-text-muted">{tel}</span>}
                          {email && <span className="text-[10px] text-text-muted truncate">{email}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Telefone */}
                    <div className="hidden md:flex items-center gap-1.5 min-w-0">
                      {tel ? (
                        <>
                          <Phone className="w-3 h-3 text-text-muted flex-shrink-0" />
                          <span className="text-[12px] text-text-secondary truncate">{tel}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-text-muted">—</span>
                      )}
                    </div>

                    {/* E-mail */}
                    <div className="hidden md:flex items-center gap-1.5 min-w-0">
                      {email ? (
                        <>
                          <Mail className="w-3 h-3 text-text-muted flex-shrink-0" />
                          <span className="text-[12px] text-text-secondary truncate">{email}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-text-muted">—</span>
                      )}
                    </div>

                    {/* Última consulta */}
                    <div className="hidden md:block">
                      {ultima ? (
                        <span className="text-[11px] font-mono text-text-muted">{fmtDate(ultima)}</span>
                      ) : (
                        <span className="text-[11px] text-text-muted">—</span>
                      )}
                    </div>

                    {/* Arrow / Delete */}
                    <div className="flex items-center justify-end gap-1">
                      {pac._fonte === "local" && (
                        <button
                          onClick={e => deletePaciente(pac, e)}
                          disabled={deletingId === getPacId(pac)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          {deletingId === getPacId(pac)
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer count */}
            <div className="px-5 py-2.5 border-t border-border">
              <span className="text-[10px] font-mono text-text-muted">
                {exibidos.length} paciente{exibidos.length !== 1 ? "s" : ""}
                {query && ` · busca: "${query}"`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── DRAWER ─────────────────────────────────────────────────────────────── */}

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={closeDrawer}
        />
      )}

      {/* Side panel */}
      <div className={cn(
        "fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-300",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {pacDetail && (
          <>
            {/* Drawer header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0",
                    avatarColor(getPacNome(pacDetail))
                  )}>
                    {initials(getPacNome(pacDetail))}
                  </div>
                  <div className="min-w-0">
                    <h2
                      className="text-[17px] font-semibold text-text-primary truncate"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      {getPacNome(pacDetail)}
                    </h2>
                    {getPacId(pacDetail) && (
                      <div className="text-[10px] font-mono text-text-muted mt-0.5">
                        #{getPacId(pacDetail)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => router.push(`/copiloto?pacienteId=${getPacId(pacDetail)}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/12 border border-blue-500/30 text-blue-400 text-[11px] font-semibold rounded-lg py-2 hover:bg-blue-500/20 transition-all"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Copiloto
                </button>
                <button
                  onClick={() => router.push("/agenda")}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-border text-text-secondary text-[11px] font-semibold rounded-lg py-2 hover:border-border-hover transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Ver Agenda
                </button>
              </div>
            </div>

            {/* Drawer body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {drawerLoading ? (
                <div className="p-6 space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-10 rounded-lg bg-surface-2 shimmer" />
                  ))}
                </div>
              ) : (
                <div className="p-6 space-y-6">

                  {/* Dados pessoais */}
                  <section>
                    <SectionTitle icon={User}>Dados Pessoais</SectionTitle>
                    <div className="space-y-2 mt-3">
                      {getPacNasc(pacDetail) && (
                        <DetailRow label="Nascimento">
                          {fmtDate(getPacNasc(pacDetail))}
                          {calcIdade(getPacNasc(pacDetail)) && (
                            <span className="ml-2 text-[10px] text-text-muted">
                              ({calcIdade(getPacNasc(pacDetail))})
                            </span>
                          )}
                        </DetailRow>
                      )}
                      {getPacTelefone(pacDetail) && (
                        <DetailRow label="Telefone" icon={Phone}>
                          {getPacTelefone(pacDetail)}
                        </DetailRow>
                      )}
                      {getPacEmail(pacDetail) && (
                        <DetailRow label="E-mail" icon={Mail}>
                          {getPacEmail(pacDetail)}
                        </DetailRow>
                      )}
                      {getPacUltConsulta(pacDetail) && (
                        <DetailRow label="Última Consulta">
                          {fmtDate(getPacUltConsulta(pacDetail))}
                        </DetailRow>
                      )}
                      {getPacObs(pacDetail) && (
                        <DetailRow label="Observações">
                          {getPacObs(pacDetail)}
                        </DetailRow>
                      )}
                      {/* Extra fields from MedX not explicitly handled */}
                      {Object.entries(pacDetail)
                        .filter(([k]) => ![
                          "Id","id","IdContato","idContato",
                          "Nome","nome","NomeCompleto","nomeCompleto",
                          "Telefone","telefone","Celular","celular","Fone","fone",
                          "Email","email",
                          "DataNascimento","dataNascimento","DataNasc","dataNasc",
                          "Observacao","observacao","Obs","obs",
                          "UltimaConsulta","ultimaConsulta","DataUltimaConsulta",
                        ].includes(k))
                        .filter(([, v]) => v != null && v !== "" && typeof v !== "object")
                        .slice(0, 8)
                        .map(([k, v]) => (
                          <DetailRow key={k} label={k.replace(/([A-Z])/g, " $1").trim()}>
                            {String(v)}
                          </DetailRow>
                        ))
                      }
                    </div>
                  </section>

                  {/* Adicionar ao prontuário */}
                  <section>
                    <SectionTitle icon={FileText}>Adicionar ao Prontuário</SectionTitle>
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={prontuarioText}
                        onChange={e => setProntuarioText(e.target.value)}
                        rows={4}
                        placeholder="Digite a anotação clínica, evolução ou observação..."
                        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors"
                      />
                      {prontuarioError && (
                        <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                          {prontuarioError}
                        </div>
                      )}
                      <button
                        onClick={salvarProntuario}
                        disabled={prontuarioSaving || !prontuarioText.trim()}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-2.5 transition-all",
                          prontuarioOk
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                        )}
                      >
                        {prontuarioSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : prontuarioOk ? (
                          <><Check className="w-3.5 h-3.5" /> Prontuário salvo!</>
                        ) : (
                          <><ClipboardList className="w-3.5 h-3.5" /> Salvar no Prontuário</>
                        )}
                      </button>
                    </div>
                  </section>

                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── NOVO PACIENTE MODAL ─────────────────────────────────────────────────── */}

      {novoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setNovoOpen(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <span
                className="text-[15px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Novo Paciente
              </span>
              <button
                onClick={() => setNovoOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">

              <div>
                <label className="label-mono">Nome *</label>
                <input
                  value={novoForm.Nome}
                  onChange={e => setNovoForm(f => ({ ...f, Nome: e.target.value }))}
                  placeholder="Nome completo do paciente"
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label-mono">Telefone</label>
                  <input
                    value={novoForm.Telefone}
                    onChange={e => setNovoForm(f => ({ ...f, Telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-mono">Data de Nascimento</label>
                  <input
                    type="date"
                    value={novoForm.DataNascimento}
                    onChange={e => setNovoForm(f => ({ ...f, DataNascimento: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="label-mono">E-mail</label>
                <input
                  type="email"
                  value={novoForm.Email}
                  onChange={e => setNovoForm(f => ({ ...f, Email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="input-base"
                />
              </div>

              <div>
                <label className="label-mono">Observações</label>
                <textarea
                  rows={3}
                  value={novoForm.Observacao}
                  onChange={e => setNovoForm(f => ({ ...f, Observacao: e.target.value }))}
                  placeholder="Informações adicionais..."
                  className="input-base resize-none"
                />
              </div>

              {novoError && (
                <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {novoError}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setNovoOpen(false)}
                className="px-4 py-2.5 rounded-xl text-[12px] text-text-muted border border-border hover:border-border-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNovo}
                disabled={novoSaving || novoOk || !novoForm.Nome.trim()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-2.5 transition-all",
                  novoOk
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40"
                )}
              >
                {novoSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : novoOk ? (
                  <><Check className="w-3.5 h-3.5" /> Paciente cadastrado!</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> Cadastrar Paciente</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
      <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{children}</span>
    </div>
  )
}

function DetailRow({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 text-[12px]">
      <div className="flex items-center gap-1 text-text-muted w-28 flex-shrink-0 pt-0.5">
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <span className="text-text-secondary flex-1 min-w-0">{children}</span>
    </div>
  )
}
