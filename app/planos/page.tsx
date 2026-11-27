"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, Minus } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Panel, PxButton, Tag } from "@/components/px"

interface UserPlan {
  plano: string
  status: string
  hasStripe: boolean
}

interface PlanDef {
  id: string
  name: string
  priceDisplay: string
  priceSub: string
  nota?: string
  limits: string
  support: string
  priceKey: string
  nivel: "starter" | "pro" | "elite"
}

const FEATURES = [
  { text: "Gerador de Roteiros e Legendas", starter: true, pro: true, elite: true },
  { text: "Banco de Pautas e Ganchos", starter: true, pro: true, elite: true },
  { text: "Calendário Editorial", starter: true, pro: true, elite: true },
  { text: "CRM de Leads", starter: true, pro: true, elite: true },
  { text: "Radar de Tendências (IA)", starter: false, pro: true, elite: true },
  { text: "Copiloto de Consulta", starter: false, pro: true, elite: true },
  { text: "Pesquisa NPS", starter: false, pro: true, elite: true },
  { text: "Precificação Inteligente", starter: false, pro: true, elite: true },
  { text: "Indicadores da Clínica", starter: false, pro: true, elite: true },
  { text: "Diretor Criativo (Imagens IA)", starter: false, pro: false, elite: true },
  { text: "Metas e Planejamento", starter: false, pro: false, elite: true },
  { text: "Calculadoras Clínicas", starter: false, pro: false, elite: true },
  { text: "Painel Executivo", starter: false, pro: false, elite: true },
  { text: "Consultor Estratégico IA", starter: false, pro: false, elite: true },
  { text: "Diagnóstico 360° da Clínica", starter: false, pro: false, elite: true },
  { text: "Expansão de Clínicas", starter: false, pro: false, elite: true },
  { text: "Predição de Crescimento", starter: false, pro: false, elite: true },
  { text: "Agente Executivo (WhatsApp)", starter: false, pro: false, elite: true },
]

const PLANS: PlanDef[] = [
  { id: "starter", name: "Starter", priceDisplay: "R$ 97", priceSub: "/mês", limits: "30 gerações por mês", support: "Suporte por e-mail", priceKey: "starter", nivel: "starter" },
  { id: "pro", name: "Pro", priceDisplay: "R$ 197", priceSub: "/mês", limits: "200 gerações por mês", support: "Suporte por WhatsApp", priceKey: "pro", nivel: "pro" },
  { id: "elite", name: "Elite", priceDisplay: "R$ 397", priceSub: "/mês", limits: "Gerações ilimitadas", support: "WhatsApp prioritário e onboarding 1:1", priceKey: "elite_monthly", nivel: "elite" },
  // 2.997 / 12 = 249,75 por mês; o mensal por 12 meses soma 4.764
  { id: "elite_annual", name: "Elite Anual", priceDisplay: "R$ 2.997", priceSub: "/ano", nota: "Equivale a R$ 249,75 por mês, contra R$ 4.764 em 12 meses no Elite mensal.", limits: "Gerações ilimitadas por 12 meses", support: "WhatsApp prioritário e onboarding 1:1", priceKey: "elite_annual", nivel: "elite" },
]

function isPlanActive(plan: PlanDef, up: UserPlan | null) {
  if (!up) return false
  // A API não informa se a assinatura Elite é mensal ou anual, então só o card mensal marca "plano atual".
  if (plan.id === "elite_annual") return false
  return up.plano === plan.id && up.status === "ativo"
}

const urlStripe = (u: unknown): u is string => typeof u === "string" && /^https:\/\//i.test(u)

function PlanCTA({ plan, userPlan, authed, loading, onCheckout, onPortal }: {
  plan: PlanDef
  userPlan: UserPlan | null
  authed: boolean | null
  loading: string | null
  onCheckout: (key: string) => void
  onPortal: () => void
}) {
  const atual = isPlanActive(plan, userPlan)
  const eliteComStripe = plan.nivel === "elite" && userPlan?.plano === "elite" && userPlan.status === "ativo" && userPlan.hasStripe

  if (authed === null) return <PxButton fullWidth loading disabled>Carregando</PxButton>

  if ((atual && userPlan?.hasStripe) || eliteComStripe) {
    return <PxButton fullWidth variant="secondary" loading={loading === "portal"} disabled={!!loading} onClick={onPortal}>Gerenciar assinatura</PxButton>
  }
  if (atual) return <p className="rounded-px-ctl bg-px-ink/[0.06] py-3 text-center text-[13.5px] font-semibold text-px-ink">Plano atual</p>
  if (!authed) return <PxButton fullWidth href="/cadastro">Começar 7 dias grátis</PxButton>
  return <PxButton fullWidth loading={loading === plan.priceKey} disabled={!!loading} onClick={() => onCheckout(plan.priceKey)}>Começar 7 dias grátis</PxButton>
}

export default function PlanosPage() {
  const { user, loading: authLoading } = useAuth()
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)

  const [sucesso, setSucesso] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activated, setActivated] = useState(false)
  const [activateErr, setActivateErr] = useState<string | null>(null)
  const iniciou = useRef(false)
  const vivo = useRef(true)

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setSucesso(p.get("pagamento") === "sucesso")
    setSessionId(p.get("session_id"))
    return () => { vivo.current = false }
  }, [])

  const authed: boolean | null = authLoading ? null : !!user

  useEffect(() => {
    if (!user) return
    setPlanLoading(true)
    fetch("/api/planos")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setUserPlan(d) })
      .catch(e => console.error("[planos] erro ao carregar plano:", e))
      .finally(() => setPlanLoading(false))
  }, [user])

  // Depois do retorno do Stripe: confirma a sessão. O pagamento pode demorar a constar, então tenta até 6 vezes, a cada 3 s.
  const confirmar = useCallback(async (n: number): Promise<void> => {
    if (!vivo.current) return
    setActivateErr(null)
    try {
      const r = await fetch("/api/stripe/confirm-session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: sessionId }) })
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (r.ok && data.ok) {
        setActivated(true)
        window.location.href = "/dashboard"
        return
      }
      if (n < 6) { setTimeout(() => { void confirmar(n + 1) }, 3000); return }
      setActivateErr(data.error ?? "O pagamento ainda não foi confirmado.")
    } catch (e) {
      console.error("[planos] erro ao confirmar sessão Stripe:", e)
      if (n < 6) { setTimeout(() => { void confirmar(n + 1) }, 3000); return }
      setActivateErr("Erro de conexão ao confirmar o pagamento.")
    }
  }, [sessionId])

  useEffect(() => {
    if (!sucesso || !user || !sessionId || iniciou.current) return
    iniciou.current = true
    void confirmar(1)
  }, [sucesso, user, sessionId, confirmar])

  async function irParaStripe(url: string, corpo: unknown, chave: string, msgPadrao: string) {
    setStripeError(null); setLoading(chave)
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (urlStripe(data.url)) { window.location.href = data.url; return }
      setStripeError(data.error ?? msgPadrao)
    } catch (e) {
      console.error("[planos] erro de conexão com o Stripe:", e)
      setStripeError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(null)
    }
  }
  const handleCheckout = (priceKey: string) => irParaStripe("/api/stripe/checkout", { plano: priceKey }, priceKey, "Erro ao iniciar o pagamento. Tente novamente.")
  const handlePortal = () => irParaStripe("/api/stripe/portal", null, "portal", "Erro ao abrir o portal da assinatura.")

  const ctaAuthed: boolean | null = authed === null ? null : authed && planLoading ? null : authed
  const home = user ? "/dashboard" : "/"

  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <header className="relative z-10 flex h-16 items-center justify-between px-6 md:px-12">
        <Link href={home} className="text-[15px] font-semibold tracking-[0.3em] text-px-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">PRAXIS</Link>
        <PxButton size="sm" href={user ? "/dashboard" : "/login"}>{user ? "Ir para o app" : "Entrar"}</PxButton>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-6 md:px-8">
        {sucesso ? (
          <Panel className="mx-auto max-w-md space-y-4 py-12 text-center">
            <h1 className="text-[22px] font-semibold text-px-ink">{activated ? "Conta ativada" : "Ativando sua conta"}</h1>
            <p role={activateErr ? "alert" : "status"} className={`text-[14px] ${activateErr ? "text-px-danger" : "text-px-muted"}`}>
              {activated ? "Redirecionando para o painel." : activateErr ?? "Confirmando o pagamento com o Stripe. Pode levar alguns segundos."}
            </p>
            {activateErr && !activated && (
              <div className="flex flex-wrap justify-center gap-2">
                <PxButton onClick={() => { void confirmar(1) }}>Tentar de novo</PxButton>
                <PxButton variant="secondary" href="/dashboard">Ir para o painel</PxButton>
              </div>
            )}
          </Panel>
        ) : (
          <>
            <div className="mx-auto max-w-xl space-y-2 text-center">
              <h1 className="text-[28px] font-semibold text-px-ink md:text-[34px]">Planos e preços</h1>
              <p className="text-[14.5px] text-px-muted">7 dias grátis em qualquer plano. Cancele quando quiser.</p>
            </div>

            {stripeError && (
              <div role="alert" className="mx-auto max-w-2xl rounded-px-card bg-px-danger-soft px-4 py-3">
                <p className="text-[14px] font-semibold text-px-danger">Não foi possível continuar</p>
                <p className="text-[13px] text-px-danger">{stripeError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {PLANS.map(plan => {
                const atual = isPlanActive(plan, userPlan)
                return (
                  <Panel key={plan.id} as="article" aria-label={`Plano ${plan.name}`} className={`flex flex-col ${atual ? "ring-2 ring-px-ink" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[17px] font-semibold text-px-ink">{plan.name}</h2>
                      {atual && <Tag tone="ink">Plano atual</Tag>}
                    </div>
                    <p className="mt-3 flex items-baseline gap-1">
                      <span className="text-[34px] font-semibold leading-none text-px-ink">{plan.priceDisplay}</span>
                      <span className="text-[13px] text-px-muted">{plan.priceSub}</span>
                    </p>
                    {plan.nota && <p className="mt-2 text-[12.5px] text-px-muted">{plan.nota}</p>}
                    <ul className="mt-4 space-y-1 text-[13px] text-px-ink">
                      <li>{plan.limits}</li>
                      <li>{plan.support}</li>
                    </ul>
                    <ul className="my-4 flex-1 space-y-1.5 border-t border-px-ink/10 pt-4">
                      {FEATURES.map(f => {
                        const incl = f[plan.nivel]
                        return (
                          <li key={f.text} className={`flex items-start gap-2 text-[12.5px] leading-snug ${incl ? "text-px-ink" : "text-px-muted line-through"}`}>
                            {incl ? <Check aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Minus aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                            <span>{f.text}<span className="sr-only">{incl ? ": incluído" : ": não incluído"}</span></span>
                          </li>
                        )
                      })}
                    </ul>
                    <PlanCTA plan={plan} userPlan={userPlan} authed={ctaAuthed} loading={loading} onCheckout={handleCheckout} onPortal={handlePortal} />
                  </Panel>
                )
              })}
            </div>

            <p className="text-center text-[12.5px] text-px-muted">Acesso imediato após a confirmação. Pagamento processado pelo Stripe.</p>
          </>
        )}
      </main>

      <footer className="relative z-10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[12.5px] text-px-muted">
          <p>© Praxis {new Date().getFullYear()}</p>
          <nav aria-label="Rodapé" className="flex gap-4">
            <Link href="/termos" className="underline underline-offset-2">Termos</Link>
            <Link href="/privacidade" className="underline underline-offset-2">Privacidade</Link>
            <Link href={home} className="underline underline-offset-2">Voltar</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
