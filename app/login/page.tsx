"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function LoginPage() {
  const [email,   setEmail]   = useState("")
  const [senha,   setSenha]   = useState("")
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState("")
  const router = useRouter()

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
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      padding: "20px",
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

        {/* Voltar */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a href="/" style={{ color: "#555", fontSize: "13px", textDecoration: "none" }}>
            ← Voltar para o início
          </a>
        </div>

      </div>
    </div>
  )
}
