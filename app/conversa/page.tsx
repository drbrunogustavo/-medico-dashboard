"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Copy, Check,
  FileText, FlaskConical, Pill, BookOpen, MessageCircle,
  CalendarClock, Instagram, Mail, ArrowRight, AlertCircle,
} from "lucide-react"

interface CasoClinico {
  historia_clinica:    string
  exames_sugeridos:    string
  prescricao_sugerida: string
  protocolo:           string
  orientacoes:         string
  retorno_previsto:    string
  conteudo_instagram:  string
  carta_paciente:      string
}

interface Secao {
  key:    keyof CasoClinico
  label:  string
  icon:   React.ElementType
  color:  string
}

const SECOES: Secao[] = [
  { key: "historia_clinica",    label: "História Clínica",      icon: FileText,      color: "blue"    },
  { key: "exames_sugeridos",    label: "Exames Sugeridos",      icon: FlaskConical,  color: "violet"  },
  { key: "prescricao_sugerida", label: "Prescrição Sugerida",   icon: Pill,          color: "green"   },
  { key: "protocolo",           label: "Protocolo Clínico",     icon: BookOpen,      color: "accent"  },
  { key: "orientacoes",         label: "Orientações ao Paciente",icon: MessageCircle, color: "amber"   },
  { key: "retorno_previsto",    label: "Retorno Previsto",      icon: CalendarClock, color: "blue"    },
  { key: "conteudo_instagram",  label: "Conteúdo Instagram",    icon: Instagram,     color: "pink"    },
  { key: "carta_paciente",      label: "Carta ao Paciente",     icon: Mail,          color: "accent"  },
]

const COLOR_CLASSES: Record<string, { icon: string; badge: string; border: string; bg: string }> = {
  blue:   { icon: "text-blue-400",   badge: "text-blue-400 bg-blue-500/10 border-blue-500/25",   border: "border-blue-500/20",   bg: "hover:bg-blue-500/5"   },
  violet: { icon: "text-violet-400", badge: "text-violet-400 bg-violet-500/10 border-violet-500/25", border: "border-violet-500/20", bg: "hover:bg-violet-500/5" },
  green:  { icon: "text-green-400",  badge: "text-green-400 bg-green-500/10 border-green-500/25",  border: "border-green-500/20",  bg: "hover:bg-green-500/5"  },
  accent: { icon: "text-accent",     badge: "text-accent bg-accent-dim border-accent-border",       border: "border-accent-border", bg: "hover:bg-accent-dim"   },
  amber:  { icon: "text-amber-400",  badge: "text-amber-400 bg-amber-500/10 border-amber-500/25",  border: "border-amber-500/20",  bg: "hover:bg-amber-500/5"  },
  pink:   { icon: "text-pink-400",   badge: "text-pink-400 bg-pink-500/10 border-pink-500/25",    border: "border-pink-500/20",   bg: "hover:bg-pink-500/5"   },
}

function SecaoCard({ secao, texto, onUsarNoCopiloto }: { secao: Secao; texto: string; onUsarNoCopiloto: () => void }) {
  const [open,    setOpen]    = useState(true)
  const [copied,  setCopied]  = useState(false)
  const cls = COLOR_CLASSES[secao.color]
  const Icon = secao.icon

  const copy = () => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={cn("bg-card border rounded-xl overflow-hidden transition-colors", cls.border)}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors", cls.bg)}
      >
        <Icon className={cn("w-4 h-4 flex-shrink-0", cls.icon)} />
        <span className="flex-1 text-[12px] font-semibold text-text-primary">{secao.label}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[12px] text-text-secondary whitespace-pre-line leading-relaxed">{texto}</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              onClick={onUsarNoCopiloto}
              className={cn("flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-colors", cls.badge)}
            >
              <ArrowRight className="w-3 h-3" />
              Usar no Copiloto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConversaInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [relato,       setRelato]       = useState(searchParams.get("relato")        ?? "")
  const [dados,        setDados]        = useState(searchParams.get("dados")         ?? "")
  const [nomePaciente, setNomePaciente] = useState(searchParams.get("nomePaciente") ?? "")
  const [tipoConsulta, setTipoConsulta] = useState(searchParams.get("tipoConsulta") ?? "")
  const [loading,      setLoading]      = useState(false)
  const [caso,         setCaso]         = useState<Partial<CasoClinico> | null>(null)
  const [erro,         setErro]         = useState("")

  // Auto-submit if relato was pre-filled from URL
  useEffect(() => {
    if (searchParams.get("relato")?.trim() && searchParams.get("autosubmit") === "1") {
      analisar()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const analisar = useCallback(async () => {
    if (!relato.trim()) return
    setLoading(true)
    setErro("")
    setCaso(null)
    try {
      const res  = await fetch("/api/conversa/caso-clinico", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relato, dados: dados || undefined, nomePaciente: nomePaciente || undefined, tipoConsulta: tipoConsulta || undefined }),
      })
      const data = await res.json() as { caso?: Partial<CasoClinico>; error?: string }
      if (data.error) { setErro(data.error); return }
      setCaso(data.caso ?? {})
    } catch { setErro("Erro ao analisar caso. Tente novamente.") }
    finally  { setLoading(false) }
  }, [relato, dados, nomePaciente, tipoConsulta])

  const usarNoCopiloto = (texto: string) => {
    const params = new URLSearchParams({ dados: texto })
    router.push(`/copiloto?${params.toString()}`)
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Conversa Clínica"
        subtitle="IA CONVERSACIONAL · ANÁLISE COMPLETA DO CASO"
        actions={
          caso && (
            <button
              onClick={() => { setCaso(null); setRelato(""); setDados(""); setNomePaciente(""); setTipoConsulta("") }}
              className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              Novo caso
            </button>
          )
        }
      />

      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        {!caso ? (
          /* ── Formulário ───────────────────────────────────────── */
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-[13px] text-text-primary font-semibold">Análise completa do caso clínico</p>
              <p className="text-[11px] text-text-muted">Claude gera história clínica, exames, prescrição, protocolo, orientações, conteúdo e carta ao paciente.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Paciente (opcional)</label>
                <input
                  value={nomePaciente}
                  onChange={e => setNomePaciente(e.target.value)}
                  placeholder="Nome do paciente"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Tipo de consulta</label>
                <input
                  value={tipoConsulta}
                  onChange={e => setTipoConsulta(e.target.value)}
                  placeholder="Ex: retorno, urgência, pré-natal"
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Relato clínico *</label>
              <textarea
                value={relato}
                onChange={e => setRelato(e.target.value)}
                rows={6}
                placeholder="Descreva o caso: queixas, histórico, hipóteses diagnósticas, conduta discutida..."
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Dados objetivos (opcional)</label>
              <textarea
                value={dados}
                onChange={e => setDados(e.target.value)}
                rows={3}
                placeholder="Sinais vitais, exames, medicamentos atuais, alergias..."
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-[12px] text-text-primary placeholder:text-text-muted focus:border-blue-500/40 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            {erro && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-[12px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <button
              onClick={analisar}
              disabled={loading || !relato.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 text-[13px] font-semibold rounded-xl py-3 transition-all",
                loading
                  ? "bg-accent/10 border border-accent-border text-accent cursor-wait"
                  : "bg-accent text-background hover:bg-accent/90 disabled:opacity-40"
              )}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando caso...</>
                : <><Sparkles className="w-4 h-4" /> Analisar caso clínico</>
              }
            </button>
            {loading && (
              <p className="text-center text-[10px] font-mono text-text-muted">
                Processamento pode levar até 30 segundos...
              </p>
            )}
          </div>
        ) : (
          /* ── Resultado ────────────────────────────────────────── */
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-[12px] font-semibold text-text-primary">Análise gerada</span>
              {nomePaciente && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-accent-dim border-accent-border text-accent">
                  {nomePaciente}
                </span>
              )}
            </div>

            {SECOES.map(secao => {
              const texto = caso[secao.key]
              if (!texto) return null
              return (
                <SecaoCard
                  key={secao.key}
                  secao={secao}
                  texto={texto}
                  onUsarNoCopiloto={() => usarNoCopiloto(texto)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConversaPage() {
  return (
    <Suspense>
      <ConversaInner />
    </Suspense>
  )
}
