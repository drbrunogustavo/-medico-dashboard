import type { Metadata } from "next"
import {
  Sparkles, Calendar, Radar, Search, FileText, Video, Images, MessageSquare,
} from "lucide-react"
import {
  ModulePageShell, ModuleHero, ProblemBlock, ModuleScreenshot,
  FeatureGrid, ResultBanner, ModuleFinalCTA, ModuleFAQ,
  SectionLabel, type FeatureItem, type FAQItem,
} from "@/components/modules/shared"
import { DARK, TEXT2, CARD, GOLD } from "@/lib/module-tokens"

const ACCENT = "#3b7fff"

export const metadata: Metadata = {
  title: "PRAXIS Social — Conteúdo estratégico que atrai pacientes particulares",
  description:
    "Copiloto de Conteúdo, Calendário Editorial, Radar de Tendências e mais 5 ferramentas de IA para médicos que querem publicar com estratégia e atrair pacientes particulares.",
  keywords: [
    "conteúdo médico", "marketing médico", "instagram para médicos",
    "copiloto de conteúdo", "calendário editorial médico", "IA para médicos",
    "roteiro reels medicina", "PRAXIS Social",
  ],
  alternates: { canonical: "/praxis-social" },
  openGraph: {
    title: "PRAXIS Social — Conteúdo estratégico que atrai pacientes particulares",
    description: "15+ ferramentas de IA para criar conteúdo médico que converte seguidores em pacientes.",
    url: "/praxis-social",
    type: "website",
  },
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "Preciso ter muitos seguidores para o conteúdo funcionar?",
    a: "Não. O PRAXIS foi construído para médicos que estão começando a produzir conteúdo. A estratégia foca em conversão — transformar poucos seguidores certos em pacientes — não em viralizar.",
  },
  {
    q: "A IA escreve exatamente como eu?",
    a: "Com o tempo, sim. A IA aprende seu tom, especialidade e estilo de comunicação a cada conteúdo gerado. Você revisa e ajusta — mas cada vez menos.",
  },
  {
    q: "Posso usar para qualquer rede social?",
    a: "O foco principal é Instagram (Reels, Stories, Carrossel e Legenda). Mas o conteúdo gerado é facilmente adaptado para LinkedIn, YouTube Shorts e TikTok.",
  },
  {
    q: "Quantas peças de conteúdo posso criar por mês?",
    a: "Depende do plano. O PRAXIS Social permite 100 gerações/mês — mais do que suficiente para publicar diariamente. Planos superiores têm gerações ilimitadas.",
  },
]

const PASSOS_CALENDARIO = [
  { n: 1, titulo: "Informe sua especialidade e nicho",       desc: "A IA entende o contexto da sua audiência." },
  { n: 2, titulo: "Escolha temas ou use os sugeridos",       desc: "Radar de Tendências sugere o que está em alta." },
  { n: 3, titulo: "Gere 30 dias de calendário em segundos", desc: "Posts agendados por formato e frequência." },
  { n: 4, titulo: "Produza com os roteiros prontos",         desc: "Cada dia tem o roteiro e a legenda gerados." },
]

const FEATURES: FeatureItem[] = [
  { icon: Sparkles,     title: "Copiloto de Conteúdo",      desc: "Roteiro + legenda + hashtags em 2 minutos." },
  { icon: Calendar,     title: "Calendário Editorial",       desc: "30 dias de conteúdo gerados automaticamente." },
  { icon: Radar,        title: "Radar de Tendências",        desc: "Temas em alta antes de todo mundo." },
  { icon: Search,       title: "Análise de Concorrentes",    desc: "Veja o que funciona na sua especialidade." },
  { icon: FileText,     title: "Banco de Pautas",             desc: "Nunca fique sem ideia para postar." },
  { icon: Video,        title: "Gerador de Reels",            desc: "Roteiros prontos para gravar." },
  { icon: Images,       title: "Stories e Carrosséis",        desc: "Formatos que engajam." },
  { icon: MessageSquare,title: "Gerador de Legendas",         desc: "Textos que convertem." },
]

export default function PraxisSocialPage() {
  return (
    <ModulePageShell active="PRAXIS Social">
      <ModuleHero
        badge="15+ ferramentas de conteúdo"
        title="PRAXIS Social"
        accent={ACCENT}
        subtitle="Conteúdo estratégico que atrai pacientes particulares — gerado por IA, adaptado à sua especialidade."
      />

      <ProblemBlock color={ACCENT}>
        Médicos perdem horas criando conteúdo genérico que não converte seguidores em pacientes.
      </ProblemBlock>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <ModuleScreenshot
          src="/screenshots/crm.png"
          alt="PRAXIS Social — visão do funil de conteúdo e captação"
          caption="Conteúdo e captação conectados — cada post alimenta o funil de leads automaticamente."
          color={ACCENT}
          ctaLabel="Explorar PRAXIS Social"
          ctaHref="/cadastro"
        />
      </section>

      <FeatureGrid
        items={FEATURES}
        color={ACCENT}
        title="Tudo que você precisa para publicar com estratégia"
      />

      <ResultBanner color={ACCENT}>
        Médicos que usam o PRAXIS Social publicam consistentemente e com estratégia.
      </ResultBanner>

      {/* ── 30 DIAS EM 2 HORAS ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24 animate-fade-in">
        <div className="text-center mb-12">
          <SectionLabel color={ACCENT}>CALENDÁRIO EDITORIAL</SectionLabel>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 700, color: DARK }}>
            30 dias de conteúdo em 2 horas
          </h2>
          <p style={{ fontSize: 15, color: TEXT2, marginTop: 12, lineHeight: 1.7 }}>
            O Calendário Editorial gera um mês completo de posts — com tema, formato, roteiro e legenda.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {PASSOS_CALENDARIO.map(({ n, titulo, desc }) => (
            <div key={n} className="rounded-2xl p-6 relative" style={{ background: CARD, border: `1px solid ${ACCENT}20` }}>
              <div style={{ position: "absolute", top: 16, right: 16, fontSize: 32, fontWeight: 800, color: `${ACCENT}18`, fontFamily: "monospace" }}>{n}</div>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 14, fontWeight: 800, color: ACCENT }}>
                {n}
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 6, lineHeight: 1.3 }}>{titulo}</h3>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl p-6 text-center" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}25` }}>
          <p style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(16px, 2.5vw, 22px)", fontWeight: 600, color: DARK }}>
            Resultado: <span style={{ color: ACCENT }}>publicação consistente</span> sem improvisar todo dia
          </p>
        </div>
      </section>

      <ModuleFAQ items={FAQ_ITEMS} color={ACCENT} />

      <ModuleFinalCTA
        title="Pronto para parar de improvisar o conteúdo?"
        subtitle="Teste grátis por 7 dias. Nenhum cartão necessário."
        ctaLabel="Teste grátis por 7 dias"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
