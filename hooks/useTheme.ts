"use client"

import { useEffect, useState, useCallback } from "react"

export type Theme = "dark" | "light"

const STORAGE_KEY = "praxis-theme"

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
  document.documentElement.style.colorScheme = theme
}

export function useTheme() {
  const [theme,       setThemeState]   = useState<Theme>("dark")
  const [followSystem, setFollowSystem] = useState(false)
  const [mounted,      setMounted]      = useState(false)

  // Initialise from localStorage on first client render
  useEffect(() => {
    const saved    = localStorage.getItem(STORAGE_KEY) as Theme | null
    const followSys= localStorage.getItem("praxis-follow-system") === "true"

    setFollowSystem(followSys)

    const initial: Theme = followSys
      ? getSystemTheme()
      : (saved ?? "dark")

    setThemeState(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  // Listen to system preference changes when followSystem is active
  useEffect(() => {
    if (!followSystem) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      const next: Theme = e.matches ? "dark" : "light"
      setThemeState(next)
      applyTheme(next)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [followSystem])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    setFollowSystem(false)
    localStorage.setItem("praxis-follow-system", "false")
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark"
      applyTheme(next)
      localStorage.setItem(STORAGE_KEY, next)
      localStorage.setItem("praxis-follow-system", "false")
      return next
    })
    setFollowSystem(false)
  }, [])

  const enableFollowSystem = useCallback((on: boolean) => {
    setFollowSystem(on)
    localStorage.setItem("praxis-follow-system", String(on))
    if (on) {
      const sys = getSystemTheme()
      setThemeState(sys)
      applyTheme(sys)
    }
  }, [])

  return { theme, setTheme, toggleTheme, followSystem, enableFollowSystem, mounted }
}
