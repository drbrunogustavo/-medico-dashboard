"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "secondary-soft" | "ghost" | "destructive" | "accent-ghost"
type Size = "sm" | "md" | "lg"

export interface ButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  href?: string
  type?: "button" | "submit" | "reset"
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  children?: React.ReactNode
  "aria-label"?: string
}

const variantClasses: Record<Variant, string> = {
  primary:          "bg-accent text-background hover:bg-accent/90",
  secondary:        "border border-border text-text-muted hover:text-text-primary",
  "secondary-soft": "border border-border text-text-muted hover:text-text-secondary hover:border-border-hover",
  ghost:            "border border-transparent text-text-muted hover:text-accent hover:border-accent-border",
  destructive:      "border border-red-500/30 text-red-400 hover:bg-red-500/10",
  "accent-ghost":   "border border-accent-border bg-accent-dim text-accent hover:bg-accent/20",
}

const sizeClasses: Record<Size, string> = {
  sm: "text-[12px] px-3 py-1.5",
  md: "text-[13px] px-4 py-2",
  lg: "text-[14px] px-5 py-2.5",
}

const iconClasses: Record<Size, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
}

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all " +
  "disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  href,
  type = "button",
  className,
  onClick,
  children,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading

  if (process.env.NODE_ENV !== "production" && !children && !ariaLabel) {
    console.warn("[Button] Icon-only button needs an aria-label for accessibility.")
  }

  const resolvedLeft = loading
    ? <Loader2 className={cn("animate-spin", iconClasses[size])} />
    : LeftIcon ? <LeftIcon className={iconClasses[size]} /> : null

  const resolvedRight = RightIcon ? <RightIcon className={iconClasses[size]} /> : null

  const classes = cn(BASE, variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)

  const inner = (
    <>
      {resolvedLeft}
      {children}
      {resolvedRight}
    </>
  )

  if (href) {
    if (isDisabled) {
      return (
        <a
          className={cn(classes, "pointer-events-none")}
          aria-disabled="true"
          tabIndex={-1}
          aria-label={ariaLabel}
        >
          {inner}
        </a>
      )
    }
    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={classes}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  )
}
