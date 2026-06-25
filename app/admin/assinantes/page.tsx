"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, RefreshCw, AlertTriangle, Ban } from "lucide-react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"

interface Assinante {
  id:                     string
  email:                  string
  nome:                   string | null
  especialidade:          string | null
  plano:                  string
  status:                 string
  assinatura_termina_em:  string | null
  trial_termina_em:       string | null
  tem_stripe:             boolean
  stripe_subscription_id: string | null
  cadastro_em:            string
  ultimo_acesso:          string | null
}

type Filtro = "todos" | "ativo" | "atencao"

const PLANO_LABEL: Record<string, string> = { trial: "Trial", pro: "Pro", elite: "Elite" }
const PLANO_STYLE: Record<string, string> = {
  trial: "bg-blue-500/10 border-blue-500/25 text-blue-400",
  pro:   "bg-accent-dim border-accent-border text-accent",
  elite: "bg-purple-500/10 border-purple-500/25 text-purple-400",
}
const STATUS_LABEL: Record<string, string> = {
  ativo:                 "Ativo",
  cancelado:             "Cancelado",
  past_due:              "Vencido",
  cancelado_fim_periodo: "Ativo até fim do período",
}
const STATUS_STYLE: Record<string, string> = {
  ativo:                 "bg-accent-dim border-accent-border text-accent",
  cancelado:             "bg-red-500/10 border-red-500/30 text-red-400",
  past_due:              "bg-amber-500/10 border-amber-500/30 text-amber-400",
  cancelado_fim_periodo: "bg-amber-500/10 border-amber-500/30 text-amber-400",
}

function isProblematic(status: string) {
  return status === "past_due" || status === "cancelado" || status === "cancelado_fim_periodo"
}

function fmt(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

export default function AssinantesPage() {
  const [lista,   setLista]   = useState<Assinante[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState<Filtro>("todos")
  const [acting,  setActing]  = useState<Record<string, boolean>>({})

  async function fetchData() {
    setLoading(true)
    try {
      const r    = await fetch("/api/admin/assinantes")
      const data = await r.json()
      setLista(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const cancelar = useCallback(async (userId: string, nome: string | null) => {
    const label = nome ?? userId.slice(0, 8)
    const ok = window.confirm(
      `Cancelar assinatura de "${label}"?\n\n` +
      `• O acesso continua até o fim do período pago\n` +
      `• O último pagamento será estornado AUTOMATICAMENTE agora\n\n` +
      `Esta ação não pode ser desfeita. Confirma?`
    )
    if (!ok) return
    setActing(a => ({ ...a, [userId]: true }))
    try {
      const r    = await fetch("/api/admin/assinantes/cancelar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: userId }),
      })
      const data = await r.json()
      if (!r.ok) { alert(data.error ?? "Erro ao cancelar."); return }
      setLista(prev => prev.map(a =>
        a.id === userId ? { ...a, status: "cancelado_fim_periodo" } : a
      ))
    } catch {
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setActing(a => { const n = { ...a }; delete n[userId]; return n })
    }
  }, [])

  const filtrado = lista.filter(a => {
    if (filtro === "ativo")   return a.status === "ativo"
    if (filtro === "atencao") return isProblematic(a.status)
    return true
  })

  const nProblemas = lista.filter(a => isProblematic(a.status)).length

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Assinantes"
        subtitle="ADMIN · PRAXIS INTERNAL"
        tagline="Veja todos os assinantes, planos e status de pagamento."
        actions={
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[12px] text-text-muted hover:text-text-primary hover:border-border-hover transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        }
      />

      <div className="p-6 md:p-8 space-y-6">

        {/* Resumo */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-[13px] text-text-muted">
            <span className="text-text-primary font-semibold text-[20px] mr-1">{lista.length}</span>
            usuários cadastrados
          </div>
          {nProblemas > 0 && (
            <button
              onClick={() => setFiltro("atencao")}
              className="flex items-center gap-1.5 text-[12px] text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-1.5 hover:bg-amber-500/15 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {nProblemas} com atenção necessária
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {(["todos", "ativo", "atencao"] as Filtro[]).map(f => (
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
              {f === "todos" ? "Todos" : f === "ativo" ? "Ativos" : "Atenção"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-[12px] min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  {["Nome / Especialidade", "Email", "Plano", "Status", "Cadastro", "Último acesso", "Expira em", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrado.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-text-muted text-[13px]">
                      Nenhum assinante encontrado.
                    </td>
                  </tr>
                ) : filtrado.map((a, i) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-background/50 transition-colors",
                      isProblematic(a.status) && "bg-red-500/[0.025]",
                      i === filtrado.length - 1 && "border-b-0"
                    )}
                  >
                    {/* Nome / Especialidade */}
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="font-medium text-text-primary truncate">
                        {a.nome ?? <span className="text-text-muted italic text-[11px]">Sem nome</span>}
                      </div>
                      {a.especialidade && (
                        <div className="text-[10px] text-text-muted mt-0.5 truncate">{a.especialidade}</div>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="font-mono text-[11px] text-text-secondary truncate block">{a.email}</span>
                    </td>

                    {/* Plano */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border",
                        PLANO_STYLE[a.plano] ?? "border-border text-text-muted"
                      )}>
                        {PLANO_LABEL[a.plano] ?? a.plano}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border",
                        STATUS_STYLE[a.status] ?? "border-border text-text-muted"
                      )}>
                        {isProblematic(a.status) && <AlertTriangle className="w-2.5 h-2.5" />}
                        {STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </td>

                    {/* Cadastro */}
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {fmt(a.cadastro_em)}
                    </td>

                    {/* Último acesso */}
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {fmt(a.ultimo_acesso)}
                    </td>

                    {/* Expira em */}
                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {fmt(a.assinatura_termina_em ?? a.trial_termina_em)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.status === "ativo" && a.tem_stripe && (
                        <button
                          onClick={() => cancelar(a.id, a.nome)}
                          disabled={acting[a.id]}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border border-red-500/25 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all"
                        >
                          {acting[a.id]
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Ban className="w-3 h-3" />}
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
