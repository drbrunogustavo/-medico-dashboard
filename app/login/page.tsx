"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface BannerAd {
  id: string
  titulo: string
  chamada: string
  link_destino: string
  anunciante_nome: string
  anunciante_foto_url: string | null
}

export default function LoginPage() {
  const [email,   setEmail]   = useState("")
  const [senha,   setSenha]   = useState("")
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState("")
  const [banner,  setBanner]  = useState<BannerAd | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/anuncios-cursos/publico")
      .then(r => r.json())
      .then((data: { anuncio: BannerAd | null }) => { if (data?.anuncio) setBanner(data.anuncio) })
      .catch(() => {})
  }, [])

  async function handleLogin() {
    setLoading(true)
    setErro("")
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro("Email ou senha incorretos.")
      setLoading(false)
      return
    }
    router.push("/dashboard")
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #444",
    backgroundColor: "#2a2a2a",
    color: "#f5f5f5",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    WebkitTextFillColor: "#f5f5f5",
    caretColor: "#f5f5f5",
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      padding: "20px",
      gap: "16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#141414",
        borderRadius: "20px",
        padding: "48px 40px",
        border: "1px solid #222",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#ffffff",
            fontFamily: "Playfair Display, serif",
            margin: 0,
            letterSpacing: "4px",
          }}>
            PRAXIS
          </h1>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "8px", margin: "8px 0 0" }}>
            Acesse sua plataforma
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Senha */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px" }}>
            Senha
          </label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={inputStyle}
          />
        </div>

        {/* Erro */}
        {erro && (
          <p style={{
            color: "#ef4444",
            fontSize: "13px",
            marginBottom: "16px",
            textAlign: "center",
            margin: "0 0 16px",
          }}>
            {erro}
          </p>
        )}

        {/* Botão */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "#00c07f",
            color: "#000",
            fontSize: "15px",
            fontWeight: "700",
            border: "none",
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {/* Criar conta */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a href="/cadastro" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>
            Não tem conta? Criar conta gratuita
          </a>
        </div>

        {/* Voltar */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <a href="/" style={{ color: "#555", fontSize: "13px", textDecoration: "none" }}>
            ← Voltar para o início
          </a>
        </div>

      </div>

      {banner && (
        <a
          href={banner.link_destino}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "#141414",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid #222",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            {banner.anunciante_foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.anunciante_foto_url}
                alt={banner.anunciante_nome}
                style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%", background: "#1c1c1c",
                border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 700, color: "#888", flexShrink: 0,
              }}>
                {banner.anunciante_nome.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#f5f5f5" }}>{banner.titulo}</p>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#888" }}>{banner.anunciante_nome}</p>
            </div>
            <span style={{
              fontSize: "11px", fontWeight: 600, color: "#00c07f",
              background: "rgba(0,192,127,0.10)", border: "1px solid rgba(0,192,127,0.25)",
              borderRadius: "20px", padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              Ver curso →
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#999", lineHeight: "1.5" }}>{banner.chamada}</p>
          <p style={{ margin: "10px 0 0", fontSize: "10px", color: "#444", fontFamily: "monospace" }}>
            Espaço patrocinado
          </p>
        </a>
      )}

    </div>
  )
}
