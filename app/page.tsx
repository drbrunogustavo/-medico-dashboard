"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Shield,
  Zap, Star, Crown, Megaphone, Stethoscope, BarChart3,
  Sparkles, GraduationCap, Users,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"

// ─── Intersection animation ───────────────────────────────────────────────────

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
    cor: "bg-blue-50 border-blue-200",
  },
  {
    iniciais: "AF", nome: "Dra. Ana Figueiredo", crm: "CRM-RJ 12.987", cidade: "Rio de Janeiro, RJ",
    especialidade: "Endocrinologista",
    texto: "Saí de 800 para 4.200 seguidores em 60 dias. Meu Instagram virou canal de captação real de pacientes.",
    resultado: "Agenda cheia em 60 dias",
    cor: "bg-green-50 border-green-200",
  },
  {
    iniciais: "PR", nome: "Dr. Pedro Rocha", crm: "CRM-MG 45.671", cidade: "Belo Horizonte, MG",
    especialidade: "Dermatologista",
    texto: "Eu gastava R$3.000/mês com agência e não via resultado. O PRAXIS custou R$397 e entregou 10x mais.",
    resultado: "3.000 seguidores em 30 dias",
    cor: "bg-amber-50 border-amber-200",
  },
]

const ATIVIDADES = [
  "🟢 Dr. Carlos (SP) acabou de assinar o Elite",
  "🟢 Dra. Ana (RJ) gerou 30 dias de conteúdo",
  "🟢 Dr. Pedro (MG) configurou o CRM de leads",
  "🟢 Dra. Juliana (RS) agendou 12 consultas hoje",
  "🟢 Dr. Thiago (BA) publicou o primeiro Reel com IA",
]

const DORES = [
  "Posto conteúdo sem ver resultado real",
  "Minha agenda tem buracos toda semana",
  "Dependo de convênio para pagar as contas",
  "Não sei quantos leads perco por mês",
  "Gasto com agência e não vejo retorno",
  "Trabalho 12h/dia mas não consigo escalar",
]

const FERRAMENTAS = [
  { nome: "Consultor estratégico (2h/mês)", mercado: "R$1.000" },
  { nome: "Gestor de conteúdo",             mercado: "R$2.500/mês" },
  { nome: "CRM profissional",               mercado: "R$500/mês" },
  { nome: "Calendário editorial",           mercado: "R$300/mês" },
  { nome: "Análise de métricas",            mercado: "R$400/mês" },
]

const PASSOS = [
  { n: "01", t: "Crie sua conta em 2 minutos",     d: "Sem burocracia. Apenas e-mail e senha." },
  { n: "02", t: "Configure seu perfil e especialidade", d: "IA aprende sobre você e seus pacientes." },
  { n: "03", t: "Comece a usar",                   d: "Resultados visíveis nos primeiros 7 dias." },
]

const ALA_TABS = [
  {
    id: "social",
    name: "PRAXIS Social",
    emoji: "📱",
    icon: Megaphone,
    color: "#b8976a",
    desc: "Crie conteúdo estratégico que atrai pacientes qualificados e consolida sua autoridade médica no Instagram, TikTok e YouTube.",
    features: [
      "Gerador de Roteiros para Reels",
      "Calendário editorial 30 dias",
      "Copiloto de Conteúdo com IA",
      "Análise de Concorrentes",
      "Banco de Pautas clínicas",
      "Radar de Tendências médicas",
    ],
    resultado: "Médicos que usam crescem em média 3.200 seguidores nos primeiros 90 dias",
  },
  {
    id: "consultorio",
    name: "PRAXIS Consultório",
    emoji: "🩺",
    icon: Stethoscope,
    color: "#3b82f6",
    desc: "Converta seguidores em pacientes fiéis com CRM inteligente, nurturing automático e ferramentas clínicas de ponta.",
    features: [
      "CRM de Leads com funil visual",
      "Nurturing automático via WhatsApp",
      "Copiloto de Consulta com IA",
      "Calculadoras Clínicas avançadas",
      "Protocolos por especialidade",
      "Prescrição Assistida por IA",
    ],
    resultado: "Converta até 40% mais leads em pacientes com nurturing automático",
  },
  {
    id: "executivo",
    name: "PRAXIS Executivo",
    emoji: "📊",
    icon: BarChart3,
    color: "#7c5cbf",
    desc: "Gerencie sua clínica como uma empresa de alta performance com dados, metas e inteligência estratégica em tempo real.",
    features: [
      "Painel Executivo com indicadores",
      "Consultor Estratégico IA",
      "Diagnóstico 360° da clínica",
      "Precificação inteligente",
      "Metas e planejamento anual",
      "Análise de rentabilidade",
    ],
    resultado: "Médicos aumentam faturamento em média R$8.000/mês em 6 meses",
  },
  {
    id: "ia",
    name: "PRAXIS IA",
    emoji: "✨",
    icon: Sparkles,
    color: "#c8931a",
    desc: "Inteligência artificial especializada em medicina trabalhando por você 24h/dia — pesquisa, análise e estratégia sem limites.",
    features: [
      "Posicionamento Médico personalizado",
      "Banco de Estudos Científicos",
      "Inteligência de Mercado em tempo real",
      "Interpretação de Exames laboratoriais",
      "Gerador de Relatórios para Paciente",
      "Agente Executivo autônomo",
    ],
    resultado: "IA trabalhando por você 24h/dia — pesquisa, estratégia e conteúdo",
  },
  {
    id: "academy",
    name: "PRAXIS Academy",
    emoji: "🎓",
    icon: GraduationCap,
    color: "#c0507a",
    desc: "38 aulas em 4 trilhas práticas ensinando o que a faculdade de medicina não ensinou: negócios, marketing e gestão de clínica.",
    features: [
      "38 aulas em 4 trilhas completas",
      "Marketing Médico do zero ao avançado",
      "Gestão e escalabilidade de clínica",
      "Comercial e conversão de pacientes",
      "Produção de conteúdo médico",
      "Certificado de conclusão PRAXIS",
    ],
    resultado: "Aprenda o que não ensinaram na faculdade de medicina",
  },
]

const PILARES = [
  { icon: Megaphone,    name: "PRAXIS Social",      desc: "Conteúdo que atrai pacientes",         color: "#b8976a", bg: "rgba(184,151,106,0.06)", border: "rgba(184,151,106,0.20)" },
  { icon: Stethoscope, name: "PRAXIS Consultório",  desc: "Leads que viram consultas",            color: "#3b82f6", bg: "rgba(59,130,246,0.05)",   border: "rgba(59,130,246,0.18)"  },
  { icon: BarChart3,   name: "PRAXIS Executivo",    desc: "Clínica que funciona como empresa",    color: "#7c5cbf", bg: "rgba(124,92,191,0.05)",   border: "rgba(124,92,191,0.18)"  },
  { icon: Sparkles,    name: "PRAXIS IA",           desc: "Inteligência que acelera resultados",  color: "#c8931a", bg: "rgba(200,147,26,0.05)",   border: "rgba(200,147,26,0.18)"  },
  { icon: GraduationCap, name: "PRAXIS Academy",   desc: "Conhecimento que transforma",          color: "#c0507a", bg: "rgba(192,80,122,0.05)",   border: "rgba(192,80,122,0.18)"  },
]

const PLANOS = [
  {
    id: "starter", icon: Zap, name: "Starter", price: "R$97", daily: "R$3,20",
    color: "#8a7a6a", border: "rgba(13,27,42,0.12)", badge: null as string | null,
    features: ["30 gerações/mês", "Roteiros e Legendas", "Banco de Pautas"],
  },
  {
    id: "pro", icon: Star, name: "Pro", price: "R$197", daily: "R$6,50",
    color: "#b8976a", border: "rgba(184,151,106,0.35)", badge: "MAIS ESCOLHIDO",
    features: ["200 gerações/mês", "Todos os módulos de conteúdo", "Radar de Tendências"],
  },
  {
    id: "elite", icon: Crown, name: "Elite", price: "R$397", daily: "R$13,20",
    color: "#c8a355", border: "rgba(200,163,85,0.30)", badge: "COMPLETO",
    features: ["Gerações ilimitadas", "Agente Executivo + IA", "Onboarding 1:1"],
  },
]

const FAQ_ITEMS = [
  { q: "Preciso saber sobre tecnologia?", a: "Não. O PRAXIS foi criado para médicos, não para técnicos. A interface é intuitiva e você recebe conteúdo pronto em minutos." },
  { q: "Funciona para qualquer especialidade?", a: "Sim. Temos médicos de mais de 25 especialidades usando o PRAXIS. A IA se adapta ao seu nicho, linguagem e público." },
  { q: "Como funciona o trial gratuito?", a: "Você tem 7 dias para explorar todos os módulos sem restrições. Sem cartão de crédito necessário." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, com 1 clique nas configurações. Sem perguntas, sem burocracia, sem multa." },
  { q: "O conteúdo gerado é personalizado para mim?", a: "Completamente. A IA usa seu perfil, especialidade, localização e público-alvo para gerar conteúdo que parece ter sido escrito por você." },
]

// ─── Inline logo ──────────────────────────────────────────────────────────────

function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#b8976a" strokeWidth="1.5"
          strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
        <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#0D1B2A"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="14" x2="23" y2="22" stroke="#b8976a"
          strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: size < 26 ? 13 : 15, fontWeight: 600, letterSpacing: "4px", color: "#0D1B2A" }}>
        PRAXIS
      </span>
    </div>
  )
}

// ─── Ala Tab Section ──────────────────────────────────────────────────────────

function AlaTabSection() {
  const [active, setActive] = useState(0)
  const ala = ALA_TABS[active]

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {ALA_TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActive(i)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background:   i === active ? t.color : "rgba(13,27,42,0.04)",
              color:        i === active ? "#FFFFFF" : "#6a5a4a",
              border:       i === active ? "none" : "1px solid rgba(13,27,42,0.10)",
              boxShadow:    i === active ? `0 4px 20px ${t.color}30` : "none",
            }}>
            <span>{t.emoji}</span>
            {t.name}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(13,27,42,0.10)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* Left: info */}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px]"
                style={{ background: `${ala.color}12`, border: `1px solid ${ala.color}25` }}>
                {ala.emoji}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0D1B2A", fontFamily: "var(--font-playfair), Georgia, serif" }}>
                  {ala.name}
                </h3>
                <p style={{ fontSize: 11, fontFamily: "monospace", color: ala.color, letterSpacing: "2px", textTransform: "uppercase" }}>
                  MÓDULO COMPLETO
                </p>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "#6a5a4a", lineHeight: 1.7, marginBottom: 28 }}>
              {ala.desc}
            </p>

            <div className="space-y-2.5 mb-8">
              {ala.features.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ala.color}12`, border: `1px solid ${ala.color}25` }}>
                    <span style={{ fontSize: 10, color: ala.color, fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: "#3a2a1a" }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Resultado */}
            <div className="rounded-xl p-4" style={{ background: `${ala.color}08`, border: `1px solid ${ala.color}20` }}>
              <p style={{ fontSize: 11, fontFamily: "monospace", color: ala.color, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
                RESULTADO
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", lineHeight: 1.4 }}>
                {ala.resultado}
              </p>
            </div>
          </div>

          {/* Right: mockup placeholder */}
          <div className="relative flex items-center justify-center p-8 min-h-[320px]"
            style={{ background: `${ala.color}05`, borderLeft: "1px solid rgba(13,27,42,0.07)" }}>

            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: `radial-gradient(circle, ${ala.color}20 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

            <div className="relative w-full max-w-sm">
              {/* Fake dashboard card */}
              <div className="rounded-2xl p-6 shadow-xl" style={{ background: "#FFFFFF", border: "1px solid rgba(13,27,42,0.10)" }}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px]"
                    style={{ background: `${ala.color}12` }}>
                    {ala.emoji}
                  </div>
                  <div>
                    <div className="h-2.5 w-24 rounded-full" style={{ background: `${ala.color}20` }} />
                    <div className="h-2 w-16 rounded-full mt-1.5" style={{ background: "rgba(13,27,42,0.06)" }} />
                  </div>
                </div>
                {[80, 60, 90, 45, 70].map((w, i) => (
                  <div key={i} className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-5 rounded-lg flex-shrink-0"
                      style={{ background: i % 2 === 0 ? `${ala.color}15` : "rgba(13,27,42,0.06)" }} />
                    <div className="flex-1 h-2.5 rounded-full" style={{ background: "rgba(13,27,42,0.07)", width: `${w}%` }}>
                      <div className="h-full rounded-full" style={{ background: `${ala.color}40`, width: "60%" }} />
                    </div>
                  </div>
                ))}
                <div className="mt-5 h-8 rounded-xl" style={{ background: `${ala.color}15`, border: `1px solid ${ala.color}25` }} />
              </div>

              {/* Floating stat */}
              <div className="absolute -top-4 -right-4 rounded-xl px-3 py-2 shadow-lg"
                style={{ background: "#0D1B2A", border: `1px solid ${ala.color}30` }}>
                <p style={{ fontSize: 11, fontFamily: "monospace", color: ala.color, fontWeight: 700 }}>
                  {["↑ 3.2K seguidores", "↑ 40% conversão", "↑ R$8K/mês", "24h disponível", "38 aulas"][active]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {ALA_TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActive(i)}
            className="rounded-full transition-all"
            style={{
              width:  i === active ? 24 : 8,
              height: 8,
              background: i === active ? ala.color : "rgba(13,27,42,0.15)",
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const ctaHref  = "/planos"
  const appHref  = !authLoading && user ? "/dashboard" : "/login"

  const [atividadeIdx, setAtividadeIdx] = useState(0)
  const [faqOpen,      setFaqOpen]      = useState<number | null>(null)
  const [vagasLeft]    = useState(17)

  useEffect(() => {
    const t = setInterval(() => setAtividadeIdx(i => (i + 1) % ATIVIDADES.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: "#F5F0E8", fontFamily: "Inter, sans-serif" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(245,240,232,0.92)", borderBottom: "1px solid rgba(13,27,42,0.08)", backdropFilter: "blur(16px)" }}>
        <Logo />
        <div className="flex items-center gap-4 md:gap-6">
          <a href="#como-funciona" className="hidden md:block text-[12px] transition-colors" style={{ color: "#6a5a4a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0D1B2A")} onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}>
            Como funciona
          </a>
          <Link href="/planos" className="hidden md:block text-[12px] transition-colors" style={{ color: "#6a5a4a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0D1B2A")} onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}>
            Planos
          </Link>
          <Link href={appHref} className="text-[12px] transition-colors" style={{ color: "#6a5a4a" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0D1B2A")} onMouseLeave={e => (e.currentTarget.style.color = "#6a5a4a")}>
            {!authLoading && user ? "Acessar plataforma" : "Entrar"}
          </Link>
          <Link href="/planos"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all hover:opacity-90"
            style={{ background: "#b8976a", color: "#0D1B2A" }}>
            Começar grátis <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── SEÇÃO 1 — HERO ──────────────────────────────────────────────── */}
      <section className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center">

        {/* Badge prova social */}
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
          style={{ background: "rgba(184,151,106,0.10)", border: "1px solid rgba(184,151,106,0.25)" }}>
          <span style={{ fontSize: 11, color: "#b8976a" }}>⭐</span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#b8976a", letterSpacing: "1.5px" }}>
            127 médicos já usam o PRAXIS
          </span>
        </div>

        {/* H1 */}
        <h1 className="mb-6" style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          fontSize: "clamp(32px, 6vw, 72px)", fontWeight: 700,
          lineHeight: 1.08, color: "#0D1B2A", letterSpacing: "-1px",
        }}>
          Sua clínica no<br />
          <span style={{ color: "#b8976a" }}>piloto automático.</span>
        </h1>

        <p className="mx-auto mb-10" style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "#5a4a3a", lineHeight: 1.7, maxWidth: 600 }}>
          A plataforma que médicos usam para <strong>lotar agenda</strong>, aumentar ticket
          e crescer no Instagram — sem depender de agências ou consultores.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href={ctaHref}
            className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98]"
            style={{ padding: "17px 40px", fontSize: 16, background: "#b8976a", color: "#0D1B2A", boxShadow: "0 0 60px rgba(184,151,106,0.28)", minWidth: 220, justifyContent: "center" }}>
            Começar 7 dias grátis <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#como-funciona"
            className="inline-flex items-center gap-2 rounded-xl font-semibold transition-all"
            style={{ padding: "17px 36px", fontSize: 15, border: "1px solid rgba(13,27,42,0.15)", color: "#6a5a4a", minWidth: 220, justifyContent: "center" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(13,27,42,0.30)"; e.currentTarget.style.color = "#0D1B2A" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(13,27,42,0.15)"; e.currentTarget.style.color = "#6a5a4a" }}>
            Ver como funciona <ChevronDown className="w-4 h-4" />
          </a>
        </div>

        {/* Sem riscos */}
        <p style={{ fontSize: 12, color: "#8a7a6a", letterSpacing: "0.5px" }}>
          Sem cartão de crédito &nbsp;•&nbsp; Cancele quando quiser &nbsp;•&nbsp; Resultados em 7 dias
          &nbsp;•&nbsp;{" "}
          <Link href="/demo" style={{ color: "#b8976a", textDecoration: "none", fontWeight: 600 }}>
            Ver demonstração →
          </Link>
        </p>

        {/* Dashboard mockup */}
        <FadeUp delay={200} className="mt-16">
          <div className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl"
            style={{ maxWidth: 780, border: "1px solid rgba(13,27,42,0.12)", background: "#0f0f0f" }}>
            <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#ff5f57","#ffbd2e","#28c840"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
              <div className="flex-1 mx-3 h-5 rounded-md" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {["Seguidores", "Leads/mês", "Consultas", "Receita"].map((l, i) => (
                  <div key={l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{l}</div>
                    <div className="text-[18px] font-bold" style={{ color: i === 0 ? "#b8976a" : i === 3 ? "#00c07f" : "#f5f5f7" }}>
                      {["4.2k","38","124","R$31k"][i]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Roteiro de Reel","Legenda IA","Calendário"].map(l => (
                  <div key={l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="h-2 rounded mb-2" style={{ background: "rgba(184,151,106,0.5)", width: "60%" }} />
                    <div className="h-2 rounded mb-1.5" style={{ background: "rgba(255,255,255,0.1)", width: "90%" }} />
                    <div className="h-2 rounded" style={{ background: "rgba(255,255,255,0.07)", width: "75%" }} />
                    <div className="text-[10px] mt-2" style={{ color: "#b8976a", fontFamily: "monospace" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 2 — PROVA SOCIAL ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">

        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            RESULTADOS REAIS
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: "#0D1B2A" }}>
            Médicos que já transformaram suas clínicas
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {DEPOIMENTOS.map((d, i) => (
            <FadeUp key={i} delay={i * 80}>
              <div className={cn("rounded-2xl border p-6 space-y-4 h-full", d.cor)}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[13px]"
                    style={{ background: "#b8976a20", border: "1px solid #b8976a30", color: "#b8976a" }}>
                    {d.iniciais}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0D1B2A" }}>{d.nome}</div>
                    <div style={{ fontSize: 10, color: "#6a5a4a", fontFamily: "monospace" }}>{d.crm} · {d.cidade}</div>
                  </div>
                </div>
                <span style={{ display: "inline-block", fontSize: 9, fontFamily: "monospace", fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(184,151,106,0.12)", color: "#b8976a", border: "1px solid rgba(184,151,106,0.25)", letterSpacing: "1px" }}>
                  {d.especialidade.toUpperCase()}
                </span>
                <p style={{ fontSize: 13, color: "#3a2a1a", lineHeight: 1.7 }}>&ldquo;{d.texto}&rdquo;</p>
                <div className="rounded-lg px-3 py-2" style={{ background: "rgba(184,151,106,0.10)", border: "1px solid rgba(184,151,106,0.20)" }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#b8976a" }}>{d.resultado}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Feed de atividade ao vivo */}
        <FadeUp>
          <div className="rounded-xl px-5 py-3 flex items-center gap-3"
            style={{ background: "rgba(0,192,127,0.06)", border: "1px solid rgba(0,192,127,0.20)" }}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p style={{ fontSize: 13, color: "#1a3a2a", transition: "opacity 0.3s" }}>
              {ATIVIDADES[atividadeIdx]}
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 3 — DOR E IDENTIFICAÇÃO ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            VOCÊ SE IDENTIFICA COM ISSO?
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: "#0D1B2A" }}>
            Problemas que todo médico enfrenta
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {DORES.map((d, i) => (
            <FadeUp key={i} delay={i * 60}>
              <div className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "#FFFFFF", border: "1px solid rgba(13,27,42,0.10)" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>❌</span>
                <p style={{ fontSize: 13, color: "#4a3a2a", lineHeight: 1.6 }}>{d}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-8"
            style={{ background: "rgba(184,151,106,0.06)", border: "1px solid rgba(184,151,106,0.20)" }}>
            <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(17px, 2.5vw, 22px)", fontWeight: 600, color: "#0D1B2A" }}>
              O PRAXIS foi criado para resolver <span style={{ color: "#b8976a" }}>exatamente isso.</span>
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 4 — ANCORAGEM DE VALOR ────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            QUANTO VOCÊ PAGARIA POR CADA UM SEPARADO?
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: "#0D1B2A" }}>
            Tabela de valor real
          </h2>
        </FadeUp>

        <FadeUp>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(13,27,42,0.12)" }}>
            <div className="grid grid-cols-3 px-5 py-3"
              style={{ background: "#0D1B2A", fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", letterSpacing: "2px", textTransform: "uppercase" }}>
              <span>Ferramenta</span>
              <span className="text-center">Mercado</span>
              <span className="text-center">PRAXIS</span>
            </div>
            {FERRAMENTAS.map((f, i) => (
              <div key={i} className="grid grid-cols-3 items-center px-5 py-4"
                style={{ background: i % 2 === 0 ? "#FFFFFF" : "rgba(13,27,42,0.02)", borderTop: "1px solid rgba(13,27,42,0.06)" }}>
                <span style={{ fontSize: 13, color: "#3a2a1a" }}>{f.nome}</span>
                <span className="text-center" style={{ fontSize: 13, color: "#6a5a4a", textDecoration: "line-through" }}>{f.mercado}</span>
                <span className="text-center">
                  <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "rgba(0,192,127,0.08)", color: "#00a86b", border: "1px solid rgba(0,192,127,0.25)" }}>
                    ✅ Incluso
                  </span>
                </span>
              </div>
            ))}
            <div className="grid grid-cols-3 items-center px-5 py-4"
              style={{ background: "rgba(184,151,106,0.06)", borderTop: "2px solid rgba(184,151,106,0.25)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A" }}>Total</span>
              <span className="text-center" style={{ fontSize: 14, fontWeight: 700, color: "#6a5a4a", textDecoration: "line-through" }}>R$4.700/mês</span>
              <span className="text-center" style={{ fontSize: 16, fontWeight: 800, color: "#b8976a" }}>R$397/mês</span>
            </div>
          </div>

          <p className="text-center mt-5" style={{ fontSize: 14, color: "#5a4a3a", fontStyle: "italic" }}>
            Tudo isso por R$397/mês. Menos que <strong>1 consulta particular.</strong>
          </p>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 5 — COMO FUNCIONA ─────────────────────────────────────── */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            TUDO QUE VOCÊ PRECISA
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: "#0D1B2A" }}>
            Tudo que você precisa para crescer
          </h2>
          <p style={{ fontSize: 15, color: "#6a5a4a", marginTop: 12, maxWidth: 540, margin: "12px auto 0" }}>
            5 frentes integradas. Uma plataforma. Resultados reais desde a primeira semana.
          </p>
        </FadeUp>

        <AlaTabSection />
      </section>

      {/* ── SEÇÃO 6 — MÓDULOS ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-14">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            5 PILARES DE CRESCIMENTO
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: "#0D1B2A" }}>
            Uma plataforma. Cinco frentes.
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PILARES.map((m, i) => {
            const Icon = m.icon
            return (
              <FadeUp key={i} delay={i * 70}>
                <div className="rounded-2xl p-6 flex flex-col h-full" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${m.color}20`, border: `1px solid ${m.color}40` }}>
                    <Icon style={{ width: 18, height: 18, color: m.color }} />
                  </div>
                  <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 14, fontWeight: 700, color: "#0D1B2A", marginBottom: 6 }}>{m.name}</div>
                  <p style={{ fontSize: 12, color: m.color, lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              </FadeUp>
            )
          })}
        </div>
      </section>

      {/* ── SEÇÃO 7 — ESCASSEZ E URGÊNCIA ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="rounded-2xl text-center px-8 py-12 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #b8976a, #c8a355)", color: "#0D1B2A" }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)" }} />
            <div className="relative">
              <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, letterSpacing: "2px", marginBottom: 12, opacity: 0.7 }}>
                🔥 OFERTA DE LANÇAMENTO
              </p>
              <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 800, marginBottom: 8 }}>
                50% OFF no primeiro mês
              </h2>
              <p style={{ fontSize: 14, marginBottom: 20, opacity: 0.85 }}>Apenas para os próximos médicos</p>

              <div className="inline-flex items-center gap-3 mb-8 px-5 py-3 rounded-xl"
                style={{ background: "rgba(13,27,42,0.12)", border: "1px solid rgba(13,27,42,0.15)" }}>
                <Users style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 22, fontWeight: 800 }}>{vagasLeft}</span>
                <span style={{ fontSize: 13, opacity: 0.85 }}>vagas restantes</span>
              </div>

              <div>
                <Link href={ctaHref}
                  className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ padding: "16px 40px", fontSize: 16, background: "#0D1B2A", color: "#b8976a", boxShadow: "0 8px 40px rgba(13,27,42,0.25)" }}>
                  Garantir minha vaga <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 8 — PLANOS ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            PLANOS
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 40px)", fontWeight: 700, color: "#0D1B2A", marginBottom: 8 }}>
            Investimento que se paga sozinho
          </h2>
          <p style={{ fontSize: 14, color: "#6a5a4a" }}>
            Sem fidelidade. &nbsp;
            <Link href="/planos" style={{ color: "#b8976a" }}>Ver comparativo completo →</Link>
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANOS.map((plan, i) => {
            const Icon = plan.icon
            const isHighlight = plan.id === "elite"
            return (
              <FadeUp key={plan.id} delay={i * 80}>
                <div className="relative flex flex-col rounded-2xl h-full"
                  style={{ background: "#FFFFFF", border: `1px solid ${plan.border}`, boxShadow: isHighlight ? `0 0 50px ${plan.color}18` : "none" }}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span style={{ display: "block", fontSize: 9, fontFamily: "monospace", fontWeight: 800, padding: "4px 14px", borderRadius: 999, letterSpacing: "2px", background: plan.color, color: "#0D1B2A" }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="p-7 flex flex-col flex-1 gap-5">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${plan.color}18`, border: `1px solid ${plan.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: plan.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1B2A" }}>{plan.name}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: plan.color, lineHeight: 1.1 }}>
                          {plan.price}
                          <span style={{ fontSize: 11, fontWeight: 400, color: "#8a7a6a" }}>/mês</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#8a7a6a", fontFamily: "monospace" }}>ou {plan.daily}/dia — menos que um café</div>
                      </div>
                    </div>
                    <ul className="flex-1 space-y-2.5">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <Check style={{ width: 13, height: 13, color: plan.color, flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 12, color: "#5a4a3a", lineHeight: 1.5 }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={ctaHref}
                      className="block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
                      style={{
                        background: isHighlight ? plan.color : `${plan.color}18`,
                        color: isHighlight ? "#0D1B2A" : plan.color,
                        border: isHighlight ? "none" : `1px solid ${plan.color}40`,
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

      {/* ── SEÇÃO 9 — GARANTIA ──────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-12"
            style={{ background: "#FFFFFF", border: "1px solid rgba(13,27,42,0.10)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(184,151,106,0.10)", border: "2px solid rgba(184,151,106,0.25)" }}>
              <Shield style={{ width: 28, height: 28, color: "#b8976a" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, color: "#0D1B2A", marginBottom: 12 }}>
              Garantia de 7 dias sem risco
            </h2>
            <p style={{ fontSize: 15, color: "#5a4a3a", lineHeight: 1.8, maxWidth: 480, margin: "0 auto" }}>
              Se em 7 dias você não ver valor, cancele com <strong>1 clique</strong>.
              Sem burocracia, sem perguntas, sem multa.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 10 — FAQ ──────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: "#b8976a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            DÚVIDAS FREQUENTES
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700, color: "#0D1B2A" }}>
            Perguntas frequentes
          </h2>
        </FadeUp>

        <div className="space-y-2">
          {FAQ_ITEMS.map((f, i) => (
            <FadeUp key={i} delay={i * 50}>
              <div className="rounded-xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(13,27,42,0.10)" }}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0D1B2A" }}>{f.q}</span>
                  {faqOpen === i
                    ? <ChevronUp style={{ width: 16, height: 16, color: "#b8976a", flexShrink: 0 }} />
                    : <ChevronDown style={{ width: 16, height: 16, color: "#8a7a6a", flexShrink: 0 }} />
                  }
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-[13px] leading-relaxed"
                    style={{ borderTop: "1px solid rgba(13,27,42,0.06)", paddingTop: 12, color: "#5a4a3a" }}>
                    {f.a}
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 11 — CTA FINAL ────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-16 md:px-16 md:py-20"
            style={{ background: "rgba(184,151,106,0.07)", border: "1px solid rgba(184,151,106,0.20)" }}>
            <h2 className="mb-4" style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(24px, 4vw, 44px)", fontWeight: 700, color: "#0D1B2A", lineHeight: 1.15,
            }}>
              Pronto para transformar<br /> sua clínica?
            </h2>
            <p className="mb-10" style={{ fontSize: 15, color: "#6a5a4a", lineHeight: 1.7 }}>
              Junte-se a 127 médicos que já escolheram crescer<br className="hidden md:block" /> com inteligência e autoridade.
            </p>
            <Link href={ctaHref}
              className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98] mb-4"
              style={{ padding: "18px 44px", fontSize: 16, background: "#b8976a", color: "#0D1B2A", boxShadow: "0 0 60px rgba(184,151,106,0.28)" }}>
              Começar agora — 7 dias grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <p style={{ fontSize: 12, color: "#8a7a6a" }}>
              Sem cartão de crédito &nbsp;•&nbsp; Cancele quando quiser
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── RODAPÉ ──────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-8 pt-10" style={{ borderTop: "1px solid rgba(13,27,42,0.08)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <Logo size={24} />
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { label: "Sobre",       href: "#como-funciona", anchor: true  },
                { label: "Planos",      href: "/planos",         anchor: false },
                { label: "Privacidade", href: "/privacidade",    anchor: false },
                { label: "Termos",      href: "/termos",         anchor: false },
                { label: "Contato",     href: "/captacao",       anchor: false },
              ].map(item => (
                item.anchor
                  ? <a key={item.label} href={item.href} style={{ fontSize: 12, color: "#8a7a6a" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#8a7a6a")}>{item.label}</a>
                  : <Link key={item.label} href={item.href} style={{ fontSize: 12, color: "#8a7a6a" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#b8976a")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#8a7a6a")}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(13,27,42,0.06)", marginBottom: 20 }} />
          <p className="text-center" style={{ fontSize: 11, fontFamily: "monospace", color: "#8a7a6a", letterSpacing: "0.5px" }}>
            © 2026 PRAXIS. Desenvolvido para médicos que pensam grande.
          </p>
        </div>
      </footer>

    </div>
  )
}
