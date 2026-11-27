"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, ArrowRight, RefreshCw } from "lucide-react"
import { Panel, PxButton, PxInput, Field, Tag, PageHeader, CopyButton, Segmented } from "@/components/px"

interface DiagnosticoForm {
  especialidade: string; tempo_atuacao: string; cidade: string; atendimento: string
  ticket_medio: string; paciente_ideal: string; maior_desafio: string; diferencial: string
}
interface PosicionamentoResult {
  nicho_ideal: { titulo: string; descricao: string; justificativa: string; tamanho_mercado: string }
  publico_alvo: { avatar_nome: string; demografia: string; psicografia: string; dores_principais: string[]; onde_encontrar: string; como_decide: string }
  diferenciais_competitivos: { diferenciais_atuais: string[]; diferenciais_a_desenvolver: string[]; proposta_de_valor: string }
  posicionamento_mercado: { posicionamento_atual: string; posicionamento_ideal: string; estrategia_transicao: string; benchmark: string }
  dores_publico: { dor: string; intensidade: "Alta" | "Média" | "Baixa"; conteudo_sugerido: string }[]
  linha_editorial: { pilares: { nome: string; descricao: string; percentual: string; exemplos: string[] }[]; frequencia_recomendada: string; formatos_prioritarios: string[] }
  estrategia_comunicacao: { tom_de_voz: string; palavras_chave: string[]; frases_a_evitar: string[]; storytelling: string }
  top10_temas: { tema: string; formato: string; justificativa: string; gancho: string }[]
}

const DESAFIOS = ["Agenda vazia", "Ticket baixo", "Dependência de convênio", "Sem posicionamento", "Concorrência", "Outro"]
const ATENDIMENTO_OPTS = ["Particular", "Convênio", "Ambos"]
const LOADING_PHRASES = [
  "Mapeando o posicionamento no mercado", "Identificando o nicho ideal", "Construindo o avatar de paciente",
  "Analisando os diferenciais competitivos", "Definindo a linha editorial", "Gerando os 10 temas prioritários", "Finalizando o relatório",
]
const EMPTY_FORM: DiagnosticoForm = { especialidade: "", tempo_atuacao: "", cidade: "", atendimento: "Particular", ticket_medio: "", paciente_ideal: "", maior_desafio: "", diferencial: "" }
const areaCls = "w-full resize-none rounded-px-ctl border border-px-ink/15 bg-white px-3 py-2.5 text-[14px] text-px-ink placeholder:text-px-muted focus:outline focus:outline-2 focus:outline-px-ink/40"
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : [])
const INT_TONE = { "Alta": "danger", "Média": "warn", "Baixa": "neutral" } as const

function Secao({ titulo, copyText, children }: { titulo: string; copyText: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <Panel as="section" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex min-w-0 flex-1 items-center gap-2 rounded-px-ctl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40">
          {open ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <h3 className="text-[15px] font-semibold text-px-ink">{titulo}</h3>
        </button>
        <CopyButton text={copyText} />
      </div>
      {open && <div className="space-y-3">{children}</div>}
    </Panel>
  )
}
const Caixa = ({ rotulo, children, forte = false }: { rotulo: string; children: React.ReactNode; forte?: boolean }) => (
  <div className={`rounded-px-card p-3 ${forte ? "bg-px-ink/[0.08]" : "bg-px-ink/[0.04]"}`}>
    <p className="mb-1 text-[12.5px] font-medium text-px-muted">{rotulo}</p>
    <div className="text-[13.5px] leading-relaxed text-px-ink">{children}</div>
  </div>
)
const Lista = ({ itens, riscado = false }: { itens: string[]; riscado?: boolean }) => (
  <ul className="list-disc space-y-1 pl-4">{itens.map((d, i) => <li key={i} className={riscado ? "line-through" : ""}>{d}</li>)}</ul>
)

function Carregando() {
  const [idx, setIdx] = useState(0)
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % LOADING_PHRASES.length), 1800); return () => clearInterval(t) }, [])
  return <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">{LOADING_PHRASES[idx]}. Pode levar até um minuto.</p>
}

function pillGroup(label: string, opts: string[], value: string, onChange: (v: string) => void) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {opts.map(o => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${value === o ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>{o}</button>
      ))}
    </div>
  )
}

function Relatorio({ r, form, onBack }: { r: PosicionamentoResult; form: DiagnosticoForm; onBack: () => void }) {
  const n = r.nicho_ideal, p = r.publico_alvo, d = r.diferenciais_competitivos, m = r.posicionamento_mercado, l = r.linha_editorial, c = r.estrategia_comunicacao
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Panel as="section" className="space-y-2">
        <p className="text-[12.5px] font-medium text-px-accent">Relatório de posicionamento</p>
        <h2 className="text-[20px] font-semibold leading-snug text-px-ink">{d?.proposta_de_valor}</h2>
        <p className="text-[13px] text-px-muted">{form.especialidade}, {form.cidade}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={onBack}>Ajustar diagnóstico</PxButton>
          <PxButton size="sm" href="/diretor-criativo">Abrir Diretor Criativo</PxButton>
        </div>
      </Panel>

      {n && <Secao titulo="Nicho ideal de atuação" copyText={`NICHO IDEAL\n\n${n.titulo}\n${n.descricao}\n\nJustificativa: ${n.justificativa}\nMercado: ${n.tamanho_mercado}`}>
        <Caixa rotulo={n.titulo} forte>{n.descricao}</Caixa>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Caixa rotulo="Justificativa">{n.justificativa}</Caixa><Caixa rotulo="Tamanho do mercado">{n.tamanho_mercado}</Caixa></div>
      </Secao>}

      {p && <Secao titulo="Público-alvo ideal" copyText={`PÚBLICO-ALVO\n\n${p.avatar_nome}\nDemografia: ${p.demografia}\nPsicografia: ${p.psicografia}\nDores: ${arr(p.dores_principais).join(", ")}\nOnde encontrar: ${p.onde_encontrar}\nComo decide: ${p.como_decide}`}>
        <Caixa rotulo={`${p.avatar_nome}, ${p.demografia}`} forte>{p.psicografia}</Caixa>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Caixa rotulo="Onde encontrar">{p.onde_encontrar}</Caixa><Caixa rotulo="Como decide">{p.como_decide}</Caixa>
          <Caixa rotulo="Dores principais"><Lista itens={arr(p.dores_principais)} /></Caixa>
        </div>
      </Secao>}

      {d && <Secao titulo="Diferenciais competitivos" copyText={`DIFERENCIAIS\n\nProposta de valor: ${d.proposta_de_valor}\n\nDiferenciais atuais:\n${arr(d.diferenciais_atuais).map(x => "- " + x).join("\n")}\n\nA desenvolver:\n${arr(d.diferenciais_a_desenvolver).map(x => "- " + x).join("\n")}`}>
        <Caixa rotulo="Proposta de valor única" forte>{d.proposta_de_valor}</Caixa>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Caixa rotulo="Diferenciais atuais"><Lista itens={arr(d.diferenciais_atuais)} /></Caixa><Caixa rotulo="A desenvolver"><Lista itens={arr(d.diferenciais_a_desenvolver)} /></Caixa></div>
      </Secao>}

      {m && <Secao titulo="Posicionamento de mercado" copyText={`POSICIONAMENTO\n\nAtual: ${m.posicionamento_atual}\nIdeal: ${m.posicionamento_ideal}\nTransição: ${m.estrategia_transicao}\nBenchmark: ${m.benchmark}`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Caixa rotulo="Como é percebido hoje">{m.posicionamento_atual}</Caixa><Caixa rotulo="Como deve ser percebido" forte>{m.posicionamento_ideal}</Caixa>
          <Caixa rotulo="Estratégia de transição">{m.estrategia_transicao}</Caixa><Caixa rotulo="Referências do mercado">{m.benchmark}</Caixa>
        </div>
      </Secao>}

      {arr(r.dores_publico).length > 0 && <Secao titulo="Principais dores do público" copyText={arr(r.dores_publico).map(x => `[${x.intensidade}] ${x.dor}\nConteúdo: ${x.conteudo_sugerido}`).join("\n\n")}>
        <ul className="space-y-2">{arr(r.dores_publico).map((x, i) => (
          <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3">
            <div className="flex items-start justify-between gap-2"><span className="text-[13.5px] font-medium text-px-ink">{x.dor}</span><Tag tone={INT_TONE[x.intensidade] ?? "neutral"}>{x.intensidade}</Tag></div>
            <p className="mt-1 text-[13px] text-px-ink/80">Conteúdo sugerido: {x.conteudo_sugerido}</p>
          </li>))}</ul>
      </Secao>}

      {l && <Secao titulo="Linha editorial recomendada" copyText={`LINHA EDITORIAL\n\nFrequência: ${l.frequencia_recomendada}\nFormatos: ${arr(l.formatos_prioritarios).join(", ")}\n\nPilares:\n${arr(l.pilares).map(x => `${x.nome} (${x.percentual}): ${x.descricao}\nExemplos: ${arr(x.exemplos).join(", ")}`).join("\n\n")}`}>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-px-ink"><span>Frequência: <span className="font-medium">{l.frequencia_recomendada}</span></span>{arr(l.formatos_prioritarios).map(f => <Tag key={f} tone="ink">{f}</Tag>)}</div>
        <ul className="space-y-2">{arr(l.pilares).map((x, i) => (
          <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3">
            <div className="flex justify-between"><span className="text-[13.5px] font-medium text-px-ink">{x.nome}</span><span className="text-[13px] font-semibold text-px-accent">{x.percentual}</span></div>
            <p className="mt-1 text-[13px] text-px-ink/80">{x.descricao}</p>
            {arr(x.exemplos).length > 0 && <p className="mt-1 text-[12.5px] text-px-muted">Exemplos: {arr(x.exemplos).join("; ")}</p>}
          </li>))}</ul>
      </Secao>}

      {c && <Secao titulo="Estratégia de comunicação" copyText={`COMUNICAÇÃO\n\nTom de voz: ${c.tom_de_voz}\nPalavras-chave: ${arr(c.palavras_chave).join(", ")}\nEvitar: ${arr(c.frases_a_evitar).join(", ")}\nStorytelling: ${c.storytelling}`}>
        <Caixa rotulo="Tom de voz" forte>{c.tom_de_voz}</Caixa>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Caixa rotulo="Palavras-chave">{arr(c.palavras_chave).join(", ")}</Caixa><Caixa rotulo="Frases a evitar"><Lista itens={arr(c.frases_a_evitar)} riscado /></Caixa></div>
        <Caixa rotulo="Storytelling">{c.storytelling}</Caixa>
      </Secao>}

      {arr(r.top10_temas).length > 0 && <Secao titulo="Top 10 temas prioritários" copyText={arr(r.top10_temas).map((t, i) => `${i + 1}. [${t.formato}] ${t.tema}\nGancho: ${t.gancho}\nPor quê: ${t.justificativa}`).join("\n\n")}>
        <ol className="space-y-2">{arr(r.top10_temas).map((t, i) => (
          <li key={i} className="rounded-px-card bg-px-ink/[0.04] p-3">
            <div className="flex items-start justify-between gap-2"><span className="text-[13.5px] font-medium text-px-ink">{i + 1}. {t.tema}</span><Tag tone="ink">{t.formato}</Tag></div>
            <p className="mt-1 text-[13px] text-px-ink/80">{t.justificativa}</p>
            <p className="mt-1 text-[13px] italic text-px-ink">Gancho: {t.gancho}</p>
          </li>))}</ol>
      </Secao>}
    </div>
  )
}

export default function PosicionamentoPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<DiagnosticoForm>(EMPTY_FORM)
  const [resultado, setResultado] = useState<PosicionamentoResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof DiagnosticoForm) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const canProceed = !!(form.especialidade.trim() && form.cidade.trim() && form.maior_desafio && form.diferencial.trim())

  async function gerar() {
    setStep(2); setError(null)
    try {
      const res = await fetch("/api/posicionamento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as PosicionamentoResult & { error?: string }
      if (data.error || !data.nicho_ideal) throw new Error(data.error ?? "resposta incompleta")
      setResultado(data); setStep(3)
    } catch (e) {
      console.error("[posicionamento] erro ao gerar:", e)
      setError("Não foi possível gerar o posicionamento. Seus dados foram mantidos, tente novamente."); setStep(1)
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Posicionamento Médico" caption={step === 3 ? "Relatório estratégico gerado a partir do seu diagnóstico" : "Oito perguntas para montar nicho, público e linha editorial"} />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        {step === 1 && (
          <form onSubmit={e => { e.preventDefault(); if (canProceed) gerar() }} className="mx-auto max-w-2xl space-y-4">
            {error && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{error}</p>}
            <Panel className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="1. Especialidade (obrigatório)" htmlFor="po-esp"><PxInput id="po-esp" value={form.especialidade} onChange={e => set("especialidade")(e.target.value)} placeholder="Ex: Endocrinologia, Cardiologia" /></Field>
                <Field label="2. Tempo de atuação" htmlFor="po-tempo"><PxInput id="po-tempo" value={form.tempo_atuacao} onChange={e => set("tempo_atuacao")(e.target.value)} placeholder="Ex: 5 anos, recém-formado" /></Field>
                <Field label="3. Cidade e bairro (obrigatório)" htmlFor="po-cid"><PxInput id="po-cid" value={form.cidade} onChange={e => set("cidade")(e.target.value)} placeholder="Ex: Poços de Caldas, Centro" /></Field>
                <Field label="5. Ticket médio atual" htmlFor="po-tk"><PxInput id="po-tk" value={form.ticket_medio} onChange={e => set("ticket_medio")(e.target.value)} placeholder="Ex: R$ 350 por consulta" /></Field>
              </div>
              <div className="space-y-1.5"><p className="text-[13px] font-medium text-px-ink">4. Tipo de atendimento</p>
                <Segmented label="Tipo de atendimento" value={form.atendimento} onChange={set("atendimento")} options={ATENDIMENTO_OPTS.map(o => ({ value: o, label: o }))} /></div>
              <Field label="6. Paciente ideal" htmlFor="po-pac"><textarea id="po-pac" rows={3} value={form.paciente_ideal} onChange={e => set("paciente_ideal")(e.target.value)} placeholder="Ex: mulher de 35 a 55 anos, preocupada com saúde hormonal e longevidade, disposta a investir em protocolo" className={areaCls} /></Field>
              <div className="space-y-1.5"><p className="text-[13px] font-medium text-px-ink">7. Maior desafio hoje (obrigatório)</p>{pillGroup("Maior desafio", DESAFIOS, form.maior_desafio, set("maior_desafio"))}</div>
              <Field label="8. Seu maior diferencial (obrigatório)" htmlFor="po-dif"><textarea id="po-dif" rows={3} value={form.diferencial} onChange={e => set("diferencial")(e.target.value)} placeholder="Ex: abordagem integrativa, combinando endocrinologia e nutrologia" className={areaCls} /></Field>
              <PxButton type="submit" rightIcon={ArrowRight} disabled={!canProceed}>Gerar posicionamento</PxButton>
              {!canProceed && <p className="text-[12.5px] text-px-muted">Preencha os campos marcados como obrigatórios para continuar.</p>}
            </Panel>
          </form>
        )}
        {step === 2 && <Carregando />}
        {step === 3 && resultado && <Relatorio r={resultado} form={form} onBack={() => setStep(1)} />}
      </div>
    </div>
  )
}
