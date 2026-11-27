import * as React from "react"
import { cn } from "@/lib/utils"

export type EventTone = "ink" | "accent" | "paper" | "slate"

const tones: Record<EventTone, string> = {
  ink:    "bg-px-ink text-white border-px-ink",
  accent: "bg-px-accent text-white border-px-accent",
  paper:  "bg-white text-px-ink border-px-ink/30",
  slate:  "bg-px-slate text-white border-px-slate",
}

interface EventPillProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: EventTone
  title: string
  sub?: string
}

/** Bloco de atendimento no calendário. O profissional é identificado pelo tom; quando houver mais de quatro, use iniciais em `sub`. */
export function EventPill({ tone = "ink", title, sub, className, ...rest }: EventPillProps) {
  return (
    <div className={cn("overflow-hidden rounded-px-ctl border px-2.5 py-1.5", tones[tone], className)} {...rest}>
      <div className="truncate text-[12px] font-semibold">{title}</div>
      {sub ? <div className="truncate text-[10.5px] opacity-85">{sub}</div> : null}
    </div>
  )
}
