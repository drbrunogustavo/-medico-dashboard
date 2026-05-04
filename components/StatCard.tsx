import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  accent?: "green" | "blue" | "red" | "amber"
  className?: string
}

const ACCENTS = {
  green: { bar: "bg-accent", text: "text-accent-text", icon: "text-accent" },
  blue:  { bar: "bg-blue",   text: "text-blue-text",   icon: "text-blue"   },
  red:   { bar: "bg-danger", text: "text-red-400",      icon: "text-red-400"},
  amber: { bar: "bg-warning",text: "text-amber-400",    icon: "text-amber-400"},
}

export function StatCard({ label, value, sub, icon: Icon, accent = "green", className }: StatCardProps) {
  const a = ACCENTS[accent]
  return (
    <div className={cn("relative bg-card border border-border rounded-lg p-4 overflow-hidden", className)}>
      <div className={cn("absolute top-0 left-0 right-0 h-px", a.bar, "opacity-60")} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2">{label}</div>
          <div className={cn("text-3xl font-bold leading-none", a.text)}>{value}</div>
          {sub && <div className="text-[10px] text-text-muted mt-1.5">{sub}</div>}
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
            <Icon className={cn("w-4 h-4", a.icon)} />
          </div>
        )}
      </div>
    </div>
  )
}
