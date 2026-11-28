"use client"
import { useState, useEffect } from "react"
import { PxButton } from "@/components/px/Button"
import { Download, X } from "lucide-react"

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
    try { if (localStorage.getItem("pwa-dismissed")) return } catch { /* armazenamento bloqueado: segue sem lembrar */ }

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
    try { localStorage.setItem("pwa-dismissed", "1") } catch { /* ignora */ }
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

  return (
    <div className="px fixed inset-x-0 bottom-28 z-[70] flex justify-center px-4 print:hidden">
      <div role="region" aria-label="Instalar o aplicativo" className="px-glass-strong flex w-full max-w-sm items-start gap-3 rounded-px-card p-4 shadow-[0_10px_30px_rgba(20,20,20,0.18)]">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-px-ink">Instalar o PRAXIS</p>
          {showIOS ? (
            <p className="mt-1 text-[13px] leading-relaxed text-px-muted">
              No Safari, toque em <strong className="text-px-ink">Compartilhar</strong> e depois em <strong className="text-px-ink">Adicionar à Tela de Início</strong>.
            </p>
          ) : (
            <>
              <p className="mb-3 mt-1 text-[13px] leading-relaxed text-px-muted">Abra a plataforma direto do celular, sem passar pelo navegador.</p>
              <PxButton size="sm" leftIcon={Download} onClick={install}>Instalar agora</PxButton>
            </>
          )}
        </div>
        <button type="button" onClick={dismiss} aria-label="Dispensar" className="shrink-0 rounded p-1 text-px-ink hover:bg-px-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
