"use client"

import * as React from "react"
import { PageHeader } from "@/components/px/PageHeader"

export { BellMenu } from "@/components/BellMenu"

// ─── TopBar ───────────────────────────────────────────────────────────────────
// Cabeçalho legado das páginas ainda não migradas. Passa a usar o cabeçalho novo
// (título grande em painel de vidro). O subtítulo em caixa alta foi descartado;
// a frase de apoio (tagline) vira a legenda do título.

interface TopBarProps {
  title:     string
  subtitle?: string
  tagline?:  string
  actions?:  React.ReactNode
}

export function TopBar({ title, tagline, actions }: TopBarProps) {
  return <PageHeader title={title} caption={tagline} actions={actions} />
}
