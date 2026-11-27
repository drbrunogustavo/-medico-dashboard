import * as React from "react"
import { cn } from "@/lib/utils"

type PanelProps = React.HTMLAttributes<HTMLElement> & {
  tone?: "light" | "strong" | "dark"
  as?: "section" | "div" | "article" | "aside"
}

/** Painel de vidro. Use `dark` para o bloco de maior contraste e `strong` para modais e menus. */
export function Panel({ tone = "light", as: Tag = "section", className, ...rest }: PanelProps) {
  return (
    <Tag
      className={cn(
        "rounded-px-panel p-5 box-border",
        tone === "light" && "px-glass",
        tone === "strong" && "px-glass-strong shadow-[0_10px_30px_rgba(20,20,20,0.16)]",
        tone === "dark" && "px-dark",
        className
      )}
      {...rest}
    />
  )
}
