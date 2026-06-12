"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  FileHeart, Loader2, Copy, Check, AlertCircle, MessageCircle, RefreshCw,
} from "lucide-react"

type Tom = "Simples" | "Detalhado" | "Motivacional"

const TOM_OPTIONS: { value: Tom; label: string; desc: string }[] = [
  { value: "Simples",      label: "Simples",      desc: "Frases curtas, linguagem acessível" },
  { value: "Detalhado",    label: "Detalhado",     desc: "Explicações completas sobre cada achado" },
  { value: "Motivacional", label: "Motivacional",  desc: "Tom encorajador e empoderador" },
]

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
      if (data.error) throw new Error(data.error)
      setRelatorio(data.texto)
    } catch (e) {
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
    const texto = encodeURIComponent(`*Relatório de Exames — ${nome}*\n\n${relatorio}`)
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  const limpar = () => {
    setRelatorio(null); setError(null)
    setNome(""); setExames(""); setContexto(""); setConduta("")
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Relatório para Paciente"
        subtitle="COMUNICAÇÃO MÉDICA EMPÁTICA · LINGUAGEM SIMPLES · GERADO POR IA"
        actions={
          relatorio ? (
            <button
              onClick={limpar}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border transition-colors"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <RefreshCw className="w-3 h-3" /> Novo relatório
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-5 max-w-3xl mx-auto">

        {!relatorio ? (
          <>
            {/* Formulário */}
            <div className="rounded-2xl border p-5 space-y-4"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div>
                <h3 className="text-[13px] font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
                  Dados do Paciente e Exames
                </h3>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Preencha os campos e gere um relatório em linguagem simples para enviar ao paciente.
                </p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Nome do paciente *
                </label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Maria Oliveira"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-colors"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Exames */}
              <div>
                <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Resultados dos exames *
                </label>
                <textarea
                  value={exames}
                  onChange={e => setExames(e.target.value)}
                  placeholder={"TSH: 4,8 mUI/L (ref: 0,4–4,0)\nT4 livre: 1,0 ng/dL (normal)\nFerritina: 18 ng/mL (ref: 13–150)\nVitamina D: 22 ng/mL (ref: >30)\nHbA1c: 5,9% (ref: <5,7)"}
                  rows={6}
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] font-mono outline-none transition-colors resize-y"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Contexto e Conduta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Contexto clínico <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <textarea
                    value={contexto}
                    onChange={e => setContexto(e.target.value)}
                    placeholder="Ex: Paciente de 42 anos com queixa de fadiga há 3 meses, sem doenças prévias."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none transition-colors resize-y"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Conduta definida <span style={{ color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <textarea
                    value={conduta}
                    onChange={e => setConduta(e.target.value)}
                    placeholder="Ex: Iniciar levotiroxina 25mcg, repor vitamina D 10.000UI/dia, repetir exames em 3 meses."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none transition-colors resize-y"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>

              {/* Tom */}
              <div>
                <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Tom de comunicação
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TOM_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setTom(opt.value)}
                      className="text-left px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: tom === opt.value ? "var(--accent-dim)" : "var(--surface)",
                        border: `1px solid ${tom === opt.value ? "var(--accent-border)" : "var(--border)"}`,
                      }}
                    >
                      <div className="text-[12px] font-semibold"
                        style={{ color: tom === opt.value ? "var(--accent)" : "var(--text-primary)" }}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Button */}
              <button
                onClick={gerar}
                disabled={loading || !nome.trim() || !exames.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#080808" }}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando relatório...</>
                  : <><FileHeart className="w-4 h-4" /> Gerar Relatório para Paciente</>}
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl p-4 bg-red-950/40 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Resultado */}
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                    Relatório gerado para
                  </div>
                  <div className="text-[14px] font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                    {nome}
                  </div>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                  style={{ background: "var(--accent-dim)", borderColor: "var(--accent-border)", color: "var(--accent)" }}>
                  {tom}
                </span>
              </div>

              <div className="p-5">
                <p className="text-[13px] leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--text-secondary)" }}>
                  {relatorio}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copiar}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                style={{
                  background: copied ? "var(--accent-dim)" : "var(--surface)",
                  border: `1px solid ${copied ? "var(--accent-border)" : "var(--border)"}`,
                  color: copied ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado!" : "Copiar relatório"}
              </button>
              <button
                onClick={enviarWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all"
                style={{ background: "#25d366", color: "#fff" }}
              >
                <MessageCircle className="w-4 h-4" />
                Enviar por WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
