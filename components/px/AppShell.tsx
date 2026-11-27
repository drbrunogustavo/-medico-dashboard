"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PillNav } from "@/components/px/PillNav"
import { NAV_GROUPS, groupIdForPath } from "@/lib/nav-config"
import { useAppContext } from "@/components/AppProvider"
import type { Plano } from "@/lib/app-types"
import { cn } from "@/lib/utils"

const PLANO_LABEL: Record<Plano, string> = { trial: "Teste", starter: "Starter", pro: "Pro", elite: "Elite" }

function iniciais(nome?: string | null, email?: string | null) {
  if (nome) {
    const r = nome.replace(/^Dr\.?a?\s*/i, "").trim().split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase()
    if (r) return r
  }
  return email?.slice(0, 2).toUpperCase() ?? "?"
}

/**
 * Casca do aplicativo: conteúdo em tela cheia e navegação flutuante na base.
 * Substitui a barra lateral. O conteúdo ganha folga embaixo para a pílula não cobrir nada.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ctx = useAppContext()
  const user = ctx?.user ?? null
  const perfil = ctx?.perfil ?? null
  const plano = (ctx?.plano ?? "trial") as Plano
  const signOut = ctx?.signOut ?? (async () => {})
  const isAdmin = !!user?.id && !!process.env.NEXT_PUBLIC_DOCTOR_USER_ID && user.id === process.env.NEXT_PUBLIC_DOCTOR_USER_ID

  const [naoLidos, setNaoLidos] = React.useState(0)
  const [contaAberta, setContaAberta] = React.useState(false)
  const contaRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const check = () => {
      if (document.hidden) return
      fetch("/api/crm/nao-lidos")
        .then(r => (r.ok ? (r.json() as Promise<{ count: number }>) : { count: 0 }))
        .then(d => setNaoLidos(d.count ?? 0))
        .catch(() => {})
    }
    check()
    const id = setInterval(check, 30_000)
    document.addEventListener("visibilitychange", check)
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", check) }
  }, [])

  React.useEffect(() => {
    if (!contaAberta) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContaAberta(false) }
    const onDown = (e: MouseEvent) => { if (contaRef.current && !contaRef.current.contains(e.target as Node)) setContaAberta(false) }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown) }
  }, [contaAberta])

  React.useEffect(() => { setContaAberta(false) }, [pathname])

  const groups = React.useMemo(
    () => NAV_GROUPS.map(g => ({ ...g, items: g.items.map(i => (i.href === "/crm" && naoLidos > 0 ? { ...i, count: naoLidos } : i)) })),
    [naoLidos]
  )

  const linkCls = "flex min-h-[40px] items-center rounded-px-ctl px-3 text-[13px] text-px-ink hover:bg-px-ink/10"

  const conta = (
    <div ref={contaRef} className="relative">
      <button
        type="button"
        onClick={() => setContaAberta(o => !o)}
        aria-expanded={contaAberta}
        aria-label="Conta"
        className={cn("ml-1 flex h-11 w-11 items-center justify-center rounded-full text-[12px] font-semibold", contaAberta ? "bg-px-ink text-white" : "bg-px-ink/10 text-px-ink hover:bg-px-ink/15")}
      >
        {iniciais(perfil?.nome, user?.email)}
      </button>
      {contaAberta ? (
        <div className="px px-glass-strong absolute bottom-[58px] right-0 w-[260px] rounded-px-panel p-3 shadow-[0_10px_30px_rgba(20,20,20,0.16)]">
          <div className="px-3 pb-2 pt-1">
            <div className="truncate text-[13px] font-semibold text-px-ink">{perfil?.nome ?? user?.email?.split("@")[0] ?? "Minha conta"}</div>
            <div className="truncate text-[11.5px] text-px-muted">{perfil?.especialidade ?? user?.email ?? ""}</div>
          </div>
          <div className="border-t border-px-line pt-1">
            <Link href="/planos" className={cn(linkCls, "justify-between")}><span>Plano</span><span className="text-[11.5px] font-semibold text-px-muted">{PLANO_LABEL[plano]}</span></Link>
            <Link href="/perfil" className={linkCls}>Perfil</Link>
            <Link href="/configuracoes" className={linkCls}>Configurações</Link>
            <Link href="/configuracoes/membros" className={linkCls}>Equipe</Link>
            {isAdmin ? <Link href="/admin/depoimentos" className={linkCls}>Administração</Link> : null}
            <button type="button" onClick={() => { setContaAberta(false); document.dispatchEvent(new CustomEvent("praxis:cmd-open")) }} className={cn(linkCls, "w-full justify-between text-left")}><span>Acesso rápido</span><span className="text-[11.5px] text-px-muted">Ctrl K</span></button>
            <Link href="/depoimento" className={linkCls}>Deixar depoimento</Link>
          </div>
          <div className="border-t border-px-line pt-1">
            <button type="button" onClick={() => signOut()} className={cn(linkCls, "w-full text-left text-px-danger")}>Sair</button>
          </div>
        </div>
      ) : null}
    </div>
  )

  return (
    <>
      <main className="px-bridge flex min-h-screen min-w-0 flex-1 flex-col bg-background pb-28">
        <div className="flex-1">{children}</div>
      </main>
      <div className="px">
        <PillNav groups={groups} activeId={groupIdForPath(pathname)} currentHref={pathname} trailing={conta} />
      </div>
    </>
  )
}
