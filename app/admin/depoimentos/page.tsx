"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Panel, PxButton, PxModal, Segmented, Tag, PageHeader } from "@/components/px"

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

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "false", label: "Pendentes" },
  { value: "true",  label: "Aprovados" },
  { value: "all",   label: "Todos" },
]

export default function AdminDepoimentosPage() {
  const [deps, setDeps] = useState<Dep[]>([])
  const [loading, setLoading] = useState(true)
  const [erroCarga, setErroCarga] = useState("")
  const [filtro, setFiltro] = useState<Filtro>("false")
  const [ocupado, setOcupado] = useState<string[]>([])
  const [erroAcao, setErroAcao] = useState<Record<string, string>>({})
  const [excluindo, setExcluindo] = useState<Dep | null>(null)
  const [erroModal, setErroModal] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setErroCarga("")
    try {
      const r = await fetch("/api/admin/depoimentos?aprovado=" + filtro)
      if (r.status === 403) { setErroCarga("Esta área é restrita ao administrador."); setDeps([]); return }
      const data = await r.json().catch(() => null)
      if (!r.ok || !Array.isArray(data)) throw new Error("HTTP " + r.status)
      setDeps(data as Dep[])
    } catch (e) {
      console.error("[admin/depoimentos] erro ao carregar:", e)
      setErroCarga("Não foi possível carregar os depoimentos."); setDeps([])
    } finally { setLoading(false) }
  }, [filtro])

  useEffect(() => { carregar() }, [carregar])

  const marcar = (id: string, on: boolean) => setOcupado(o => on ? [...o, id] : o.filter(x => x !== id))

  async function definirAprovacao(dep: Dep, aprovado: boolean) {
    marcar(dep.id, true); setErroAcao(e => ({ ...e, [dep.id]: "" }))
    try {
      const r = await fetch("/api/admin/depoimentos", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dep.id, aprovado }),
      })
      const data = await r.json().catch(() => null) as { error?: string } | null
      if (!r.ok) { setErroAcao(e => ({ ...e, [dep.id]: data?.error ?? "Não foi possível salvar." })); return }
      // Em "Todos" o cartão continua na lista com a situação nova; nos outros filtros ele sai.
      setDeps(d => filtro === "all" ? d.map(x => x.id === dep.id ? { ...x, aprovado } : x) : d.filter(x => x.id !== dep.id))
    } catch (e) {
      console.error("[admin/depoimentos] aprovação:", e)
      setErroAcao(er => ({ ...er, [dep.id]: "Erro de conexão. Tente novamente." }))
    } finally { marcar(dep.id, false) }
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    const dep = excluindo
    marcar(dep.id, true); setErroModal("")
    try {
      const r = await fetch("/api/admin/depoimentos?id=" + encodeURIComponent(dep.id), { method: "DELETE" })
      const data = await r.json().catch(() => null) as { error?: string } | null
      if (!r.ok) { setErroModal(data?.error ?? "Não foi possível excluir."); return }
      setDeps(d => d.filter(x => x.id !== dep.id)); setExcluindo(null)
    } catch (e) {
      console.error("[admin/depoimentos] exclusão:", e)
      setErroModal("Erro de conexão. Tente novamente.")
    } finally { marcar(dep.id, false) }
  }

  const excluindoAgora = !!excluindo && ocupado.includes(excluindo.id)
  const fecharModal = () => { if (!excluindoAgora) { setExcluindo(null); setErroModal("") } }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Depoimentos"
        caption="Aprove o que os assinantes enviaram antes de qualquer publicação"
        actions={<PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={carregar} loading={loading}>Atualizar</PxButton>}
      />

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Situação dos depoimentos" value={filtro} onChange={setFiltro} options={FILTROS} />

        {erroCarga && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroCarga}</p>}

        {loading && !erroCarga ? <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando depoimentos</p>
          : !erroCarga && deps.length === 0 ? <Panel className="py-12 text-center text-[13.5px] text-px-muted">{filtro === "false" ? "Nenhum depoimento pendente de aprovação." : "Nenhum depoimento encontrado."}</Panel>
          : !erroCarga && (
            <ul className="space-y-3">
              {deps.map(dep => {
                const busy = ocupado.includes(dep.id)
                return (
                  <li key={dep.id}>
                    <Panel as="article" className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-[14.5px] font-semibold text-px-ink">{dep.nome}</h2>
                          {dep.crm && <span className="text-[12.5px] text-px-muted">{dep.crm}</span>}
                          <Tag tone={dep.aprovado ? "ok" : "warn"}>{dep.aprovado ? "Aprovado" : "Pendente"}</Tag>
                          <Tag tone="neutral">{dep.exibir_landing ? "Autorizou exibir na landing" : "Não autorizou exibir na landing"}</Tag>
                        </div>
                        <p className="text-[12.5px] text-px-muted">
                          {[dep.especialidade, dep.cidade ? dep.cidade + (dep.estado ? "/" + dep.estado : "") : null, dep.instagram, new Date(dep.created_at).toLocaleDateString("pt-BR")].filter(Boolean).join(" · ")}
                        </p>
                      </div>

                      <blockquote className="border-l-2 border-px-line pl-3 text-[13.5px] leading-relaxed text-px-ink">{dep.depoimento}</blockquote>

                      {dep.resultado_destaque && (
                        <p className="text-[13px] text-px-ink"><span className="text-px-muted">Resultado em destaque: </span>{dep.resultado_destaque}</p>
                      )}

                      {!dep.aprovado && !dep.exibir_landing && (
                        <p className="text-[12.5px] text-px-muted">Aprovar não publica este depoimento, porque o autor não autorizou a exibição na landing.</p>
                      )}

                      {erroAcao[dep.id] && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroAcao[dep.id]}</p>}

                      <div className="flex flex-wrap gap-2">
                        {dep.aprovado
                          ? <PxButton size="sm" variant="secondary" onClick={() => definirAprovacao(dep, false)} disabled={busy}>Revogar aprovação</PxButton>
                          : <PxButton size="sm" onClick={() => definirAprovacao(dep, true)} loading={busy}>Aprovar</PxButton>}
                        <PxButton size="sm" variant="danger" disabled={busy} onClick={() => { setErroModal(""); setExcluindo(dep) }}>Excluir</PxButton>
                      </div>
                    </Panel>
                  </li>
                )
              })}
            </ul>
          )}
      </div>

      <PxModal open={!!excluindo} onClose={fecharModal} title="Excluir depoimento">
        {excluindo && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-px-ink">O depoimento de <span className="font-medium">{excluindo.nome}</span> será excluído de vez. Não há como desfazer.</p>
            {erroModal && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erroModal}</p>}
            <div className="flex justify-end gap-2">
              <PxButton variant="quiet" onClick={fecharModal} disabled={excluindoAgora}>Voltar</PxButton>
              <PxButton variant="danger" onClick={confirmarExclusao} loading={excluindoAgora}>Excluir</PxButton>
            </div>
          </div>
        )}
      </PxModal>
    </div>
  )
}
