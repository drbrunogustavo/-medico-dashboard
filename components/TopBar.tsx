"use client"

import { Menu } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"

interface TopBarProps {
  title:     string
  subtitle?: string
  actions?:  React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { openMenu } = useMenu()

  return (
    <header className="flex items-center gap-3 px-4 md:px-8 py-3.5 md:py-5 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={openMenu}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors flex-shrink-0"
        aria-label="Abrir menu de navegação"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[16px] md:text-[18px] font-semibold text-text-primary tracking-tight truncate">{title}</h1>
        {subtitle && (
          <p className="hidden md:block text-[11px] font-mono text-text-muted mt-0.5 tracking-wide">{subtitle}</p>
        )}
      </div>

      {/* Actions — touch-friendly gap */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </header>
  )
}
