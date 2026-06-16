"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, ChevronDown, Play } from "lucide-react"
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

const MODULES = [
  {
    id: "social",
    title: "PRAXIS Social",
    tagline: "Atração e conteúdo médico de alto impacto",
    color: "#3b7fff",
    href: "/praxis-social",
    screenshot: "/screenshots/crm.png",
    features: [
      "Roteiros e legendas gerados por IA em minutos",
      "Calendário editorial de 30 dias automático",
      "Radar de tendências médicas em tempo real",
    ],
  },
  {
    id: "consultorio",
    title: "PRAXIS Consultório",
    tagline: "Atendimento aumentado por inteligência artificial",
    color: "#b8976a",
    href: "/praxis-consultorio",
    screenshot: "/screenshots/nps.png",
    features: [
      "Resumo SOAP gerado após cada consulta",
      "Follow-up automático D+1, D+7 e D+30",
      "Calculadoras clínicas integradas (HOMA-IR, ASCVD)",
    ],
  },
  {
    id: "executivo",
    title: "PRAXIS Executivo",
    tagline: "Sua clínica como um negócio gerenciado com dados",
    color: "#16a34a",
    href: "/praxis-executivo",
    screenshot: "/screenshots/executivo.png",
    features: [
      "Painel de faturamento e indicadores em tempo real",
      "Consultor estratégico IA disponível 24h",
      "Funil de conversão de leads visualizado",
    ],
  },
  {
    id: "ia",
    title: "PRAXIS IA",
    tagline: "Inteligência artificial integrada a todas as áreas",
    color: "#a78bfa",
    href: "/praxis-ia",
    screenshot: "/screenshots/consultor.png",
    features: [
      "IA clínica especializada em medicina, não genérica",
      "Análise da clínica com recomendações acionáveis",
      "Geração de conteúdo adaptada ao nicho e especialidade",
    ],
  },
  {
    id: "academy",
    title: "PRAXIS Academy",
    tagline: "Estratégias validadas de marketing médico e gestão",
    color: "#f59e0b",
    href: "/praxis-academy",
    screenshot: "/screenshots/indicadores.png",
    features: [
      "Playbooks e SOPs da clínica documentados",
      "Scripts de atendimento para WhatsApp",
      "Guias de precificação para médicos",
    ],
  },
]

const FLUXO = [
  { label: "Lead", desc: "Paciente descobre você pelo conteúdo", color: "#3b7fff" },
  { label: "CRM", desc: "Capturado e acompanhado automaticamente", color: "#b8976a" },
  { label: "Consulta", desc: "IA documenta e sugere condutas", color: "#16a34a" },
  { label: "Follow-up", desc: "Mensagens automáticas D+1 a D+30", color: "#a78bfa" },
  { label: "Conteúdo", desc: "Caso vira pauta — o ciclo recomeça", color: "#f59e0b" },
]

export default function TourPage() {
  const [activeModule, setActiveModule] = useState(0)

  return (
    <div style={{ background: BG, fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(245,240,232,0.93)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/sobre" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Por que o PRAXIS?</Link>
          <Link href="/planos" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Planos</Link>
          <Link href="/cadastro"
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-[12px] transition-all hover:opacity-90"
            style={{ padding: "8px 18px", background: DARK, color: GOLD }}>
            Começar grátis <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </nav>

      {/* ── SEÇÃO 1 — HERO ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeUp>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", border: `1px solid ${GOLD}40`, padding: "4px 16px", borderRadius: 999, marginBottom: 28 }}>
            <Play style={{ width: 10, height: 10 }} /> TOUR DA PLATAFORMA
          </span>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 700, color: DARK, lineHeight: 1.15, marginBottom: 20,
          }}>
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

      {/* ── SEÇÃO 2 — 5 MÓDULOS ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-12">
          <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>5 MÓDULOS</p>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Uma plataforma completa para médicos
          </h2>
          <p style={{ fontSize: 15, color: TEXT2, marginTop: 12 }}>
            Cada módulo resolve um problema específico — juntos, formam o sistema operacional da sua clínica.
          </p>
        </FadeUp>

        {/* Module tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {MODULES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModule(i)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1px solid ${activeModule === i ? m.color + "60" : BORDER}`,
                background: activeModule === i ? `${m.color}12` : CARD,
                color: activeModule === i ? m.color : MUTED,
                fontSize: 12,
                fontWeight: activeModule === i ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {m.title}
            </button>
          ))}
        </div>

        {/* Active module detail */}
        {MODULES.map((m, i) => (
          <div key={m.id} style={{ display: activeModule === i ? "block" : "none" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                <Image
                  src={m.screenshot}
                  alt={`${m.title} — PRAXIS`}
                  width={800}
                  height={500}
                  className="w-full h-auto block"
                  unoptimized
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center">
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${m.color}12`, border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 20 }}>
                    {i === 0 ? "📱" : i === 1 ? "🩺" : i === 2 ? "📊" : i === 3 ? "🤖" : "🎓"}
                  </span>
                </div>
                <p style={{ fontSize: 10, fontFamily: "monospace", color: m.color, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>MÓDULO {i + 1} DE 5</p>
                <h3 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: DARK, marginBottom: 8, lineHeight: 1.25 }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: 14, color: TEXT2, marginBottom: 24, lineHeight: 1.6 }}>{m.tagline}</p>
                <div className="space-y-3 mb-8">
                  {m.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <Check style={{ width: 15, height: 15, color: m.color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: TEXT2, lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={m.href}
                  className="inline-flex items-center gap-2 rounded-xl font-semibold text-[13px] transition-all hover:opacity-90 self-start"
                  style={{ padding: "12px 24px", background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}35` }}>
                  Explorar {m.title} <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </div>

            {/* Module navigation dots */}
            <div className="flex justify-center gap-2 mt-8">
              {MODULES.map((_, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setActiveModule(j)}
                  style={{
                    width: j === activeModule ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: j === activeModule ? m.color : `${DARK}20`,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── SEÇÃO 3 — FLUXO INTEGRADO ────────────────────────────────────────── */}
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

        {/* Fluxo steps */}
        <FadeUp delay={300}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            {FLUXO.map((step, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: CARD, border: `1px solid ${step.color}25` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${step.color}15`, border: `1px solid ${step.color}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 12, fontWeight: 700, color: step.color }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 4 }}>{step.label}</div>
                <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.4 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* ── SEÇÃO 4 — CTA FINAL ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-16 md:py-20"
            style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
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

      {/* ── RODAPÉ ───────────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-8 pt-10" style={{ borderTop: `1px solid rgba(13,27,42,0.08)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <Logo size={24} />
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { l: "Início",           h: "/"            },
                { l: "Tour completo",    h: "/tour"        },
                { l: "Planos",           h: "/planos"      },
                { l: "Por que o PRAXIS?",h: "/sobre"       },
                { l: "Privacidade",      h: "/privacidade" },
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
