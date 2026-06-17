"use client"

import { useState } from "react"
import { TopBar } from "@/components/TopBar"
import {
  Download, CheckSquare, Square, Loader2,
  FileText, Users, TrendingUp, CircleDollarSign, Star, Bot,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

// ─── Types ────────────────────────────────────────────────────────────────────

type Format = "csv" | "json"

const EXPORT_TYPES = [
  {
    id:    "pacientes",
    label: "Pacientes",
    desc:  "Nome, telefone, email, observações",
    table: "pacientes_local",
    icon:  Users,
    cols:  ["nome","telefone","email","data_nascimento","observacao","created_at"],
  },
  {
    id:    "crm",
    label: "CRM de Leads",
    desc:  "Todos os leads e histórico de estágios",
    table: "crm_leads",
    icon:  TrendingUp,
    cols:  ["nome","telefone","email","estagio","origem","valor_estimado","observacao","created_at"],
  },
  {
    id:    "financeiro",
    label: "Financeiro",
    desc:  "Todos os lançamentos financeiros",
    table: "financeiro_lancamentos",
    icon:  CircleDollarSign,
    cols:  ["descricao","tipo","valor","data","categoria","paciente_nome","created_at"],
  },
  {
    id:    "consultas",
    label: "Histórico de Consultas",
    desc:  "Consultas realizadas com o Copiloto IA",
    table: "copiloto_historico",
    icon:  Bot,
    cols:  ["paciente_nome","data_consulta","resumo","created_at"],
  },
  {
    id:    "nps",
    label: "NPS e Pesquisas",
    desc:  "Todas as pesquisas de satisfação respondidas",
    table: "nps_pesquisas",
    icon:  Star,
    cols:  ["paciente_nome","nota","comentario","status","respondido_em","created_at"],
  },
  {
    id:    "pautas",
    label: "Conteúdo Gerado",
    desc:  "Pautas e ideias de conteúdo salvas",
    table: "pautas",
    icon:  FileText,
    cols:  ["titulo","categoria","prioridade","estagio","descricao","created_at"],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement("a")
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const GOLD = "#b8976a"

export default function ExportarPage() {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(EXPORT_TYPES.map(t => t.id))
  )
  const [format,  setFormat]  = useState<Format>("csv")
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null)

  const allSelected = selected.size === EXPORT_TYPES.length

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(EXPORT_TYPES.map(t => t.id)))

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleExport = async () => {
    if (selected.size === 0) return
    setLoading(true)
    setResult(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Não autenticado")

      const chosen  = EXPORT_TYPES.filter(t => selected.has(t.id))
      const allData: Record<string, unknown[]> = {}

      for (const tipo of chosen) {
        const { data, error } = await supabase
          .from(tipo.table)
          .select(tipo.cols.join(","))
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        if (error) console.warn(`[exportar] ${tipo.table}:`, error.message)
        allData[tipo.id] = data ?? []
      }

      const timestamp = new Date().toISOString().slice(0, 10)
      let total = 0

      if (format === "json") {
        const blob = new Blob(
          [JSON.stringify(allData, null, 2)],
          { type: "application/json" }
        )
        await triggerDownload(blob, `praxis-dados-${timestamp}.json`)
        total = Object.values(allData).reduce((s, r) => s + r.length, 0)
      } else {
        const Papa = (await import("papaparse")).default
        for (const tipo of chosen) {
          const rows = allData[tipo.id]
          total += rows.length
          if (!rows.length) continue
          const csv  = Papa.unparse(rows as object[])
          const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
          await triggerDownload(blob, `praxis-${tipo.id}-${timestamp}.csv`)
          await new Promise(r => setTimeout(r, 250))
        }
      }

      setResult({ ok: true, msg: `${total} registros exportados com sucesso.` })
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : "Erro ao exportar dados" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Exportar Dados" subtitle="SEUS DADOS · SUA DECISÃO" />
      <div className="p-6 max-w-2xl space-y-6">

        {/* Headline */}
        <div
          className="rounded-xl border p-5"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(184,151,106,0.12)", border: "1px solid rgba(184,151,106,0.25)" }}
            >
              <Download className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Seus dados são seus
              </h2>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                Exporte tudo quando quiser, sem burocracia
              </p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Você nunca fica preso à nossa plataforma. Exporte pacientes, leads, financeiro,
            consultas e muito mais — a qualquer momento, em segundos.
          </p>
        </div>

        {/* Select data */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <span
              className="text-[10px] font-mono font-semibold tracking-[2px] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              O que exportar
            </span>
            <button
              onClick={toggleAll}
              className="text-[12px] font-semibold"
              style={{ color: GOLD }}
            >
              {allSelected ? "Desmarcar tudo" : "Selecionar tudo"}
            </button>
          </div>

          {EXPORT_TYPES.map(tipo => {
            const Icon    = tipo.icon
            const checked = selected.has(tipo.id)
            return (
              <button
                key={tipo.id}
                onClick={() => toggle(tipo.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 border-b last:border-0 text-left transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background:   checked ? "rgba(184,151,106,0.12)" : "var(--surface-2)",
                    border: `1px solid ${checked ? "rgba(184,151,106,0.3)" : "var(--border)"}`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: checked ? GOLD : "var(--text-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {tipo.label}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {tipo.desc}
                  </p>
                </div>
                {checked
                  ? <CheckSquare className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                  : <Square      className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                }
              </button>
            )
          })}
        </div>

        {/* Format */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <span
              className="text-[10px] font-mono font-semibold tracking-[2px] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Formato do arquivo
            </span>
          </div>
          <div className="flex gap-3 px-5 py-4">
            {(["csv", "json"] as Format[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[12px] font-semibold transition-all"
                style={{
                  background:   format === f ? "rgba(184,151,106,0.1)" : "var(--surface-2)",
                  borderColor:  format === f ? "rgba(184,151,106,0.35)" : "var(--border)",
                  color:        format === f ? GOLD : "var(--text-muted)",
                }}
              >
                {f === "csv" ? "CSV (Excel)" : "JSON (técnico)"}
              </button>
            ))}
          </div>
          <p className="px-5 pb-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {format === "csv"
              ? "Um arquivo .csv por tipo de dado — abre diretamente no Excel e Google Sheets."
              : "Um arquivo .json consolidado com todos os dados selecionados — ideal para migração técnica."}
          </p>
        </div>

        {/* Result */}
        {result && (
          <div
            className="px-5 py-3 rounded-xl border text-[12px] font-medium"
            style={{
              background:  result.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              borderColor: result.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
              color:       result.ok ? "#10b981" : "#ef4444",
            }}
          >
            {result.msg}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleExport}
          disabled={loading || selected.size === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-bold transition-all"
          style={{
            background: selected.size === 0
              ? "var(--surface-2)"
              : "linear-gradient(135deg, #b8976a, #d4af37)",
            color:   selected.size === 0 ? "var(--text-muted)" : "#fff",
            opacity: loading ? 0.7 : 1,
            cursor:  selected.size === 0 ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />}
          {loading
            ? "Exportando..."
            : `Exportar ${selected.size} tipo${selected.size !== 1 ? "s" : ""} de dado${selected.size !== 1 ? "s" : ""}`}
        </button>

        <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
          Os arquivos são gerados e baixados diretamente no seu navegador. Nenhum dado é
          enviado para servidores externos durante o download.
        </p>

      </div>
    </div>
  )
}
