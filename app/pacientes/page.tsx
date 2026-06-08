"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import { Search, User, Phone, Mail, MapPin, ChevronRight, X, Bot, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Paciente {
  // MedX retorna PascalCase
  Id?:           string | number
  IdContato?:    string | number
  Nome?:         string
  Celular?:      string
  Email?:        string
  CPF_CGC?:      string
  Nascimento?:   string
  Cidade?:       string
  // fallback camelCase
  id?:           string | number
  idContato?:    string | number
  nome?:         string
  nomeCompleto?: string
  telefone?:     string
  celular?:      string
  email?:        string
  cidade?:       string
  dataNascimento?: string
  cpf?:          string
  [key: string]: unknown
}

function getPacienteId(p: Paciente): string {
  return String(p.Id ?? p.id ?? p.IdContato ?? p.idContato ?? "")
}

function getPacienteNome(p: Paciente): string {
  return p.Nome ?? p.nome ?? p.nomeCompleto ?? "—"
}

function getPacienteTelefone(p: Paciente): string {
  return p.Celular ?? p.celular ?? p.telefone ?? "—"
}

function getInitials(nome: string): string {
  return nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PacientesPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Paciente[]>([])
  const [selected, setSelected] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); setHasSearched(false); return }
    setLoading(true)
    setError("")
    setHasSearched(true)
    try {
      const res  = await fetch(`/api/pacientes?action=search&nome=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 500)
  }

  const openDetail = async (p: Paciente) => {
    const id = getPacienteId(p)
    if (!id) { setSelected(p); return }
    setLoadingDetail(true)
    try {
      const res  = await fetch(`/api/pacientes?action=get&id=${id}`)
      const data = await res.json()
      setSelected(data && !data.error ? data : p)
    } catch {
      setSelected(p)
    } finally {
      setLoadingDetail(false)
    }
  }

  const goToCopiloto = (p: Paciente) => {
    const params = new URLSearchParams({
      nome: getPacienteNome(p),
      id:   getPacienteId(p),
    })
    router.push(`/copiloto?${params.toString()}`)
  }

  // Fields to hide in detail (both PascalCase and camelCase)
  const SKIP = new Set([
    "Id","IdContato","Nome","Celular","Email","CPF_CGC","Nascimento","Cidade",
    "id","idContato","nome","nomeCompleto","telefone","celular","email","cidade","dataNascimento","cpf",
  ])

  return (
    <div className="animate-fade-in">
      <TopBar title="Gestão de Pacientes" subtitle="ALA CLÍNICA · MEDX" />

      <div className="p-4 md:p-8 space-y-6 max-w-4xl">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Buscar paciente pelo nome..."
            className="w-full bg-surface border border-border rounded-xl pl-11 pr-11 py-3.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setHasSearched(false); setSelected(null) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
            {error}
          </div>
        )}

        {/* Results */}
        {hasSearched && !loading && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {results.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-[13px]">
                Nenhum paciente encontrado para &ldquo;{query}&rdquo;
              </div>
            ) : (
              <>
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase">
                    {results.length} resultado{results.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {results.map((p, i) => {
                    const nome = getPacienteNome(p)
                    return (
                      <button
                        key={i}
                        onClick={() => openDetail(p)}
                        className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2 transition-colors text-left group"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-accent"
                          style={{ background: "rgba(0,192,127,0.1)", border: "1px solid rgba(0,192,127,0.2)" }}
                        >
                          {getInitials(nome)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-text-primary truncate">{nome}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {getPacienteTelefone(p) !== "—" && (
                              <span className="text-[11px] text-text-muted flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {getPacienteTelefone(p)}
                              </span>
                            )}
                            {(p.Cidade ?? p.cidade) && (
                              <span className="text-[11px] text-text-muted flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {String(p.Cidade ?? p.cidade)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(0,192,127,0.08)", border: "1px solid rgba(0,192,127,0.2)" }}
            >
              <User className="w-7 h-7 text-accent" />
            </div>
            <div className="text-[14px] font-medium text-text-primary mb-1">Busque um paciente</div>
            <div className="text-[12px] text-text-muted max-w-xs">
              Digite o nome para buscar no cadastro MedX. O resultado aparece automaticamente.
            </div>
          </div>
        )}

      </div>

      {/* Detail modal */}
      {(selected || loadingDetail) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div className="py-16 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            ) : selected && (
              <>
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-bold text-accent"
                    style={{ background: "rgba(0,192,127,0.1)", border: "1px solid rgba(0,192,127,0.2)" }}
                  >
                    {getInitials(getPacienteNome(selected))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16px] font-semibold text-text-primary">{getPacienteNome(selected)}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">ID: {getPacienteId(selected)}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
                  {[
                    { icon: Phone,  label: "Telefone", value: getPacienteTelefone(selected) },
                    { icon: Mail,   label: "Email",    value: (selected.Email ?? selected.email)    ? String(selected.Email ?? selected.email)    : null },
                    { icon: MapPin, label: "Cidade",   value: (selected.Cidade ?? selected.cidade)  ? String(selected.Cidade ?? selected.cidade)  : null },
                    { icon: User,   label: "CPF",      value: selected.CPF_CGC ? String(selected.CPF_CGC) : null },
                    { icon: User,   label: "Nasc.",    value: (selected.Nascimento ?? selected.dataNascimento) ? String(selected.Nascimento ?? selected.dataNascimento).slice(0,10) : null },
                  ].filter(r => r.value && r.value !== "—").map(row => (
                    <div key={row.label} className="flex items-center gap-3 text-[12px]">
                      <row.icon className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="text-text-muted w-16 flex-shrink-0">{row.label}</span>
                      <span className="text-text-secondary">{row.value}</span>
                    </div>
                  ))}
                  {Object.entries(selected).filter(([k, v]) =>
                    !SKIP.has(k) && v != null && v !== "" && typeof v !== "object"
                  ).slice(0, 8).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3 text-[12px]">
                      <div className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-text-muted w-16 flex-shrink-0 truncate">{k}</span>
                      <span className="text-text-secondary truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-border flex gap-2">
                  <button
                    onClick={() => goToCopiloto(selected)}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent text-background text-[12px] font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    Abrir no Copiloto
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="px-4 text-[12px] border border-border text-text-secondary rounded-xl hover:border-border-hover transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
