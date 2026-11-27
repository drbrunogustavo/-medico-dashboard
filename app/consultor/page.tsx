"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Trash2 } from "lucide-react"
import { Panel, PxButton, PageHeader } from "@/components/px"
import { useAppContext } from "@/components/AppProvider"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Msg {
  role:    "user" | "assistant"
  content: string
}

interface ClinicaCtx {
  especialidade?:   string
  cidade?:          string
  ticket_medio?:    number
  leads_total?:     number
  nps_score?:       number | null
  faturamento_mes?: number
}

// ─── Análises rápidas ────────────────────────────────────────────────────────

const ANALISES_RAPIDAS = [
  "Por que minha agenda está vazia?",
  "Como aumentar meu ticket médio?",
  "Meu faturamento estagnou, o que fazer?",
  "Como me livrar dos convênios?",
  "Como montar um protocolo premium?",
  "Como estruturar minha equipe?",
  "Como abrir uma segunda unidade?",
  "Análise completa da minha clínica",
]

const ERRO_CONEXAO = "Erro ao conectar com o consultor. Tente novamente."

// ─── Mensagem ────────────────────────────────────────────────────────────────

function MsgBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user"
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-px-card px-4 py-3 text-[13.5px] leading-relaxed ${isUser ? "bg-px-ink text-white" : "bg-px-ink/[0.05] text-px-ink"}`}>
        <span className="sr-only">{isUser ? "Você: " : "Consultor: "}</span>
        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
      </div>
    </div>
  )
}

// ─── Contexto da clínica ─────────────────────────────────────────────────────

function ContextPanel({ ctx }: { ctx: ClinicaCtx }) {
  const items = [
    ctx.especialidade && { label: "Especialidade", value: ctx.especialidade },
    ctx.cidade        && { label: "Cidade",        value: ctx.cidade },
    ctx.faturamento_mes !== undefined && {
      label: "Faturamento no mês",
      value: ctx.faturamento_mes.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
    },
    ctx.leads_total !== undefined && { label: "Leads no CRM", value: String(ctx.leads_total) },
    ctx.nps_score !== null && ctx.nps_score !== undefined && { label: "NPS", value: String(ctx.nps_score) },
  ].filter(Boolean) as { label: string; value: string }[]

  if (!items.length) return null

  return (
    <Panel as="aside" className="p-4">
      <h2 className="mb-2 text-[13px] font-semibold text-px-ink">Dados que o consultor usa</h2>
      <dl className="space-y-1.5">
        {items.map(i => (
          <div key={i.label} className="flex items-baseline justify-between gap-2">
            <dt className="text-[12.5px] text-px-muted">{i.label}</dt>
            <dd className="text-[12.5px] font-semibold text-px-ink">{i.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ConsultorPage() {
  const appCtx      = useAppContext()
  const [messages,  setMessages]  = useState<Msg[]>([])
  const [input,     setInput]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [ctx,       setCtx]       = useState<ClinicaCtx>({})
  const [avisoLimpar, setAvisoLimpar] = useState("")
  const bottomRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/executivo").then(r => r.json()).catch(e => { console.error("[consultor] ctx executivo falhou:", e); return null }),
      fetch("/api/consultor/historico").then(r => r.json()).catch(e => { console.error("[consultor] histórico falhou:", e); return [] }),
    ]).then(([exec, hist]) => {
      setCtx(prev => ({
        ...prev,
        ticket_medio:    exec?.consultas_mes && exec?.faturamento_mes
          ? Math.round(exec.faturamento_mes / exec.consultas_mes) : undefined,
        leads_total:     exec?.leads_total,
        nps_score:       exec?.nps_score,
        faturamento_mes: exec?.faturamento_mes,
      }))
      if (Array.isArray(hist) && hist.length > 0) {
        setMessages(hist.map((h: { role: string; content: string }) => ({
          role:    h.role as "user" | "assistant",
          content: h.content,
        })))
      }
    })
  }, [])

  useEffect(() => {
    setCtx(prev => ({
      ...prev,
      especialidade: appCtx?.perfil?.especialidade ?? undefined,
      cidade:        appCtx?.perfil?.cidade ?? undefined,
    }))
  }, [appCtx?.perfil])

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" })
  }, [messages, streaming])

  async function send(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading || streaming) return
    setInput("")
    setAvisoLimpar("")

    const updated = [...messages, { role: "user", content } as Msg]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await fetch("/api/consultor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          contexto: ctx,
        }),
      })

      if (!res.ok || !res.body) throw new Error("Erro na resposta")
      setLoading(false)
      setStreaming(true)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let answer    = ""

      setMessages(prev => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        answer += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: "assistant", content: answer }
          return copy
        })
      }
    } catch (e) {
      console.error("[consultor] erro ao enviar mensagem:", e)
      setMessages(prev => {
        const last = prev[prev.length - 1]
        const base = last?.role === "assistant" && last.content === "" ? prev.slice(0, -1) : prev
        return [...base, { role: "assistant", content: ERRO_CONEXAO }]
      })
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  async function clearHistory() {
    setAvisoLimpar("")
    try {
      const res = await fetch("/api/consultor/historico", { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setMessages([])
    } catch (e) {
      console.error("[consultor] erro ao limpar histórico:", e)
      setAvisoLimpar("Não foi possível limpar o histórico. Tente novamente.")
    }
  }

  const ocupado = loading || streaming
  const canSend = input.trim().length > 0 && !ocupado

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Consultor Estratégico"
        caption="Converse com a IA sobre crescimento e gestão da sua clínica"
        actions={messages.length > 0 ? (
          <PxButton variant="quiet" size="sm" onClick={clearHistory} leftIcon={Trash2}>Limpar conversa</PxButton>
        ) : undefined}
      />

      <div className="grid gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[250px_1fr]">
        <div className="hidden space-y-4 lg:block">
          <Panel as="aside" className="p-4">
            <h2 className="mb-2 text-[13px] font-semibold text-px-ink">Perguntas rápidas</h2>
            <ul className="space-y-0.5">
              {ANALISES_RAPIDAS.map(a => (
                <li key={a}>
                  <button
                    type="button"
                    onClick={() => send(a)}
                    disabled={ocupado}
                    className="w-full rounded-px-ctl px-2.5 py-2 text-left text-[13px] text-px-ink hover:bg-px-ink/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 disabled:opacity-50"
                  >
                    {a}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <ContextPanel ctx={ctx} />
        </div>

        <Panel className="flex min-h-[420px] flex-col p-0">
          <div role="log" aria-live="polite" aria-label="Conversa com o consultor" className="max-h-[60vh] min-h-[320px] flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
                <div>
                  <p className="text-[15px] font-semibold text-px-ink">Pergunte sobre a sua clínica</p>
                  <p className="mx-auto mt-1 max-w-xs text-[13px] text-px-muted">
                    Gestão, marketing e crescimento de clínicas médicas no Brasil, com base nos dados da sua clínica.
                  </p>
                </div>
                <div className="flex max-w-md flex-wrap justify-center gap-2">
                  {ANALISES_RAPIDAS.slice(0, 4).map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => send(a)}
                      className="rounded-full border border-px-line bg-white/60 px-3.5 py-1.5 text-[13px] text-px-ink hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => <MsgBubble key={i} msg={m} />)}
            {loading && !streaming && <p role="status" className="text-[13px] text-px-muted">O consultor está respondendo</p>}
            {avisoLimpar && <p role="alert" className="text-[13px] text-px-danger">{avisoLimpar}</p>}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-px-ink/10 p-4">
            <div className="flex items-end gap-3">
              <textarea
                aria-label="Mensagem para o consultor"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Pergunte ao seu consultor estratégico"
                rows={2}
                className="w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"
              />
              <PxButton onClick={() => send()} disabled={!canSend} loading={ocupado} leftIcon={Send} aria-label="Enviar mensagem">
                Enviar
              </PxButton>
            </div>
            <p className="mt-1.5 text-[12px] text-px-muted">Enter envia, Shift+Enter cria uma nova linha.</p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
