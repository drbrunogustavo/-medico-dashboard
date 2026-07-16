import Link from "next/link"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?:      LucideIcon
  title:      string
  subtitle?:  string
  action?:    { label: string } & (
    | { href: string; onClick?: never }
    | { onClick: () => void; href?: never }
  )
  className?: string
}

const CTA_CLS = "flex items-center gap-2 px-4 py-2 rounded-lg border border-accent-border text-accent text-[12px] font-semibold hover:bg-accent-dim transition-all min-h-[44px]"

export function EmptyState({ icon: Icon, title, subtitle, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-4 text-center", className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
          <Icon className="w-7 h-7 text-accent" />
        </div>
      )}
      <div className="max-w-sm">
        <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-[12px] text-text-muted mt-1.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && (
        action.href
          ? <Link href={action.href} className={CTA_CLS}>{action.label}</Link>
          : <button onClick={action.onClick} className={CTA_CLS}>{action.label}</button>
      )}
    </div>
  )
}
