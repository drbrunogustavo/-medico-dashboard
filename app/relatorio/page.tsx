"use client"

import { useEffect, useRef, useState } from "react"
import { Download } from "lucide-react"
import { Panel, PxButton, Field, PxSelect, BarList, PageHeader } from "@/components/px"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Metricas {
  totalLeads:       number
  leadsConvertidos: number
  taxaConversao:    number
  totalReceitas:    number
  totalDespesas:    number
  lucroLiquido:     number
  npsScore:         number | null
  npsMedia:         string
  npsNotas:         number
  pautasCriadas:    number
  pautasPublicadas: number
  origemLeads:      Record<string, number>
}

interface Analise {
  resumoExecutivo: string
  financeiro:      { avaliacao: string; pontosFortes: string[]; atencao: string }
  marketing:       { avaliacao: string; pontosFortes: string[]; atencao: string }
  clinico:         { avaliacao: string; pontosFortes: string[]; atencao: string }
  destaques:       string[]
  pontosAtencao:   string[]
  recomendacoes:   string[]
}

interface Relatorio {
  mes:      number
  ano:      number
  metricas: Metricas
  analise:  Analise
}

// ─── Auxiliares ──────────────────────────────────────────────────────────────

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const fmtN   = (v: number) => v.toLocaleString("pt-BR")

const LOADING_MSGS = [
  "Coletando dados do mês",
  "Analisando leads e conversões",
  "Processando indicadores financeiros",
  "Avaliando NPS e relacionamento",
  "Consultando a IA estratégica",
  "Gerando insights personalizados",
  "Finalizando recomendações",
]

function Numero({ label, value, negativo = false }: { label: string; value: string; negativo?: boolean }) {
  return (
    <Panel as="div" className="p-4">
      <p className="text-[12.5px] text-px-muted">{label}</p>
      <p className={`mt-1 text-[22px] font-medium leading-none tracking-[-0.02em] ${negativo ? "text-px-danger" : "text-px-ink"}`}>{value}</p>
    </Panel>
  )
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-px-ink/80">
      {(items ?? []).map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <Panel as="section" className="space-y-4 print:break-inside-avoid">
      <h2 className="text-[15px] font-semibold text-px-ink">{titulo}</h2>
      {children}
    </Panel>
  )
}

function Parecer({ avaliacao, fortes, rotuloFortes, rotuloAtencao, atencao }: {
  avaliacao: string; fortes: string[]; rotuloFortes: string; rotuloAtencao: string; atencao: string
}) {
  return (
    <>
      <p className="text-[13.5px] leading-relaxed text-px-ink/80">{avaliacao}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-1.5 text-[13px] font-semibold text-px-ink">{rotuloFortes}</h3>
          <Lista items={fortes} />
        </div>
        <div>
          <h3 className="mb-1.5 text-[13px] font-semibold text-px-ink">{rotuloAtencao}</h3>
          <p className="text-[13px] leading-relaxed text-px-ink/80">{atencao}</p>
        </div>
      </div>
    </>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function RelatorioPage() {
  const now = new Date()
  const anoAtual = now.getFullYear()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(anoAtual)
  const [relatorio,  setRelatorio]  = useState<Relatorio | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const [error,      setError]      = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const anos: number[] = []
  for (let y = 2024; y <= anoAtual; y++) anos.push(y)

  async function gerar() {
    setLoading(true)
    setError(null)
    setRelatorio(null)

    let i = 0
    setLoadingMsg(LOADING_MSGS[0])
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[i])
    }, 1800)

    try {
      const res  = await fetch("/api/relatorio", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mes, ano }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.error) { setError(data.error ?? "Não foi possível gerar o relatório. Tente novamente."); return }
      setRelatorio(data)
    } catch (e) {
      console.error("[relatorio] erro ao gerar relatório:", e)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      if (timer.current) { clearInterval(timer.current); timer.current = null }
      setLoading(false)
    }
  }

  const r = relatorio
  const m = r?.metricas
  const origem = m ? Object.entries(m.origemLeads).sort((a, b) => b[1] - a[1]).map(([rotulo, valor]) => ({ rotulo, valor })) : []

  return (
    <div className="animate-fade-in">
      <div className="print:hidden">
        <PageHeader
          title="Relatório Mensal"
          caption="Análise do mês com IA"
          actions={r ? <PxButton variant="secondary" size="sm" leftIcon={Download} onClick={() => window.print()}>Exportar PDF</PxButton> : undefined}
        />
      </div>

      <div className="max-w-5xl space-y-4 px-4 pb-10 md:px-10 print:p-4">
        <Panel className="flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
          <Field label="Mês" htmlFor="rel-mes">
            <PxSelect id="rel-mes" value={mes} onChange={e => setMes(parseInt(e.target.value, 10))} className="sm:min-w-[160px]">
              {MESES.map((nome, i) => <option key={nome} value={i + 1}>{nome}</option>)}
            </PxSelect>
          </Field>
          <Field label="Ano" htmlFor="rel-ano">
            <PxSelect id="rel-ano" value={ano} onChange={e => setAno(parseInt(e.target.value, 10))} className="sm:min-w-[110px]">
              {anos.map(y => <option key={y} value={y}>{y}</option>)}
            </PxSelect>
          </Field>
          <PxButton onClick={gerar} loading={loading}>{loading ? "Gerando" : "Gerar relatório"}</PxButton>
        </Panel>

        {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger print:hidden">{error}</p>}

        {loading && (
          <div className="py-20 text-center">
            <p role="status" className="text-[14px] font-medium text-px-ink">{loadingMsg}</p>
            <p className="mt-1 text-[12.5px] text-px-muted">Isso leva alguns segundos.</p>
          </div>
        )}

        {r && m && (
          <div className="space-y-4">
            <div className="hidden print:block">
              <h1 className="text-[22px] font-bold">Relatório Mensal PRAXIS</h1>
              <p className="text-[14px] text-gray-500">{MESES[r.mes - 1]} de {r.ano}</p>
              <hr className="mt-3" />
            </div>

            <Bloco titulo={`Resumo executivo de ${MESES[r.mes - 1]} de ${r.ano}`}>
              <p className="text-[13.5px] leading-relaxed text-px-ink/80">{r.analise.resumoExecutivo}</p>
            </Bloco>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              <Numero label="Receita"          value={fmtBRL(m.totalReceitas)} />
              <Numero label="Lucro líquido"    value={fmtBRL(m.lucroLiquido)} negativo={m.lucroLiquido < 0} />
              <Numero label="Leads"            value={fmtN(m.totalLeads)} />
              <Numero label="Conversão"        value={`${m.taxaConversao}%`} />
              <Numero label="NPS"              value={m.npsScore !== null ? String(m.npsScore) : "Sem dados"} />
              <Numero label="Pautas publicadas" value={fmtN(m.pautasPublicadas)} />
            </div>

            <Bloco titulo="Financeiro">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Numero label="Receita bruta"  value={fmtBRL(m.totalReceitas)} />
                <Numero label="Despesas"       value={fmtBRL(m.totalDespesas)} />
                <Numero label="Lucro líquido"  value={fmtBRL(m.lucroLiquido)} negativo={m.lucroLiquido < 0} />
              </div>
              <Parecer avaliacao={r.analise.financeiro.avaliacao} fortes={r.analise.financeiro.pontosFortes} rotuloFortes="Pontos fortes" rotuloAtencao="Atenção" atencao={r.analise.financeiro.atencao} />
            </Bloco>

            <Bloco titulo="Marketing e leads">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Numero label="Total de leads" value={fmtN(m.totalLeads)} />
                <Numero label="Convertidos"    value={fmtN(m.leadsConvertidos)} />
                <Numero label="Taxa de conversão" value={`${m.taxaConversao}%`} />
              </div>
              {origem.length > 0 && (
                <div>
                  <h3 className="mb-2 text-[13px] font-semibold text-px-ink">Origem dos leads</h3>
                  <BarList data={origem} />
                </div>
              )}
              <Parecer avaliacao={r.analise.marketing.avaliacao} fortes={r.analise.marketing.pontosFortes} rotuloFortes="Pontos fortes" rotuloAtencao="Oportunidade" atencao={r.analise.marketing.atencao} />
            </Bloco>

            <Bloco titulo="Clínico e NPS">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Numero label="NPS"         value={m.npsScore !== null ? String(m.npsScore) : "Sem dados"} />
                <Numero label="Nota média"  value={m.npsMedia} />
                <Numero label="Respostas"   value={fmtN(m.npsNotas)} />
              </div>
              <Parecer avaliacao={r.analise.clinico.avaliacao} fortes={r.analise.clinico.pontosFortes} rotuloFortes="Positivo" rotuloAtencao="Atenção" atencao={r.analise.clinico.atencao} />
            </Bloco>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Bloco titulo="Destaques do mês"><Lista items={r.analise.destaques} /></Bloco>
              <Bloco titulo="Pontos de atenção"><Lista items={r.analise.pontosAtencao} /></Bloco>
              <Bloco titulo="Recomendações"><Lista items={r.analise.recomendacoes} /></Bloco>
            </div>

            <p className="py-2 text-center text-[12.5px] text-px-muted">
              Relatório gerado pela IA do PRAXIS, {MESES[r.mes - 1]} de {r.ano}
            </p>
          </div>
        )}

        {!r && !loading && !error && (
          <Panel className="py-14 text-center print:hidden">
            <p className="text-[15px] font-semibold text-px-ink">Escolha o mês e gere o relatório</p>
            <p className="mt-1 text-[13px] text-px-muted">A IA analisa seus dados de receita, leads e NPS e monta um relatório completo.</p>
          </Panel>
        )}
      </div>
    </div>
  )
}
