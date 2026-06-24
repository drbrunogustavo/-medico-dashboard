"use client"

import { useState } from "react"
import Link from "next/link"

const PERIODOS = [
  { dias: 7,  label: "7 dias"  },
  { dias: 15, label: "15 dias" },
  { dias: 30, label: "30 dias" },
]

export default function AnunciarCursoPage() {
  const [form, setForm] = useState({
    titulo:              "",
    chamada:             "",
    link_destino:        "",
    anunciante_nome:     "",
    anunciante_foto_url: "",
    contato_email:       "",
    contato_telefone:    "",
    periodo_dias:        15,
  })
  const [loading, setLoading]   = useState(false)
  const [sucesso, setSucesso]   = useState(false)
  const [erro,    setErro]      = useState("")

  function set(key: string, val: string | number) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro("")
    try {
      const res  = await fetch("/api/anuncios-cursos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? "Erro ao enviar. Tente novamente."); return }
      setSucesso(true)
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div style={S.page}>
        <div style={{ maxWidth: 480, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(0,192,127,0.12)", border: "1px solid rgba(0,192,127,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24, color: "#00c07f" }}>✓</div>
          <h1 style={{ color: "#e8eaf2", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Solicitação enviada!</h1>
          <p style={{ color: "#7c85a0", fontSize: 14, lineHeight: 1.7 }}>
            Recebemos seu pedido. Entraremos em contato em até 24h para confirmar o período e os detalhes do seu anúncio.
          </p>
          <Link href="/login" style={{ display: "inline-block", marginTop: 28, fontSize: 13, color: "#00c07f", textDecoration: "none" }}>← Voltar ao login</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "#08090e", color: "#e8eaf2", fontFamily: "Inter, sans-serif" }}>
      {/* Topbar */}
      <div style={{ borderBottom: "1px solid #1c1d2a", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#00c07f" }}>PRAXIS</span>
          <span style={{ width: 1, height: 14, background: "#1c1d2a" }} />
          <span style={{ fontSize: 11, color: "#474f66", fontFamily: "JetBrains Mono, monospace", letterSpacing: 1 }}>ANUNCIE SEU CURSO</span>
        </div>
        <Link href="/login" style={{ fontSize: 12, color: "#7c85a0", textDecoration: "none" }}>← Voltar ao login</Link>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Anuncie seu curso médico</h1>
        <p style={{ fontSize: 14, color: "#7c85a0", marginBottom: 36, lineHeight: 1.7 }}>
          Seu anúncio aparece no banner da tela de login da PRAXIS — vista diariamente por médicos assinantes.
          Envie a solicitação e entraremos em contato para confirmar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Curso */}
          <Section label="SOBRE O CURSO">
            <Field label="Título do curso *" value={form.titulo} onChange={v => set("titulo", v)}
              placeholder="Ex: Masterclass de Emagrecimento Funcional" />
            <Field label="Chamada / call to action *" value={form.chamada} onChange={v => set("chamada", v)}
              placeholder="Ex: Inscrições abertas — só até sexta!" mt />
            <Field label="Link para o curso *" value={form.link_destino} onChange={v => set("link_destino", v)}
              placeholder="https://..." type="url" mt />
          </Section>

          {/* Anunciante */}
          <Section label="SEUS DADOS">
            <Field label="Seu nome / identificação *" value={form.anunciante_nome} onChange={v => set("anunciante_nome", v)}
              placeholder="Dra. Ana Lima — Nutróloga" />
            <Field label="URL da sua foto ou banner" value={form.anunciante_foto_url} onChange={v => set("anunciante_foto_url", v)}
              placeholder="https://... (link direto de imagem)" type="url" mt />
            <Field label="E-mail para contato *" value={form.contato_email} onChange={v => set("contato_email", v)}
              placeholder="seu@email.com" type="email" mt />
            <Field label="Telefone / WhatsApp" value={form.contato_telefone} onChange={v => set("contato_telefone", v)}
              placeholder="(11) 99999-9999" mt />
          </Section>

          {/* Período */}
          <Section label="PERÍODO DESEJADO">
            <div style={{ display: "flex", gap: 10 }}>
              {PERIODOS.map(p => {
                const ativo = form.periodo_dias === p.dias
                return (
                  <button key={p.dias} type="button" onClick={() => set("periodo_dias", p.dias)}
                    style={{
                      flex: 1, padding: "16px 8px", borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${ativo ? "rgba(0,192,127,0.4)" : "#1c1d2a"}`,
                      background: ativo ? "rgba(0,192,127,0.08)" : "#13141d",
                      color: ativo ? "#00c07f" : "#7c85a0",
                      fontFamily: "inherit", textAlign: "center",
                      transition: "all 0.15s",
                    }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.label}</div>
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: "#474f66", marginTop: 10 }}>
              O período começa na data de aprovação. Entraremos em contato para combinar o valor.
            </p>
          </Section>

          {erro && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{erro}</p>}

          <button type="submit" disabled={loading}
            style={{
              padding: "14px 24px", borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "#1c1d2a" : "#00c07f",
              color: loading ? "#474f66" : "#08090e",
              fontWeight: 700, fontSize: 14, fontFamily: "inherit",
              transition: "background 0.15s",
            }}>
            {loading ? "Enviando…" : "Enviar solicitação →"}
          </button>
        </form>
      </div>
    </div>
  )
}

const S = {
  page: { minHeight: "100vh", background: "#08090e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" } as React.CSSProperties,
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 12, padding: 20 }}>
      <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#474f66", letterSpacing: 1.2, marginBottom: 16, margin: "0 0 16px" }}>{label}</p>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = "text", mt = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mt?: boolean
}) {
  return (
    <div style={{ marginTop: mt ? 14 : 0 }}>
      <label style={{ fontSize: 12, color: "#7c85a0", display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 14px", borderRadius: 8,
          border: "1px solid #1c1d2a", background: "#0f1018",
          color: "#e8eaf2", fontSize: 14, fontFamily: "inherit", outline: "none",
          boxSizing: "border-box", transition: "border-color 0.15s",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(0,192,127,0.4)")}
        onBlur={e  => (e.target.style.borderColor = "#1c1d2a")}
      />
    </div>
  )
}
