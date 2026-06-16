import type { Metadata } from "next"
import { Bot, Check } from "lucide-react"
import {
  Users, Send, Stethoscope, Calculator, ClipboardList, Pill, Star, Gift,
} from "lucide-react"
import {
  ModulePageShell, ModuleHero, ModuleScreenshot,
  FeatureGrid, ModuleFinalCTA, ModuleFAQ, type FeatureItem, type FAQItem,
} from "@/components/modules/shared"
import { ProductMockup } from "@/components/ProductMockup"
import { GOLD, DARK } from "@/lib/module-tokens"

const ACCENT = GOLD

export const metadata: Metadata = {
  title: "PRAXIS Consultório — Converta leads em pacientes e fidelize quem já consulta",
  description:
    "CRM de Leads, nurturing automático via WhatsApp e Copiloto de Consulta com IA — converta mais leads em pacientes e documente consultas em segundos.",
  keywords: [
    "CRM médico", "CRM para clínicas", "copiloto de consulta", "prontuário com IA",
    "nurturing WhatsApp médico", "calculadoras clínicas", "protocolos clínicos", "PRAXIS Consultório",
  ],
  alternates: { canonical: "/praxis-consultorio" },
  openGraph: {
    title: "PRAXIS Consultório — Converta leads em pacientes e fidelize quem já consulta",
    description: "CRM + IA Clínica para converter mais leads e documentar consultas em segundos.",
    url: "/praxis-consultorio",
    type: "website",
  },
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "O Copiloto substitui o prontuário eletrônico?",
    a: "Não substitui — complementa. O Copiloto gera a documentação estruturada (SOAP, plano, orientações) que você cola ou exporta para o seu sistema de prontuário atual. Ele elimina o tempo de digitação, não a ferramenta.",
  },
  {
    q: "Funciona com qualquer especialidade médica?",
    a: "Sim. A IA é instruída com o contexto da sua especialidade ao configurar o perfil. Usada por endocrinologistas, dermatologistas, clínicos gerais, nutrologistas, ginecologistas e mais de 25 especialidades.",
  },
  {
    q: "Os dados dos pacientes são seguros?",
    a: "Sim. O PRAXIS usa Supabase com Row Level Security — seus dados são isolados por usuário. Nenhuma informação clínica é usada para treinar modelos de IA. Estamos em conformidade com a LGPD.",
  },
  {
    q: "O CRM substitui minha secretária?",
    a: "Não substitui — automatiza a parte repetitiva. O nurturing via WhatsApp e o acompanhamento de leads são automáticos. Sua secretária foca no que exige toque humano.",
  },
]

const FEATURES: FeatureItem[] = [
  { icon: Users,        title: "CRM de Leads",            desc: "Funil visual do lead ao paciente ativo." },
  { icon: Send,         title: "Nurturing Automático",     desc: "WhatsApp automático D+1, D+3, D+7." },
  { icon: Stethoscope,  title: "Copiloto de Consulta",      desc: "Prontuário + follow-up em segundos." },
  { icon: Calculator,   title: "Calculadoras Clínicas",     desc: "HOMA-IR, IMC, GLP-1 e mais 15 calculadoras." },
  { icon: ClipboardList,title: "Protocolos Clínicos",       desc: "Obesidade, DM2, Menopausa e mais 20 protocolos." },
  { icon: Pill,         title: "Prescrição Assistida",      desc: "Sugestões de medicamentos com doses e titulação." },
  { icon: Star,         title: "Pesquisa NPS",              desc: "Satisfação automatizada após cada consulta." },
  { icon: Gift,         title: "Programa de Indicações",    desc: "Member Get Member automatizado." },
]

export default function PraxisConsultorioPage() {
  return (
    <ModulePageShell active="PRAXIS Consultório">
      <ModuleHero
        badge="CRM + IA Clínica"
        title="PRAXIS Consultório"
        accent={ACCENT}
        subtitle="Converta leads em pacientes e fidelize quem já consulta — funil de vendas e IA clínica em uma só plataforma."
      />

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <ModuleScreenshot
          src="/screenshots/crm.png"
          alt="PRAXIS Consultório — funil Kanban do CRM de Leads"
          caption="Funil Kanban visual — do primeiro contato ao paciente fiel com nurturing automático."
          color={ACCENT}
          ctaLabel="Explorar o CRM"
          ctaHref="/cadastro"
        />
      </section>

      <FeatureGrid
        items={FEATURES}
        color={ACCENT}
        title="Do primeiro contato ao paciente fidelizado"
      />

      {/* ── DIFERENCIAL DO COPILOTO ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24 animate-fade-in">
        <div className="rounded-2xl overflow-hidden" style={{ background: DARK, border: `1px solid ${GOLD}20` }}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 md:p-14">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}30` }}>
                  <Bot style={{ width: 18, height: 18, color: GOLD }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", textTransform: "uppercase" }}>
                  O recurso que nenhuma outra plataforma tem
                </span>
              </div>
              <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 700, color: "#F5F0E8", marginBottom: 12, lineHeight: 1.25 }}>
                Copiloto de Consulta — sua IA clínica
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
            <div className="hidden lg:flex items-center justify-center p-10" style={{ borderLeft: `1px solid ${GOLD}15` }}>
              <div style={{ width: "100%", maxWidth: 320, height: 340 }}>
                <ProductMockup id={3} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ModuleFAQ items={FAQ_ITEMS} color={ACCENT} />

      <ModuleFinalCTA
        title="Pronto para converter mais leads em pacientes?"
        subtitle="Teste grátis por 7 dias. Nenhum cartão necessário."
        ctaLabel="Teste grátis por 7 dias"
        ctaHref="/cadastro"
      />
    </ModulePageShell>
  )
}
