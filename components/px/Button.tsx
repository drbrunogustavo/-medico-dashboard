"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "quiet" | "danger" | "inverse"
type Size = "sm" | "md"

export interface PxButtonProps {
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

const variants: Record<Variant, string> = {
  primary:   "bg-px-ink text-white hover:bg-black",
  secondary: "bg-white/60 text-px-ink border border-px-line hover:bg-white/90",
  quiet:     "bg-transparent text-px-ink hover:bg-px-ink/10",
  danger:    "bg-transparent text-px-danger border border-px-danger/40 hover:bg-px-danger-soft",
  inverse:   "bg-white text-px-ink hover:bg-white/90",
}
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[12.5px]",
  md: "h-11 px-5 text-[13.5px]",
}

export function PxButton({
  variant = "primary", size = "md", loading = false, disabled = false, fullWidth = false,
  leftIcon: Left, rightIcon: Right, href, type = "button", className, onClick, children,
  "aria-label": ariaLabel,
}: PxButtonProps) {
  const off = disabled || loading
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-px-ctl font-semibold whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:bg-px-ink/10 disabled:text-px-muted disabled:border-transparent",
    variants[variant], sizes[size], fullWidth && "w-full", className
  )
  const inner = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Left ? <Left className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
      {Right ? <Right className="h-4 w-4" aria-hidden="true" /> : null}
    </>
  )
  if (href && !off) {
    return <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}>{inner}</Link>
  }
  return (
    <button type={type} disabled={off} className={classes} aria-label={ariaLabel} onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}>
      {inner}
    </button>
  )
}
