"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Trash2, Globe, EyeOff, Loader2, RefreshCw, Instagram } from "lucide-react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

interface Dep {
  id: string
  nome: string
  crm: string | null
  especialidade: string | null
  cidade: string | null
  estado: string | null
  depoimento: string
  resultado_destaque: string | null
  instagram: string | null
  aprovado: boolean
  exibir_landing: boolean
  created_at: string
}

type Filtro = "false" | "true" | "all"

const FILTRO_LABELS: Record<Filtro, string> = {
  false: "Pendentes",
  true:  "Aprovados",
  all:   "Todos",
}

export default function AdminDepoimentosPage() {
  const [deps,    setDeps]    = useState<Dep[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState<Filtro>("false")
  const [acting,  setActing]  = useState<Record<string, string>>({})

  const fetchDeps = useCallback(async (f: Filtro) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/depoimentos?aprovado=${f}`)
      const data = await r.json()
      setDeps(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDeps(filtro) }, [filtro, fetchDeps])

  async function aprovar(id: string) {
    setActing(a => ({ ...a, [id]: "aprovando" }))
    await fetch("/api/admin/depoimentos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, aprovado: true }),
    })
    setDeps(d => d.filter(x => x.id !== id))
    setActing(a => { const n = { ...a }; delete n[id]; return n })
  }

  async function revogar(id: string) {
    await fetch("/api/admin/depoimentos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, aprovado: false }),
    })
    setDeps(d => d.filter(x => x.id !== id))
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este depoimento permanentemente?")) return
    setActing(a => ({ ...a, [id]: "excluindo" }))
    await fetch(`/api/admin/depoimentos?id=${id}`, { method: "DELETE" })
    setDeps(d => d.filter(x => x.id !== id))
    setActing(a => { const n = { ...a }; delete n[id]; return n })
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Moderação de Depoimentos"
        subtitle="ADMIN · PRAXIS INTERNAL"
        actions={
          <button
            onClick={() => fetchDeps(filtro)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6">
        {/* Filtros */}
        <div className="flex gap-2">
          {(["false", "true", "all"] as Filtro[]).map(f => (
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : deps.length === 0 ? (
          <div className="text-center py-20 text-[13px] text-text-muted">
            {filtro === "false" ? "Nenhum depoimento pendente de aprovação." : "Nenhum depoimento encontrado."}
          </div>
        ) : (
          <div className="space-y-4">
            {deps.map(dep => (
              <div key={dep.id} className="bg-card border border-border rounded-xl p-5 space-y-3">

                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-text-primary">{dep.nome}</span>
                      {dep.crm && (
                        <span className="text-[10px] font-mono text-text-muted">{dep.crm}</span>
                      )}
                      {dep.aprovado ? (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-accent-dim border-accent-border text-accent">
                          APROVADO
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400">
                          PENDENTE
                        </span>
                      )}
                      {dep.exibir_landing ? (
                        <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border bg-blue-500/10 border-blue-500/25 text-blue-400">
                          <Globe className="w-2.5 h-2.5" /> Landing
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border border-border text-text-muted">
                          <EyeOff className="w-2.5 h-2.5" /> Privado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted flex-wrap">
                      {dep.especialidade && <span>{dep.especialidade}</span>}
                      {dep.cidade && (
                        <span>· {dep.cidade}{dep.estado ? `/${dep.estado}` : ""}</span>
                      )}
                      {dep.instagram && (
                        <span className="flex items-center gap-1">
                          · <Instagram className="w-2.5 h-2.5" /> {dep.instagram}
                        </span>
                      )}
                      <span className="font-mono">
                        · {new Date(dep.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Texto do depoimento */}
                <p className="text-[13px] text-text-secondary leading-relaxed border-l-2 border-accent/30 pl-3 italic">
                  "{dep.depoimento}"
                </p>

                {dep.resultado_destaque && (
                  <div className="text-[11px] font-mono text-accent bg-accent-dim border border-accent-border rounded-lg px-3 py-1.5">
                    ★ {dep.resultado_destaque}
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {!dep.aprovado && (
                    <button
                      onClick={() => aprovar(dep.id)}
                      disabled={!!acting[dep.id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-accent text-background hover:bg-accent/90 disabled:opacity-50 transition-all"
                    >
                      {acting[dep.id] === "aprovando"
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Check className="w-3.5 h-3.5" />}
                      Aprovar
                    </button>
                  )}
                  {dep.aprovado && (
                    <button
                      onClick={() => revogar(dep.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-border text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
                    >
                      Revogar aprovação
                    </button>
                  )}
                  <button
                    onClick={() => excluir(dep.id)}
                    disabled={!!acting[dep.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all"
                  >
                    {acting[dep.id] === "excluindo"
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
