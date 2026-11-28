"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { track } from "@vercel/analytics"
import { useAuth } from "@/hooks/useAuth"
import { Panel, PxButton } from "@/components/px"

interface Depoimento {
  id: string
  nome: string
  especialidade: string
  cidade?: string
  estado?: string
  depoimento: string
}

const AREAS = [
  {
    titulo: "Na consulta",
    nome: "Copiloto de Consulta",
    texto: "Transforma o relato da consulta em documentação e orientações para o paciente. Você revisa tudo antes de usar.",
  },
  {
    titulo: "Depois da consulta",
    nome: "Pacientes, exames e agenda",
    texto: "Ficha com exames e evolução, interpretação de resultados laboratoriais e a agenda da clínica.",
  },
  {
    titulo: "Para atrair pacientes",
    nome: "CRM de leads e conteúdo",
    texto: "Funil de contatos com mensagens de acompanhamento por WhatsApp e ferramentas para planejar conteúdo médico.",
  },
  {
    titulo: "Para decidir",
    nome: "Painel da clínica",
    texto: "Financeiro, indicadores, NPS e metas no mesmo lugar, com os números da sua própria operação.",
  },
]

const FAQ = [
  { q: "Como funciona o período de teste?", a: "São 7 dias grátis em qualquer plano. Você pode cancelar antes do fim do teste." },
  { q: "Meus dados clínicos ficam seguros?", a: "Os dados ficam isolados por usuário no banco de dados, com regras de acesso por linha (Row Level Security do Supabase). Nenhum dado clínico é usado para treinar modelos de IA." },
  { q: "Posso cancelar quando quiser?", a: "Sim, nas configurações da conta. O acesso continua ativo até o fim do período já pago." },
  { q: "Como trago os pacientes do meu sistema atual?", a: "Exporte uma planilha em CSV ou Excel do sistema anterior e importe no PRAXIS pela ferramenta de importação. As colunas são mapeadas na própria tela." },
]

const RODAPE = [
  { l: "Tour", h: "/tour" },
  { l: "Sobre", h: "/sobre" },
  { l: "Planos", h: "/planos" },
  { l: "Privacidade", h: "/privacidade" },
  { l: "Termos", h: "/termos" },
  { l: "Contato", h: "/captacao" },
]

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const logado = !authLoading && !!user
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([])

  useEffect(() => {
    const ctrl = new AbortController()
    fetch("/api/depoimentos/publicos", { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : []))
      .then((d: unknown) => { if (Array.isArray(d)) setDepoimentos(d.slice(0, 3) as Depoimento[]) })
      .catch(() => { /* seção de depoimentos simplesmente não aparece */ })
    return () => ctrl.abort()
  }, [])

  return (
    <div className="px relative min-h-screen">
      <div className="px-stage" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="rounded text-[15px] font-semibold tracking-[0.3em] text-px-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">PRAXIS</Link>
        <nav aria-label="Principal" className="flex items-center gap-3 md:gap-5">
          <Link href="/tour" className="hidden rounded text-[13.5px] text-px-ink underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 md:block">Tour</Link>
          <Link href="/planos" className="hidden rounded text-[13.5px] text-px-ink underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40 md:block">Planos</Link>
          <PxButton size="sm" variant="secondary" href={logado ? "/dashboard" : "/login"}>{logado ? "Abrir o app" : "Entrar"}</PxButton>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl space-y-16 px-6 pb-16 pt-10 md:pt-16">
        <section aria-labelledby="titulo" className="mx-auto max-w-2xl text-center">
          <h1 id="titulo" className="text-[34px] font-semibold leading-[1.15] text-px-ink md:text-[46px]">
            Consulta, pacientes e captação num só sistema
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-px-muted">
            O PRAXIS reúne copiloto de consulta, ficha do paciente, agenda, CRM e painel da clínica. Foi construído por um médico para a rotina do consultório particular.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PxButton href="/cadastro" onClick={() => track("cta_click", { button: "hero_teste" })}>Começar 7 dias grátis</PxButton>
            <PxButton href="/tour" variant="secondary" onClick={() => track("cta_click", { button: "hero_tour" })}>Ver o tour</PxButton>
          </div>
        </section>

        <section aria-labelledby="areas">
          <h2 id="areas" className="mb-5 text-center text-[22px] font-semibold text-px-ink">O que você resolve em cada etapa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {AREAS.map(a => (
              <Panel key={a.nome} as="article">
                <p className="text-[13px] font-medium text-px-accent">{a.titulo}</p>
                <h3 className="mt-1 text-[17px] font-semibold text-px-ink">{a.nome}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-px-muted">{a.texto}</p>
              </Panel>
            ))}
          </div>
        </section>

        {depoimentos.length > 0 && (
          <section aria-labelledby="depoimentos">
            <h2 id="depoimentos" className="mb-5 text-center text-[22px] font-semibold text-px-ink">Quem usa</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {depoimentos.map(d => (
                <Panel key={d.id} as="article" className="flex flex-col justify-between gap-4">
                  <blockquote className="text-[14px] leading-relaxed text-px-ink">{d.depoimento}</blockquote>
                  <p className="text-[13px] text-px-muted">
                    {d.nome}, {d.especialidade}{d.cidade ? `, ${d.cidade}${d.estado ? `/${d.estado}` : ""}` : ""}
                  </p>
                </Panel>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="planos">
          <Panel tone="dark" className="mx-auto max-w-2xl text-center">
            <h2 id="planos" className="text-[22px] font-semibold text-white">Planos a partir de R$ 97 por mês</h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-white/80">
              Todos os planos têm 7 dias grátis. Compare os limites de cada um na página de planos.
            </p>
            <div className="mt-6 flex justify-center">
              <PxButton href="/planos" variant="inverse" onClick={() => track("cta_click", { button: "planos" })}>Ver os planos</PxButton>
            </div>
          </Panel>
        </section>

        <section aria-labelledby="faq" className="mx-auto max-w-2xl">
          <h2 id="faq" className="mb-4 text-center text-[22px] font-semibold text-px-ink">Perguntas frequentes</h2>
          <div className="space-y-2">
            {FAQ.map(item => (
              <details key={item.q} className="px-glass group rounded-px-card px-5 py-4">
                <summary className="cursor-pointer list-none rounded text-[15px] font-semibold text-px-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">{item.q}</summary>
                <p className="mt-2 text-[14px] leading-relaxed text-px-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto max-w-5xl px-6 pb-10 pt-4">
        <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {RODAPE.map(({ l, h }) => (
            <Link key={h} href={h} className="rounded text-[13px] text-px-ink underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40">{l}</Link>
          ))}
        </nav>
        <p className="mt-5 text-center text-[12.5px] text-px-muted">© 2026 PRAXIS. Responsável médico: Dr. Bruno Gustavo, CRM/SP 174632.</p>
      </footer>
    </div>
  )
}
