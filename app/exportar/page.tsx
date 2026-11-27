"use client"

import { useState } from "react"
import { Panel, PxButton, PxCheckbox, Segmented, PageHeader } from "@/components/px"
import { Download, FileText, Users, TrendingUp, CircleDollarSign, Star, Bot } from "lucide-react"
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

// ─── Página ───────────────────────────────────────────────────────────────────

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
      const falhas: string[] = []

      for (const tipo of chosen) {
        const { data, error } = await supabase
          .from(tipo.table)
          .select(tipo.cols.join(","))
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        if (error) { console.warn(`[exportar] ${tipo.table}:`, error.message); falhas.push(tipo.label) }
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
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
          await triggerDownload(blob, `praxis-${tipo.id}-${timestamp}.csv`)
          await new Promise(r => setTimeout(r, 250))
        }
      }

      if (falhas.length > 0) {
        setResult({ ok: false, msg: `${total} registros exportados, mas não foi possível ler: ${falhas.join(", ")}. Esses dados não estão no arquivo.` })
      } else {
        setResult({ ok: true, msg: `${total} registros exportados.` })
      }
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : "Erro ao exportar dados" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Exportar" caption="Leve seus dados quando quiser" back />

      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-10 md:px-10">

        <Panel tone="light">
          <h2 className="text-[16px] font-semibold text-px-ink">Seus dados são seus</h2>
          <p className="mt-1 text-[13.5px] leading-relaxed text-px-ink/80">
            Exporte pacientes, leads, financeiro, consultas e demais registros a qualquer momento, sem depender de ninguém.
          </p>
        </Panel>

        <Panel tone="light" className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[15px] font-semibold text-px-ink">O que exportar</h2>
            <PxButton size="sm" variant="quiet" onClick={toggleAll}>{allSelected ? "Desmarcar tudo" : "Selecionar tudo"}</PxButton>
          </div>
          <ul className="divide-y divide-px-line border-t border-px-line">
            {EXPORT_TYPES.map(tipo => (
              <li key={tipo.id} className="px-5 py-3.5">
                <PxCheckbox
                  label={tipo.label}
                  checked={selected.has(tipo.id)}
                  onChange={() => toggle(tipo.id)}
                  className="font-medium"
                />
                <p className="pl-[26px] text-[12.5px] text-px-muted">{tipo.desc}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel tone="light" className="space-y-3">
          <h2 className="text-[15px] font-semibold text-px-ink">Formato do arquivo</h2>
          <Segmented
            label="Formato do arquivo"
            value={format}
            onChange={v => setFormat(v as Format)}
            options={[{ value: "csv", label: "CSV (Excel)" }, { value: "json", label: "JSON (técnico)" }]}
          />
          <p className="text-[12.5px] text-px-muted">
            {format === "csv"
              ? "Um arquivo .csv por tipo de dado. Abre direto no Excel e no Google Sheets."
              : "Um único arquivo .json com todos os dados selecionados, indicado para migração técnica."}
          </p>
        </Panel>

        {result && (
          <Panel tone="light">
            <p role={result.ok ? "status" : "alert"} className={`text-[13.5px] font-medium ${result.ok ? "text-px-ok" : "text-px-danger"}`}>
              {result.msg}
            </p>
          </Panel>
        )}

        <PxButton fullWidth leftIcon={Download} loading={loading} disabled={loading || selected.size === 0} onClick={handleExport}>
          {loading
            ? "Exportando"
            : `Exportar ${selected.size} tipo${selected.size !== 1 ? "s" : ""} de dado${selected.size !== 1 ? "s" : ""}`}
        </PxButton>

        <p className="text-center text-[12px] text-px-muted">
          Os arquivos são gerados e baixados no seu navegador, direto do banco de dados da sua conta.
        </p>
      </div>
    </div>
  )
}
