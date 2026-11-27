'use client'

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { PxButton } from "./Button"

/** Botão de copiar com retorno claro de sucesso ou falha. */
export function CopyButton({ text, label = "Copiar", className, iconOnly = false }: { text: string; label?: string; className?: string; iconOnly?: boolean }) {
  const [estado, setEstado] = useState<"" | "ok" | "erro">("")
  async function copiar() {
    try { await navigator.clipboard.writeText(text); setEstado("ok") } catch { setEstado("erro") }
    setTimeout(() => setEstado(""), 1800)
  }
  const texto = estado === "ok" ? "Copiado" : estado === "erro" ? "Não foi possível copiar" : label
  return (
    <PxButton variant="secondary" size="sm" className={className} leftIcon={estado === "ok" ? Check : Copy} onClick={copiar} aria-label={iconOnly ? texto : undefined}>
      {iconOnly ? null : texto}
    </PxButton>
  )
}
