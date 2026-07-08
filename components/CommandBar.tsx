"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, User, Loader2, CornerDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Navigable items (curated from all alas) ───────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",                  href: "/dashboard"              },
  { label: "Copiloto de Consulta",       href: "/copiloto"               },
  { label: "Gestão de Pacientes",        href: "/pacientes"              },
  { label: "Agenda Inteligente",         href: "/agenda"                 },
  { label: "Prescrição Assistida",       href: "/prescricao"             },
  { label: "Conversa Clínica",           href: "/conversa"               },
  { label: "Calculadoras Clínicas",      href: "/calculadoras"           },
  { label: "CRM de Leads",               href: "/crm"                    },
  { label: "Nutrição de Leads",          href: "/nutricao-leads"         },
  { label: "Régua de Relacionamento",    href: "/regua"                  },
  { label: "Pesquisa NPS",               href: "/nps"                    },
  { label: "Reativação de Pacientes",    href: "/reativacao"             },
  { label: "Interpretação de Exames",    href: "/interpretacao-exames"   },
  { label: "Relatório para Paciente",    href: "/relatorio-paciente"     },
  { label: "Painel Executivo",           href: "/executivo"              },
  { label: "Financeiro",                 href: "/financeiro"             },
  { label: "Indicadores da Clínica",     href: "/indicadores"            },
  { label: "Metas e Planejamento",       href: "/metas"                  },
  { label: "Programa de Afiliados",      href: "/afiliados"              },
  { label: "Memória Clínica",            href: "/memoria"                },
  { label: "Marketplace",               href: "/marketplace"            },
  { label: "Radar de Tendências",        href: "/radar"                  },
  { label: "Carrosséis",                href: "/carrossel"              },
  { label: "Calendário Editorial",       href: "/calendario"             },
  { label: "Banco de Pautas",            href: "/pautas"                 },
  { label: "Perfil",                     href: "/perfil"                 },
  { label: "Configurações",             href: "/configuracoes"          },
] as const

interface Paciente {
  id:        string
  nome:      string
  telefone?: string | null
}

export function CommandBar() {
  const router = useRouter()
  const [open,      setOpen]      = useState(false)
  const [query,     setQuery]     = useState("")
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading,   setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const inputRef    = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // ── Global Cmd+K / Ctrl+K ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // ── Open via custom event (from Sidebar button) ────────────────────────────
  useEffect(() => {
    const onOpen = () => setOpen(true)
    document.addEventListener("praxis:cmd-open", onOpen)
    return () => document.removeEventListener("praxis:cmd-open", onOpen)
  }, [])

  // ── Focus + reset on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery("")
      setPacientes([])
      setLoading(false)
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // ── Debounced patient search ──────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open || query.trim().length < 2) {
      setPacientes([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/pacientes?action=search&q=${encodeURIComponent(query.trim())}`)
        const data = (await res.json()) as Paciente[]
        setPacientes(Array.isArray(data) ? data.slice(0, 5) : [])
      } catch {
        setPacientes([])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open])

  // ── Filter nav items ──────────────────────────────────────────────────────
  const filteredNav = useMemo(() => {
    if (!query.trim()) return NAV_ITEMS.slice(0, 8)
    const q = query.toLowerCase()
    return NAV_ITEMS.filter(n => n.label.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  // ── Reset active index on query change ────────────────────────────────────
  useEffect(() => { setActiveIdx(0) }, [query])

  const total = pacientes.length + filteredNav.length

  // ── Keyboard nav within modal ─────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, total - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (activeIdx < pacientes.length) {
        router.push(`/pacientes/${pacientes[activeIdx].id}`)
      } else {
        const ni = activeIdx - pacientes.length
        if (filteredNav[ni]) router.push(filteredNav[ni].href)
      }
      setOpen(false)
    }
  }, [total, activeIdx, pacientes, filteredNav, router])

  const navigate = useCallback((href: string) => {
    router.push(href)
    setOpen(false)
  }, [router])

  if (!open) return null

  const hasQuery    = query.trim().length >= 1
  const hasPacQuery = query.trim().length >= 2

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[16vh] px-4 pointer-events-none">
        <div className="w-full max-w-lg pointer-events-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar paciente ou módulo..."
              className="flex-1 bg-transparent text-[14px] text-text-primary placeholder:text-text-muted outline-none"
            />
            {loading
              ? <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin flex-shrink-0" />
              : <kbd className="text-[9px] font-mono bg-surface border border-border px-1.5 py-0.5 rounded text-text-muted flex-shrink-0">ESC</kbd>
            }
          </div>

          {/* Results */}
          <div className="max-h-[380px] overflow-y-auto">

            {/* ─ Pacientes section ─────────────────────────────────────────── */}
            {hasPacQuery && (loading || pacientes.length > 0) && (
              <div className="pt-2">
                <p className="px-4 pb-1 text-[9px] font-mono text-text-muted uppercase tracking-widest">
                  Pacientes
                </p>
                {loading && pacientes.length === 0 ? (
                  <div className="px-4 py-2.5 flex items-center gap-2 text-[12px] text-text-muted">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Buscando…
                  </div>
                ) : (
                  pacientes.map((p, i) => (
                    <button
                      key={p.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        activeIdx === i ? "bg-blue-500/10" : "hover:bg-surface-2"
                      )}
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      onMouseEnter={() => setActiveIdx(i)}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-primary truncate">{p.nome}</p>
                        {p.telefone && (
                          <p className="text-[10px] font-mono text-text-muted">{p.telefone}</p>
                        )}
                      </div>
                      {activeIdx === i && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ─ Nav items section ─────────────────────────────────────────── */}
            {filteredNav.length > 0 && (
              <div className={cn(
                "pb-2",
                hasPacQuery && (loading || pacientes.length > 0)
                  ? "mt-2 border-t border-border pt-2"
                  : "pt-2"
              )}>
                <p className="px-4 pb-1 text-[9px] font-mono text-text-muted uppercase tracking-widest">
                  {hasQuery ? "Navegar para" : "Acesso rápido"}
                </p>
                {filteredNav.map((item, i) => {
                  const idx = pacientes.length + i
                  return (
                    <button
                      key={item.href}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                        activeIdx === idx ? "bg-accent-dim" : "hover:bg-surface-2"
                      )}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIdx(idx)}
                    >
                      <div className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-mono text-accent">/</span>
                      </div>
                      <span className="text-[13px] text-text-primary flex-1 truncate">{item.label}</span>
                      {activeIdx === idx && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* ─ Empty state ───────────────────────────────────────────────── */}
            {hasQuery && !loading && pacientes.length === 0 && filteredNav.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-text-muted">
                  Nenhum resultado para{" "}
                  <span className="text-text-secondary">"{query}"</span>
                </p>
              </div>
            )}

            {/* ─ Zero-query prompt ─────────────────────────────────────────── */}
            {!hasQuery && (
              <p className="px-4 py-2 text-[11px] text-text-muted text-center">
                Digite um nome de paciente ou módulo
              </p>
            )}
          </div>

          {/* Footer — keyboard hints */}
          <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[8px]">↑</kbd>
              <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[8px]">↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[8px]">↵</kbd>
              abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-surface border border-border px-1 py-0.5 rounded text-[8px]">ESC</kbd>
              fechar
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
