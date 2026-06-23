"use client"

import { useState, useEffect, useCallback } from "react"
import { TopBar } from "@/components/TopBar"
import {
  Gift, Copy, Check, MessageCircle, Loader2,
  TrendingUp, DollarSign, Users, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AfiliadoData {
  codigo_afiliado:          string
  comissao_percentual:      number
  total_indicados:          number
  total_comissao_acumulada: number
  status:                   string
}

interface Indicacao {
  id:              string
  indicado_email:  string
  plano_assinado:  string | null
  valor_comissao:  number | null
  status:          "pendente" | "ativo" | "cancelado"
  created_at:      string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD    = "#b8976a"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://praxisplataforma.com.br"

const STATUS_UI = {
  pendente:  { label: "Pendente",  cls: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  ativo:     { label: "Ativo",     cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  cancelado: { label: "Cancelado", cls: "bg-red-500/10 text-red-400 border-red-500/25" },
} as const

const HOW_IT_WORKS = [
  { n: "1", title: "Compartilhe seu link", desc: "Envie para colegas médicos que podem se beneficiar do PRAXIS", color: "#3b7fff" },
  { n: "2", title: "Médico assina",        desc: "Quando seu indicado assinar qualquer plano, a comissão é registrada", color: GOLD },
  { n: "3", title: "Você recebe 20%/mês",  desc: "Comissão recorrente enquanto o médico mantiver a assinatura ativa", color: "#10b981" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AfiliadosPage() {
  const [afiliado,    setAfiliado]    = useState<AfiliadoData | null>(null)
  const [indicacoes,  setIndicacoes]  = useState<Indicacao[]>([])
  const [loading,     setLoading]     = useState(true)
  const [gerando,     setGerando]     = useState(false)
  const [copied,      setCopied]      = useState(false)
  const [pendente,    setPendente]    = useState(false)

  const fetchData = useCallback(async () => {
    const res  = await fetch("/api/afiliados")
    const data = await res.json()
    setAfiliado(data.afiliado    ?? null)
    setIndicacoes(data.indicacoes ?? [])
    if (data.afiliado?.status === "pendente") setPendente(true)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleGerarCodigo = async () => {
    setGerando(true)
    const res  = await fetch("/api/afiliados/gerar-codigo", { method: "POST" })
    const data = await res.json()
    if (data.afiliado) setAfiliado(data.afiliado as AfiliadoData)
    if (data.status === "pendente") setPendente(true)
    setGerando(false)
  }

  const linkAfiliado = afiliado
    ? `${APP_URL}/cadastro?ref=${afiliado.codigo_afiliado}`
    : ""

  const handleCopy = async () => {
    if (!linkAfiliado) return
    await navigator.clipboard.writeText(linkAfiliado)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsApp = () => {
    const texto = encodeURIComponent(
      `Olá! Estou usando o PRAXIS para gerenciar minha clínica e estou adorando. 🏥\n\nÉ uma plataforma completa para médicos — CRM, Copiloto IA, financeiro, conteúdo e muito mais.\n\nSe quiser conhecer, use meu link para ganhar acesso: ${linkAfiliado}`
    )
    window.open(`https://wa.me/?text=${texto}`, "_blank")
  }

  // Comissão este mês
  const mesAtual  = new Date().toISOString().slice(0, 7)
  const comissaoMes = indicacoes
    .filter(i => i.created_at.startsWith(mesAtual) && i.status === "ativo")
    .reduce((s, i) => s + (i.valor_comissao ?? 0), 0)

  if (loading) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Programa de Afiliados" subtitle="GANHE 20% DE COMISSÃO" tagline="Indique a plataforma e ganhe comissão por cada assinante que você trouxer." />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Programa de Afiliados" subtitle="GANHE 20% DE COMISSÃO RECORRENTE" tagline="Indique a plataforma e ganhe comissão por cada assinante que você trouxer." />
      <div className="p-6 max-w-3xl space-y-6">

        {/* Hero */}
        <div
          className="rounded-xl border p-6"
          style={{
            background:  "linear-gradient(135deg, rgba(184,151,106,0.08), rgba(212,175,55,0.04))",
            borderColor: "rgba(184,151,106,0.25)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(184,151,106,0.15)", border: "1px solid rgba(184,151,106,0.3)" }}
            >
              <Gift className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Indique o PRAXIS e ganhe 20% de comissão recorrente
              </h2>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Para cada médico que assinar o PRAXIS através do seu link, você recebe 20% do valor
                da assinatura todos os meses — enquanto ele mantiver ativo.
              </p>
            </div>
          </div>
        </div>

        {/* Seu link */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-mono font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-muted)" }}>
              Seu link de afiliado
            </p>
          </div>
          <div className="p-5">
            {!afiliado ? (
              <div className="text-center py-4">
                <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
                  Gere seu link de afiliado exclusivo para começar a indicar.
                </p>
                <button
                  onClick={handleGerarCodigo}
                  disabled={gerando}
                  className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-[13px] font-bold"
                  style={{ background: "linear-gradient(135deg, #b8976a, #d4af37)", color: "#fff" }}
                >
                  {gerando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {gerando ? "Gerando..." : "Gerar meu link"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border font-mono text-[12px] break-all"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <span className="flex-1 truncate">{linkAfiliado}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold transition-all"
                    style={{
                      background:  copied ? "rgba(16,185,129,0.1)"  : "var(--surface-2)",
                      borderColor: copied ? "rgba(16,185,129,0.3)"  : "var(--border)",
                      color:       copied ? "#10b981" : "var(--text-primary)",
                    }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar link"}
                  </button>
                  <button
                    onClick={handleWhatsApp}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold"
                    style={{ background: "#25D36620", border: "1px solid #25D36640", color: "#25D366" }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Compartilhar no WhatsApp
                  </button>
                </div>
                <p className="text-[11px] text-center" style={{ color: "var(--text-muted)" }}>
                  Código: <span className="font-mono font-bold" style={{ color: GOLD }}>{afiliado.codigo_afiliado}</span>
                  {" · "}{afiliado.comissao_percentual}% de comissão recorrente
                </p>
                {pendente && (
                  <div
                    className="mt-3 rounded-lg border px-4 py-3 text-[12px] leading-relaxed"
                    style={{
                      background:  "rgba(251,191,36,0.07)",
                      borderColor: "rgba(251,191,36,0.25)",
                      color:       "#fbbf24",
                    }}
                  >
                    <span className="font-semibold">Código gerado, mas comissão ainda não ativa.</span>{" "}
                    Para receber comissões você precisa ter uma assinatura ativa no PRAXIS.{" "}
                    <a href="/planos" style={{ color: GOLD, fontWeight: 600, textDecoration: "underline" }}>
                      Escolher plano →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total indicados",       value: afiliado?.total_indicados ?? 0,          icon: Users,       fmt: (v: number) => v.toString() },
            { label: "Comissão acumulada",    value: afiliado?.total_comissao_acumulada ?? 0, icon: DollarSign,  fmt: (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
            { label: "Comissão este mês",     value: comissaoMes,                             icon: TrendingUp,  fmt: (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl border p-4"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <Icon className="w-4 h-4 mb-2" style={{ color: GOLD }} />
                <p className="text-[18px] font-bold leading-none mb-1" style={{ color: "var(--text-primary)" }}>
                  {stat.fmt(stat.value)}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Indicações */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-mono font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-muted)" }}>
              Seus indicados
            </p>
          </div>
          {indicacoes.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                Nenhum indicado ainda — compartilhe seu link!
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Email","Plano","Status","Comissão"].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[10px] font-mono font-semibold tracking-[1.5px] uppercase"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indicacoes.map(ind => {
                  const st = STATUS_UI[ind.status] ?? STATUS_UI.pendente
                  return (
                    <tr key={ind.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--text-primary)" }}>
                        {ind.indicado_email}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>
                        {ind.plano_assinado ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border", st.cls)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: ind.valor_comissao ? "#10b981" : "var(--text-muted)" }}>
                        {ind.valor_comissao
                          ? ind.valor_comissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Como funciona */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[11px] font-mono font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-muted)" }}>
              Como funciona
            </p>
          </div>
          <div className="p-5 space-y-3">
            {HOW_IT_WORKS.map(step => (
              <div key={step.n} className="flex items-start gap-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-white"
                  style={{ background: step.color }}
                >
                  {step.n}
                </div>
                <div className="pt-0.5">
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    {step.desc}
                  </p>
                </div>
                {step.n !== "3" && (
                  <ChevronRight className="w-4 h-4 mt-1.5 flex-shrink-0 hidden md:block" style={{ color: "var(--text-muted)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
