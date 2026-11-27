"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SegmentedOption<T extends string> { value: T; label: string }

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/** Seletor de uma opção entre poucas (Dia/Semana, unidades, prioridade). */
export function Segmented<T extends string>({ options, value, onChange, label, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-full bg-px-ink/[0.07] p-1", className)}>
      {options.map(o => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-8 rounded-full px-4 text-[12.5px] transition-colors",
              on ? "bg-px-ink font-semibold text-white" : "font-medium text-px-ink hover:bg-px-ink/10"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
