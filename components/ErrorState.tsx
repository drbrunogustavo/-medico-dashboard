"use client"
import { TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { PxButton } from "@/components/px/Button"

interface ErrorStateProps {
  message?:   string
  onRetry?:   () => void
  compact?:   boolean
  className?: string
}

export function ErrorState({
  message   = "Algo deu errado. Tente novamente.",
  onRetry,
  compact   = false,
  className,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div role="alert" className={cn("flex flex-wrap items-center justify-between gap-3 rounded-px-card bg-px-danger-soft px-4 py-3", className)}>
        <p className="min-w-0 text-[13px] text-px-danger">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="shrink-0 rounded px-1 text-[13px] font-medium text-px-danger underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}>
      <TriangleAlert className="h-7 w-7 text-px-danger" aria-hidden />
      <div className="max-w-sm">
        <h3 className="text-[15px] font-semibold text-px-ink">Algo deu errado</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-px-muted">{message}</p>
      </div>
      {onRetry && <PxButton variant="secondary" onClick={onRetry}>Tentar novamente</PxButton>}
    </div>
  )
}
