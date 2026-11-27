"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Panel, PxButton, Segmented, Tag, Field, PxInput, PxModal, PageHeader } from "@/components/px"
import { cn } from "@/lib/utils"
import { calcIdadeAnos, bucketConsulta } from "@/lib/pacientes-helpers"
import {
  Search, Plus, X, Loader2, Bot, Calendar,
  FileText, Phone, Mail, User, ChevronRight, Check,
  AlertCircle, ClipboardList, RefreshCw, Trash2, Sparkles,
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
  const [linkingId,  setLinkingId]  = useState<string | null>(null)

  // MedX → local: find-or-create then navigate to dashboard
  const handleMedXClick = useCallback(async (pac: Paciente) => {
    const key = getPacId(pac) || getPacNome(pac)
    setLinkingId(key)
    try {
      const res = await fetch("/api/pacientes?action=medx-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:            getPacNome(pac),
          telefone:        getPacTelefone(pac),
          email:           getPacEmail(pac),
          dataNascimento:  getPacNasc(pac),
        }),
      })
      if (!res.ok) throw new Error("link falhou")
      const data = await res.json() as { id: string }
      router.push(`/pacientes/${data.id}`)
    } catch {
      openDrawer(pac)
    } finally {
      setLinkingId(null)
    }
  }, [router])  // openDrawer is defined below but stable

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

  // Semantic search
  const [semanticMode,        setSemanticMode]        = useState(false)
  const [semanticQuery,       setSemanticQuery]       = useState("")
  const [semanticLoading,     setSemanticLoading]     = useState(false)
  const [semanticResults,     setSemanticResults]     = useState<Paciente[]>([])
  const [semanticExplanation, setSemanticExplanation] = useState("")

  const [filtroIdade,      setFiltroIdade]      = useState("")
  const [filtroConsulta,   setFiltroConsulta]   = useState("")
  const [historicoMap,     setHistoricoMap]      = useState<Record<string, string>>({})
  const [historicoLoading, setHistoricoLoading]  = useState(false)

  const runSemanticSearch = useCallback(async () => {
    if (!semanticQuery.trim()) return
    setSemanticLoading(true)
    setSemanticResults([])
    setSemanticExplanation("")
    try {
      const res = await fetch("/api/pacientes/buscar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: semanticQuery }),
      })
      const data = await res.json() as { patients: Paciente[]; explanation: string }
      setSemanticResults(data.patients ?? [])
      setSemanticExplanation(data.explanation ?? "")
    } catch (e) {
      console.error("[buscar semântico]", e)
    } finally {
      setSemanticLoading(false)
    }
  }, [semanticQuery])

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

  useEffect(() => {
    setHistoricoLoading(true)
    fetch("/api/pacientes/historico-datas")
      .then(r => r.ok ? r.json() : {})
      .then((d: unknown) => setHistoricoMap(d && typeof d === "object" ? d as Record<string, string> : {}))
      .catch(() => {})
      .finally(() => setHistoricoLoading(false))
  }, [])

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

  const base = semanticMode
    ? semanticResults
    : (query.trim() ? resultados : lista)

  const exibidos = useMemo(() => base.filter(pac => {
    if (filtroIdade) {
      const anos = calcIdadeAnos(getPacNasc(pac))
      if (anos === null) return false
      if (filtroIdade === "0-18"  && anos > 18)                return false
      if (filtroIdade === "19-40" && (anos < 19 || anos > 40)) return false
      if (filtroIdade === "41-60" && (anos < 41 || anos > 60)) return false
      if (filtroIdade === "60+"   && anos <= 60)               return false
    }
    if (filtroConsulta) {
      const key = getPacNome(pac).toLowerCase().trim()
      if (bucketConsulta(historicoMap[key] ?? null) !== filtroConsulta) return false
    }
    return true
  }), [base, filtroIdade, filtroConsulta, historicoMap])

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
  const temFiltro = Boolean(query || filtroIdade || filtroConsulta)
  const textarea = "w-full rounded-px-ctl border border-px-line bg-white px-3.5 py-3 text-[13.5px] text-px-ink placeholder:text-px-muted resize-none"

  const buscaDesktop = (
    <div className="relative hidden md:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-px-muted" aria-hidden="true" />
      <PxInput
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Buscar paciente"
        aria-label="Buscar paciente pelo nome"
        className="w-64 pl-10 pr-10"
      />
      {searching ? (
        <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-px-muted" aria-hidden="true" />
      ) : query ? (
        <button type="button" onClick={() => handleSearch("")} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-px-muted hover:bg-px-ink/10">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="px px-ambient min-h-screen animate-fade-in">
      <PageHeader
        title="Pacientes"
        caption="MedX e banco local"
        actions={
          <>
            {buscaDesktop}
            <PxButton
                variant={semanticMode ? "primary" : "secondary"}
                leftIcon={Sparkles}
                onClick={() => { setSemanticMode(m => !m); setSemanticResults([]); setSemanticExplanation("") }}
              >
                Busca com IA
              </PxButton>
            <PxButton variant="secondary" leftIcon={RefreshCw} loading={loading} onClick={fetchLista} aria-label="Atualizar lista">Atualizar</PxButton>
            <PxButton leftIcon={Plus} onClick={() => { setNovoOpen(true); setNovoError(""); setNovoOk(false) }}>Novo paciente</PxButton>
          </>
        }
      />

      <div className="space-y-4 px-4 pb-10 pt-4 md:px-10">

        {/* Quantos pacientes, e quantos estão na tela */}
        <Panel tone="dark" aria-label="Resumo">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <dt className="text-[13px] text-white">Cadastrados</dt>
              <dd className="mt-1 text-[34px] font-medium leading-none tracking-[-0.02em] tabular-nums text-white">{loading ? "…" : lista.length}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-white">{temFiltro ? "Na busca ou filtro" : "Na lista"}</dt>
              <dd className="mt-1 text-[34px] font-medium leading-none tracking-[-0.02em] tabular-nums text-white">{loading || searching ? "…" : exibidos.length}</dd>
            </div>
            <div className="col-span-2 md:col-span-1">
              <dt className="text-[13px] text-white">Origem dos dados</dt>
              <dd className="mt-2 text-[15px] font-semibold text-white">{lista[0]?._fonte === "local" ? "Banco local" : "MedX, em tempo real"}</dd>
            </div>
          </dl>
        </Panel>

        {/* Busca semântica */}
        {semanticMode && (
          <Panel tone="light" aria-label="Busca com IA">
            <h2 className="mb-3 text-[15px] font-semibold text-px-ink">Busca com IA</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <PxInput
                value={semanticQuery}
                onChange={e => setSemanticQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runSemanticSearch()}
                placeholder="Ex.: pacientes com HbA1c acima de 7, inativos há mais de 6 meses"
                aria-label="Descreva os pacientes que procura"
                className="flex-1"
              />
              <PxButton leftIcon={Search} loading={semanticLoading} disabled={!semanticQuery.trim()} onClick={runSemanticSearch}>
                {semanticLoading ? "Buscando" : "Buscar"}
              </PxButton>
            </div>
            {semanticExplanation && <p className="mt-3 text-[13px] text-px-muted">{semanticExplanation}</p>}
            {!semanticLoading && semanticResults.length === 0 && semanticExplanation && (
              <p className="mt-2 text-[13px] text-px-ink">Nenhum paciente encontrado para esta busca.</p>
            )}
          </Panel>
        )}

        {/* Busca no celular */}
        <div className="relative md:hidden">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-px-muted" aria-hidden="true" />
          <PxInput value={query} onChange={e => handleSearch(e.target.value)} placeholder="Buscar paciente pelo nome" aria-label="Buscar paciente pelo nome" className="bg-white/90 pl-10 pr-10" />
          {query ? (
            <button type="button" onClick={() => handleSearch("")} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-px-muted hover:bg-px-ink/10">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Filtros */}
        {!semanticMode && (
          <Panel tone="light" aria-label="Filtros" className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-32 text-[13px] font-medium text-px-ink">Idade</span>
              <Segmented
                label="Filtrar por idade"
                value={filtroIdade}
                onChange={setFiltroIdade}
                options={[
                  { value: "", label: "Todas" },
                  { value: "0-18", label: "0 a 18" },
                  { value: "19-40", label: "19 a 40" },
                  { value: "41-60", label: "41 a 60" },
                  { value: "60+", label: "Mais de 60" },
                ]}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-32 text-[13px] font-medium text-px-ink">Última consulta</span>
              <Segmented
                label="Filtrar por tempo desde a última consulta"
                value={filtroConsulta}
                onChange={v => { if (!historicoLoading) setFiltroConsulta(v) }}
                options={[
                  { value: "", label: "Todas" },
                  { value: "0-30", label: "Até 30 dias" },
                  { value: "31-90", label: "31 a 90 dias" },
                  { value: "91-180", label: "91 a 180 dias" },
                  { value: "180+", label: "Mais de 180 dias" },
                  { value: "nunca", label: "Nunca" },
                ]}
              />
              {historicoLoading && <Loader2 className="h-4 w-4 animate-spin text-px-muted" aria-label="Carregando histórico" />}
            </div>
          </Panel>
        )}

        {error && (
          <Panel tone="strong" role="alert" className="flex items-center gap-2 border border-px-danger/30">
            <AlertCircle className="h-4 w-4 shrink-0 text-px-danger" aria-hidden="true" />
            <span className="text-[14px] font-medium text-px-danger">{error}</span>
          </Panel>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[68px] rounded-px-card bg-white/50 shimmer" />)}
          </div>
        ) : exibidos.length === 0 ? (
          <Panel tone="light" className="py-10 text-center">
            <p className="text-[16px] font-semibold text-px-ink">{temFiltro ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}</p>
            <p className="mx-auto mt-1 max-w-sm text-[14px] text-px-muted">
              {query
                ? `Não encontramos resultados para "${query}". Tente um nome diferente.`
                : (filtroIdade || filtroConsulta)
                  ? "Nenhum paciente corresponde aos filtros selecionados."
                  : "Os pacientes cadastrados no MedX aparecerão aqui."}
            </p>
            {temFiltro && (
              <div className="mt-4 flex justify-center">
                <PxButton variant="secondary" onClick={() => { handleSearch(""); setFiltroIdade(""); setFiltroConsulta("") }}>Limpar filtros</PxButton>
              </div>
            )}
          </Panel>
        ) : (
          <Panel tone="light" className="overflow-hidden p-0">
            <div className="hidden grid-cols-[1fr_170px_220px_140px_96px] gap-4 border-b border-px-line px-5 py-3 text-[12.5px] font-medium text-px-muted md:grid">
              <span>Paciente</span><span>Telefone</span><span>E-mail</span><span>Última consulta</span><span />
            </div>
            <ul className="divide-y divide-px-line">
              {exibidos.map((pac, i) => {
                const nome   = getPacNome(pac)
                const tel    = getPacTelefone(pac)
                const email  = getPacEmail(pac)
                const ultima = getPacUltConsulta(pac)
                const nasc   = getPacNasc(pac)
                const id     = getPacId(pac)
                const local  = pac._fonte === "local"
                const abrir  = () => (local ? router.push(`/pacientes/${id}`) : handleMedXClick(pac))
                const ocupado = linkingId === (id || nome)
                return (
                  <li key={i} className="group flex items-center gap-2 pr-3 hover:bg-white/60 md:grid md:grid-cols-[1fr_170px_220px_140px_96px] md:gap-4 md:pr-5">
                    <button type="button" onClick={abrir} className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5 text-left md:contents">
                      <span className="flex min-w-0 items-center gap-3 md:px-5 md:py-0.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-px-ink/10 text-[12.5px] font-semibold text-px-ink" aria-hidden="true">{initials(nome)}</span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[14px] font-semibold text-px-ink">{nome}</span>
                            <Tag tone={local ? "accent" : "neutral"}>{local ? "Local" : "MedX"}</Tag>
                          </span>
                          {nasc && <span className="mt-0.5 block text-[12.5px] text-px-muted">{calcIdade(nasc)}</span>}
                          {semanticMode && pac._matchContext ? <span className="mt-1 block text-[12.5px] text-px-accent">{String(pac._matchContext)}</span> : null}
                          <span className="mt-0.5 flex gap-3 text-[12.5px] text-px-muted md:hidden">
                            {tel && <span>{tel}</span>}
                            {email && <span className="truncate">{email}</span>}
                          </span>
                        </span>
                      </span>
                      <span className="hidden min-w-0 items-center gap-1.5 md:flex">
                        {tel ? <><Phone className="h-3.5 w-3.5 shrink-0 text-px-muted" aria-hidden="true" /><span className="truncate text-[13px] text-px-ink">{tel}</span></> : <span className="text-[13px] text-px-muted">Sem telefone</span>}
                      </span>
                      <span className="hidden min-w-0 items-center gap-1.5 md:flex">
                        {email ? <><Mail className="h-3.5 w-3.5 shrink-0 text-px-muted" aria-hidden="true" /><span className="truncate text-[13px] text-px-ink">{email}</span></> : <span className="text-[13px] text-px-muted">Sem e-mail</span>}
                      </span>
                      <span className="hidden text-[13px] tabular-nums text-px-ink md:block">{ultima ? fmtDate(ultima) : <span className="text-px-muted">Nunca</span>}</span>
                    </button>
                    <div className="flex items-center justify-end gap-1 md:justify-end">
                      {local && (
                        <button
                          type="button"
                          onClick={e => deletePaciente(pac, e)}
                          disabled={deletingId === id}
                          aria-label={`Excluir ${nome}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-px-muted hover:bg-px-danger-soft hover:text-px-danger"
                        >
                          {deletingId === id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      )}
                      {ocupado ? <Loader2 className="h-4 w-4 animate-spin text-px-ink" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 text-px-muted" aria-hidden="true" />}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-px-line px-5 py-3 text-[13px] text-px-muted">
              {exibidos.length} paciente{exibidos.length !== 1 ? "s" : ""}
              {query && `, busca "${query}"`}
              {filtroIdade && `, idade ${filtroIdade}`}
              {filtroConsulta && `, consulta ${filtroConsulta}`}
            </div>
          </Panel>
        )}
      </div>

      {/* Ficha lateral */}
      {drawerOpen && <div className="fixed inset-0 z-[55] bg-black/30" onClick={closeDrawer} aria-hidden="true" />}
      <aside
        aria-label="Ficha do paciente"
        aria-hidden={!drawerOpen}
        className={cn(
          "px-glass-strong fixed bottom-0 right-0 top-0 z-[60] flex w-full max-w-md flex-col shadow-[0_10px_30px_rgba(20,20,20,0.18)] transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
      >
        {pacDetail && (
          <>
            <div className="shrink-0 border-b border-px-line px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-px-ink text-[14px] font-semibold text-white" aria-hidden="true">{initials(getPacNome(pacDetail))}</span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[20px] font-medium tracking-[-0.01em] text-px-ink">{getPacNome(pacDetail)}</h2>
                    {getPacId(pacDetail) && <p className="text-[12.5px] text-px-muted">Código {getPacId(pacDetail)}</p>}
                  </div>
                </div>
                <button type="button" onClick={closeDrawer} aria-label="Fechar ficha" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-px-ink/[0.08] text-px-ink hover:bg-px-ink/15">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <PxButton size="sm" fullWidth leftIcon={Bot} onClick={() => router.push(`/copiloto?pacienteId=${getPacId(pacDetail)}`)}>Copiloto</PxButton>
                <PxButton size="sm" fullWidth variant="secondary" leftIcon={Calendar} onClick={() => router.push("/agenda")}>Ver agenda</PxButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {drawerLoading ? (
                <div className="space-y-3 p-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-10 rounded-px-ctl bg-px-ink/[0.06] shimmer" />)}</div>
              ) : (
                <div className="space-y-7 p-6">
                  <section aria-labelledby="pac-dados">
                    <SectionTitle id="pac-dados" icon={User}>Dados pessoais</SectionTitle>
                    <div className="mt-3 space-y-2.5">
                      {getPacNasc(pacDetail) && (
                        <DetailRow label="Nascimento">
                          {fmtDate(getPacNasc(pacDetail))}
                          {calcIdade(getPacNasc(pacDetail)) && <span className="ml-2 text-px-muted">({calcIdade(getPacNasc(pacDetail))})</span>}
                        </DetailRow>
                      )}
                      {getPacTelefone(pacDetail) && <DetailRow label="Telefone" icon={Phone}>{getPacTelefone(pacDetail)}</DetailRow>}
                      {getPacEmail(pacDetail) && <DetailRow label="E-mail" icon={Mail}>{getPacEmail(pacDetail)}</DetailRow>}
                      {getPacUltConsulta(pacDetail) && <DetailRow label="Última consulta">{fmtDate(getPacUltConsulta(pacDetail))}</DetailRow>}
                      {getPacObs(pacDetail) && <DetailRow label="Observações">{getPacObs(pacDetail)}</DetailRow>}
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
                        .map(([k, v]) => <DetailRow key={k} label={k.replace(/([A-Z])/g, " $1").trim()}>{String(v)}</DetailRow>)}
                    </div>
                  </section>

                  <section aria-labelledby="pac-pront">
                    <SectionTitle id="pac-pront" icon={FileText}>Adicionar ao prontuário</SectionTitle>
                    <div className="mt-3 space-y-2.5">
                      <textarea
                        value={prontuarioText}
                        onChange={e => setProntuarioText(e.target.value)}
                        rows={4}
                        aria-label="Anotação para o prontuário"
                        placeholder="Anotação clínica, evolução ou observação"
                        className={textarea}
                      />
                      {prontuarioError && <p role="alert" className="text-[13px] text-px-danger">{prontuarioError}</p>}
                      <PxButton fullWidth leftIcon={prontuarioOk ? Check : ClipboardList} loading={prontuarioSaving} disabled={!prontuarioText.trim() && !prontuarioOk} onClick={salvarProntuario}>
                        {prontuarioOk ? "Prontuário salvo" : "Salvar no prontuário"}
                      </PxButton>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      <PxModal open={novoOpen} onClose={() => setNovoOpen(false)} title="Novo paciente">
        <div className="space-y-3">
          <Field label="Nome *" htmlFor="np-nome">
            <PxInput id="np-nome" value={novoForm.Nome} onChange={e => setNovoForm(f => ({ ...f, Nome: e.target.value }))} placeholder="Nome completo do paciente" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Telefone" htmlFor="np-tel">
              <PxInput id="np-tel" value={novoForm.Telefone} onChange={e => setNovoForm(f => ({ ...f, Telefone: e.target.value }))} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="Data de nascimento" htmlFor="np-nasc">
              <PxInput id="np-nasc" type="date" value={novoForm.DataNascimento} onChange={e => setNovoForm(f => ({ ...f, DataNascimento: e.target.value }))} />
            </Field>
          </div>
          <Field label="E-mail" htmlFor="np-email">
            <PxInput id="np-email" type="email" value={novoForm.Email} onChange={e => setNovoForm(f => ({ ...f, Email: e.target.value }))} placeholder="email@exemplo.com" />
          </Field>
          <Field label="Observações" htmlFor="np-obs">
            <textarea id="np-obs" rows={3} value={novoForm.Observacao} onChange={e => setNovoForm(f => ({ ...f, Observacao: e.target.value }))} placeholder="Informações adicionais" className={textarea} />
          </Field>
          {novoError && <p role="alert" className="text-[13px] text-px-danger">{novoError}</p>}
          <div className="flex gap-2 pt-1">
            <PxButton variant="secondary" onClick={() => setNovoOpen(false)}>Cancelar</PxButton>
            <PxButton fullWidth leftIcon={novoOk ? Check : Plus} loading={novoSaving} disabled={novoOk || !novoForm.Nome.trim()} onClick={salvarNovo}>
              {novoOk ? "Paciente cadastrado" : "Cadastrar paciente"}
            </PxButton>
          </div>
        </div>
      </PxModal>
    </div>
  )
}

// ── Pequenos componentes ──────────────────────────────────────────────────────

function SectionTitle({ id, icon: Icon, children }: { id?: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-[14px] font-semibold text-px-ink">
      <Icon className="h-4 w-4 shrink-0 text-px-accent" aria-hidden="true" />
      {children}
    </h3>
  )
}

function DetailRow({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-[13.5px]">
      <div className="flex w-32 shrink-0 items-center gap-1.5 pt-px text-px-muted">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </div>
      <span className="min-w-0 flex-1 text-px-ink">{children}</span>
    </div>
  )
}
