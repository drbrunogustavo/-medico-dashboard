"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/TopBar"
import {
  User, Save, RefreshCw, CheckCircle, AlertCircle,
  Instagram, MapPin, Stethoscope, Hash, Target, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const ESPECIALIDADES = [
  "Cardiologia", "Dermatologia", "Endocrinologia", "Gastroenterologia",
  "Geriatria", "Ginecologia e Obstetrícia", "Infectologia", "Medicina do Trabalho",
  "Medicina Estética", "Medicina de Família", "Neurologia", "Nutrologia",
  "Oftalmologia", "Oncologia", "Ortopedia", "Otorrinolaringologia",
  "Pediatria", "Pneumologia", "Psiquiatria", "Reumatologia",
  "Urologia", "Cirurgia Plástica", "Outra",
]

interface PerfilForm {
  nome: string
  especialidade: string
  crm: string
  cidade: string
  instagram: string
  publico_alvo: string
  diferencial: string
  avatar_url: string
}

const EMPTY: PerfilForm = {
  nome: "", especialidade: "", crm: "", cidade: "",
  instagram: "", publico_alvo: "", diferencial: "", avatar_url: "",
}

type Status = "idle" | "saving" | "saved" | "error"

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

export default function PerfilPage() {
  const router = useRouter()
  const [form,   setForm]   = useState<PerfilForm>(EMPTY)
  const [status, setStatus] = useState<Status>("idle")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/perfil")
      if (r.ok) {
        const data = await r.json() as Partial<PerfilForm> | null
        if (data) {
          setForm({
            nome:          data.nome          ?? "",
            especialidade: data.especialidade ?? "",
            crm:           data.crm           ?? "",
            cidade:        data.cidade        ?? "",
            instagram:     data.instagram     ?? "",
            publico_alvo:  data.publico_alvo  ?? "",
            diferencial:   data.diferencial   ?? "",
            avatar_url:    data.avatar_url    ?? "",
          })
        }
      }
    } catch {/* silent */} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k: keyof PerfilForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

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
    } catch {
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

  const initials = form.nome
    ? form.nome.replace(/^Dr\.?\s*/i, "").slice(0, 2).toUpperCase()
    : "EU"

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Meu Perfil" subtitle="PRAXIS · CONFIGURAÇÕES" />
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
        actions={
          <button
            onClick={save}
            disabled={status === "saving"}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all",
              status === "saved"  ? "bg-accent/15 border border-accent/30 text-accent" :
              status === "error"  ? "bg-red-950/40 border border-red-500/30 text-red-400" :
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

        {/* Avatar URL */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-[11px] font-mono text-text-muted tracking-[3px] uppercase">Foto de Perfil</h2>
          <Field label="URL da foto" icon={User}>
            <input
              value={form.avatar_url}
              onChange={set("avatar_url")}
              placeholder="https://..."
              className={inputCls}
              type="url"
            />
          </Field>
          <p className="text-[10px] text-text-muted">Cole a URL de uma imagem pública (ex: do Google Drive, Notion ou Dropbox).</p>
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-[12px] font-semibold hover:bg-red-950/30 transition-all flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refazer Onboarding
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
