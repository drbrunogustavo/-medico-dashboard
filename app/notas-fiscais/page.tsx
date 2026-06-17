"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import {
  Receipt, Plus, Download, X, Loader2,
  AlertTriangle, CheckCircle2, Clock, Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotaFiscal {
  id: string
  numero_nf: string | null
  paciente_nome: string | null
  paciente_cpf: string | null
  valor: number
  descricao_servico: string | null
  status: "pendente" | "emitida" | "cancelada"
  url_pdf: string | null
  emitida_em: string | null
  created_at: string
}

interface ConfigFiscal {
  cnpj: string
  razao_social: string
  inscricao_municipal: string
  regime_tributario: string
  ativo: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = "#b8976a"

const STATUS_UI = {
  pendente:  { label: "Pendente",  cls: "bg-amber-500/10 text-amber-400 border-amber-500/25",      icon: Clock },
  emitida:   { label: "Emitida",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", cls: "bg-red-500/10 text-red-400 border-red-500/25",             icon: X },
} as const

const REGIME_OPTIONS = ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotasFiscaisPage() {
  const [tab,         setTab]        = useState<"notas" | "config">("notas")
  const [notas,       setNotas]      = useState<NotaFiscal[]>([])
  const [config,      setConfig]     = useState<Partial<ConfigFiscal>>({})
  const [loading,     setLoading]    = useState(true)
  const [showModal,   setShowModal]  = useState(false)

  // form
  const [formPaciente,  setFormPaciente]  = useState("")
  const [formCpf,       setFormCpf]       = useState("")
  const [formValor,     setFormValor]     = useState("")
  const [formDescricao, setFormDescricao] = useState("Consulta médica")
  const [saving,        setSaving]        = useState(false)

  // config save
  const [savingConfig, setSavingConfig] = useState(false)
  const [savedConfig,  setSavedConfig]  = useState(false)

  useEffect(() => {
    fetch("/api/notas-fiscais")
      .then(r => r.json())
      .then(d => {
        setNotas(d.notas  ?? [])
        setConfig(d.config ?? {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    await fetch("/api/notas-fiscais", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(config),
    })
    setSavingConfig(false)
    setSavedConfig(true)
    setTimeout(() => setSavedConfig(false), 2500)
  }

  const handleEmitir = async () => {
    if (!formPaciente.trim() || !formValor) return
    setSaving(true)
    const res  = await fetch("/api/notas-fiscais", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        paciente_nome:      formPaciente,
        paciente_cpf:       formCpf || null,
        valor:              parseFloat(formValor.replace(",", ".")),
        descricao_servico:  formDescricao,
      }),
    })
    const data = await res.json()
    if (data.nota) setNotas(prev => [data.nota as NotaFiscal, ...prev])
    setSaving(false)
    setShowModal(false)
    setFormPaciente(""); setFormCpf(""); setFormValor(""); setFormDescricao("Consulta médica")
  }

  const inputCls   = "w-full px-3 py-2 rounded-lg border text-[12px] bg-transparent outline-none transition-colors"
  const inputStyle = { borderColor: "var(--border)", color: "var(--text-primary)" }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Notas Fiscais"
        subtitle="EMISSÃO NFS-e · BETA"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold"
            style={{ background: "rgba(184,151,106,0.1)", border: "1px solid rgba(184,151,106,0.3)", color: GOLD }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova nota
          </button>
        }
      />

      <div className="p-6 max-w-4xl space-y-5">

        {/* Beta banner */}
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-xl border"
          style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-400 mb-0.5">
              Funcionalidade Beta — Em fase final de integração
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
              Você já pode registrar suas intenções de nota fiscal. A emissão real está sendo
              integrada com um emissor NFS-e certificado (Focus NFe / NFe.io). Você será
              notificado por email quando estiver disponível para emissão real.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
          {(["notas", "config"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: tab === t ? "var(--surface)" : "transparent",
                color:      tab === t ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow:  tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t === "notas"
                ? <><Receipt  className="w-3.5 h-3.5" /> Notas emitidas</>
                : <><Settings className="w-3.5 h-3.5" /> Configuração fiscal</>
              }
            </button>
          ))}
        </div>

        {/* ── Tab: Notas ── */}
        {tab === "notas" && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
              </div>
            ) : notas.length === 0 ? (
              <div className="text-center py-14">
                <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Nenhuma nota registrada
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  Clique em &quot;Nova nota&quot; para registrar sua primeira intenção de NFS-e
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                      {["Data","Paciente","Serviço","Valor","Status","Ações"].map(h => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-[10px] font-mono font-semibold tracking-[1.5px] uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notas.map(nf => {
                      const st     = STATUS_UI[nf.status] ?? STATUS_UI.pendente
                      const StIcon = st.icon
                      return (
                        <tr
                          key={nf.id}
                          className="border-b last:border-0 transition-colors"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <td className="px-4 py-3 text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>
                            {new Date(nf.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                              {nf.paciente_nome ?? "—"}
                            </p>
                            {nf.paciente_cpf && (
                              <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                                {nf.paciente_cpf}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[180px]">
                            <span
                              className="text-[12px] truncate block"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {nf.descricao_servico ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {nf.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                                st.cls
                              )}
                            >
                              <StIcon className="w-2.5 h-2.5" />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {nf.url_pdf ? (
                              <a
                                href={nf.url_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold"
                                style={{ color: GOLD }}
                              >
                                <Download className="w-3 h-3" /> PDF
                              </a>
                            ) : (
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Config ── */}
        {tab === "config" && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Dados fiscais da clínica
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Necessários para emissão de NFS-e quando a integração estiver ativa
              </p>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: "cnpj",               label: "CNPJ ou CPF",          ph: "00.000.000/0001-00" },
                { key: "razao_social",        label: "Razão Social / Nome",  ph: "Dr. João Silva Ltda" },
                { key: "inscricao_municipal", label: "Inscrição Municipal",  ph: "000000-0" },
              ].map(f => (
                <div key={f.key}>
                  <label
                    className="block text-[11px] font-mono mb-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {f.label}
                  </label>
                  <input
                    className={inputCls}
                    style={inputStyle}
                    placeholder={f.ph}
                    value={(config as Record<string,string>)[f.key] ?? ""}
                    onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                  />
                </div>
              ))}

              <div>
                <label
                  className="block text-[11px] font-mono mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Regime Tributário
                </label>
                <select
                  className={inputCls}
                  style={inputStyle}
                  value={config.regime_tributario ?? ""}
                  onChange={e => setConfig(c => ({ ...c, regime_tributario: e.target.value }))}
                >
                  <option value="">Selecione...</option>
                  {REGIME_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background:  savedConfig ? "rgba(16,185,129,0.1)"  : "rgba(184,151,106,0.1)",
                  border:     `1px solid ${savedConfig ? "rgba(16,185,129,0.25)" : "rgba(184,151,106,0.3)"}`,
                  color:       savedConfig ? "#10b981" : GOLD,
                }}
              >
                {savingConfig && <Loader2 className="w-3 h-3 animate-spin" />}
                {savedConfig ? "Configuração salva!" : savingConfig ? "Salvando..." : "Salvar configuração"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Modal: Nova nota ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Registrar nota fiscal
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Beta notice in modal */}
            <p className="text-[11px] px-3 py-2 rounded-lg" style={{ background: "rgba(251,191,36,0.06)", color: "#d97706", border: "1px solid rgba(251,191,36,0.2)" }}>
              O registro será salvo como &quot;Pendente&quot;. A emissão real estará disponível em breve.
            </p>

            {[
              { label: "Nome do Paciente *", val: formPaciente,  set: setFormPaciente,  ph: "João Silva" },
              { label: "CPF (opcional)",      val: formCpf,       set: setFormCpf,       ph: "000.000.000-00" },
              { label: "Valor (R$) *",        val: formValor,     set: setFormValor,     ph: "350,00" },
              { label: "Descrição do serviço *", val: formDescricao, set: setFormDescricao, ph: "Consulta médica" },
            ].map(f => (
              <div key={f.label}>
                <label
                  className="block text-[11px] font-mono mb-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {f.label}
                </label>
                <input
                  className={inputCls}
                  style={inputStyle}
                  placeholder={f.ph}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                />
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEmitir}
                disabled={saving || !formPaciente.trim() || !formValor}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, #b8976a, #d4af37)",
                  color:      "#fff",
                  opacity:    saving || !formPaciente.trim() || !formValor ? 0.6 : 1,
                }}
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Registrar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
