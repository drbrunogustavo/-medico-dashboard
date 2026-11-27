import * as React from "react"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "ink" | "accent" | "danger" | "ok" | "warn"

const tones: Record<Tone, string> = {
  neutral: "bg-px-ink/[0.08] text-px-ink",
  ink:     "bg-px-ink text-white",
  accent:  "bg-px-accent-soft text-px-accent",
  danger:  "bg-px-danger-soft text-px-danger",
  ok:      "bg-px-ok-soft text-px-ok",
  warn:    "bg-px-warn-soft text-px-warn",
}

/** Etiqueta de estado. Sempre com texto: a cor sozinha não carrega o significado. */
export function Tag({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-semibold", tones[tone], className)}>
      {children}
    </span>
  )
}
