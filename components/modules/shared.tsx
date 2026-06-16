import Link from "next/link"
import Image from "next/image"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { BG, GOLD, DARK, TEXT2, MUTED, CARD, BORDER } from "@/lib/module-tokens"

// ─── Logo (idêntico ao da landing, sem hooks — server-safe) ───────────────────

export function ModuleLogo({ size = 26 }: { size?: number }) {
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

export function SectionLabel({ children, color = GOLD }: { children: string; color?: string }) {
  return <p style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>{children}</p>
}

// ─── Nav ────────────────────────────────────────────────────────────────────

export function ModuleNav({ active }: { active: string }) {
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12"
      style={{ height: 64, background: "rgba(245,240,232,0.93)", borderBottom: `1px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
      <Link href="/" className="flex items-center gap-3">
        <ModuleLogo />
        <span className="hidden sm:inline-block" style={{ fontSize: 11, color: MUTED, borderLeft: `1px solid ${BORDER}`, paddingLeft: 12 }}>
          {active}
        </span>
      </Link>
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>← Voltar ao início</Link>
        <Link href="/planos" className="hidden md:block text-[12px]" style={{ color: TEXT2 }}>Planos</Link>
        <Link href="/login" className="text-[12px]" style={{ color: TEXT2 }}>Entrar</Link>
        <Link href="/cadastro"
          className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-[12px] transition-all hover:opacity-90"
          style={{ padding: "8px 18px", background: DARK, color: GOLD }}>
          Testar grátis <ArrowRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>
    </nav>
  )
}

// ─── Footer ─────────────────────────────────────────────────────────────────

const MODULE_LINKS = [
  { l: "PRAXIS Social",       h: "/praxis-social"       },
  { l: "PRAXIS Consultório",  h: "/praxis-consultorio"  },
  { l: "PRAXIS Executivo",    h: "/praxis-executivo"    },
  { l: "PRAXIS IA",           h: "/praxis-ia"            },
  { l: "PRAXIS Academy",      h: "/praxis-academy"      },
]

export function ModuleFooter() {
  return (
    <footer className="px-6 pb-8 pt-10" style={{ borderTop: `1px solid rgba(13,27,42,0.08)` }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <Link href="/"><ModuleLogo size={24} /></Link>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { l: "Por que o PRAXIS?", h: "/sobre"       },
              { l: "Planos",            h: "/planos"      },
              { l: "Privacidade",       h: "/privacidade" },
              { l: "Termos",            h: "/termos"      },
              { l: "Contato",           h: "/captacao"    },
            ].map(({ l, h }) => (
              <Link key={l} href={h} className="text-[12px]" style={{ color: MUTED }}>{l}</Link>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 mb-6">
          {MODULE_LINKS.map(({ l, h }) => (
            <Link key={l} href={h} className="text-[11px] font-mono" style={{ color: GOLD }}>{l}</Link>
          ))}
        </div>
        <div style={{ height: 1, background: "rgba(13,27,42,0.06)", marginBottom: 20 }} />
        <p className="text-center" style={{ fontSize: 11, fontFamily: "monospace", color: MUTED, letterSpacing: "0.5px" }}>
          © 2026 PRAXIS. Construído por médico, para médicos.
        </p>
      </div>
    </footer>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────

export function ModuleHero({
  badge, title, accent, subtitle, ctaLabel = "Começar grátis", ctaHref = "/cadastro",
}: {
  badge: string
  title: string
  accent: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center animate-fade-in">
      <span style={{ display: "inline-block", fontSize: 11, fontFamily: "monospace", color: accent, letterSpacing: "2px", border: `1px solid ${accent}40`, padding: "4px 16px", borderRadius: 999, marginBottom: 28 }}>
        {badge}
      </span>
      <h1 style={{
        fontFamily: "var(--font-playfair), Georgia, serif",
        fontSize: "clamp(28px, 5vw, 54px)",
        fontWeight: 700, color: DARK, lineHeight: 1.15, marginBottom: 20,
      }}>
        {title}
      </h1>
      <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: TEXT2, lineHeight: 1.75, maxWidth: 620, margin: "0 auto 36px" }}>
        {subtitle}
      </p>
      <Link href={ctaHref}
        className="inline-flex items-center gap-2 rounded-xl font-bold transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ padding: "16px 36px", fontSize: 15, background: GOLD, color: DARK, boxShadow: `0 8px 40px ${GOLD}30` }}>
        {ctaLabel} <ArrowRight style={{ width: 16, height: 16 }} />
      </Link>
    </section>
  )
}

// ─── Problema / texto de destaque ──────────────────────────────────────────

export function ProblemBlock({ label = "O PROBLEMA", color = GOLD, children }: { label?: string; color?: string; children: React.ReactNode }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pb-20 text-center animate-fade-in">
      <SectionLabel color={color}>{label}</SectionLabel>
      <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3.4vw, 32px)", fontWeight: 600, color: DARK, lineHeight: 1.4 }}>
        {children}
      </p>
    </section>
  )
}

// ─── Screenshot com frame de browser ───────────────────────────────────────

export function ModuleScreenshot({
  src, alt, caption, color, ctaLabel, ctaHref,
}: {
  src: string
  alt: string
  caption: string
  color: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <div className="animate-fade-in">
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `0 20px 80px rgba(13,27,42,0.15), 0 0 0 1px ${BORDER}` }}>
        <div style={{ background: "#1a1a1c", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57", "#febc2e", "#28c840"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 5, padding: "3px 10px", fontSize: 10, color: "rgba(255,255,255,0.28)", textAlign: "center" }}>
            app.praxisplataforma.com.br
          </div>
        </div>
        <div className="relative w-full" style={{ background: "#0a0a0b" }}>
          <Image src={src} alt={alt} width={1200} height={750} className="w-full h-auto block" unoptimized />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 px-1">
        <p style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6 }}>{caption}</p>
        {ctaLabel && ctaHref && (
          <Link href={ctaHref}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold text-[13px] transition-all hover:opacity-90 flex-shrink-0"
            style={{ padding: "9px 20px", background: `${color}15`, color, border: `1px solid ${color}35` }}>
            {ctaLabel} <ArrowRight style={{ width: 13, height: 13 }} />
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Grid de funcionalidades ────────────────────────────────────────────────

export interface FeatureItem {
  icon: LucideIcon
  title: string
  desc: string
}

export function FeatureGrid({ items, color, label = "FUNCIONALIDADES", title }: {
  items: FeatureItem[]
  color: string
  label?: string
  title: string
}) {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <div className="text-center mb-10 animate-fade-in">
        <SectionLabel color={color}>{label}</SectionLabel>
        <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map(({ icon: Icon, title: t, desc }) => (
          <div key={t} className="rounded-2xl p-6 h-full flex flex-col animate-fade-in" style={{ background: CARD, border: `1px solid ${color}20` }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}12`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, marginBottom: 8, lineHeight: 1.35 }}>{t}</h3>
            <p style={{ fontSize: 12.5, color: TEXT2, lineHeight: 1.7 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Resultado prometido ────────────────────────────────────────────────────

export function ResultBanner({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <section className="max-w-3xl mx-auto px-6 pb-24 animate-fade-in">
      <div className="text-center rounded-2xl px-8 py-10" style={{ background: `${color}08`, border: `1px solid ${color}25` }}>
        <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(18px, 2.8vw, 26px)", fontWeight: 600, color: DARK, lineHeight: 1.5 }}>
          {children}
        </p>
      </div>
    </section>
  )
}

// ─── CTA final ───────────────────────────────────────────────────────────────

export function ModuleFinalCTA({
  title, subtitle, ctaLabel = "Teste grátis por 7 dias", ctaHref = "/cadastro",
}: {
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}) {
  return (
    <section className="max-w-3xl mx-auto px-6 pb-28 animate-fade-in">
      <div className="text-center rounded-2xl px-8 py-16 md:py-20" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
        <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 700, color: DARK, lineHeight: 1.2, marginBottom: 14 }}>
          {title}
        </h2>
        <p style={{ fontSize: 15, color: TEXT2, lineHeight: 1.7, marginBottom: 32 }}>
          {subtitle}
        </p>
        <Link href={ctaHref}
          className="inline-flex items-center gap-2.5 rounded-xl font-bold transition-all hover:opacity-95 active:scale-[0.98]"
          style={{ padding: "18px 44px", fontSize: 16, background: GOLD, color: DARK, boxShadow: `0 0 60px ${GOLD}25` }}>
          {ctaLabel} <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
        <p style={{ fontSize: 12, color: MUTED, marginTop: 16 }}>
          7 dias grátis &nbsp;•&nbsp; Sem cartão &nbsp;•&nbsp; Cancele quando quiser
        </p>
      </div>
    </section>
  )
}

// ─── Wrapper de página ──────────────────────────────────────────────────────

export function ModulePageShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ background: BG, fontFamily: "Inter, sans-serif" }}>
      <ModuleNav active={active} />
      {children}
      <ModuleFooter />
    </div>
  )
}
