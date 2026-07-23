"use client"

import { useState, useRef, useEffect } from "react"
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
import { PraxisLogo } from "@/components/PraxisLogo"
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
  { q: "Preciso ter experiência com redes sociais?", a: "Não. A PRAXIS foi projetada para médicos que são especialistas em sua área, não em marketing. A plataforma guia você em cada etapa." },
  { q: "O conteúdo gerado é ético e dentro das normas do CFM?", a: "Sim. Todos os módulos foram desenvolvidos com as diretrizes éticas do CFM em mente. A IA é treinada para evitar linguagem promocional indevida e sensacionalismo." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem fidelidade, sem multa, sem burocracia. Você cancela quando quiser diretamente pelo painel." },
  { q: "A plataforma funciona para todas as especialidades?", a: "Sim. Endocrinologistas, nutrólogos, ginecologistas, cardiologistas, psiquiatras, dermatologistas — a PRAXIS se adapta ao seu nicho." },
  { q: "Quantas gerações posso fazer por mês?", a: "Depende do plano. Starter: 30/mês. Pro: 200/mês. Elite: ilimitado." },
  { q: "Os dados dos meus pacientes ficam seguros?", a: "A PRAXIS não armazena dados de pacientes. Você trabalha com conteúdo estratégico e de autoridade, nunca com casos clínicos identificáveis." },
  { q: "Posso usar no celular?", a: "Sim. A plataforma é responsiva e funciona bem em smartphones e tablets, além do desktop." },
  { q: "Como funciona o onboarding do plano Elite?", a: "No plano Elite, um especialista PRAXIS entra em contato em até 24h para uma sessão de 1 hora para configurar tudo para o seu perfil e nicho." },
]

const PLANS = [
  {
    id: "starter", name: "Starter", price: 97,
    badge: null as string | null, color: "text-text-secondary",
    border: "border-border", ctaBg: "bg-white/[0.06] hover:bg-white/[0.10]", ctaText: "text-text-secondary",
    features: ["Roteiros, Legendas, Ganchos", "Banco de Pautas", "30 gerações/mês", "Suporte por email"],
    excluded: ["Agente Executivo", "Radar de Tendências", "Diretor Criativo"],
    icon: Zap,
  },
  {
    id: "pro", name: "Pro", price: 197,
    badge: "RECOMENDADO", color: "text-accent",
    border: "border-accent-border", ctaBg: "bg-accent hover:opacity-90", ctaText: "text-background font-bold",
    features: ["Todos os módulos exceto Agente Executivo", "200 gerações/mês", "Suporte por WhatsApp", "Atualizações prioritárias"],
    excluded: ["Agente Executivo"],
    icon: Star,
  },
  {
    id: "elite", name: "Elite", price: 397,
    badge: "ELITE", color: "text-[#d4af37]",
    border: "border-[rgba(212,175,55,0.25)]", ctaBg: "bg-[#d4af37] hover:bg-[#e0bc40]", ctaText: "text-[#080808] font-bold",
    features: ["TODOS os 15 módulos", "Gerações ilimitadas", "WhatsApp prioritário", "Onboarding 1:1 com especialista"],
    excluded: [],
    icon: Crown,
  },
]

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, title, sub }: { label: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12">
      <p className="text-[10px] font-mono text-accent tracking-[3px] uppercase mb-3">{label}</p>
      <h2 className="text-[28px] md:text-[36px] font-semibold text-text-primary mb-4 leading-tight"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
        {title}
      </h2>
      {sub && <p className="text-[15px] text-text-secondary leading-relaxed">{sub}</p>}
    </div>
  )
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-[14px] font-medium text-text-primary group-hover:text-accent transition-colors">{q}</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-accent flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-text-secondary transition-colors" />}
      </button>
      {open && (
        <p className="pb-5 text-[13px] text-text-secondary leading-relaxed">
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
  const [stats, setStats]                   = useState<{ medicos_ativos: number; consultas_realizadas: number } | null>(null)

  useEffect(() => {
    fetch("/api/landing/stats").then(r => r.json()).then(setStats).catch(() => null)
  }, [])

  const fmtStat = (n: number, threshold = 50) =>
    n < threshold ? null : n >= 1000 ? `+${Math.floor(n / 100) * 100}` : `+${n}`

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif", background: CREAM, color: NAVY }}>

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

      {/* ── FEATURE COPILOTO ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[10px] font-mono tracking-[3px] uppercase mb-3" style={{ color: GOLD }}>O coração da plataforma</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold mb-4 leading-tight text-white"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              O Copiloto que trabalha depois que o paciente sai.
            </h2>
            <p className="text-[15px] mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
              Enquanto você atende, o Copiloto ouve, documenta e organiza. Ao final, o prontuário já sai pronto e o seguimento certo é disparado na hora certa — indicação, NPS e retorno, tudo automático.
            </p>
            <div className="space-y-3">
              {["Prontuário SOAP gerado automaticamente", "Sugestão de CID e condutas por especialidade", "Indicação e NPS agendados via WhatsApp (D+1, D+7, D+30)"].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
                  <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.85)" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,108,0.20)" }}>
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>Ações pós-consulta</div>
            <div className="space-y-2">
              {[{ t: "Prontuário salvo", s: "há 2 segundos" }, { t: "Indicação D+1 agendada", s: "amanhã, 09:00" },
                { t: "NPS D+1 agendado", s: "amanhã, 09:00" }, { t: "Retorno D+30 agendado", s: "em 30 dias" }].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,108,0.15)", border: "1px solid rgba(201,168,108,0.30)" }}>
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

      {/* ── PLANOS ──────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            label="Planos"
            title="Investimento que se paga no primeiro mês."
            sub="Cancele quando quiser. Sem fidelidade, sem burocracia."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col bg-surface border rounded-xl p-6 transition-all",
                    plan.border,
                    plan.id === "pro" && "shadow-lg shadow-accent/5"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={cn(
                        "text-badge font-mono font-bold px-3 py-1 rounded-full border tracking-widest",
                        plan.id === "pro"
                          ? "bg-accent text-background border-accent"
                          : "bg-[#d4af37] text-[#080808] border-[#d4af37]"
                      )}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={cn("w-5 h-5", plan.color)} />
                    <span className={cn("text-[16px] font-semibold", plan.color)}>{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-[11px] text-text-muted font-mono">R$</span>
                    <span className={cn("text-[34px] font-bold leading-none", plan.color)}>{plan.price}</span>
                    <span className="text-[12px] text-text-muted">/mês</span>
                  </div>
                  <div className="flex-1 space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        <span className="text-[12px] text-text-secondary">{f}</span>
                      </div>
                    ))}
                    {plan.excluded.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-text-muted/40 flex-shrink-0" />
                        <span className="text-[12px] text-text-muted/50">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/planos')}
                    className={cn("w-full py-3 rounded-lg text-[13px] transition-all active:scale-[0.98] min-h-[48px]", plan.ctaBg, plan.ctaText)}
                  >
                    Assinar {plan.name}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface-2)" }}>
        <div className="max-w-2xl mx-auto">
          <SectionHeader label="Dúvidas frequentes" title="Tudo que você precisa saber." />
          <div>
            {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-[30px] md:text-[40px] font-semibold text-text-primary mb-4"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Comece hoje. Cancele quando quiser.
          </h2>
          <p className="text-[15px] text-text-secondary mb-8">
            Junte-se aos profissionais de saúde que já usam PRAXIS para construir uma presença digital de alto padrão.
          </p>
          <button
            onClick={() => router.push('/planos')}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-accent text-background text-[15px] font-bold hover:opacity-90 transition-all active:scale-[0.98]"
          >
            Começar agora <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <PraxisLogo />
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
