"use client"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

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
      <div className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25",
        className
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-[12px] text-red-400 truncate">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-[11px] text-red-400 hover:text-red-300 font-medium flex-shrink-0 underline underline-offset-2"
          >
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-4 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-[14px] font-semibold text-text-primary">Algo deu errado</h3>
        <p className="text-[12px] text-text-muted mt-1.5 leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/25 text-red-400 text-[12px] font-semibold hover:bg-red-500/10 transition-all min-h-[44px]"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
