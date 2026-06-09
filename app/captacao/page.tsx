"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Check, ArrowRight, Stethoscope, Star, Heart,
  Phone, Instagram, MapPin, ChevronDown, ChevronUp,
  Loader2, CheckCircle, Sparkles,
} from "lucide-react"
import { PraxisLogo } from "@/components/PraxisLogo"

// ── Data ──────────────────────────────────────────────────────────────────────

const PROGRAMS = [
  {
    name: "Evolução Metabólica",
    desc: "Programa completo de emagrecimento sustentável com acompanhamento hormonal e metabólico individualizado.",
    tags: ["Emagrecimento", "Hormônios", "Nutrição"],
    color: "border-accent/30 bg-accent/5",
  },
  {
    name: "Longevidade Ativa",
    desc: "Protocolo de prevenção e otimização do envelhecimento com foco em qualidade de vida e vitalidade.",
    tags: ["Longevidade", "Prevenção", "Saúde Hormonal"],
    color: "border-blue-500/30 bg-blue-500/5",
  },
  {
    name: "Check-up Executivo",
    desc: "Avaliação completa de saúde com exames avançados, análise de risco cardiovascular e metabólico.",
    tags: ["Check-up", "Prevenção", "Diagnóstico"],
    color: "border-purple-500/30 bg-purple-500/5",
  },
]

const DEPOIMENTOS = [
  { nome: "Ana C., 38 anos", nota: 10, texto: "Depois de 3 meses de acompanhamento, perdi 12kg e recuperei minha energia. O Dr. Bruno é incrível — vai muito além da consulta comum!" },
  { nome: "Roberto M., 45 anos", nota: 10, texto: "Finalmente um médico que investigou a causa do meu cansaço. Meus hormônios estavam desregulados. Em 2 meses me sinto outra pessoa." },
  { nome: "Cláudia F., 52 anos", nota: 10, texto: "O programa de longevidade mudou minha vida. Hoje tenho mais energia do que quando tinha 40 anos. Recomendo muito!" },
]

const STEPS = [
  { n: "01", t: "Preencha o formulário",    d: "Informe seus dados e o motivo do interesse em menos de 2 minutos." },
  { n: "02", t: "Nossa equipe entra em contato", d: "Você receberá uma mensagem via WhatsApp em até 2 horas úteis." },
  { n: "03", t: "Agendamento personalizado", d: "Combinamos o melhor dia e horário para a sua consulta." },
  { n: "04", t: "Inicie sua jornada",        d: "Consulta individualizada com plano terapêutico completo." },
]

const INTERESSES = ["Emagrecimento", "Hormônios", "Longevidade", "Check-up completo", "Outro"]
const COMO_ENCONTROU = [
  { v: "instagram", l: "Instagram" },
  { v: "indicacao", l: "Indicação de amigo/paciente" },
  { v: "google",    l: "Google" },
  { v: "outro",     l: "Outro" },
]

const inputCls = "w-full bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-accent/60 transition-colors"
const selectCls = cn(inputCls, "appearance-none cursor-pointer")

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d; if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CaptacaoPage() {
  const [form, setForm] = useState({
    nome: "", whatsapp: "", email: "", interesse: "", como_encontrou: "", mensagem: "",
  })
  const [step,  setStep]  = useState<"idle" | "sending" | "done" | "error">("idle")
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.nome.trim() && form.whatsapp.replace(/\D/g, "").length >= 10

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!valid) return
    setStep("sending")
    try {
      const r = await fetch("/api/captacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, whatsapp: form.whatsapp.replace(/\D/g, "") }),
      })
      setStep(r.ok ? "done" : "error")
    } catch { setStep("error") }
  }

  const FAQ = [
    { q: "Qual a diferença do atendimento do Dr. Bruno?", a: "O Dr. Bruno realiza uma avaliação clínica profunda, investigando causas hormonais, metabólicas e nutricionais que muitas vezes passam despercebidas. Cada plano é 100% individualizado." },
    { q: "Quanto tempo dura a consulta?", a: "A consulta inicial tem duração mínima de 60 minutos, para garantir uma avaliação completa." },
    { q: "As consultas são presenciais ou online?", a: "Realizamos atendimentos presenciais e teleconsulta. Informe sua preferência no formulário." },
    { q: "Qual o prazo para agendamento?", a: "Nossa equipe entra em contato em até 2 horas úteis após o preenchimento do formulário." },
  ]

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0D1B2A]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <PraxisLogo />
          <a
            href="#formulario"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent rounded-lg text-[13px] font-semibold text-[#0D1B2A] hover:bg-accent/90 transition-colors"
          >
            Agendar consulta <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/25 rounded-full text-[11px] font-mono text-accent uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Medicina de Precisão
          </span>
          <h1 className="text-[36px] md:text-[52px] font-bold leading-tight font-serif">
            Cuide da sua saúde com quem entende do assunto
          </h1>
          <p className="text-[17px] text-white/70 max-w-2xl mx-auto leading-relaxed">
            Endocrinologia, Nutrologia e Longevidade. Atendimento individualizado para quem busca resultados reais com saúde.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#formulario"
              className="flex items-center gap-2 px-6 py-3.5 bg-accent rounded-xl text-[15px] font-bold text-[#0D1B2A] hover:bg-accent/90 transition-all w-full sm:w-auto justify-center"
            >
              Quero agendar minha consulta <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#programas"
              className="flex items-center gap-2 px-6 py-3.5 border border-white/20 rounded-xl text-[15px] font-medium text-white/80 hover:border-white/40 transition-all w-full sm:w-auto justify-center"
            >
              Conhecer os programas
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 pt-2">
            {[["500+", "Pacientes"], ["98%", "Satisfação"], ["15+", "Anos de experiência"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-[22px] font-bold text-accent">{v}</div>
                <div className="text-[11px] text-white/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section className="py-16 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[28px] font-bold font-serif mb-4">Dr. Bruno Gustavo</h2>
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-4 h-4 text-accent" />
              <span className="text-[13px] text-accent font-mono">Endocrinologista · Nutrologista · Longevidade</span>
            </div>
            <p className="text-[14px] text-white/70 leading-relaxed mb-4">
              Especialista em medicina metabólica e hormonal, com foco em resultados sustentáveis. Atua na interface entre endocrinologia, nutrologia e medicina preventiva para oferecer um cuidado completo e individualizado.
            </p>
            <ul className="space-y-2">
              {["CRM ativo", "Formação em Endocrinologia", "Especialização em Nutrologia", "Medicina da Longevidade"].map(c => (
                <li key={c} className="flex items-center gap-2 text-[13px] text-white/60">
                  <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex items-center justify-center min-h-[280px]">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-[28px] font-bold text-accent">BG</span>
              </div>
              <div className="text-[16px] font-semibold">Dr. Bruno Gustavo</div>
              <div className="text-[12px] text-white/50">Foto disponível em breve</div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[28px] font-bold font-serif text-center mb-12">Como funciona</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/25 flex items-center justify-center mx-auto mb-3">
                  <span className="text-[11px] font-mono font-bold text-accent">{s.n}</span>
                </div>
                <h3 className="text-[14px] font-semibold mb-1">{s.t}</h3>
                <p className="text-[12px] text-white/50">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programas */}
      <section id="programas" className="py-16 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[28px] font-bold font-serif text-center mb-12">Programas</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PROGRAMS.map(p => (
              <div key={p.name} className={cn("rounded-2xl border p-6 space-y-3", p.color)}>
                <h3 className="text-[16px] font-bold">{p.name}</h3>
                <p className="text-[13px] text-white/60 leading-relaxed">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-white/40 mt-6">Consulte valores diretamente com nossa equipe.</p>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[28px] font-bold font-serif text-center mb-12">O que dizem nossos pacientes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {DEPOIMENTOS.map(d => (
              <div key={d.nome} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-[13px] text-white/70 leading-relaxed italic">"{d.texto}"</p>
                <div className="text-[11px] font-semibold text-white/40">— {d.nome}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section id="formulario" className="py-16 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[28px] font-bold font-serif">Quero cuidar da minha saúde</h2>
            <p className="text-[14px] text-white/60 mt-2">Preencha o formulário e nossa equipe entrará em contato em até 2h úteis.</p>
          </div>

          {step === "done" ? (
            <div className="text-center space-y-4 py-10">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h3 className="text-[20px] font-bold">Recebemos seu contato!</h3>
              <p className="text-[14px] text-white/60">Em breve nossa equipe entrará em contato via WhatsApp para agendar sua consulta.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5 uppercase tracking-wider">Nome completo *</label>
                <input value={form.nome} onChange={e => set("nome", e.target.value)} required placeholder="Seu nome" className={inputCls} />
              </div>
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5 uppercase tracking-wider">WhatsApp *</label>
                <input value={form.whatsapp} onChange={e => set("whatsapp", fmtPhone(e.target.value))} required placeholder="(11) 99999-9999" className={inputCls} />
              </div>
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="seu@email.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5 uppercase tracking-wider">Interesse principal</label>
                <select value={form.interesse} onChange={e => set("interesse", e.target.value)} className={selectCls}>
                  <option value="">Selecione...</option>
                  {INTERESSES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5 uppercase tracking-wider">Como nos encontrou</label>
                <select value={form.como_encontrou} onChange={e => set("como_encontrou", e.target.value)} className={selectCls}>
                  <option value="">Selecione...</option>
                  {COMO_ENCONTROU.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-white/50 mb-1.5 uppercase tracking-wider">Mensagem (opcional)</label>
                <textarea value={form.mensagem} onChange={e => set("mensagem", e.target.value)} rows={3} placeholder="Conte um pouco sobre o que está buscando..." className={cn(inputCls, "resize-none")} />
              </div>

              {step === "error" && (
                <p className="text-[13px] text-red-400">Erro ao enviar. Por favor, tente novamente.</p>
              )}

              <button
                type="submit"
                disabled={!valid || step === "sending"}
                className="w-full py-4 rounded-xl bg-accent text-[#0D1B2A] text-[15px] font-bold disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-accent/90 transition-all"
              >
                {step === "sending" ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Heart className="w-4 h-4" /> Quero cuidar da minha saúde</>}
              </button>

              <p className="text-[11px] text-white/30 text-center">Seus dados são protegidos e nunca serão compartilhados.</p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[24px] font-bold font-serif text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-2">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-medium">{f.q}</span>
                  {faqOpen === i ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4 text-[13px] text-white/60 leading-relaxed border-t border-white/5 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5 bg-[#0a1220]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <PraxisLogo />
          <div className="flex items-center gap-4 text-[12px] text-white/40">
            <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> CRM/SP</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> São Paulo, SP</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://wa.me/55" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-accent transition-colors">
              <Phone className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-white/50 hover:text-accent transition-colors">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
          </div>
        </div>
        <p className="text-center text-[11px] text-white/20 mt-6">© 2026 Dr. Bruno Gustavo. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
