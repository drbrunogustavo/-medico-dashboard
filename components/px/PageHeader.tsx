import * as React from "react"
import { BellMenu } from "@/components/TopBar"

/** Cabeçalho de página: título grande, linha de apoio opcional, ações e notificações à direita. */
export function PageHeader({ title, caption, actions }: { title: string; caption?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 px-5 pb-2 pt-8 md:px-10 md:pt-10">
      <div className="min-w-0">
        {caption ? <p className="mb-1 text-[13px] text-px-muted">{caption}</p> : null}
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-px-ink md:text-[38px]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <BellMenu />
      </div>
    </header>
  )
}
