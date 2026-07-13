"use client"

import Link from "next/link"
import { useRef, useEffect, useState } from "react"
import {
  ArrowRight, Bot, Database, Zap, Lock, Check,
  Users, Cpu, BarChart3, Shield, Heart,
} from "lucide-react"

// ─── Tokens ───────────────────────────────────────────────────────────────────
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

const ALTERNATIVES = [
  {
    label: "Agências de marketing",
    color: "#dc2626",
    issues: [
      "Custo elevado: R$ 3.000–8.000 por mês",
      "Não entendem a linguagem clínica nem o CFM",
      "Processo lento — semanas para aprovação de conteúdo",
      "Resultado depende de uma pessoa, não de sistema",
    ],
  },
  {
    label: "ChatGPT / IA genérica",
    color: "#d97706",
    issues: [
      "Sem contexto clínico — respostas genéricas demais",
      "Nenhuma integração com CRM, agenda ou prontuário",
      "Cada sessão começa do zero — sem memória do médico",
      "Não foi treinado para o CFM, LGPD ou linguagem médica brasileira",
    ],
  },
  {
    label: "CRMs comuns (HubSpot, RD Station)",
    color: "#7c3aed",
    issues: [
      "Feitos para B2B, não para saúde",
      "Não têm módulos clínicos nem IA médica",
      "Setup complexo, curva de aprendizado longa",
      "Sem integração com sistemas médicos (MedX, prontuário)",
    ],
  },
  {
    label: "Plataformas de marketing médico",
    color: "#0891b2",
    issues: [
      "Focam apenas em conteúdo — sem CRM nem gestão clínica",
      "Templates genéricos que não se adaptam à especialidade",
      "Sem IA clínica: são editores, não assistentes",
      "Dados não conversam entre módulos",
    ],
  },
]

const DIFERENCIAIS = [
  {
    icon: Heart, color: GOLD,
    titulo: "Construído por um médico",
    desc: "O PRAXIS nasceu de uma frustração comum entre médicos: as ferramentas existentes eram genéricas, caras ou não entendiam a realidade da medicina brasileira. Cada módulo foi projetado a partir de necessidades clínicas reais.",
  },
  {
    icon: Cpu, color: "#3b7fff",
    titulo: "IA especializada em medicina",
    desc: "Não usamos IA genérica. O sistema é configurado com contexto clínico — CFM, linguagem médica, especialidades brasileiras. Cada resposta é gerada com esse contexto embutido.",
  },
  {
    icon: Database, color: "#16a34a",
    titulo: "Tudo integrado, não fragmentado",
    desc: "O lead captado via conteúdo vai direto ao CRM. O CRM alimenta o nurturing WhatsApp. A consulta alimenta o follow-up. Os dados do financeiro aparecem no painel. Um sistema, não 7 ferramentas.",
  },
  {
    icon: BarChart3, color: "#8b5cf6",
    titulo: "Gestão clínica, não só marketing",
    desc: "Enquanto outras plataformas param no conteúdo, o PRAXIS avança para a operação: agenda, pacientes, protocolos, prescrição, NPS e financeiro — tudo em um único lugar.",
  },
  {
    icon: Shield, color: "#ec4899",
    titulo: "Segurança e privacidade por padrão",
    desc: "Supabase com Row Level Security garante que cada médico vê apenas os próprios dados. Nenhum dado clínico é compartilhado entre usuários ou usado para treinar modelos de IA.",
  },
]

const TECH_STACK = [
  { label: "Next.js 14",    desc: "App Router, SSR, performance",         color: "#000000" },
  { label: "TypeScript",    desc: "Tipagem estática em todo o codebase",    color: "#3178c6" },
  { label: "Supabase",      desc: "PostgreSQL + Auth + RLS + Realtime",     color: "#3ecf8e" },
  { label: "Claude AI",     desc: "Anthropic — IA de última geração",       color: GOLD },
  { label: "Vercel",        desc: "Deploy global com CI/CD automático",     color: "#000000" },
  { label: "Stripe",        desc: "Pagamentos seguros — certificação PCI",  color: "#635bff" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SobrePage() {
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: BG, fontFamily: "Inter, sans-serif" }}>

      {/* ── NAV ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
        style={{ height: 64, background: "rgba(245,240,232,0.93)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
        <Link href="/"><Logo /></Link>
        <div className="flex items-center gap-4">
          <Link href="/"        className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Home</Link>
          <Link href="/planos"  className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Planos</Link>
          <Link href="/planos"
            className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-[12px] transition-all hover:opacity-90"
            style={{ padding: "8px 18px", background: DARK, color: GOLD }}>
            Testar grátis <ArrowRight style={{ width: 12, height: 12 }} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <FadeUp>
          <SLabel>SOBRE O PRAXIS</SLabel>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(28px, 5vw, 52px)",
            fontWeight: 700, color: DARK, lineHeight: 1.2, marginBottom: 20,
          }}>
            Por que o PRAXIS<br />
            <span style={{ color: GOLD }}>é diferente?</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: TEXT2, lineHeight: 1.75 }}>
            Uma plataforma construída a partir de uma frustração real — e da convicção de que médicos merecem ferramentas melhores.
          </p>
        </FadeUp>
      </section>

      {/* ── ORIGEM ─────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <FadeUp>
          <div className="rounded-2xl p-10 md:p-14" style={{ background: DARK }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>B</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F0E8" }}>Dr. Bruno Gustavo</div>
                <div style={{ fontSize: 11, color: "rgba(245,240,232,0.50)" }}>Médico empreendedor e fundador do PRAXIS</div>
              </div>
            </div>
            <blockquote style={{ fontSize: 16, color: "rgba(245,240,232,0.85)", lineHeight: 1.85, fontStyle: "italic", borderLeft: `3px solid ${GOLD}60`, paddingLeft: 20 }}>
              "Construí o PRAXIS para resolver problemas que enfrentei na prática: perder oportunidades por falta de acompanhamento, gastar horas com marketing sem previsibilidade e administrar a clínica sem indicadores claros.
              <br /><br />
              Quando percebi que esses desafios eram comuns entre médicos empreendedores, decidi transformar a solução que funcionou para mim em uma plataforma completa."
            </blockquote>
          </div>
        </FadeUp>
      </section>

      {/* ── O PROBLEMA COM AS ALTERNATIVAS ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>O PROBLEMA</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Por que as alternativas não funcionam
          </h2>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALTERNATIVES.map(({ label, color, issues }, i) => (
            <FadeUp key={label} delay={i * 80}>
              <div className="rounded-2xl p-7 h-full" style={{ background: CARD, border: `1px solid ${color}20` }}>
                <div style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>❌ {label}</div>
                <ul className="space-y-2.5">
                  {issues.map((iss, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <span style={{ fontSize: 11, color, flexShrink: 0, marginTop: 1 }}>•</span>
                      <span style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>{iss}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── O QUE NOS DIFERENCIA ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>NOSSOS DIFERENCIAIS</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            O que torna o PRAXIS único
          </h2>
        </FadeUp>
        <div className="space-y-4">
          {DIFERENCIAIS.map(({ icon: Icon, color, titulo, desc }, i) => (
            <FadeUp key={titulo} delay={i * 60}>
              <div className="rounded-2xl p-7 flex items-start gap-5" style={{ background: CARD, border: `1px solid ${color}20` }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 6, fontFamily: "var(--font-playfair), Georgia, serif" }}>{titulo}</h3>
                  <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── TECNOLOGIA ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <FadeUp className="text-center mb-10">
          <SLabel>TECNOLOGIA</SLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Construído com tecnologia de ponta
          </h2>
          <p style={{ fontSize: 14, color: TEXT2, marginTop: 8 }}>As mesmas ferramentas usadas por startups de tecnologia líderes mundiais</p>
        </FadeUp>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {TECH_STACK.map(({ label, desc, color }, i) => (
            <FadeUp key={label} delay={i * 60}>
              <div className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color, marginBottom: 4, fontFamily: "monospace" }}>{label}</div>
                <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── VALORES ────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <FadeUp>
          <div className="rounded-2xl p-10" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
            <SLabel>NOSSOS PRINCÍPIOS</SLabel>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 700, color: DARK, marginBottom: 20 }}>
              O que guia o desenvolvimento
            </h2>
            <div className="space-y-4">
              {[
                { t: "Medicina primeiro", d: "Cada decisão de produto parte de uma necessidade clínica real. Se não resolve um problema do médico, não entra no PRAXIS." },
                { t: "Simplicidade sem superficialidade", d: "A interface é simples, mas as funcionalidades são profundas. Médico não tem tempo para curva de aprendizado longa." },
                { t: "Dados como ferramenta, não como produto", d: "Seus dados clínicos são seus. Nunca são compartilhados, nunca usados para treinar modelos externos." },
                { t: "Resultado mensurável", d: "Cada módulo tem um resultado esperado claro. Marketing sem métrica não serve. Gestão sem indicador não escala." },
              ].map(({ t, d }) => (
                <div key={t} className="flex items-start gap-3">
                  <Check style={{ width: 16, height: 16, color: GOLD, flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 3 }}>{t}</div>
                    <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pb-28">
        <FadeUp>
          <div className="text-center rounded-2xl px-8 py-16" style={{ background: DARK }}>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: "#F5F0E8", marginBottom: 12 }}>
              Pronto para transformar<br /> sua clínica?
            </h2>
            <p style={{ fontSize: 15, color: "rgba(245,240,232,0.65)", marginBottom: 28, lineHeight: 1.7 }}>
              7 dias grátis, sem cartão. Cancele quando quiser.
            </p>
            <Link href="/planos"
              className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-90"
              style={{ padding: "16px 40px", fontSize: 15, background: GOLD, color: DARK }}>
              Ver planos <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 pb-8 pt-8" style={{ borderTop: `1px solid rgba(13,27,42,0.08)` }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={22} />
          <div className="flex items-center gap-5">
            {[{ l: "Home", h: "/" }, { l: "Planos", h: "/planos" }, { l: "Privacidade", h: "/privacidade" }].map(({ l, h }) => (
              <Link key={l} href={h} style={{ fontSize: 12, color: MUTED }}>{l}</Link>
            ))}
          </div>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: MUTED }}>© {new Date().getFullYear()} PRAXIS</p>
        </div>
      </footer>

    </div>
  )
}
