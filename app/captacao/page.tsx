"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Panel, PxButton, Field, PxInput, PxSelect } from "@/components/px"

// ── Dados ─────────────────────────────────────────────────────────────────────

const WHATSAPP_MG = "https://wa.me/5535997688008"
const WHATSAPP_SC = "https://wa.me/5547988631862"

const LOCAIS = [
  { v: "Poços de Caldas", regiao: "mg" },
  { v: "Alfenas", regiao: "mg" },
  { v: "São Paulo", regiao: "mg" },
  { v: "Balneário Camboriú", regiao: "sc" },
  { v: "Online", regiao: "ambos" },
] as const

const PROGRAMS = [
  { name: "Evolução Metabólica", desc: "Emagrecimento com acompanhamento hormonal, metabólico e nutricional individualizado." },
  { name: "Longevidade Ativa", desc: "Prevenção e otimização do envelhecimento, com foco em qualidade de vida e saúde hormonal." },
  { name: "Check-up Executivo", desc: "Avaliação de saúde com exames, análise de risco cardiovascular e metabólico." },
]

const STEPS = [
  { n: "1", t: "Preencha o formulário", d: "Informe seus dados e o motivo do contato." },
  { n: "2", t: "A equipe chama você", d: "O contato é feito por WhatsApp, pela equipe da sua região." },
  { n: "3", t: "Agendamento", d: "Combinamos dia, horário e se a consulta será presencial ou online." },
  { n: "4", t: "Consulta", d: "Avaliação clínica e plano individualizado." },
]

const INTERESSES = ["Emagrecimento", "Hormônios", "Longevidade", "Check-up completo", "Outro"]
const COMO_ENCONTROU = [
  { v: "instagram", l: "Instagram" },
  { v: "indicacao", l: "Indicação de amigo ou paciente" },
  { v: "google", l: "Google" },
  { v: "outro", l: "Outro" },
]

const FAQ = [
  { q: "Como é a consulta?", a: "A avaliação investiga causas hormonais, metabólicas, nutricionais e comportamentais e termina com um plano individualizado. Duração e valores são informados pela equipe no momento do agendamento." },
  { q: "A consulta é presencial ou online?", a: "Os dois formatos existem. O atendimento presencial é em Poços de Caldas, Alfenas, São Paulo e Balneário Camboriú. A consulta online também é agendada pelas duas equipes." },
  { q: "Como funciona o contato depois do formulário?", a: "A equipe da sua região chama você pelo WhatsApp para agendar. A equipe de Santa Catarina atende em horário comercial." },
  { q: "Quais são os valores?", a: "Os valores são passados diretamente pela equipe, no agendamento." },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CaptacaoPage() {
  const [form, setForm] = useState({ nome: "", whatsapp: "", email: "", local: "", interesse: "", como_encontrou: "", mensagem: "" })
  const [step, setStep] = useState<"idle" | "sending" | "done">("idle")
  const [erro, setErro] = useState("")
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: k === "whatsapp" ? fmtPhone(e.target.value) : e.target.value }))

  const regiao = LOCAIS.find(l => l.v === form.local)?.regiao ?? "ambos"

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (step === "sending") return
    if (form.nome.trim().length < 2) { setErro("Informe seu nome."); return }
    if (form.whatsapp.replace(/\D/g, "").length < 10) { setErro("Informe um WhatsApp com DDD."); return }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) { setErro("O e-mail informado não parece válido."); return }
    setErro(""); setStep("sending")
    const mensagem = [form.local ? `Local de atendimento: ${form.local}` : "", form.mensagem.trim()].filter(Boolean).join(" | ")
    try {
      const r = await fetch("/api/captacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome.trim(), whatsapp: form.whatsapp.replace(/\D/g, ""), email: form.email.trim(),
          interesse: form.interesse, como_encontrou: form.como_encontrou, mensagem,
        }),
      })
      if (r.ok) setStep("done")
      else { setErro(r.status === 429 ? "Muitas tentativas seguidas. Aguarde um minuto e tente de novo." : "Não foi possível enviar agora. Seus dados foram mantidos, tente de novo ou fale direto pelo WhatsApp abaixo."); setStep("idle") }
    } catch {
      setErro("Não foi possível enviar. Confira a conexão e tente de novo."); setStep("idle")
    }
  }

  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[920px] space-y-6 px-4 pb-16 pt-6">

        <header className="flex items-center justify-between">
          <span className="text-[20px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</span>
          <PxButton href="#formulario" size="sm">Agendar consulta</PxButton>
        </header>

        <Panel as="section" className="space-y-4 !p-8 text-center md:!p-12">
          <h1 className="text-[32px] font-medium leading-[1.1] tracking-[-0.02em] text-px-ink md:text-[48px]">
            Consulta médica com foco em saúde metabólica e hormonal
          </h1>
          <p className="mx-auto max-w-[620px] text-[16px] leading-relaxed text-px-muted">
            Atendimento individualizado em emagrecimento, hormônios, nutrição e prevenção. Presencial em Poços de Caldas, Alfenas, São Paulo e Balneário Camboriú, e também online.
          </p>
          <div className="flex flex-col items-center justify-center gap-2 pt-2 sm:flex-row">
            <PxButton href="#formulario">Quero agendar minha consulta</PxButton>
            <PxButton href="#programas" variant="secondary">Conhecer os programas</PxButton>
          </div>
        </Panel>

        <Panel as="section" className="space-y-3">
          <h2 className="text-[22px] font-semibold text-px-ink">Dr. Bruno Gustavo</h2>
          <p className="text-[14px] text-px-muted">Clínico geral, pós-graduado em Endocrinologia e Nutrologia</p>
          <p className="text-[14.5px] leading-relaxed text-px-ink">
            O atendimento reúne endocrinologia, nutrologia e medicina preventiva para investigar o que está por trás de sintomas como ganho de peso, cansaço, baixa libido e queda de desempenho físico, e montar um plano de acordo com a rotina e os objetivos de cada paciente.
          </p>
        </Panel>

        <section aria-labelledby="como" className="space-y-3">
          <h2 id="como" className="px-1 text-[22px] font-semibold text-px-ink">Como funciona</h2>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {STEPS.map(s => (
              <li key={s.n}>
                <Panel as="article" className="h-full space-y-1 !p-4">
                  <p className="text-[13px] tabular-nums text-px-muted">Passo {s.n}</p>
                  <h3 className="text-[15px] font-semibold text-px-ink">{s.t}</h3>
                  <p className="text-[13.5px] leading-snug text-px-muted">{s.d}</p>
                </Panel>
              </li>
            ))}
          </ol>
        </section>

        <section id="programas" aria-labelledby="progs" className="space-y-3">
          <h2 id="progs" className="px-1 text-[22px] font-semibold text-px-ink">Programas</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {PROGRAMS.map(p => (
              <Panel as="article" key={p.name} className="space-y-1.5">
                <h3 className="text-[16px] font-semibold text-px-ink">{p.name}</h3>
                <p className="text-[14px] leading-relaxed text-px-muted">{p.desc}</p>
              </Panel>
            ))}
          </div>
          <p className="px-1 text-[13px] text-px-muted">Os valores são passados diretamente pela equipe.</p>
        </section>

        <section id="formulario" aria-labelledby="form-t">
          <Panel as="div" className="mx-auto max-w-[560px] space-y-5 !p-7">
            {step === "done" ? (
              <div className="space-y-4 text-center">
                <h2 id="form-t" className="text-[22px] font-semibold text-px-ink">Recebemos seu contato</h2>
                <p role="status" className="text-[14px] leading-relaxed text-px-muted">
                  A equipe vai chamar você pelo WhatsApp para agendar. Se preferir, você pode falar direto agora.
                </p>
                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                  {(regiao === "mg" || regiao === "ambos") && <PxButton href={WHATSAPP_MG} variant={regiao === "ambos" ? "secondary" : "primary"}>WhatsApp MG</PxButton>}
                  {(regiao === "sc" || regiao === "ambos") && <PxButton href={WHATSAPP_SC} variant={regiao === "ambos" ? "secondary" : "primary"}>WhatsApp SC</PxButton>}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1 text-center">
                  <h2 id="form-t" className="text-[22px] font-semibold text-px-ink">Agende sua consulta</h2>
                  <p className="text-[14px] text-px-muted">Preencha o formulário e a equipe entra em contato pelo WhatsApp.</p>
                </div>
                <form onSubmit={submit} className="space-y-4" noValidate>
                  <Field label="Nome completo" htmlFor="cp-nome">
                    <PxInput id="cp-nome" autoComplete="name" value={form.nome} onChange={set("nome")} placeholder="Seu nome" />
                  </Field>
                  <Field label="WhatsApp" htmlFor="cp-tel">
                    <PxInput id="cp-tel" type="tel" inputMode="tel" autoComplete="tel" value={form.whatsapp} onChange={set("whatsapp")} placeholder="(11) 99999-9999" />
                  </Field>
                  <Field label="E-mail (opcional)" htmlFor="cp-email">
                    <PxInput id="cp-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="seu@email.com" />
                  </Field>
                  <Field label="Onde prefere ser atendido" htmlFor="cp-local">
                    <PxSelect id="cp-local" value={form.local} onChange={set("local")}>
                      <option value="">Selecione</option>
                      {LOCAIS.map(l => <option key={l.v} value={l.v}>{l.v}</option>)}
                    </PxSelect>
                  </Field>
                  <Field label="Interesse principal" htmlFor="cp-int">
                    <PxSelect id="cp-int" value={form.interesse} onChange={set("interesse")}>
                      <option value="">Selecione</option>
                      {INTERESSES.map(i => <option key={i} value={i}>{i}</option>)}
                    </PxSelect>
                  </Field>
                  <Field label="Como nos encontrou" htmlFor="cp-como">
                    <PxSelect id="cp-como" value={form.como_encontrou} onChange={set("como_encontrou")}>
                      <option value="">Selecione</option>
                      {COMO_ENCONTROU.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </PxSelect>
                  </Field>
                  <div className="space-y-1.5">
                    <label htmlFor="cp-msg" className="block text-[13px] font-medium text-px-ink">Mensagem (opcional)</label>
                    <textarea id="cp-msg" value={form.mensagem} onChange={set("mensagem")} maxLength={600} rows={3} placeholder="Conte um pouco sobre o que você está buscando."
                      className="w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40" />
                  </div>
                  {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
                  <PxButton type="submit" fullWidth loading={step === "sending"}>{step === "sending" ? "Enviando" : "Enviar"}</PxButton>
                  <p className="text-center text-[12.5px] leading-relaxed text-px-muted">
                    Usamos seus dados apenas para retornar o contato e agendar a consulta. Detalhes na <Link href="/privacidade" className="underline underline-offset-2">Política de Privacidade</Link>.
                  </p>
                </form>
              </>
            )}
          </Panel>
        </section>

        <section aria-labelledby="faq-t" className="mx-auto w-full max-w-[640px] space-y-3">
          <h2 id="faq-t" className="px-1 text-[22px] font-semibold text-px-ink">Perguntas frequentes</h2>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <Panel as="div" key={f.q} className="!p-0">
                <button type="button" aria-expanded={faqOpen === i} aria-controls={`faq-${i}`} onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 rounded-px-card px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">
                  <span className="text-[14.5px] font-medium text-px-ink">{f.q}</span>
                  <span aria-hidden="true" className="text-[18px] leading-none text-px-muted">{faqOpen === i ? "−" : "+"}</span>
                </button>
                <div id={`faq-${i}`} hidden={faqOpen !== i} className={cn("px-5 pb-4 text-[14px] leading-relaxed text-px-muted")}>{f.a}</div>
              </Panel>
            ))}
          </div>
        </section>

        <footer className="space-y-3 border-t border-px-line pt-6 text-center text-[13px] text-px-muted">
          <p>Dr. Bruno Gustavo, CRM/SP 174632</p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a className="underline underline-offset-2" href={WHATSAPP_MG} target="_blank" rel="noopener noreferrer">WhatsApp MG: Poços de Caldas, Alfenas, São Paulo e online</a>
            <a className="underline underline-offset-2" href={WHATSAPP_SC} target="_blank" rel="noopener noreferrer">WhatsApp SC: Balneário Camboriú e online, em horário comercial</a>
            <a className="underline underline-offset-2" href="https://instagram.com/drbrunogustavo" target="_blank" rel="noopener noreferrer">Instagram</a>
          </p>
          <p><Link href="/privacidade" className="underline underline-offset-2">Política de Privacidade</Link> · <Link href="/termos" className="underline underline-offset-2">Termos de Uso</Link></p>
        </footer>
      </div>
    </div>
  )
}
