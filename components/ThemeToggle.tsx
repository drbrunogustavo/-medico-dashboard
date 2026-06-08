"use client"

import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  size?: "sm" | "md"
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme, mounted } = useTheme()

  // Avoid hydration mismatch — render neutral until mounted
  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-surface-2 flex-shrink-0",
          size === "sm" ? "w-7 h-7" : "w-9 h-9",
          className
        )}
      />
    )
  }

  const isLight = theme === "light"

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? "Mudar para modo escuro" : "Mudar para modo claro"}
      aria-label={isLight ? "Mudar para modo escuro" : "Mudar para modo claro"}
      className={cn(
        "flex items-center justify-center rounded-lg border border-border bg-surface-2",
        "hover:border-border-hover hover:bg-surface transition-colors flex-shrink-0",
        size === "sm" ? "w-7 h-7" : "w-9 h-9",
        className
      )}
    >
      <span key={theme} className="animate-theme-icon">
        {isLight
          ? <Moon className={cn("text-text-secondary", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
          : <Sun  className={cn("text-text-secondary", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        }
      </span>
    </button>
  )
}
