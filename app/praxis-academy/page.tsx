import type { Metadata } from "next"
import { Megaphone, Settings, Handshake, Rocket, Clock, Users2 } from "lucide-react"
import {
  ModulePageShell, ModuleHero, ProblemBlock, ModuleFinalCTA, SectionLabel,
} from "@/components/modules/shared"
import { DARK, GOLD, TEXT2, CARD } from "@/lib/module-tokens"

const ACCENT = "#f59e0b"

export const metadata: Metadata = {
  title: "PRAXIS Academy — Aprenda o que não ensinaram na faculdade de medicina",
  description:
    "38 aulas em 4 trilhas: Marketing Médico, Gestão de Clínica, Comercial e Conversão, Escalabilidade. Estratégias validadas por médicos empreendedores.",
  keywords: [
    "curso marketing médico", "gestão de clínica curso", "academy médicos",
    "trilhas para médicos", "escalabilidade clínica médica", "PRAXIS Academy",
  ],
  alternates: { canonical: "/praxis-academy" },
  openGraph: {
    title: "PRAXIS Academy — Aprenda o que não ensinaram na faculdade de medicina",
    description: "38 aulas em 4 trilhas para construir uma clínica de sucesso.",
    url: "/praxis-academy",
    type: "website",
  },
}

const TRILHAS = [
  { icon: Megaphone, color: "#3b7fff", nome: "Marketing Médico",         aulas: "12 aulas", resultado: "Do zero à autoridade digital" },
  { icon: Settings,  color: GOLD,      nome: "Gestão de Clínica",        aulas: "10 aulas", resultado: "Gerencie como empresário" },
  { icon: Handshake, color: "#16a34a", nome: "Comercial e Conversão",    aulas: "8 aulas",  resultado: "Converta mais sem vender" },
  { icon: Rocket,    color: "#a78bfa", nome: "Escalabilidade",           aulas: "8 aulas",  resultado: "Cresça além da consulta" },
]

export default function PraxisAcademyPage() {
  return (
    <ModulePageShell active="PRAXIS Academy">
      <ModuleHero
        badge="38 aulas em 4 trilhas"
        title="PRAXIS Academy"
        accent={ACCENT}
        subtitle="Aprenda o que não ensinaram na faculdade de medicina — marketing, gestão e escalabilidade para sua clínica."
      />

      <ProblemBlock label="O GAP" color={ACCENT}>
        A faculdade ensina medicina. Não ensina como construir uma clínica de sucesso.
      </ProblemBlock>

      {/* ── 4 TRILHAS ────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-10 animate-fade-in">
          <SectionLabel color={ACCENT}>TRILHAS</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            4 trilhas para uma clínica de sucesso
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {TRILHAS.map(({ icon: Icon, color, nome, aulas, resultado }) => (
            <div key={nome} className="rounded-2xl p-7 h-full flex flex-col animate-fade-in" style={{ background: CARD, border: `1px solid ${color}20` }}>
              <div className="flex items-center gap-4 mb-4">
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${color}12`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: DARK, lineHeight: 1.3 }}>{nome}</h3>
                  <span style={{ fontSize: 10, fontFamily: "monospace", color, letterSpacing: "1px", textTransform: "uppercase" }}>{aulas}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>{resultado}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMUNIDADE (EM BREVE) ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24 animate-fade-in">
        <div className="rounded-2xl p-10 md:p-12 text-center" style={{ background: DARK, border: `1px solid ${ACCENT}25` }}>
          <div className="inline-flex items-center gap-2 mb-5" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, borderRadius: 999, padding: "6px 16px" }}>
            <Users2 style={{ width: 14, height: 14, color: ACCENT }} />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: ACCENT, letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Comunidade PRAXIS — Em breve
            </span>
          </div>
          <h3 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(18px, 2.6vw, 26px)", fontWeight: 700, color: "#F5F0E8", marginBottom: 10, lineHeight: 1.3 }}>
            Benchmarking, desafios mensais e troca entre médicos
          </h3>
          <p className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: "rgba(245,240,232,0.5)" }}>
            <Clock style={{ width: 12, height: 12 }} /> Disponível em breve para todos os planos
          </p>
        </div>
      </section>

      <ModuleFinalCTA
        title="Pronto para aprender o que a faculdade não ensinou?"
        subtitle="Teste grátis por 7 dias. Nenhum cartão necessário."
        ctaLabel="Começar grátis"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
