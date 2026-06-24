"use client"
import { Menu } from "lucide-react"
import { useMenu } from "@/components/MobileMenuProvider"

interface Props {
  title?: string
}

export function MobileOnlyHeader({ title }: Props) {
  const { openMenu } = useMenu()
  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
      <button
        onClick={openMenu}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-accent hover:bg-white/[0.06] transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      {title && (
        <>
          <div className="w-px h-4 bg-border flex-shrink-0" />
          <span className="text-[12px] font-semibold text-text-primary truncate">{title}</span>
        </>
      )}
    </div>
  )
}
