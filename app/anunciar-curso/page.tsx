"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

const PERIODOS = [
  { dias: 7,  label: "7 dias",  preco: "R$ 150" },
  { dias: 15, label: "15 dias", preco: "R$ 250" },
  { dias: 30, label: "30 dias", preco: "R$ 400" },
]

const TIPOS_PRODUTO = [
  { value: "curso",       label: "Curso",        emoji: "🎓" },
  { value: "livro",       label: "Livro",        emoji: "📚" },
  { value: "equipamento", label: "Equipamento",  emoji: "🔬" },
  { value: "suplemento",  label: "Suplemento",   emoji: "💊" },
  { value: "mentoria",    label: "Mentoria",     emoji: "🤝" },
  { value: "ferramenta",  label: "Ferramenta",   emoji: "⚙️" },
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
    tipo_produto:        "curso",
  })
  const [loading,       setLoading]       = useState(false)
  const [sucesso,       setSucesso]       = useState(false)
  const [erro,          setErro]          = useState("")
  const [uploadando,    setUploadando]    = useState(false)
  const [uploadErro,    setUploadErro]    = useState("")
  const [uploadPreview, setUploadPreview] = useState("")
  const [previewErro,   setPreviewErro]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Safety net: Stripe redirected back with ?sucesso=true&session_id=xxx
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search)
    const sessionId = params.get("session_id")
    if (params.get("sucesso") !== "true" || !sessionId) return
    setSucesso(true)
    fetch("/api/anuncios-cursos/confirmar", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ session_id: sessionId }),
    }).catch(() => {}) // webhook is authoritative; this is best-effort
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    setUploadando(true)
    setUploadErro("")
    setPreviewErro(false)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res  = await fetch("/api/anuncios-cursos/upload-imagem", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadErro(data.error ?? "Erro ao subir imagem."); return }
      setUploadPreview(data.url)
      setForm(f => ({ ...f, anunciante_foto_url: data.url }))
    } catch {
      setUploadErro("Erro de conexão no upload.")
    } finally {
      setUploadando(false)
    }
  }, [])

  function set(key: string, val: string | number) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro("")
    try {
      const res  = await fetch("/api/anuncios-cursos/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? "Erro ao enviar. Tente novamente."); return }
      window.location.href = data.url // redirect to Stripe Checkout
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
          <div style={{ width: 56, height: 56, borderRadius: 28, background: "rgba(0,192,127,0.12)", border: "1px solid rgba(0,192,127,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "#00c07f" }}><Check style={{ width: 24, height: 24 }} /></div>
          <h1 style={{ color: "#e8eaf2", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Pagamento confirmado!</h1>
          <p style={{ color: "#7c85a0", fontSize: 14, lineHeight: 1.7 }}>
            Pagamento recebido com sucesso. Seu anúncio está em análise e será ativado em até 24h. Você receberá confirmação por e-mail.
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
          <span style={{ fontSize: 11, color: "#474f66", fontFamily: "JetBrains Mono, monospace", letterSpacing: 1 }}>ANUNCIE NO MARKETPLACE</span>
        </div>
        <Link href="/login" style={{ fontSize: 12, color: "#7c85a0", textDecoration: "none" }}>← Voltar ao login</Link>
      </div>

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Anuncie no Marketplace Praxis</h1>
        <p style={{ fontSize: 14, color: "#7c85a0", marginBottom: 36, lineHeight: 1.7 }}>
          Seu anúncio aparece no banner da tela de login da PRAXIS — vista diariamente por médicos assinantes.
          Pagamento único, sem recorrência. O período começa após aprovação do admin.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Tipo de produto */}
          <Section label="TIPO DE PRODUTO">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TIPOS_PRODUTO.map(t => {
                const ativo = form.tipo_produto === t.value
                return (
                  <button key={t.value} type="button" onClick={() => set("tipo_produto", t.value)}
                    style={{
                      padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${ativo ? "rgba(0,192,127,0.4)" : "#1c1d2a"}`,
                      background: ativo ? "rgba(0,192,127,0.08)" : "#13141d",
                      color: ativo ? "#00c07f" : "#7c85a0",
                      fontFamily: "inherit", fontSize: 13, fontWeight: ativo ? 600 : 400,
                      transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
                    }}>
                    <span>{t.emoji}</span> {t.label}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* Produto */}
          <Section label={`SOBRE O ${TIPOS_PRODUTO.find(t => t.value === form.tipo_produto)?.label.toUpperCase() ?? "PRODUTO"}`}>
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

            {/* Upload de imagem */}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 12, color: "#7c85a0", display: "block", marginBottom: 6 }}>
                Sua foto ou banner
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
              />
              {uploadPreview ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {previewErro ? (
                    <div style={{ fontSize: 12, color: "#f59e0b", lineHeight: 1.5, maxWidth: 340 }}>
                      Não foi possível carregar a prévia, mas o upload pode ter funcionado — confirme no formulário antes de enviar.
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadPreview}
                      alt="preview"
                      onError={() => setPreviewErro(true)}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid #1c1d2a", flexShrink: 0 }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setUploadPreview("")
                      setPreviewErro(false)
                      setForm(f => ({ ...f, anunciante_foto_url: "" }))
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    style={{ fontSize: 12, color: "#7c85a0", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Trocar imagem
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadando}
                  style={{ padding: "10px 16px", borderRadius: 8, border: "1px dashed #1c1d2a", background: "#0f1018", color: "#474f66", fontSize: 13, cursor: uploadando ? "wait" : "pointer", fontFamily: "inherit" }}
                >
                  {uploadando ? "Enviando…" : "Selecionar imagem (JPEG / PNG / WebP · máx. 2 MB)"}
                </button>
              )}
              {uploadErro && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6, margin: "6px 0 0" }}>{uploadErro}</p>}
            </div>

            <Field label="E-mail para contato *" value={form.contato_email} onChange={v => set("contato_email", v)}
              placeholder="seu@email.com" type="email" mt />
            <Field label="Telefone / WhatsApp" value={form.contato_telefone} onChange={v => set("contato_telefone", v)}
              placeholder="(11) 99999-9999" mt />
          </Section>

          {/* Período */}
          <Section label="PERÍODO E PREÇO">
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
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: ativo ? "#00c07f" : "#e8eaf2" }}>{p.preco}</div>
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 12, color: "#474f66", marginTop: 10, margin: "10px 0 0" }}>
              Pagamento único via cartão. O período começa após aprovação do admin, em até 24h.
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
            {loading ? "Redirecionando para pagamento…" : "Pagar e anunciar →"}
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
      <p style={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", color: "#474f66", letterSpacing: 1.2, margin: "0 0 16px" }}>{label}</p>
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
