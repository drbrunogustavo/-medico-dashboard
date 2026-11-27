"use client"

import { useState } from "react"
import { FileHeart, Copy, Check, MessageCircle, RefreshCw } from "lucide-react"
import { Panel, PxButton, Tag, Segmented, Field, PxInput, PageHeader } from "@/components/px"

type Tom = "Simples" | "Detalhado" | "Motivacional"

const TOM_OPTIONS: { value: Tom; label: string; desc: string }[] = [
  { value: "Simples",      label: "Simples",      desc: "Frases curtas, linguagem acessível" },
  { value: "Detalhado",    label: "Detalhado",    desc: "Explicações completas sobre cada achado" },
  { value: "Motivacional", label: "Motivacional", desc: "Tom encorajador e empoderador" },
]

const areaCls = "w-full resize-y rounded-px-ctl border border-px-line bg-white/70 px-3.5 py-2.5 text-[14px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

export default function RelatorioPacientePage() {
  const [nome,     setNome]     = useState("")
  const [exames,   setExames]   = useState("")
  const [contexto, setContexto] = useState("")
  const [conduta,  setConduta]  = useState("")
  const [tom,      setTom]      = useState<Tom>("Motivacional")
  const [loading,  setLoading]  = useState(false)
  const [relatorio,setRelatorio]= useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [copied,   setCopied]   = useState(false)

  const gerar = async () => {
    if (!nome.trim() || !exames.trim()) return
    setLoading(true); setError(null); setRelatorio(null)
    try {
      const res  = await fetch("/api/relatorio-paciente", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nome, exames, contexto, conduta, tom }),
      })
      const data = await res.json()
      if (!res.ok || data.error || !data.texto) throw new Error(data.error ?? "resposta vazia")
      setRelatorio(data.texto)
    } catch (e) {
      console.error('[relatorio-paciente]', e)
      setError("Erro ao gerar relatório. Verifique sua conexão e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const copiar = () => {
    if (!relatorio) return
    navigator.clipboard.writeText(relatorio).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const enviarWhatsApp = () => {
    if (!relatorio) return
    const texto = encodeURIComponent(`*Relatório de exames de ${nome}*\n\n${relatorio}`)
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  const limpar = () => {
    setRelatorio(null); setError(null)
    setNome(""); setExames(""); setContexto(""); setConduta("")
  }

  const tomAtual = TOM_OPTIONS.find(o => o.value === tom)!

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Relatório para paciente"
        caption="Exames em linguagem simples"
        actions={relatorio ? <PxButton variant="secondary" leftIcon={RefreshCw} onClick={limpar}>Novo relatório</PxButton> : undefined}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        {!relatorio ? (
          <>
            <Panel tone="light" className="space-y-5">
              <p className="text-[13px] text-px-muted">Preencha os campos e gere um relatório em linguagem simples para enviar ao paciente.</p>

              <Field label="Nome do paciente (obrigatório)" htmlFor="rp-nome">
                <PxInput id="rp-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Maria Oliveira" />
              </Field>

              <Field label="Resultados dos exames (obrigatório)" htmlFor="rp-exames">
                <textarea
                  id="rp-exames"
                  value={exames}
                  onChange={e => setExames(e.target.value)}
                  placeholder={"TSH: 4,8 mUI/L (ref: 0,4 a 4,0)\nT4 livre: 1,0 ng/dL (normal)\nFerritina: 18 ng/mL (ref: 13 a 150)\nVitamina D: 22 ng/mL (ref: acima de 30)\nHbA1c: 5,9% (ref: abaixo de 5,7)"}
                  rows={6}
                  className={areaCls + " font-mono text-[13px]"}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Contexto clínico (opcional)" htmlFor="rp-ctx">
                  <textarea
                    id="rp-ctx"
                    value={contexto}
                    onChange={e => setContexto(e.target.value)}
                    placeholder="Ex: Paciente de 42 anos com queixa de fadiga há 3 meses, sem doenças prévias."
                    rows={3}
                    className={areaCls}
                  />
                </Field>
                <Field label="Conduta definida (opcional)" htmlFor="rp-cond">
                  <textarea
                    id="rp-cond"
                    value={conduta}
                    onChange={e => setConduta(e.target.value)}
                    placeholder="Ex: Iniciar levotiroxina 25mcg, repor vitamina D 10.000UI/dia, repetir exames em 3 meses."
                    rows={3}
                    className={areaCls}
                  />
                </Field>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-medium text-px-ink">Tom de comunicação</p>
                <Segmented label="Tom de comunicação" value={tom} onChange={setTom} options={TOM_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
                <p className="text-[12px] text-px-muted">{tomAtual.desc}</p>
              </div>

              <PxButton fullWidth leftIcon={FileHeart} loading={loading} disabled={loading || !nome.trim() || !exames.trim()} onClick={gerar}>
                {loading ? "Gerando relatório" : "Gerar relatório para paciente"}
              </PxButton>
              {loading && (
                <p role="status" className="text-center text-[12px] text-px-muted">A geração pode levar de 30 a 60 segundos. Não feche a página.</p>
              )}
            </Panel>

            {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] leading-relaxed text-px-danger">{error}</p>}
          </>
        ) : (
          <>
            <Panel tone="light" className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-px-line pb-3">
                <div>
                  <p className="text-[12px] text-px-muted">Relatório gerado para</p>
                  <h2 className="mt-0.5 text-[16px] font-semibold text-px-ink">{nome}</h2>
                </div>
                <Tag tone="neutral">{tom}</Tag>
              </div>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-px-ink">{relatorio}</p>
            </Panel>

            <div className="flex flex-col gap-3 sm:flex-row">
              <PxButton fullWidth variant="secondary" leftIcon={copied ? Check : Copy} onClick={copiar}>{copied ? "Copiado" : "Copiar relatório"}</PxButton>
              <PxButton fullWidth leftIcon={MessageCircle} onClick={enviarWhatsApp}>Enviar por WhatsApp</PxButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
