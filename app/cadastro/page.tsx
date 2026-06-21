"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

export default function CadastroPage() {
  const [nome,            setNome]            = useState("")
  const [email,           setEmail]           = useState("")
  const [senha,           setSenha]           = useState("")
  const [confirmarSenha,  setConfirmarSenha]  = useState("")
  const [codigoIndicacao, setCodigoIndicacao] = useState("")
  const [loading,         setLoading]         = useState(false)
  const [erro,            setErro]            = useState("")
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Persist affiliate ref code: sessionStorage for checkout flow + cookie for server-side indicação
  // Also pre-fill the manual field so the user can see/edit it
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (!ref) return
    setCodigoIndicacao(ref)
    sessionStorage.setItem("praxis_ref_afiliado", ref)
    document.cookie = `praxis_ref=${encodeURIComponent(ref)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
  }, [searchParams])

  async function handleCadastro() {
    setErro("")

    if (!nome.trim() || !email.trim() || !senha) {
      setErro("Preencha todos os campos.")
      return
    }
    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.")
      return
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome: nome.trim() } },
    })

    if (error) {
      setErro(
        error.message.toLowerCase().includes("already registered")
          ? "Este email já está cadastrado. Faça login."
          : "Não foi possível criar sua conta. Tente novamente."
      )
      setLoading(false)
      return
    }

    if (!data.session) {
      setErro("Conta criada! Verifique seu email para confirmar o cadastro antes de entrar.")
      setLoading(false)
      return
    }

    await fetch("/api/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim() }),
    }).catch(() => null)

    // Fire-and-forget — never blocks signup regardless of outcome
    fetch("/api/afiliados/registrar-indicacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigoManual: codigoIndicacao.trim() || null }),
    }).catch(() => null)

    router.push("/onboarding")
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

  const labelStyle: React.CSSProperties = {
    display: "block", color: "#aaa", fontSize: "13px", marginBottom: "6px",
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
            Crie sua conta gratuita
          </p>
        </div>

        {/* Nome completo */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Nome completo</label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Dr. Seu Nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Email</label>
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
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Senha</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Confirmar senha */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Confirmar senha</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCadastro()}
            style={inputStyle}
          />
        </div>

        {/* Código de indicação (opcional) */}
        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Código de quem te indicou (opcional)</label>
          <input
            type="text"
            autoComplete="off"
            placeholder="Ex: MEDC1234"
            value={codigoIndicacao}
            onChange={e => setCodigoIndicacao(e.target.value.toUpperCase())}
            style={{ ...inputStyle, fontSize: "13px" }}
          />
          <p style={{ color: "#555", fontSize: "11px", marginTop: "6px", margin: "6px 0 0" }}>
            Se alguém te indicou e você sabe o código dela, digite aqui.
          </p>
        </div>

        {/* Erro / mensagem */}
        {erro && (
          <p style={{
            color: erro.startsWith("Conta criada") ? "#00c07f" : "#ef4444",
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
          onClick={handleCadastro}
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
          {loading ? "Criando conta..." : "Criar minha conta"}
        </button>

        {/* Já tem conta */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <a href="/login" style={{ color: "#888", fontSize: "13px", textDecoration: "none" }}>
            Já tenho conta → Entrar
          </a>
        </div>

        {/* Voltar */}
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <a href="/" style={{ color: "#555", fontSize: "13px", textDecoration: "none" }}>
            ← Voltar para o início
          </a>
        </div>

      </div>
    </div>
  )
}
