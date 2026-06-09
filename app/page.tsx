"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import {
  Bot, Radio, ScanFace, ShieldQuestion, CircleDollarSign,
  Video, Layers, FileText, Zap, ArrowRight,
  Activity, BarChart, Lightbulb, TrendingUp,
  Users, Calendar, Stethoscope,
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
      const t   = Math.min((now - start) / duration, 1)
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

const SHORTCUTS = [
  {
    href: "/agente",        icon: Bot,             label: "Agente Executivo",
    desc: "Conteúdo completo em lote",            badge: "ELITE",
    color: "text-[#d4af37]", bg: "bg-[rgba(212,175,55,0.06)]", border: "border-[rgba(212,175,55,0.15)] hover:border-[rgba(212,175,55,0.35)]",
  },
  {
    href: "/radar",         icon: Radio,           label: "Radar de Tendências",
    desc: "Temas em alta em tempo real",          badge: "LIVE",
    color: "text-red-400",   bg: "bg-red-950/20",  border: "border-red-500/15 hover:border-red-500/35",
  },
  {
    href: "/raio-x",        icon: ScanFace,        label: "Raio-X de Pacientes",
    desc: "Psicologia e gatilhos do paciente",    badge: null,
    color: "text-purple-400",bg: "bg-purple-950/20",border: "border-purple-500/15 hover:border-purple-500/35",
  },
  {
    href: "/objecoes",      icon: ShieldQuestion,  label: "Mapa de Objeções",
    desc: "Transforme dúvidas em conteúdo",      badge: null,
    color: "text-amber-400", bg: "bg-amber-950/20",border: "border-amber-500/15 hover:border-amber-500/35",
  },
  {
    href: "/oportunidades", icon: CircleDollarSign,label: "Oportunidades",
    desc: "Detecte momentos de faturamento",     badge: null,
    color: "text-accent",    bg: "bg-accent-dim",  border: "border-accent-border hover:border-accent/40",
  },
  {
    href: "/roteiros",      icon: Video,           label: "Gerador de Roteiros",
    desc: "Roteiros completos para Reels",        badge: null,
    color: "text-blue-400",  bg: "bg-blue-950/20", border: "border-blue-500/15 hover:border-blue-500/35",
  },
  {
    href: "/imagens",       icon: Layers,          label: "Diretor Criativo",
    desc: "Artes e headlines com IA",             badge: null,
    color: "text-pink-400",  bg: "bg-pink-950/20", border: "border-pink-500/15 hover:border-pink-500/35",
  },
  {
    href: "/pautas",        icon: FileText,        label: "Banco de Pautas",
    desc: "Gerencie suas ideias de conteúdo",    badge: null,
    color: "text-orange-400",bg: "bg-orange-950/20",border: "border-orange-500/15 hover:border-orange-500/35",
  },
  {
    href: "/concorrentes",  icon: Users,           label: "Análise de Concorrentes",
    desc: "Monitore e aprenda com a concorrência", badge: null,
    color: "text-teal-400",  bg: "bg-teal-950/20",  border: "border-teal-500/15 hover:border-teal-500/35",
  },
  {
    href: "/financeiro",    icon: TrendingUp,      label: "Financeiro",
    desc: "Gestão de faturamento e metas",        badge: null,
    color: "text-emerald-400",bg:"bg-emerald-950/20",border:"border-emerald-500/15 hover:border-emerald-500/35",
  },
  {
    href: "/agenda",        icon: Calendar,        label: "Agenda Inteligente",
    desc: "Organize consultas e estratégias",     badge: null,
    color: "text-cyan-400",  bg: "bg-cyan-950/20",  border: "border-cyan-500/15 hover:border-cyan-500/35",
  },
  {
    href: "/copiloto",      icon: Stethoscope,     label: "Copiloto de Consulta",
    desc: "IA no prontuário em tempo real",       badge: null,
    color: "text-violet-400",bg:"bg-violet-950/20", border:"border-violet-500/15 hover:border-violet-500/35",
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

export default function HomePage() {
  const [pautasCount,  setPautasCount]  = useState<number>(0)
  const [recentPautas, setRecentPautas] = useState<Pauta[]>([])
  const [lastAccess,   setLastAccess]   = useState<string | null>(null)
  const [greet]                         = useState(greeting)
  const [dateStr]                       = useState(fmtDate)
  const { perfil } = usePerfil()

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
          {/* Background glow */}
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
              salvas e 15 módulos prontos para criar.
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

        {/* ── Quick access ───────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-mono text-text-muted tracking-[3px] uppercase">Acesso Rápido</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SHORTCUTS.map(s => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href + s.label}
                  href={s.href}
                  className={cn(
                    "group block bg-surface border rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5",
                    s.border
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", s.bg, s.border.split(" ")[0])}>
                      <Icon className={cn("w-4 h-4", s.color)} />
                    </div>
                    {s.badge && (
                      <span className={cn(
                        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border tracking-wider",
                        s.badge === "ELITE" ? "bg-[rgba(212,175,55,0.08)] text-[#d4af37] border-[rgba(212,175,55,0.25)]" :
                        s.badge === "LIVE"  ? "bg-red-500/10 text-red-400 border-red-500/30" :
                        "bg-accent-dim text-accent border-accent-border"
                      )}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[12px] md:text-[13px] font-semibold text-text-primary mb-1 leading-snug">{s.label}</h3>
                  <p className="text-[10px] md:text-[11px] text-text-muted leading-relaxed">{s.desc}</p>
                  <div className="mt-3 flex justify-end">
                    <ArrowRight className={cn("w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity", s.color)} />
                  </div>
                </Link>
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

          {/* Tip of the day */}
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
