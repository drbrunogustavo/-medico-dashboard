"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FieldProps {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-px-muted">{label}</label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[12px] text-px-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-px-muted">{hint}</p>
      ) : null}
    </div>
  )
}

const control =
  "h-11 w-full rounded-px-ctl border border-px-line bg-white px-3.5 text-[13.5px] text-px-ink placeholder:text-px-muted " +
  "disabled:bg-px-ink/5 disabled:text-px-muted"

export const PxInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PxInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(control, className)} {...rest} />
  }
)

export const PxSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function PxSelect({ className, children, ...rest }, ref) {
    return <select ref={ref} className={cn(control, "pr-8", className)} {...rest}>{children}</select>
  }
)

interface PxCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> { label: string }

export function PxCheckbox({ label, className, ...rest }: PxCheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-[13px] text-px-ink", className)}>
      <input type="checkbox" className="h-4 w-4 accent-px-ink" {...rest} />
      <span>{label}</span>
    </label>
  )
}
