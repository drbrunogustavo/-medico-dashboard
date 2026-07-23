"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check, ChevronDown, ChevronUp, ArrowRight,
  Radio, Bot, Video, Layers, Zap, FileText,
  ScanFace, ShieldQuestion, Megaphone, Sparkles,
  Flame, CircleDollarSign, BarChart, Users, MessageSquare,
  Star, Crown, X, Stethoscope, Monitor, Smartphone,
  Shield, Lock, Mic,
} from "lucide-react"
import { PraxisLogo } from "@/components/PraxisLogo"
import { cn } from "@/lib/utils"

// ─── Palette (landing v2 — cream + navy + gold) ─────────────────────────────────
const CREAM     = "#F5F0E8"
const CREAM2    = "#EDE6DA"
const NAVY      = "#0D1B2A"
const NAVY2     = "#152B42"
const GOLD      = "#B8976A"
const GOLD_DARK = "#96784F"

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
  const heroRef                             = useRef<HTMLElement>(null)
  const [stats, setStats]                   = useState<{ medicos_ativos: number; consultas_realizadas: number } | null>(null)

  useEffect(() => {
    fetch("/api/landing/stats").then(r => r.json()).then(setStats).catch(() => null)
  }, [])

  const fmtStat = (n: number, threshold = 50) =>
    n < threshold ? null : n >= 1000 ? `+${Math.floor(n / 100) * 100}` : `+${n}`

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif", background: CREAM, color: NAVY }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{ height: 68, background: "rgba(245,240,232,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(13,27,42,0.10)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 38, height: 38, border: `1.5px solid ${GOLD}` }}>
            <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: GOLD, fontSize: 18, fontWeight: 700 }}>P</span>
          </div>
          <div className="leading-none">
            <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 19, fontWeight: 700, letterSpacing: "0.18em", color: NAVY }}>PRAXIS</div>
            <div className="mt-0.5" style={{ fontSize: 8.5, letterSpacing: "0.24em", color: GOLD_DARK, textTransform: "uppercase" }}>Sistema Operacional de Clínicas</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#plataforma" className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Plataforma</a>
          <a href="#copiloto"   className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Copiloto</a>
          <a href="#modulos"    className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Módulos</a>
          <a href="#planos"     className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Planos</a>
          <Link href="/planos"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.97]"
            style={{ background: NAVY, color: CREAM }}>
            Testar 7 dias grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section id="plataforma" ref={heroRef} className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden min-h-screen flex items-center"
        style={{ background: `radial-gradient(circle at 82% 12%, rgba(184,151,106,0.20), transparent 55%), ${CREAM}` }}>
        <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          {/* Esquerda */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7"
              style={{ background: "rgba(184,151,106,0.12)", border: "1px solid rgba(184,151,106,0.35)" }}>
              <span className="text-[10px] font-mono tracking-widest" style={{ color: GOLD_DARK }}>Consultório · Gestão · Marketing · Inteligência</span>
            </div>

            <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.08] mb-6"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Sua clínica inteira em <em style={{ color: GOLD_DARK, fontStyle: "italic" }}>um só sistema.</em>
            </h1>

            <p className="text-[17px] md:text-[18px] mb-8 leading-relaxed max-w-xl" style={{ color: NAVY2 }}>
              O PRAXIS documenta sua consulta por voz, organiza seus pacientes, controla seu financeiro e cria seu conteúdo médico. <strong style={{ color: NAVY }}>Tudo com IA. Tudo integrado. Tudo em um lugar.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button onClick={() => router.push('/planos')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-[15px] font-bold transition-all active:scale-[0.98]"
                style={{ background: NAVY, color: CREAM }}>
                Testar 7 dias grátis <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#copiloto"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-[15px] font-medium transition-all"
                style={{ border: `1px solid ${NAVY}`, color: NAVY }}>
                Ver o Copiloto em ação
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["Sem cartão de crédito", "Configuração em 5 minutos", "Cancele quando quiser"].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#2E9E6B" }} />
                  <span className="text-[12px]" style={{ color: NAVY2 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direita — mockup Copiloto (janela dark) */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: NAVY, border: `1px solid ${NAVY2}` }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: NAVY2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                <span className="ml-2 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>Copiloto de Consulta</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-semibold text-white">Ana Carolina M., 34 anos</div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Retorno · Endocrinologia</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "rgba(46,158,107,0.15)", border: "1px solid rgba(46,158,107,0.4)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: "#2E9E6B" }} />
                    <span className="text-[9px] font-mono tracking-wider" style={{ color: "#7fe0b0" }}>AO VIVO</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,151,106,0.15)", border: `1px solid ${GOLD}` }}>
                    <Mic className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-white">Gravando consulta…</div>
                    <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>08:42</div>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {["“…a fadiga melhorou bastante depois que ajustamos a dose.”", "“Continuo com dificuldade para perder peso, principalmente à tarde.”"].map((l, i) => (
                    <div key={i} className="text-[10.5px] leading-snug px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)" }}>{l}</div>
                  ))}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: GOLD }}>Gerado automaticamente</div>
                <div className="space-y-2">
                  {[{ icon: FileText, t: "Prontuário SOAP completo" }, { icon: Stethoscope, t: "Prescrição + exames" }, { icon: MessageSquare, t: "Seguimento D+1 · D+7 · D+30" }].map((r, i) => {
                    const Icon = r.icon
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                        <span className="text-[11.5px] text-white">{r.t}</span>
                        <Check className="w-3.5 h-3.5 ml-auto" style={{ color: "#2E9E6B" }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────────────────── */}
      <section className="py-6 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, t: "Dados em conformidade com a LGPD" },
            { icon: Users,  t: "Criado por médico, para médicos" },
            { icon: Lock,   t: "Prontuários criptografados" },
            { icon: Zap,    t: "Integração nativa com MedX" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-center gap-2.5 justify-center md:justify-start">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                <span className="text-[12px]" style={{ color: "rgba(245,240,232,0.85)" }}>{item.t}</span>
              </div>
            )
          })}
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

      {/* ── 3 AMBIENTES ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <SectionHeader label="Três ambientes, uma plataforma" title="Do atendimento à captação de pacientes." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: "01", icon: Stethoscope, title: "Consultório", desc: "Copiloto de voz documenta o prontuário, sugere condutas e agenda o seguimento pós-consulta em tempo real." },
              { num: "02", icon: Monitor,     title: "Gestão",      desc: "CRM de leads, financeiro com DRE, NPS de pacientes e indicadores da clínica integrados — sem planilha." },
              { num: "03", icon: Smartphone,  title: "Marketing",   desc: "Roteiros, carrosséis, legendas e calendário editorial gerados por IA com a sua especialidade." },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="relative flex flex-col gap-4 p-6 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,168,108,0.18)" }}>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(201,168,108,0.10)", border: "1px solid rgba(201,168,108,0.25)" }}>
                      <Icon className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                    <span className="text-[28px] font-bold leading-none"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "rgba(201,168,108,0.25)" }}>{item.num}</span>
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

      {/* ── FEATURE COPILOTO ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD }}>O coração da plataforma</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-4 leading-tight text-white"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              O Copiloto que trabalha depois que o paciente sai.
            </h2>
            <p className="text-[15px] mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
              Enquanto você atende, o Copiloto ouve, documenta e organiza. Ao final, o prontuário já sai pronto e o seguimento certo é disparado na hora certa — indicação, NPS e retorno, tudo automático.
            </p>
            <div className="space-y-3">
              {["Prontuário SOAP gerado automaticamente", "Sugestão de CID e condutas por especialidade", "Indicação e NPS agendados via WhatsApp (D+1, D+7, D+30)"].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.85)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,108,0.20)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>Ações pós-consulta</div>
            <div className="space-y-2">
              {[{ t: "Prontuário salvo", s: "há 2 segundos" }, { t: "Indicação D+1 agendada", s: "amanhã, 09:00" },
                { t: "NPS D+1 agendado", s: "amanhã, 09:00" }, { t: "Retorno D+30 agendado", s: "em 30 dias" }].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,108,0.15)", border: "1px solid rgba(201,168,108,0.30)" }}>
                      <Check className="w-3 h-3" style={{ color: GOLD }} />
                    </div>
                    <span className="text-[12px] text-white">{r.t}</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.40)" }}>{r.s}</span>
                </div>
              ))}
            </div>
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
                        "text-badge font-mono font-bold px-3 py-1 rounded-full border tracking-widest",
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
            <Link href="/termos" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Termos</Link>
            <Link href="/privacidade" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Privacidade</Link>
            <a href="https://wa.me/5535997688008" target="_blank" rel="noopener noreferrer"
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
