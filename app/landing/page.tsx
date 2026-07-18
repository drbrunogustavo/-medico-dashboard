"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check, ChevronDown, ChevronUp, ArrowRight,
  Radio, Bot, Video, Layers, Zap, FileText,
  ScanFace, ShieldQuestion, Megaphone, Sparkles,
  Flame, CircleDollarSign, BarChart, Users, MessageSquare,
  Star, Crown, X, Stethoscope, LineChart, Camera,
} from "lucide-react"
import { PraxisLogo } from "@/components/PraxisLogo"
import { cn } from "@/lib/utils"

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODULES = [
  { icon: Radio,            label: "Radar de Tendências",       desc: "Monitore temas em alta em tempo real com IA"         },
  { icon: Bot,              label: "Agente Executivo",          desc: "Calendário editorial completo em minutos"            },
  { icon: Video,            label: "Gerador de Roteiros",       desc: "Roteiros para Reels prontos para gravar"             },
  { icon: Layers,           label: "Diretor Criativo",          desc: "Artes e imagens premium com IA generativa"           },
  { icon: Zap,              label: "Biblioteca de Ganchos",     desc: "Aberturas que param o scroll instantaneamente"       },
  { icon: FileText,         label: "Banco de Pautas",           desc: "Repositório organizado de todas as suas ideias"      },
  { icon: ScanFace,         label: "Raio-X de Pacientes",       desc: "Psicologia e gatilhos do seu público ideal"          },
  { icon: ShieldQuestion,   label: "Mapa de Objeções",          desc: "Transforme dúvidas em conteúdo de conversão"         },
  { icon: Megaphone,        label: "Gerador de Ofertas",        desc: "Campanhas completas com roteiro e landing page"      },
  { icon: Sparkles,         label: "Gerador de Legendas",       desc: "Legendas otimizadas para engajamento máximo"         },
  { icon: Flame,            label: "Gerador de Polêmicas",      desc: "Conteúdo controverso ético que gera debate"          },
  { icon: CircleDollarSign, label: "Detector de Oportunidades", desc: "Identifique janelas de faturamento no seu nicho"     },
  { icon: BarChart,         label: "Análise de Concorrentes",   desc: "Monitore os melhores do seu nicho"                   },
  { icon: Users,            label: "Monitor de Referências",    desc: "Acompanhe médicos influentes para inspiração"        },
  { icon: MessageSquare,    label: "Agente WhatsApp",           desc: "Automação de mensagens para pacientes"               },
]

const PAINS = [
  { title: "Falta de tempo", desc: "Você tem consultório cheio, mas as redes ficam para depois. Sempre." },
  { title: "Conteúdo genérico", desc: "O que você posta não reflete sua real expertise e sofisticação." },
  { title: "Inconsistência", desc: "Semanas sem postar. Seguidores esfriam. Algoritmo pune. Ciclo vicioso." },
]

const STEPS = [
  { num: "01", title: "Escolha o módulo", desc: "Selecione a ferramenta ideal para o conteúdo que precisa criar hoje." },
  { num: "02", title: "Configure com IA", desc: "A PRAXIS elabora a estratégia, o roteiro, o prompt, a arte — tudo com Claude IA." },
  { num: "03", title: "Publique com autoridade", desc: "Conteúdo premium pronto para publicar. Sua expertise, amplificada." },
]

const TESTIMONIALS = [
  { name: "Dra. Fernanda Lopes", role: "Endocrinologista · SP", result: "3x mais engajamento em 60 dias", quote: "Finalmente consegui manter uma frequência de posts sem abrir mão do consultório. A PRAXIS pensa por mim quando não tenho tempo de pensar." },
  { name: "Dr. Ricardo Mendes", role: "Nutrólogo · MG", result: "+2.400 seguidores em 90 dias", quote: "O Agente Executivo me deu um calendário editorial para o mês inteiro em menos de 10 minutos. Mudou completamente minha relação com o conteúdo." },
  { name: "Dra. Camila Rocha", role: "Ginecologista · RJ", result: "Primeiro Reel viral com 180k views", quote: "Usei o Radar de Tendências para pegar uma pauta em alta e o roteiro ficou tão bom que viralizou. Nunca tinha tido resultado assim." },
]

const FAQS = [
  { q: "Preciso ter experiência com redes sociais?", a: "Não. A PRAXIS foi projetada para médicos que são especialistas em sua área, não em marketing. A plataforma guia você em cada etapa." },
  { q: "O conteúdo gerado é ético e dentro das normas do CFM?", a: "Sim. Todos os módulos foram desenvolvidos com as diretrizes éticas do CFM em mente. A IA é treinada para evitar linguagem promocional indevida e sensacionalismo." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem fidelidade, sem multa, sem burocracia. Você cancela quando quiser diretamente pelo painel." },
  { q: "A plataforma funciona para todas as especialidades?", a: "Sim. Endocrinologistas, nutrólogos, ginecologistas, cardiologistas, psiquiatras, dermatologistas — a PRAXIS se adapta ao seu nicho." },
  { q: "Quantas gerações posso fazer por mês?", a: "Depende do plano. Starter: 30/mês. Pro: 200/mês. Elite: ilimitado." },
  { q: "Os dados dos meus pacientes ficam seguros?", a: "A PRAXIS não armazena dados de pacientes. Você trabalha com conteúdo estratégico e de autoridade, nunca com casos clínicos identificáveis." },
  { q: "Posso usar no celular?", a: "Sim. A plataforma é responsiva e funciona bem em smartphones e tablets, além do desktop." },
  { q: "Como funciona o onboarding do plano Elite?", a: "No plano Elite, um especialista PRAXIS entra em contato em até 24h para uma sessão de 1 hora para configurar tudo para o seu perfil e nicho." },
]

const PLANS = [
  {
    id: "starter", name: "Starter", price: 97,
    badge: null as string | null, color: "text-text-secondary",
    border: "border-border", ctaBg: "bg-white/[0.06] hover:bg-white/[0.10]", ctaText: "text-text-secondary",
    features: ["Roteiros, Legendas, Ganchos", "Banco de Pautas", "30 gerações/mês", "Suporte por email"],
    excluded: ["Agente Executivo", "Radar de Tendências", "Diretor Criativo"],
    icon: Zap,
  },
  {
    id: "pro", name: "Pro", price: 197,
    badge: "RECOMENDADO", color: "text-accent",
    border: "border-accent-border", ctaBg: "bg-accent hover:opacity-90", ctaText: "text-background font-bold",
    features: ["Todos os módulos exceto Agente Executivo", "200 gerações/mês", "Suporte por WhatsApp", "Atualizações prioritárias"],
    excluded: ["Agente Executivo"],
    icon: Star,
  },
  {
    id: "elite", name: "Elite", price: 397,
    badge: "ELITE", color: "text-[#d4af37]",
    border: "border-[rgba(212,175,55,0.25)]", ctaBg: "bg-[#d4af37] hover:bg-[#e0bc40]", ctaText: "text-[#080808] font-bold",
    features: ["TODOS os 15 módulos", "Gerações ilimitadas", "WhatsApp prioritário", "Onboarding 1:1 com especialista"],
    excluded: [],
    icon: Crown,
  },
]

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      <p className="text-[10px] font-mono text-accent tracking-[3px] uppercase mb-3">{label}</p>
      <h2 className="text-[28px] md:text-[36px] font-semibold text-text-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
        {title}
      </h2>
      {sub && <p className="text-[15px] text-text-secondary leading-relaxed">{sub}</p>}
    </div>
  )
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-[14px] font-medium text-text-primary group-hover:text-accent transition-colors">{q}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-accent flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-text-secondary transition-colors" />}
      </button>
      {open && (
        <p className="pb-5 text-[13px] text-text-secondary leading-relaxed">
          {a}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router                              = useRouter()
  const [particleCount]                     = useState(20)
  const heroRef                             = useRef<HTMLElement>(null)
  const [stats, setStats]                   = useState<{ medicos_ativos: number; consultas_realizadas: number } | null>(null)

  useEffect(() => {
    fetch("/api/landing/stats").then(r => r.json()).then(setStats).catch(() => null)
  }, [])

  const fmtStat = (n: number, threshold = 50) =>
    n < threshold ? null : n >= 1000 ? `+${Math.floor(n / 100) * 100}` : `+${n}`

  return (
    <div className="fixed inset-0 z-[200] bg-background text-text-primary overflow-y-auto" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(8,8,8,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1f1f1f" }}>
        <PraxisLogo />
        <div className="flex items-center gap-4">
          <a href="#planos" className="hidden md:block text-[13px] text-text-muted hover:text-text-primary transition-colors">Planos</a>
          <Link href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-background bg-accent hover:opacity-90 transition-all active:scale-[0.97]">
            Acessar plataforma
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-24 px-6 md:px-12 overflow-hidden min-h-screen flex items-center">
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: i % 4 === 0 ? 3 : 2,
                height: i % 4 === 0 ? 3 : 2,
                background: `rgba(0,192,127,${0.10 + (i % 5) * 0.06})`,
                left: `${(i * 5.1) % 98}%`,
                top:  `${(i * 7.3 + 10) % 95}%`,
                animation: `particle ${18 + (i % 8) * 2}s ${i * 0.6}s linear infinite`,
              }}
            />
          ))}
        </div>
        {/* Accent glow */}
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent-border mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-blink" />
              <span className="text-[10px] font-mono text-accent tracking-widest">PLATAFORMA CLÍNICA COM IA</span>
            </div>

            <h1
              className="text-[38px] md:text-[56px] font-semibold text-text-primary leading-[1.1] mb-6"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Do consultório ao conteúdo — tudo em uma plataforma.
            </h1>

            <p className="text-[17px] md:text-[19px] text-text-secondary mb-10 leading-relaxed max-w-2xl">
              PRAXIS integra Copiloto de consulta com IA, CRM de pacientes, gestão financeira e marketing médico em uma única plataforma para médicos brasileiros.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/planos')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-accent text-background text-[15px] font-bold hover:opacity-90 transition-all active:scale-[0.98]"
              >
                Começar agora <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-border text-text-secondary text-[15px] font-medium hover:border-border-hover hover:text-text-primary transition-all"
              >
                Já tenho conta →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ────────────────────────────────────────────────── */}
      <section className="py-8 px-6 border-y border-border" style={{ background: "var(--surface-2)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              {
                value: stats ? fmtStat(stats.medicos_ativos) : null,
                fallback: "Beta exclusivo",
                label: "médicos pioneiros",
              },
              {
                value: stats ? fmtStat(stats.consultas_realizadas, 10) : null,
                fallback: null,
                label: "consultas documentadas com IA",
              },
              { value: "4.9★", fallback: "4.9★", label: "avaliação média" },
              { value: "~15 min", fallback: "~15 min", label: "economizados por consulta" },
            ].map((s, i) => {
              const display = s.value ?? s.fallback
              if (!display) return null
              return (
                <div key={i} className="text-center">
                  <div className="text-[22px] font-bold text-text-primary">{display}</div>
                  <div className="text-[11px] font-mono text-text-muted mt-0.5">{s.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            label="O problema"
            title="Você é um especialista. Mas nas redes, parece mais um."
            sub="Médicos altamente qualificados produzem conteúdo inconsistente porque falta tempo, estratégia e as ferramentas certas."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PAINS.map((p, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all">
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center mb-4">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-text-primary mb-2">{p.title}</h3>
                <p className="text-[13px] text-text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface-2)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            label="A solução"
            title="15 módulos de inteligência e criação."
            sub="Cada ferramenta foi desenvolvida especificamente para profissionais de saúde que querem uma presença digital de alto padrão."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {MODULES.map((m, i) => {
              const Icon = m.icon
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-surface border border-border rounded-xl hover:border-border-hover hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">{m.label}</div>
                    <div className="text-[11px] text-text-muted mt-0.5 leading-snug">{m.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            label="Como funciona"
            title="3 passos para conteúdo de alto impacto."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-[48px] font-bold leading-none mb-4"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "rgba(0,192,127,0.2)" }}
                >
                  {s.num}
                </div>
                <h3 className="text-[16px] font-semibold text-text-primary mb-2">{s.title}</h3>
                <p className="text-[13px] text-text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface-2)" }}>
        <div className="max-w-5xl mx-auto">
          <SectionHeader label="Resultados reais" title="Médicos que transformaram sua presença digital." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-6 hover:border-border-hover transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(0,192,127,0.25), rgba(0,192,127,0.08))", border: "1px solid rgba(0,192,127,0.2)" }}>
                    <span className="text-[12px] font-bold text-accent">{t.name.split(" ").slice(1, 3).map(w => w[0]).join("")}</span>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-text-primary">{t.name}</div>
                    <div className="text-[10px] text-text-muted">{t.role}</div>
                  </div>
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-dim border border-accent-border">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  <span className="text-[11px] text-accent font-medium">{t.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            label="Para quem é o PRAXIS"
            title="Uma plataforma para cada momento da sua rotina."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Stethoscope,
                color: "#00c07f",
                bg: "rgba(0,192,127,0.08)",
                border: "rgba(0,192,127,0.2)",
                title: "Na consulta",
                desc: "Copiloto com IA documenta o prontuário, sugere condutas e gera seguimento pós-consulta em tempo real.",
              },
              {
                icon: LineChart,
                color: "#3b7fff",
                bg: "rgba(59,127,255,0.08)",
                border: "rgba(59,127,255,0.2)",
                title: "Na gestão",
                desc: "CRM de leads, financeiro com DRE, NPS de pacientes e indicadores integrados — sem planilha.",
              },
              {
                icon: Camera,
                color: "#a855f7",
                bg: "rgba(168,85,247,0.08)",
                border: "rgba(168,85,247,0.2)",
                title: "No marketing",
                desc: "Roteiros, carrosséis, legendas e calendário editorial gerados por IA com a sua especialidade.",
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex flex-col gap-4 p-6 rounded-xl border hover:border-border-hover transition-all"
                  style={{ background: item.bg, borderColor: item.border }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.2)", border: `1px solid ${item.border}` }}>
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-text-primary mb-1">{item.title}</h3>
                    <p className="text-[13px] text-text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            label="Planos"
            title="Investimento que se paga no primeiro mês."
            sub="Cancele quando quiser. Sem fidelidade, sem burocracia."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col bg-surface border rounded-xl p-6 transition-all",
                    plan.border,
                    plan.id === "pro" && "shadow-lg shadow-accent/5"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={cn(
                        "text-[9px] font-mono font-bold px-3 py-1 rounded-full border tracking-widest",
                        plan.id === "pro"
                          ? "bg-accent text-background border-accent"
                          : "bg-[#d4af37] text-[#080808] border-[#d4af37]"
                      )}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={cn("w-5 h-5", plan.color)} />
                    <span className={cn("text-[16px] font-semibold", plan.color)}>{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-[11px] text-text-muted font-mono">R$</span>
                    <span className={cn("text-[34px] font-bold leading-none", plan.color)}>{plan.price}</span>
                    <span className="text-[12px] text-text-muted">/mês</span>
                  </div>
                  <div className="flex-1 space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span className="text-[12px] text-text-secondary">{f}</span>
                      </div>
                    ))}
                    {plan.excluded.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-text-muted/40 flex-shrink-0" />
                        <span className="text-[12px] text-text-muted/50">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/planos')}
                    className={cn("w-full py-3 rounded-lg text-[13px] transition-all active:scale-[0.98] min-h-[48px]", plan.ctaBg, plan.ctaText)}
                  >
                    Assinar {plan.name}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface-2)" }}>
        <div className="max-w-2xl mx-auto">
          <SectionHeader label="Dúvidas frequentes" title="Tudo que você precisa saber." />
          <div>
            {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-[30px] md:text-[40px] font-semibold text-text-primary mb-4"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Comece hoje. Cancele quando quiser.
          </h2>
          <p className="text-[15px] text-text-secondary mb-8">
            Junte-se aos profissionais de saúde que já usam PRAXIS para construir uma presença digital de alto padrão.
          </p>
          <button
            onClick={() => router.push('/planos')}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-accent text-background text-[15px] font-bold hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Começar agora <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <PraxisLogo />
          <div className="flex items-center gap-6">
            <a href="#planos" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Planos</a>
            <Link href="/login" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Entrar</Link>
            <a href="https://wa.me/5535999999999" target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-text-muted hover:text-accent transition-colors">WhatsApp</a>
          </div>
          <p className="text-[11px] text-text-muted text-center md:text-right">
            © {new Date().getFullYear()} PRAXIS · Marketing Médico de Alto Padrão
            <br />
            <span className="text-[10px]">Conteúdo informativo. Consulte sempre um médico especialista.</span>
          </p>
        </div>
      </footer>

    </div>
  )
}
