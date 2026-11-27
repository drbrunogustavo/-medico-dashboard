"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Panel, PxButton, Segmented } from "@/components/px"

interface Modulo {
  id: string; label: string; href: string; screenshot: string | null
  title: string; tagline: string; description: string; features: string[]
}

const MODULOS: Modulo[] = [
  { id: "copiloto", label: "Copiloto de Consulta", href: "/praxis-consultorio", screenshot: "/screenshots/copiloto.png",
    title: "Documente a consulta a partir do seu relato",
    tagline: "Descreva o caso e revise o que a IA organiza",
    description: "Narre o caso clínico em texto livre. O PRAXIS gera resumo SOAP, plano terapêutico, exames, orientações ao paciente e mensagens de acompanhamento. Todo conteúdo precisa ser revisado pelo médico.",
    features: ["Resumo clínico estruturado (SOAP)", "Plano terapêutico com condutas", "Orientações ao paciente em linguagem acessível", "Mensagens de acompanhamento após a consulta"] },
  { id: "crm", label: "CRM de Leads", href: "/praxis-consultorio", screenshot: "/screenshots/crm.png",
    title: "Funil do lead ao paciente",
    tagline: "Acompanhe cada lead e programe mensagens por WhatsApp",
    description: "Quadro visual com o histórico de cada lead e sequências de mensagens de acompanhamento, para você entrar em contato quando o lead estiver pronto.",
    features: ["Quadro com cartões arrastáveis", "Histórico de interações", "Mensagens de WhatsApp programadas", "Conversão por origem"] },
  { id: "executivo", label: "Painel Executivo", href: "/praxis-executivo", screenshot: "/screenshots/executivo.png",
    title: "Os números da clínica em um painel",
    tagline: "Faturamento, conversão e satisfação juntos",
    description: "Receita, despesa, saldo, conversão de leads e NPS na mesma tela, a partir dos dados lançados na plataforma.",
    features: ["Faturamento mensal", "Taxa de conversão de leads", "Ocupação da agenda", "Comparativos entre meses"] },
  { id: "nps", label: "NPS e satisfação", href: "/praxis-executivo", screenshot: "/screenshots/nps.png",
    title: "Satisfação dos pacientes medida após a consulta",
    tagline: "Pesquisa enviada ao paciente e respostas reunidas num lugar",
    description: "Envie a pesquisa NPS e acompanhe o score e os comentários para ver o que precisa melhorar.",
    features: ["Pesquisa com link público", "Score NPS", "Comentários abertos dos pacientes", "Comparativo por período"] },
  { id: "indicadores", label: "Indicadores", href: "/praxis-executivo", screenshot: "/screenshots/indicadores.png",
    title: "Decisões com base nos dados da clínica",
    tagline: "Financeiro, marketing, comercial e clínico reunidos",
    description: "Painel com os indicadores usados na gestão: receita, leads, consultas realizadas, retorno e produtividade.",
    features: ["Indicadores financeiros e comerciais", "Indicadores de marketing e conteúdo", "Métricas clínicas", "Metas mensais"] },
]

const DIA = [
  { hora: "07h", titulo: "Briefing do dia", desc: "O Consultor IA analisa os indicadores e sugere prioridades." },
  { hora: "08h", titulo: "Agenda do dia", desc: "Pacientes, horários e histórico reunidos na agenda." },
  { hora: "09h", titulo: "Consulta com o Copiloto", desc: "Depois da consulta, o prontuário estruturado é gerado para sua revisão." },
  { hora: "12h", titulo: "Acompanhamento de leads", desc: "Mensagens programadas seguem para leads que ainda não agendaram." },
  { hora: "14h", titulo: "Resposta de NPS", desc: "Uma avaliação chega e aparece no painel." },
  { hora: "16h", titulo: "Conteúdo", desc: "O tema de uma consulta vira roteiro de Reel para você editar." },
  { hora: "18h", titulo: "Resumo do dia", desc: "Consultas, leads novos, NPS e faturamento parcial." },
]

const ANTES_DEPOIS = [
  { antes: "Conteúdo criado sem estratégia", depois: "Roteiro e legenda gerados a partir do tema" },
  { antes: "Leads esquecidos no WhatsApp pessoal", depois: "Mensagens de acompanhamento programadas" },
  { antes: "Sem visão do faturamento real", depois: "Painel com os lançamentos da clínica" },
  { antes: "Prontuário manual após cada consulta", depois: "Rascunho SOAP gerado para revisão" },
  { antes: "NPS em planilha", depois: "Pesquisa e score na própria plataforma" },
]

const CICLO = ["Lead", "CRM", "Nurturing", "Consulta", "Copiloto", "Follow-up", "NPS", "Conteúdo"]

export default function TourPage() {
  const [ativo, setAtivo] = useState(MODULOS[0].id)
  const m = MODULOS.find(x => x.id === ativo) ?? MODULOS[0]

  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />
      <header className="px-glass sticky top-0 z-10 flex h-16 items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-[15px] font-semibold tracking-[0.2em] text-px-ink">PRAXIS</Link>
        <nav aria-label="Principal" className="flex items-center gap-4 text-[13px]">
          <Link href="/" className="hidden text-px-muted underline-offset-2 hover:underline md:block">Início</Link>
          <Link href="/planos" className="hidden text-px-muted underline-offset-2 hover:underline md:block">Planos</Link>
          <PxButton size="sm" href="/cadastro">Criar conta</PxButton>
        </nav>
      </header>

      <main className="relative mx-auto max-w-5xl space-y-16 px-6 pb-20 pt-16">
        <section className="mx-auto max-w-2xl space-y-4 text-center">
          <h1 className="text-[clamp(28px,5vw,46px)] font-semibold leading-tight text-px-ink">Veja o PRAXIS funcionando</h1>
          <p className="text-[16px] leading-relaxed text-px-muted">Um tour pelos módulos principais, sem criar conta. Veja como eles se conectam.</p>
          <div><PxButton href="/cadastro">Criar minha conta</PxButton></div>
        </section>

        <section aria-labelledby="mod" className="space-y-6">
          <h2 id="mod" className="text-center text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">Módulos em destaque</h2>
          <div className="flex justify-center overflow-x-auto">
            <Segmented label="Módulo" value={ativo} onChange={setAtivo} options={MODULOS.map(x => ({ value: x.id, label: x.label }))} />
          </div>
          <div className={`grid grid-cols-1 items-start gap-8 ${m.screenshot ? "lg:grid-cols-2" : ""}`}>
            {m.screenshot && (
              <Panel as="div" className="overflow-hidden !p-0">
                <Image src={m.screenshot} alt={m.id === "copiloto" ? "Ilustração do Copiloto de Consulta, com dados de exemplo" : `Tela do módulo ${m.label}`} width={800} height={500} className="block h-auto w-full" unoptimized />
              </Panel>
            )}
            <Panel as="article" className="space-y-4">
              <div>
                <h3 className="text-[clamp(18px,2.6vw,24px)] font-semibold leading-snug text-px-ink">{m.title}</h3>
                <p className="mt-1 text-[13.5px] text-px-muted">{m.tagline}</p>
              </div>
              <p className="text-[14px] leading-relaxed text-px-ink/85">{m.description}</p>
              <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-px-ink/85">{m.features.map(f => <li key={f}>{f}</li>)}</ul>
              <div><PxButton variant="secondary" href={m.href}>Explorar este módulo</PxButton></div>
            </Panel>
          </div>
        </section>

        <section aria-labelledby="dia" className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <h2 id="dia" className="text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">Um dia usando o PRAXIS</h2>
            <p className="mt-2 text-[14px] text-px-muted">Exemplo ilustrativo de como os módulos se encaixam na rotina. Horários e situações são hipotéticos.</p>
          </div>
          <ol className="space-y-2">
            {DIA.map(d => (
              <li key={d.hora}><Panel as="article" className="flex gap-4 !py-3">
                <span className="w-10 shrink-0 font-mono text-[13px] font-semibold text-px-accent">{d.hora}</span>
                <div><p className="text-[14px] font-semibold text-px-ink">{d.titulo}</p><p className="text-[13.5px] text-px-muted">{d.desc}</p></div>
              </Panel></li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="ad" className="space-y-6">
          <h2 id="ad" className="text-center text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">Antes e depois</h2>
          <ul className="space-y-2">
            {ANTES_DEPOIS.map(r => (
              <li key={r.antes} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <Panel as="article" className="!py-3"><p className="text-[12px] font-medium text-px-muted">Antes</p><p className="text-[14px] text-px-ink">{r.antes}</p></Panel>
                <Panel as="article" className="!py-3"><p className="text-[12px] font-medium text-px-accent">Depois</p><p className="text-[14px] font-medium text-px-ink">{r.depois}</p></Panel>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ciclo" className="space-y-6">
          <div className="text-center">
            <h2 id="ciclo" className="text-[clamp(22px,3.5vw,32px)] font-semibold text-px-ink">Do lead ao conteúdo</h2>
            <p className="mt-2 text-[14px] text-px-muted">Cada etapa alimenta a seguinte.</p>
          </div>
          <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {CICLO.map((c, i) => (
              <li key={c}><Panel as="article" className="!py-3 text-center"><span className="block font-mono text-[12px] text-px-muted">{i + 1}</span><span className="text-[14px] font-semibold text-px-ink">{c}</span></Panel></li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-2xl">
          <Panel tone="dark" as="section" className="space-y-4 text-center !p-10">
            <h2 className="text-[clamp(22px,3.5vw,32px)] font-semibold">Pronto para começar?</h2>
            <p className="text-[14.5px] opacity-80">Os planos e as condições do período de teste estão na página de planos.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <PxButton variant="inverse" href="/cadastro">Criar minha conta</PxButton>
              <PxButton variant="quiet" href="/planos" className="!text-white">Ver planos</PxButton>
            </div>
          </Panel>
        </section>
      </main>

      <footer className="relative border-t border-px-line px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-[12.5px] text-px-muted md:flex-row">
          <span className="font-semibold tracking-[0.2em] text-px-ink">PRAXIS</span>
          <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-5">
            <Link href="/">Início</Link><Link href="/planos">Planos</Link><Link href="/sobre">Por que o PRAXIS</Link><Link href="/privacidade">Privacidade</Link>
          </nav>
          <span>© {new Date().getFullYear()} PRAXIS</span>
        </div>
      </footer>
    </div>
  )
}
