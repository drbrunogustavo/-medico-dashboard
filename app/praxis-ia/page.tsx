import type { Metadata } from "next"
import {
  Brain, BookOpen, FlaskConical, Compass, TrendingUp, Bot, Database, Sparkles, Repeat,
} from "lucide-react"
import {
  ModulePageShell, ModuleHero, ProblemBlock,
  FeatureGrid, ModuleFinalCTA, ModuleFAQ, SectionLabel,
  type FeatureItem, type FAQItem,
} from "@/components/modules/shared"
import { DARK, TEXT2, CARD, GOLD, MUTED, BORDER } from "@/lib/module-tokens"

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

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "Os dados da minha clínica são usados para treinar a IA?",
    a: "Não. Nenhum dado da sua clínica, dos seus pacientes ou dos seus conteúdos é usado para treinar modelos de IA. Cada conta é isolada por Row Level Security no banco de dados.",
  },
  {
    q: "Qual a diferença do PRAXIS IA para o ChatGPT?",
    a: "O ChatGPT é genérico. O PRAXIS IA é instruído com o contexto da medicina, da sua especialidade e da sua clínica. Além disso, está integrado ao seu CRM, financeiro e indicadores — gerando análises com dados reais, não exemplos fictícios.",
  },
  {
    q: "A IA comete erros nas sugestões clínicas?",
    a: "Sim — como qualquer ferramenta de IA. O PRAXIS é projetado como suporte à decisão médica, não substituto. Todo output é revisável e você, como médico, mantém responsabilidade total pelas condutas.",
  },
  {
    q: "Funciona sem internet?",
    a: "Não. As funções de IA requerem conexão com a internet para processar as requisições. O restante da plataforma (CRM, financeiro, calendário) funciona normalmente com conexão intermitente.",
  },
]

const COMP_ROWS = [
  { feature: "Contexto médico especializado",   chatgpt: false, praxis: true  },
  { feature: "Integrado ao CRM e financeiro",   chatgpt: false, praxis: true  },
  { feature: "Memória da clínica e protocolos", chatgpt: false, praxis: true  },
  { feature: "Dados reais da sua clínica",       chatgpt: false, praxis: true  },
  { feature: "Análise de tendências médicas",    chatgpt: "~",   praxis: true  },
  { feature: "Geração de conteúdo",              chatgpt: true,  praxis: true  },
  { feature: "Resposta a perguntas gerais",      chatgpt: true,  praxis: true  },
  { feature: "Privacidade dos dados",            chatgpt: "~",   praxis: true  },
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

      {/* ── PRAXIS IA vs ChatGPT ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24 animate-fade-in">
        <div className="text-center mb-10">
          <SectionLabel color={ACCENT}>COMPARATIVO</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700, color: DARK }}>
            PRAXIS IA vs ChatGPT
          </h2>
          <p style={{ fontSize: 14, color: TEXT2, marginTop: 10 }}>Não é um wrapper. É uma IA integrada ao seu negócio.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: CARD }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontFamily: "monospace", color: MUTED, letterSpacing: "1px", fontWeight: 600 }}>RECURSO</th>
                {["ChatGPT", "PRAXIS IA"].map((h, i) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "center", fontSize: 12, fontWeight: 700, color: i === 1 ? ACCENT : TEXT2, background: i === 1 ? `${ACCENT}06` : "transparent" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMP_ROWS.map(({ feature, chatgpt, praxis }, ri) => (
                <tr key={feature} style={{ borderBottom: ri < COMP_ROWS.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: TEXT2 }}>{feature}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {chatgpt === true  ? <span style={{ fontSize: 16 }}>✓</span>
                    : chatgpt === false ? <span style={{ color: "#dc2626", fontSize: 14, fontWeight: 700 }}>✗</span>
                    : <span style={{ color: "#d97706" }}>~</span>}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center", background: `${ACCENT}05` }}>
                    {praxis === true ? <span style={{ color: ACCENT, fontSize: 16 }}>✓</span> : <span style={{ color: "#dc2626" }}>✗</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ModuleFAQ items={FAQ_ITEMS} color={ACCENT} />

      <ModuleFinalCTA
        title="Quanto mais cedo começar, mais personalizada fica"
        subtitle="A memória clínica do PRAXIS começa a aprender desde o primeiro dia de uso."
        ctaLabel="Começar grátis"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
