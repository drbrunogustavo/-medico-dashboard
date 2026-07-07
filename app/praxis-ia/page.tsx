"use client"

import Link from "next/link"
import { TopBar } from "@/components/TopBar"
import {
  Bot, FlaskConical, Stethoscope, FileSearch, Brain,
  BarChart3, Sparkles, TrendingUp, Users, Search,
  FileUp, Lightbulb, Calendar, MessageSquare,
  Zap, BookOpen, Target, Wand2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Ferramenta {
  icon:   React.ElementType
  titulo: string
  desc:   string
  href:   string
  badge?: string
}

interface Categoria {
  id:          string
  label:       string
  cor:         string
  border:      string
  bg:          string
  ferramentas: Ferramenta[]
}

const CATEGORIAS: Categoria[] = [
  {
    id:     "clinico",
    label:  "Clínico",
    cor:    "text-blue-400",
    border: "border-blue-500/20",
    bg:     "bg-blue-500/6",
    ferramentas: [
      { icon: Bot,          titulo: "Copiloto de Consulta",        desc: "Prontuário estruturado + gravação de voz",              href: "/copiloto",              badge: "MAIS USADO" },
      { icon: MessageSquare, titulo: "Conversa Clínica",            desc: "Análise completa do caso: exames, prescrição e carta",   href: "/conversa",              badge: "NOVO" },
      { icon: FlaskConical, titulo: "Interpretação de Exames",     desc: "TSH, ferritina, vitamina D e 60+ exames",               href: "/interpretacao-exames"  },
      { icon: Stethoscope,  titulo: "Emagrecimento Inteligente",   desc: "Análise metabólica personalizada por perfil",           href: "/emagrecimento"         },
      { icon: FileSearch,   titulo: "Prescrição Assistida",        desc: "Sugestão de medicamentos baseada no diagnóstico",       href: "/prescricao"            },
      { icon: FileUp,       titulo: "Importar Exames PDF",         desc: "Extrai valores de laudos com IA automaticamente",       href: "/pacientes",            badge: "NOVO" },
      { icon: Brain,        titulo: "Memória Clínica",             desc: "Contexto da sua especialidade e protocolos",            href: "/memoria"               },
    ],
  },
  {
    id:     "social",
    label:  "Social",
    cor:    "text-pink-400",
    border: "border-pink-500/20",
    bg:     "bg-pink-500/6",
    ferramentas: [
      { icon: Wand2,        titulo: "Copiloto de Conteúdo",        desc: "Cria posts, roteiros e legendas com IA",                href: "/copiloto-conteudo"     },
      { icon: Lightbulb,    titulo: "Ideias do Consultório",       desc: "Gera pautas baseadas nos seus casos reais",             href: "/pautas",               badge: "NOVO" },
      { icon: TrendingUp,   titulo: "Radar de Tendências",         desc: "Tópicos médicos em alta para criar conteúdo",           href: "/radar"                 },
      { icon: Target,       titulo: "Posicionamento",              desc: "Descubra e refine seu nicho e diferencial",             href: "/posicionamento"        },
      { icon: Zap,          titulo: "Ganchos",                     desc: "Frases de impacto classificadas por emoção",            href: "/ganchos"               },
      { icon: BookOpen,     titulo: "Diretor Criativo",            desc: "Gera temas, ângulos e formatos por especialidade",      href: "/diretor-criativo"      },
      { icon: MessageSquare, titulo: "Comunidade",                 desc: "Troca de protocolos e experiências entre médicos",       href: "/comunidade",            badge: "NOVO" },
    ],
  },
  {
    id:     "executivo",
    label:  "Executivo",
    cor:    "text-accent",
    border: "border-accent/20",
    bg:     "bg-accent/6",
    ferramentas: [
      { icon: BarChart3,    titulo: "Análise do Mês",              desc: "Insights executivos sobre faturamento e crescimento",   href: "/executivo",            badge: "NOVO" },
      { icon: Sparkles,     titulo: "Sugestões no Dashboard",      desc: "Cards IA contextuais ao abrir o sistema",               href: "/dashboard",            badge: "NOVO" },
      { icon: MessageSquare,titulo: "NPS + Régua de Relacionamento", desc: "Automatiza seguimento pós-consulta com IA",           href: "/nps"                   },
      { icon: Users,        titulo: "Nutrição de Leads",           desc: "Sequência de conteúdo personalizada por perfil",        href: "/nutricao-leads"        },
      { icon: Target,       titulo: "Diagnóstico 360°",            desc: "Saúde completa do consultório em um painel",            href: "/diagnostico"           },
      { icon: BookOpen,     titulo: "Scripts de Vendas",           desc: "Objeções, scripts e CTA gerados por IA",               href: "/scripts"               },
    ],
  },
  {
    id:     "pacientes",
    label:  "Pacientes",
    cor:    "text-violet-400",
    border: "border-violet-500/20",
    bg:     "bg-violet-500/6",
    ferramentas: [
      { icon: Search,       titulo: "Busca Semântica",             desc: "Encontra pacientes por queixas, exames ou diagnósticos", href: "/pacientes",            badge: "NOVO" },
      { icon: Calendar,     titulo: "Briefing do Dia",             desc: "Resumo IA dos agendamentos antes de começar",           href: "/agenda",               badge: "NOVO" },
      { icon: FlaskConical, titulo: "Gráfico de Peso",             desc: "Evolução visual de exames por paciente",                href: "/pacientes",            badge: "NOVO" },
      { icon: FileSearch,   titulo: "Prontuário Inteligente",      desc: "Parser automático de seções no Copiloto",               href: "/copiloto"              },
      { icon: Stethoscope,  titulo: "Protocolos Clínicos",         desc: "Stepper visual de diagnóstico → seguimento",            href: "/protocolos"            },
      { icon: Wand2,        titulo: "Relatório do Paciente",       desc: "Gera relatório PDF completo para o paciente",           href: "/relatorio-paciente"    },
    ],
  },
]

const BADGE_STYLE: Record<string, string> = {
  "NOVO":       "bg-accent-dim border-accent-border text-accent",
  "MAIS USADO": "bg-blue-500/12 border-blue-500/30 text-blue-400",
}

export default function PraxisIaPage() {
  return (
    <div className="animate-fade-in">
      <TopBar
        title="Hub de IA"
        subtitle="FERRAMENTAS DE INTELIGÊNCIA ARTIFICIAL · PRAXIS"
      />
      <div className="p-4 md:p-8 space-y-8">

        {/* Intro */}
        <div className="bg-card border border-accent-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono text-accent tracking-widest uppercase">Inteligência Artificial</span>
          </div>
          <p className="text-[13px] text-text-secondary leading-relaxed mt-1">
            Todas as ferramentas de IA da plataforma organizadas por área. Cada uma usa Claude com contexto da sua especialidade e dados reais da sua clínica.
          </p>
        </div>

        {/* Categorias */}
        {CATEGORIAS.map(cat => (
          <section key={cat.id}>
            <div className="flex items-center gap-2 mb-4">
              <span className={cn("text-[10px] font-mono font-semibold tracking-widest uppercase", cat.cor)}>{cat.label}</span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-mono text-text-muted">{cat.ferramentas.length} ferramentas</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cat.ferramentas.map(f => {
                const Icon = f.icon
                return (
                  <Link
                    key={f.href + f.titulo}
                    href={f.href}
                    className={cn(
                      "group flex items-start gap-3.5 p-4 rounded-lg border transition-all duration-150 hover:border-opacity-60",
                      cat.bg, cat.border,
                      "hover:scale-[1.01]"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-background border", cat.border)}>
                      <Icon className={cn("w-4 h-4", cat.cor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[13px] font-semibold text-text-primary group-hover:text-white transition-colors leading-snug">{f.titulo}</span>
                        {f.badge && (
                          <span className={cn("text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full border", BADGE_STYLE[f.badge] ?? BADGE_STYLE["NOVO"])}>
                            {f.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}

      </div>
    </div>
  )
}
