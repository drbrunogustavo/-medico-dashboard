"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Panel, PxButton, PxInput, PxModal, Segmented, Tag, PageHeader } from "@/components/px"

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
  cadastro_em:            string
  ultimo_acesso:          string | null
}

type Filtro = "todos" | "ativo" | "atencao"
type Tom = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const PLANO_LABEL: Record<string, string> = { trial: "Trial", pro: "Pro", elite: "Elite" }
const PLANO_TOM: Record<string, Tom> = { trial: "neutral", pro: "ink", elite: "accent" }
const STATUS_LABEL: Record<string, string> = {
  ativo:                 "Ativo",
  cancelado:             "Cancelado",
  past_due:              "Pagamento vencido",
  cancelado_fim_periodo: "Cancelado, ativo até o fim do período",
}
const STATUS_TOM: Record<string, Tom> = { ativo: "ok", cancelado: "danger", past_due: "warn", cancelado_fim_periodo: "warn" }

const FILTROS = [
  { value: "todos" as Filtro,   label: "Todos" },
  { value: "ativo" as Filtro,   label: "Ativos" },
  { value: "atencao" as Filtro, label: "Atenção" },
]

function precisaAtencao(status: string) {
  return status === "past_due" || status === "cancelado" || status === "cancelado_fim_periodo"
}

function fmt(iso: string | null) {
  if (!iso) return "-"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

export default function AssinantesPage() {
  const [lista,    setLista]    = useState<Assinante[]>([])
  const [loading,  setLoading]  = useState(true)
  const [erro,     setErro]     = useState("")
  const [filtro,   setFiltro]   = useState<Filtro>("todos")
  const [busca,    setBusca]    = useState("")
  const [alvo,     setAlvo]     = useState<Assinante | null>(null)
  const [cancelando, setCancelando] = useState(false)
  const [erroCancelar, setErroCancelar] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setErro("")
    try {
      const r = await fetch("/api/admin/assinantes")
      if (r.status === 403) { setErro("Esta área é restrita ao administrador."); return }
      const data = await r.json().catch(() => null)
      if (!r.ok || !Array.isArray(data)) throw new Error("HTTP " + r.status)
      setLista(data as Assinante[])
    } catch (e) {
      console.error("[admin/assinantes] erro ao carregar:", e)
      setErro("Não foi possível carregar os assinantes.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function fechar() { if (!cancelando) { setAlvo(null); setErroCancelar("") } }

  async function confirmarCancelamento() {
    if (!alvo) return
    setCancelando(true); setErroCancelar("")
    try {
      const r = await fetch("/api/admin/assinantes/cancelar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: alvo.id }),
      })
      const data = await r.json().catch(() => null) as { error?: string } | null
      if (!r.ok) { setErroCancelar(data?.error ?? "Não foi possível cancelar a assinatura."); return }
      const id = alvo.id
      setLista(prev => prev.map(a => a.id === id ? { ...a, status: "cancelado_fim_periodo" } : a))
      setAlvo(null)
    } catch (e) {
      console.error("[admin/assinantes] erro ao cancelar:", e)
      setErroCancelar("Erro de conexão. Tente novamente.")
    } finally {
      setCancelando(false)
    }
  }

  const nAtencao = useMemo(() => lista.filter(a => precisaAtencao(a.status)).length, [lista])

  const filtrado = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return lista.filter(a => {
      if (filtro === "ativo" && a.status !== "ativo") return false
      if (filtro === "atencao" && !precisaAtencao(a.status)) return false
      if (!termo) return true
      return (a.nome ?? "").toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo)
    })
  }, [lista, filtro, busca])

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Assinantes"
        caption={loading || erro ? "Planos e situação de pagamento" : `${lista.length} usuários cadastrados, ${nAtencao} com situação que pede atenção`}
        actions={<PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={carregar} loading={loading}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}

        {!erro && (
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Filtrar assinantes" value={filtro} onChange={setFiltro} options={FILTROS} />
            <div className="w-full max-w-xs">
              <PxInput aria-label="Buscar por nome ou e-mail" placeholder="Buscar por nome ou e-mail" value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
        )}

        {loading && !erro ? <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando assinantes</p>
          : !erro && (
            <Panel className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-px-line text-[12px] text-px-muted">
                      <th scope="col" className="px-4 py-2.5 font-medium">Nome</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">E-mail</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Plano</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Situação</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Cadastro</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Último acesso</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Termina em</th>
                      <th scope="col" className="px-3 py-2.5 font-medium"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrado.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-px-muted">Nenhum assinante encontrado.</td></tr>
                    ) : filtrado.map(a => (
                      <tr key={a.id} className="border-b border-px-line/60 align-top last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-px-ink">{a.nome ?? "Sem nome"}</div>
                          {a.especialidade && <div className="text-[12px] text-px-muted">{a.especialidade}</div>}
                        </td>
                        <td className="max-w-[220px] break-all px-3 py-3 text-px-ink">{a.email}</td>
                        <td className="px-3 py-3"><Tag tone={PLANO_TOM[a.plano] ?? "neutral"}>{PLANO_LABEL[a.plano] ?? a.plano}</Tag></td>
                        <td className="px-3 py-3"><Tag tone={STATUS_TOM[a.status] ?? "neutral"}>{STATUS_LABEL[a.status] ?? a.status}</Tag></td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-px-muted">{fmt(a.cadastro_em)}</td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-px-muted">{fmt(a.ultimo_acesso)}</td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-px-muted">{fmt(a.assinatura_termina_em ?? a.trial_termina_em)}</td>
                        <td className="px-3 py-2">
                          {a.status === "ativo" && (a.tem_stripe
                            ? <PxButton variant="danger" size="sm" onClick={() => { setErroCancelar(""); setAlvo(a) }} aria-label={"Cancelar assinatura de " + (a.nome ?? a.email)}>Cancelar</PxButton>
                            : <span className="text-[12px] text-px-muted">Sem cobrança no Stripe</span>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
      </div>

      <PxModal open={!!alvo} onClose={fechar} title="Cancelar assinatura">
        {alvo && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-px-ink">
              Assinatura de <span className="font-medium">{alvo.nome ?? alvo.email}</span>. Ao confirmar, o último pagamento é estornado agora, por completo,
              e o acesso continua até o fim do período já cobrado. Não há como desfazer pelo Praxis.
            </p>
            {erroCancelar && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroCancelar}</p>}
            <div className="flex justify-end gap-2">
              <PxButton variant="quiet" onClick={fechar} disabled={cancelando}>Voltar</PxButton>
              <PxButton variant="danger" onClick={confirmarCancelamento} loading={cancelando}>Estornar e cancelar</PxButton>
            </div>
          </div>
        )}
      </PxModal>
    </div>
  )
}
