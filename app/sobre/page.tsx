import Link from "next/link"
import { Panel, PxButton } from "@/components/px"

export const metadata = {
  title: "Sobre o PRAXIS",
  description: "Por que o PRAXIS foi criado e como ele se diferencia de agências, IA genérica e CRMs comuns.",
  alternates: { canonical: "/sobre" },
}

const ALTERNATIVES = [
  { label: "Agências de marketing", issues: [
    "Custo mensal elevado",
    "Nem sempre conhecem a linguagem clínica e as regras do CFM",
    "Aprovação de conteúdo costuma ser lenta",
    "O resultado depende de uma pessoa, não de um sistema",
  ] },
  { label: "ChatGPT e IA genérica", issues: [
    "Sem contexto clínico, as respostas ficam genéricas",
    "Sem integração com CRM, agenda ou prontuário",
    "Cada conversa começa do zero, sem memória do médico",
    "Não é configurada para CFM, LGPD e linguagem médica brasileira",
  ] },
  { label: "CRMs comuns (HubSpot, RD Station)", issues: [
    "Pensados para vendas B2B, não para saúde",
    "Sem módulos clínicos nem IA médica",
    "Configuração complexa e curva de aprendizado longa",
    "Sem integração com sistemas médicos como o MedX",
  ] },
  { label: "Plataformas de marketing médico", issues: [
    "Focam só em conteúdo, sem CRM nem gestão clínica",
    "Modelos genéricos que não se adaptam à especialidade",
    "São editores, não assistentes com contexto clínico",
    "Dados que não conversam entre módulos",
  ] },
]

const DIFERENCIAIS = [
  { titulo: "Construído por um médico", desc: "O PRAXIS nasceu de uma frustração comum entre médicos: as ferramentas existentes eram genéricas, caras ou não entendiam a realidade da medicina brasileira. Cada módulo foi projetado a partir de necessidades clínicas reais." },
  { titulo: "IA configurada para medicina", desc: "O sistema usa contexto clínico, com CFM, linguagem médica e especialidades brasileiras. Cada resposta é gerada com esse contexto embutido, e todo conteúdo deve ser revisado pelo médico antes de usar." },
  { titulo: "Tudo integrado, não fragmentado", desc: "O lead captado via conteúdo vai direto ao CRM. O CRM alimenta o nurturing por WhatsApp. A consulta alimenta o follow-up. Os dados do financeiro aparecem no painel. Um sistema no lugar de várias ferramentas." },
  { titulo: "Gestão clínica, não só marketing", desc: "Além do conteúdo, o PRAXIS cobre a operação: agenda, pacientes, protocolos, prescrição, NPS e financeiro, no mesmo lugar." },
  { titulo: "Privacidade por padrão", desc: "O Supabase com Row Level Security garante que cada médico veja apenas os próprios dados. Detalhes de coleta e uso estão na Política de Privacidade." },
]

const TECH_STACK = [
  { label: "Next.js 14", desc: "App Router, renderização no servidor" },
  { label: "TypeScript", desc: "Tipagem estática em todo o código" },
  { label: "Supabase", desc: "PostgreSQL, autenticação e RLS" },
  { label: "Claude (Anthropic)", desc: "Modelo de IA usado nas ferramentas" },
  { label: "Vercel", desc: "Hospedagem com deploy contínuo" },
  { label: "Stripe", desc: "Pagamentos; o PRAXIS não armazena dados de cartão" },
]

const PRINCIPIOS = [
  { t: "Medicina primeiro", d: "Cada decisão de produto parte de uma necessidade clínica real. Se não resolve um problema do médico, não entra no PRAXIS." },
  { t: "Simplicidade sem superficialidade", d: "A interface é simples, mas as funcionalidades são profundas. Médico não tem tempo para curva de aprendizado longa." },
  { t: "Seus dados são seus", d: "Os dados clínicos pertencem a você. O que é coletado, como é usado e como excluir está na Política de Privacidade." },
  { t: "Resultado mensurável", d: "Cada módulo tem um resultado esperado claro. Marketing sem métrica não serve, e gestão sem indicador não escala." },
]

export default function SobrePage() {
  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <header className="px-glass sticky top-0 z-10 flex h-16 items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-[15px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</Link>
        <nav aria-label="Principal" className="flex items-center gap-4 text-[13px]">
          <Link href="/" className="hidden text-px-muted underline-offset-2 hover:underline md:block">Início</Link>
          <Link href="/planos" className="hidden text-px-muted underline-offset-2 hover:underline md:block">Planos</Link>
          <PxButton size="sm" href="/planos">Ver planos</PxButton>
        </nav>
      </header>

      <main className="relative mx-auto max-w-4xl space-y-16 px-6 pb-20 pt-16">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-[clamp(28px,5vw,46px)] font-semibold leading-tight text-px-ink">Por que o PRAXIS existe</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-px-muted">Uma plataforma construída a partir de uma frustração real e da convicção de que médicos merecem ferramentas melhores.</p>
        </section>

        <section className="mx-auto max-w-2xl">
          <Panel tone="dark" as="article" className="space-y-4 !p-8">
            <p className="text-[14px] font-semibold">Dr. Bruno Gustavo</p>
            <p className="-mt-3 text-[12.5px] opacity-75">Médico e fundador do PRAXIS</p>
            <blockquote className="space-y-4 border-l-2 border-white/40 pl-5 text-[15px] italic leading-relaxed">
              <p>&ldquo;Construí o PRAXIS para resolver problemas que enfrentei na prática: perder oportunidades por falta de acompanhamento, gastar horas com marketing sem previsibilidade e administrar a clínica sem indicadores claros.</p>
              <p>Quando percebi que esses desafios eram comuns entre médicos empreendedores, decidi transformar a solução que funcionou para mim em uma plataforma completa.&rdquo;</p>
            </blockquote>
          </Panel>
        </section>

        <section aria-labelledby="alt">
          <h2 id="alt" className="mb-6 text-center text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">Onde as alternativas costumam falhar</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {ALTERNATIVES.map(a => (
              <Panel as="article" key={a.label} className="h-full space-y-3">
                <h3 className="text-[15px] font-semibold text-px-ink">{a.label}</h3>
                <ul className="list-disc space-y-2 pl-5 text-[13.5px] leading-relaxed text-px-muted">
                  {a.issues.map(i => <li key={i}>{i}</li>)}
                </ul>
              </Panel>
            ))}
          </div>
        </section>

        <section aria-labelledby="dif">
          <h2 id="dif" className="mb-6 text-center text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">O que diferencia o PRAXIS</h2>
          <div className="space-y-3">
            {DIFERENCIAIS.map(d => (
              <Panel as="article" key={d.titulo} className="space-y-1">
                <h3 className="text-[16px] font-semibold text-px-ink">{d.titulo}</h3>
                <p className="text-[14px] leading-relaxed text-px-muted">{d.desc}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section aria-labelledby="tec">
          <h2 id="tec" className="mb-6 text-center text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">Tecnologia</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {TECH_STACK.map(t => (
              <Panel as="article" key={t.label} className="space-y-1">
                <p className="font-mono text-[14px] font-semibold text-px-ink">{t.label}</p>
                <p className="text-[12.5px] leading-relaxed text-px-muted">{t.desc}</p>
              </Panel>
            ))}
          </div>
        </section>

        <section aria-labelledby="pri" className="mx-auto max-w-2xl">
          <Panel as="section" className="space-y-5">
            <h2 id="pri" className="text-[clamp(20px,3vw,28px)] font-semibold text-px-ink">O que guia o desenvolvimento</h2>
            <dl className="space-y-4">
              {PRINCIPIOS.map(p => (
                <div key={p.t}>
                  <dt className="text-[14px] font-semibold text-px-ink">{p.t}</dt>
                  <dd className="text-[13.5px] leading-relaxed text-px-muted">{p.d}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </section>

        <section className="mx-auto max-w-2xl text-center">
          <Panel tone="dark" as="section" className="space-y-4 !p-10">
            <h2 className="text-[clamp(22px,3.5vw,32px)] font-semibold">Veja como funciona na sua clínica</h2>
            <p className="text-[14.5px] opacity-80">Os planos e as condições do período de teste estão na página de planos.</p>
            <div><PxButton variant="inverse" href="/planos">Ver planos</PxButton></div>
          </Panel>
        </section>
      </main>

      <footer className="relative border-t border-px-line px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 text-[12.5px] text-px-muted md:flex-row">
          <span className="font-semibold tracking-[0.2em] text-px-ink">PRAXIS</span>
          <nav aria-label="Rodapé" className="flex gap-5">
            <Link href="/">Início</Link><Link href="/planos">Planos</Link><Link href="/termos">Termos</Link><Link href="/privacidade">Privacidade</Link>
          </nav>
          <span>© {new Date().getFullYear()} PRAXIS</span>
        </div>
      </footer>
    </div>
  )
}
