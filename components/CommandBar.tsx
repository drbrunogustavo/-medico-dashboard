"use client"

import { useEffect, useState, useRef, useCallback, useMemo, useId } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

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
  { label: "Marketplace",                href: "/marketplace"            },
  { label: "Radar de Tendências",        href: "/radar"                  },
  { label: "Carrosséis",                 href: "/carrossel"              },
  { label: "Calendário Editorial",       href: "/calendario"             },
  { label: "Banco de Pautas",            href: "/pautas"                 },
  { label: "Perfil",                     href: "/perfil"                 },
  { label: "Configurações",              href: "/configuracoes"          },
] as const

interface Paciente {
  id:        string
  nome:      string
  telefone?: string | null
}

type Item = { key: string; href: string; titulo: string; detalhe?: string; grupo: "Pacientes" | "Páginas" }

/** Ignora acento e caixa: "agenda" acha "Agenda", "prescricao" acha "Prescrição". */
function norm(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function CommandBar() {
  const router = useRouter()
  const [open,      setOpen]      = useState(false)
  const [query,     setQuery]     = useState("")
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading,   setLoading]   = useState(false)
  const [falhou,    setFalhou]    = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  const inputRef    = useRef<HTMLInputElement>(null)
  const dialogRef   = useRef<HTMLDivElement>(null)
  const retornoRef  = useRef<HTMLElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const listId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    document.addEventListener("praxis:cmd-open", onOpen)
    return () => document.removeEventListener("praxis:cmd-open", onOpen)
  }, [])

  // Ao abrir: guarda o foco anterior, limpa o estado e foca o campo. Ao fechar: devolve o foco.
  useEffect(() => {
    if (open) {
      retornoRef.current = document.activeElement as HTMLElement | null
      setQuery(""); setPacientes([]); setLoading(false); setFalhou(false); setActiveIdx(0)
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    retornoRef.current?.focus?.()
  }, [open])

  // Busca de pacientes com descarte de respostas atrasadas.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open || query.trim().length < 2) {
      setPacientes([]); setLoading(false); setFalhou(false)
      return
    }
    setLoading(true)
    let atual = true
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pacientes?action=search&q=${encodeURIComponent(query.trim())}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Paciente[]
        if (!atual) return
        setPacientes(Array.isArray(data) ? data.slice(0, 5) : [])
        setFalhou(false)
      } catch {
        if (!atual) return
        setPacientes([]); setFalhou(true)
      } finally {
        if (atual) setLoading(false)
      }
    }, 200)
    return () => { atual = false; if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open])

  const itens: Item[] = useMemo(() => {
    const q = norm(query.trim())
    const paginas = (q ? NAV_ITEMS.filter(n => norm(n.label).includes(q)) : NAV_ITEMS.slice(0, 8)).slice(0, 8)
    return [
      ...pacientes.map<Item>(p => ({ key: `p-${p.id}`, href: `/pacientes/${p.id}`, titulo: p.nome, detalhe: p.telefone ?? undefined, grupo: "Pacientes" })),
      ...paginas.map<Item>(n => ({ key: n.href, href: n.href, titulo: n.label, grupo: "Páginas" })),
    ]
  }, [query, pacientes])

  useEffect(() => { setActiveIdx(0) }, [query])
  useEffect(() => { setActiveIdx(i => Math.min(i, Math.max(itens.length - 1, 0))) }, [itens.length])

  const ir = useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false) }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, itens.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); const it = itens[activeIdx]; if (it) ir(it.href) }
  }

  // Mantém o Tab dentro do diálogo.
  const onDialogKey = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return
    const foco = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("input, button, a[href]"))
    if (foco.length === 0) return
    const primeiro = foco[0], ultimo = foco[foco.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus() }
  }

  if (!open) return null

  const temBuscaPac = query.trim().length >= 2
  const semResultado = query.trim().length > 0 && !loading && !falhou && itens.length === 0
  const grupos: Array<Item["grupo"]> = ["Pacientes", "Páginas"]

  return (
    <div className="px fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-px-ink/40" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative flex items-start justify-center px-4 pt-[14vh]">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Busca rápida"
          onKeyDown={onDialogKey}
          className="px-glass-strong w-full max-w-lg overflow-hidden rounded-px-card shadow-[0_16px_48px_rgba(20,20,20,0.22)]"
        >
          <div className="flex items-center gap-3 border-b border-px-line px-4 py-3.5">
            <Search className="h-4 w-4 shrink-0 text-px-muted" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={itens[activeIdx] ? `${listId}-${activeIdx}` : undefined}
              aria-label="Buscar paciente ou página"
              placeholder="Buscar paciente ou página"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-px-ink placeholder:text-px-muted focus:outline-none"
            />
            <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-px-ctl border border-px-line px-2 py-1 text-[11.5px] font-medium text-px-ink hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">Esc</button>
          </div>

          <div id={listId} role="listbox" aria-label="Resultados" className="max-h-[380px] overflow-y-auto py-1">
            {grupos.map(g => {
              const doGrupo = itens.map((it, idx) => ({ it, idx })).filter(x => x.it.grupo === g)
              const mostrarCabecalho = g === "Pacientes" ? (temBuscaPac && (loading || falhou || doGrupo.length > 0)) : doGrupo.length > 0
              if (!mostrarCabecalho) return null
              return (
                <div key={g} role="presentation">
                  <p className="px-4 pb-1 pt-2 text-[11.5px] font-semibold text-px-muted">{g === "Páginas" && !query.trim() ? "Acesso rápido" : g}</p>
                  {g === "Pacientes" && loading && doGrupo.length === 0 && <p className="px-4 py-2 text-[13px] text-px-muted">Buscando pacientes</p>}
                  {g === "Pacientes" && falhou && <p role="alert" className="mx-3 my-1 rounded-px-ctl bg-px-danger-soft px-3 py-2 text-[12.5px] text-px-danger">Não foi possível buscar pacientes agora.</p>}
                  {doGrupo.map(({ it, idx }) => (
                    <div
                      key={it.key}
                      id={`${listId}-${idx}`}
                      role="option"
                      aria-selected={idx === activeIdx}
                      onClick={() => ir(it.href)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={cn("flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2.5 text-[13.5px] text-px-ink", idx === activeIdx && "bg-px-ink/[0.07]")}
                    >
                      <span className="min-w-0 truncate font-medium">{it.titulo}</span>
                      {it.detalhe && <span className="shrink-0 text-[12px] text-px-muted">{it.detalhe}</span>}
                    </div>
                  ))}
                </div>
              )
            })}

            {semResultado && <p className="px-4 py-8 text-center text-[13px] text-px-muted">Nada encontrado para &ldquo;{query.trim()}&rdquo;.</p>}
          </div>

          <p className="border-t border-px-line px-4 py-2 text-[12px] text-px-muted">Setas para cima e para baixo escolhem, Enter abre, Esc fecha.</p>
        </div>
      </div>
    </div>
  )
}
