"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Shield,
  Zap, Star, Crown, Megaphone, Stethoscope, TrendingUp,
  Bot, BarChart3, Users, Brain, Target, Settings,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { SimuladorROI } from "@/components/SimuladorROI"

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG   = "#F5F0E8"
const GOLD  = "#b8976a"
const DARK  = "#0D1B2A"
const TEXT2 = "#6a5a4a"
const MUTED = "#8a7a6a"
const CARD  = "#FFFFFF"
const BORDER = "rgba(13,27,42,0.10)"

// ─── FadeUp animation ────────────────────────────────────────────────────────

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DEPOIMENTOS = [
  {
    iniciais: "MC", nome: "Dr. Marcelo Costa", crm: "CRM-SP 89.234", cidade: "São Paulo, SP",
    especialidade: "Cardiologista",
    texto: "Em 45 dias lotei minha agenda. O PRAXIS gerou meu conteúdo, organizou meus leads e me deu o posicionamento que eu precisava.",
    resultado: "+R$18.000/mês",
    cor: "#3b82f6",
  },
  {
    iniciais: "AF", nome: "Dra. Ana Figueiredo", crm: "CRM-RJ 12.987", cidade: "Rio de Janeiro, RJ",
    especialidade: "Endocrinologista",
    texto: "Saí de 800 para 4.200 seguidores em 60 dias. Meu Instagram virou canal de captação real de pacientes.",
    resultado: "Agenda cheia em 60 dias",
    cor: "#16a34a",
  },
  {
    iniciais: "PR", nome: "Dr. Pedro Rocha", crm: "CRM-MG 45.671", cidade: "Belo Horizonte, MG",
    especialidade: "Dermatologista",
    texto: "Eu gastava R$3.000/mês com agência e não via resultado. O PRAXIS custou R$397 e entregou 10x mais.",
    resultado: "3.000 seguidores em 30 dias",
    cor: GOLD,
  },
]

const ATIVIDADES = [
  "🟢 Dr. Carlos (SP) acabou de assinar o OS",
  "🟢 Dra. Ana (RJ) gerou 30 dias de conteúdo",
  "🟢 Dr. Pedro (MG) configurou o CRM de leads",
  "🟢 Dra. Juliana (RS) agendou 12 consultas hoje",
  "🟢 Dr. Thiago (BA) publicou o primeiro Reel com IA",
]

const PLANOS = [
  {
    id: "starter", icon: Megaphone, name: "PRAXIS Social", tagline: "Para começar a atrair pacientes",
    price: "R$97", daily: "R$3,20",
    color: "#3b7fff", border: "rgba(59,127,255,0.25)", badge: null,
    features: [
      "Gerador de Roteiros, Legendas e Reels",
      "Calendário editorial 30 dias",
      "Radar de Tendências médicas",
      "Banco de Pautas clínicas",
      "100 gerações de conteúdo/mês",
    ],
  },
  {
    id: "pro", icon: Stethoscope, name: "PRAXIS Growth", tagline: "Para converter e fidelizar",
    price: "R$197", daily: "R$6,55",
    color: GOLD, border: "rgba(184,151,106,0.35)", badge: "MAIS ESCOLHIDO",
    features: [
      "Tudo do PRAXIS Social",
      "CRM de Leads + Nurturing automático",
      "Copiloto de Consulta IA",
      "Scripts, Objeções e SOPs",
      "200 gerações/mês",
    ],
  },
  {
    id: "elite", icon: Crown, name: "PRAXIS OS", tagline: "O sistema operacional completo",
    price: "R$397", daily: "R$13,20",
    color: "#c8a355", border: "rgba(200,163,85,0.30)", badge: "COMPLETO",
    features: [
      "Tudo do PRAXIS Growth",
      "Painel Executivo + Consultor IA",
      "Inteligência de Mercado",
      "Diagnóstico 360° da clínica",
      "Gerações ilimitadas + onboarding 1:1",
    ],
  },
]

const FAQ_ITEMS = [
  { q: "Preciso saber sobre tecnologia?", a: "Não. O PRAXIS foi criado para médicos, não para técnicos. A interface é intuitiva e você recebe conteúdo pronto em minutos." },
  { q: "Funciona para qualquer especialidade?", a: "Sim. Temos médicos de mais de 25 especialidades usando o PRAXIS. A IA se adapta ao seu nicho, linguagem e público." },
  { q: "Como funciona o trial gratuito?", a: "Você tem 7 dias para explorar todos os módulos sem restrições. Sem cartão de crédito necessário para o trial." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, com 1 clique nas configurações. Sem perguntas, sem burocracia, sem multa." },
  { q: "O conteúdo gerado é personalizado para mim?", a: "Completamente. A IA usa seu perfil, especialidade, localização e público-alvo para gerar conteúdo que parece ter sido escrito por você." },
]

// ─── Inline logo ──────────────────────────────────────────────────────────────

function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke={GOLD} strokeWidth="1.5"
          strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
        <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke={DARK}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="14" x2="23" y2="22" stroke={GOLD}
          strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: size < 26 ? 13 : 15, fontWeight: 600, letterSpacing: "4px", color: DARK }}>
        PRAXIS
      </span>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SLabel({ children }: { children: string }) {
  return <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>{children}</p>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const ctaHref = "/planos"
  const appHref = !authLoading && user ? "/dashboard" : "/login"

  const [atividadeIdx, setAtividadeIdx] = useState(0)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  useEffect(() => {
    const t = setInterval(() => setAtividadeIdx(i => (i + 1) % ATIVIDADES.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: BG, fontFamily: "Inter, sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(245,240,232,0.92)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
        <Logo />
        <div className="flex items-center gap-4 md:gap-6">
          <a href="#pilares" className="hidden md:block text-[12px] transition-colors" style={{ color: TEXT2 }}
            onMouseEnter={e => (e.currentTarget.style.color = DARK)} onMouseLeave={e => (e.currentTarget.style.color = TEXT2)}>
            Como funciona
          </a>
          <Link href="/planos" className="hidden md:block text-[12px] transition-colors" style={{ color: TEXT2 }}
            onMouseEnter={e => (e.currentTarget.style.color = DARK)} onMouseLeave={e => (e.currentTarget.style.color = TEXT2)}>
            Planos
          </Link>
          <Link href={appHref} className="text-[12px] transition-colors" style={{ color: TEXT2 }}
            onMouseEnter={e => (e.currentTarget.style.color = DARK)} onMouseLeave={e => (e.currentTarget.style.color = TEXT2)}>
            {!authLoading && user ? "Acessar plataforma" : "Entrar"}
          </Link>
          <Link href={ctaHref}
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-[12px] transition-all hover:opacity-90"
            style={{ padding: "8px 18px", background: DARK, color: GOLD }}>
            Começar grátis <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </nav>

      {/* ── SEÇÃO 1 — HERO ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Live activity badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-[11px] font-mono"
          style={{ background: CARD, border: BORDER, color: MUTED }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          {ATIVIDADES[atividadeIdx]}
        </div>

        <FadeUp>
          <div className="mb-4">
            <span style={{ display: "inline-block", fontSize: 11, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", border: `1px solid ${GOLD}40`, padding: "4px 14px", borderRadius: 999, marginBottom: 20 }}>
              ⭐ 127 médicos já usam o PRAXIS
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(28px, 5vw, 60px)",
            fontWeight: 700, color: DARK, lineHeight: 1.15,
            marginBottom: 20,
          }}>
            Construa autoridade.<br />
            Automatize sua clínica.<br />
            <span style={{ color: GOLD }}>Multiplique seus resultados.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: TEXT2, lineHeight: 1.7, maxWidth: 640, margin: "0 auto 36px" }}>
            O sistema operacional do médico moderno.<br />
            Marketing, gestão clínica e inteligência artificial em um único lugar.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={ctaHref}
              className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ padding: "16px 36px", fontSize: 15, background: GOLD, color: DARK, boxShadow: `0 8px 40px ${GOLD}35` }}>
              Começar 7 dias grátis <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/demo"
              className="inline-flex items-center gap-2 rounded-xl font-semibold text-[14px] transition-all hover:opacity-80"
              style={{ padding: "16px 28px", background: "rgba(13,27,42,0.06)", color: DARK, border: `1px solid ${BORDER}` }}>
              Ver demonstração →
            </Link>
          </div>

          {/* Social proof metrics */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12">
            {[
              { v: "127+", l: "médicos ativos" },
              { v: "4.9★", l: "avaliação média" },
              { v: "R$2.3M", l: "gerados pelos usuários" },
              { v: "7 dias", l: "para ver resultados" },
            ].map(({ v, l }) => (
              <div key={l} className="text-center">
                <div style={{ fontSize: 22, fontWeight: 800, color: DARK }}>{v}</div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: "monospace", letterSpacing: "0.5px" }}>{l}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 2 — ANTES E DEPOIS ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <FadeUp className="text-center mb-10">
          <SLabel>TRANSFORMAÇÃO REAL</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: DARK }}>
            Antes e depois do PRAXIS
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              tema: "Conteúdo",
              antes: "3 horas criando um post no Canva",
              depois: "20 minutos gerando Reel + legenda + hashtags com IA",
              icon: "📱",
            },
            {
              tema: "Pacientes",
              antes: "Instagram parado, agenda com buracos toda semana",
              depois: "12 consultas particulares novas por mês",
              icon: "📅",
            },
            {
              tema: "Gestão",
              antes: "Leads esquecidos, sem follow-up, dependência de convênio",
              depois: "Nurturing automático via WhatsApp e CRM de leads",
              icon: "⚡",
            },
          ].map(({ tema, antes, depois, icon }, i) => (
            <FadeUp key={tema} delay={i * 80}>
              <div className="rounded-2xl overflow-hidden h-full" style={{ border: "1px solid rgba(13,27,42,0.10)" }}>
                <div className="p-5 flex flex-col gap-3 h-full" style={{ background: CARD }}>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", textTransform: "uppercase" }}>{tema}</span>
                  </div>
                  {/* Antes */}
                  <div className="rounded-xl p-4 flex-1" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                    <p style={{ fontSize: 10, fontFamily: "monospace", color: "#dc2626", letterSpacing: "2px", marginBottom: 6 }}>ANTES</p>
                    <p style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>"{antes}"</p>
                  </div>
                  {/* Seta */}
                  <div className="text-center text-[20px]">↓</div>
                  {/* Depois */}
                  <div className="rounded-xl p-4 flex-1" style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.20)" }}>
                    <p style={{ fontSize: 10, fontFamily: "monospace", color: "#16a34a", letterSpacing: "2px", marginBottom: 6 }}>DEPOIS</p>
                    <p style={{ fontSize: 13, color: "#14532d", lineHeight: 1.6 }}>"{depois}"</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 3 — SIMULADOR DE ROI ──────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <FadeUp className="text-center mb-8">
          <SLabel>SIMULADOR DE ROI</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: DARK }}>
            Quanto o PRAXIS vale para você?
          </h2>
          <p style={{ fontSize: 14, color: TEXT2, marginTop: 8 }}>Calcule em tempo real o retorno sobre o investimento</p>
        </FadeUp>
        <FadeUp>
          <SimuladorROI ctaHref={ctaHref} />
        </FadeUp>
      </section>

      {/* ── SEÇÃO 4 — 3 PILARES ─────────────────────────────────────────────── */}
      <section id="pilares" className="max-w-5xl mx-auto px-6 pb-20">
        <FadeUp className="text-center mb-12">
          <SLabel>COMO FUNCIONA</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: DARK, marginBottom: 10 }}>
            Três pilares para transformar sua clínica
          </h2>
          <p style={{ fontSize: 14, color: TEXT2 }}>Do Instagram à gestão clínica — tudo em um único sistema</p>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Megaphone, color: GOLD, label: "AQUISIÇÃO",
              titulo: "Atraia mais pacientes",
              items: [
                "Conteúdo estratégico com IA",
                "Calendário editorial 30 dias",
                "CRM e nurturing automático",
                "Landing page de captação",
              ],
            },
            {
              icon: Settings, color: "#3b7fff", label: "OPERAÇÃO",
              titulo: "Automatize sua clínica",
              items: [
                "Copiloto de consulta IA",
                "Agenda inteligente integrada",
                "Calculadoras e protocolos clínicos",
                "Prescrições e relatórios automatizados",
              ],
            },
            {
              icon: TrendingUp, color: "#16a34a", label: "CRESCIMENTO",
              titulo: "Escale seus resultados",
              items: [
                "Painel executivo completo",
                "Consultor estratégico IA",
                "Indicadores e metas da clínica",
                "Planejamento de expansão",
              ],
            },
          ].map(({ icon: Icon, color, label, titulo, items }, i) => (
            <FadeUp key={label} delay={i * 100}>
              <div className="rounded-2xl p-7 h-full" style={{ background: CARD, border: `1px solid ${color}20`, boxShadow: `0 0 40px ${color}08` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <p style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: DARK, marginBottom: 16, fontFamily: "var(--font-playfair), Georgia, serif" }}>{titulo}</h3>
                <ul className="space-y-3">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check style={{ width: 14, height: 14, color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: TEXT2 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 5 — COPILOTO DESTAQUE ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <FadeUp>
          <div className="rounded-2xl overflow-hidden" style={{ background: DARK, border: `1px solid ${GOLD}20` }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 md:p-14">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}30` }}>
                    <Bot style={{ width: 18, height: 18, color: GOLD }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", textTransform: "uppercase" }}>
                    O RECURSO MAIS PODEROSO
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 34px)", fontWeight: 700, color: "#F5F0E8", marginBottom: 16, lineHeight: 1.2 }}>
                  O recurso que nenhuma outra plataforma tem
                </h2>
                <p style={{ fontSize: 14, color: "rgba(245,240,232,0.75)", lineHeight: 1.8, marginBottom: 28 }}>
                  Em segundos, gere <strong style={{ color: "#F5F0E8" }}>resumo clínico</strong>, plano terapêutico,{" "}
                  <strong style={{ color: "#F5F0E8" }}>orientações ao paciente</strong>, mensagens de follow-up e{" "}
                  <strong style={{ color: "#F5F0E8" }}>sugestões de conteúdo</strong> — tudo de uma única consulta.
                </p>
                <Link href="/demo"
                  className="inline-flex items-center gap-2 rounded-xl font-bold text-[13px] transition-all hover:opacity-90"
                  style={{ padding: "12px 24px", background: GOLD, color: DARK }}>
                  Ver como funciona <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
              {/* Right side mockup */}
              <div className="relative hidden lg:flex items-center justify-center p-10" style={{ borderLeft: `1px solid ${GOLD}15` }}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle, ${GOLD}40 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
                <div className="relative w-full max-w-xs rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${GOLD}25` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}20` }}>
                      <Bot style={{ width: 12, height: 12, color: GOLD }} />
                    </div>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "1px" }}>COPILOTO DE CONSULTA</span>
                  </div>
                  {[
                    { label: "RESUMO CLÍNICO", value: "Paciente 52a, HAS controlada..." },
                    { label: "PLANO TERAPÊUTICO", value: "1. Ajustar Anti-hipertensivo..." },
                    { label: "ORIENTAÇÕES", value: "Paciente deve monitorar PA..." },
                    { label: "SUGESTÃO DE CONTEÚDO", value: "Reel: Hipertensão silenciosa" },
                  ].map(({ label, value }) => (
                    <div key={label} className="mb-3 pb-3" style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
                      <p style={{ fontSize: 8, fontFamily: "monospace", color: `${GOLD}99`, letterSpacing: "1.5px", marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 12, color: "rgba(245,240,232,0.80)", lineHeight: 1.4 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 6 — CENTRAL DE INTELIGÊNCIA ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <FadeUp className="text-center mb-10">
          <SLabel>INTELIGÊNCIA COMPETITIVA</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: DARK }}>
            Inteligência competitiva para médicos
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Users, color: "#8b5cf6",
              titulo: "Análise de Concorrentes",
              desc: "Veja o que funciona na sua especialidade e cidade. Identifique gaps e oportunidades antes de todo mundo.",
              href: "/concorrentes",
            },
            {
              icon: Zap, color: GOLD,
              titulo: "Radar de Tendências",
              desc: "Temas médicos em alta no Instagram, TikTok e Google — em tempo real, atualizado toda semana.",
              href: "/radar",
            },
            {
              icon: Brain, color: "#3b7fff",
              titulo: "IA de Crescimento",
              desc: "Análise do seu Instagram com pontuação, bio otimizada e 5 ações prioritárias para crescer em 90 dias.",
              href: "/concorrentes",
            },
          ].map(({ icon: Icon, color, titulo, desc, href }, i) => (
            <FadeUp key={titulo} delay={i * 80}>
              <Link href={href}>
                <div className="rounded-2xl p-6 h-full transition-all hover:scale-[1.02] cursor-pointer" style={{ background: CARD, border: `1px solid ${color}20` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                    <Icon style={{ width: 20, height: 20, color }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 8 }}>{titulo}</h3>
                  <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </Link>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 7 — DEPOIMENTOS ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <FadeUp className="text-center mb-10">
          <SLabel>RESULTADOS REAIS</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: DARK }}>
            Médicos que pensam grande
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DEPOIMENTOS.map((d, i) => (
            <FadeUp key={d.nome} delay={i * 80}>
              <div className="rounded-2xl p-6 h-full flex flex-col" style={{ background: CARD, border: `1px solid ${d.cor}25` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] flex-shrink-0"
                    style={{ background: `${d.cor}15`, color: d.cor, border: `1px solid ${d.cor}30` }}>
                    {d.iniciais}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{d.nome}</div>
                    <div style={{ fontSize: 10, color: MUTED }}>{d.especialidade} · {d.cidade}</div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} style={{ width: 12, height: 12, color: "#f59e0b", fill: "#f59e0b" }} />)}
                </div>
                <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7, flex: 1 }}>"{d.texto}"</p>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid rgba(13,27,42,0.07)` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.cor }}>{d.resultado}</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 8 — PLANOS ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <SLabel>PLANOS</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: DARK, marginBottom: 8 }}>
            Investimento que se paga sozinho
          </h2>
          <p style={{ fontSize: 14, color: TEXT2 }}>
            7 dias grátis em qualquer plano. Sem fidelidade. &nbsp;
            <Link href="/planos" style={{ color: GOLD }}>Ver comparativo completo →</Link>
          </p>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANOS.map((plan, i) => {
            const Icon        = plan.icon
            const isHighlight = plan.id === "elite"
            return (
              <FadeUp key={plan.id} delay={i * 80}>
                <div className="relative flex flex-col rounded-2xl h-full"
                  style={{ background: CARD, border: `1px solid ${plan.border}`, boxShadow: isHighlight ? `0 0 50px ${plan.color}18` : "none" }}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span style={{ display: "block", fontSize: 9, fontFamily: "monospace", fontWeight: 800, padding: "4px 14px", borderRadius: 999, letterSpacing: "2px", background: plan.color, color: DARK }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="p-7 flex flex-col flex-1 gap-5">
                    <div className="flex items-start gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${plan.color}18`, border: `1px solid ${plan.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: plan.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{plan.tagline}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: plan.color, lineHeight: 1.1 }}>
                          {plan.price}
                          <span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>/mês</span>
                        </div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: "monospace" }}>ou {plan.daily}/dia</div>
                      </div>
                    </div>
                    {plan.id === "elite" && (
                      <p style={{ fontSize: 11, color: plan.color, fontWeight: 600, textAlign: "center", padding: "6px 0", borderRadius: 8, background: `${plan.color}10`, border: `1px solid ${plan.color}25` }}>
                        Menos que 1 consulta particular por mês
                      </p>
                    )}
                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <Check style={{ width: 13, height: 13, color: plan.color, flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={ctaHref}
                      className="block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
                      style={{
                        background: isHighlight ? plan.color : `${plan.color}18`,
                        color:      isHighlight ? DARK      : plan.color,
                        border:     isHighlight ? "none"    : `1px solid ${plan.color}40`,
                      }}>
                      Começar 7 dias grátis
                    </Link>
                  </div>
                </div>
              </FadeUp>
            )
          })}
        </div>
      </section>

      {/* ── SEÇÃO 9 — GARANTIA ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-12" style={{ background: CARD, border: BORDER }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: `${GOLD}10`, border: `2px solid ${GOLD}25` }}>
              <Shield style={{ width: 28, height: 28, color: GOLD }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, color: DARK, marginBottom: 12 }}>
              Garantia de 7 dias sem risco
            </h2>
            <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.8, maxWidth: 480, margin: "0 auto" }}>
              Se em 7 dias você não ver valor, cancele com <strong>1 clique</strong>.
              Sem burocracia, sem perguntas, sem multa.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 10 — FAQ ──────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>DÚVIDAS FREQUENTES</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700, color: DARK }}>
            Perguntas frequentes
          </h2>
        </FadeUp>
        <div className="space-y-2">
          {FAQ_ITEMS.map((f, i) => (
            <FadeUp key={i} delay={i * 50}>
              <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: BORDER }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{f.q}</span>
                  {faqOpen === i
                    ? <ChevronUp style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                    : <ChevronDown style={{ width: 16, height: 16, color: MUTED, flexShrink: 0 }} />
                  }
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-[13px] leading-relaxed"
                    style={{ borderTop: `1px solid rgba(13,27,42,0.06)`, paddingTop: 12, color: TEXT2 }}>
                    {f.a}
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 11 — CTA FINAL ────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-16 md:px-16 md:py-20"
            style={{ background: `${GOLD}07`, border: `1px solid ${GOLD}20` }}>
            <h2 className="mb-4" style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(24px, 4vw, 44px)", fontWeight: 700, color: DARK, lineHeight: 1.15,
            }}>
              Pronto para mais pacientes<br /> particulares todo mês?
            </h2>
            <p className="mb-10" style={{ fontSize: 15, color: TEXT2, lineHeight: 1.7 }}>
              Junte-se a 127 médicos que já escolheram crescer<br className="hidden md:block" /> com inteligência e autoridade.
            </p>
            <Link href={ctaHref}
              className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98] mb-4"
              style={{ padding: "18px 44px", fontSize: 16, background: GOLD, color: DARK, boxShadow: `0 0 60px ${GOLD}28` }}>
              Começar agora — 7 dias grátis <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <p style={{ fontSize: 12, color: MUTED }}>
              Sem cartão de crédito &nbsp;•&nbsp; Cancele quando quiser
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── RODAPÉ ──────────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-8 pt-10" style={{ borderTop: `1px solid rgba(13,27,42,0.08)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <Logo size={24} />
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { label: "Como funciona", href: "#pilares", anchor: true  },
                { label: "Planos",         href: "/planos",      anchor: false },
                { label: "Privacidade",    href: "/privacidade", anchor: false },
                { label: "Termos",         href: "/termos",      anchor: false },
                { label: "Contato",        href: "/captacao",    anchor: false },
              ].map(item => (
                item.anchor
                  ? <a key={item.label} href={item.href} style={{ fontSize: 12, color: MUTED }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>{item.label}</a>
                  : <Link key={item.label} href={item.href} style={{ fontSize: 12, color: MUTED }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(13,27,42,0.06)", marginBottom: 20 }} />
          <p className="text-center" style={{ fontSize: 11, fontFamily: "monospace", color: MUTED, letterSpacing: "0.5px" }}>
            © 2026 PRAXIS. Desenvolvido para médicos que pensam grande.
          </p>
        </div>
      </footer>

    </div>
  )
}
