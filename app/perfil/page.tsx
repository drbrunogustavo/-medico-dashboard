"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, RefreshCw, Upload, Trash2 } from "lucide-react"
import { Panel, PxButton, PxInput, PxSelect, Segmented, Field, Tag, PageHeader, CopyButton } from "@/components/px"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

const ESPECIALIDADES = [
  "Cardiologia", "Cirurgia Plástica", "Dermatologia", "Endocrinologia",
  "Gastroenterologia", "Geriatria", "Ginecologia e Obstetrícia", "Infectologia",
  "Medicina de Família", "Medicina do Trabalho", "Medicina Estética", "Neurologia",
  "Nutrologia", "Oftalmologia", "Oncologia", "Ortopedia",
  "Otorrinolaringologia", "Pediatria", "Pneumologia", "Psiquiatria",
  "Reumatologia", "Urologia", "Outra",
]
const TIPOGRAFIAS = ["Montserrat", "Playfair Display", "Inter", "Poppins", "Lato"]
const TONS_VOZ = [
  { v: "profissional", l: "Profissional" },
  { v: "empatico", l: "Empático" },
  { v: "cientifico", l: "Científico" },
  { v: "motivacional", l: "Motivacional" },
  { v: "educativo", l: "Educativo" },
]
const MAX_BYTES = 5 * 1024 * 1024
const HEX = /^#[0-9a-fA-F]{6}$/

interface MarcaAsset { id: string; arquivo_url: string; nome_arquivo: string | null; tamanho_bytes: number | null; criado_em: string }

interface PerfilForm {
  nome: string; especialidade: string; crm: string; cidade: string; instagram: string
  publico_alvo: string; diferencial: string; avatar_url: string; marca_logo_url: string
  marca_cor_primaria: string; marca_cor_secundaria: string; marca_cor_fundo: string
  marca_tipografia: string; marca_slogan: string; marca_tom_voz: string
}

const EMPTY: PerfilForm = {
  nome: "", especialidade: "", crm: "", cidade: "", instagram: "", publico_alvo: "", diferencial: "",
  avatar_url: "", marca_logo_url: "",
  marca_cor_primaria: "#b8976a", marca_cor_secundaria: "#0D1B2A", marca_cor_fundo: "#1a1a2e",
  marca_tipografia: "Montserrat", marca_slogan: "", marca_tom_voz: "profissional",
}

type Aba = "perfil" | "marca" | "integracoes"
type Status = "idle" | "saving" | "saved" | "error"
interface IntegStatus { medx: boolean; zapi: boolean; instagram: boolean; stripe: boolean }

const INTEGRACOES = [
  { key: "medx", label: "MedX CRM", desc: "Prontuários e gestão de pacientes via API MedX", vars: "MEDX_URL + MEDX_INTEGRATION_TOKEN" },
  { key: "zapi", label: "Z-API (WhatsApp)", desc: "Envio automático de mensagens via WhatsApp Business", vars: "ZAPI_INSTANCE_ID + ZAPI_TOKEN" },
  { key: "instagram", label: "Meta e Instagram", desc: "Leitura de métricas e publicações via Instagram Graph API", vars: "META_ACCESS_TOKEN + META_IG_USER_ID" },
  { key: "stripe", label: "Stripe (pagamentos)", desc: "Gestão de assinaturas e planos via Stripe", vars: "STRIPE_SECRET_KEY + STRIPE_PRICE_*" },
] as const

const textareaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline focus:outline-2 focus:outline-px-ink/40"

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const valido = HEX.test(value)
  return (
    <Field label={label} htmlFor={id} error={valido ? undefined : "Use o formato #RRGGBB, por exemplo #b8976a."}>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`Seletor de cor: ${label}`} value={valido ? value : "#000000"} onChange={e => onChange(e.target.value)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-px-ctl border border-px-line bg-white p-1" />
        <PxInput id={id} value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" maxLength={7} className="font-mono" />
      </div>
    </Field>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const [form, setForm] = useState<PerfilForm>(EMPTY)
  const [status, setStatus] = useState<Status>("idle")
  const [loading, setLoading] = useState(true)
  const [loadErro, setLoadErro] = useState(false)
  const [aba, setAba] = useState<Aba>("perfil")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [integStatus, setIntegStatus] = useState<IntegStatus | null>(null)
  const [integErro, setIntegErro] = useState(false)
  const [imagens, setImagens] = useState<MarcaAsset[]>([])
  const [loadingImagens, setLoadingImagens] = useState(false)
  const [imagensErro, setImagensErro] = useState<string | null>(null)
  const [uploadingImagens, setUploadingImagens] = useState(false)
  const [uploadResumo, setUploadResumo] = useState<string | null>(null)
  const [confirmaImg, setConfirmaImg] = useState<string | null>(null)
  const [confirmaOnb, setConfirmaOnb] = useState(false)
  const [onbErro, setOnbErro] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const imagensRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setLoadErro(false)
    try {
      const r = await fetch("/api/perfil")
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json() as Partial<PerfilForm> | null
      if (d) setForm(Object.fromEntries((Object.keys(EMPTY) as (keyof PerfilForm)[]).map(k => [k, d[k] ?? EMPTY[k]])) as unknown as PerfilForm)
    } catch (e) {
      console.error("[perfil] erro ao carregar:", e)
      setLoadErro(true)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const loadImagens = useCallback(async () => {
    setLoadingImagens(true); setImagensErro(null)
    try {
      const res = await fetch("/api/marca-assets")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setImagens(await res.json())
    } catch (e) {
      console.error("[perfil] erro ao carregar imagens:", e)
      setImagensErro("Não foi possível carregar o banco de imagens.")
    } finally { setLoadingImagens(false) }
  }, [])
  useEffect(() => { if (aba === "marca") loadImagens() }, [aba, loadImagens])

  const loadInteg = useCallback(() => {
    setIntegErro(false)
    fetch("/api/integrations/status")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: IntegStatus) => setIntegStatus(d))
      .catch(e => { console.error("[perfil] erro ao carregar status de integrações:", e); setIntegErro(true) })
  }, [])
  useEffect(() => { if (aba === "integracoes" && !integStatus) loadInteg() }, [aba, integStatus, loadInteg])

  const set = (k: keyof PerfilForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function patch(corpo: Partial<PerfilForm> | { onboarding_completo: boolean }) {
    const r = await fetch("/api/perfil", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) })
    return r.ok
  }

  const coresOk = HEX.test(form.marca_cor_primaria) && HEX.test(form.marca_cor_secundaria) && HEX.test(form.marca_cor_fundo)

  async function save() {
    setSaveError(null)
    if (!coresOk) { setSaveError("Corrija as cores do kit de marca (formato #RRGGBB) antes de salvar."); setAba("marca"); return }
    setStatus("saving")
    try {
      if (!(await patch(form))) throw new Error("falha")
      setStatus("saved"); setTimeout(() => setStatus("idle"), 3000)
    } catch (e) {
      console.error("[perfil] erro ao salvar perfil:", e)
      setStatus("error"); setSaveError("Não foi possível salvar. Suas alterações continuam na tela. Tente novamente.")
    }
  }

  async function refazerOnboarding() {
    setOnbErro(null)
    try {
      if (!(await patch({ onboarding_completo: false }))) throw new Error("falha")
      router.push("/onboarding")
    } catch (e) {
      console.error("[perfil] erro ao reiniciar onboarding:", e)
      setOnbErro("Não foi possível reiniciar o onboarding. Tente novamente."); setConfirmaOnb(false)
    }
  }

  async function removerCampo(k: "avatar_url" | "marca_logo_url", setErr: (m: string | null) => void) {
    setErr(null)
    try {
      if (!(await patch({ [k]: "" }))) throw new Error("falha")
      setForm(f => ({ ...f, [k]: "" }))
    } catch (e) {
      console.error("[perfil] erro ao remover imagem:", e)
      setErr("Não foi possível remover. Tente novamente.")
    }
  }

  async function enviarImagemUnica(e: React.ChangeEvent<HTMLInputElement>, o: {
    campo: "avatar_url" | "marca_logo_url"; pasta: (uid: string) => string; tipos: (t: string) => boolean
    msgTipo: string; setBusy: (b: boolean) => void; setErr: (m: string | null) => void; ref: React.RefObject<HTMLInputElement | null>; versionar: boolean
  }) {
    const file = e.target.files?.[0]
    if (!file) return
    o.setErr(null)
    if (!o.tipos(file.type)) { o.setErr(o.msgTipo); if (o.ref.current) o.ref.current.value = ""; return }
    if (file.size > MAX_BYTES) { o.setErr("Arquivo muito grande. O máximo é 5 MB."); if (o.ref.current) o.ref.current.value = ""; return }
    o.setBusy(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("não autenticado")
      const ext = file.name.split(".").pop() ?? "png"
      const path = o.pasta(user.id).replace("{ext}", ext)
      const { data, error } = await supabase.storage.from("perfil-assets").upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from("perfil-assets").getPublicUrl(data.path)
      // O caminho do avatar é fixo; o parâmetro evita mostrar a foto antiga em cache
      const url = o.versionar ? `${publicUrl}?v=${Date.now()}` : publicUrl
      if (!(await patch({ [o.campo]: url }))) throw new Error("Erro ao salvar no perfil")
      setForm(f => ({ ...f, [o.campo]: url }))
    } catch (err) {
      console.error("[perfil] erro no upload:", err)
      o.setErr("Não foi possível enviar a imagem. Tente novamente.")
    } finally {
      o.setBusy(false)
      if (o.ref.current) o.ref.current.value = ""
    }
  }

  const uploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => enviarImagemUnica(e, {
    campo: "avatar_url", pasta: uid => `avatars/${uid}/photo`, tipos: t => t.startsWith("image/"),
    msgTipo: "Selecione um arquivo de imagem (JPG, PNG ou WEBP).", setBusy: setUploadingAvatar, setErr: setAvatarError, ref: avatarRef, versionar: true,
  })
  const uploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => enviarImagemUnica(e, {
    campo: "marca_logo_url", pasta: () => `logos/${Date.now()}.{ext}`, tipos: t => /^image\/(png|svg\+xml|jpeg|webp)$/.test(t),
    msgTipo: "Use PNG, SVG, JPG ou WEBP.", setBusy: setUploadingLogo, setErr: setLogoError, ref: logoRef, versionar: false,
  })

  async function uploadImagens(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingImagens(true); setUploadResumo(null)
    let ok = 0; let falhas = 0
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("não autenticado")
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_BYTES) { falhas++; continue }
        const ext = file.name.split(".").pop() ?? "jpg"
        const path = `imagens/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: up, error } = await supabase.storage.from("perfil-assets").upload(path, file, { upsert: false, contentType: file.type })
        if (error) { falhas++; continue }
        const { data: { publicUrl } } = supabase.storage.from("perfil-assets").getPublicUrl(up.path)
        const saved = await fetch("/api/marca-assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ arquivo_url: publicUrl, nome_arquivo: file.name, tamanho_bytes: file.size }) })
        if (saved.ok) { const asset: MarcaAsset = await saved.json(); setImagens(prev => [asset, ...prev]); ok++ } else falhas++
      }
    } catch (err) {
      console.error("[perfil] erro no envio de imagens:", err)
      falhas = files.length - ok
    } finally {
      setUploadingImagens(false)
      if (imagensRef.current) imagensRef.current.value = ""
      setUploadResumo(`${ok} ${ok === 1 ? "imagem enviada" : "imagens enviadas"}${falhas ? `, ${falhas} ${falhas === 1 ? "não foi enviada" : "não foram enviadas"} (formato não aceito, acima de 5 MB ou erro de envio)` : ""}.`)
    }
  }

  async function excluirImagem(id: string) {
    if (confirmaImg !== id) { setConfirmaImg(id); return }
    setConfirmaImg(null); setImagensErro(null)
    try {
      const r = await fetch(`/api/marca-assets/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setImagens(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      console.error("[perfil] erro ao excluir imagem:", e)
      setImagensErro("Não foi possível excluir a imagem. Tente novamente.")
    }
  }

  const initials = form.nome ? form.nome.replace(/^Dr\.?\s*/i, "").slice(0, 2).toUpperCase() : "EU"
  const rotuloSalvar = status === "saving" ? "Salvando" : status === "saved" ? "Salvo" : status === "error" ? "Tentar salvar de novo" : "Salvar"

  const avatar = (size: "sm" | "lg") => (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-px-ink/10 font-semibold text-px-ink ${size === "lg" ? "h-20 w-20 text-[26px]" : "h-16 w-16 text-[21px]"}`}>
      {form.avatar_url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={form.avatar_url} alt="Foto de perfil" className="h-full w-full object-cover" />
        : <span aria-hidden="true">{initials}</span>}
    </div>
  )

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Meu perfil" caption="Dados, foto e identidade visual" />
        <p role="status" className="px-4 py-16 text-center text-[13px] text-px-muted md:px-10">Carregando perfil</p>
      </div>
    )
  }
  if (loadErro) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Meu perfil" caption="Dados, foto e identidade visual" />
        <div className="px-4 md:px-10"><Panel className="space-y-3 py-10 text-center">
          <p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar o perfil. Nada foi alterado.</p>
          <div><PxButton onClick={load}>Tentar novamente</PxButton></div>
        </Panel></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Meu perfil" caption="Dados, foto e identidade visual"
        actions={<PxButton leftIcon={Save} loading={status === "saving"} variant={status === "saved" ? "secondary" : "primary"} onClick={save}>{rotuloSalvar}</PxButton>} />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Seção do perfil" value={aba} onChange={setAba}
          options={[{ value: "perfil", label: "Perfil" }, { value: "marca", label: "Kit de marca" }, { value: "integracoes", label: "Integrações" }]} />

        <p role={status === "saved" ? "status" : undefined} className="sr-only">{status === "saved" ? "Perfil salvo" : ""}</p>
        {saveError && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{saveError}</p>}

        {aba === "perfil" && (
          <>
            <Panel as="section" className="flex items-center gap-4">
              {avatar("sm")}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold text-px-ink">{form.nome || "Seu nome aparecerá aqui"}</p>
                <p className="text-[13px] text-px-muted">{form.especialidade || "Especialidade"}{form.cidade ? `, ${form.cidade}` : ""}</p>
              </div>
            </Panel>

            <Panel as="section" className="space-y-4">
              <h2 className="text-[15px] font-semibold text-px-ink">Dados profissionais</h2>
              <Field label="Nome completo" htmlFor="p-nome"><PxInput id="p-nome" value={form.nome} onChange={set("nome")} placeholder="Dr. João Silva" /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Especialidade" htmlFor="p-esp">
                  <PxSelect id="p-esp" value={form.especialidade} onChange={set("especialidade")}>
                    <option value="">Selecionar</option>
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </PxSelect>
                </Field>
                <Field label="CRM" htmlFor="p-crm"><PxInput id="p-crm" value={form.crm} onChange={set("crm")} placeholder="CRM/SP 123456" /></Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Cidade" htmlFor="p-cidade"><PxInput id="p-cidade" value={form.cidade} onChange={set("cidade")} placeholder="São Paulo, SP" /></Field>
                <Field label="Instagram" htmlFor="p-ig"><PxInput id="p-ig" value={form.instagram} onChange={set("instagram")} placeholder="@drjoaosilva" /></Field>
              </div>
            </Panel>

            <Panel as="section" className="space-y-4">
              <h2 className="text-[15px] font-semibold text-px-ink">Estratégia de conteúdo</h2>
              <Field label="Público-alvo" htmlFor="p-publico" hint="Usado pelas ferramentas de IA para adequar o conteúdo.">
                <textarea id="p-publico" value={form.publico_alvo} onChange={set("publico_alvo")} rows={3} className={textareaCls} placeholder="Ex.: mulheres de 30 a 50 anos interessadas em saúde hormonal e qualidade de vida" />
              </Field>
              <Field label="Diferencial e posicionamento" htmlFor="p-dif">
                <textarea id="p-dif" value={form.diferencial} onChange={set("diferencial")} rows={3} className={textareaCls} placeholder="Ex.: medicina integrativa com foco em prevenção e longevidade" />
              </Field>
            </Panel>

            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Foto de perfil</h2>
              <div className="flex items-center gap-4">
                {avatar("lg")}
                <div className="flex flex-col items-start gap-2">
                  <PxButton variant="secondary" leftIcon={Upload} loading={uploadingAvatar} onClick={() => avatarRef.current?.click()}>{uploadingAvatar ? "Enviando" : form.avatar_url ? "Trocar foto" : "Enviar foto"}</PxButton>
                  {form.avatar_url && <PxButton variant="quiet" size="sm" onClick={() => removerCampo("avatar_url", setAvatarError)}>Remover foto</PxButton>}
                </div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" aria-label="Selecionar foto de perfil" onChange={uploadAvatar} />
              <p className="text-[12.5px] text-px-muted">JPG, PNG ou WEBP, máximo 5 MB. A foto é salva assim que o envio termina.</p>
              {avatarError && <p role="alert" className="text-[13px] text-px-danger">{avatarError}</p>}
            </Panel>

            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Refazer onboarding</h2>
              <p className="text-[13px] text-px-muted">Reinicia o assistente de configuração inicial. Seus dados atuais continuam salvos até você concluir o novo.</p>
              {confirmaOnb ? (
                <div className="flex flex-wrap items-center gap-2">
                  <PxButton variant="danger" leftIcon={RefreshCw} onClick={refazerOnboarding}>Confirmar e refazer</PxButton>
                  <PxButton variant="quiet" onClick={() => setConfirmaOnb(false)}>Cancelar</PxButton>
                </div>
              ) : <PxButton variant="secondary" leftIcon={RefreshCw} onClick={() => setConfirmaOnb(true)}>Refazer onboarding</PxButton>}
              {onbErro && <p role="alert" className="text-[13px] text-px-danger">{onbErro}</p>}
            </Panel>
          </>
        )}

        {aba === "integracoes" && (
          <section className="space-y-3" aria-label="Integrações">
            <p className="text-[13px] text-px-muted">Status das integrações configuradas por variáveis de ambiente no servidor.</p>
            {integErro ? (
              <Panel className="space-y-3 py-8 text-center"><p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar o status das integrações.</p><div><PxButton onClick={loadInteg}>Tentar novamente</PxButton></div></Panel>
            ) : integStatus === null ? (
              <p role="status" className="py-10 text-center text-[13px] text-px-muted">Carregando integrações</p>
            ) : (
              <ul className="space-y-2">
                {INTEGRACOES.map(i => {
                  const ativo = integStatus[i.key]
                  return (
                    <li key={i.key}><Panel as="article" className="flex items-start justify-between gap-3 !py-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-px-ink">{i.label}</p>
                        <p className="text-[13px] text-px-muted">{i.desc}</p>
                        {!ativo && <p className="mt-1 font-mono text-[12px] text-px-muted">Configure: {i.vars}</p>}
                      </div>
                      <Tag tone={ativo ? "ok" : "neutral"}>{ativo ? "Ativo" : "Inativo"}</Tag>
                    </Panel></li>
                  )
                })}
              </ul>
            )}
            <p className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-warn">As variáveis ficam no servidor e não são expostas ao navegador. Para configurar, use as variáveis de ambiente no Vercel ou o arquivo .env.local.</p>
          </section>
        )}

        {aba === "marca" && (
          <>
            <p className="text-[13px] text-px-muted">Logo, cores e identidade usados nos seus materiais.</p>

            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Logo</h2>
              {form.marca_logo_url ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex min-h-[96px] items-center justify-center rounded-px-card border border-px-line p-5" style={{ background: HEX.test(form.marca_cor_fundo) ? form.marca_cor_fundo : "#1a1a2e" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.marca_logo_url} alt="Logo sobre o fundo da sua marca" className="max-h-14 max-w-full object-contain" />
                  </div>
                  <div className="flex min-h-[96px] items-center justify-center rounded-px-card border border-px-line bg-white p-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.marca_logo_url} alt="Logo sobre fundo branco" className="max-h-14 max-w-full object-contain" />
                  </div>
                </div>
              ) : <p className="rounded-px-card border border-dashed border-px-line p-8 text-center text-[13px] text-px-muted">Nenhum logo enviado.</p>}
              <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" aria-label="Selecionar logo" onChange={uploadLogo} />
              <div className="flex flex-wrap items-center gap-2">
                <PxButton variant="secondary" leftIcon={Upload} loading={uploadingLogo} onClick={() => logoRef.current?.click()}>{uploadingLogo ? "Enviando" : form.marca_logo_url ? "Trocar logo" : "Enviar logo"}</PxButton>
                {form.marca_logo_url && <PxButton variant="quiet" onClick={() => removerCampo("marca_logo_url", setLogoError)}>Remover logo</PxButton>}
              </div>
              {logoError && <p role="alert" className="text-[13px] text-px-danger">{logoError}</p>}
            </Panel>

            <Panel as="section" className="space-y-4">
              <h2 className="text-[15px] font-semibold text-px-ink">Paleta de cores</h2>
              <ColorField id="c-prim" label="Cor primária" value={form.marca_cor_primaria} onChange={v => setForm(f => ({ ...f, marca_cor_primaria: v }))} />
              <ColorField id="c-sec" label="Cor secundária" value={form.marca_cor_secundaria} onChange={v => setForm(f => ({ ...f, marca_cor_secundaria: v }))} />
              <ColorField id="c-fundo" label="Cor de fundo" value={form.marca_cor_fundo} onChange={v => setForm(f => ({ ...f, marca_cor_fundo: v }))} />
              <p className="text-[12.5px] text-px-muted">As cores são salvas com o botão Salvar.</p>
            </Panel>

            <Panel as="section" className="space-y-4">
              <h2 className="text-[15px] font-semibold text-px-ink">Tipografia e comunicação</h2>
              <Field label="Fonte principal" htmlFor="m-fonte" hint="A prévia abaixo só mostra a fonte se ela estiver disponível no seu navegador.">
                <PxSelect id="m-fonte" value={form.marca_tipografia} onChange={set("marca_tipografia")}>{TIPOGRAFIAS.map(t => <option key={t} value={t}>{t}</option>)}</PxSelect>
              </Field>
              <Field label="Slogan" htmlFor="m-slogan" hint={`${form.marca_slogan.length} de 120 caracteres`}>
                <PxInput id="m-slogan" value={form.marca_slogan} onChange={set("marca_slogan")} maxLength={120} placeholder="Sua frase de posicionamento" />
              </Field>
              <div role="group" aria-label="Tom de voz" className="space-y-1.5">
                <p className="text-[12.5px] font-medium text-px-muted">Tom de voz</p>
                <div className="flex flex-wrap gap-2">
                  {TONS_VOZ.map(t => (
                    <button key={t.v} type="button" aria-pressed={form.marca_tom_voz === t.v} onClick={() => setForm(f => ({ ...f, marca_tom_voz: t.v }))}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${form.marca_tom_voz === t.v ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{t.l}</button>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel as="section" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Prévia do cartão de marca</h2>
              <div className="flex min-h-[120px] flex-col gap-3 rounded-px-card p-6" style={{ background: HEX.test(form.marca_cor_fundo) ? form.marca_cor_fundo : "#1a1a2e" }}>
                {form.marca_logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={form.marca_logo_url} alt="Logo" className="h-10 object-contain object-left" />
                  : <p className="text-[18px] font-bold tracking-tight" style={{ color: HEX.test(form.marca_cor_primaria) ? form.marca_cor_primaria : "#b8976a", fontFamily: form.marca_tipografia }}>{form.nome || "Seu nome"}</p>}
                {form.marca_slogan && <p className="text-[12px] opacity-70" style={{ color: HEX.test(form.marca_cor_primaria) ? form.marca_cor_primaria : "#b8976a", fontFamily: form.marca_tipografia }}>{form.marca_slogan}</p>}
                <div className="mt-auto flex gap-2" aria-hidden="true">
                  <span className="h-6 w-6 rounded border border-white/30" style={{ background: HEX.test(form.marca_cor_primaria) ? form.marca_cor_primaria : "transparent" }} />
                  <span className="h-6 w-6 rounded border border-white/30" style={{ background: HEX.test(form.marca_cor_secundaria) ? form.marca_cor_secundaria : "transparent" }} />
                </div>
              </div>
            </Panel>

            <Panel as="section" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-px-ink">Banco de imagens</h2>
                <PxButton variant="secondary" size="sm" leftIcon={Upload} loading={uploadingImagens} onClick={() => imagensRef.current?.click()}>{uploadingImagens ? "Enviando" : "Adicionar imagens"}</PxButton>
              </div>
              <input ref={imagensRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Selecionar imagens" onChange={uploadImagens} />
              {uploadResumo && <p role="status" className="text-[13px] text-px-ink">{uploadResumo}</p>}
              {imagensErro && <p role="alert" className="text-[13px] text-px-danger">{imagensErro}</p>}
              {loadingImagens ? <p role="status" className="py-4 text-[13px] text-px-muted">Carregando imagens</p>
                : imagens.length === 0 ? <p className="rounded-px-card border border-dashed border-px-line p-8 text-center text-[13px] text-px-muted">Nenhuma imagem ainda. Adicione fotos do consultório, de procedimentos ou suas para reutilizar nos posts.</p>
                : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {imagens.map(img => (
                      <li key={img.id} className="overflow-hidden rounded-px-card border border-px-line bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.arquivo_url} alt={img.nome_arquivo ?? "Imagem do banco"} className="aspect-square w-full object-cover" />
                        <div className="flex items-center gap-1 p-2">
                          <p className="min-w-0 flex-1 truncate text-[12px] text-px-muted">{img.nome_arquivo}</p>
                          <CopyButton text={img.arquivo_url} label="Copiar URL" iconOnly />
                          <PxButton variant={confirmaImg === img.id ? "danger" : "quiet"} size="sm" leftIcon={Trash2} onClick={() => excluirImagem(img.id)}
                            aria-label={confirmaImg === img.id ? `Confirmar exclusão: ${img.nome_arquivo ?? "imagem"}` : `Excluir: ${img.nome_arquivo ?? "imagem"}`}>{confirmaImg === img.id ? "Confirmar" : null}</PxButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              <p className="text-[12.5px] text-px-muted">JPG, PNG ou WEBP, máximo 5 MB por arquivo. Copie a URL para usar no Canva ou nos posts.</p>
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}
