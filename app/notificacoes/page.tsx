"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Check, Trash2 } from "lucide-react"
import { Panel, PxButton, Segmented, Tag, PageHeader } from "@/components/px"

interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  link: string | null
  created_at: string
}

type Filtro = "todas" | "nao_lidas"

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return "agora"
  if (min < 60) return `${min} min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  return d === 1 ? "ontem" : `${d} dias atrás`
}

const TIPO: Record<string, { label: string; tone: "neutral" | "warn" | "danger" | "ok" }> = {
  info: { label: "Info", tone: "neutral" },
  alerta: { label: "Alerta", tone: "warn" },
  erro: { label: "Erro", tone: "danger" },
  sucesso: { label: "Sucesso", tone: "ok" },
}

// Só links internos ou http(s) viram âncora
const linkSeguro = (l: string | null) => (l && (l.startsWith("/") || /^https?:\/\//i.test(l)) ? l : null)

export default function NotificacoesPage() {
  const [items, setItems] = useState<Notificacao[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const res = await fetch("/api/notificacoes?limit=100")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const dados = await res.json()
      if (!Array.isArray(dados)) throw new Error("formato inesperado")
      setItems(dados as Notificacao[])
    } catch (e) {
      console.error("[notificacoes] erro ao carregar:", e)
      setErro("Não foi possível carregar as notificações.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function chamar(method: "PATCH" | "DELETE", url: string, body?: unknown) {
    setAviso(null)
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return true
    } catch (e) {
      console.error("[notificacoes] falha na ação:", e)
      setAviso("A ação não foi concluída. Tente novamente.")
      return false
    }
  }

  async function marcarLida(id: string) {
    if (await chamar("PATCH", "/api/notificacoes", { id })) setItems(prev => prev.map(n => (n.id === id ? { ...n, lida: true } : n)))
  }
  async function marcarTodas() {
    setMarking(true)
    if (await chamar("PATCH", "/api/notificacoes", { todas: true })) setItems(prev => prev.map(n => ({ ...n, lida: true })))
    setMarking(false)
  }
  async function excluir(id: string) {
    if (confirmar !== id) { setConfirmar(id); return }
    setConfirmar(null)
    if (await chamar("DELETE", `/api/notificacoes?id=${encodeURIComponent(id)}`)) setItems(prev => prev.filter(n => n.id !== id))
  }

  const naoLidas = items.filter(n => !n.lida).length
  const exibidas = filtro === "nao_lidas" ? items.filter(n => !n.lida) : items

  return (
    <div className="animate-fade-in">
      <PageHeader title="Notificações" caption={`${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"} de ${items.length}`}
        actions={naoLidas > 0 ? <PxButton variant="secondary" leftIcon={Check} loading={marking} onClick={marcarTodas}>Marcar todas como lidas</PxButton> : undefined} />
      <div className="max-w-2xl space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Filtro" value={filtro} onChange={setFiltro}
          options={[{ value: "todas", label: "Todas" }, { value: "nao_lidas", label: `Não lidas (${naoLidas})` }]} />

        {aviso && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{aviso}</p>}

        {loading ? (
          <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando notificações</p>
        ) : erro ? (
          <Panel className="space-y-3 py-10 text-center">
            <p role="alert" className="text-[14px] text-px-danger">{erro}</p>
            <div><PxButton onClick={carregar}>Tentar novamente</PxButton></div>
          </Panel>
        ) : exibidas.length === 0 ? (
          <Panel className="flex flex-col items-center gap-2 py-14">
            <Bell aria-hidden className="h-6 w-6 text-px-muted" />
            <p className="text-[13px] text-px-muted">{filtro === "nao_lidas" ? "Nenhuma notificação não lida." : "Nenhuma notificação."}</p>
          </Panel>
        ) : (
          <ul className="space-y-2">
            {exibidas.map(n => {
              const t = TIPO[n.tipo] ?? { label: n.tipo, tone: "neutral" as const }
              const href = linkSeguro(n.link)
              return (
                <li key={n.id}>
                  <Panel as="article" className={`flex items-start gap-3 !py-3 ${n.lida ? "opacity-80" : ""}`}>
                    <div className="mt-0.5 shrink-0"><Tag tone={t.tone}>{t.label}</Tag></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-[14px] text-px-ink ${n.lida ? "font-medium" : "font-semibold"}`}>
                          {n.titulo}{!n.lida && <span className="sr-only"> (não lida)</span>}
                        </p>
                        <span className="shrink-0 text-[12.5px] text-px-muted">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-px-ink/80">{n.mensagem}</p>
                      {href && <a href={href} className="mt-1.5 inline-block text-[13px] font-medium text-px-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">Abrir</a>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {!n.lida && <PxButton variant="quiet" size="sm" leftIcon={Check} onClick={() => marcarLida(n.id)} aria-label={`Marcar como lida: ${n.titulo}`}><span className="hidden sm:inline">Lida</span></PxButton>}
                      <PxButton variant={confirmar === n.id ? "danger" : "quiet"} size="sm" leftIcon={Trash2} onClick={() => excluir(n.id)} aria-label={confirmar === n.id ? `Confirmar exclusão: ${n.titulo}` : `Excluir: ${n.titulo}`}>
                        {confirmar === n.id ? "Confirmar" : <span className="hidden sm:inline">Excluir</span>}
                      </PxButton>
                    </div>
                  </Panel>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
