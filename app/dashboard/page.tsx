"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import {
  Bot, Radio, ScanFace, ShieldQuestion, CircleDollarSign,
  Video, Layers, FileText, Zap, ArrowRight,
  Activity, BarChart, Lightbulb, TrendingUp,
  Users, Calendar, Stethoscope,
  Megaphone, BarChart3, Sparkles, GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { usePerfil } from "@/hooks/usePerfil"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function fmtDate() {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  })
}

// ─── Counter animation hook ───────────────────────────────────────────────────

function useCounter(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>()

  useEffect(() => {
    const start = performance.now()
    const tick  = (now: number) => {
      const t    = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(ease * target))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])

  return value
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALA_SECTIONS = [
  {
    id: "social", icon: Megaphone, title: "PRAXIS Social",
    desc: "Atraia mais pacientes com conteúdo estratégico",
    color: "text-accent", bg: "bg-accent-dim", border: "border-accent-border",
    indicatorColor: "#00c07f",
    links: [
      { label: "Posicionamento", href: "/posicionamento" },
      { label: "Reels",          href: "/reels"          },
      { label: "Calendário",     href: "/calendario"     },
      { label: "Radar",          href: "/radar"          },
    ],
  },
  {
    id: "consultorio", icon: Stethoscope, title: "PRAXIS Consultório",
    desc: "Converta leads em pacientes fiéis",
    color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25",
    indicatorColor: "#60a5fa",
    links: [
      { label: "CRM",     href: "/crm"     },
      { label: "Copiloto",href: "/copiloto"},
      { label: "Agenda",  href: "/agenda"  },
      { label: "Scripts", href: "/scripts" },
    ],
  },
  {
    id: "executivo", icon: BarChart3, title: "PRAXIS Executivo",
    desc: "Gerencie e escale sua clínica",
    color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25",
    indicatorColor: "#c084fc",
    links: [
      { label: "Financeiro",   href: "/financeiro"   },
      { label: "Precificação", href: "/precificacao" },
      { label: "Indicadores",  href: "/indicadores"  },
      { label: "Consultor",    href: "/consultor"    },
    ],
  },
  {
    id: "ia", icon: Sparkles, title: "PRAXIS IA",
    desc: "Inteligência estratégica para crescer mais rápido",
    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25",
    indicatorColor: "#fbbf24",
    links: [
      { label: "Posicionamento", href: "/posicionamento"    },
      { label: "Dir. Criativo",  href: "/diretor-criativo"  },
      { label: "Agente",         href: "/agente-executivo"  },
      { label: "Nutrição",       href: "/nutricao-pacientes"},
    ],
  },
  {
    id: "academy", icon: GraduationCap, title: "PRAXIS Academy",
    desc: "Aprenda a construir uma clínica de sucesso",
    color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/25",
    indicatorColor: "#f472b6",
    links: [
      { label: "Academy", href: "/academy" },
    ],
  },
]

const DICAS = [
  { dica: "Conteúdo motivacional e de estilo de vida performam bem aos domingos.", acao: { label: "Gerar Roteiro", href: "/roteiros" } },
  { dica: "Ótimo dia para planejar a semana. Use o Agente Executivo para um calendário editorial completo.", acao: { label: "Abrir Agente", href: "/agente" } },
  { dica: "Terça tem excelente alcance para conteúdo científico e educativo.", acao: { label: "Explorar Radar", href: "/radar" } },
  { dica: "Posts de perguntas e enquetes têm maior engajamento às quartas.", acao: { label: "Mapa de Objeções", href: "/objecoes" } },
  { dica: "Quinta é ideal para carrosséis longos e conteúdo aprofundado.", acao: { label: "Diretor Criativo", href: "/imagens" } },
  { dica: "Depoimentos e histórias de transformação têm alto alcance às sextas.", acao: { label: "Criar Roteiro", href: "/roteiros" } },
  { dica: "Sábado é ótimo para conteúdo de bastidores e mais pessoal.", acao: { label: "Ver Referências", href: "/referencias" } },
]

interface Pauta { id: number | string; titulo: string; categoria: string }

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub: string; accent?: boolean }) {
  const numericTarget = typeof value === "number" ? value : 0
  const animated      = useCounter(numericTarget)
  const display       = typeof value === "number" ? animated : value

  return (
    <div className={cn(
      "bg-surface border rounded-xl p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-hover",
      accent ? "border-accent-border" : "border-border"
    )}>
      <div className={cn("text-[26px] md:text-[30px] font-bold leading-none mb-1", accent ? "text-accent" : "text-text-primary")}>
        {display}
      </div>
      <div className="text-[11px] font-semibold text-text-primary mb-0.5">{label}</div>
      <div className="text-[10px] text-text-muted">{sub}</div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [pautasCount,  setPautasCount]  = useState<number>(0)
  const [recentPautas, setRecentPautas] = useState<Pauta[]>([])
  const [lastAccess,   setLastAccess]   = useState<string | null>(null)
  const [greet]                         = useState(greeting)
  const [dateStr]                       = useState(fmtDate)
  const { perfil, loading: perfilLoading } = usePerfil()
  const router = useRouter()

  // Guard: if profile loaded and onboarding not complete, send back to onboarding.
  // This fires even when middleware let /dashboard through (ONBOARDING_EXEMPT).
  useEffect(() => {
    if (!perfilLoading && perfil !== null && !perfil.onboarding_completo) {
      router.replace("/onboarding")
    }
  }, [perfil, perfilLoading, router])

  const dica = DICAS[new Date().getDay()]

  useEffect(() => {
    const prev = localStorage.getItem("praxis_last_access")
    if (prev) setLastAccess(prev)
    localStorage.setItem("praxis_last_access", new Date().toLocaleString("pt-BR"))

    fetch("/api/pautas")
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setPautasCount(data.length)
          setRecentPautas((data as Pauta[]).slice(-3).reverse())
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="animate-fade-in">
      <TopBar title="Command Center" subtitle="PRAXIS · DASHBOARD PRINCIPAL" />

      <div className="p-4 md:p-8 space-y-6">

        {/* ── Hero greeting ──────────────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-[11px] font-mono text-text-muted tracking-widest uppercase mb-2">
              {dateStr}
            </p>
            <h2
              className="text-[24px] md:text-[32px] font-semibold text-text-primary leading-tight mb-2"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {greet}, {perfil?.nome ? perfil.nome.replace(/^Dr\.?\s*/i, "Dr. ") : "Dr. Bruno"}.
            </h2>
            <p className="text-[13px] md:text-[14px] text-text-secondary">
              {perfil?.especialidade && (
                <span className="text-text-muted font-mono text-[11px] uppercase tracking-wider mr-2">
                  {perfil.especialidade} ·
                </span>
              )}
              Você tem{" "}
              <span className="text-text-primary font-medium">{pautasCount} pauta{pautasCount !== 1 ? "s" : ""}</span>{" "}
              salvas e 36+ módulos prontos para criar.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
            <span className="text-[10px] font-mono text-accent tracking-widest">PRAXIS ONLINE</span>
          </div>
        </div>

        {/* ── Metrics grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Banco de Pautas"  value={pautasCount} sub="ideias salvas"          accent />
          <MetricCard label="Módulos Ativos"   value={15}          sub="ferramentas disponíveis"       />
          <MetricCard label="Plano"            value="Elite"       sub="acesso ilimitado"               />
          <MetricCard label="IA Conectada"     value="Claude"      sub="Sonnet 4 · Online"      accent />
        </div>

        {/* ── 5 Alas ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-mono text-text-muted tracking-[3px] uppercase">Módulos da Plataforma</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {ALA_SECTIONS.map(ala => {
              const AlaIcon = ala.icon
              return (
                <div
                  key={ala.id}
                  className={cn(
                    "bg-surface border rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5",
                    ala.border,
                  )}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0", ala.bg, ala.border)}>
                      <AlaIcon className={cn("w-4 h-4", ala.color)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className={cn("text-[11px] font-bold truncate", ala.color)}>{ala.title}</h3>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed mb-3">{ala.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ala.links.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors",
                          ala.bg, ala.border, ala.color,
                          "hover:opacity-80"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href={ala.links[0].href}>
                      <ArrowRight className={cn("w-3.5 h-3.5", ala.color)} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Recent pautas */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span className="text-[12px] font-semibold text-text-primary">Pautas Recentes</span>
              </div>
              <Link href="/pautas" className="text-[10px] font-mono text-text-muted hover:text-accent transition-colors">
                Ver todas →
              </Link>
            </div>
            <div>
              {recentPautas.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentPautas.map(p => (
                    <Link
                      key={p.id}
                      href="/pautas"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-text-secondary group-hover:text-text-primary transition-colors truncate">{p.titulo}</p>
                        <span className="text-[9px] font-mono text-text-muted">{p.categoria}</span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <FileText className="w-7 h-7 text-text-muted/30" />
                  <div className="text-center">
                    <p className="text-[12px] text-text-muted">Nenhuma pauta ainda.</p>
                    <Link href="/pautas" className="text-[11px] text-accent hover:underline mt-0.5 inline-block">
                      Criar primeira pauta →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insight do dia */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <Lightbulb className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-[12px] font-semibold text-text-primary">Insight do Dia</span>
              <span className="ml-auto text-[9px] font-mono text-text-muted uppercase tracking-wider">
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sab"][new Date().getDay()]}
              </span>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-[13px] text-text-secondary leading-relaxed">{dica.dica}</p>
              <Link
                href={dica.acao.href}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-semibold hover:bg-accent/15 transition-all min-h-[44px]"
              >
                {dica.acao.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Last session ───────────────────────────────────────────────── */}
        {lastAccess && (
          <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg">
            <Activity className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <p className="text-[11px] text-text-muted">
              Última sessão: <span className="text-text-secondary">{lastAccess}</span>
            </p>
            <div className="ml-auto flex items-center gap-1.5">
              <BarChart className="w-3 h-3 text-text-muted" />
              <Link href="/concorrentes" className="text-[10px] text-text-muted hover:text-accent transition-colors font-mono">
                Análise de Concorrentes →
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
