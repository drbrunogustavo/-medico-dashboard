"use client"

import { useState } from "react"
import { ExternalLink, Gift, Star } from "lucide-react"
import { Panel, PxButton, Segmented, PxInput, Tag, PageHeader } from "@/components/px"

// ─── Dados ────────────────────────────────────────────────────────────────────

interface Parceiro {
  id:        string
  nome:      string
  descricao: string
  categoria: string
  avaliacao: number
  preco:     string
  beneficio: string
  destaque:  boolean
  link:      string
  iniciais:  string
}

const PARCEIROS: Parceiro[] = [
  // Tráfego Pago
  {
    id: "1", nome: "Traffic Med",
    descricao: "Especialistas em tráfego pago para médicos e clínicas: Google Ads, Meta Ads e estratégia de captação de pacientes.",
    categoria: "Tráfego Pago", avaliacao: 4.9, preco: "A partir de R$ 800/mês",
    beneficio: "Auditoria gratuita de conta + 1 mês sem taxa de gestão", destaque: true,
    link: "#", iniciais: "TM",
  },
  {
    id: "2", nome: "MedAds Agency",
    descricao: "Agência especializada em performance para saúde. ROI médio de 8x para clínicas parceiras.",
    categoria: "Tráfego Pago", avaliacao: 4.7, preco: "A partir de R$ 600/mês",
    beneficio: "Setup gratuito para membros PRAXIS", destaque: false,
    link: "#", iniciais: "MA",
  },
  // Design
  {
    id: "3", nome: "Estúdio Clínica Visual",
    descricao: "Design gráfico para médicos: identidade visual, templates de posts, materiais de sala de espera e embalagens.",
    categoria: "Design", avaliacao: 4.8, preco: "A partir de R$ 290/mês",
    beneficio: "Kit de identidade médica gratuito no 1º mês", destaque: true,
    link: "#", iniciais: "CV",
  },
  {
    id: "4", nome: "Canva for Teams",
    descricao: "Design profissional para médicos: templates de posts, carrosséis, stories e materiais impressos.",
    categoria: "Design", avaliacao: 4.6, preco: "R$ 55/mês",
    beneficio: "2 meses grátis no plano anual via PRAXIS", destaque: false,
    link: "#", iniciais: "CF",
  },
  // Edição de Vídeos
  {
    id: "5", nome: "ReelMed Studio",
    descricao: "Edição de Reels médicos e educativos. Entrega em 48h, corte profissional e legendas automáticas.",
    categoria: "Edição de Vídeos", avaliacao: 4.9, preco: "A partir de R$ 120/vídeo",
    beneficio: "5 Reels no 1º mês por R$ 350 (economia de R$ 250)", destaque: true,
    link: "#", iniciais: "RS",
  },
  {
    id: "6", nome: "CapCut Business",
    descricao: "Plataforma de edição de vídeo com IA: remoção de fundo, transcrição automática e templates virais.",
    categoria: "Edição de Vídeos", avaliacao: 4.5, preco: "R$ 45/mês",
    beneficio: "3 meses do plano Pro por R$ 79 (50% off)", destaque: false,
    link: "#", iniciais: "CC",
  },
  // Secretária Virtual
  {
    id: "7", nome: "SecMed: Secretária Virtual",
    descricao: "Atendimento humanizado 24/7 para sua clínica: agendamentos, confirmações e primeira triagem de pacientes.",
    categoria: "Secretária Virtual", avaliacao: 4.8, preco: "A partir de R$ 350/mês",
    beneficio: "1 mês grátis + integração com seu sistema atual", destaque: true,
    link: "#", iniciais: "SM",
  },
  {
    id: "8", nome: "DoutorBot",
    descricao: "Chatbot inteligente para WhatsApp: agenda consultas, responde dúvidas frequentes e qualifica pacientes.",
    categoria: "Secretária Virtual", avaliacao: 4.6, preco: "R$ 197/mês",
    beneficio: "Setup gratuito + 30 dias de trial sem cartão", destaque: false,
    link: "#", iniciais: "DB",
  },
  // Fotografia Médica
  {
    id: "9", nome: "Med Photo Studio",
    descricao: "Fotografia profissional para médicos: fotos de perfil, clínica e conteúdo editorial para redes sociais.",
    categoria: "Fotografia Médica", avaliacao: 4.9, preco: "A partir de R$ 490/sessão",
    beneficio: "Sessão completa + edição por R$ 390 para membros PRAXIS", destaque: true,
    link: "#", iniciais: "MP",
  },
  // Gestão Financeira
  {
    id: "10", nome: "FinMed: Gestão Clínica",
    descricao: "Controle financeiro completo para médicos: faturamento, DRE, fluxo de caixa e relatórios de rentabilidade.",
    categoria: "Gestão Financeira", avaliacao: 4.7, preco: "A partir de R$ 149/mês",
    beneficio: "3 meses grátis + consultoria de onboarding inclusa", destaque: true,
    link: "#", iniciais: "FM",
  },
  {
    id: "11", nome: "Conta Simples PJ",
    descricao: "Conta PJ digital com Pix gratuito, cartão virtual e relatórios de gastos por categoria.",
    categoria: "Gestão Financeira", avaliacao: 4.4, preco: "Sem mensalidade",
    beneficio: "R$ 150 de cashback na abertura via PRAXIS", destaque: false,
    link: "#", iniciais: "CS",
  },
  // Jurídico Médico
  {
    id: "12", nome: "MedLegal",
    descricao: "Assessoria jurídica especializada em direito médico: contratos, LGPD, defesa no CRM e questões éticas.",
    categoria: "Jurídico Médico", avaliacao: 4.8, preco: "Consulta inicial grátis",
    beneficio: "1ª hora de consultoria gratuita + desconto de 20% em contratos", destaque: true,
    link: "#", iniciais: "ML",
  },
  // Tecnologia
  {
    id: "13", nome: "iClinic",
    descricao: "Prontuário eletrônico completo com prescrição digital, telemedicina e gestão de agenda integrada.",
    categoria: "Tecnologia", avaliacao: 4.7, preco: "A partir de R$ 199/mês",
    beneficio: "15% de desconto permanente com código PRAXIS15", destaque: false,
    link: "#", iniciais: "IC",
  },
  {
    id: "14", nome: "Conexa Saúde",
    descricao: "Plataforma líder em telemedicina no Brasil. Conformidade CFM, prontuário e assinatura digital.",
    categoria: "Tecnologia", avaliacao: 4.9, preco: "R$ 0,90/min de consulta",
    beneficio: "Setup gratuito + 50 consultas grátis para novos parceiros", destaque: false,
    link: "#", iniciais: "CS",
  },
]

const CATEGORIAS = [
  "Todas",
  "Tráfego Pago",
  "Design",
  "Edição de Vídeos",
  "Secretária Virtual",
  "Fotografia Médica",
  "Gestão Financeira",
  "Jurídico Médico",
  "Tecnologia",
]

const notaBR = (n: number) => n.toFixed(1).replace(".", ",")

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [busca,      setBusca]      = useState("")
  const [categoria,  setCategoria]  = useState("Todas")
  const [soDestaque, setSoDestaque] = useState(false)

  const filtrados = PARCEIROS.filter(p => {
    const q = busca.trim().toLowerCase()
    const matchBusca = !q || p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
    const matchCat   = categoria === "Todas" || p.categoria === categoria
    const matchDest  = !soDestaque || p.destaque
    return matchBusca && matchCat && matchDest
  })

  const destaques = filtrados.filter(p => p.destaque)
  const outros    = filtrados.filter(p => !p.destaque)

  function limpar() { setBusca(""); setCategoria("Todas"); setSoDestaque(false) }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Marketplace" caption={`${PARCEIROS.length} parceiros de exemplo`} />

      <div className="space-y-6 px-4 pb-10 md:px-10">
        <p role="note" className="rounded-px-card bg-px-ink/[0.05] px-4 py-3 text-[13px] text-px-ink/80">
          Os parceiros abaixo são exemplos para ilustrar o Marketplace. Nomes, preços e benefícios não são reais.
        </p>

        <div className="space-y-3">
          <PxInput
            type="search"
            aria-label="Buscar parceiro"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar parceiro"
            className="max-w-md"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Filtrar por categoria"
              value={categoria}
              onChange={setCategoria}
              options={CATEGORIAS.map(c => ({ value: c, label: c }))}
            />
            <button
              type="button"
              aria-pressed={soDestaque}
              onClick={() => setSoDestaque(v => !v)}
              className={`inline-flex h-9 items-center rounded-px-ctl border px-3.5 text-[12.5px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 ${
                soDestaque ? "border-px-ink bg-px-ink text-white" : "border-px-line bg-white/60 text-px-ink hover:bg-white/90"
              }`}
            >
              Só os em destaque
            </button>
          </div>
        </div>

        {destaques.length > 0 && (
          <section aria-labelledby="mk-dest">
            <h2 id="mk-dest" className="mb-3 text-[15px] font-semibold text-px-ink">
              Em destaque <span className="ml-1 text-[12.5px] font-normal text-px-muted">{destaques.length}</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {destaques.map(p => <ParceiroCard key={p.id} parceiro={p} />)}
            </div>
          </section>
        )}

        {outros.length > 0 && (
          <section aria-labelledby="mk-todos">
            <h2 id="mk-todos" className="mb-3 text-[15px] font-semibold text-px-ink">
              {destaques.length > 0 ? "Demais parceiros" : "Parceiros"} <span className="ml-1 text-[12.5px] font-normal text-px-muted">{outros.length}</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {outros.map(p => <ParceiroCard key={p.id} parceiro={p} />)}
            </div>
          </section>
        )}

        {filtrados.length === 0 && (
          <Panel className="py-12 text-center">
            <p className="text-[14px] font-semibold text-px-ink">Nenhum parceiro encontrado</p>
            <p className="mb-4 mt-1 text-[13px] text-px-muted">Tente outros termos ou limpe os filtros para ver todos os parceiros.</p>
            <PxButton variant="secondary" onClick={limpar}>Limpar filtros</PxButton>
          </Panel>
        )}

        <Panel className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[15px] font-semibold text-px-ink">Quer ser parceiro PRAXIS?</p>
            <p className="mt-0.5 text-[13px] text-px-muted">Apresente sua empresa para médicos que gerem a própria clínica.</p>
          </div>
          <a
            href="mailto:parcerias@praxis.med.br"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-px-ctl bg-px-ink px-5 text-[13.5px] font-semibold text-white hover:bg-px-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 focus-visible:ring-offset-2"
          >
            Entrar em contato <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Panel>
      </div>
    </div>
  )
}

function ParceiroCard({ parceiro: p }: { parceiro: Parceiro }) {
  const temLink = p.link && p.link !== "#"
  return (
    <Panel as="article" className="flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-px-ctl bg-px-ink/[0.07] text-[12.5px] font-semibold text-px-ink">
          {p.iniciais}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold leading-snug text-px-ink">{p.nome}</h3>
          <p className="mt-0.5 text-[12.5px] text-px-muted">{p.categoria}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Tag>Exemplo</Tag>
          {p.destaque && <Tag tone="ink">Em destaque</Tag>}
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-px-ink/80">{p.descricao}</p>

      <div className="flex items-center justify-between gap-3 text-[12.5px] text-px-muted">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-px-ink text-px-ink" aria-hidden="true" />
          <span className="font-medium text-px-ink"><span className="sr-only">Avaliação </span>{notaBR(p.avaliacao)}</span>
        </span>
        <span>{p.preco}</span>
      </div>

      <div className="flex flex-1 items-start gap-2 rounded-px-card bg-px-accent-soft px-3 py-2.5">
        <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-px-accent" aria-hidden="true" />
        <p className="text-[12.5px] font-medium leading-snug text-px-ink">{p.beneficio}</p>
      </div>

      {temLink ? (
        <a
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-px-ctl bg-px-ink text-[13.5px] font-semibold text-white hover:bg-px-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 focus-visible:ring-offset-2"
        >
          Conhecer {p.nome} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      ) : (
        <PxButton fullWidth variant="secondary" disabled aria-label={`${p.nome}: link em breve`}>Em breve</PxButton>
      )}
    </Panel>
  )
}
