"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, Loader2, Star } from "lucide-react"

const ESPECIALIDADES = [
  "Clínica Geral", "Endocrinologia", "Nutrologia", "Cardiologia",
  "Dermatologia", "Ginecologia e Obstetrícia", "Ortopedia", "Neurologia",
  "Psiquiatria", "Pediatria", "Oftalmologia", "Urologia",
  "Oncologia", "Reumatologia", "Nefrologia", "Pneumologia",
  "Gastroenterologia", "Hematologia", "Infectologia", "Medicina do Esporte",
  "Medicina Estética", "Cirurgia Plástica", "Cirurgia Geral", "Outra",
]

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
]

interface Perfil {
  nome?: string
  especialidade?: string
  cidade?: string
  estado?: string
  instagram?: string
  crm?: string
}

export default function DepoimentoPage() {
  const router = useRouter()
  const [saving,    setSaving]    = useState(false)
  const [enviado,   setEnviado]   = useState(false)
  const [erro,      setErro]      = useState("")
  const [jaEnviou,  setJaEnviou]  = useState(false)

  const [form, setForm] = useState({
    nome:               "",
    crm:                "",
    especialidade:      "",
    cidade:             "",
    estado:             "SP",
    depoimento:         "",
    resultado_destaque: "",
    instagram:          "",
    exibir_landing:     false,
  })

  useEffect(() => {
    fetch("/api/perfil")
      .then(r => r.json())
      .then((p: Perfil) => {
        setForm(f => ({
          ...f,
          nome:          p.nome          ?? f.nome,
          especialidade: p.especialidade ?? f.especialidade,
          cidade:        p.cidade        ?? f.cidade,
          estado:        p.estado        ?? f.estado,
          instagram:     p.instagram     ?? f.instagram,
          crm:           p.crm           ?? f.crm,
        }))
      })
      .catch(() => null)

    fetch("/api/depoimentos-praxis")
      .then(r => r.json())
      .then((list: unknown[]) => { if (list.length > 0) setJaEnviou(true) })
      .catch(() => null)
  }, [])

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.nome.trim() || !form.especialidade || !form.depoimento.trim()) {
      setErro("Preencha nome, especialidade e depoimento.")
      return
    }
    if (form.depoimento.trim().length < 30) {
      setErro("Depoimento muito curto — escreva pelo menos 30 caracteres.")
      return
    }
    setSaving(true)
    setErro("")
    try {
      const res = await fetch("/api/depoimentos-praxis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json() as { error?: string }; throw new Error(d.error ?? "Erro") }
      setEnviado(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar")
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
  const inputStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  }

  if (enviado) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-[24px] font-semibold text-text-primary mb-3"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Depoimento enviado!
          </h1>
          <p className="text-[14px] text-text-secondary leading-relaxed mb-8">
            Seu depoimento foi recebido e será analisado pela equipe PRAXIS.
            Após aprovação, poderá aparecer na página inicial da plataforma.
          </p>
          <button onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "#080808" }}>
            Voltar ao dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="px-4 py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[18px] font-semibold text-text-primary">Deixar depoimento</h1>
            <p className="text-[12px] text-text-secondary">Compartilhe sua experiência com a plataforma.</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">

        {jaEnviou && (
          <div className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}>
            <Star className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-accent">
              Você já enviou um depoimento. Você pode enviar outro para atualizar sua experiência.
            </p>
          </div>
        )}

        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">
                Nome completo *
              </label>
              <input value={form.nome} onChange={set("nome")} placeholder="Dr. João Silva" className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">CRM (opcional)</label>
              <input value={form.crm} onChange={set("crm")} placeholder="CRM/SP 123456" className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">Instagram (opcional)</label>
              <input value={form.instagram} onChange={set("instagram")} placeholder="@drjoao" className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">
                Especialidade *
              </label>
              <select value={form.especialidade} onChange={set("especialidade")} className={inputCls} style={inputStyle}>
                <option value="">Selecione</option>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">Cidade</label>
              <input value={form.cidade} onChange={set("cidade")} placeholder="São Paulo" className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">Estado</label>
              <select value={form.estado} onChange={set("estado")} className={inputCls} style={inputStyle}>
                {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">
              Depoimento * <span className="normal-case font-sans tracking-normal">(mín. 30 caracteres)</span>
            </label>
            <textarea
              value={form.depoimento}
              onChange={set("depoimento")}
              rows={5}
              placeholder="Compartilhe sua experiência com o PRAXIS — o que mudou no seu dia a dia, qual módulo mais usou, que resultado percebeu..."
              className={inputCls}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <p className="text-[11px] text-text-muted text-right">{form.depoimento.length} caracteres</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono tracking-widest uppercase text-text-muted">
              Resultado em destaque (opcional)
            </label>
            <input
              value={form.resultado_destaque}
              onChange={set("resultado_destaque")}
              placeholder="Ex: +8 consultas/mês, economizei 2h/dia, saí dos convênios em 3 meses"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl transition-colors"
            style={{ background: form.exibir_landing ? "var(--accent-dim)" : "var(--surface)", border: `1px solid ${form.exibir_landing ? "var(--accent-border)" : "var(--border)"}` }}>
            <input
              type="checkbox"
              checked={form.exibir_landing}
              onChange={e => setForm(f => ({ ...f, exibir_landing: e.target.checked }))}
              className="mt-0.5 w-4 h-4 cursor-pointer flex-shrink-0"
              style={{ accentColor: "var(--accent)" }}
            />
            <div>
              <span className="text-[13px] font-semibold text-text-primary block">
                Autorizo exibir na landing page do PRAXIS
              </span>
              <span className="text-[11px] text-text-muted">
                Seu nome, especialidade e depoimento poderão aparecer publicamente no site após aprovação.
              </span>
            </div>
          </label>
        </div>

        {erro && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
            <p className="text-[12px] text-red-400">{erro}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-[12px] text-text-muted underline underline-offset-4">
            Cancelar
          </Link>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#080808" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : "Enviar depoimento"}
          </button>
        </div>

        <p className="text-center text-[11px] text-text-muted">
          Depoimentos passam por moderação antes de serem publicados. Sem aprovação automática.
        </p>
      </div>
    </div>
  )
}
