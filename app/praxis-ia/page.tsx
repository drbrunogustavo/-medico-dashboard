import type { Metadata } from "next"
import {
  Brain, BookOpen, FlaskConical, Compass, TrendingUp, Bot, Database, Sparkles, Repeat,
} from "lucide-react"
import {
  ModulePageShell, ModuleHero, ProblemBlock,
  FeatureGrid, ModuleFinalCTA, SectionLabel, type FeatureItem,
} from "@/components/modules/shared"
import { DARK, TEXT2, CARD } from "@/lib/module-tokens"

const ACCENT = "#a78bfa"

export const metadata: Metadata = {
  title: "PRAXIS IA — Inteligência artificial especializada em medicina",
  description:
    "Não é ChatGPT para médicos. A IA do PRAXIS aprende o contexto da sua especialidade, dos seus pacientes e da sua clínica — e fica mais personalizada com o tempo.",
  keywords: [
    "IA para médicos", "inteligência artificial medicina", "memória clínica IA",
    "interpretação de exames IA", "consultor estratégico IA", "PRAXIS IA",
  ],
  alternates: { canonical: "/praxis-ia" },
  openGraph: {
    title: "PRAXIS IA — Inteligência artificial especializada em medicina",
    description: "IA que aprende com sua clínica — não uma IA genérica.",
    url: "/praxis-ia",
    type: "website",
  },
}

const FEATURES: FeatureItem[] = [
  { icon: Brain,        title: "Memória Clínica",            desc: "Aprende sobre sua clínica e personaliza tudo." },
  { icon: BookOpen,     title: "Banco de Estudos",            desc: "Principais estudos científicos curados." },
  { icon: FlaskConical, title: "Interpretação de Exames",      desc: "TSH, ferritina, vitamina D e 60+ exames." },
  { icon: Compass,      title: "Posicionamento Médico",        desc: "Descubra seu nicho e diferencial." },
  { icon: TrendingUp,   title: "Inteligência de Mercado",      desc: "Trending topics médicos em tempo real." },
  { icon: Bot,          title: "Consultor Estratégico",        desc: "Análise baseada nos dados reais." },
]

const PASSOS = [
  { n: 1, icon: Database,  titulo: "Você usa a plataforma",                          desc: "Cada interação — conteúdo, consulta, indicador — alimenta o sistema." },
  { n: 2, icon: Sparkles,  titulo: "O PRAXIS aprende seus protocolos e preferências", desc: "A IA identifica padrões no seu jeito de atender e de se comunicar." },
  { n: 3, icon: Repeat,    titulo: "Tudo fica mais personalizado com o tempo",        desc: "Sugestões, textos e análises cada vez mais alinhados à sua clínica." },
]

export default function PraxisIaPage() {
  return (
    <ModulePageShell active="PRAXIS IA">
      <ModuleHero
        badge="IA que aprende com sua clínica"
        title="PRAXIS IA"
        accent={ACCENT}
        subtitle="Inteligência artificial especializada em medicina — integrada a todas as áreas da sua clínica."
      />

      <ProblemBlock label="O DIFERENCIAL" color={ACCENT}>
        Não é ChatGPT para médicos. É uma IA treinada com o contexto da sua especialidade,
        dos seus pacientes e da sua clínica.
      </ProblemBlock>

      <FeatureGrid
        items={FEATURES}
        color={ACCENT}
        title="IA integrada a cada módulo do PRAXIS"
      />

      {/* ── COMO A MEMÓRIA CLÍNICA FUNCIONA ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12 animate-fade-in">
          <SectionLabel color={ACCENT}>COMO FUNCIONA</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            Como a memória clínica funciona
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PASSOS.map(({ n, icon: Icon, titulo, desc }) => (
            <div key={n} className="rounded-2xl p-6 h-full flex flex-col animate-fade-in" style={{ background: CARD, border: `1px solid ${ACCENT}20`, position: "relative" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon style={{ width: 15, height: 15, color: ACCENT }} />
              </div>
              <div style={{ position: "absolute", top: 16, right: 16, fontSize: 28, fontWeight: 800, color: `${ACCENT}1a`, fontFamily: "monospace" }}>{n}</div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8, lineHeight: 1.3 }}>{titulo}</h3>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <ModuleFinalCTA
        title="Quanto mais cedo começar, mais personalizada fica"
        subtitle="A memória clínica do PRAXIS começa a aprender desde o primeiro dia de uso."
        ctaLabel="Começar grátis"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
