"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Clock } from "lucide-react"
import { FluxoIntegrado } from "@/components/FluxoIntegrado"

const BG     = "#F5F0E8"
const GOLD   = "#b8976a"
const DARK   = "#0D1B2A"
const TEXT2  = "#6a5a4a"
const MUTED  = "#8a7a6a"
const CARD   = "#FFFFFF"
const BORDER = "rgba(13,27,42,0.10)"

function useInView() {
  const ref       = useRef<HTMLDivElement>(null)
  const [ok, set] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); obs.disconnect() } }, { threshold: 0.06 })
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

function Logo({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" stroke={GOLD} strokeWidth="1.5" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.7" />
        <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke={DARK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="14" x2="23" y2="22" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: size < 26 ? 13 : 15, fontWeight: 600, letterSpacing: "4px", color: DARK }}>
        PRAXIS
      </span>
    </div>
  )
}

// ─── Dados ────────────────────────────────────────────────────────────────────

const TABS = [
  {
    id: "copiloto",
    label: "Copiloto de Consulta",
    badge: "⭐ MAIS VALIOSO",
    badgeColor: GOLD,
    color: GOLD,
    href: "/praxis-consultorio",
    screenshot: "/screenshots/consultor.png",
    title: "O módulo mais valioso para sua prática clínica",
    tagline: "Descreva a consulta — a IA documenta tudo em segundos",
    description: "Narre o caso clínico em texto livre. Em segundos, o PRAXIS gera SOAP, plano terapêutico, exames, orientações ao paciente e mensagens de follow-up automáticas.",
    features: [
      "Resumo Clínico estruturado (SOAP)",
      "Plano terapêutico com condutas",
      "Orientações ao paciente em linguagem acessível",
      "Follow-up automático D+1, D+7 e D+30",
    ],
  },
  {
    id: "crm",
    label: "CRM de Leads",
    badge: null,
    badgeColor: "#3b7fff",
    color: "#3b7fff",
    href: "/praxis-consultorio",
    screenshot: "/screenshots/crm.png",
    title: "Funil visual do lead ao paciente fiel",
    tagline: "Nenhum lead esquecido — nurturing automático via WhatsApp",
    description: "Kanban visual com histórico completo de cada lead. Sequências automáticas de WhatsApp em D+1, D+3, D+7 e D+30 — você só entra em cena quando o lead está pronto.",
    features: [
      "Kanban visual com arraste de cards",
      "Histórico completo de interações",
      "WhatsApp automático por gatilho",
      "Relatório de conversão por origem",
    ],
  },
  {
    id: "executivo",
    label: "Painel Executivo",
    badge: null,
    badgeColor: "#16a34a",
    color: "#16a34a",
    href: "/praxis-executivo",
    screenshot: "/screenshots/executivo.png",
    title: "Sua clínica em números — em tempo real",
    tagline: "Faturamento, ocupação e NPS em um único painel",
    description: "Todos os indicadores da sua clínica em uma tela: receita, despesa, saldo, taxa de conversão, NPS e muito mais. Sem planilhas, sem esperas.",
    features: [
      "Faturamento mensal e projeção",
      "Taxa de conversão de leads",
      "Ocupação de agenda em tempo real",
      "Comparativos mensais automatizados",
    ],
  },
  {
    id: "nps",
    label: "NPS & Satisfação",
    badge: null,
    badgeColor: "#a78bfa",
    color: "#a78bfa",
    href: "/praxis-executivo",
    screenshot: "/screenshots/nps.png",
    title: "Satisfação dos pacientes medida automaticamente",
    tagline: "Pesquisa enviada após cada consulta — sem planilhas",
    description: "O PRAXIS envia automaticamente a pesquisa NPS após cada consulta. Acompanhe a satisfação em tempo real e identifique rapidamente o que precisa melhorar.",
    features: [
      "Disparo automático pós-consulta",
      "Score NPS em tempo real",
      "Comentários abertos dos pacientes",
      "Comparativo por período e especialidade",
    ],
  },
  {
    id: "indicadores",
    label: "Indicadores",
    badge: null,
    badgeColor: "#f59e0b",
    color: "#f59e0b",
    href: "/praxis-executivo",
    screenshot: "/screenshots/indicadores.png",
    title: "Decisões baseadas em dados reais da sua clínica",
    tagline: "Financeiro, marketing, comercial e clínico em um só lugar",
    description: "Dashboard completo com todos os KPIs que importam para uma clínica: receita, leads gerados, consultas realizadas, taxa de retenção e produtividade.",
    features: [
      "KPIs financeiros e comerciais",
      "Indicadores de marketing e conteúdo",
      "Métricas clínicas por especialidade",
      "Alertas automáticos de desvio",
    ],
  },
]

const TIMELINE = [
  { hora: "07h", icon: "📊", titulo: "Briefing do dia", desc: "Consultor IA analisa os indicadores da semana e sugere as prioridades do dia." },
  { hora: "08h", icon: "📅", titulo: "Agenda carregada", desc: "Agenda do dia sincronizada automaticamente — pacientes, horários e histórico em um clique." },
  { hora: "09h", icon: "🩺", titulo: "Consulta com Copiloto", desc: "Após a consulta, o prontuário estruturado (SOAP) é gerado em 30 segundos." },
  { hora: "12h", icon: "📱", titulo: "Nurturing automático", desc: "Mensagens de follow-up enviadas para 3 leads sem você precisar fazer nada." },
  { hora: "14h", icon: "⭐", titulo: "NPS respondido", desc: "Paciente de ontem avaliou a consulta com 9. Notificação automática no painel." },
  { hora: "16h", icon: "✍️", titulo: "Conteúdo do dia", desc: "O tema da consulta da manhã virou roteiro de Reel — gerado pela IA em 2 minutos." },
  { hora: "18h", icon: "📈", titulo: "Relatório do dia", desc: "Resumo automático: consultas, leads novos, NPS do dia e faturamento parcial." },
]

const COMPARACOES = [
  { antes: "3h criando conteúdo sem estratégia",    depois: "20 min com roteiro e legenda prontos",    cor: "#3b7fff" },
  { antes: "Leads esquecidos no WhatsApp pessoal",  depois: "Follow-up automático D+1 a D+30",         cor: "#16a34a" },
  { antes: "Sem ideia do faturamento real",          depois: "Dashboard atualizado em tempo real",       cor: GOLD      },
  { antes: "Prontuário manual após cada consulta",  depois: "SOAP gerado em 30 segundos pelo Copiloto", cor: "#a78bfa" },
  { antes: "NPS feito em planilha do Google",        depois: "Pesquisa automática pós-consulta",         cor: "#f59e0b" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TourPage() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div style={{ background: BG, fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(245,240,232,0.93)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>← Início</Link>
          <Link href="/planos" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Planos</Link>
          <Link href="/cadastro"
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-[12px] transition-all hover:opacity-90"
            style={{ padding: "8px 18px", background: DARK, color: GOLD }}>
            Começar grátis <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </nav>

      {/* ── SEÇÃO 1 — HERO ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeUp>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", border: `1px solid ${GOLD}40`, padding: "4px 16px", borderRadius: 999, marginBottom: 28 }}>
            ▶ TOUR DA PLATAFORMA
          </span>
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, color: DARK, lineHeight: 1.15, marginBottom: 20 }}>
            Veja o PRAXIS funcionando
          </h1>
          <p style={{ fontSize: "clamp(14px, 2vw, 18px)", color: TEXT2, lineHeight: 1.75, maxWidth: 560, margin: "0 auto 36px" }}>
            Um tour completo pela plataforma — sem criar conta.<br className="hidden md:block" />
            Explore cada módulo e veja como eles se integram.
          </p>
          <Link href="/cadastro"
            className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ padding: "16px 36px", fontSize: 15, background: GOLD, color: DARK, boxShadow: `0 8px 40px ${GOLD}30` }}>
            Criar minha conta grátis <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12 }}>7 dias grátis · Sem cartão de crédito</p>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 2 — MÓDULOS EM DESTAQUE ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>MÓDULOS EM DESTAQUE</p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Veja cada funcionalidade em ação
          </h2>
        </FadeUp>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${activeTab === i ? tab.color + "60" : BORDER}`,
                background: activeTab === i ? `${tab.color}12` : CARD,
                color: activeTab === i ? tab.color : MUTED,
                fontSize: 12,
                fontWeight: activeTab === i ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.badge && (
                <span style={{ fontSize: 9, fontFamily: "monospace", background: `${tab.badgeColor}18`, color: tab.badgeColor, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                  {tab.badge}
                </span>
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        {TABS.map((tab, i) => (
          <div key={tab.id} style={{ display: activeTab === i ? "block" : "none" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Screenshot */}
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `0 16px 60px rgba(13,27,42,0.12), 0 0 0 1px ${BORDER}` }}>
                <div style={{ background: "#1a1a1c", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#ff5f57","#febc2e","#28c840"].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 5, padding: "3px 10px", fontSize: 10, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
                    app.praxisplataforma.com.br
                  </div>
                </div>
                <Image src={tab.screenshot} alt={`${tab.label} — PRAXIS`} width={800} height={500} className="w-full h-auto block" unoptimized />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center">
                {tab.badge && (
                  <span style={{ display: "inline-flex", fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: tab.color, letterSpacing: "1.5px", background: `${tab.color}12`, border: `1px solid ${tab.color}30`, padding: "4px 12px", borderRadius: 999, marginBottom: 16, width: "fit-content" }}>
                    {tab.badge}
                  </span>
                )}
                <p style={{ fontSize: 10, fontFamily: "monospace", color: tab.color, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>{tab.label}</p>
                <h3 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 700, color: DARK, marginBottom: 8, lineHeight: 1.25 }}>
                  {tab.title}
                </h3>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 16, fontStyle: "italic" }}>{tab.tagline}</p>
                <p style={{ fontSize: 14, color: TEXT2, marginBottom: 24, lineHeight: 1.7 }}>{tab.description}</p>
                <div className="space-y-3 mb-8">
                  {tab.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check style={{ width: 15, height: 15, color: tab.color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: TEXT2, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href={tab.href}
                  className="inline-flex items-center gap-2 rounded-xl font-semibold text-[13px] transition-all hover:opacity-90 self-start"
                  style={{ padding: "12px 24px", background: `${tab.color}15`, color: tab.color, border: `1px solid ${tab.color}35` }}>
                  Explorar este módulo <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </div>

            {/* Dot nav */}
            <div className="flex justify-center gap-2 mt-8">
              {TABS.map((_, j) => (
                <button key={j} type="button" onClick={() => setActiveTab(j)} style={{ width: j === activeTab ? 24 : 8, height: 8, borderRadius: 4, background: j === activeTab ? tab.color : `${DARK}20`, border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── SEÇÃO 3 — UM DIA USANDO O PRAXIS ──────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>ROTINA REAL</p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Um dia usando o PRAXIS
          </h2>
          <p style={{ fontSize: 15, color: TEXT2, marginTop: 12, lineHeight: 1.7 }}>
            Como a plataforma se integra à sua rotina clínica do começo ao fim do dia.
          </p>
        </FadeUp>

        <div className="relative">
          {/* Vertical line */}
          <div style={{ position: "absolute", left: 27, top: 0, bottom: 0, width: 2, background: `${GOLD}20` }} />

          <div className="space-y-0">
            {TIMELINE.map((item, i) => (
              <FadeUp key={i} delay={i * 60}>
                <div className="flex gap-6 pb-8">
                  <div style={{ width: 56, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: CARD, border: `2px solid ${GOLD}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 0 4px ${BG}` }}>
                      {item.icon}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, fontWeight: 700, marginTop: 6 }}>{item.hora}</div>
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>{item.titulo}</div>
                      <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4 — QUANTO TEMPO VOCÊ ECONOMIZA ──────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>ANTES × DEPOIS</p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Quanto tempo você economiza
          </h2>
          <p style={{ fontSize: 15, color: TEXT2, marginTop: 12 }}>A diferença entre improvisar e ter um sistema.</p>
        </FadeUp>

        <div className="space-y-3">
          {COMPARACOES.map(({ antes, depois, cor }, i) => (
            <FadeUp key={i} delay={i * 60}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: CARD, border: `1px solid rgba(220,38,38,0.2)` }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>😣</span>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: "#dc2626", letterSpacing: "1px", marginBottom: 3, textTransform: "uppercase" }}>ANTES</div>
                    <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.4 }}>{antes}</div>
                  </div>
                </div>
                <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: `${cor}08`, border: `1px solid ${cor}30` }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: "monospace", color: cor, letterSpacing: "1px", marginBottom: 3, textTransform: "uppercase", fontWeight: 700 }}>DEPOIS</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DARK, lineHeight: 1.4 }}>{depois}</div>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 5 — FLUXO INTEGRADO ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>CICLO COMPLETO</p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Do lead ao conteúdo — em um só sistema
          </h2>
          <p style={{ fontSize: 15, color: TEXT2, marginTop: 12, lineHeight: 1.7 }}>
            O PRAXIS conecta cada etapa da sua clínica em um ciclo contínuo de crescimento.
          </p>
        </FadeUp>
        <FadeUp delay={200}>
          <FluxoIntegrado />
        </FadeUp>
      </section>

      {/* ── SEÇÃO 6 — CTA FINAL ────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-16 md:py-20" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 700, color: DARK, lineHeight: 1.2, marginBottom: 14 }}>
              Pronto para começar?
            </h2>
            <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.7, marginBottom: 32 }}>
              7 dias grátis — sem cartão de crédito.<br />Acesso completo a todos os módulos.
            </p>
            <Link href="/cadastro"
              className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98]"
              style={{ padding: "18px 44px", fontSize: 16, background: GOLD, color: DARK, boxShadow: `0 0 60px ${GOLD}25` }}>
              Criar minha conta <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <p style={{ fontSize: 12, color: MUTED, marginTop: 16 }}>
              7 dias grátis &nbsp;•&nbsp; Sem cartão &nbsp;•&nbsp; Cancele quando quiser
            </p>
          </div>
        </FadeUp>
      </section>

      {/* ── RODAPÉ ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-8 pt-10" style={{ borderTop: `1px solid rgba(13,27,42,0.08)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <Logo size={24} />
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { l: "Início",            h: "/"            },
                { l: "Planos",            h: "/planos"      },
                { l: "Por que o PRAXIS?", h: "/sobre"       },
                { l: "Privacidade",       h: "/privacidade" },
              ].map(({ l, h }) => (
                <Link key={l} href={h} style={{ fontSize: 12, color: MUTED, textDecoration: "none" }}>{l}</Link>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: "rgba(13,27,42,0.06)", marginBottom: 16 }} />
          <p className="text-center" style={{ fontSize: 11, fontFamily: "monospace", color: MUTED }}>
            © 2026 PRAXIS. Construído por médico, para médicos.
          </p>
        </div>
      </footer>

    </div>
  )
}
