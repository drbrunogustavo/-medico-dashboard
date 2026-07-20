"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import {
  User, Save, RefreshCw, CheckCircle, AlertCircle,
  Instagram, MapPin, Stethoscope, Hash, Target, Sparkles,
  Palette, Type, MessageSquare, Upload, ImageIcon, Loader2,
  Link2, CheckCircle2, XCircle, Copy, Trash2, Images,
} from "lucide-react"
import { cn } from "@/lib/utils"
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
  { v: "empatico",     l: "Empático"     },
  { v: "cientifico",   l: "Científico"   },
  { v: "motivacional", l: "Motivacional" },
  { v: "educativo",    l: "Educativo"    },
]

interface MarcaAsset {
  id:            string
  arquivo_url:   string
  nome_arquivo:  string | null
  tamanho_bytes: number | null
  criado_em:     string
}

interface PerfilForm {
  nome: string
  especialidade: string
  crm: string
  cidade: string
  instagram: string
  publico_alvo: string
  diferencial: string
  avatar_url: string
  marca_logo_url: string
  marca_cor_primaria: string
  marca_cor_secundaria: string
  marca_cor_fundo: string
  marca_tipografia: string
  marca_slogan: string
  marca_tom_voz: string
}

const EMPTY: PerfilForm = {
  nome: "", especialidade: "", crm: "", cidade: "",
  instagram: "", publico_alvo: "", diferencial: "", avatar_url: "",
  marca_logo_url: "",
  marca_cor_primaria:   "#b8976a",
  marca_cor_secundaria: "#0D1B2A",
  marca_cor_fundo:      "#1a1a2e",
  marca_tipografia: "Montserrat",
  marca_slogan:     "",
  marca_tom_voz:    "profissional",
}

type ActiveTab = "perfil" | "marca" | "integracoes"
type Status = "idle" | "saving" | "saved" | "error"

interface IntegStatus {
  medx: boolean
  zapi: boolean
  instagram: boolean
  stripe: boolean
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted uppercase tracking-wider">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-colors"
const textareaCls = cn(inputCls, "resize-none")

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted uppercase tracking-wider">
        <Palette className="w-3 h-3" />
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
          />
        </div>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#000000"
          maxLength={7}
          className={cn(inputCls, "flex-1 font-mono text-[12px]")}
        />
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const [form,         setForm]         = useState<PerfilForm>(EMPTY)
  const [status,       setStatus]       = useState<Status>("idle")
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState<ActiveTab>("perfil")
  const [uploadingLogo,    setUploadingLogo]    = useState(false)
  const [uploadingAvatar,  setUploadingAvatar]  = useState(false)
  const [avatarError,      setAvatarError]      = useState<string | null>(null)
  const [logoError,        setLogoError]        = useState<string | null>(null)
  const [integStatus,      setIntegStatus]      = useState<IntegStatus | null>(null)
  const [imagens,          setImagens]          = useState<MarcaAsset[]>([])
  const [loadingImagens,   setLoadingImagens]   = useState(false)
  const [uploadingImagens, setUploadingImagens] = useState(false)
  const [copiedId,         setCopiedId]         = useState<string | null>(null)
  const logoRef    = useRef<HTMLInputElement>(null)
  const avatarRef  = useRef<HTMLInputElement>(null)
  const imagensRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/perfil")
      if (r.ok) {
        const data = await r.json() as Partial<PerfilForm> | null
        if (data) {
          setForm({
            nome:                 data.nome                 ?? "",
            especialidade:        data.especialidade        ?? "",
            crm:                  data.crm                  ?? "",
            cidade:               data.cidade               ?? "",
            instagram:            data.instagram            ?? "",
            publico_alvo:         data.publico_alvo         ?? "",
            diferencial:          data.diferencial          ?? "",
            avatar_url:           data.avatar_url           ?? "",
            marca_logo_url:       data.marca_logo_url       ?? "",
            marca_cor_primaria:   data.marca_cor_primaria   ?? "#b8976a",
            marca_cor_secundaria: data.marca_cor_secundaria ?? "#0D1B2A",
            marca_cor_fundo:      data.marca_cor_fundo      ?? "#1a1a2e",
            marca_tipografia:     data.marca_tipografia     ?? "Montserrat",
            marca_slogan:         data.marca_slogan         ?? "",
            marca_tom_voz:        data.marca_tom_voz        ?? "profissional",
          })
        }
      }
    } catch {/* silent */} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loadImagens = useCallback(async () => {
    setLoadingImagens(true)
    try {
      const res = await fetch("/api/marca-assets")
      if (res.ok) setImagens(await res.json())
    } catch { /* non-blocking */ } finally { setLoadingImagens(false) }
  }, [])

  useEffect(() => {
    if (activeTab === "marca") loadImagens()
  }, [activeTab, loadImagens])

  useEffect(() => {
    if (activeTab !== "integracoes" || integStatus) return
    fetch("/api/integrations/status")
      .then(r => r.json())
      .then((d: IntegStatus) => setIntegStatus(d))
      .catch(e => console.error("[perfil] erro ao carregar status de integrações:", e))
  }, [activeTab, integStatus])

  const set = (k: keyof PerfilForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setStatus("saving")
    try {
      const r = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setStatus(r.ok ? "saved" : "error")
      if (r.ok) setTimeout(() => setStatus("idle"), 3000)
    } catch (e) {
      console.error("[perfil] erro ao salvar perfil:", e)
      setStatus("error")
    }
  }

  const refazerOnboarding = async () => {
    await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_completo: false }),
    })
    router.push("/onboarding")
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 5 * 1024 * 1024) return
    setUploadingLogo(true)
    setLogoError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const ext  = file.name.split(".").pop() ?? "png"
      const path = `logos/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from("perfil-assets")
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from("perfil-assets")
        .getPublicUrl(data.path)
      setForm(f => ({ ...f, marca_logo_url: publicUrl }))
      const r = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marca_logo_url: publicUrl }),
      })
      if (!r.ok) throw new Error("Erro ao salvar logo no perfil.")
    } catch (err) {
      console.error("[logo upload]", err)
      setLogoError("Erro ao enviar o logo. Tente novamente.")
    } finally {
      setUploadingLogo(false)
      if (logoRef.current) logoRef.current.value = ""
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecione um arquivo de imagem (JPG, PNG ou WEBP).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Arquivo muito grande — máximo 5 MB.")
      return
    }
    setUploadingAvatar(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("não autenticado")
      const path = `avatars/${user.id}/photo`
      const { data, error } = await supabase.storage
        .from("perfil-assets")
        .upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from("perfil-assets")
        .getPublicUrl(data.path)
      setForm(f => ({ ...f, avatar_url: publicUrl }))
      const r = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      })
      if (!r.ok) throw new Error("Erro ao salvar avatar no perfil.")
    } catch (e) {
      console.error("[perfil] erro ao fazer upload do avatar:", e)
      setAvatarError("Erro ao enviar a imagem. Tente novamente.")
    } finally {
      setUploadingAvatar(false)
      if (avatarRef.current) avatarRef.current.value = ""
    }
  }

  const handleImagensUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadingImagens(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("não autenticado")
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) continue
        if (file.size > 5 * 1024 * 1024) continue
        const ext  = file.name.split(".").pop() ?? "jpg"
        const path = `imagens/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: uploaded, error: uploadErr } = await supabase.storage
          .from("perfil-assets")
          .upload(path, file, { upsert: false, contentType: file.type })
        if (uploadErr) continue
        const { data: { publicUrl } } = supabase.storage
          .from("perfil-assets")
          .getPublicUrl(uploaded.path)
        const saved = await fetch("/api/marca-assets", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ arquivo_url: publicUrl, nome_arquivo: file.name, tamanho_bytes: file.size }),
        })
        if (saved.ok) {
          const asset: MarcaAsset = await saved.json()
          setImagens(prev => [asset, ...prev])
        }
      }
    } catch { /* non-blocking */ } finally {
      setUploadingImagens(false)
      if (imagensRef.current) imagensRef.current.value = ""
    }
  }

  const handleDeleteImagem = async (id: string) => {
    await fetch(`/api/marca-assets/${id}`, { method: "DELETE" })
    setImagens(prev => prev.filter(a => a.id !== id))
  }

  const initials = form.nome
    ? form.nome.replace(/^Dr\.?\s*/i, "").slice(0, 2).toUpperCase()
    : "EU"

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Meu Perfil" subtitle="PRAXIS · CONFIGURAÇÕES" tagline="Atualize seus dados, foto e informações profissionais." />
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Meu Perfil"
        subtitle="PRAXIS · CONFIGURAÇÕES"
        tagline="Atualize seus dados, foto e informações profissionais."
        actions={
          <button
            onClick={save}
            disabled={status === "saving"}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
              status === "saved"  ? "bg-accent/15 border border-accent/30 text-accent" :
              status === "error"  ? "bg-red-50 border border-red-200 text-red-700" :
              "bg-accent-dim border border-accent-border text-accent hover:bg-accent/15"
            )}
          >
            {status === "saving" ? (
              <><div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /> Salvando</>
            ) : status === "saved" ? (
              <><CheckCircle className="w-3.5 h-3.5" /> Salvo!</>
            ) : status === "error" ? (
              <><AlertCircle className="w-3.5 h-3.5" /> Erro ao salvar</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Salvar</>
            )}
          </button>
        }
      />

      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">

        {/* Tab navigation */}
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          {(["perfil", "marca", "integracoes"] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-semibold transition-all",
                activeTab === tab
                  ? "bg-accent-dim border border-accent-border text-accent"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-2"
              )}
            >
              {tab === "perfil" ? (
                <><User className="w-3.5 h-3.5" /> Perfil</>
              ) : tab === "marca" ? (
                <><Palette className="w-3.5 h-3.5" /> Kit de Marca</>
              ) : (
                <><Link2 className="w-3.5 h-3.5" /> Integrações</>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: PERFIL ──────────────────────────────────────────────────── */}
        {activeTab === "perfil" && (
          <>
            {/* Avatar + name preview */}
            <div className="bg-surface border border-border rounded-xl p-6 flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-[22px] font-bold text-accent"
                style={{ background: "linear-gradient(135deg, rgba(0,192,127,0.25), rgba(0,192,127,0.08))", border: "2px solid rgba(0,192,127,0.25)" }}
              >
                {form.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-text-primary truncate">
                  {form.nome || "Seu nome aparecerá aqui"}
                </div>
                <div className="text-[12px] text-text-muted mt-0.5">
                  {form.especialidade || "Especialidade"}{form.cidade ? ` · ${form.cidade}` : ""}
                </div>
              </div>
              <User className="w-5 h-5 text-text-muted/30 flex-shrink-0 hidden sm:block" />
            </div>

            {/* Professional info */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Dados Profissionais</h2>

              <Field label="Nome completo" icon={User}>
                <input
                  value={form.nome}
                  onChange={set("nome")}
                  placeholder="Dr. João Silva"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Especialidade" icon={Stethoscope}>
                  <select value={form.especialidade} onChange={set("especialidade")} className={inputCls}>
                    <option value="">Selecionar...</option>
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>

                <Field label="CRM" icon={Hash}>
                  <input
                    value={form.crm}
                    onChange={set("crm")}
                    placeholder="CRM/SP 123456"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Cidade" icon={MapPin}>
                  <input
                    value={form.cidade}
                    onChange={set("cidade")}
                    placeholder="São Paulo, SP"
                    className={inputCls}
                  />
                </Field>

                <Field label="Instagram" icon={Instagram}>
                  <input
                    value={form.instagram}
                    onChange={set("instagram")}
                    placeholder="@drjoaosilva"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* Content strategy */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Estratégia de Conteúdo</h2>

              <Field label="Público-alvo" icon={Target}>
                <textarea
                  value={form.publico_alvo}
                  onChange={set("publico_alvo")}
                  rows={3}
                  placeholder="Ex: Mulheres de 30–50 anos interessadas em saúde hormonal e qualidade de vida..."
                  className={textareaCls}
                />
              </Field>

              <Field label="Diferencial / Posicionamento" icon={Sparkles}>
                <textarea
                  value={form.diferencial}
                  onChange={set("diferencial")}
                  rows={3}
                  placeholder="Ex: Especialista em medicina integrativa com foco em prevenção e longevidade..."
                  className={textareaCls}
                />
              </Field>
            </div>

            {/* Avatar upload */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Foto de Perfil</h2>

              <div className="flex items-center gap-5">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 text-[28px] font-bold text-accent overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(0,192,127,0.25), rgba(0,192,127,0.08))", border: "2px solid rgba(0,192,127,0.25)" }}
                >
                  {form.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : initials}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => avatarRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[12px] font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition-all disabled:opacity-50"
                  >
                    {uploadingAvatar
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                      : <><Upload className="w-3.5 h-3.5" /> {form.avatar_url ? "Trocar foto" : "Enviar foto"}</>
                    }
                  </button>
                  {form.avatar_url && (
                    <button
                      onClick={() => setForm(f => ({ ...f, avatar_url: "" }))}
                      className="text-[11px] text-text-muted hover:text-red-400 transition-colors text-left"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <p className="text-[10px] text-text-muted">
                JPG, PNG ou WEBP — máximo 5 MB. No celular, você pode tirar uma foto ou escolher da galeria.
              </p>
              {avatarError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {avatarError}
                </p>
              )}
            </div>

            {/* Danger zone */}
            <div className="bg-surface border border-red-500/10 rounded-xl p-6">
              <h2 className="text-[11px] font-mono text-red-400/70 tracking-[3px] uppercase mb-4">Zona de Risco</h2>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[13px] text-text-secondary font-medium">Refazer Onboarding</p>
                  <p className="text-[11px] text-text-muted mt-0.5">Redefine as configurações iniciais e reinicia o assistente de configuração.</p>
                </div>
                <button
                  onClick={refazerOnboarding}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-[12px] font-semibold hover:bg-red-50 transition-all flex-shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refazer Onboarding
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: INTEGRAÇÕES ─────────────────────────────────────────────── */}
        {activeTab === "integracoes" && (
          <div className="space-y-4">
            <p className="text-[12px] text-text-muted">
              Status das integrações configuradas via variáveis de ambiente no servidor.
            </p>

            {integStatus === null ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
                {([
                  {
                    key: "medx" as const,
                    label: "MedX CRM",
                    desc: "Prontuários e gestão de pacientes via API MedX",
                    docsKey: "MEDX_URL + MEDX_INTEGRATION_TOKEN",
                  },
                  {
                    key: "zapi" as const,
                    label: "Z-API (WhatsApp)",
                    desc: "Envio automático de mensagens via WhatsApp Business",
                    docsKey: "ZAPI_INSTANCE_ID + ZAPI_TOKEN",
                  },
                  {
                    key: "instagram" as const,
                    label: "Meta / Instagram",
                    desc: "Leitura de métricas e publicações via Instagram Graph API",
                    docsKey: "META_ACCESS_TOKEN + META_IG_USER_ID",
                  },
                  {
                    key: "stripe" as const,
                    label: "Stripe (Pagamentos)",
                    desc: "Gestão de assinaturas e planos via Stripe",
                    docsKey: "STRIPE_SECRET_KEY + STRIPE_PRICE_*",
                  },
                ] as const).map(integ => {
                  const active = integStatus[integ.key]
                  return (
                    <div key={integ.key} className="flex items-center gap-4 px-5 py-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        active ? "bg-emerald-500/10" : "bg-surface-2"
                      )}>
                        {active
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <XCircle      className="w-4 h-4 text-text-muted" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-text-primary">{integ.label}</span>
                          <span className={cn(
                            "text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded-full border",
                            active
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-surface-2 border-border text-text-muted"
                          )}>
                            {active ? "ATIVO" : "INATIVO"}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted mt-0.5 truncate">{integ.desc}</p>
                        {!active && (
                          <p className="text-[10px] font-mono text-text-muted/60 mt-0.5">
                            Configure: {integ.docsKey}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[11px] text-amber-700">
              As integrações são ativadas via variáveis de ambiente no servidor (não expostas ao cliente por segurança).
              Para configurar, acesse as configurações de ambiente no Vercel ou no seu arquivo <code className="font-mono">.env.local</code>.
            </div>
          </div>
        )}

        {/* ── TAB: KIT DE MARCA ────────────────────────────────────────────── */}
        {activeTab === "marca" && (
          <>
            <p className="text-[12px] text-text-secondary mb-2">Centralize logo, cores e identidade visual usados em seus materiais.</p>
            {/* Logo */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Logo da Marca</h2>

              {form.marca_logo_url ? (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl border border-border p-5 flex items-center justify-center min-h-[96px]"
                    style={{ background: form.marca_cor_fundo || "#1a1a2e" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.marca_logo_url} alt="Logo — fundo escuro" className="max-h-14 max-w-full object-contain" />
                  </div>
                  <div className="rounded-xl border border-border p-5 flex items-center justify-center min-h-[96px] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.marca_logo_url} alt="Logo — fundo claro" className="max-h-14 max-w-full object-contain" />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-2 text-center">
                  <ImageIcon className="w-8 h-8 text-text-muted/30" />
                  <p className="text-[12px] text-text-muted">Nenhum logo carregado ainda</p>
                </div>
              )}

              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-[12px] font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition-all disabled:opacity-50"
              >
                {uploadingLogo
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                  : <><Upload className="w-3.5 h-3.5" /> {form.marca_logo_url ? "Trocar logo" : "Fazer upload do logo"}</>
                }
              </button>
              {form.marca_logo_url && (
                <button
                  onClick={() => setForm(f => ({ ...f, marca_logo_url: "" }))}
                  className="text-[11px] text-text-muted hover:text-red-400 transition-colors"
                >
                  Remover logo
                </button>
              )}
              {logoError && (
                <p className="flex items-center gap-1.5 text-[11px] text-red-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {logoError}
                </p>
              )}
            </div>

            {/* Palette */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Paleta de Cores</h2>

              <ColorField
                label="Cor Primária"
                value={form.marca_cor_primaria}
                onChange={v => setForm(f => ({ ...f, marca_cor_primaria: v }))}
              />
              <ColorField
                label="Cor Secundária"
                value={form.marca_cor_secundaria}
                onChange={v => setForm(f => ({ ...f, marca_cor_secundaria: v }))}
              />
              <ColorField
                label="Cor de Fundo"
                value={form.marca_cor_fundo}
                onChange={v => setForm(f => ({ ...f, marca_cor_fundo: v }))}
              />

              {/* Preview strip */}
              <div className="flex gap-2 pt-1">
                <div
                  className="flex-1 h-12 rounded-lg border border-border/50 flex items-end p-1.5"
                  style={{ background: form.marca_cor_fundo }}
                >
                  <span className="text-[9px] font-mono text-white/50">Fundo</span>
                </div>
                <div
                  className="w-12 h-12 rounded-lg border border-border/50 flex items-end p-1.5"
                  style={{ background: form.marca_cor_primaria }}
                >
                  <span className="text-[9px] font-mono text-white/70">1°</span>
                </div>
                <div
                  className="w-12 h-12 rounded-lg border border-border/50 flex items-end p-1.5"
                  style={{ background: form.marca_cor_secundaria }}
                >
                  <span className="text-[9px] font-mono text-white/70">2°</span>
                </div>
              </div>
            </div>

            {/* Typography + Slogan + Tom de Voz */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Tipografia e Comunicação</h2>

              <Field label="Fonte principal" icon={Type}>
                <select value={form.marca_tipografia} onChange={set("marca_tipografia")} className={inputCls}>
                  {TIPOGRAFIAS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <Field label="Slogan" icon={MessageSquare}>
                <input
                  value={form.marca_slogan}
                  onChange={set("marca_slogan")}
                  placeholder="Sua frase de posicionamento..."
                  maxLength={120}
                  className={inputCls}
                />
              </Field>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted uppercase tracking-wider">
                  <MessageSquare className="w-3 h-3" />
                  Tom de Voz
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONS_VOZ.map(t => (
                    <button
                      key={t.v}
                      onClick={() => setForm(f => ({ ...f, marca_tom_voz: t.v }))}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all",
                        form.marca_tom_voz === t.v
                          ? "bg-accent-dim border-accent-border text-accent"
                          : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                      )}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand card preview */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
              <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Prévia do Cartão de Marca</h2>
              <div
                className="rounded-xl p-6 flex flex-col gap-3 min-h-[120px]"
                style={{ background: form.marca_cor_fundo || "#1a1a2e" }}
              >
                {form.marca_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.marca_logo_url} alt="Logo" className="h-10 object-contain object-left" />
                ) : (
                  <div
                    className="text-[18px] font-bold tracking-tight"
                    style={{ color: form.marca_cor_primaria, fontFamily: form.marca_tipografia }}
                  >
                    {form.nome || "Seu Nome"}
                  </div>
                )}
                {form.marca_slogan && (
                  <p
                    className="text-[12px] opacity-70"
                    style={{ color: form.marca_cor_primaria, fontFamily: form.marca_tipografia }}
                  >
                    {form.marca_slogan}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-auto">
                  <div className="w-2 h-2 rounded-full" style={{ background: form.marca_cor_primaria }} />
                  <span className="text-[10px] font-mono" style={{ color: form.marca_cor_primaria }}>
                    {form.marca_tom_voz.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Banco de Imagens */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase flex items-center gap-2">
                  <Images className="w-3.5 h-3.5" /> Banco de Imagens
                </h2>
                <button
                  onClick={() => imagensRef.current?.click()}
                  disabled={uploadingImagens}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition-all disabled:opacity-50"
                >
                  {uploadingImagens
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                    : <><Upload className="w-3 h-3" /> Adicionar imagens</>
                  }
                </button>
              </div>

              <input
                ref={imagensRef}
                type="file"
                multiple
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImagensUpload}
              />

              {loadingImagens ? (
                <div className="flex items-center gap-2 text-[12px] text-text-muted py-4">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...
                </div>
              ) : imagens.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 text-center">
                  <Images className="w-7 h-7 text-text-muted/30" />
                  <p className="text-[12px] text-text-muted">
                    Nenhuma imagem ainda — adicione fotos do consultório, de procedimentos
                    ou do médico para reuso nos seus posts.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagens.map(img => (
                    <div
                      key={img.id}
                      className="group relative rounded-xl overflow-hidden border border-border bg-background aspect-square"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.arquivo_url}
                        alt={img.nome_arquivo ?? "imagem"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        {img.nome_arquivo && (
                          <p className="flex-1 text-[9px] text-white/70 truncate min-w-0">
                            {img.nome_arquivo}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(img.arquivo_url)
                            setCopiedId(img.id)
                            setTimeout(() => setCopiedId(null), 1800)
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-[10px] font-semibold transition-all flex-shrink-0"
                        >
                          {copiedId === img.id
                            ? <><CheckCircle2 className="w-3 h-3" /> Copiado</>
                            : <><Copy className="w-3 h-3" /> URL</>
                          }
                        </button>
                        <button
                          onClick={() => handleDeleteImagem(img.id)}
                          className="p-1.5 rounded-lg bg-red-500/25 hover:bg-red-500/50 active:bg-red-500/60 text-red-400 transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-text-muted">
                JPG, PNG ou WEBP · Máx. 5 MB por arquivo · Copie a URL para usar no Canva ou em seus posts
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
