"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, Trash2 } from "lucide-react"

export default function DeletarDadosPage() {
  const [nome,    setNome]    = useState("")
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) {
      setError("Preencha nome e e-mail para continuar.")
      return
    }
    setError(null)
    setLoading(true)

    // Simulates request submission — in production, POST to /api/deletar-dados
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setDone(true)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    transition: "border-color 0.15s",
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(var(--surface-rgb, 10,10,10),0.9)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#00c07f" strokeWidth="1.5"
              strokeDasharray="70 18" strokeDashoffset="12" opacity="0.6" />
            <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#f5f5f7" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
            <line x1="18" y1="14" x2="23" y2="22" stroke="#00c07f" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "var(--font-playfair,Georgia,serif)", fontSize: 14, fontWeight: 600, letterSpacing: "4px", color: "#f0f0f0" }}>
            PRAXIS
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Link href="/privacidade" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "var(--text-muted)", textDecoration: "none",
          marginBottom: 32,
        }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Política de Privacidade
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "#00c07f", letterSpacing: "3px", textTransform: "uppercase", marginBottom: 12 }}>
            LGPD · ART. 18
          </p>
          <h1 style={{
            fontFamily: "var(--font-playfair,Georgia,serif)",
            fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.2,
          }}>
            Solicitar Exclusão de Dados
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>
            Ao enviar este formulário, iniciaremos o processo de exclusão permanente de todos os seus dados pessoais armazenados na plataforma PRAXIS, em conformidade com a LGPD.
          </p>
        </div>

        <div style={{ height: 1, background: "var(--border)", marginBottom: 36 }} />

        {done ? (
          /* ── Success state ── */
          <div style={{
            padding: "32px 28px", borderRadius: 16, textAlign: "center",
            background: "rgba(0,192,127,0.06)", border: "1px solid rgba(0,192,127,0.2)",
          }}>
            <CheckCircle2 style={{ width: 40, height: 40, color: "#00c07f", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
              Solicitação recebida
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 20 }}>
              Sua solicitação de exclusão de dados foi registrada. Processaremos e confirmaremos por e-mail em até <strong style={{ color: "var(--text-primary)" }}>30 dias úteis</strong>.
            </p>
            <div style={{
              padding: "14px 18px", borderRadius: 10,
              background: "var(--surface)", display: "inline-block",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>Dúvidas? Entre em contato:</p>
              <p style={{ margin: "4px 0 0", fontFamily: "monospace", fontSize: 13, color: "#00c07f" }}>
                contato@praxisplatforma.com.br
              </p>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Info box */}
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
            }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "#fbbf24" }}>
                <strong>Atenção:</strong> esta ação é irreversível. Todos os seus dados serão excluídos permanentemente, incluindo conteúdos gerados, leads, histórico e configurações. Sua conta será encerrada.
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="nome" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Nome completo
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Dr. João Silva"
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                E-mail cadastrado na plataforma
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com.br"
                required
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
            )}

            {/* Prazo info */}
            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "var(--card)", border: "1px solid var(--border)",
            }}>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--text-muted)" }}>
                ⏱ Após a solicitação, seus dados serão excluídos em até <strong style={{ color: "var(--text-secondary)" }}>30 dias úteis</strong>. Você receberá uma confirmação no e-mail informado acima quando o processo for concluído.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 20px", borderRadius: 12, border: "none", cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 700, transition: "opacity 0.15s",
                background: "rgba(239,68,68,0.12)", color: "#f87171",
                outline: "1px solid rgba(239,68,68,0.3)",
                opacity: loading ? 0.6 : 1,
              }}>
              {loading
                ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Enviando...</>
                : <><Trash2 style={{ width: 16, height: 16 }} /> Solicitar Exclusão de Todos os Meus Dados</>
              }
            </button>

            <p style={{ fontSize: 11, textAlign: "center", color: "var(--text-muted)", margin: 0 }}>
              Dúvidas?{" "}
              <a href="mailto:contato@praxisplatforma.com.br" style={{ color: "#00c07f", textDecoration: "none" }}>
                contato@praxisplatforma.com.br
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
