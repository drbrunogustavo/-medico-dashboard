"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { BellMenu } from "@/components/BellMenu"

interface PageHeaderProps {
  title: string
  caption?: string
  /** Ações da página, em linha logo abaixo do título. */
  actions?: React.ReactNode
  /** Mostra o botão de voltar no canto esquerdo. */
  back?: boolean
}

/**
 * Cabeçalho de página: título grande em painel de vidro, entre dois botões
 * quadrados arredondados (voltar e notificações), como nas referências.
 */
export function PageHeader({ title, caption, actions, back = false }: PageHeaderProps) {
  const router = useRouter()
  return (
    <header className="px-4 pt-5 md:px-10 md:pt-8">
      <div className="flex items-stretch gap-3">
        {back ? (
          <button type="button" onClick={() => router.back()} aria-label="Voltar" className="px-square flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] md:h-14 md:w-14 md:rounded-[20px]">
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : (
          <div className="hidden h-14 w-14 shrink-0 md:block" aria-hidden="true" />
        )}
        <div className="px-glass min-w-0 flex-1 rounded-px-panel px-5 py-4 text-center md:py-6">
          {caption ? <p className="mb-1 text-[13px] text-px-muted">{caption}</p> : null}
          <h1 className="truncate text-[34px] font-medium leading-[1.05] tracking-[-0.03em] text-px-ink md:text-[60px]">{title}</h1>
        </div>
        <BellMenu square />
      </div>
      {actions ? <div className="mt-3 flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
    </header>
  )
}
