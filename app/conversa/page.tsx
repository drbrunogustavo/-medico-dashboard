"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Panel, PxButton, Tag, Field, PxInput, PageHeader } from "@/components/px"
import {
  Sparkles, ChevronDown, ChevronUp, Copy, Check, ArrowRight,
  FileText, FlaskConical, Pill, BookOpen, MessageCircle,
  CalendarClock, Instagram, Mail,
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
}

const SECOES: Secao[] = [
  { key: "historia_clinica",    label: "História Clínica",      icon: FileText },
  { key: "exames_sugeridos",    label: "Exames Sugeridos",      icon: FlaskConical },
  { key: "prescricao_sugerida", label: "Prescrição Sugerida",   icon: Pill },
  { key: "protocolo",           label: "Protocolo Clínico",     icon: BookOpen },
  { key: "orientacoes",         label: "Orientações ao Paciente",icon: MessageCircle },
  { key: "retorno_previsto",    label: "Retorno Previsto",      icon: CalendarClock },
  { key: "conteudo_instagram",  label: "Conteúdo Instagram",    icon: Instagram },
  { key: "carta_paciente",      label: "Carta ao Paciente",     icon: Mail },
]

function SecaoCard({ secao, texto, onUsarNoCopiloto }: { secao: Secao; texto: string; onUsarNoCopiloto: () => void }) {
  const [open,   setOpen]   = useState(true)
  const [copied, setCopied] = useState(false)
  const Icon = secao.icon

  const copy = () => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Panel tone="light" className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/40"
      >
        <Icon className="h-4 w-4 flex-shrink-0 text-px-accent" aria-hidden />
        <span className="flex-1 text-[14px] font-semibold text-px-ink">{secao.label}</span>
        {open ? <ChevronUp className="h-4 w-4 text-px-muted" aria-hidden /> : <ChevronDown className="h-4 w-4 text-px-muted" aria-hidden />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-px-line px-5 pb-5 pt-4">
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink">{texto}</p>
          <div className="flex flex-wrap gap-2">
            <PxButton size="sm" variant="secondary" leftIcon={copied ? Check : Copy} onClick={copy}>
              {copied ? "Copiado" : "Copiar"}
            </PxButton>
            <PxButton size="sm" variant="secondary" rightIcon={ArrowRight} onClick={onUsarNoCopiloto}>
              Usar no Copiloto
            </PxButton>
          </div>
        </div>
      )}
    </Panel>
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

  const novoCaso = () => { setCaso(null); setRelato(""); setDados(""); setNomePaciente(""); setTipoConsulta("") }
  const area = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-px-ink placeholder:text-px-muted"

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Conversa"
        caption="Análise completa de um caso clínico"
        actions={caso ? <PxButton variant="secondary" onClick={novoCaso}>Novo caso</PxButton> : undefined}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        {!caso ? (
          <Panel tone="light" className="space-y-4">
            <div>
              <h2 className="text-[16px] font-semibold text-px-ink">Descreva o caso</h2>
              <p className="mt-0.5 text-[13px] text-px-muted">
                A IA gera história clínica, exames, prescrição, protocolo, orientações, conteúdo e carta ao paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Paciente (opcional)" htmlFor="cv-nome">
                <PxInput id="cv-nome" value={nomePaciente} onChange={e => setNomePaciente(e.target.value)} placeholder="Nome do paciente" />
              </Field>
              <Field label="Tipo de consulta (opcional)" htmlFor="cv-tipo">
                <PxInput id="cv-tipo" value={tipoConsulta} onChange={e => setTipoConsulta(e.target.value)} placeholder="Ex: retorno, urgência" />
              </Field>
            </div>

            <Field label="Relato clínico *" htmlFor="cv-relato">
              <textarea id="cv-relato" value={relato} onChange={e => setRelato(e.target.value)} rows={6}
                placeholder="Queixas, histórico, hipóteses diagnósticas e conduta discutida."
                className={area} />
            </Field>

            <Field label="Dados objetivos (opcional)" htmlFor="cv-dados">
              <textarea id="cv-dados" value={dados} onChange={e => setDados(e.target.value)} rows={3}
                placeholder="Sinais vitais, exames, medicamentos atuais, alergias."
                className={area} />
            </Field>

            {erro && (
              <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>
            )}

            <PxButton fullWidth leftIcon={Sparkles} loading={loading} disabled={loading || !relato.trim()} onClick={analisar}>
              {loading ? "Analisando caso" : "Analisar caso clínico"}
            </PxButton>
            {loading && <p className="text-center text-[12px] text-px-muted">O processamento pode levar até 30 segundos.</p>}
          </Panel>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-[16px] font-semibold text-px-ink">Análise gerada</h2>
              {nomePaciente && <Tag>{nomePaciente}</Tag>}
            </div>

            {SECOES.map(secao => {
              const texto = caso[secao.key]
              if (!texto) return null
              return (
                <SecaoCard key={secao.key} secao={secao} texto={texto} onUsarNoCopiloto={() => usarNoCopiloto(texto)} />
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
