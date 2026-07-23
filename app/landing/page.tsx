"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Check, ChevronDown, ChevronUp, ArrowRight,
  Radio, Bot, Video, Layers, Zap, FileText,
  ScanFace, ShieldQuestion, Megaphone, Sparkles,
  Flame, CircleDollarSign, BarChart, Users, MessageSquare,
  Star, Crown, X, Stethoscope, Monitor, Smartphone,
  Shield, Lock, Mic,
  Clock, Bell, BarChart3, TrendingUp, Brain,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Palette (landing v2 — cream + navy + gold) ─────────────────────────────────
const CREAM     = "#F5F0E8"
const CREAM2    = "#EDE6DA"
const NAVY      = "#0D1B2A"
const NAVY2     = "#152B42"
const GOLD      = "#B8976A"
const GOLD_DARK = "#96784F"

// ─── Data ─────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "O uso de IA em consulta é permitido pelo CFM?", a: "Sim. O Copiloto é uma ferramenta de apoio à documentação — o médico revisa e valida tudo antes de assinar. A responsabilidade clínica e o prontuário seguem sendo do profissional." },
  { q: "O paciente precisa consentir com a gravação?", a: "Sim. O PRAXIS orienta o registro do consentimento do paciente antes de iniciar a captação de áudio, em conformidade com a LGPD e as boas práticas do CFM." },
  { q: "Meus dados e prontuários estão seguros?", a: "Sim. Os prontuários são criptografados, o acesso é isolado por médico e a plataforma segue a LGPD. Você mantém o controle e a portabilidade dos seus dados." },
  { q: "Funciona com o sistema que já uso na clínica?", a: "O PRAXIS tem integração nativa com o MedX (agenda, pacientes e status). Os demais módulos operam de forma independente, sem exigir a troca do seu sistema atual." },
  { q: "Preciso saber usar IA ou tecnologia?", a: "Não. A plataforma foi feita para o dia a dia do médico: você fala, ela documenta. A configuração inicial leva cerca de 5 minutos." },
  { q: "Posso cancelar quando quiser?", a: "Sim, sem fidelidade e sem multa. O cancelamento é feito pelo próprio painel e o acesso permanece até o fim do período já pago." },
  { q: "O conteúdo gerado é genérico?", a: "Não. O conteúdo e as condutas usam a sua especialidade, a sua memória clínica e a sua identidade visual — o resultado sai com a sua cara, não um template." },
  { q: "Serve para quem tem mais de uma clínica?", a: "Sim. O plano Pro atende até 3 clínicas e o Elite é multi-clínica ilimitado, com indicadores consolidados por unidade." },
]

const PLANS = [
  {
    id: "starter", name: "Starter", price: 97, icon: Zap,
    badge: null as string | null, highlight: false,
    blocks: [
      { label: "Consultório", items: ["Agenda inteligente"] },
      { label: "Gestão",      items: ["CRM de pacientes", "Financeiro + DRE"] },
      { label: "Marketing",   items: ["Roteiros, legendas e pautas", "Calendário editorial", "30 gerações/mês"] },
      { label: "Suporte",     items: ["Suporte por e-mail"] },
    ],
    excluded: ["Copiloto de Consulta", "Diretor Criativo", "Radar Científico"],
  },
  {
    id: "pro", name: "Pro", price: 197, icon: Star,
    badge: "Escolha da maioria" as string | null, highlight: true,
    blocks: [
      { label: "Consultório", items: ["Copiloto de Consulta por voz", "Prontuário SOAP", "Memória clínica", "Seguimento D+1 / D+7 / D+30"] },
      { label: "Gestão",      items: ["CRM, Financeiro e NPS", "Indicações e reativação", "Até 3 clínicas"] },
      { label: "Marketing",   items: ["Tudo do Starter", "200 gerações/mês"] },
      { label: "Suporte",     items: ["Suporte por WhatsApp"] },
    ],
    excluded: [] as string[],
  },
  {
    id: "elite", name: "Elite", price: 397, icon: Crown,
    badge: "Elite" as string | null, highlight: false,
    blocks: [
      { label: "Consultório",  items: ["Tudo do plano Pro"] },
      { label: "Gestão",       items: ["Clínicas ilimitadas", "Diagnóstico 360°"] },
      { label: "Marketing",    items: ["Diretor Criativo (imagens IA)", "Agente Executivo", "Gerações ilimitadas"] },
      { label: "Inteligência", items: ["Consultor Estratégico IA", "Academy"] },
      { label: "Suporte",      items: ["WhatsApp prioritário + onboarding 1:1"] },
    ],
    excluded: [] as string[],
  },
]

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: "1px solid rgba(13,27,42,0.10)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="text-[14px] font-medium" style={{ color: NAVY }}>{q}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_DARK }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: GOLD_DARK }} />}
      </button>
      {open && (
        <p className="pb-5 text-[13px] leading-relaxed" style={{ color: NAVY2 }}>
          {a}
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router                              = useRouter()
  const heroRef                             = useRef<HTMLElement>(null)

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif", background: CREAM, color: NAVY }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12"
        style={{ height: 68, background: "rgba(245,240,232,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(13,27,42,0.10)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 38, height: 38, border: `1.5px solid ${GOLD}` }}>
            <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: GOLD, fontSize: 18, fontWeight: 700 }}>P</span>
          </div>
          <div className="leading-none">
            <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 19, fontWeight: 700, letterSpacing: "0.18em", color: NAVY }}>PRAXIS</div>
            <div className="mt-0.5" style={{ fontSize: 8.5, letterSpacing: "0.24em", color: GOLD_DARK, textTransform: "uppercase" }}>Sistema Operacional de Clínicas</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#plataforma" className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Plataforma</a>
          <a href="#copiloto"   className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Copiloto</a>
          <a href="#modulos"    className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Módulos</a>
          <a href="#planos"     className="hidden md:block text-[13px] hover:opacity-70 transition-opacity" style={{ color: NAVY2 }}>Planos</a>
          <Link href="/planos"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.97]"
            style={{ background: NAVY, color: CREAM }}>
            Testar 7 dias grátis
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section id="plataforma" ref={heroRef} className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden min-h-screen flex items-center"
        style={{ background: `radial-gradient(circle at 82% 12%, rgba(184,151,106,0.20), transparent 55%), ${CREAM}` }}>
        <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          {/* Esquerda */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7"
              style={{ background: "rgba(184,151,106,0.12)", border: "1px solid rgba(184,151,106,0.35)" }}>
              <span className="text-[10px] font-mono tracking-widest" style={{ color: GOLD_DARK }}>Consultório · Gestão · Marketing · Inteligência</span>
            </div>

            <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.08] mb-6"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Sua clínica inteira em <em style={{ color: GOLD_DARK, fontStyle: "italic" }}>um só sistema.</em>
            </h1>

            <p className="text-[17px] md:text-[18px] mb-8 leading-relaxed max-w-xl" style={{ color: NAVY2 }}>
              O PRAXIS documenta sua consulta por voz, organiza seus pacientes, controla seu financeiro e cria seu conteúdo médico. <strong style={{ color: NAVY }}>Tudo com IA. Tudo integrado. Tudo em um lugar.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button onClick={() => router.push('/planos')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-[15px] font-bold transition-all active:scale-[0.98]"
                style={{ background: NAVY, color: CREAM }}>
                Testar 7 dias grátis <ArrowRight className="w-4 h-4" />
              </button>
              <a href="#copiloto"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-[15px] font-medium transition-all"
                style={{ border: `1px solid ${NAVY}`, color: NAVY }}>
                Ver o Copiloto em ação
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {["Sem cartão de crédito", "Configuração em 5 minutos", "Cancele quando quiser"].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#2E9E6B" }} />
                  <span className="text-[12px]" style={{ color: NAVY2 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direita — mockup Copiloto (janela dark) */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: NAVY, border: `1px solid ${NAVY2}` }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: NAVY2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                <span className="ml-2 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>Copiloto de Consulta</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[13px] font-semibold text-white">Ana Carolina M., 34 anos</div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>Retorno · Endocrinologia</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "rgba(46,158,107,0.15)", border: "1px solid rgba(46,158,107,0.4)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: "#2E9E6B" }} />
                    <span className="text-[9px] font-mono tracking-wider" style={{ color: "#7fe0b0" }}>AO VIVO</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg mb-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,151,106,0.15)", border: `1px solid ${GOLD}` }}>
                    <Mic className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-white">Gravando consulta…</div>
                    <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>08:42</div>
                  </div>
                </div>
                <div className="space-y-1.5 mb-4">
                  {["“…a fadiga melhorou bastante depois que ajustamos a dose.”", "“Continuo com dificuldade para perder peso, principalmente à tarde.”"].map((l, i) => (
                    <div key={i} className="text-[10.5px] leading-snug px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.6)" }}>{l}</div>
                  ))}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: GOLD }}>Gerado automaticamente</div>
                <div className="space-y-2">
                  {[{ icon: FileText, t: "Prontuário SOAP completo" }, { icon: Stethoscope, t: "Prescrição + exames" }, { icon: MessageSquare, t: "Seguimento D+1 · D+7 · D+30" }].map((r, i) => {
                    const Icon = r.icon
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                        <span className="text-[11.5px] text-white">{r.t}</span>
                        <Check className="w-3.5 h-3.5 ml-auto" style={{ color: "#2E9E6B" }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────────────────── */}
      <section className="py-6 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Shield, t: "Dados em conformidade com a LGPD" },
            { icon: Users,  t: "Criado por médico, para médicos" },
            { icon: Lock,   t: "Prontuários criptografados" },
            { icon: Zap,    t: "Integração nativa com MedX" },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-center gap-2.5 justify-center md:justify-start">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                <span className="text-[12px]" style={{ color: "rgba(245,240,232,0.85)" }}>{item.t}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── PROBLEMA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD_DARK }}>O problema real</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-4 leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Sua clínica roda em <em style={{ color: GOLD_DARK, fontStyle: "italic" }}>oito ferramentas</em> que não se falam.
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: NAVY2 }}>
              Prontuário num sistema. Agenda em outro. Financeiro na planilha. Leads no WhatsApp. Conteúdo no bloco de notas. E você no meio, perdendo tempo que deveria ser do paciente.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Clock,     title: "40 minutos por dia digitando",      desc: "Prontuário, receita, orientações, relatório. Trabalho manual que a IA já faz em segundos." },
              { icon: Bell,      title: "Pacientes que somem sem retorno",   desc: "Sem seguimento estruturado, o paciente esquece. Sem NPS, você não sabe por quê." },
              { icon: BarChart3, title: "Decisões no escuro",                desc: "Quanto faturou? Qual origem traz mais paciente? Sem dado consolidado, é tudo intuição." },
            ].map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i} className="rounded-xl p-6" style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.08)" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)" }}>
                    <Icon className="w-4 h-4" style={{ color: "#c0392b" }} />
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2" style={{ color: NAVY }}>{p.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: NAVY2 }}>{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4 AMBIENTES ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: CREAM2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-[28px] md:text-[38px] font-semibold leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Quatro ambientes.<br /><em style={{ color: GOLD_DARK, fontStyle: "italic" }}>Uma única plataforma.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { num: "01", icon: Stethoscope, title: "Consultório", desc: "O Copiloto ouve a consulta, documenta o prontuário, sugere condutas e organiza o seguimento — enquanto você olha para o paciente, não para a tela.", features: ["Copiloto de voz", "Prontuário SOAP", "Prescrição digital", "Memória clínica", "Agenda inteligente", "Cartas e atestados"] },
              { num: "02", icon: TrendingUp, title: "Gestão", desc: "CRM de pacientes, controle financeiro com projeção, NPS automático e indicadores da clínica.", features: ["CRM Kanban", "Financeiro + DRE", "Pesquisa NPS", "Indicações", "Reativação", "Multi-clínica"] },
              { num: "03", icon: Smartphone, title: "Marketing", desc: "Calendário editorial completo, roteiros de reels, carrosséis e legendas gerados por IA — com a sua especialidade.", features: ["Calendário editorial", "Roteiros de reels", "Diretor criativo", "Banco de pautas", "Legendas e ganchos", "Analytics Instagram"] },
              { num: "04", icon: Brain, title: "Inteligência", desc: "Consultor estratégico com IA, diagnóstico completo da clínica, radar de tendências científicas e Academy.", features: ["Consultor IA", "Diagnóstico 360°", "Painel executivo", "Radar científico", "Banco de estudos", "Academy"] },
            ].map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.08)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(184,151,106,0.10)", border: "1px solid rgba(184,151,106,0.30)" }}>
                      <Icon className="w-5 h-5" style={{ color: GOLD_DARK }} />
                    </div>
                    <span className="text-[32px] font-bold leading-none" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "rgba(184,151,106,0.30)" }}>{a.num}</span>
                  </div>
                  <h3 className="text-[19px] font-semibold mb-2" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>{a.title}</h3>
                  <p className="text-[13px] leading-relaxed mb-4" style={{ color: NAVY2 }}>{a.desc}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {a.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
                        <span className="text-[12px]" style={{ color: NAVY2 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── MÓDULOS POR CATEGORIA ───────────────────────────────────────────── */}
      <section id="modulos" className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-[28px] md:text-[38px] font-semibold leading-tight mb-4" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Tudo o que sua clínica precisa,<br /><em style={{ color: GOLD_DARK, fontStyle: "italic" }}>organizado por área.</em>
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: NAVY2 }}>Não é um gerador de posts. É a operação completa da sua clínica.</p>
          </div>
          <div className="space-y-12">
            {[
              { icon: Stethoscope, name: "Consultório", desc: "O que acontece durante e depois da consulta", mods: [
                { n: "Copiloto de Consulta", badge: "PRINCIPAL", d: "Documentação por voz em tempo real" },
                { n: "Agenda Inteligente", d: "Encaixes, lembretes e confirmações" },
                { n: "Prescrição Digital", d: "Receitas e atestados assinados" },
                { n: "Memória Clínica", d: "Protocolos e condutas do médico" },
                { n: "Raio-X de Pacientes", d: "Perfil e histórico consolidado" },
                { n: "Reativação", d: "Traz de volta quem sumiu" },
              ] },
              { icon: TrendingUp, name: "Gestão", desc: "A saúde financeira e comercial da clínica", mods: [
                { n: "CRM de Pacientes", d: "Funil Kanban de leads" },
                { n: "Financeiro", d: "Fluxo de caixa e DRE" },
                { n: "Pesquisa NPS", d: "Satisfação automática pós-consulta" },
                { n: "Programa de Indicações", d: "Member get member com cortesia" },
                { n: "Painel Executivo", d: "Indicadores da clínica" },
                { n: "Precificação", d: "Precifique procedimentos com margem" },
              ] },
              { icon: Smartphone, name: "Marketing", desc: "Autoridade digital sem tirar tempo do consultório", mods: [
                { n: "Calendário Editorial", d: "Planejamento mensal com IA" },
                { n: "Gerador de Roteiros", d: "Reels prontos para gravar" },
                { n: "Diretor Criativo", d: "Artes e imagens premium" },
                { n: "Banco de Pautas", d: "Repositório de ideias" },
                { n: "Ganchos e Legendas", d: "Aberturas que prendem" },
                { n: "Analytics Instagram", d: "O que performou e por quê" },
              ] },
              { icon: Brain, name: "Inteligência", desc: "Decisões estratégicas com base em dados", mods: [
                { n: "Consultor Estratégico", d: "Recomendações com IA" },
                { n: "Diagnóstico 360°", d: "Análise completa da clínica" },
                { n: "Radar Científico", d: "Tendências e evidências recentes" },
                { n: "Banco de Estudos", d: "Referências organizadas" },
                { n: "Mapa de Objeções", d: "Dúvidas viram conteúdo" },
                { n: "Academy", d: "Trilhas de crescimento" },
              ] },
            ].map((cat, i) => {
              const Icon = cat.icon
              return (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-1">
                    <Icon className="w-5 h-5" style={{ color: GOLD_DARK }} />
                    <h3 className="text-[20px] font-semibold" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>{cat.name}</h3>
                  </div>
                  <p className="text-[13px] mb-4" style={{ color: NAVY2 }}>{cat.desc}</p>
                  <div className="h-px mb-5" style={{ background: "rgba(13,27,42,0.10)" }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {cat.mods.map((m, j) => {
                      const badge = (m as { badge?: string }).badge
                      return (
                        <div key={j} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.08)" }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] font-bold" style={{ color: NAVY }}>{m.n}</span>
                            {badge && (
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: NAVY, color: CREAM, letterSpacing: "0.1em" }}>{badge}</span>
                            )}
                          </div>
                          <p className="text-[12.5px] leading-snug" style={{ color: NAVY2 }}>{m.d}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COPILOTO (deep) ─────────────────────────────────────────────────── */}
      <section id="copiloto" className="py-24 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD }}>O coração da plataforma</p>
            <h2 className="text-[28px] md:text-[38px] font-semibold leading-tight text-white" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              O Copiloto continua trabalhando <em style={{ color: GOLD, fontStyle: "italic" }}>depois que o paciente sai.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {[
              { n: "01", t: "Ouve e documenta", d: "Durante a consulta, transcreve a conversa e estrutura o prontuário SOAP em tempo real." },
              { n: "02", t: "Sugere e prescreve", d: "Propõe condutas, CID e monta prescrição e pedido de exames pela sua memória clínica." },
              { n: "03", t: "Agenda o seguimento", d: "Dispara indicação, NPS e retorno via WhatsApp em D+1, D+7 e D+30 — automaticamente." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(184,151,106,0.20)" }}>
                <div className="text-[32px] font-bold leading-none mb-3" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "rgba(184,151,106,0.45)" }}>{s.n}</div>
                <h3 className="text-[16px] font-semibold text-white mb-2">{s.t}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-5 max-w-2xl mx-auto" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(184,151,106,0.20)" }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" style={{ color: GOLD }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.40)" }}>Ações pós-consulta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[{ t: "Prontuário salvo", s: "há 2 segundos" }, { t: "Indicação D+1 agendada", s: "amanhã, 09:00" },
                { t: "NPS D+1 agendado", s: "amanhã, 09:00" }, { t: "Retorno D+30 agendado", s: "em 30 dias" }].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(184,151,106,0.15)", border: "1px solid rgba(184,151,106,0.30)" }}>
                      <Check className="w-3 h-3" style={{ color: GOLD }} />
                    </div>
                    <span className="text-[12px] text-white">{r.t}</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.40)" }}>{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── RELATÓRIO GERADO ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: CREAM }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD_DARK }}>Veja o resultado real</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-4 leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Isto é o que o Copiloto entrega<br /><em style={{ color: GOLD_DARK, fontStyle: "italic" }}>ao final de uma consulta.</em>
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: NAVY2 }}>Gravação de 12 minutos. Documentação completa em 40 segundos.</p>
            <span className="inline-block mt-4 text-[9px] text-text-muted border border-border rounded px-2 py-[3px]">Exemplo ilustrativo · dados fictícios</span>
          </div>
          <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
            {/* Esquerda sticky */}
            <div className="md:sticky md:top-24">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(46,158,107,0.10)", border: "1px solid rgba(46,158,107,0.35)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2E9E6B" }} />
                <span className="text-[10px] font-mono" style={{ color: "#2E9E6B" }}>Gerado em 38 segundos</span>
              </div>
              <h3 className="text-[22px] font-semibold mb-4 leading-snug" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
                Da conversa ao prontuário, <em style={{ color: GOLD_DARK, fontStyle: "italic" }}>sem digitar.</em>
              </h3>
              <div className="space-y-4">
                {[
                  { t: "Estrutura SOAP completa", d: "Subjetivo, objetivo, avaliação e plano organizados automaticamente." },
                  { t: "CID e exames sugeridos", d: "Codificação e pedido de exames prontos para revisar e assinar." },
                  { t: "Seguimento já agendado", d: "As três mensagens de acompanhamento saem sem você lembrar." },
                ].map((it, i) => (
                  <div key={i} className="flex gap-3">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: NAVY }}>{it.t}</div>
                      <div className="text-[12px] leading-relaxed" style={{ color: NAVY2 }}>{it.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Direita — documento */}
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: "#fff", border: "1px solid rgba(13,27,42,0.10)" }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ background: NAVY }}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full" style={{ width: 22, height: 22, border: `1px solid ${GOLD}` }}>
                    <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: GOLD, fontSize: 11, fontWeight: 700 }}>P</span>
                  </div>
                  <span className="text-[11px] font-mono tracking-widest" style={{ color: CREAM }}>PRONTUÁRIO DE CONSULTA</span>
                </div>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(184,151,106,0.20)", color: GOLD, letterSpacing: "0.1em" }}>IA</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-2 pb-4 mb-4" style={{ borderBottom: "1px solid rgba(13,27,42,0.08)" }}>
                  {[["Paciente", "Ana Carolina M."], ["Idade", "34 anos"], ["Tipo", "Retorno · 90 dias"], ["Data", "22/07/2026"]].map(([k, v], i) => (
                    <div key={i}>
                      <div className="text-[8.5px] font-mono uppercase tracking-wider mb-0.5" style={{ color: GOLD_DARK }}>{k}</div>
                      <div className="text-[11px] font-medium" style={{ color: NAVY }}>{v}</div>
                    </div>
                  ))}
                </div>
                {[
                  { l: "S", t: "Subjetivo", c: "Refere melhora importante da fadiga após ajuste da levotiroxina. Mantém cansaço vespertino leve e dificuldade de perda de peso, sobretudo no período da tarde. Nega palpitações, intolerância ao calor ou alterações de humor." },
                  { l: "O", t: "Objetivo", c: "Peso 78,4 kg (anterior 81,2) · IMC 28,1 · PA 118/76 · TSH 2,8 (prévio 8,4) · HOMA-IR 4,3 · Vit. D 24 · Ferritina 32." },
                  { l: "A", t: "Avaliação", c: "Tireoidite de Hashimoto compensada, resistência insulínica e hipovitaminose D." },
                  { l: "P", t: "Plano", c: "" },
                  { l: "E", t: "Exames", c: "" },
                ].map((sec, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: NAVY, color: CREAM }}>{sec.l}</span>
                      <span className="text-[12px] font-semibold" style={{ color: NAVY }}>{sec.t}</span>
                    </div>
                    {sec.c && <p className="text-[11.5px] leading-relaxed pl-7" style={{ color: NAVY2 }}>{sec.c}</p>}
                    {sec.l === "A" && (
                      <div className="flex gap-1.5 pl-7 mt-2">
                        {["E06.3", "E88.81", "E55.9"].map(cid => (
                          <span key={cid} className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(184,151,106,0.12)", color: GOLD_DARK, border: "1px solid rgba(184,151,106,0.3)" }}>{cid}</span>
                        ))}
                      </div>
                    )}
                    {sec.l === "P" && (
                      <div className="pl-7 space-y-1.5">
                        {["Manter levotiroxina 75 mcg em jejum", "Iniciar metformina XR 500 mg à noite", "Colecalciferol 50.000 UI/semana por 8 semanas", "Sulfato ferroso 40 mg/dia", "Orientação nutricional e atividade física", "Retorno em 90 dias com exames"].map((p, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <Check className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#2E9E6B" }} />
                            <span className="text-[11px]" style={{ color: NAVY2 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {sec.l === "E" && (
                      <p className="text-[11px] leading-relaxed pl-7" style={{ color: NAVY2 }}>
                        TSH, T4 livre, anti-TPO, glicemia de jejum, insulina, HbA1c, perfil lipídico, 25-OH-vitamina D, ferritina, hemograma e TGO/TGP.
                      </p>
                    )}
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 pt-4 mt-2" style={{ borderTop: "1px solid rgba(13,27,42,0.08)" }}>
                  {[["D+1", "Indicação"], ["D+7", "Acompanhamento"], ["D+30", "Retorno"]].map(([d, t], i) => (
                    <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: CREAM }}>
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <MessageSquare className="w-3 h-3" style={{ color: GOLD_DARK }} />
                        <span className="text-[10px] font-mono font-bold" style={{ color: NAVY }}>{d}</span>
                      </div>
                      <div className="text-[9.5px]" style={{ color: NAVY2 }}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAINEL FINANCEIRO ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD }}>Gestão em números</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold leading-tight text-white" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              A saúde financeira da sua clínica,<br /><em style={{ color: GOLD, fontStyle: "italic" }}>atualizada em tempo real.</em>
            </h2>
          </div>
          <div className="flex justify-end mb-3">
            <span className="inline-block text-[9px] rounded px-2 py-[3px]" style={{ color: "rgba(245,240,232,0.60)", border: "1px solid rgba(245,240,232,0.25)" }}>Exemplo ilustrativo · dados fictícios</span>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { l: "Receitas", v: "R$ 92.480", d: "↑ 18,4%", up: true },
              { l: "Despesas", v: "R$ 31.240", d: "↑ 4,1%", up: false },
              { l: "Saldo", v: "R$ 61.240", d: "↑ 27,2%", up: true },
              { l: "Projeção", v: "R$ 104,7k", d: "próx. mês", up: true },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.45)" }}>{k.l}</div>
                <div className="text-[20px] font-bold text-white leading-none">{k.v}</div>
                <div className="text-[10px] font-mono mt-1.5" style={{ color: k.up ? "#7fe0b0" : "rgba(255,255,255,0.5)" }}>{k.d}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {/* Barras receita */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[11px] font-semibold text-white mb-4">Receita · últimos 6 meses</div>
              <svg viewBox="0 0 300 120" className="w-full" style={{ height: 120 }}>
                {[["Fev", 58], ["Mar", 64], ["Abr", 71], ["Mai", 79], ["Jun", 85], ["Jul", 92]].map((m, i) => {
                  const h = ((m[1] as number) / 92) * 90
                  const x = 12 + i * 48
                  return (
                    <g key={i}>
                      <rect x={x} y={100 - h} width={30} height={h} rx={3} fill={GOLD} opacity={0.4 + i * 0.1} />
                      <text x={x + 15} y={114} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.5)" fontFamily="monospace">{m[0]}</text>
                    </g>
                  )
                })}
              </svg>
            </div>
            {/* NPS linha */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] font-semibold text-white">NPS · evolução</div>
                <div className="text-[16px] font-bold" style={{ color: "#7fe0b0" }}>9,2</div>
              </div>
              <svg viewBox="0 0 300 120" className="w-full" style={{ height: 120 }}>
                <polyline fill="none" stroke="#2E9E6B" strokeWidth={2}
                  points="12,88 66,80 120,68 174,52 228,40 288,26" />
                {[[12, 88], [66, 80], [120, 68], [174, 52], [228, 40], [288, 26]].map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="#7fe0b0" />
                ))}
              </svg>
            </div>
            {/* Funil */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[11px] font-semibold text-white mb-4">Funil de pacientes</div>
              <div className="space-y-2">
                {[["Novo", 68], ["Contato", 50], ["Agendado", 35], ["Consultou", 23], ["Perdido", 13]].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] w-16 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>{f[0]}</span>
                    <div className="flex-1 h-4 rounded" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-4 rounded" style={{ width: `${((f[1] as number) / 68) * 100}%`, background: i === 4 ? "rgba(192,57,43,0.5)" : GOLD, opacity: i === 4 ? 1 : 0.8 }} />
                    </div>
                    <span className="text-[10px] font-mono w-6 text-right" style={{ color: "rgba(255,255,255,0.7)" }}>{f[1]}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Origem */}
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[11px] font-semibold text-white mb-4">Origem dos pacientes</div>
              <div className="space-y-2.5">
                {[["Instagram", 31], ["Indicação", 22], ["Google", 10], ["Outros", 5]].map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] w-20 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>{o[0]}</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-2 rounded-full" style={{ width: `${((o[1] as number) / 31) * 100}%`, background: GOLD }} />
                    </div>
                    <span className="text-[10px] font-mono w-6 text-right" style={{ color: "rgba(255,255,255,0.7)" }}>{o[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6 md:px-12" style={{ background: CREAM2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-[28px] md:text-[38px] font-semibold mb-4 leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>
              Um plano para cada <em style={{ color: GOLD_DARK, fontStyle: "italic" }}>momento da clínica.</em>
            </h2>
            <p className="text-[15px]" style={{ color: NAVY2 }}>7 dias grátis. Cancele quando quiser, sem fidelidade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {PLANS.map(plan => {
              const Icon = plan.icon
              return (
                <div key={plan.id} className="relative rounded-2xl p-6 flex flex-col"
                  style={{ background: "#fff", border: plan.highlight ? `2px solid ${GOLD}` : "1px solid rgba(13,27,42,0.10)", boxShadow: plan.highlight ? "0 12px 40px rgba(184,151,106,0.18)" : "none" }}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[9px] font-mono font-bold px-3 py-1 rounded-full tracking-widest whitespace-nowrap"
                        style={{ background: plan.highlight ? GOLD : NAVY, color: plan.highlight ? NAVY : CREAM }}>
                        {plan.badge.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <Icon className="w-5 h-5" style={{ color: GOLD_DARK }} />
                    <span className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-[11px] font-mono" style={{ color: NAVY2 }}>R$</span>
                    <span className="text-[36px] font-bold leading-none" style={{ color: NAVY }}>{plan.price}</span>
                    <span className="text-[12px]" style={{ color: NAVY2 }}>/mês</span>
                  </div>
                  <div className="flex-1 space-y-3 mb-6">
                    {plan.blocks.map((b, i) => (
                      <div key={i}>
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: GOLD_DARK }}>{b.label}</div>
                        <div className="space-y-1">
                          {b.items.map((it, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                              <span className="text-[12px]" style={{ color: NAVY2 }}>{it}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {plan.excluded.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {plan.excluded.map((f, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "rgba(13,27,42,0.25)" }} />
                            <span className="text-[12px]" style={{ color: "rgba(13,27,42,0.40)" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => router.push('/planos')}
                    className="w-full py-3 rounded-lg text-[13px] font-semibold transition-all active:scale-[0.98] min-h-[48px]"
                    style={{ background: plan.highlight ? NAVY : "transparent", color: plan.highlight ? CREAM : NAVY, border: plan.highlight ? "none" : `1px solid ${NAVY}` }}>
                    Assinar {plan.name}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: CREAM }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD_DARK }}>Dúvidas frequentes</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: NAVY }}>Perguntas de quem é médico.</h2>
          </div>
          <div>
            {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[30px] md:text-[42px] font-semibold mb-8 leading-tight text-white"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Sua próxima consulta pode ser <em style={{ color: GOLD, fontStyle: "italic" }}>documentada sozinha.</em>
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/planos')}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg text-[15px] font-bold transition-all active:scale-[0.98]"
              style={{ background: GOLD, color: NAVY }}>
              Começar agora <ArrowRight className="w-4 h-4" />
            </button>
            <a href="https://wa.me/5535997688008" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-lg text-[15px] font-medium transition-all"
              style={{ border: "1px solid rgba(245,240,232,0.30)", color: CREAM }}>
              Falar com um especialista
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 38, height: 38, border: `1.5px solid ${GOLD}` }}>
              <span style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: GOLD, fontSize: 18, fontWeight: 700 }}>P</span>
            </div>
            <div className="leading-none">
              <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 19, fontWeight: 700, letterSpacing: "0.18em", color: NAVY }}>PRAXIS</div>
              <div className="mt-0.5" style={{ fontSize: 8.5, letterSpacing: "0.24em", color: GOLD_DARK, textTransform: "uppercase" }}>Sistema Operacional de Clínicas</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#planos" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Planos</a>
            <Link href="/login" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Entrar</Link>
            <Link href="/termos" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Termos</Link>
            <Link href="/privacidade" className="text-[12px] text-text-muted hover:text-text-primary transition-colors">Privacidade</Link>
            <a href="https://wa.me/5535997688008" target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-text-muted hover:text-accent transition-colors">WhatsApp</a>
          </div>
          <p className="text-[11px] text-text-muted text-center md:text-right">
            © {new Date().getFullYear()} PRAXIS · Marketing Médico de Alto Padrão
            <br />
            <span className="text-[10px]">Conteúdo informativo. Consulte sempre um médico especialista.</span>
          </p>
        </div>
      </footer>

    </div>
  )
}
