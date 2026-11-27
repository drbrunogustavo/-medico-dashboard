"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Download } from "lucide-react"
import { Panel, PxButton, Segmented, Field, PxInput, PxSelect, PxModal, Tag, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_UI = {
  pendente:  { label: "Pendente",  tone: "warn"   },
  emitida:   { label: "Emitida",   tone: "ok"     },
  cancelada: { label: "Cancelada", tone: "danger" },
} as const

const REGIME_OPTIONS = ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"]

const CAMPOS_CONFIG = [
  { key: "cnpj",                label: "CNPJ ou CPF",         ph: "00.000.000/0001-00" },
  { key: "razao_social",        label: "Razão social ou nome", ph: "Dr. João Silva Ltda" },
  { key: "inscricao_municipal", label: "Inscrição municipal", ph: "000000-0" },
] as const

/** Aceita "350", "350,50", "1.250,00", "R$ 1.250,00" e "1250.50". Retorna null se não for um valor positivo. */
function parseValorBR(txt: string): number | null {
  const limpo = txt.replace(/R\$/gi, "").replace(/\s/g, "")
  if (!limpo) return null
  const normal = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo
  const n = Number(normal)
  return Number.isFinite(n) && n > 0 ? n : null
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NotasFiscaisPage() {
  const [tab,       setTab]       = useState<"notas" | "config">("notas")
  const [notas,     setNotas]     = useState<NotaFiscal[]>([])
  const [config,    setConfig]    = useState<Partial<ConfigFiscal>>({})
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [formPaciente,  setFormPaciente]  = useState("")
  const [formCpf,       setFormCpf]       = useState("")
  const [formValor,     setFormValor]     = useState("")
  const [formDescricao, setFormDescricao] = useState("Consulta médica")
  const [saving,        setSaving]        = useState(false)
  const [erroNota,      setErroNota]      = useState("")

  const [savingConfig, setSavingConfig] = useState(false)
  const [savedConfig,  setSavedConfig]  = useState(false)
  const [erroConfig,   setErroConfig]   = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setLoadError(false)
    try {
      const res = await fetch("/api/notas-fiscais")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      setNotas(d.notas ?? [])
      setConfig(d.config ?? {})
    } catch (e) {
      console.error("[notas-fiscais] erro ao carregar:", e)
      setLoadError(true)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const handleSaveConfig = async () => {
    setSavingConfig(true); setErroConfig(""); setSavedConfig(false)
    try {
      const res = await fetch("/api/notas-fiscais", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(config),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSavedConfig(true)
      setTimeout(() => setSavedConfig(false), 2500)
    } catch (e) {
      console.error("[notas-fiscais] erro ao salvar configuração:", e)
      setErroConfig("Não foi possível salvar a configuração. Tente novamente.")
    } finally { setSavingConfig(false) }
  }

  const valorNumerico = parseValorBR(formValor)
  const podeRegistrar = !!formPaciente.trim() && valorNumerico !== null && !!formDescricao.trim()

  const fecharModal = () => { setShowModal(false); setErroNota("") }

  const handleEmitir = async () => {
    if (!podeRegistrar || valorNumerico === null) return
    setSaving(true); setErroNota("")
    try {
      const res = await fetch("/api/notas-fiscais", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          paciente_nome:     formPaciente.trim(),
          paciente_cpf:      formCpf || null,
          valor:             valorNumerico,
          descricao_servico: formDescricao.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.nota) throw new Error(data.error ?? `HTTP ${res.status}`)
      setNotas(prev => [data.nota as NotaFiscal, ...prev])
      setShowModal(false)
      setFormPaciente(""); setFormCpf(""); setFormValor(""); setFormDescricao("Consulta médica")
    } catch (e) {
      console.error("[notas-fiscais] erro ao registrar nota:", e)
      setErroNota("Não foi possível registrar a nota. Os dados foram mantidos, tente novamente.")
    } finally { setSaving(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notas Fiscais"
        caption="Registro de NFS-e, em beta"
        actions={<PxButton onClick={() => setShowModal(true)} leftIcon={Plus}>Nova nota</PxButton>}
      />

      <div className="max-w-4xl space-y-4 px-4 pb-10 md:px-10">
        <p role="note" className="rounded-px-card bg-px-warn-soft px-4 py-3 text-[13px] leading-relaxed text-px-ink">
          <span className="font-semibold">Funcionalidade em beta.</span>{" "}
          Você já pode registrar suas notas, mas a emissão real depende da integração com um emissor de NFS-e certificado, ainda em fase final. Avisaremos por e-mail quando estiver disponível.
        </p>

        <Segmented
          label="Seção"
          value={tab}
          onChange={setTab}
          options={[{ value: "notas", label: "Notas registradas" }, { value: "config", label: "Configuração fiscal" }]}
        />

        {tab === "notas" && (
          <Panel className="overflow-hidden p-0">
            {loading ? (
              <p role="status" className="py-12 text-center text-[13px] text-px-muted">Carregando notas</p>
            ) : loadError ? (
              <div className="py-12 text-center">
                <p role="alert" className="mb-3 text-[14px] font-semibold text-px-ink">Não foi possível carregar as notas</p>
                <PxButton variant="secondary" onClick={carregar}>Tentar de novo</PxButton>
              </div>
            ) : notas.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[14px] font-semibold text-px-ink">Nenhuma nota registrada</p>
                <p className="mb-4 mt-1 text-[13px] text-px-muted">Registre a primeira nota para acompanhar o status por aqui.</p>
                <PxButton onClick={() => setShowModal(true)} leftIcon={Plus}>Nova nota</PxButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead>
                    <tr className="border-b border-px-ink/10 text-[12px] text-px-muted">
                      <th scope="col" className="px-4 py-3 font-medium">Data</th>
                      <th scope="col" className="px-3 py-3 font-medium">Paciente</th>
                      <th scope="col" className="px-3 py-3 font-medium">Serviço</th>
                      <th scope="col" className="px-3 py-3 text-right font-medium">Valor</th>
                      <th scope="col" className="px-3 py-3 font-medium">Situação</th>
                      <th scope="col" className="px-4 py-3 font-medium">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-px-ink/10">
                    {notas.map(nf => {
                      const st = STATUS_UI[nf.status] ?? STATUS_UI.pendente
                      return (
                        <tr key={nf.id}>
                          <td className="px-4 py-3 text-[13px] text-px-muted">{new Date(nf.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="px-3 py-3">
                            <p className="text-[13.5px] font-medium text-px-ink">{nf.paciente_nome ?? "Sem nome"}</p>
                            {nf.paciente_cpf && <p className="text-[12px] text-px-muted">{nf.paciente_cpf}</p>}
                          </td>
                          <td className="max-w-[180px] px-3 py-3"><span className="block truncate text-[13px] text-px-ink/80">{nf.descricao_servico ?? "Sem descrição"}</span></td>
                          <td className="px-3 py-3 text-right text-[13.5px] font-semibold text-px-ink">{nf.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                          <td className="px-3 py-3"><Tag tone={st.tone}>{st.label}</Tag></td>
                          <td className="px-4 py-3">
                            {nf.url_pdf ? (
                              <a href={nf.url_pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold text-px-accent underline underline-offset-2">
                                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Baixar
                              </a>
                            ) : (
                              <span className="text-[12.5px] text-px-muted">Não disponível</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        {tab === "config" && (
          <Panel className="space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold text-px-ink">Dados fiscais da clínica</h2>
              <p className="mt-0.5 text-[12.5px] text-px-muted">Necessários para emitir NFS-e quando a integração estiver ativa.</p>
            </div>
            {CAMPOS_CONFIG.map(f => (
              <Field key={f.key} label={f.label} htmlFor={`cfg-${f.key}`}>
                <PxInput id={`cfg-${f.key}`} placeholder={f.ph} value={(config as Record<string, string>)[f.key] ?? ""} onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))} />
              </Field>
            ))}
            <Field label="Regime tributário" htmlFor="cfg-regime">
              <PxSelect id="cfg-regime" value={config.regime_tributario ?? ""} onChange={e => setConfig(c => ({ ...c, regime_tributario: e.target.value }))}>
                <option value="">Selecione</option>
                {REGIME_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </PxSelect>
            </Field>
            {erroConfig && <p role="alert" className="text-[13px] text-px-danger">{erroConfig}</p>}
            <div className="flex items-center gap-3">
              <PxButton onClick={handleSaveConfig} loading={savingConfig}>{savingConfig ? "Salvando" : "Salvar configuração"}</PxButton>
              {savedConfig && <span role="status" className="text-[13px] font-medium text-px-ink">Configuração salva</span>}
            </div>
          </Panel>
        )}
      </div>

      <PxModal open={showModal} onClose={fecharModal} title="Registrar nota fiscal" className="max-w-md">
        <div className="space-y-4">
          <p role="note" className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-ink">
            O registro é salvo como Pendente. A emissão real estará disponível em breve.
          </p>
          <Field label="Nome do paciente" htmlFor="nf-pac"><PxInput id="nf-pac" placeholder="João Silva" value={formPaciente} onChange={e => setFormPaciente(e.target.value)} /></Field>
          <Field label="CPF (opcional)" htmlFor="nf-cpf"><PxInput id="nf-cpf" placeholder="000.000.000-00" value={formCpf} onChange={e => setFormCpf(e.target.value)} /></Field>
          <Field label="Valor (R$)" htmlFor="nf-valor" error={formValor && valorNumerico === null ? "Informe um valor maior que zero, como 350,00." : undefined}>
            <PxInput id="nf-valor" inputMode="decimal" placeholder="350,00" value={formValor} onChange={e => setFormValor(e.target.value)} />
          </Field>
          <Field label="Descrição do serviço" htmlFor="nf-desc"><PxInput id="nf-desc" placeholder="Consulta médica" value={formDescricao} onChange={e => setFormDescricao(e.target.value)} /></Field>
          {erroNota && <p role="alert" className="text-[13px] text-px-danger">{erroNota}</p>}
          <div className="flex gap-2 pt-1">
            <PxButton variant="secondary" fullWidth onClick={fecharModal}>Cancelar</PxButton>
            <PxButton fullWidth onClick={handleEmitir} loading={saving} disabled={!podeRegistrar}>Registrar nota</PxButton>
          </div>
        </div>
      </PxModal>
    </div>
  )
}
