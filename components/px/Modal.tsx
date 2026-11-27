"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PxModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

/** Janela de diálogo: fecha com Esc ou clique fora, devolve o foco ao elemento de origem. */
export function PxModal({ open, onClose, title, children, className }: PxModalProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  // onClose costuma ser uma função inline: guardada em ref para que o efeito rode só ao abrir e fechar,
  // sem devolver o foco ao diálogo a cada tecla digitada num formulário.
  const onCloseRef = React.useRef(onClose)
  onCloseRef.current = onClose

  React.useEffect(() => {
    if (!open) return
    const origem = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current() }
    document.addEventListener("keydown", onKey)
    ref.current?.focus()
    return () => { document.removeEventListener("keydown", onKey); origem?.focus?.() }
  }, [open])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="px fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("px-glass-strong w-full max-w-[420px] rounded-px-panel p-5 shadow-[0_10px_30px_rgba(20,20,20,0.18)] outline-none", className)}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-[15px] font-semibold text-px-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full bg-px-ink/[0.08] text-px-ink hover:bg-px-ink/15">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
