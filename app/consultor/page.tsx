"use client"

import { useEffect, useRef, useState } from "react"
import { Lightbulb, Send, Trash2, Loader2, ChevronRight, User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

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
  "Meu faturamento estagnou — o que fazer?",
  "Como me livrar dos convênios?",
  "Como montar um protocolo premium?",
  "Como estruturar minha equipe?",
  "Como abrir uma segunda unidade?",
  "Análise completa da minha clínica",
]

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MsgBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user"
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        isUser ? "bg-purple-500/20 border border-purple-500/30" : "bg-accent/10 border border-accent/20"
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-purple-400" />
          : <Bot  className="w-3.5 h-3.5 text-accent" />}
      </div>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "bg-purple-500/10 border border-purple-500/20 text-text-primary rounded-tr-sm"
          : "bg-[--surface] border border-[--border] text-text-secondary rounded-tl-sm"
      )}>
        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
      </div>
    </div>
  )
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="bg-[--surface] border border-[--border] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

// ─── Context Panel ───────────────────────────────────────────────────────────

function ContextPanel({ ctx }: { ctx: ClinicaCtx }) {
  const items = [
    ctx.especialidade  && { label: "Especialidade",    value: ctx.especialidade },
    ctx.cidade         && { label: "Cidade",           value: ctx.cidade },
    ctx.faturamento_mes !== undefined && {
      label: "Faturamento/Mês",
      value: ctx.faturamento_mes.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
    },
    ctx.leads_total !== undefined && { label: "Leads no CRM", value: String(ctx.leads_total) },
    ctx.nps_score   !== null && ctx.nps_score !== undefined && { label: "Score NPS", value: String(ctx.nps_score) },
  ].filter(Boolean) as { label: string; value: string }[]

  if (!items.length) return null

  return (
    <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-3">Contexto da Clínica</p>
      <div className="space-y-1.5">
        {items.map(i => (
          <div key={i.label} className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-text-muted">{i.label}</span>
            <span className="text-[11px] font-semibold text-text-secondary font-mono">{i.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultorPage() {
  const [messages,  setMessages]  = useState<Msg[]>([])
  const [input,     setInput]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [ctx,       setCtx]       = useState<ClinicaCtx>({})
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLTextAreaElement>(null)

  // Load context and history
  useEffect(() => {
    Promise.all([
      fetch("/api/executivo").then(r => r.json()).catch(e => { console.error("[consultor] ctx executivo falhou:", e); return null }),
      fetch("/api/consultor/historico").then(r => r.json()).catch(e => { console.error("[consultor] histórico falhou:", e); return [] }),
      fetch("/api/perfil").then(r => r.json()).catch(e => { console.error("[consultor] perfil falhou:", e); return null }),
    ]).then(([exec, hist, perfil]) => {
      setCtx({
        especialidade:   perfil?.especialidade,
        cidade:          perfil?.cidade,
        ticket_medio:    exec?.consultas_mes && exec?.faturamento_mes
          ? Math.round(exec.faturamento_mes / exec.consultas_mes) : undefined,
        leads_total:     exec?.leads_total,
        nps_score:       exec?.nps_score,
        faturamento_mes: exec?.faturamento_mes,
      })
      if (Array.isArray(hist) && hist.length > 0) {
        setMessages(hist.map((h: { role: string; content: string }) => ({
          role:    h.role as "user" | "assistant",
          content: h.content,
        })))
      }
    })
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  async function send(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading || streaming) return
    setInput("")

    const newMsg: Msg = { role: "user", content }
    const updated     = [...messages, newMsg]
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
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao conectar com o consultor. Tente novamente." }])
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  async function clearHistory() {
    await fetch("/api/consultor/historico", { method: "DELETE" }).catch(e => console.error("[consultor] erro ao limpar histórico:", e))
    setMessages([])
  }

  const canSend = input.trim().length > 0 && !loading && !streaming

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: "calc(100vh - 1px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[--border] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">Consultor Estratégico</h1>
            <p className="text-[10px] font-mono text-text-muted">PRAXIS IA · GESTÃO DE CLÍNICAS</p>
            <p className="text-[10px] text-text-secondary mt-0.5">Converse com a IA sobre estratégia de crescimento e gestão da sua clínica.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar: análises rápidas + contexto */}
        <aside className="w-56 flex-shrink-0 border-r border-[--border] overflow-y-auto p-4 space-y-4 hidden lg:block">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Análises Rápidas</p>
            <div className="space-y-1">
              {ANALISES_RAPIDAS.map(a => (
                <button
                  key={a}
                  onClick={() => send(a)}
                  disabled={loading || streaming}
                  className="w-full text-left text-xs text-text-muted hover:text-text-secondary hover:bg-white/[0.03] rounded-lg px-2.5 py-2 transition-colors flex items-center gap-1.5 group"
                >
                  <ChevronRight className="w-3 h-3 text-purple-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {a}
                </button>
              ))}
            </div>
          </div>
          <ContextPanel ctx={ctx} />
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Lightbulb className="w-7 h-7 text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-text-primary">Consultor Estratégico PRAXIS</p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Especialista em gestão, marketing e escalabilidade de clínicas médicas no Brasil.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {ANALISES_RAPIDAS.slice(0, 4).map(a => (
                    <button
                      key={a}
                      onClick={() => send(a)}
                      className="text-xs border border-purple-500/20 bg-purple-500/5 text-purple-300 px-3 py-1.5 rounded-full hover:bg-purple-500/10 transition-colors"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => <MsgBubble key={i} msg={m} />)}
            {loading && !streaming && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 md:px-6 py-4 border-t border-[--border]">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Pergunte ao seu consultor estratégico..."
                rows={2}
                className="flex-1 bg-[--surface] border border-[--border] rounded-xl px-4 py-3 text-sm text-text-primary resize-none focus:outline-none focus:border-purple-500/40 transition-colors placeholder:text-text-muted"
              />
              <button
                onClick={() => send()}
                disabled={!canSend}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                  canSend
                    ? "bg-purple-500 text-white hover:bg-purple-400"
                    : "bg-[--surface] border border-[--border] text-text-muted cursor-not-allowed"
                )}
              >
                {loading || streaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-muted font-mono mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
          </div>
        </div>
      </div>
    </div>
  )
}
