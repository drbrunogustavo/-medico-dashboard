"use client"

import { useEffect, useMemo, useState } from "react"
import { useAppContext } from "@/components/AppProvider"
import { MessageCircle, Plus, Copy, Check, Sparkles, Download, FileSpreadsheet, Upload } from "lucide-react"
import { Panel, PxButton, Tag, Segmented, Field, PxInput, PxSelect, PxCheckbox, PxModal, PageHeader } from "@/components/px"
import { Toast, type ToastType } from "@/components/Toast"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Paciente {
  id:                          string
  nome:                        string
  telefone:                    string
  ultimo_contato?:             string
  motivo_saida?:               string
  status:                      string
  mensagem_gerada?:            string
  enviado_automaticamente?:    boolean
  enviado_automaticamente_em?: string
  sexo?:                       string | null
  data_nascimento?:            string | null
}

interface MsgCampanha {
  numero:    number
  titulo:    string
  intervalo: string
  texto:     string
}

interface Perfil {
  nome?:          string
  especialidade?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function diasInativos(ultimo?: string) {
  if (!ultimo) return 999
  return Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000)
}

function calcularIdade(dataNasc?: string | null): number | null {
  if (!dataNasc) return null
  const nasc = new Date(dataNasc)
  if (isNaN(nasc.getTime())) return null
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

type Tone = "neutral" | "danger" | "warn"

function urgenciaTag(dias: number): { label: string; tone: Tone } {
  if (dias >= 90) return { label: "Mais de 90 dias", tone: "neutral" }
  if (dias >= 60) return { label: "60 a 90 dias",    tone: "danger" }
  return                 { label: "30 a 60 dias",    tone: "warn" }
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <PxButton
      size="sm"
      variant="secondary"
      leftIcon={copied ? Check : Copy}
      aria-label={label}
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? "Copiado" : "Copiar"}
    </PxButton>
  )
}

// ─── Importar planilha ────────────────────────────────────────────────────────

interface ImportResult {
  importados:  number
  atualizados: number
  erros:       Array<{ nome: string; msg: string }>
}

function ImportarPlanilhaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<ImportResult | null>(null)
  const [erro,     setErro]     = useState("")

  async function handleFile(file: File) {
    setErro("")
    setResult(null)
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!["csv", "xlsx"].includes(ext)) {
      setErro("Formato não suportado. Use .csv ou .xlsx")
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res  = await fetch("/api/reativacao/importar-planilha", { method: "POST", body: fd })
      const data = await res.json() as ImportResult & { error?: string }
      if (!res.ok) { setErro(data.error ?? `Erro HTTP ${res.status}`); return }
      setResult(data)
      onSuccess()
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PxModal open onClose={onClose} title="Importar planilha" className="max-w-md">
      <div className="space-y-4">
        {!result && (
          <>
            <p className="text-[13px] text-px-muted">
              Importe pacientes inativos de uma planilha CSV ou Excel. Colunas reconhecidas: nome, telefone, ultimo_contato, motivo_saida (e variações em português ou inglês).
            </p>
            <input
              id="reat-arquivo"
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              disabled={loading}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ""
              }}
            />
            <label
              htmlFor="reat-arquivo"
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault()
                setDragging(false)
                const f = e.dataTransfer.files[0]
                if (f && !loading) handleFile(f)
              }}
              className={
                "flex cursor-pointer flex-col items-center gap-3 rounded-px-card border-2 border-dashed py-10 text-center " +
                (dragging ? "border-px-ink bg-px-ink/[0.06]" : "border-px-line hover:bg-px-ink/[0.04]") +
                (loading ? " opacity-60" : "")
              }
            >
              <Upload className="h-7 w-7 text-px-muted" aria-hidden />
              {loading ? (
                <span role="status" className="text-[14px] text-px-ink">Processando o arquivo</span>
              ) : (
                <>
                  <span className="text-[14px] font-medium text-px-ink">Arraste o arquivo aqui ou clique para escolher</span>
                  <span className="text-[12px] text-px-muted">.csv ou .xlsx</span>
                </>
              )}
            </label>
          </>
        )}

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}

        {result && (
          <div className="space-y-3">
            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: "Novos",       value: result.importados },
                { label: "Atualizados", value: result.atualizados },
                { label: "Erros",       value: result.erros.length },
              ].map(st => (
                <div key={st.label} className="rounded-px-card border border-px-line bg-white/50 p-3 text-center">
                  <dd className="text-[22px] font-semibold tabular-nums text-px-ink">{st.value}</dd>
                  <dt className="mt-0.5 text-[12px] text-px-muted">{st.label}</dt>
                </div>
              ))}
            </dl>
            {result.erros.length > 0 && (
              <ul className="max-h-36 overflow-y-auto rounded-px-card border border-px-line bg-white/50">
                {result.erros.map((e, i) => (
                  <li key={i} className="border-b border-px-line px-3 py-2 text-[12px] last:border-0">
                    <span className="font-semibold text-px-danger">{e.nome}:</span>{" "}
                    <span className="text-px-ink">{e.msg}</span>
                  </li>
                ))}
              </ul>
            )}
            <PxButton fullWidth onClick={onClose}>Fechar</PxButton>
          </div>
        )}
      </div>
    </PxModal>
  )
}

// ─── Adicionar paciente ───────────────────────────────────────────────────────

function AddModal({ onAdded, onClose }: { onAdded: () => void; onClose: () => void }) {
  const [nome,     setNome]     = useState("")
  const [telefone, setTelefone] = useState("")
  const [ultimo,   setUltimo]   = useState("")
  const [motivo,   setMotivo]   = useState("")
  const [sexo,     setSexo]     = useState("")
  const [dataNasc, setDataNasc] = useState("")
  const [saving,   setSaving]   = useState(false)
  const [erro,     setErro]     = useState("")

  async function salvar() {
    if (!nome.trim() || !telefone.trim()) return
    setSaving(true)
    setErro("")
    try {
      const r = await fetch("/api/reativacao", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          nome, telefone,
          ultimo_contato:  ultimo   || null,
          motivo_saida:    motivo   || null,
          sexo:            sexo     || null,
          data_nascimento: dataNasc || null,
        }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      onAdded()
    } catch (e) {
      console.error("[reativacao] erro ao adicionar paciente:", e)
      setErro("Não foi possível adicionar o paciente. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PxModal open onClose={onClose} title="Adicionar paciente inativo" className="max-w-sm">
      <div className="space-y-3">
        <Field label="Nome (obrigatório)" htmlFor="reat-nome">
          <PxInput id="reat-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do paciente" />
        </Field>
        <Field label="Telefone (obrigatório)" htmlFor="reat-tel">
          <PxInput id="reat-tel" type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
        </Field>
        <Field label="Último contato" htmlFor="reat-ultimo">
          <PxInput id="reat-ultimo" type="date" value={ultimo} onChange={e => setUltimo(e.target.value)} />
        </Field>
        <Field label="Motivo provável" htmlFor="reat-motivo">
          <PxInput id="reat-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: preço, esqueceu" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sexo" htmlFor="reat-sexo">
            <PxSelect id="reat-sexo" value={sexo} onChange={e => setSexo(e.target.value)}>
              <option value="">Não informado</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </PxSelect>
          </Field>
          <Field label="Nascimento" htmlFor="reat-nasc">
            <PxInput id="reat-nasc" type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} />
          </Field>
        </div>
        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
        <PxButton fullWidth leftIcon={Plus} loading={saving} disabled={saving || !nome.trim() || !telefone.trim()} onClick={salvar}>Adicionar</PxButton>
      </div>
    </PxModal>
  )
}

// ─── Campanha ─────────────────────────────────────────────────────────────────

function CampanhaModal({ pacientes, perfil, onClose }: { pacientes: Paciente[]; perfil: Perfil | null; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [msgs,    setMsgs]    = useState<MsgCampanha[]>([])
  const [error,   setError]   = useState("")

  async function gerar() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/reativacao/campanha", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pacientes: pacientes.map(p => ({
            nome:         p.nome,
            motivo_saida: p.motivo_saida,
            dias_inativo: diasInativos(p.ultimo_contato),
          })),
          nome_medico:   perfil?.nome          ?? "[seu nome]",
          especialidade: perfil?.especialidade ?? "[especialidade]",
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error ?? "Erro ao gerar a campanha"); return }
      setMsgs(data.mensagens ?? [])
    } catch (e) {
      console.error("[reativacao] erro ao gerar mensagens:", e)
      setError("Erro de conexão.")
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { gerar() }, [])

  return (
    <PxModal open onClose={onClose} title="Campanha de reativação" className="max-w-lg">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto">
        {loading && <p role="status" className="py-8 text-center text-[14px] text-px-ink">Gerando a sequência de mensagens.</p>}
        {error && (
          <div className="space-y-3">
            <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>
            <PxButton variant="secondary" onClick={gerar}>Tentar de novo</PxButton>
          </div>
        )}
        {msgs.length > 0 && (
          <>
            <p className="text-[13px] text-px-muted">Para {pacientes.length} {pacientes.length === 1 ? "paciente" : "pacientes"}. Substitua [NOME] pelo nome de cada um.</p>
            <ul className="space-y-3">
              {msgs.map(m => (
                <li key={m.numero} className="rounded-px-card border border-px-line bg-white/50 p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold text-px-ink">Mensagem {m.numero}: {m.titulo}</p>
                      <p className="text-[12px] text-px-muted">{m.intervalo}</p>
                    </div>
                    <CopyBtn text={m.texto} label={`Copiar mensagem ${m.numero}`} />
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-px-ink">{m.texto}</pre>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </PxModal>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

type FiltroInat  = "todos" | "30-60" | "60-90" | "90+"
type FiltroSexo  = "todos" | "M" | "F"
type FiltroFaixa = "todos" | "0-18" | "19-40" | "41-60" | "60+"

export default function ReativacaoPage() {
  const appCtx = useAppContext()

  const [pacientes,            setPacientes]            = useState<Paciente[]>([])
  const [loading,              setLoading]              = useState(true)
  const [loadErr,              setLoadErr]              = useState(false)
  const [showAdd,              setShowAdd]              = useState(false)
  const [showImportarPlanilha, setShowImportarPlanilha] = useState(false)
  const [selecionados,         setSelecionados]         = useState<string[]>([])
  const [gerandoMsg,           setGerandoMsg]           = useState<string | null>(null)
  const [showCampanha,         setShowCampanha]         = useState(false)
  const [importando,           setImportando]           = useState(false)
  const [importResult,         setImportResult]         = useState<{ importados: number; sem_telefone: number } | null>(null)
  const [importErro,           setImportErro]           = useState<string | null>(null)
  const [perfil,               setPerfil]               = useState<Perfil | null>(null)
  const [filtroInatividade,    setFiltroInatividade]    = useState<FiltroInat>("todos")
  const [filtroSexo,           setFiltroSexo]           = useState<FiltroSexo>("todos")
  const [filtroFaixaEtaria,    setFiltroFaixaEtaria]    = useState<FiltroFaixa>("todos")
  const [toast,                setToast]                = useState<string | null>(null)
  const [toastType,            setToastType]            = useState<ToastType>("success")

  function showToast(msg: string, type: ToastType = "success") {
    setToastType(type); setToast(msg); setTimeout(() => setToast(null), 3000)
  }

  async function carregar() {
    setLoading(true); setLoadErr(false)
    try {
      const r = await fetch("/api/reativacao")
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const pac = await r.json()
      setPacientes(Array.isArray(pac) ? pac : [])
    } catch (e) {
      console.error("[reativacao] erro ao carregar:", e)
      setLoadErr(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  useEffect(() => {
    setPerfil(appCtx?.perfil
      ? { nome: appCtx.perfil.nome ?? undefined, especialidade: appCtx.perfil.especialidade ?? undefined }
      : null
    )
  }, [appCtx?.perfil])

  async function refreshLista() {
    try {
      const r = await fetch("/api/reativacao")
      if (!r.ok) return
      const lista = await r.json()
      setPacientes(Array.isArray(lista) ? lista : [])
    } catch (e) {
      console.error("[reativacao] erro ao atualizar lista:", e)
    }
  }

  async function handleImportarMedx() {
    setImportando(true)
    setImportResult(null)
    setImportErro(null)
    try {
      const res = await fetch("/api/reativacao/importar-medx", { method: "POST" })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch { data = {} }
      if (!res.ok) {
        setImportErro((data.error as string) ?? `Erro HTTP ${res.status}`)
        return
      }
      setImportResult({ importados: Number(data.importados ?? 0), sem_telefone: Number(data.sem_telefone ?? 0) })
      await refreshLista()
    } catch (e) {
      setImportErro(e instanceof Error ? e.message : String(e))
    } finally {
      setImportando(false)
    }
  }

  async function gerarMensagem(p: Paciente) {
    setGerandoMsg(p.id)
    try {
      const res = await fetch("/api/reativacao", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action:         "gerar_mensagem",
          id:             p.id,
          nome:           p.nome,
          ultimo_contato: p.ultimo_contato,
          motivo_saida:   p.motivo_saida,
          nome_medico:    perfil?.nome,
          especialidade:  perfil?.especialidade,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.texto) throw new Error(data.error ?? "sem texto")
      setPacientes(prev => prev.map(x => x.id === p.id ? { ...x, mensagem_gerada: data.texto } : x))
    } catch (e) {
      console.error("[reativacao] erro ao gerar mensagem:", e)
      showToast(`Não foi possível gerar a mensagem de ${p.nome}`, "error")
    } finally {
      setGerandoMsg(null)
    }
  }

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter(p => {
      if (filtroInatividade !== "todos") {
        const d = diasInativos(p.ultimo_contato)
        if (filtroInatividade === "30-60" && !(d >= 30 && d < 60)) return false
        if (filtroInatividade === "60-90" && !(d >= 60 && d < 90)) return false
        if (filtroInatividade === "90+"   && d < 90)                return false
      }
      if (filtroSexo !== "todos" && p.sexo !== filtroSexo) return false
      if (filtroFaixaEtaria !== "todos") {
        const idade = calcularIdade(p.data_nascimento)
        if (idade === null)                                                  return false
        if (filtroFaixaEtaria === "0-18"  && idade > 18)                    return false
        if (filtroFaixaEtaria === "19-40" && !(idade >= 19 && idade <= 40)) return false
        if (filtroFaixaEtaria === "41-60" && !(idade >= 41 && idade <= 60)) return false
        if (filtroFaixaEtaria === "60+"   && idade <= 60)                   return false
      }
      return true
    })
  }, [pacientes, filtroInatividade, filtroSexo, filtroFaixaEtaria])

  const pacSelecionados = pacientes.filter(p => selecionados.includes(p.id))

  const cont = (fn: (p: Paciente) => boolean) => pacientes.filter(fn).length
  const idadeDe = (p: Paciente) => calcularIdade(p.data_nascimento)
  const optsInat: { value: FiltroInat; label: string }[] = [
    { value: "todos", label: `Todos (${pacientes.length})` },
    { value: "30-60", label: `30 a 60 dias (${cont(p => { const d = diasInativos(p.ultimo_contato); return d >= 30 && d < 60 })})` },
    { value: "60-90", label: `60 a 90 dias (${cont(p => { const d = diasInativos(p.ultimo_contato); return d >= 60 && d < 90 })})` },
    { value: "90+",   label: `Mais de 90 dias (${cont(p => diasInativos(p.ultimo_contato) >= 90)})` },
  ]
  const optsSexo: { value: FiltroSexo; label: string }[] = [
    { value: "todos", label: `Todos os sexos (${pacientes.length})` },
    { value: "M",     label: `Masculino (${cont(p => p.sexo === "M")})` },
    { value: "F",     label: `Feminino (${cont(p => p.sexo === "F")})` },
  ]
  const optsFaixa: { value: FiltroFaixa; label: string }[] = [
    { value: "todos", label: `Todas as idades (${pacientes.length})` },
    { value: "0-18",  label: `Até 18 anos (${cont(p => { const i = idadeDe(p); return i !== null && i <= 18 })})` },
    { value: "19-40", label: `19 a 40 anos (${cont(p => { const i = idadeDe(p); return i !== null && i >= 19 && i <= 40 })})` },
    { value: "41-60", label: `41 a 60 anos (${cont(p => { const i = idadeDe(p); return i !== null && i >= 41 && i <= 60 })})` },
    { value: "60+",   label: `Mais de 60 anos (${cont(p => { const i = idadeDe(p); return i !== null && i > 60 })})` },
  ]
  const hasSexo        = pacientes.some(p => p.sexo)
  const hasFaixaEtaria = pacientes.some(p => p.data_nascimento)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reativação"
        caption="Recuperar pacientes que não voltaram"
        actions={
          <div className="flex flex-wrap gap-2">
            {selecionados.length > 0 && (
              <PxButton leftIcon={Sparkles} onClick={() => setShowCampanha(true)}>Campanha ({selecionados.length})</PxButton>
            )}
            <PxButton variant="secondary" leftIcon={Download} loading={importando} disabled={importando} onClick={handleImportarMedx}>
              {importando ? "Importando" : "Importar do MedX"}
            </PxButton>
            <PxButton variant="secondary" leftIcon={FileSpreadsheet} onClick={() => setShowImportarPlanilha(true)}>Importar planilha</PxButton>
            <PxButton variant="secondary" leftIcon={Plus} onClick={() => setShowAdd(true)}>Adicionar</PxButton>
          </div>
        }
      />

      {showAdd && <AddModal onAdded={async () => { setShowAdd(false); await refreshLista(); showToast("Paciente adicionado") }} onClose={() => setShowAdd(false)} />}
      {showCampanha && <CampanhaModal pacientes={pacSelecionados} perfil={perfil} onClose={() => setShowCampanha(false)} />}
      {showImportarPlanilha && <ImportarPlanilhaModal onClose={() => setShowImportarPlanilha(false)} onSuccess={refreshLista} />}

      <div className="space-y-4 px-4 pb-10 md:px-10">
        {importErro && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-px-card bg-px-danger-soft px-4 py-3">
            <p className="text-[13px] text-px-danger">Erro ao importar: {importErro}</p>
            <PxButton size="sm" variant="quiet" onClick={() => setImportErro(null)}>Fechar</PxButton>
          </div>
        )}

        {importResult && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-px-card bg-px-ok-soft px-4 py-3">
            <p className="text-[13px] text-px-ok">
              <span className="font-semibold">{importResult.importados} {importResult.importados === 1 ? "paciente importado" : "pacientes importados"}</span> do MedX
              {importResult.sem_telefone > 0 && `. ${importResult.sem_telefone} ignorados por falta de telefone.`}
            </p>
            <PxButton size="sm" variant="quiet" onClick={() => setImportResult(null)}>Fechar</PxButton>
          </div>
        )}

        {loading ? (
          <div className="space-y-3" aria-busy="true">{[1, 2, 3].map(i => <div key={i} className="px-glass h-[88px] animate-pulse rounded-px-panel" />)}</div>
        ) : loadErr ? (
          <Panel tone="light" className="py-12 text-center">
            <p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar os pacientes inativos.</p>
            <div className="mt-4 flex justify-center"><PxButton variant="secondary" onClick={carregar}>Tentar de novo</PxButton></div>
          </Panel>
        ) : pacientes.length === 0 ? (
          <Panel tone="light" className="py-14 text-center">
            <p className="text-[14px] text-px-ink">Nenhum paciente inativo cadastrado.</p>
            <p className="mt-1 text-[13px] text-px-muted">Adicione manualmente ou importe do MedX ou de uma planilha.</p>
            <div className="mt-4 flex justify-center"><PxButton leftIcon={Plus} onClick={() => setShowAdd(true)}>Adicionar paciente</PxButton></div>
          </Panel>
        ) : (
          <>
            <Panel tone="light" className="space-y-3">
              <Segmented label="Filtrar por tempo de inatividade" value={filtroInatividade} onChange={v => { setFiltroInatividade(v); setSelecionados([]) }} options={optsInat} />
              {hasSexo && <div><Segmented label="Filtrar por sexo" value={filtroSexo} onChange={v => { setFiltroSexo(v); setSelecionados([]) }} options={optsSexo} /></div>}
              {hasFaixaEtaria && <div><Segmented label="Filtrar por faixa etária" value={filtroFaixaEtaria} onChange={v => { setFiltroFaixaEtaria(v); setSelecionados([]) }} options={optsFaixa} /></div>}
            </Panel>

            {pacientesFiltrados.length > 0 && (
              <PxCheckbox
                label={selecionados.length > 0 ? `${selecionados.length} ${selecionados.length === 1 ? "selecionado" : "selecionados"}` : "Selecionar todos para campanha"}
                checked={selecionados.length > 0 && pacientesFiltrados.every(p => selecionados.includes(p.id))}
                onChange={e => setSelecionados(e.target.checked ? pacientesFiltrados.map(p => p.id) : [])}
              />
            )}

            {pacientesFiltrados.length === 0 && (
              <Panel tone="light" className="py-10 text-center">
                <p className="text-[14px] text-px-ink">Nenhum paciente para os filtros selecionados.</p>
                <div className="mt-3 flex justify-center">
                  <PxButton variant="secondary" onClick={() => { setFiltroInatividade("todos"); setFiltroSexo("todos"); setFiltroFaixaEtaria("todos") }}>Limpar filtros</PxButton>
                </div>
              </Panel>
            )}

            <ul className="space-y-3">
              {pacientesFiltrados.map(p => {
                const dias        = diasInativos(p.ultimo_contato)
                const tag         = urgenciaTag(dias)
                const selecionado = selecionados.includes(p.id)
                const idade       = calcularIdade(p.data_nascimento)
                return (
                  <li key={p.id}>
                    <Panel tone="light" className={selecionado ? "ring-2 ring-px-ink" : undefined}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <PxCheckbox
                            label={p.nome}
                            checked={selecionado}
                            onChange={e => setSelecionados(prev => e.target.checked ? [...prev, p.id] : prev.filter(x => x !== p.id))}
                          />
                          <Tag tone={tag.tone}>{tag.label}</Tag>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <PxButton size="sm" variant="secondary" leftIcon={Sparkles} loading={gerandoMsg === p.id} disabled={gerandoMsg === p.id} aria-label={`Gerar mensagem para ${p.nome}`} onClick={() => gerarMensagem(p)}>
                            Gerar mensagem
                          </PxButton>
                          <PxButton size="sm" variant="secondary" leftIcon={MessageCircle} aria-label={`Abrir WhatsApp de ${p.nome}`} onClick={() => window.open(`https://wa.me/55${p.telefone.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer")}>
                            WhatsApp
                          </PxButton>
                        </div>
                      </div>

                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-px-muted">
                        <span>{p.telefone}</span>
                        {p.ultimo_contato && <span>Último contato: {new Date(p.ultimo_contato).toLocaleDateString("pt-BR")} ({dias} dias)</span>}
                        {p.sexo && <span>{p.sexo === "F" ? "Feminino" : "Masculino"}</span>}
                        {idade !== null && <span>{idade} anos</span>}
                        {p.motivo_saida && <span>Motivo: {p.motivo_saida}</span>}
                      </p>

                      {p.mensagem_gerada && (
                        <div className="mt-3 space-y-2">
                          {p.enviado_automaticamente ? (
                            <p className="rounded-px-card bg-px-ok-soft px-3 py-2 text-[12px] text-px-ok">
                              Enviado automaticamente via Z-API
                              {p.enviado_automaticamente_em && `, ${new Date(p.enviado_automaticamente_em).toLocaleString("pt-BR")}`}
                            </p>
                          ) : (
                            <p className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12px] text-px-warn">
                              Agendado para envio automático às 9h (horário de Brasília). Clicar em WhatsApp envia uma segunda mensagem, manual.
                            </p>
                          )}
                          <div className="rounded-px-card border border-px-line bg-white/50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[12px] font-semibold text-px-ink">Mensagem gerada</span>
                              <CopyBtn text={p.mensagem_gerada} label={`Copiar mensagem de ${p.nome}`} />
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-px-ink">{p.mensagem_gerada}</pre>
                          </div>
                        </div>
                      )}
                    </Panel>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      <Toast message={toast} type={toastType} />
    </div>
  )
}
