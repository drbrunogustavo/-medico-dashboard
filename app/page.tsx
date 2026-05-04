import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Radio, FileText, Users, TrendingUp, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"

const MODULES = [
  {
    href: "/radar",
    icon: Radio,
    label: "Radar de Tendências",
    description: "Monitora em tempo real os temas em alta no seu nicho — PubMed, Lancet, NEJM, Instagram e mais.",
    badge: "LIVE",
    accent: "green" as const,
    stat: "Ativo",
  },
  {
    href: "/pautas",
    icon: FileText,
    label: "Banco de Pautas",
    description: "Repositório de ideias clínicas organizadas por categoria, prioridade e estágio de produção.",
    badge: null,
    accent: "blue" as const,
    stat: "0 pautas",
  },
  {
    href: "/referencias",
    icon: Users,
    label: "Monitor de Referências",
    description: "Acompanha médicos influentes no seu nicho — frequência de posts, temas abordados e engajamento.",
    badge: null,
    accent: "amber" as const,
    stat: "0 perfis",
  },
]

const ACCENT_STYLES = {
  green: {
    border: "border-accent/20 hover:border-accent/40",
    badge: "bg-accent-dim text-accent border-accent-border",
    icon: "bg-accent-dim text-accent",
    arrow: "text-accent",
  },
  blue: {
    border: "border-blue/20 hover:border-blue/40",
    badge: "bg-blue-dim text-blue border-blue-border",
    icon: "bg-blue-dim text-blue",
    arrow: "text-blue-text",
  },
  amber: {
    border: "border-warning/20 hover:border-warning/40",
    badge: "bg-warning/10 text-amber-400 border-warning/30",
    icon: "bg-warning/10 text-amber-400",
    arrow: "text-amber-400",
  },
}

export default function HomePage() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Dashboard"
        subtitle={`${dateStr} · ${timeStr}`}
      />

      <div className="p-8 space-y-8">
        {/* Welcome */}
        <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-[16px] font-semibold text-text-primary">
              Bem-vindo, Dr. Bruno Gustavo
            </h2>
            <p className="text-[13px] text-text-secondary mt-0.5">
              Seu dashboard de gestão de conteúdo médico para Instagram — nutrologia, endocrinologia e longevidade.
            </p>
          </div>
          <div className="ml-auto flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent-border">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
              <span className="text-[10px] font-mono text-accent tracking-wider">SISTEMA ATIVO</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Módulos Ativos"  value="3"  sub="radar · pautas · referências" icon={TrendingUp} accent="green" />
          <StatCard label="Pautas Salvas"   value="0"  sub="banco de pautas"              icon={FileText}   accent="blue"  />
          <StatCard label="Referências"     value="0"  sub="perfis monitorados"            icon={Users}      accent="amber" />
          <StatCard label="Tendências Hoje" value="—"  sub="abra o radar para atualizar"  icon={Radio}      accent="green" />
        </div>

        {/* Modules grid */}
        <div>
          <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-4">
            Módulos do sistema
          </div>
          <div className="grid grid-cols-3 gap-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon
              const s = ACCENT_STYLES[mod.accent]
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`group block bg-card border rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5 ${s.border}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {mod.badge && (
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-widest ${s.badge}`}>
                        {mod.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[14px] font-semibold text-text-primary mb-2">{mod.label}</h3>
                  <p className="text-[12px] text-text-secondary leading-relaxed mb-4">{mod.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text-muted">{mod.stat}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${s.arrow} opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200`} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Quick tip */}
        <div className="bg-blue-dim border border-blue-border rounded-lg px-5 py-4 flex items-center gap-4">
          <Zap className="w-4 h-4 text-blue-text flex-shrink-0" />
          <p className="text-[12px] text-text-secondary">
            <span className="text-text-primary font-medium">Dica: </span>
            Comece pelo Radar de Tendências para capturar os temas em alta e transformá-los em pautas com um clique.
          </p>
        </div>
      </div>
    </div>
  )
}
