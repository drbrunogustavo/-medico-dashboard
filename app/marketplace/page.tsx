"use client"

import { useState } from "react"
import { Search, Star, ExternalLink, Filter, Tag, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

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
  // Tecnologia médica
  {
    id: "1", nome: "Doctoralia Pro",
    descricao: "Plataforma de agendamento online com perfil médico, avaliações e prontuário eletrônico integrado.",
    categoria: "Agendamento", avaliacao: 4.8, preco: "A partir de R$ 149/mês",
    beneficio: "30 dias grátis para usuários PRAXIS", destaque: true,
    link: "#", iniciais: "DP", cor: "bg-blue-100 text-blue-700",
  },
  {
    id: "2", nome: "iClinic",
    descricao: "Prontuário eletrônico completo com prescrição digital, telemedicina e gestão financeira.",
    categoria: "Prontuário", avaliacao: 4.7, preco: "A partir de R$ 199/mês",
    beneficio: "15% de desconto com código PRAXIS15", destaque: false,
    link: "#", iniciais: "IC", cor: "bg-green-100 text-green-700",
  },
  {
    id: "3", nome: "Conexa Saúde",
    descricao: "Plataforma de telemedicina líder no Brasil. Consultas online com segurança e conformidade CFM.",
    categoria: "Telemedicina", avaliacao: 4.9, preco: "R$ 0,90/min de consulta",
    beneficio: "Setup gratuito + 50 consultas grátis", destaque: true,
    link: "#", iniciais: "CS", cor: "bg-purple-100 text-purple-700",
  },
  // Marketing e conteúdo
  {
    id: "4", nome: "Canva for Teams",
    descricao: "Design profissional para médicos: templates de posts, stories, carrosséis e materiais de sala.",
    categoria: "Design", avaliacao: 4.6, preco: "R$ 55/mês",
    beneficio: "2 meses grátis no plano anual", destaque: false,
    link: "#", iniciais: "CV", cor: "bg-pink-100 text-pink-700",
  },
  {
    id: "5", nome: "Later — Agendamento Social",
    descricao: "Agende posts no Instagram, Facebook e TikTok com prévia do feed. Integra com o Calendário PRAXIS.",
    categoria: "Redes Sociais", avaliacao: 4.5, preco: "A partir de R$ 89/mês",
    beneficio: "Plano Starter gratuito por 90 dias", destaque: false,
    link: "#", iniciais: "LT", cor: "bg-indigo-100 text-indigo-700",
  },
  // Educação e certificações
  {
    id: "6", nome: "Medscape Courses",
    descricao: "Cursos de atualização médica certificados, artigos e guidelines das principais especialidades.",
    categoria: "Educação", avaliacao: 4.9, preco: "Grátis (acesso básico)",
    beneficio: "Acesso Premium com desconto de 40%", destaque: true,
    link: "#", iniciais: "MC", cor: "bg-amber-100 text-amber-700",
  },
  {
    id: "7", nome: "Afya Cursos",
    descricao: "Pós-graduações e especializações médicas online homologadas por universidades parceiras.",
    categoria: "Educação", avaliacao: 4.7, preco: "Varia por curso",
    beneficio: "20% de desconto em qualquer pós-graduação", destaque: false,
    link: "#", iniciais: "AF", cor: "bg-orange-100 text-orange-700",
  },
  // Financeiro
  {
    id: "8", nome: "Conta Stone para Médicos",
    descricao: "Conta PJ com maquininha sem aluguel, Pix gratuito e integração com sistemas de cobrança.",
    categoria: "Financeiro", avaliacao: 4.4, preco: "Sem mensalidade",
    beneficio: "R$ 200 de crédito na abertura via PRAXIS", destaque: false,
    link: "#", iniciais: "ST", cor: "bg-green-100 text-green-700",
  },
  {
    id: "9", nome: "Omie Gestão",
    descricao: "ERP completo para clínicas: faturamento, NF-e, contas a receber, folha de pagamento.",
    categoria: "Financeiro", avaliacao: 4.6, preco: "A partir de R$ 99/mês",
    beneficio: "3 meses grátis + implementação sem custo", destaque: false,
    link: "#", iniciais: "OM", cor: "bg-blue-100 text-blue-700",
  },
  // Equipamentos e suprimentos
  {
    id: "10", nome: "Saúde Mais",
    descricao: "Maior marketplace de equipamentos médicos, materiais descartáveis e mobiliário clínico.",
    categoria: "Equipamentos", avaliacao: 4.3, preco: "Catálogo aberto",
    beneficio: "Frete grátis acima de R$ 500 + parcelamento 12x", destaque: false,
    link: "#", iniciais: "SM", cor: "bg-red-100 text-red-700",
  },
  // Jurídico e compliance
  {
    id: "11", nome: "MedLegal",
    descricao: "Assessoria jurídica especializada em direito médico, contratos, LGPD e defesa no CRM.",
    categoria: "Jurídico", avaliacao: 4.8, preco: "Consulta inicial grátis",
    beneficio: "1ª hora de consultoria gratuita para membros PRAXIS", destaque: false,
    link: "#", iniciais: "ML", cor: "bg-gray-100 text-gray-700",
  },
  // Seguros
  {
    id: "12", nome: "Tokio Marine — Seguro Médico",
    descricao: "Responsabilidade civil médica, seguro de vida e plano de saúde corporativo para clínicas.",
    categoria: "Seguros", avaliacao: 4.7, preco: "Cotação personalizada",
    beneficio: "Cotação gratuita com análise de risco inclusa", destaque: false,
    link: "#", iniciais: "TM", cor: "bg-yellow-100 text-yellow-700",
  },
]

const CATEGORIAS = ["Todas", ...Array.from(new Set(PARCEIROS.map(p => p.categoria)))]

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

      <div className="p-8 space-y-6">
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
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 flex-shrink-0">
                DESTAQUE
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
          <p className="text-[10px] text-accent font-medium leading-snug">🎁 {p.beneficio}</p>
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
