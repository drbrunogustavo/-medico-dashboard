import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingPulseProps {
  message?:    string
  submessage?: string
  variant?:    "spinner" | "skeleton"
  rows?:       number
  icon?:       React.ReactNode
  className?:  string
}

export function LoadingPulse({
  message    = "Carregando...",
  submessage,
  variant    = "spinner",
  rows       = 4,
  icon,
  className,
}: LoadingPulseProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-1.5">
            <div className={cn(
              "h-3 bg-white/[0.06] rounded",
              i % 3 === 0 ? "w-3/4" : i % 3 === 1 ? "w-full" : "w-5/6"
            )} />
            <div className="h-2 bg-white/[0.04] rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16", className)}>
      <div className="relative">
        {icon ?? <Loader2 className="w-10 h-10 text-accent animate-spin" />}
      </div>
      <div className="text-center">
        <p className="text-[14px] font-semibold text-text-primary">{message}</p>
        {submessage && (
          <p className="text-[10px] font-mono text-text-muted tracking-widest mt-1 uppercase">{submessage}</p>
        )}
      </div>
    </div>
  )
}

export function SkeletonList({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("divide-y divide-border/40", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className={cn("h-2.5 bg-white/[0.08] rounded", i % 2 === 0 ? "w-3/4" : "w-1/2")} />
            <div className="h-2 bg-white/[0.04] rounded w-2/5" />
          </div>
          <div className="h-2 bg-white/[0.04] rounded w-12 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonRow({ columns = 4, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 px-5 py-3.5 animate-pulse", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className={cn("h-2.5 bg-white/[0.06] rounded", i === 0 ? "flex-1" : "w-16 flex-shrink-0")}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-5 animate-pulse", className)}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-white/[0.08] rounded w-3/4" />
          <div className="h-2 bg-white/[0.04] rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-white/[0.06] rounded w-full" />
        <div className="h-2.5 bg-white/[0.06] rounded w-5/6" />
        <div className="h-2.5 bg-white/[0.04] rounded w-4/6" />
      </div>
    </div>
  )
}
