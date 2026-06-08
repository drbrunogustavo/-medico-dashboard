"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Bot, Stethoscope, Salad, Heart, MessageSquare,
  BookOpen, FileText, Copy, Check, Send, Loader2, ChevronDown,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Exame      { exame: string; justificativa: string }
interface MsgAdesao  { dia: string; texto: string }
interface Conteudo   { tipo: string; titulo: string; briefing: string }

interface Copiloto {
  resumo: {
    resumo:    string
    hipoteses: string[]
    exames:    Exame[]
  }
  planoAlimentar: {
    orientacoes:  string
    recomendados: string[]
    restritos:    string[]
    horarios:     string
  }
  orientacoesPaciente: {
    texto:        string
    pontosChave:  string[]
    expectativas: string
  }
  mensagensAdesao:    MsgAdesao[]
  conteudoEducativo:  Conteudo[]
  prontuario:         string
}

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { id: "resumo",              label: "Resumo Clínico",   icon: Stethoscope  },
  { id: "planoAlimentar",      label: "Plano Alimentar",  icon: Salad        },
  { id: "orientacoesPaciente", label: "Orientações",      icon: Heart        },
  { id: "mensagensAdesao",     label: "Mensagens Adesão", icon: MessageSquare},
  { id: "conteudoEducativo",   label: "Conteúdo",         icon: BookOpen     },
  { id: "prontuario",          label: "Prontuário",       icon: FileText     },
]

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Tab content ───────────────────────────────────────────────────────────────

function TabContent({ tab, data }: { tab: string; data: Copiloto }) {
  if (tab === "resumo") {
    const { resumo, hipoteses, exames } = data.resumo
    return (
      <div className="space-y-5">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Resumo Clínico</div>
          <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{resumo}</p>
        </div>
        {hipoteses?.length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Hipóteses Diagnósticas</div>
            <ul className="space-y-1">
              {hipoteses.map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-text-secondary">
                  <span className="w-4 h-4 rounded-full bg-accent-dim text-accent text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i+1}</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
        {exames?.length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Exames Solicitados</div>
            <div className="space-y-2">
              {exames.map((e, i) => (
                <div key={i} className="bg-surface-2 border border-border rounded-lg px-3 py-2.5">
                  <div className="text-[12px] font-medium text-text-primary">{e.exame}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{e.justificativa}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (tab === "planoAlimentar") {
    const { orientacoes, recomendados, restritos, horarios } = data.planoAlimentar
    return (
      <div className="space-y-5">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Orientações Nutricionais</div>
          <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{orientacoes}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">Recomendados</div>
            <ul className="space-y-1">
              {recomendados?.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-2">Restritos</div>
            <ul className="space-y-1">
              {restritos?.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {horarios && (
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Cronograma Alimentar</div>
            <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{horarios}</p>
          </div>
        )}
      </div>
    )
  }

  if (tab === "orientacoesPaciente") {
    const { texto, pontosChave, expectativas } = data.orientacoesPaciente
    return (
      <div className="space-y-5">
        <div>
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Orientações ao Paciente</div>
          <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{texto}</p>
        </div>
        {pontosChave?.length > 0 && (
          <div>
            <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest mb-2">Pontos-Chave</div>
            <ul className="space-y-2">
              {pontosChave.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-text-secondary">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold border border-blue-500/25">{i+1}</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
        {expectativas && (
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
            <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1.5">Expectativas do Tratamento</div>
            <p className="text-[13px] text-text-secondary leading-relaxed">{expectativas}</p>
          </div>
        )}
      </div>
    )
  }

  if (tab === "mensagensAdesao") {
    return (
      <div className="space-y-3">
        {data.mensagensAdesao?.map((m, i) => (
          <div key={i} className="bg-surface-2 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-semibold text-accent px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border">
                {m.dia}
              </span>
              <CopyBtn text={m.texto} />
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">{m.texto}</p>
          </div>
        ))}
      </div>
    )
  }

  if (tab === "conteudoEducativo") {
    const TIPO_COLOR: Record<string, string> = {
      Reel:      "bg-purple-500/10 text-purple-400 border-purple-500/25",
      Carrossel: "bg-blue-500/10   text-blue-400   border-blue-500/25",
      Story:     "bg-amber-500/10  text-amber-400  border-amber-500/25",
    }
    return (
      <div className="space-y-3">
        {data.conteudoEducativo?.map((c, i) => (
          <div key={i} className="bg-surface-2 border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", TIPO_COLOR[c.tipo] ?? "bg-surface text-text-muted border-border")}>
                {c.tipo.toUpperCase()}
              </span>
              <span className="text-[13px] font-medium text-text-primary">{c.titulo}</span>
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed">{c.briefing}</p>
          </div>
        ))}
      </div>
    )
  }

  if (tab === "prontuario") {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Prontuário Estruturado</div>
          <CopyBtn text={data.prontuario} />
        </div>
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <p className="text-[12px] text-text-secondary leading-relaxed font-mono whitespace-pre-wrap">{data.prontuario}</p>
        </div>
      </div>
    )
  }

  return null
}

// ── Inner (uses searchParams) ─────────────────────────────────────────────────

function CopilotoInner() {
  const params = useSearchParams()
  const [nomePaciente, setNomePaciente] = useState(params.get("nome") ?? "")
  const [idCliente,    setIdCliente]    = useState(params.get("id")   ?? "")
  const [descricao,    setDescricao]    = useState("")
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState("")
  const [result,       setResult]       = useState<Copiloto | null>(null)
  const [activeTab,    setActiveTab]    = useState("resumo")
  const [savedMsg,     setSavedMsg]     = useState("")
  const [formOpen,     setFormOpen]     = useState(true)

  const gerar = async () => {
    if (!descricao.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res  = await fetch("/api/copiloto?action=gerar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ descricao, nomePaciente, idCliente }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data as Copiloto)
      setFormOpen(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const inserirProntuario = async () => {
    if (!result?.prontuario || !idCliente) return
    setSaving(true)
    try {
      await fetch("/api/copiloto?action=prontuario", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ descricao: result.prontuario, idCliente }),
      })
      setSavedMsg("Prontuário inserido no MedX!")
      setTimeout(() => setSavedMsg(""), 3000)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Copiloto de Consulta"
        subtitle="ALA CLÍNICA · IA"
        actions={
          result && idCliente ? (
            <button
              onClick={inserirProntuario}
              disabled={saving}
              className="flex items-center gap-1.5 text-[11px] bg-accent text-background font-semibold rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Inserir no MedX
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-5">

        {savedMsg && (
          <div className="bg-accent-dim border border-accent-border text-accent rounded-xl px-4 py-2.5 text-[12px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> {savedMsg}
          </div>
        )}

        {/* Form accordion */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setFormOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-accent" />
              <span className="text-[13px] font-medium text-text-primary">
                {result ? `Consulta — ${nomePaciente || "Paciente"}` : "Dados da Consulta"}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform", formOpen && "rotate-180")} />
          </button>

          {formOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                    Nome do Paciente
                  </label>
                  <input
                    value={nomePaciente}
                    onChange={e => setNomePaciente(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                    ID MedX (opcional)
                  </label>
                  <input
                    value={idCliente}
                    onChange={e => setIdCliente(e.target.value)}
                    placeholder="Para inserir prontuário"
                    className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-1.5">
                  Relato da Consulta
                </label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  rows={7}
                  placeholder="Descreva os dados da consulta: queixas, histórico, exames anteriores, medicamentos, objetivos do paciente, achados do exame físico..."
                  className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent/40 outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
                  {error}
                </div>
              )}

              <button
                onClick={gerar}
                disabled={loading || !descricao.trim()}
                className="flex items-center gap-2 bg-accent text-background text-[13px] font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                {loading ? "Gerando copiloto..." : "Gerar Copiloto"}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-border scrollbar-none">
              {TABS.map(t => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0",
                      activeTab === t.id
                        ? "border-accent text-accent"
                        : "border-transparent text-text-muted hover:text-text-secondary"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>

            {/* Tab body */}
            <div className="p-5">
              <TabContent tab={activeTab} data={result} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CopilotoPage() {
  return (
    <Suspense fallback={
      <div className="animate-fade-in">
        <TopBar title="Copiloto de Consulta" subtitle="ALA CLÍNICA · IA" />
        <div className="p-8"><div className="h-64 bg-surface border border-border rounded-xl animate-pulse" /></div>
      </div>
    }>
      <CopilotoInner />
    </Suspense>
  )
}
