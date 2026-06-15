"use client"
import { useState, useEffect } from "react"
import { Download, X, Smartphone } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPWA() {
  const [prompt, setPrompt]       = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOS, setShowIOS]     = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("pwa-dismissed")) return

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    if (isStandalone) return

    if (isIOS) {
      // Show iOS instructions after 3s
      const t = setTimeout(() => setShowIOS(true), 3000)
      return () => clearTimeout(t)
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  function dismiss() {
    localStorage.setItem("pwa-dismissed", "1")
    setDismissed(true)
    setPrompt(null)
    setShowIOS(false)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") dismiss()
    setPrompt(null)
  }

  if (dismissed || (!prompt && !showIOS)) return null

  const S: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    background: "#0D1B2A",
    border: "1px solid rgba(184,151,106,0.3)",
    borderRadius: 14,
    padding: "14px 18px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    maxWidth: 360,
    width: "calc(100vw - 32px)",
  }

  return (
    <div style={S}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(184,151,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Smartphone size={18} color="#b8976a" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F5F0E8", lineHeight: 1.3 }}>
          Instalar PRAXIS
        </p>
        {showIOS ? (
          <p style={{ margin: "4px 0 10px", fontSize: 11, color: "#b8976a", lineHeight: 1.5 }}>
            Toque em <strong style={{ color: "#F5F0E8" }}>Compartilhar</strong> →{" "}
            <strong style={{ color: "#F5F0E8" }}>Adicionar à Tela de Início</strong> para instalar o app.
          </p>
        ) : (
          <>
            <p style={{ margin: "4px 0 10px", fontSize: 11, color: "#9a8a7a", lineHeight: 1.5 }}>
              Acesse a plataforma direto pelo celular, sem abrir o browser.
            </p>
            <button
              onClick={install}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#b8976a", color: "#0D1B2A", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              <Download size={13} />
              Instalar agora
            </button>
          </>
        )}
      </div>
      <button
        onClick={dismiss}
        style={{ background: "none", border: "none", color: "#6a5a4a", cursor: "pointer", padding: 2, flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
