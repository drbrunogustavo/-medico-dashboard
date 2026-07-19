"use client"

import { useState } from "react"
import { Search, Star, ExternalLink, Filter, Tag, Zap, Gift } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface Parceiro {
  id:          string
  nome:        string
  descricao:   string
  categoria:   string
  avaliacao:   number
  preco:       string
  beneficio:   string
  destaque:    boolean
  link:        string
  iniciais:    string
  cor:         string
}

const PARCEIROS: Parceiro[] = [
  // Tráfego Pago
  {
    id: "1", nome: "Traffic Med",
    descricao: "Especialistas em tráfego pago para médicos e clínicas: Google Ads, Meta Ads e estratégia de captação de pacientes.",
    categoria: "Tráfego Pago", avaliacao: 4.9, preco: "A partir de R$ 800/mês",
    beneficio: "Auditoria gratuita de conta + 1 mês sem taxa de gestão", destaque: true,
    link: "#", iniciais: "TM", cor: "bg-blue-100 text-blue-700",
  },
  {
    id: "2", nome: "MedAds Agency",
    descricao: "Agência especializada em performance para saúde. ROI médio de 8x para clínicas parceiras.",
    categoria: "Tráfego Pago", avaliacao: 4.7, preco: "A partir de R$ 600/mês",
    beneficio: "Setup gratuito para membros PRAXIS", destaque: false,
    link: "#", iniciais: "MA", cor: "bg-indigo-100 text-indigo-700",
  },
  // Design
  {
    id: "3", nome: "Estúdio Clínica Visual",
    descricao: "Design gráfico para médicos: identidade visual, templates de posts, materiais de sala de espera e embalagens.",
    categoria: "Design", avaliacao: 4.8, preco: "A partir de R$ 290/mês",
    beneficio: "Kit de identidade médica gratuito no 1º mês", destaque: true,
    link: "#", iniciais: "CV", cor: "bg-pink-100 text-pink-700",
  },
  {
    id: "4", nome: "Canva for Teams",
    descricao: "Design profissional para médicos: templates de posts, carrosséis, stories e materiais impressos.",
    categoria: "Design", avaliacao: 4.6, preco: "R$ 55/mês",
    beneficio: "2 meses grátis no plano anual via PRAXIS", destaque: false,
    link: "#", iniciais: "CF", cor: "bg-purple-100 text-purple-700",
  },
  // Edição de Vídeos
  {
    id: "5", nome: "ReelMed Studio",
    descricao: "Edição de Reels médicos e educativos. Entrega em 48h, corte profissional e legendas automáticas.",
    categoria: "Edição de Vídeos", avaliacao: 4.9, preco: "A partir de R$ 120/vídeo",
    beneficio: "5 Reels no 1º mês por R$ 350 (economia de R$ 250)", destaque: true,
    link: "#", iniciais: "RS", cor: "bg-red-100 text-red-700",
  },
  {
    id: "6", nome: "CapCut Business",
    descricao: "Plataforma de edição de vídeo com IA: remoção de fundo, transcrição automática e templates virais.",
    categoria: "Edição de Vídeos", avaliacao: 4.5, preco: "R$ 45/mês",
    beneficio: "3 meses do plano Pro por R$ 79 (50% off)", destaque: false,
    link: "#", iniciais: "CC", cor: "bg-black/10 text-gray-700",
  },
  // Secretária Virtual
  {
    id: "7", nome: "SecMed — Secretária Virtual",
    descricao: "Atendimento humanizado 24/7 para sua clínica: agendamentos, confirmações e primeira triagem de pacientes.",
    categoria: "Secretária Virtual", avaliacao: 4.8, preco: "A partir de R$ 350/mês",
    beneficio: "1 mês grátis + integração com seu sistema atual", destaque: true,
    link: "#", iniciais: "SM", cor: "bg-green-100 text-green-700",
  },
  {
    id: "8", nome: "DoutorBot",
    descricao: "Chatbot inteligente para WhatsApp: agenda consultas, responde dúvidas frequentes e qualifica pacientes.",
    categoria: "Secretária Virtual", avaliacao: 4.6, preco: "R$ 197/mês",
    beneficio: "Setup gratuito + 30 dias de trial sem cartão", destaque: false,
    link: "#", iniciais: "DB", cor: "bg-emerald-100 text-emerald-700",
  },
  // Fotografia Médica
  {
    id: "9", nome: "Med Photo Studio",
    descricao: "Fotografia profissional para médicos: fotos de perfil, clínica e conteúdo editorial para redes sociais.",
    categoria: "Fotografia Médica", avaliacao: 4.9, preco: "A partir de R$ 490/sessão",
    beneficio: "Sessão completa + edição por R$ 390 para membros PRAXIS", destaque: true,
    link: "#", iniciais: "MP", cor: "bg-amber-100 text-amber-700",
  },
  // Gestão Financeira
  {
    id: "10", nome: "FinMed — Gestão Clínica",
    descricao: "Controle financeiro completo para médicos: faturamento, DRE, fluxo de caixa e relatórios de rentabilidade.",
    categoria: "Gestão Financeira", avaliacao: 4.7, preco: "A partir de R$ 149/mês",
    beneficio: "3 meses grátis + consultoria de onboarding inclusa", destaque: true,
    link: "#", iniciais: "FM", cor: "bg-blue-100 text-blue-700",
  },
  {
    id: "11", nome: "Conta Simples PJ",
    descricao: "Conta PJ digital com Pix gratuito, cartão virtual e relatórios de gastos por categoria.",
    categoria: "Gestão Financeira", avaliacao: 4.4, preco: "Sem mensalidade",
    beneficio: "R$ 150 de cashback na abertura via PRAXIS", destaque: false,
    link: "#", iniciais: "CS", cor: "bg-green-100 text-green-700",
  },
  // Jurídico Médico
  {
    id: "12", nome: "MedLegal",
    descricao: "Assessoria jurídica especializada em direito médico: contratos, LGPD, defesa no CRM e questões éticas.",
    categoria: "Jurídico Médico", avaliacao: 4.8, preco: "Consulta inicial grátis",
    beneficio: "1ª hora de consultoria gratuita + desconto de 20% em contratos", destaque: true,
    link: "#", iniciais: "ML", cor: "bg-gray-100 text-gray-700",
  },
  // Tecnologia
  {
    id: "13", nome: "iClinic",
    descricao: "Prontuário eletrônico completo com prescrição digital, telemedicina e gestão de agenda integrada.",
    categoria: "Tecnologia", avaliacao: 4.7, preco: "A partir de R$ 199/mês",
    beneficio: "15% de desconto permanente com código PRAXIS15", destaque: false,
    link: "#", iniciais: "IC", cor: "bg-blue-100 text-blue-700",
  },
  {
    id: "14", nome: "Conexa Saúde",
    descricao: "Plataforma líder em telemedicina no Brasil. Conformidade CFM, prontuário e assinatura digital.",
    categoria: "Tecnologia", avaliacao: 4.9, preco: "R$ 0,90/min de consulta",
    beneficio: "Setup gratuito + 50 consultas grátis para novos parceiros", destaque: false,
    link: "#", iniciais: "CS", cor: "bg-purple-100 text-purple-700",
  },
]

const CATEGORIAS_ORDEM = [
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
const CATEGORIAS = CATEGORIAS_ORDEM

// ─── Helpers ──────────────────────────────────────────────────────────────────

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={cn("w-3 h-3", i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-border fill-border")} />
      ))}
      <span className="text-[10px] font-mono text-text-muted ml-1">{value}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [busca,      setBusca]      = useState("")
  const [categoria,  setCategoria]  = useState("Todas")
  const [soDestaque, setSoDestaque] = useState(false)

  const filtrados = PARCEIROS.filter(p => {
    const q = busca.toLowerCase()
    const matchBusca = !q || p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
    const matchCat   = categoria === "Todas" || p.categoria === categoria
    const matchDest  = !soDestaque || p.destaque
    return matchBusca && matchCat && matchDest
  })

  const destaques = filtrados.filter(p => p.destaque)
  const outros    = filtrados.filter(p => !p.destaque)

  return (
    <div className="animate-fade-in">
      <MobileOnlyHeader title="Marketplace PRAXIS" />
      {/* Top banner */}
      <div className="bg-accent text-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold tracking-tight">Marketplace PRAXIS</h1>
            <p className="text-[11px] opacity-80 mt-0.5">Parceiros selecionados para médicos com benefícios exclusivos</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold">{PARCEIROS.length}</p>
            <p className="text-[10px] opacity-80 font-mono">PARCEIROS</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar parceiros…"
              className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIAS.map(c => (
              <button key={c} onClick={() => setCategoria(c)}
                className={cn(
                  "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                  categoria === c
                    ? "bg-accent-dim border-accent-border text-accent font-semibold"
                    : "border-border text-text-muted hover:text-text-secondary"
                )}>
                {c}
              </button>
            ))}

            <button onClick={() => setSoDestaque(v => !v)}
              className={cn(
                "text-[11px] px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5",
                soDestaque
                  ? "bg-amber-50 border-amber-200 text-amber-700 font-semibold"
                  : "border-border text-text-muted hover:text-text-secondary"
              )}>
              <Zap className="w-3 h-3" />
              Em destaque
            </button>
          </div>
        </div>

        {/* Destaques */}
        {destaques.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" />
              <h2 className="text-[13px] font-semibold text-text-primary">Parceiros em Destaque</h2>
              <span className="text-[10px] font-mono text-text-muted ml-auto">{destaques.length} parceiros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {destaques.map(p => <ParceiroCard key={p.id} parceiro={p} />)}
            </div>
          </section>
        )}

        {/* Outros */}
        {outros.length > 0 && (
          <section>
            {destaques.length > 0 && (
              <h2 className="text-[13px] font-semibold text-text-primary mb-4">Todos os Parceiros</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {outros.map(p => <ParceiroCard key={p.id} parceiro={p} />)}
            </div>
          </section>
        )}

        {filtrados.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-12 text-center">
            <Search className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <p className="text-[14px] font-semibold text-text-primary mb-2">Nenhum parceiro encontrado</p>
            <p className="text-[12px] text-text-muted">Tente ajustar os filtros ou a busca</p>
          </div>
        )}

        {/* Banner parceria */}
        <div className="rounded-xl border border-accent-border bg-accent-dim p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold text-text-primary">Quer ser parceiro PRAXIS?</p>
            <p className="text-[12px] text-text-muted mt-0.5">
              Conectamos sua empresa a milhares de médicos empreendedores em todo o Brasil.
            </p>
          </div>
          <a href="mailto:parcerias@praxis.med.br"
            className="flex-shrink-0 flex items-center gap-2 bg-accent text-white text-[12px] font-semibold px-5 py-2.5 rounded-lg hover:bg-accent/90 transition-all whitespace-nowrap">
            <ExternalLink className="w-3.5 h-3.5" />
            Entre em contato
          </a>
        </div>
      </div>
    </div>
  )
}

function ParceiroCard({ parceiro: p }: { parceiro: Parceiro }) {
  return (
    <div className={cn(
      "rounded-xl border bg-surface flex flex-col transition-all hover:shadow-sm",
      p.destaque ? "border-amber-200" : "border-border"
    )}>
      {/* Card top */}
      <div className="flex items-start gap-3.5 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-bold flex-shrink-0", p.cor)}>
          {p.iniciais}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-[13px] font-semibold text-text-primary leading-snug">{p.nome}</h3>
            {p.destaque && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 flex-shrink-0 whitespace-nowrap">
                <Star className="inline-block align-[-0.15em] w-2.5 h-2.5 mr-0.5 fill-current" /> Recomendado PRAXIS
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">{p.categoria}</p>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-[12px] text-text-secondary leading-relaxed">{p.descricao}</p>
      </div>

      {/* Rating */}
      <div className="px-4 pb-3">
        <RatingStars value={p.avaliacao} />
      </div>

      {/* Pricing + benefit */}
      <div className="px-4 pb-4 space-y-2 flex-1">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-text-muted flex-shrink-0" />
          <span className="text-[11px] text-text-secondary">{p.preco}</span>
        </div>
        <div className="rounded-lg bg-accent-dim border border-accent-border px-2.5 py-1.5">
          <p className="text-[10px] text-accent font-medium leading-snug"><Gift className="inline-block align-[-0.15em] w-3 h-3 mr-1" /> {p.beneficio}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 pt-0">
        <a href={p.link}
          className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold bg-text-primary text-surface rounded-lg py-2.5 hover:opacity-80 transition-opacity">
          Conhecer
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}
