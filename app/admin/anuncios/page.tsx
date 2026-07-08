"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, X, Trash2, Loader2, RefreshCw, ExternalLink, Mail, Phone, Calendar } from "lucide-react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

interface Anuncio {
  id: string
  created_at: string
  titulo: string
  chamada: string
  link_destino: string
  anunciante_nome: string
  anunciante_foto_url: string | null
  contato_email: string
  contato_telefone: string | null
  periodo_dias: number
  data_inicio: string | null
  data_fim: string | null
  status: "aguardando_pagamento" | "pendente" | "aprovado" | "rejeitado" | "expirado"
  tipo_produto: string | null
}

type Filtro = "pendente" | "aprovado" | "inativos" | "all"
const FILTRO_LABELS: Record<Filtro, string> = {
  pendente: "Pendentes",
  aprovado: "Aprovados",
  inativos: "Inativos",
  all:      "Todos",
}
const FILTRO_STATUS: Record<Filtro, string> = {
  pendente: "pendente,aguardando_pagamento",
  aprovado: "aprovado",
  inativos: "expirado,rejeitado",
  all:      "all",
}

const TIPOS_PRODUTO = [
  { value: "",            label: "Todos os tipos" },
  { value: "curso",       label: "🎓 Curso"        },
  { value: "livro",       label: "📚 Livro"        },
  { value: "equipamento", label: "🔬 Equipamento"  },
  { value: "suplemento",  label: "💊 Suplemento"   },
  { value: "mentoria",    label: "🤝 Mentoria"     },
  { value: "ferramenta",  label: "⚙️ Ferramenta"   },
]

export default function AdminAnunciosPage() {
  const [anuncios,  setAnuncios]  = useState<Anuncio[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filtro,    setFiltro]    = useState<Filtro>("pendente")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [acting,    setActing]    = useState<Record<string, string>>({})
  const [aprovando, setAprovando] = useState<Record<string, { dataInicio: string; dataFim: string }>>({})

  const fetchAnuncios = useCallback(async (f: Filtro, tipo: string) => {
    setLoading(true)
    try {
      const qs   = tipo ? `&tipo=${tipo}` : ""
      const r    = await fetch(`/api/admin/anuncios?status=${FILTRO_STATUS[f]}${qs}`)
      const data = await r.json()
      setAnuncios(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("[admin/anuncios] fetch:", e)
      setAnuncios([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnuncios(filtro, filtroTipo) }, [filtro, filtroTipo, fetchAnuncios])

  function iniciarAprovacao(id: string, perioDias: number) {
    const inicio = new Date()
    const fim    = new Date()
    fim.setDate(inicio.getDate() + perioDias)
    setAprovando(prev => ({
      ...prev,
      [id]: {
        dataInicio: inicio.toISOString().split("T")[0],
        dataFim:    fim.toISOString().split("T")[0],
      },
    }))
  }

  async function confirmarAprovacao(id: string) {
    const datas = aprovando[id]
    if (!datas?.dataInicio || !datas?.dataFim) return
    setActing(a => ({ ...a, [id]: "aprovando" }))
    try {
      await fetch("/api/admin/anuncios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "aprovado", data_inicio: datas.dataInicio, data_fim: datas.dataFim }),
      })
      setAnuncios(a => a.filter(x => x.id !== id))
      setAprovando(prev => { const n = { ...prev }; delete n[id]; return n })
    } catch (e) {
      console.error("[admin/anuncios] aprovar:", e)
    } finally {
      setActing(a => { const n = { ...a }; delete n[id]; return n })
    }
  }

  async function rejeitar(id: string) {
    if (!confirm("Rejeitar este anúncio? O pagamento será estornado automaticamente.")) return
    setActing(a => ({ ...a, [id]: "rejeitando" }))
    try {
      const r = await fetch("/api/admin/anuncios", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status: "rejeitado" }),
      })
      if (!r.ok) { const d = await r.json(); alert(d.error ?? "Erro ao rejeitar."); return }
      setAnuncios(a => a.filter(x => x.id !== id))
    } catch (e) {
      console.error("[admin/anuncios] rejeitar:", e)
    } finally {
      setActing(a => { const n = { ...a }; delete n[id]; return n })
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este anúncio permanentemente?")) return
    setActing(a => ({ ...a, [id]: "excluindo" }))
    try {
      await fetch(`/api/admin/anuncios?id=${id}`, { method: "DELETE" })
      setAnuncios(a => a.filter(x => x.id !== id))
    } catch (e) {
      console.error("[admin/anuncios] excluir:", e)
    } finally {
      setActing(a => { const n = { ...a }; delete n[id]; return n })
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Marketplace de Cursos"
        subtitle="ADMIN · ANÚNCIOS"
        tagline="Revise e aprove anúncios de cursos submetidos por interessados."
        actions={
          <button
            onClick={() => fetchAnuncios(filtro, filtroTipo)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {(["pendente", "aprovado", "inativos", "all"] as Filtro[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={cn(
                  "text-[11px] px-3 py-1.5 rounded-full border transition-all",
                  filtro === f
                    ? "bg-accent-dim border-accent-border text-accent font-semibold"
                    : "border-border text-text-muted hover:text-text-secondary"
                )}
              >
                {FILTRO_LABELS[f]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {TIPOS_PRODUTO.map(t => (
              <button
                key={t.value}
                onClick={() => setFiltroTipo(t.value)}
                className={cn(
                  "text-[11px] px-3 py-1 rounded-full border transition-all",
                  filtroTipo === t.value
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                    : "border-border text-text-muted hover:text-text-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-text-muted">
            {filtro === "pendente" ? "Nenhum anúncio pendente de revisão ou aguardando pagamento." : "Nenhum anúncio encontrado."}
          </div>
        ) : (
          <div className="space-y-4">
            {anuncios.map(an => (
              <div key={an.id} className="bg-card border border-border rounded-xl p-5 space-y-3">

                <div className="flex items-start gap-3">
                  {an.anunciante_foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={an.anunciante_foto_url}
                      alt={an.anunciante_nome}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-text-muted">
                      {an.anunciante_nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-text-primary">{an.anunciante_nome}</span>
                      <span className={cn(
                        "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border",
                        an.status === "pendente"              && "bg-amber-500/10  border-amber-500/30  text-amber-400",
                        an.status === "aguardando_pagamento" && "bg-blue-500/10   border-blue-500/30   text-blue-400",
                        an.status === "aprovado"             && "bg-accent-dim    border-accent-border  text-accent",
                        an.status === "rejeitado"            && "bg-red-500/10    border-red-500/30    text-red-400",
                        an.status === "expirado"             && "bg-border/40     border-border        text-text-muted",
                      )}>
                        {an.status.toUpperCase()}
                      </span>
                      {an.tipo_produto && an.tipo_produto !== "curso" && (
                        <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border bg-violet-500/10 border-violet-500/30 text-violet-400">
                          {TIPOS_PRODUTO.find(t => t.value === an.tipo_produto)?.label ?? an.tipo_produto}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" />
                        <a href={`mailto:${an.contato_email}`} className="hover:text-text-secondary transition-colors">
                          {an.contato_email}
                        </a>
                      </span>
                      {an.contato_telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {an.contato_telefone}
                        </span>
                      )}
                      <span className="font-mono">· {new Date(an.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-lg p-3 space-y-1.5">
                  <p className="text-[13px] font-semibold text-text-primary">{an.titulo}</p>
                  <p className="text-[12px] text-text-secondary leading-relaxed">{an.chamada}</p>
                  <a
                    href={an.link_destino}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-accent hover:underline max-w-full min-w-0"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{an.link_destino}</span>
                  </a>
                </div>

                <div className="text-[11px] text-text-muted font-mono">
                  Período solicitado: {an.periodo_dias} dias
                  {an.data_inicio && an.data_fim && (
                    <span className="ml-2 text-accent">
                      · {an.data_inicio} → {an.data_fim}
                    </span>
                  )}
                </div>

                {aprovando[an.id] && (
                  <div className="border border-accent/30 rounded-lg p-3 bg-accent/5 space-y-3">
                    <p className="text-[11px] font-semibold text-accent flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Defina o período de veiculação
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">Início</label>
                        <input
                          type="date"
                          value={aprovando[an.id].dataInicio}
                          onChange={e => setAprovando(prev => ({
                            ...prev, [an.id]: { ...prev[an.id], dataInicio: e.target.value },
                          }))}
                          className="bg-surface border border-border rounded-md px-2 py-1 text-[12px] text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-text-muted mb-1">Fim</label>
                        <input
                          type="date"
                          value={aprovando[an.id].dataFim}
                          onChange={e => setAprovando(prev => ({
                            ...prev, [an.id]: { ...prev[an.id], dataFim: e.target.value },
                          }))}
                          className="bg-surface border border-border rounded-md px-2 py-1 text-[12px] text-text-primary"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmarAprovacao(an.id)}
                        disabled={!!acting[an.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-accent text-background hover:bg-accent/90 disabled:opacity-50 transition-all"
                      >
                        {acting[an.id] === "aprovando"
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                        Confirmar aprovação
                      </button>
                      <button
                        onClick={() => setAprovando(prev => { const n = { ...prev }; delete n[an.id]; return n })}
                        className="px-3 py-1.5 rounded-lg text-[12px] border border-border text-text-muted hover:text-text-primary transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {an.status === "pendente" && !aprovando[an.id] && (
                    <>
                      <button
                        onClick={() => iniciarAprovacao(an.id, an.periodo_dias)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-accent text-background hover:bg-accent/90 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => rejeitar(an.id)}
                        disabled={!!acting[an.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                      >
                        {acting[an.id] === "rejeitando"
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <X className="w-3.5 h-3.5" />}
                        Rejeitar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => excluir(an.id)}
                    disabled={!!acting[an.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                  >
                    {acting[an.id] === "excluindo"
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                    Excluir
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
