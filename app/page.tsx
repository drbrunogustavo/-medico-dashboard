import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Radio, FileText, Users, TrendingUp, Zap, ArrowRight, Layers, Video, Sparkles, Type, Hash, MessageSquare } from "lucide-react"
import Link from "next/link"
const MODULES = [
  { href: "/radar",      icon: Radio,         label: "Radar de Tendências",    description: "Monitora em tempo real os temas em alta — PubMed, Lancet, NEJM, Instagram e mais.", badge: "LIVE", accent: "green"  as const, stat: "Ativo",    category: "Redes Sociais" },
  { href: "/imagens",    icon: Layers,        label: "Gerador de Imagens",     description: "Cria carrosséis e posts com identidade visual premium — layouts escuros, tipografia Montserrat.", badge: null, accent: "purple" as const, stat: "IA ativa", category: "Redes Sociais" },
  { href: "/roteiros",   icon: Video,         label: "Gerador de Roteiros",    description: "Transforma uma pauta clínica em roteiro completo para Reels — gancho, desenvolvimento e CTA.", badge: null, accent: "blue"   as const, stat: "IA ativa", category: "Redes Sociais" },
  { href: "/legendas",   icon: Sparkles,      label: "Gerador de Legendas",    description: "Cria legendas otimizadas para Instagram com tom médico, hashtags e chamada para ação.", badge: null, accent: "blue"   as const, stat: "IA ativa", category: "Redes Sociais" },
  { href: "/titulos",    icon: Type,          label: "Gerador de Títulos",     description: "Gera títulos e headlines de alto impacto para posts, Reels e carrosséis médicos.", badge: null, accent: "blue"   as const, stat: "IA ativa", category: "Redes Sociais" },
  { href: "/hashtags",   icon: Hash,          label: "Análise de Hashtags",    description: "Analisa e sugere hashtags segmentadas para o nicho médico — alcance e relevância.", badge: null, accent: "amber"  as const, stat: "IA ativa", category: "Redes Sociais" },
  { href: "/ganchos",    icon: Zap,           label: "Biblioteca de Ganchos",  description: "Banco de frases de abertura para capturar atenção nos primeiros 3 segundos.", badge: null, accent: "amber"  as const, stat: "IA ativa", category: "Redes Sociais" },
  { href: "/pautas",     icon: FileText,      label: "Banco de Pautas",        description: "Repositório de ideias clínicas organizadas por categoria, prioridade e estágio.", badge: null, accent: "blue"   as const, stat: "0 pautas", category: "Redes Sociais" },
  { href: "/referencias",icon: Users,         label: "Monitor de Referências", description: "Acompanha médicos influentes no seu nicho — posts, temas e engajamento.", badge: null, accent: "amber"  as const, stat: "0 perfis", category: "Redes Sociais" },
  { href: "/whatsapp",   icon: MessageSquare, label: "Agente WhatsApp",        description: "Automatiza respostas, agendamentos e follow-ups com pacientes pelo WhatsApp.", badge: "NOVO", accent: "green" as const, stat: "Beta", category: "Produtividade" },
]
const S = {
  green:  { border: "border-accent/20 hover:border-accent/40",          badge: "bg-accent-dim text-accent border-accent-border",          icon: "bg-accent-dim text-accent",          arrow: "text-accent"      },
  blue:   { border: "border-blue/20 hover:border-blue/40",              badge: "bg-blue-dim text-blue border-blue-border",                icon: "bg-blue-dim text-blue",              arrow: "text-blue-text"   },
  amber:  { border: "border-warning/20 hover:border-warning/40",        badge: "bg-warning/10 text-amber-400 border-warning/30",          icon: "bg-warning/10 text-amber-400",       arrow: "text-amber-400"   },
  purple: { border: "border-purple-500/20 hover:border-purple-500/40",  badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",   icon: "bg-purple-500/10 text-purple-400",   arrow: "text-purple-400"  },
}
const grouped = MODULES.reduce((acc, m) => { if (!acc[m.category]) acc[m.category] = []; acc[m.category].push(m); return acc }, {} as Record<string, typeof MODULES>)
export default function HomePage() {
  const now = new Date()
  return (
    <div className="animate-fade-in">
      <TopBar title="Dashboard" subtitle={now.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })} />
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-accent" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[14px] md:text-[16px] font-semibold text-text-primary">Bem-vindo, Dr. Bruno Gustavo</h2>
            <p className="text-[12px] text-text-secondary mt-0.5">Dashboard de gestão de conteúdo médico — nutrologia, endocrinologia e longevidade.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent-border flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
            <span className="text-[9px] font-mono text-accent tracking-wider hidden sm:inline">SISTEMA ATIVO</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Módulos Ativos"  value="10" sub="todos os módulos"            icon={TrendingUp} accent="green" />
          <StatCard label="Pautas Salvas"   value="0"  sub="banco de pautas"             icon={FileText}   accent="blue"  />
          <StatCard label="Referências"     value="0"  sub="perfis monitorados"           icon={Users}      accent="amber" />
          <StatCard label="Tendências Hoje" value="—"  sub="abra o radar para atualizar" icon={Radio}      accent="green" />
        </div>
        {Object.entries(grouped).map(([cat, mods]) => (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase">{cat}</div>
              <div className="h-px flex-1 bg-border opacity-60" />
              <div className="text-[10px] font-mono text-text-muted">{mods.length} módulos</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {mods.map((mod) => {
                const Icon = mod.icon; const s = S[mod.accent]
                return (
                  <Link key={mod.href} href={mod.href} className={`group block bg-card border rounded-lg p-4 md:p-5 transition-all duration-200 hover:-translate-y-0.5 ${s.border}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.icon}`}><Icon className="w-3.5 h-3.5" /></div>
                      {mod.badge && <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border tracking-widest ${s.badge}`}>{mod.badge}</span>}
                    </div>
                    <h3 className="text-[13px] md:text-[14px] font-semibold text-text-primary mb-1.5">{mod.label}</h3>
                    <p className="text-[11px] md:text-[12px] text-text-secondary leading-relaxed mb-3">{mod.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-muted">{mod.stat}</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${s.arrow} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        <div className="bg-blue-dim border border-blue-border rounded-lg px-4 py-3 flex items-center gap-3">
          <Zap className="w-4 h-4 text-blue-text flex-shrink-0" />
          <p className="text-[11px] md:text-[12px] text-text-secondary"><span className="text-text-primary font-medium">Dica: </span>Comece pelo Radar de Tendências para capturar os temas em alta e transformá-los em pautas com um clique.</p>
        </div>
      </div>
    </div>
  )
}
