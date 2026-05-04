"use client"

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="text-[18px] font-semibold text-text-primary tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[11px] font-mono text-text-muted mt-0.5 tracking-wide">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}
