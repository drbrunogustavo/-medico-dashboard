import Link from "next/link"
import Image from "next/image"
import { Panel, PxButton } from "@/components/px"

// Estrutura comum das páginas públicas de módulo (/praxis-*).
// Cada página leva o próprio wrapper `px`, porque rotas públicas não passam pelo AppShell.

export const MODULES = [
  { label: "Social", href: "/praxis-social" },
  { label: "Consultório", href: "/praxis-consultorio" },
  { label: "Executivo", href: "/praxis-executivo" },
  { label: "IA", href: "/praxis-ia" },
  { label: "Academy", href: "/praxis-academy" },
] as const

export interface FeatureItem { title: string; desc: string }
export interface FAQItem { q: string; a: string }

export function ModulePageShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <header className="px-glass sticky top-0 z-10 flex h-16 items-center justify-between gap-4 px-4 md:px-12">
        <Link href="/" className="text-[15px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</Link>
        <nav aria-label="Módulos" className="hidden items-center gap-1 md:flex">
          {MODULES.map(m => (
            <Link
              key={m.href}
              href={m.href}
              aria-current={m.href === active ? "page" : undefined}
              className={m.href === active
                ? "rounded-px-ctl bg-px-ink px-3 py-1.5 text-[13px] font-medium text-white"
                : "rounded-px-ctl px-3 py-1.5 text-[13px] text-px-muted hover:text-px-ink"}
            >
              {m.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden px-2 text-[13px] text-px-muted hover:text-px-ink sm:block">Entrar</Link>
          <PxButton size="sm" href="/cadastro">Testar 7 dias</PxButton>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl space-y-14 px-4 pb-20 pt-12 md:px-10">{children}</main>

      <footer className="relative mx-auto max-w-5xl space-y-4 px-4 pb-10 md:px-10">
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-px-line pt-6 text-[13px] text-px-muted">
          {MODULES.map(m => <Link key={m.href} href={m.href} className="hover:text-px-ink">PRAXIS {m.label}</Link>)}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-px-muted">
          <Link href="/sobre" className="hover:text-px-ink">Por que o PRAXIS</Link>
          <Link href="/planos" className="hover:text-px-ink">Planos</Link>
          <Link href="/privacidade" className="hover:text-px-ink">Privacidade</Link>
          <Link href="/termos" className="hover:text-px-ink">Termos</Link>
          <Link href="/captacao" className="hover:text-px-ink">Contato</Link>
        </div>
        <p className="text-[12.5px] text-px-muted">© 2026 PRAXIS</p>
      </footer>
    </div>
  )
}

export function ModuleHero({ title, subtitle, ctaLabel = "Testar 7 dias", ctaHref = "/cadastro" }: {
  title: string; subtitle: string; ctaLabel?: string; ctaHref?: string
}) {
  return (
    <section className="max-w-3xl space-y-5">
      <h1 className="text-[clamp(30px,5vw,50px)] font-semibold leading-[1.1] text-px-ink">{title}</h1>
      <p className="text-[clamp(16px,2vw,19px)] leading-relaxed text-px-muted">{subtitle}</p>
      <PxButton href={ctaHref}>{ctaLabel}</PxButton>
    </section>
  )
}

export function ModuleSection({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-[clamp(22px,3vw,30px)] font-semibold leading-tight text-px-ink">{title}</h2>
        {intro && <p className="text-[15px] leading-relaxed text-px-muted">{intro}</p>}
      </div>
      {children}
    </section>
  )
}

export function FeatureGrid({ items, title, intro }: { items: FeatureItem[]; title: string; intro?: string }) {
  return (
    <ModuleSection title={title} intro={intro}>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(i => (
          <li key={i.title}>
            <Panel as="article" className="h-full space-y-1.5 !py-5">
              <h3 className="text-[15px] font-semibold text-px-ink">{i.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-px-muted">{i.desc}</p>
            </Panel>
          </li>
        ))}
      </ul>
    </ModuleSection>
  )
}

export function ModuleScreenshot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="space-y-3">
      <Panel as="div" className="overflow-hidden !p-0">
        <Image src={src} alt={alt} width={1200} height={750} className="block h-auto w-full" unoptimized />
      </Panel>
      <figcaption className="text-[13.5px] text-px-muted">{caption}</figcaption>
    </figure>
  )
}

export function ModuleFAQ({ items }: { items: FAQItem[] }) {
  return (
    <ModuleSection title="Perguntas frequentes">
      <div className="max-w-3xl space-y-2">
        {items.map(i => (
          <Panel as="div" key={i.q} className="!py-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[15px] font-medium text-px-ink">
                {i.q}
                <span aria-hidden="true" className="text-px-muted group-open:hidden">+</span>
                <span aria-hidden="true" className="hidden text-px-muted group-open:inline">-</span>
              </summary>
              <p className="pb-4 text-[14px] leading-relaxed text-px-muted">{i.a}</p>
            </details>
          </Panel>
        ))}
      </div>
    </ModuleSection>
  )
}

export function ModuleFinalCTA({ title, ctaLabel = "Testar 7 dias", ctaHref = "/cadastro" }: {
  title: string; ctaLabel?: string; ctaHref?: string
}) {
  return (
    <Panel tone="dark" as="section" className="space-y-4 !p-8 text-center md:!p-12">
      <h2 className="mx-auto max-w-xl text-[clamp(22px,3.5vw,32px)] font-semibold leading-tight">{title}</h2>
      <p className="mx-auto max-w-lg text-[14px] opacity-80">
        O período de teste dura 7 dias. Depois dele, o plano escolhido é cobrado no cartão cadastrado. Valores e condições estão em Planos e nos Termos.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <PxButton variant="inverse" href={ctaHref}>{ctaLabel}</PxButton>
        <PxButton variant="quiet" href="/planos" className="!text-white">Ver planos</PxButton>
      </div>
    </Panel>
  )
}
