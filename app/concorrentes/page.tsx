"use client"

import { useState } from "react"
import { BarChart2, Zap, RefreshCw } from "lucide-react"
import { Panel, PxButton, PxInput, Field, Tag, PageHeader, CopyButton, Segmented } from "@/components/px"

type TipoAnalise = "estrategia" | "posicionamento" | "pontos_fracos" | "completa"
type Prioridade = "Alta" | "Média" | "Baixa"
type AbaAtiva = "concorrente" | "benchmark" | "crescimento"

interface AnaliseResult {
  visao_geral: { resumo: string; seguidores_estimados: string; frequencia_posting: string; formatos_principais: string[]; especialidade_percebida: string }
  estrategia_conteudo: { frequencia: string; formatos: { tipo: string; percentual: string; observacao: string }[]; temas_recorrentes: string[]; ganchos_tipicos: string[]; analise_geral: string }
  posicionamento: { proposta_valor: string; publico_alvo: string; tom_comunicacao: string; diferenciais: string[]; comparacao_com_voce: string }
  pontos_fracos: { gap: string; oportunidade: string; como_aproveitar: string; prioridade: Prioridade }[]
  recomendacoes: { acao: string; justificativa: string; formato_sugerido: string; prioridade: Prioridade }[]
}
interface BenchmarkResult {
  pontuacao_geral: string; posicao_estimada: string; nivel: string
  comparativo: { metrica: string; seu_valor: string; media_especialidade: string; top10_especialidade: string; avaliacao: "Abaixo" | "Na média" | "Acima" | "Destaque" }[]
  pontos_fortes: string[]; lacunas_criticas: string[]; acoes_prioritarias: string[]; diagnostico: string
}
interface CrescimentoResult {
  pontuacao: number; nivel: string; meta_realista: string; analise_atual: string; bio_otimizada: string
  acoes_90_dias: { semana: string; acao: string; motivo: string; formato: string }[]
  temas_que_mais_convertem: string[]; hashtags_recomendadas: string[]; erros_evitar: string[]
}

const TIPOS: { value: TipoAnalise; label: string; desc: string }[] = [
  { value: "estrategia", label: "Estratégia de conteúdo", desc: "Frequência, formatos e temas" },
  { value: "posicionamento", label: "Posicionamento", desc: "Diferenciais, público e tom" },
  { value: "pontos_fracos", label: "Pontos fracos", desc: "Lacunas e oportunidades" },
  { value: "completa", label: "Análise completa", desc: "Todas as dimensões" },
]
const PRIO_TONE = { Alta: "danger", Média: "warn", Baixa: "neutral" } as const
const AVAL_TONE = { "Abaixo": "danger", "Na média": "warn", "Acima": "ok", "Destaque": "ink" } as const
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : [])
const areaCls = "w-full resize-none rounded-px-ctl border border-px-ink/15 bg-white px-3 py-2.5 text-[14px] text-px-ink placeholder:text-px-muted focus:outline focus:outline-2 focus:outline-px-ink/40"
const AVISO_IA = "Valores estimados pela IA a partir do que você informou. Não vêm de uma base de dados do Instagram; use como direção, não como medição."

const Caixa = ({ rotulo, children, forte = false }: { rotulo: string; children: React.ReactNode; forte?: boolean }) => (
  <div className={`rounded-px-card p-3 ${forte ? "bg-px-ink/[0.08]" : "bg-px-ink/[0.04]"}`}>
    <p className="mb-1 text-[12.5px] font-medium text-px-muted">{rotulo}</p>
    <div className="text-[13.5px] leading-relaxed text-px-ink">{children}</div>
  </div>
)
const Lista = ({ itens }: { itens: string[] }) => <ul className="list-disc space-y-1 pl-4">{itens.map((d, i) => <li key={i}>{d}</li>)}</ul>
const Bloco = ({ titulo, copia, children }: { titulo: string; copia: string; children: React.ReactNode }) => (
  <Panel as="section" className="space-y-3">
    <div className="flex items-center justify-between gap-2"><h3 className="text-[15px] font-semibold text-px-ink">{titulo}</h3><CopyButton text={copia} /></div>
    {children}
  </Panel>
)

function ConcorrenteResults({ r, nome, onSave, savingId, aviso }: { r: AnaliseResult; nome: string; onSave: (rec: AnaliseResult["recomendacoes"][number], i: number) => void; savingId: number | null; aviso: { ok: boolean; texto: string } | null }) {
  const v = r.visao_geral, e = r.estrategia_conteudo, p = r.posicionamento
  return (
    <div className="space-y-4">
      <p className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-warn">A IA não acessa o perfil do concorrente. A análise parte do nome, do @ e do contexto informados e pode conter erros. {AVISO_IA}</p>
      {v && <Bloco titulo="Visão geral" copia={`VISÃO GERAL\n\n${v.resumo}\n\nSeguidores: ${v.seguidores_estimados}\nFrequência: ${v.frequencia_posting}\nFormatos: ${arr(v.formatos_principais).join(", ")}\nEspecialidade: ${v.especialidade_percebida}`}>
        <p className="text-[13.5px] leading-relaxed text-px-ink/85">{v.resumo}</p>
        <div className="grid grid-cols-2 gap-2"><Caixa rotulo="Seguidores (estimativa)">{v.seguidores_estimados}</Caixa><Caixa rotulo="Frequência de posts">{v.frequencia_posting}</Caixa></div>
        <div className="flex flex-wrap gap-1.5">{arr(v.formatos_principais).map(f => <Tag key={f} tone="ink">{f}</Tag>)}</div>
        <p className="text-[13px] text-px-muted">Posicionamento percebido: <span className="text-px-ink">{v.especialidade_percebida}</span></p>
      </Bloco>}
      {e && <Bloco titulo="Estratégia de conteúdo" copia={`ESTRATÉGIA\n\nFrequência: ${e.frequencia}\n\nFormatos:\n${arr(e.formatos).map(f => `- ${f.tipo} (${f.percentual}): ${f.observacao}`).join("\n")}\n\nTemas:\n${arr(e.temas_recorrentes).map(t => `- ${t}`).join("\n")}\n\nGanchos:\n${arr(e.ganchos_tipicos).map(g => `- ${g}`).join("\n")}\n\nAnálise: ${e.analise_geral}`}>
        <Caixa rotulo="Frequência">{e.frequencia}</Caixa>
        <ul className="space-y-1.5">{arr(e.formatos).map((f, i) => <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-2.5 text-[13px] text-px-ink"><span className="font-semibold">{f.percentual}</span> {f.tipo}: {f.observacao}</li>)}</ul>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Caixa rotulo="Temas recorrentes"><Lista itens={arr(e.temas_recorrentes)} /></Caixa><Caixa rotulo="Ganchos típicos"><Lista itens={arr(e.ganchos_tipicos)} /></Caixa></div>
        <p className="text-[13px] italic text-px-ink/80">{e.analise_geral}</p>
      </Bloco>}
      {p && <Bloco titulo="Posicionamento" copia={`POSICIONAMENTO\n\nProposta de valor: ${p.proposta_valor}\nPúblico-alvo: ${p.publico_alvo}\nTom: ${p.tom_comunicacao}\n\nDiferenciais:\n${arr(p.diferenciais).map(d => `- ${d}`).join("\n")}\n\nComparação: ${p.comparacao_com_voce}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Caixa rotulo="Proposta de valor">{p.proposta_valor}</Caixa><Caixa rotulo="Público-alvo">{p.publico_alvo}</Caixa><Caixa rotulo="Tom de comunicação">{p.tom_comunicacao}</Caixa><Caixa rotulo="Diferenciais"><Lista itens={arr(p.diferenciais)} /></Caixa></div>
        <Caixa rotulo="Comparação com você" forte>{p.comparacao_com_voce}</Caixa>
      </Bloco>}
      {arr(r.pontos_fracos).length > 0 && <Bloco titulo="Pontos fracos e oportunidades" copia={`PONTOS FRACOS\n\n${arr(r.pontos_fracos).map((x, i) => `${i + 1}. ${x.gap} [${x.prioridade}]\nOportunidade: ${x.oportunidade}\nComo aproveitar: ${x.como_aproveitar}`).join("\n\n")}`}>
        <ul className="space-y-2">{arr(r.pontos_fracos).map((x, i) => (
          <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3">
            <div className="flex items-start justify-between gap-2"><span className="text-[13.5px] font-medium text-px-ink">{x.gap}</span><Tag tone={PRIO_TONE[x.prioridade] ?? "neutral"}>{x.prioridade}</Tag></div>
            <p className="mt-1 text-[13px] text-px-ink/80">Oportunidade: {x.oportunidade}</p><p className="mt-1 text-[13px] text-px-ink/80">Como aproveitar: {x.como_aproveitar}</p>
          </li>))}</ul>
      </Bloco>}
      {arr(r.recomendacoes).length > 0 && <Bloco titulo="Recomendações para você" copia={`RECOMENDAÇÕES\n\n${arr(r.recomendacoes).map((x, i) => `${i + 1}. ${x.acao} [${x.prioridade}]\n${x.justificativa}\nFormato sugerido: ${x.formato_sugerido}`).join("\n\n")}`}>
        {aviso && <p role={aviso.ok ? "status" : "alert"} className={aviso.ok ? "text-[13px] text-px-ok" : "text-[13px] text-px-danger"}>{aviso.texto}</p>}
        <ul className="space-y-2">{arr(r.recomendacoes).map((x, i) => (
          <li key={i} className="space-y-2 rounded-px-card bg-px-ink/[0.04] p-3">
            <div className="flex items-start justify-between gap-2"><span className="text-[14px] font-medium leading-snug text-px-ink">{x.acao}</span><Tag tone={PRIO_TONE[x.prioridade] ?? "neutral"}>{x.prioridade}</Tag></div>
            <p className="text-[13px] leading-relaxed text-px-ink/80">{x.justificativa}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-px-ink/10 pt-2">
              <span className="text-[12.5px] text-px-muted">Formato sugerido: <span className="text-px-ink">{x.formato_sugerido}</span></span>
              <span className="flex gap-2">
                <PxButton variant="secondary" size="sm" href={`/roteiros?tema=${encodeURIComponent(x.acao)}`}>Criar roteiro</PxButton>
                <PxButton variant="secondary" size="sm" loading={savingId === i} onClick={() => onSave(x, i)} aria-label={`Salvar como pauta: ${x.acao}`}>Salvar como pauta</PxButton>
              </span>
            </div>
          </li>))}</ul>
        <p className="text-[12px] text-px-muted">Pautas salvas indicam o concorrente analisado: {nome}.</p>
      </Bloco>}
    </div>
  )
}

function BenchmarkResults({ r }: { r: BenchmarkResult }) {
  const score = parseFloat(String(r.pontuacao_geral).replace(",", "."))
  const pct = isNaN(score) ? null : Math.min(Math.max((score / 10) * 100, 0), 100)
  return (
    <div className="space-y-4">
      <p className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-warn">{AVISO_IA}</p>
      <Bloco titulo="Sua pontuação estimada" copia={`BENCHMARK\n\nPontuação: ${r.pontuacao_geral}\nPosição: ${r.posicao_estimada}\nNível: ${r.nivel}\n\n${r.diagnostico}\n\nComparativo:\n${arr(r.comparativo).map(c => `- ${c.metrica}: ${c.seu_valor} | Média: ${c.media_especialidade} | Top 10%: ${c.top10_especialidade} [${c.avaliacao}]`).join("\n")}\n\nAções prioritárias:\n${arr(r.acoes_prioritarias).map((a, i) => `${i + 1}. ${a}`).join("\n")}`}>
        <div className="flex items-end gap-3"><span className="text-[40px] font-semibold leading-none text-px-ink">{r.pontuacao_geral}</span><span className="pb-1 text-[13px] text-px-muted">{r.nivel}, {r.posicao_estimada}</span></div>
        {pct !== null && <div className="h-2 rounded-full bg-px-ink/10" role="img" aria-label={`Pontuação ${r.pontuacao_geral} de 10`}><div className="h-2 rounded-full bg-px-ink" style={{ width: `${pct}%` }} /></div>}
        <p className="text-[13.5px] leading-relaxed text-px-ink/85">{r.diagnostico}</p>
      </Bloco>
      {arr(r.comparativo).length > 0 && <Panel as="section" className="space-y-3">
        <h3 className="text-[15px] font-semibold text-px-ink">Comparativo por métrica</h3>
        <ul className="space-y-2">{arr(r.comparativo).map((c, i) => (
          <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3">
            <div className="flex items-start justify-between gap-2"><span className="text-[13.5px] font-medium text-px-ink">{c.metrica}</span><Tag tone={AVAL_TONE[c.avaliacao] ?? "neutral"}>{c.avaliacao}</Tag></div>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-[12.5px]"><div><dt className="text-px-muted">Seu valor</dt><dd className="font-semibold text-px-ink">{c.seu_valor}</dd></div><div><dt className="text-px-muted">Média</dt><dd className="text-px-ink">{c.media_especialidade}</dd></div><div><dt className="text-px-muted">Top 10%</dt><dd className="text-px-ink">{c.top10_especialidade}</dd></div></dl>
          </li>))}</ul>
      </Panel>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Panel className="space-y-2"><h3 className="text-[14px] font-semibold text-px-ink">Pontos fortes</h3><Lista itens={arr(r.pontos_fortes)} /></Panel>
        <Panel className="space-y-2"><h3 className="text-[14px] font-semibold text-px-ink">Lacunas críticas</h3><Lista itens={arr(r.lacunas_criticas)} /></Panel>
      </div>
      {arr(r.acoes_prioritarias).length > 0 && <Panel as="section" className="space-y-2"><h3 className="text-[15px] font-semibold text-px-ink">Ações para subir no ranking</h3><ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] text-px-ink">{arr(r.acoes_prioritarias).map((a, i) => <li key={i}>{a}</li>)}</ol></Panel>}
    </div>
  )
}

function CrescimentoResults({ r }: { r: CrescimentoResult }) {
  const pct = Math.min(Math.max(Number(r.pontuacao) || 0, 0), 100)
  return (
    <div className="space-y-4">
      <p className="rounded-px-card bg-px-warn-soft px-3 py-2 text-[12.5px] text-px-warn">{AVISO_IA}</p>
      <Bloco titulo="Pontuação de crescimento estimada" copia={`PLANO DE CRESCIMENTO 90 DIAS\n\nPontuação: ${pct}/100, ${r.nivel}\nMeta: ${r.meta_realista}\n\nBio otimizada:\n${r.bio_otimizada}\n\nPlano:\n${arr(r.acoes_90_dias).map(a => `${a.semana}: ${a.acao}\nFormato: ${a.formato}\nPor quê: ${a.motivo}`).join("\n\n")}\n\nHashtags: ${arr(r.hashtags_recomendadas).join(" ")}`}>
        <div className="flex items-end gap-3"><span className="text-[40px] font-semibold leading-none text-px-ink">{pct}</span><span className="pb-1 text-[13px] text-px-muted">de 100, {r.nivel}</span></div>
        <div className="h-2 rounded-full bg-px-ink/10" role="img" aria-label={`Pontuação ${pct} de 100`}><div className="h-2 rounded-full bg-px-ink" style={{ width: `${pct}%` }} /></div>
        <p className="text-[13.5px] leading-relaxed text-px-ink/85">{r.analise_atual}</p>
        <Caixa rotulo="Meta realista em 90 dias" forte>{r.meta_realista}</Caixa>
      </Bloco>
      <Panel as="section" className="space-y-2">
        <div className="flex items-center justify-between gap-2"><h3 className="text-[15px] font-semibold text-px-ink">Bio otimizada</h3><CopyButton text={r.bio_otimizada ?? ""} label="Copiar bio" /></div>
        <p className="whitespace-pre-wrap rounded-px-card bg-px-ink/[0.04] p-3 text-[14px] leading-relaxed text-px-ink">{r.bio_otimizada}</p>
      </Panel>
      <Panel as="section" className="space-y-3">
        <h3 className="text-[15px] font-semibold text-px-ink">Plano semana a semana, 90 dias</h3>
        <ul className="space-y-2">{arr(r.acoes_90_dias).map((a, i) => (
          <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3"><div className="flex flex-wrap items-center gap-2"><Tag tone="ink">{a.semana}</Tag><span className="text-[13.5px] font-medium text-px-ink">{a.acao}</span></div><p className="mt-1 text-[13px] text-px-ink/80">{a.motivo}</p><p className="mt-1 text-[12.5px] text-px-muted">Formato: {a.formato}</p></li>))}</ul>
      </Panel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel className="space-y-2"><h3 className="text-[14px] font-semibold text-px-ink">Temas com mais potencial</h3><Lista itens={arr(r.temas_que_mais_convertem)} /></Panel>
        <Panel className="space-y-2"><h3 className="text-[14px] font-semibold text-px-ink">Hashtags sugeridas</h3><p className="text-[13.5px] text-px-ink/85">{arr(r.hashtags_recomendadas).join(" ")}</p><h3 className="pt-2 text-[14px] font-semibold text-px-ink">Erros a evitar</h3><Lista itens={arr(r.erros_evitar)} /></Panel>
      </div>
    </div>
  )
}

const ABAS: { value: AbaAtiva; label: string }[] = [
  { value: "concorrente", label: "Concorrentes" }, { value: "benchmark", label: "Benchmark" }, { value: "crescimento", label: "Crescimento" },
]
const VAZIO: Record<AbaAtiva, { t: string; s: string }> = {
  concorrente: { t: "Nenhuma análise ainda", s: "Preencha o perfil do concorrente e clique em Analisar." },
  benchmark: { t: "Nenhum benchmark ainda", s: "Informe seus dados atuais para comparar com a sua especialidade." },
  crescimento: { t: "Nenhum plano ainda", s: "Informe a especialidade e os dados do Instagram para receber um plano de 90 dias." },
}

export default function ConcorrentesPage() {
  const [aba, setAba] = useState<AbaAtiva>("concorrente")
  const [nome, setNome] = useState(""); const [instagram, setInstagram] = useState(""); const [especialidade, setEspecialidade] = useState("")
  const [tipo, setTipo] = useState<TipoAnalise>("completa"); const [contexto, setContexto] = useState("")
  const [bmEsp, setBmEsp] = useState(""); const [bmCidade, setBmCidade] = useState(""); const [bmSeg, setBmSeg] = useState(""); const [bmPosts, setBmPosts] = useState(""); const [bmCtx, setBmCtx] = useState("")
  const [crInsta, setCrInsta] = useState(""); const [crEsp, setCrEsp] = useState(""); const [crSeg, setCrSeg] = useState(""); const [crBio, setCrBio] = useState(""); const [crDif, setCrDif] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)
  const [resC, setResC] = useState<AnaliseResult | null>(null)
  const [resB, setResB] = useState<BenchmarkResult | null>(null)
  const [resG, setResG] = useState<CrescimentoResult | null>(null)
  const [nomeAnalisado, setNomeAnalisado] = useState("")

  const obrigatorioOk = aba === "concorrente" ? !!nome.trim() : aba === "benchmark" ? !!bmEsp.trim() : !!crEsp.trim()
  const hasResult = aba === "concorrente" ? !!resC : aba === "benchmark" ? !!resB : !!resG

  async function analisar() {
    if (!obrigatorioOk || loading) return
    setError(null); setAviso(null); setLoading(true)
    let body: Record<string, unknown>
    if (aba === "concorrente") { body = { nome, instagram, especialidade, tipo, contexto }; setResC(null) }
    else if (aba === "benchmark") { body = { tipo: "benchmark", especialidade: bmEsp, cidade: bmCidade, seguidores_atuais: bmSeg, posts_semana: bmPosts, contexto: bmCtx }; setResB(null) }
    else { body = { tipo: "crescimento_instagram", instagram: crInsta, especialidade: crEsp, seguidores_atuais: crSeg, bio_atual: crBio, maior_dificuldade: crDif }; setResG(null) }
    try {
      const res = await fetch("/api/concorrentes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data || data.error) throw new Error(data?.error ?? "resposta vazia")
      if (aba === "concorrente") { setResC(data as AnaliseResult); setNomeAnalisado(nome) }
      else if (aba === "benchmark") setResB(data as BenchmarkResult)
      else setResG(data as CrescimentoResult)
    } catch (e) {
      console.error("[concorrentes] erro ao analisar:", e)
      setError("Não foi possível gerar a análise. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  async function salvarPauta(rec: AnaliseResult["recomendacoes"][number], idx: number) {
    setSavingId(idx); setAviso(null)
    try {
      const res = await fetch("/api/pautas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: rec.acao, categoria: "Concorrentes", prioridade: rec.prioridade ?? "Média", estagio: "Ideia", tags: [], nota: `${rec.justificativa}\n\nFormato sugerido: ${rec.formato_sugerido}\n\nConcorrente analisado: ${nomeAnalisado}` }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAviso({ ok: true, texto: "Pauta salva no Banco de Pautas." })
    } catch (e) {
      console.error("[concorrentes] erro ao salvar recomendação:", e)
      setAviso({ ok: false, texto: "Não foi possível salvar a pauta. Tente novamente." })
    } finally { setSavingId(null) }
  }

  const campo = (id: string, label: string, v: string, set: (s: string) => void, ph: string) => (
    <Field label={label} htmlFor={id}><PxInput id={id} value={v} onChange={e => set(e.target.value)} placeholder={ph} /></Field>
  )
  const arroba = (id: string, label: string, v: string, set: (s: string) => void, ph: string) => (
    <Field label={label} htmlFor={id}><PxInput id={id} value={v} onChange={e => set(e.target.value.replace(/@/g, ""))} placeholder={ph} /></Field>
  )
  const area = (id: string, label: string, v: string, set: (s: string) => void, ph: string, rows = 3) => (
    <Field label={label} hint="Opcional" htmlFor={id}><textarea id={id} rows={rows} value={v} onChange={e => set(e.target.value)} placeholder={ph} className={areaCls} /></Field>
  )

  return (
    <div className="animate-fade-in">
      <PageHeader title="Central de Inteligência" caption="Análise de concorrentes, benchmark da especialidade e plano de crescimento no Instagram" />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Tipo de análise" value={aba} onChange={v => { setAba(v); setError(null) }} options={ABAS} />
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_3fr]">
          <form onSubmit={e => { e.preventDefault(); analisar() }} className="space-y-4">
            <Panel as="section" className="space-y-3">
              {aba === "concorrente" && <>
                {campo("co-nome", "Nome do concorrente (obrigatório)", nome, setNome, "Dr. João Silva")}
                {arroba("co-ig", "Instagram", instagram, setInstagram, "drjoaosilva")}
                {campo("co-esp", "Especialidade", especialidade, setEspecialidade, "Endocrinologia, Nutrologia")}
                <div role="group" aria-label="Tipo de análise do concorrente" className="grid grid-cols-2 gap-2">
                  {TIPOS.map(t => (
                    <button key={t.value} type="button" aria-pressed={tipo === t.value} onClick={() => setTipo(t.value)}
                      className={`rounded-px-card border p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${tipo === t.value ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
                      <span className="block text-[13px] font-semibold leading-tight">{t.label}</span><span className={`block text-[12px] leading-snug ${tipo === t.value ? "text-white/80" : "text-px-muted"}`}>{t.desc}</span>
                    </button>))}
                </div>
                {area("co-ctx", "Contexto adicional", contexto, setContexto, "O que você já sabe: nicho, público, resultados observados")}
              </>}
              {aba === "benchmark" && <>
                {campo("bm-esp", "Especialidade (obrigatório)", bmEsp, setBmEsp, "Endocrinologia, Dermatologia")}
                {campo("bm-cid", "Cidade", bmCidade, setBmCidade, "São Paulo")}
                {campo("bm-seg", "Seguidores atuais", bmSeg, setBmSeg, "Ex: 1.200 ou 5 mil")}
                {campo("bm-posts", "Posts por semana", bmPosts, setBmPosts, "Ex: 3")}
                {area("bm-ctx", "Contexto adicional", bmCtx, setBmCtx, "Formatos que você usa, tempo no Instagram")}
              </>}
              {aba === "crescimento" && <>
                {campo("cr-esp", "Especialidade (obrigatório)", crEsp, setCrEsp, "Endocrinologia, Clínica Geral")}
                {arroba("cr-ig", "Instagram", crInsta, setCrInsta, "seuperfil")}
                {campo("cr-seg", "Seguidores atuais", crSeg, setCrSeg, "Ex: 820 ou 2,3 mil")}
                {area("cr-bio", "Bio atual", crBio, setCrBio, "Cole sua bio atual do Instagram", 2)}
                {area("cr-dif", "Maior dificuldade", crDif, setCrDif, "Ex: pouco tempo, não sei que conteúdo fazer", 2)}
              </>}
            </Panel>
            {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <PxButton type="submit" leftIcon={aba === "crescimento" ? Zap : BarChart2} loading={loading} disabled={!obrigatorioOk}>
                {loading ? "Analisando" : aba === "concorrente" ? "Analisar concorrente" : aba === "benchmark" ? "Gerar benchmark" : "Criar plano de crescimento"}
              </PxButton>
              {hasResult && <PxButton variant="secondary" leftIcon={RefreshCw} onClick={analisar} disabled={loading || !obrigatorioOk}>Reanalisar</PxButton>}
            </div>
          </form>

          <div aria-live="polite">
            {loading && <p role="status" className="py-16 text-center text-[14px] font-medium text-px-ink">Analisando com IA. Pode levar até um minuto.</p>}
            {!loading && !hasResult && <Panel className="py-12 text-center"><p className="text-[15px] font-semibold text-px-ink">{VAZIO[aba].t}</p><p className="mx-auto mt-1 max-w-sm text-[13px] text-px-muted">{VAZIO[aba].s}</p></Panel>}
            {!loading && aba === "concorrente" && resC && <ConcorrenteResults r={resC} nome={nomeAnalisado} onSave={salvarPauta} savingId={savingId} aviso={aviso} />}
            {!loading && aba === "benchmark" && resB && <BenchmarkResults r={resB} />}
            {!loading && aba === "crescimento" && resG && <CrescimentoResults r={resG} />}
          </div>
        </div>
      </div>
    </div>
  )
}
