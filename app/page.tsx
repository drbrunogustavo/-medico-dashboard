"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import {
  Bot, Radio, ScanFace, ShieldQuestion, CircleDollarSign,
  Video, Layers, FileText, Zap, Lightbulb, ArrowRight,
  TrendingUp, Users, Activity, BarChart,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

// ─── Data ───────────────────────────────────────────────────────────────────────

const SHORTCUTS = [
  {
    href: "/agente",        icon: Bot,             label: "Agente Executivo",
    desc: "Conteúdo completo em lote",            badge: "PRO",
    color: "text-amber-400",  bg: "bg-amber-950/20", border: "border-amber-500/20 hover:border-amber-500/40",
  },
  {
    href: "/radar",         icon: Radio,           label: "Radar de Tendências",
    desc: "Temas em alta em tempo real",          badge: "LIVE",
    color: "text-red-400",    bg: "bg-red-950/20",   border: "border-red-500/20 hover:border-red-500/40",
  },
  {
    href: "/raio-x",        icon: ScanFace,        label: "Raio-X de Pacientes",
    desc: "Psicologia e gatilhos do paciente",    badge: null,
    color: "text-purple-400", bg: "bg-purple-950/20",border: "border-purple-500/20 hover:border-purple-500/40",
  },
  {
    href: "/objecoes",      icon: ShieldQuestion,  label: "Mapa de Objeções",
    desc: "Transforme dúvidas em conteúdo",      badge: null,
    color: "text-amber-400",  bg: "bg-amber-950/20", border: "border-amber-500/20 hover:border-amber-500/40",
  },
  {
    href: "/oportunidades", icon: CircleDollarSign,label: "Oportunidades",
    desc: "Detecte momentos de faturamento",     badge: null,
    color: "text-green-400",  bg: "bg-green-950/20", border: "border-green-500/20 hover:border-green-500/40",
  },
  {
    href: "/roteiros",      icon: Video,           label: "Gerador de Roteiros",
    desc: "Roteiros completos para Reels",        badge: null,
    color: "text-blue-400",   bg: "bg-blue-950/20",  border: "border-blue-500/20 hover:border-blue-500/40",
  },
  {
    href: "/imagens",       icon: Layers,          label: "Diretor Criativo",
    desc: "Artes e headlines com IA",             badge: null,
    color: "text-pink-400",   bg: "bg-pink-950/20",  border: "border-pink-500/20 hover:border-pink-500/40",
  },
  {
    href: "/pautas",        icon: FileText,        label: "Banco de Pautas",
    desc: "Gerencie suas ideias de conteúdo",    badge: null,
    color: "text-orange-400", bg: "bg-orange-950/20",border: "border-orange-500/20 hover:border-orange-500/40",
  },
]

const DICAS = [
  { dica: "Conteúdo motivacional e de estilo de vida performam bem aos domingos.", acao: { label: "Gerar Roteiro", href: "/roteiros" } },
  { dica: "Ótimo dia para planejar a semana. Use o Agente Executivo para criar um calendário editorial completo.", acao: { label: "Abrir Agente", href: "/agente" } },
  { dica: "Terça tem excelente alcance para conteúdo científico e educativo.", acao: { label: "Explorar Radar", href: "/radar" } },
  { dica: "Posts de perguntas e enquetes têm maior engajamento às quartas.", acao: { label: "Mapa de Objeções", href: "/objecoes" } },
  { dica: "Quinta é ideal para carrosséis longos e conteúdo aprofundado.", acao: { label: "Diretor Criativo", href: "/imagens" } },
  { dica: "Depoimentos e histórias de transformação têm alto alcance às sextas.", acao: { label: "Criar Roteiro", href: "/roteiros" } },
  { dica: "Sábado é ótimo para conteúdo de bastidores e mais pessoal.", acao: { label: "Ver Referências", href: "/referencias" } },
]

interface Pauta { id: number | string; titulo: string; categoria: string }

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [pautasCount,   setPautasCount]   = useState<number | null>(null)
  const [recentPautas,  setRecentPautas]  = useState<Pauta[]>([])
  const [lastAccess,    setLastAccess]    = useState<string | null>(null)
  const [greet]                           = useState(greeting)
  const [dateStr]                         = useState(fmtDate)

  const dica    = DICAS[new Date().getDay()]
  const MODULES = 14

  useEffect(() => {
    const prev = localStorage.getItem("medcontent_last_access")
    if (prev) setLastAccess(prev)
    localStorage.setItem("medcontent_last_access", new Date().toLocaleString("pt-BR"))

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
      <TopBar title="Dashboard" subtitle={dateStr} />

      <div className="p-4 md:p-8 space-y-6">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-5 md:p-6 flex items-center gap-4">
          <div className="relative w-11 h-11 rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-accent" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent animate-blink" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] md:text-[17px] font-bold text-text-primary">
              {greet}, Dr. Bruno.
            </h2>
            <p className="text-[12px] text-text-secondary mt-0.5 capitalize">{dateStr} · Aqui está o resumo do dia.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent-border flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
            <span className="text-[9px] font-mono text-accent tracking-wider">SISTEMA ATIVO</span>
          </div>
        </div>

        {/* ── StatCards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Banco de Pautas"
            value={pautasCount ?? "—"}
            sub={pautasCount === null ? "carregando..." : `ideia${pautasCount !== 1 ? "s" : ""} salva${pautasCount !== 1 ? "s" : ""}`}
            icon={FileText}
            accent="green"
          />
          <StatCard
            label="Módulos Ativos"
            value={MODULES}
            sub="ferramentas disponíveis"
            icon={TrendingUp}
            accent="blue"
          />
          <StatCard
            label="Última Sessão"
            value={lastAccess ? lastAccess.split(",")[0] : "—"}
            sub={lastAccess ? lastAccess.split(",")[1]?.trim() ?? "" : "primeiro acesso"}
            icon={Activity}
            accent="amber"
          />
          <StatCard
            label="IA Conectada"
            value="Claude"
            sub="Sonnet 4 · Online"
            icon={Bot}
            accent="green"
          />
        </div>

        {/* ── Shortcuts grid ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase">Acesso rápido</div>
            <div className="h-px flex-1 bg-border opacity-60" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SHORTCUTS.map(s => {
              const Icon = s.icon
              return (
                <Link
                  key={s.href + s.label}
                  href={s.href}
                  className={cn(
                    "group block bg-card border rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5",
                    s.border
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", s.bg, "border", s.border.split(" ")[0])}>
                      <Icon className={cn("w-4 h-4", s.color)} />
                    </div>
                    {s.badge && (
                      <span className={cn(
                        "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border tracking-wider",
                        s.badge === "PRO"  ? "bg-amber-950/60 text-amber-400 border-amber-500/40" :
                        s.badge === "LIVE" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                        "bg-accent-dim text-accent border-accent-border"
                      )}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[12px] md:text-[13px] font-semibold text-text-primary mb-1 leading-snug">{s.label}</h3>
                  <p className="text-[10px] md:text-[11px] text-text-secondary leading-relaxed">{s.desc}</p>
                  <div className="mt-3 flex justify-end">
                    <ArrowRight className={cn("w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity", s.color)} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Bottom row: Recent pautas + Tip ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Recent pautas */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
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
                      <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
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
                  <FileText className="w-7 h-7 text-text-muted/40" />
                  <div className="text-center">
                    <p className="text-[12px] text-text-muted">Nenhuma pauta ainda.</p>
                    <Link href="/pautas" className="text-[11px] text-accent hover:underline mt-0.5 inline-block">
                      Importar do Radar →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tip of the day */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[12px] font-semibold text-text-primary">Dica do Dia</span>
              <span className="ml-auto text-[9px] font-mono text-text-muted uppercase tracking-wider">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][new Date().getDay()]}
              </span>
            </div>
            <div className="p-5 flex flex-col gap-4 h-full">
              <p className="text-[13px] text-text-secondary leading-relaxed flex-1">
                {dica.dica}
              </p>
              <Link
                href={dica.acao.href}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-semibold hover:bg-accent/20 transition-all min-h-[44px]"
              >
                {dica.acao.label} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Analytics hint ────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-500/20 rounded-lg px-4 py-3.5">
          <BarChart className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-text-secondary leading-relaxed">
            <span className="text-text-primary font-medium">Novo: </span>
            Análise de Concorrentes em desenvolvimento — monitore médicos concorrentes e identifique gaps de conteúdo.{" "}
            <Link href="/concorrentes" className="text-blue-400 hover:underline">Saiba mais →</Link>
          </p>
        </div>

      </div>
    </div>
  )
}
