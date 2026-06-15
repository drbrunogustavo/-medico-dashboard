"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight, Check, ChevronDown, ChevronUp, Shield,
  Zap, Star, Crown, Megaphone, Stethoscope, TrendingUp,
  Bot, BarChart3, Users, Target, Settings, Lock,
  Database, CheckCircle2, X, Minus, ChevronRight,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { SimuladorROI } from "@/components/SimuladorROI"
import { ProductMockup } from "@/components/ProductMockup"

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG     = "#F5F0E8"
const GOLD   = "#b8976a"
const DARK   = "#0D1B2A"
const TEXT2  = "#6a5a4a"
const MUTED  = "#8a7a6a"
const CARD   = "#FFFFFF"
const BORDER = "rgba(13,27,42,0.10)"

// ─── InView ───────────────────────────────────────────────────────────────────

function useInView() {
  const ref       = useRef<HTMLDivElement>(null)
  const [ok, set] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); obs.disconnect() } }, { threshold: 0.08 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return { ref, ok }
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, ok } = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: ok ? 1 : 0,
      transform: ok ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>{children}</div>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke={GOLD} strokeWidth="1.5"
          strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
        <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="14" x2="23" y2="22" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: size < 26 ? 13 : 15, fontWeight: 600, letterSpacing: "4px", color: DARK }}>
        PRAXIS
      </span>
    </div>
  )
}

function SLabel({ children }: { children: string }) {
  return <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>{children}</p>
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRODUCT_TABS = [
  { id: 1 as const, label: "Dashboard",        caption: "Centro de comando da sua clínica — leads, consultas, NPS e faturamento em um único painel." },
  { id: 2 as const, label: "CRM Inteligente",  caption: "Funil completo do lead ao paciente fiel — com nurturing automático via WhatsApp." },
  { id: 3 as const, label: "IA Clínica",       caption: "Em segundos: resumo SOAP, plano terapêutico, orientações ao paciente e follow-up automático." },
  { id: 4 as const, label: "Conteúdo",         caption: "30 dias de conteúdo estratégico gerado em minutos — adaptado à sua especialidade." },
  { id: 5 as const, label: "Executivo",        caption: "Sua clínica como empresa: indicadores, funil de conversão e consultor IA disponível 24h." },
]

const PILARES = [
  {
    icon: Megaphone, color: GOLD, label: "AQUISIÇÃO",
    titulo: "Atrair e converter pacientes particulares",
    problema: "Como gerar demanda consistente sem depender de convênios ou indicações?",
    modulos: [
      { n: "Copiloto de Conteúdo",     d: "Roteiros, legendas e estratégia adaptados ao seu nicho" },
      { n: "CRM de Leads",             d: "Kanban visual com histórico de cada contato" },
      { n: "Nurturing WhatsApp",       d: "Sequências automáticas D+1, D+3, D+7, D+30" },
      { n: "Análise de Concorrentes",  d: "Inteligência competitiva da sua especialidade" },
      { n: "Radar de Tendências",      d: "Temas médicos em alta — atualizados em tempo real" },
    ],
  },
  {
    icon: Settings, color: "#3b7fff", label: "OPERAÇÃO",
    titulo: "Atender melhor gastando menos tempo",
    problema: "Como reduzir tempo administrativo sem comprometer a qualidade clínica?",
    modulos: [
      { n: "Copiloto de Consulta",    d: "Resumo SOAP, plano e follow-up gerados por IA" },
      { n: "Calculadoras Clínicas",   d: "IMC, HOMA-IR, ASCVD, risco cardiovascular" },
      { n: "Protocolos Clínicos",     d: "Biblioteca de protocolos adaptáveis" },
      { n: "Prescrição Assistida",    d: "Sugestões baseadas no quadro clínico" },
      { n: "Agenda Inteligente",      d: "Integração com MedX — disponibilidade em tempo real" },
    ],
  },
  {
    icon: TrendingUp, color: "#16a34a", label: "CRESCIMENTO",
    titulo: "Escalar com decisões baseadas em dados",
    problema: "Como tomar decisões estratégicas sobre a clínica com informações confiáveis?",
    modulos: [
      { n: "Painel Executivo",        d: "Faturamento, NPS e indicadores em tempo real" },
      { n: "Consultor Estratégico IA",d: "Análise da clínica com recomendações priorizadas" },
      { n: "Diagnóstico 360°",        d: "Avaliação completa de marketing, operação e finanças" },
      { n: "Metas e Planejamento",    d: "OKRs clínicos com acompanhamento mensal" },
      { n: "Relatório Mensal",        d: "Relatório executivo gerado automaticamente" },
    ],
  },
]

const COMP_FEATURES = [
  { label: "Feito para médicos",        agencia: false,   chatgpt: false,   crm: false,    praxis: true  },
  { label: "IA clínica integrada",      agencia: false,   chatgpt: "~",     crm: false,    praxis: true  },
  { label: "CRM de leads",              agencia: false,   chatgpt: false,   crm: true,     praxis: true  },
  { label: "Nurturing WhatsApp",        agencia: false,   chatgpt: false,   crm: false,    praxis: true  },
  { label: "Calendário editorial IA",   agencia: false,   chatgpt: false,   crm: false,    praxis: true  },
  { label: "Gestão executiva",          agencia: false,   chatgpt: false,   crm: false,    praxis: true  },
  { label: "Protocolos clínicos",       agencia: false,   chatgpt: false,   crm: false,    praxis: true  },
  { label: "Custo estimado",
    agencia: "R$ 3-8k/mês", chatgpt: "R$ 20/mês", crm: "R$ 200-500", praxis: "R$ 97-397/mês" },
]

const MODULES_ACCORDION = [
  {
    title: "Atrair Pacientes — Ala Social",
    items: [
      "Copiloto de Conteúdo — roteiros, legendas e estratégia em um clique",
      "Calendário Editorial — 30 dias planejados automaticamente",
      "Radar de Tendências — temas médicos em alta no Instagram e Google",
      "Gerador de Reels, Stories e Carrosséis — formatos prontos para publicar",
      "Análise de Concorrentes — inteligência do seu nicho",
      "Banco de Pautas — organize e priorize seus temas",
      "Biblioteca de Ganchos — aberturas virais para cada formato",
    ],
  },
  {
    title: "Gerenciar Leads — CRM",
    items: [
      "CRM de Leads — kanban visual com histórico completo",
      "Nutrição de Leads — sequências automáticas WhatsApp D+1 a D+30",
      "Régua de Relacionamento — jornada do lead ao paciente fiel",
      "Scripts de Atendimento — respostas padronizadas para WhatsApp",
      "Central de Objeções — como responder cada resistência",
      "Programa de Indicações — sistema de referral para sua clínica",
    ],
  },
  {
    title: "Atender Melhor — IA Clínica",
    items: [
      "Copiloto de Consulta — resumo SOAP, plano e follow-up por IA",
      "Calculadoras Clínicas — HOMA-IR, ASCVD, TMB, idade metabólica",
      "Protocolos Clínicos — biblioteca editável de condutas",
      "Prescrição Assistida — sugestões baseadas no quadro clínico",
      "Relatório para Paciente — documento humanizado em linguagem simples",
      "Interpretação de Exames — análise assistida por IA",
    ],
  },
  {
    title: "Gerenciar a Clínica — Operação",
    items: [
      "Agenda Inteligente — integração com MedX em tempo real",
      "Gestão de Pacientes — prontuários e histórico centralizado",
      "Financeiro por Unidade — lançamentos e relatórios por clínica",
      "SOPs da Clínica — procedimentos operacionais documentados",
      "Nutrição de Pacientes — trilhas pós-consulta automatizadas",
      "Pesquisa NPS — medir satisfação e identificar promotores",
    ],
  },
  {
    title: "Crescer com Dados — Executivo",
    items: [
      "Painel Executivo — indicadores de marketing, operação e finanças",
      "Consultor Estratégico IA — análise e recomendações mensais",
      "Diagnóstico 360° — auditoria completa da clínica",
      "Metas e Planejamento — OKRs com acompanhamento automatizado",
      "Relatório Mensal — gerado automaticamente todo mês",
      "Inteligência de Mercado — análise do cenário da sua especialidade",
    ],
  },
]

const DEPOIMENTOS = [
  {
    ini: "MC", nome: "Dr. Marcelo C.", esp: "Endocrinologia", cid: "São Paulo",
    desafio: "Dependia de convênios, agenda cheia de particular era exceção",
    usou: "CRM de Leads + Copiloto de Conteúdo + Nurturing WhatsApp",
    resultado: "Nos primeiros 60 dias de uso consistente, adicionei 8 consultas particulares por semana ao meu fluxo regular.",
    cor: "#3b7fff",
  },
  {
    ini: "AF", nome: "Dra. Ana F.", esp: "Nutrologia", cid: "Rio de Janeiro",
    desafio: "Gastava 3h/semana criando conteúdo e os resultados eram inconsistentes",
    usou: "Calendário Editorial + Copiloto de Conteúdo + Banco de Pautas",
    resultado: "Hoje dedico menos de 30 minutos por semana ao conteúdo. A qualidade melhorou e o engajamento cresceu de forma orgânica.",
    cor: "#16a34a",
  },
  {
    ini: "PR", nome: "Dr. Pedro R.", esp: "Ginecologia", cid: "Belo Horizonte",
    desafio: "Perdia leads por falta de follow-up sistemático — respondia quando lembrava",
    usou: "CRM + Nurturing WhatsApp automático + Scripts de Atendimento",
    resultado: "Com a nutrição automática, minha taxa de conversão de leads melhorou significativamente. Perco muito menos oportunidades.",
    cor: GOLD,
  },
]

const PLANOS = [
  {
    id: "social", icon: Megaphone, name: "PRAXIS Social", tagline: "Para começar a atrair pacientes",
    price: "R$97", daily: "R$3,20", color: "#3b7fff", border: "rgba(59,127,255,0.25)", badge: null,
    features: ["Gerador de Roteiros, Legendas e Reels", "Calendário editorial 30 dias", "Radar de Tendências médicas", "Banco de Pautas", "100 gerações/mês"],
  },
  {
    id: "growth", icon: Stethoscope, name: "PRAXIS Growth", tagline: "Para converter e fidelizar",
    price: "R$197", daily: "R$6,55", color: GOLD, border: "rgba(184,151,106,0.35)", badge: "MAIS ESCOLHIDO",
    features: ["Tudo do PRAXIS Social", "CRM de Leads + Nurturing automático", "Copiloto de Consulta IA", "Scripts, Objeções e SOPs", "200 gerações/mês"],
  },
  {
    id: "os", icon: Crown, name: "PRAXIS OS", tagline: "O sistema operacional completo",
    price: "R$397", daily: "R$13,20", color: "#c8a355", border: "rgba(200,163,85,0.30)", badge: "COMPLETO",
    features: ["Tudo do PRAXIS Growth", "Painel Executivo + Consultor IA", "Diagnóstico 360° da clínica", "Agenda + Gestão de Pacientes", "Gerações ilimitadas"],
  },
]

const FAQ_ITEMS = [
  { q: "Preciso saber sobre tecnologia?", a: "Não. A interface foi projetada para médicos, não para técnicos. Você gera conteúdo e análises com poucos cliques, sem conhecimento de marketing digital." },
  { q: "Funciona para qualquer especialidade?", a: "Sim. A plataforma é utilizada por médicos de mais de 25 especialidades. A IA se adapta ao seu nicho, linguagem clínica e público-alvo." },
  { q: "Como funciona o período de teste?", a: "7 dias para explorar todos os módulos do plano escolhido, sem restrições e sem necessidade de cartão de crédito." },
  { q: "Meus dados clínicos ficam seguros?", a: "Sim. A plataforma usa Supabase (PostgreSQL gerenciado) com Row Level Security — seus dados são isolados por usuário. Nenhum dado clínico é usado para treinar modelos de IA." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, com um clique nas configurações. Sem fidelidade, sem burocracia, sem multa. O acesso permanece ativo até o final do período pago." },
]

// ─── Cell helper ──────────────────────────────────────────────────────────────

function Cell({ v }: { v: boolean | string }) {
  if (v === true)  return <CheckCircle2 style={{ width: 16, height: 16, color: "#16a34a", margin: "0 auto" }} />
  if (v === false) return <X            style={{ width: 14, height: 14, color: "#dc2626", margin: "0 auto" }} />
  if (v === "~")   return <Minus        style={{ width: 14, height: 14, color: "#d97706", margin: "0 auto" }} />
  return <span style={{ fontSize: 11, color: TEXT2 }}>{v}</span>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const ctaHref = "/planos"
  const appHref = !authLoading && user ? "/dashboard" : "/login"

  const [activeTab,   setActiveTab]   = useState(0)
  const [faqOpen,     setFaqOpen]     = useState<number | null>(null)
  const [openModule,  setOpenModule]  = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: BG, fontFamily: "Inter, sans-serif" }}>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(245,240,232,0.93)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
        <Logo />
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/sobre" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Por que o PRAXIS?</Link>
          <Link href={ctaHref} className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Planos</Link>
          <Link href={appHref} className="text-[12px]" style={{ color: TEXT2 }}>
            {!authLoading && user ? "Acessar plataforma" : "Entrar"}
          </Link>
          <Link href={ctaHref}
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-[12px] transition-all hover:opacity-90"
            style={{ padding: "8px 18px", background: DARK, color: GOLD }}>
            Testar grátis <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </nav>

      {/* ── SEÇÃO 1 — HERO ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeUp>
          <span style={{ display: "inline-block", fontSize: 11, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", border: `1px solid ${GOLD}40`, padding: "4px 16px", borderRadius: 999, marginBottom: 28 }}>
            Usado por médicos em todo o Brasil
          </span>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(28px, 5vw, 58px)",
            fontWeight: 700, color: DARK, lineHeight: 1.15, marginBottom: 20,
          }}>
            A infraestrutura digital<br />
            <span style={{ color: GOLD }}>que sua clínica precisa.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: TEXT2, lineHeight: 1.75, maxWidth: 600, margin: "0 auto 36px" }}>
            CRM médico, IA clínica, marketing e gestão em uma plataforma integrada.<br className="hidden md:block" />
            Feita por médico, para médicos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={ctaHref}
              className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ padding: "16px 36px", fontSize: 15, background: GOLD, color: DARK, boxShadow: `0 8px 40px ${GOLD}30` }}>
              Explorar a plataforma <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/sobre"
              className="inline-flex items-center gap-2 rounded-xl font-semibold text-[14px] transition-all hover:opacity-80"
              style={{ padding: "16px 28px", background: "rgba(13,27,42,0.06)", color: DARK, border: `1px solid ${BORDER}` }}>
              Ver planos →
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 2 — O PROBLEMA ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <FadeUp className="text-center mb-10">
          <SLabel>O PROBLEMA</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            O médico moderno enfrenta 3 desafios simultâneos
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Users, color: GOLD, label: "AQUISIÇÃO",
              q: "Como atrair pacientes particulares de forma consistente sem depender de convênios ou indicações?",
            },
            {
              icon: Settings, color: "#3b7fff", label: "OPERAÇÃO",
              q: "Como gerenciar leads, consultas, pacientes e financeiro sem perder horas em tarefas administrativas?",
            },
            {
              icon: BarChart3, color: "#16a34a", label: "CRESCIMENTO",
              q: "Como tomar decisões estratégicas sobre a clínica com base em dados reais, não em intuição?",
            },
          ].map(({ icon: Icon, color, label, q }, i) => (
            <FadeUp key={label} delay={i * 80}>
              <div className="rounded-2xl p-7 h-full" style={{ background: CARD, border: `1px solid ${color}20` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <p style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
                <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7, fontStyle: "italic" }}>"{q}"</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 3 — PRODUTO EM AÇÃO ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>VEJA O PRAXIS FUNCIONANDO</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK, marginBottom: 8 }}>
            Uma plataforma completa — não uma coleção de ferramentas
          </h2>
          <p style={{ fontSize: 14, color: TEXT2 }}>Cada módulo foi construído para médicos, integrado aos demais</p>
        </FadeUp>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {PRODUCT_TABS.map(({ label }, i) => (
            <button key={i} type="button" onClick={() => setActiveTab(i)}
              className="text-[12px] font-semibold px-4 py-2 rounded-full border transition-all"
              style={{
                background: activeTab === i ? DARK : "transparent",
                color:      activeTab === i ? GOLD : MUTED,
                border:     `1px solid ${activeTab === i ? DARK : BORDER}`,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Mockup display */}
        <FadeUp>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0D1B2A", padding: 16, minHeight: 340 }}>
            <ProductMockup id={PRODUCT_TABS[activeTab].id} />
          </div>
          <p className="text-center mt-4" style={{ fontSize: 14, color: TEXT2 }}>
            {PRODUCT_TABS[activeTab].caption}
          </p>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 4 — 3 PILARES ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <SLabel>COMO FUNCIONA</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Três pilares para uma clínica sustentável
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILARES.map(({ icon: Icon, color, label, titulo, problema, modulos }, i) => (
            <FadeUp key={label} delay={i * 100}>
              <div className="rounded-2xl p-7 h-full flex flex-col" style={{ background: CARD, border: `1px solid ${color}20` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <p style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: DARK, marginBottom: 8, fontFamily: "var(--font-playfair), Georgia, serif", lineHeight: 1.3 }}>{titulo}</h3>
                <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, lineHeight: 1.6, fontStyle: "italic" }}>"{problema}"</p>
                <ul className="space-y-2.5 flex-1">
                  {modulos.map(({ n, d }) => (
                    <li key={n} className="flex items-start gap-2.5">
                      <Check style={{ width: 13, height: 13, color, flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{n}</span>
                        <span style={{ fontSize: 11, color: TEXT2 }}> — {d}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 5 — COPILOTO DESTAQUE ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="rounded-2xl overflow-hidden" style={{ background: DARK, border: `1px solid ${GOLD}20` }}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 md:p-14">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}30` }}>
                    <Bot style={{ width: 18, height: 18, color: GOLD }} />
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", textTransform: "uppercase" }}>
                    O módulo que nenhuma outra plataforma tem
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 700, color: "#F5F0E8", marginBottom: 12, lineHeight: 1.25 }}>
                  IA clínica — não apenas marketing
                </h2>
                <p style={{ fontSize: 14, color: "rgba(245,240,232,0.70)", marginBottom: 20, lineHeight: 1.7 }}>
                  Durante ou após a consulta, descreva o caso clínico. Em segundos, o PRAXIS gera:
                </p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Resumo clínico estruturado (SOAP)",
                    "Plano terapêutico com condutas",
                    "Orientações em linguagem acessível ao paciente",
                    "Mensagens de follow-up D+1, D+7 e D+30",
                    "Sugestão de conteúdo baseada no caso clínico",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check style={{ width: 14, height: 14, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: "rgba(245,240,232,0.80)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ fontSize: 11, color: "rgba(245,240,232,0.40)", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                  Tudo revisável e exportável para o prontuário.
                </p>
              </div>
              {/* Right: mockup */}
              <div className="hidden lg:flex items-center justify-center p-10" style={{ borderLeft: `1px solid ${GOLD}15` }}>
                <div style={{ width: "100%", maxWidth: 320, height: 340 }}>
                  <ProductMockup id={3} />
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 6 — TABELA COMPARATIVA ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>COMPARATIVO</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Por que o PRAXIS é diferente?
          </h2>
        </FadeUp>
        <FadeUp>
          <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: CARD }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontFamily: "monospace", color: MUTED, letterSpacing: "1px", fontWeight: 600 }}>RECURSO</th>
                  {["Agência", "ChatGPT", "CRM comum", "PRAXIS"].map((h, i) => (
                    <th key={h} style={{
                      padding: "14px 16px", textAlign: "center", fontSize: 12, fontWeight: 700,
                      color: i === 3 ? GOLD : TEXT2,
                      background: i === 3 ? `${GOLD}08` : "transparent",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMP_FEATURES.map(({ label, agencia, chatgpt, crm, praxis }, ri) => (
                  <tr key={label} style={{ borderBottom: ri < COMP_FEATURES.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: TEXT2, fontWeight: ri === COMP_FEATURES.length - 1 ? 600 : 400 }}>{label}</td>
                    {[agencia, chatgpt, crm, praxis].map((v, ci) => (
                      <td key={ci} style={{
                        padding: "12px 16px", textAlign: "center",
                        background: ci === 3 ? `${GOLD}06` : "transparent",
                        fontWeight: ci === 3 ? 600 : 400,
                        color: ci === 3 ? DARK : TEXT2,
                      }}>
                        <Cell v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 7 — SIMULADOR ROI ──────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-8">
          <SLabel>SIMULADOR</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Qual o impacto do PRAXIS na sua clínica?
          </h2>
          <p style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>Estimativa baseada em dados médios de usuários. Resultados variam conforme uso e dedicação.</p>
        </FadeUp>
        <FadeUp>
          <SimuladorROI ctaHref={ctaHref} />
        </FadeUp>
      </section>

      {/* ── SEÇÃO 8 — MÓDULOS ACCORDION ──────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>FUNCIONALIDADES</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Mais de 60 funcionalidades integradas
          </h2>
        </FadeUp>
        <div className="space-y-2">
          {MODULES_ACCORDION.map(({ title, items }, i) => (
            <FadeUp key={i} delay={i * 50}>
              <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <button type="button" onClick={() => setOpenModule(openModule === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{title}</span>
                  {openModule === i
                    ? <ChevronUp style={{ width: 16, height: 16, color: GOLD }} />
                    : <ChevronDown style={{ width: 16, height: 16, color: MUTED }} />
                  }
                </button>
                {openModule === i && (
                  <div className="px-5 pb-5" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
                    <ul className="space-y-2">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <ChevronRight style={{ width: 13, height: 13, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: TEXT2 }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 9 — DEPOIMENTOS ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>RESULTADOS DE USUÁRIOS</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Médicos que escolheram crescer com dados
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DEPOIMENTOS.map(({ ini, nome, esp, cid, desafio, usou, resultado, cor }, i) => (
            <FadeUp key={nome} delay={i * 80}>
              <div className="rounded-2xl p-6 h-full flex flex-col" style={{ background: CARD, border: `1px solid ${cor}25` }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0"
                    style={{ background: `${cor}15`, color: cor, border: `1px solid ${cor}30` }}>
                    {ini}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{nome}</div>
                    <div style={{ fontSize: 10, color: MUTED }}>{esp} · {cid}</div>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: MUTED, letterSpacing: "1.5px", marginBottom: 4 }}>DESAFIO</div>
                    <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>"{desafio}"</p>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: MUTED, letterSpacing: "1.5px", marginBottom: 4 }}>O QUE USOU</div>
                    <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{usou}</p>
                  </div>
                  <div className="pt-3 mt-auto" style={{ borderTop: `1px solid ${cor}20` }}>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: cor, letterSpacing: "1.5px", marginBottom: 4 }}>RESULTADO</div>
                    <p style={{ fontSize: 12, color: DARK, lineHeight: 1.6, fontWeight: 500 }}>"{resultado}"</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 10 — PLANOS ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-8">
          <SLabel>PLANOS</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK, marginBottom: 8 }}>
            Escolha o plano certo para sua clínica
          </h2>
          <p style={{ fontSize: 14, color: TEXT2 }}>
            7 dias grátis em qualquer plano. Sem compromisso. Cancele quando quiser. &nbsp;
            <Link href="/planos" style={{ color: GOLD }}>Ver comparativo completo →</Link>
          </p>
        </FadeUp>

        {/* Value anchor table */}
        <FadeUp>
          <div className="rounded-2xl overflow-hidden mb-8" style={{ border: `1px solid ${BORDER}` }}>
            <div style={{ background: CARD, padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 11, fontFamily: "monospace", color: MUTED, letterSpacing: "1.5px" }}>CUSTO SE CONTRATADO SEPARADO</p>
            </div>
            {[
              { r: "CRM médico",                 v: "R$ 500/mês"    },
              { r: "Gestão de conteúdo",          v: "R$ 2.500/mês"  },
              { r: "Consultoria estratégica",     v: "R$ 1.000/mês"  },
              { r: "Plataforma IA clínica",       v: "R$ 400/mês"    },
              { r: "Total estimado",              v: "R$ 4.400+/mês", bold: true },
              { r: "PRAXIS OS — tudo integrado",  v: "R$ 397/mês",    gold: true },
            ].map(({ r, v, bold, gold: g }) => (
              <div key={r} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 20px",
                background: g ? `${GOLD}08` : bold ? "rgba(13,27,42,0.03)" : CARD,
                borderBottom: `1px solid ${BORDER}`,
              }}>
                <span style={{ fontSize: 13, color: g ? DARK : TEXT2, fontWeight: bold || g ? 700 : 400 }}>{r}</span>
                <span style={{ fontSize: 13, fontFamily: "monospace", color: g ? GOLD : bold ? DARK : MUTED, fontWeight: bold || g ? 700 : 400 }}>{v}</span>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANOS.map(({ id, icon: Icon, name, tagline, price, daily, color, border, badge, features }, i) => (
            <FadeUp key={id} delay={i * 80}>
              <div className="relative flex flex-col rounded-2xl h-full" style={{ background: CARD, border: `1px solid ${border}`, boxShadow: id === "os" ? `0 0 50px ${color}15` : "none" }}>
                {badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span style={{ display: "block", fontSize: 9, fontFamily: "monospace", fontWeight: 800, padding: "4px 14px", borderRadius: 999, letterSpacing: "2px", background: color, color: DARK }}>
                      {badge}
                    </span>
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1 gap-5">
                  <div className="flex items-start gap-3">
                    <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 18, height: 18, color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>{name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{tagline}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1, marginTop: 2 }}>
                        {price}<span style={{ fontSize: 11, fontWeight: 400, color: MUTED }}>/mês</span>
                      </div>
                      <div style={{ fontSize: 10, color: MUTED, fontFamily: "monospace" }}>ou {daily}/dia</div>
                    </div>
                  </div>
                  <ul className="flex-1 space-y-2.5">
                    {features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <Check style={{ width: 13, height: 13, color, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: TEXT2 }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={ctaHref}
                    className="block text-center py-3.5 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
                    style={{
                      background: id === "os" ? color : `${color}18`,
                      color:      id === "os" ? DARK   : color,
                      border:     id === "os" ? "none" : `1px solid ${color}40`,
                    }}>
                    Começar 7 dias grátis
                  </Link>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 11 — GARANTIA E SEGURANÇA ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="rounded-2xl p-10 md:p-14" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <SLabel>GARANTIA E SEGURANÇA</SLabel>
                <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 700, color: DARK, marginBottom: 16 }}>
                  Infraestrutura segura.<br />Dados protegidos.
                </h2>
                <ul className="space-y-3">
                  {[
                    "Trial de 7 dias sem cartão de crédito",
                    "Cancele quando quiser — com 1 clique",
                    "Suporte por email em até 24h úteis",
                    "LGPD compliant",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 style={{ width: 15, height: 15, color: GOLD, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: TEXT2 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { Icon: Database, label: "Supabase",        desc: "PostgreSQL com RLS por usuário" },
                  { Icon: Zap,      label: "Vercel",          desc: "Deploy global com CI/CD" },
                  { Icon: Bot,      label: "Claude AI",       desc: "Anthropic — IA de última geração" },
                  { Icon: Lock,     label: "Stripe",          desc: "Pagamentos com certificação PCI" },
                ].map(({ Icon, label, desc }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: BG, border: `1px solid ${BORDER}` }}>
                    <Icon style={{ width: 18, height: 18, color: GOLD, marginBottom: 6 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>FAQ</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700, color: DARK }}>
            Perguntas frequentes
          </h2>
        </FadeUp>
        <div className="space-y-2">
          {FAQ_ITEMS.map((f, i) => (
            <FadeUp key={i} delay={i * 40}>
              <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <button onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{f.q}</span>
                  {faqOpen === i
                    ? <ChevronUp   style={{ width: 16, height: 16, color: GOLD, flexShrink: 0 }} />
                    : <ChevronDown style={{ width: 16, height: 16, color: MUTED, flexShrink: 0 }} />}
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-[13px] leading-relaxed" style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, color: TEXT2 }}>
                    {f.a}
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-16 md:py-20"
            style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 700, color: DARK, lineHeight: 1.2, marginBottom: 14 }}>
              Pronto para construir<br /> uma clínica sustentável?
            </h2>
            <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.7, marginBottom: 32 }}>
              Comece o período de teste gratuito. Nenhum cartão necessário.
            </p>
            <Link href={ctaHref}
              className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ padding: "18px 44px", fontSize: 16, background: GOLD, color: DARK, boxShadow: `0 0 60px ${GOLD}25` }}>
              Explorar a plataforma <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 16 }}>
              7 dias grátis &nbsp;•&nbsp; Sem cartão &nbsp;•&nbsp; Cancele quando quiser
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── RODAPÉ ───────────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-8 pt-10" style={{ borderTop: `1px solid rgba(13,27,42,0.08)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <Logo size={24} />
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { l: "Por que o PRAXIS?", h: "/sobre"       },
                { l: "Planos",            h: "/planos"      },
                { l: "Privacidade",       h: "/privacidade" },
                { l: "Termos",            h: "/termos"      },
                { l: "Contato",           h: "/captacao"    },
              ].map(({ l, h }) => (
                <Link key={l} href={h} style={{ fontSize: 12, color: MUTED }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(13,27,42,0.06)", marginBottom: 20 }} />
          <p className="text-center" style={{ fontSize: 11, fontFamily: "monospace", color: MUTED, letterSpacing: "0.5px" }}>
            © 2026 PRAXIS. Construído por médico, para médicos.
          </p>
        </div>
      </footer>

    </div>
  )
}
