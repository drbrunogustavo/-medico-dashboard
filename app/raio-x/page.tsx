"use client"

import { useState, useRef } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"
import {
  ScanFace, AlertTriangle, Heart, ShieldX, MessageSquare, TrendingUp, Zap,
  BookOpen, Loader2, AlertCircle, X, Search, Check, RefreshCw, CalendarDays,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RaioXResult {
  medos:     string[]
  desejos:   string[]
  objecoes:  string[]
  linguagem: string[]
  conteudos: string[]
  gatilhos:  string[]
}

interface Pauta {
  id:        number | string
  titulo:    string
  categoria: string
}

// ─── Config ─────────────────────────────────────────────────────────────────────

interface SectionDef {
  key:    keyof RaioXResult
  label:  string
  Icon:   LucideIcon
  color:  string
  bg:     string
  border: string
  desc:   string
}

const SECTIONS: SectionDef[] = [
  { key: "medos",     label: "Medos",                   Icon: AlertTriangle, color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",    desc: "Medos reais e específicos desse perfil" },
  { key: "desejos",  label: "Desejos",                  Icon: Heart,         color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200",  desc: "Aspirações e desejos em relação ao tema" },
  { key: "objecoes", label: "Objeções",                 Icon: ShieldX,       color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200",  desc: "Resistências comuns à consulta e tratamento" },
  { key: "linguagem",label: "Linguagem que Usam",       Icon: MessageSquare, color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",   desc: "Palavras e frases exatas do paciente" },
  { key: "conteudos",label: "Conteúdos que Convertem", Icon: TrendingUp,    color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", desc: "Formatos que esse perfil consome e compartilha" },
  { key: "gatilhos", label: "Gatilhos de Decisão",      Icon: Zap,           color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", desc: "O que faz esse paciente marcar uma consulta" },
]

// ─── Mock fallback ──────────────────────────────────────────────────────────────

const MOCK_RESULT: RaioXResult = {
  medos: [
    "Hormônio causa câncer de mama",
    "Vou engordar com a reposição",
    "Ficar dependente do remédio para sempre",
    "Efeitos colaterais piores que os sintomas",
    "Meu marido vai me achar diferente",
    "Vou perder minha feminilidade",
    "Trombose ou AVC por causa do hormônio",
  ],
  desejos: [
    "Voltar a dormir bem sem acordar suada",
    "Ter energia para acompanhar os filhos",
    "Manter o peso sem dieta radical",
    "Sentir desejo sexual novamente",
    "Não ter mais oscilações de humor",
    "Envelhecer com saúde e independência",
    "Ter clareza mental e memória boa",
  ],
  objecoes: [
    "É muito caro pagar consulta e exames todo mês",
    "Minha mãe teve câncer, não posso tomar hormônio",
    "Vou esperar passar sozinha, é natural",
    "Meu ginecologista não recomendou",
    "Prefiro alternativas naturais primeiro",
    "Tenho medo dos efeitos a longo prazo",
    "Já tentei de tudo e nada funcionou",
  ],
  linguagem: [
    '"Estou no climatério"',
    '"Calor que sobe do peito para a cabeça"',
    '"Accordar encharcada de suor"',
    '"Humor na bucha"',
    '"Não me reconheço mais"',
    '"Meu corpo não obedece"',
    '"Sinto que estou envelhecendo rápido"',
    '"Parece que apaguei"',
  ],
  conteudos: [
    "Depoimentos reais de pacientes que fizeram reposição",
    "Antes e depois de tratamento (humor, energia, peso)",
    "Mitos x verdades sobre hormônios",
    '"Coisas que ninguém te conta sobre a menopausa"',
    "Quiz: Você está no climatério?",
    "Checklist de sintomas hormonais",
    "Comparativo natural vs reposição com ciência",
    "Dia a dia do consultório com casos reais",
  ],
  gatilhos: [
    "Sintoma que impede de trabalhar ou dormir",
    "Amiga que conta resultado positivo do tratamento",
    "Post com o qual ela se identifica 100%",
    "Médico que explica com empatia e sem julgamento",
    "Medo de desenvolver osteoporose ou cardiopatia",
    "Filho ou marido que percebe a mudança",
  ],
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function RaioXPage() {
  const [perfil,        setPerfil]        = useState("")
  const [tema,          setTema]          = useState("")
  const [resultado,     setResultado]     = useState<RaioXResult | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [savingCal,     setSavingCal]     = useState(false)
  const [calSaved,      setCalSaved]      = useState(false)
  const [toast,         setToast]         = useState<string | null>(null)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [pautas,        setPautas]        = useState<Pauta[]>([])
  const [loadingPautas, setLoadingPautas] = useState(false)
  const [pautaSearch,   setPautaSearch]   = useState("")

  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  const analisar = async () => {
    if (!perfil.trim() || !tema.trim()) {
      setError("Preencha o perfil do paciente e a condição/tema antes de analisar.")
      return
    }
    setError(null); setLoading(true); setResultado(null); setCalSaved(false)

    try {
      const res  = await fetch("/api/raio-x", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ perfil, tema }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResultado(data)
    } catch {
      setError("Erro ao analisar. Usando dados de demonstração.")
      setResultado(MOCK_RESULT)
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = async () => {
    setModalOpen(true); setPautaSearch("")
    if (pautas.length > 0) return
    setLoadingPautas(true)
    try {
      const res  = await fetch("/api/pautas")
      const data = await res.json()
      setPautas(Array.isArray(data) ? data : [])
    } catch { setPautas([]) }
    finally  { setLoadingPautas(false) }
  }

  const gerarCalendario = async () => {
    if (!resultado) return
    setSavingCal(true)
    const top5 = resultado.conteudos.slice(0, 5)
    let saved  = 0
    for (const c of top5) {
      try {
        await fetch("/api/pautas", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            titulo:    c,
            categoria: "Estratégia de Conteúdo",
            nota:      `Perfil: ${perfil} | Tema: ${tema}`,
            prioridade:"Alta",
            estagio:   "Ideia",
            tags:      ["raio-x", perfil.split(",")[0]?.trim().toLowerCase() ?? "perfil"],
          }),
        })
        saved++
      } catch { /* continue */ }
    }
    setSavingCal(false)
    setCalSaved(true)
    showToast(`${saved} conteúdo${saved !== 1 ? "s" : ""} salvo${saved !== 1 ? "s" : ""} no Banco de Pautas!`)
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Raio-X de Pacientes"
        subtitle="O QUE SEU PACIENTE REALMENTE PENSA · PSICOLOGIA DO PACIENTE · MARKETING MÉDICO"
        actions={
          resultado ? (
            <button
              onClick={() => { setResultado(null); setError(null); setCalSaved(false) }}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Nova análise
            </button>
          ) : undefined
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* Input */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary">Perfil do Paciente</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Defina o perfil e tema para revelar o mapa psicológico completo desse paciente</p>
            </div>
            <button
              onClick={abrirModal}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md border border-border text-text-muted hover:border-accent-border hover:text-accent transition-all flex-shrink-0"
            >
              <BookOpen className="w-3 h-3" /> Importar Pauta
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Perfil do Paciente</label>
              <input
                value={perfil}
                onChange={e => setPerfil(e.target.value)}
                placeholder="Ex: Mulher, 48 anos, climatério, classe C"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">Condição / Tema</label>
              <input
                value={tema}
                onChange={e => setTema(e.target.value)}
                onKeyDown={e => e.key === "Enter" && analisar()}
                placeholder="Ex: reposição hormonal, emagrecimento, GLP-1"
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={analisar}
            disabled={loading || !perfil.trim() || !tema.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-background text-[13px] font-bold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando paciente...</>
              : <><ScanFace className="w-4 h-4" /> Analisar Paciente</>}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <ScanFace className="w-10 h-10 text-accent animate-pulse" />
            <div className="text-center">
              <div className="text-[14px] font-semibold text-text-primary">Mapeando psicologia do paciente...</div>
              <div className="text-[10px] font-mono text-text-muted tracking-widest mt-1">CLAUDE ANALISANDO PERFIL COMPORTAMENTAL</div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !resultado && !error && (
          <div className="bg-card border border-border rounded-lg py-16 flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
              <ScanFace className="w-7 h-7 text-accent" />
            </div>
            <div className="text-center max-w-lg">
              <h3 className="text-[15px] font-semibold text-text-primary mb-2">Raio-X Psicológico do Paciente</h3>
              <p className="text-[12px] text-text-muted leading-relaxed">
                Descreva o perfil do seu paciente ideal e o tema. O Claude vai revelar o mapa completo: medos, desejos, objeções, linguagem que usam, conteúdos que convertem e os gatilhos que os fazem marcar consulta.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full max-w-lg">
              {SECTIONS.map(s => (
                <div key={s.key} className={cn("rounded-lg p-2.5 text-center border", s.bg, s.border)}>
                  <s.Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", s.color)} />
                  <div className={cn("text-[9px] font-semibold", s.color)}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {!loading && resultado && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SECTIONS.map(s => {
                const items = resultado[s.key] ?? []
                return (
                  <div key={s.key} className={cn("rounded-xl border flex flex-col", s.bg, s.border)}>
                    <div className={cn("px-4 py-3 border-b flex items-center gap-2.5", s.border)}>
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", s.bg, "border", s.border)}>
                        <s.Icon className={cn("w-3.5 h-3.5", s.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-[11px] font-bold uppercase tracking-wide", s.color)}>{s.label}</div>
                        <div className="text-[9px] text-text-muted mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className={cn("w-1 h-1 rounded-full flex-shrink-0 mt-1.5", s.color.replace("text-", "bg-"))} />
                          <p className="text-[11px] text-text-secondary leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Calendar CTA */}
            <div className="bg-card border border-accent-border rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[13px] font-semibold text-text-primary">Gerar Calendário de Conteúdo para Este Perfil</h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Salva os top 5 conteúdos sugeridos no Banco de Pautas com prioridade Alta para você executar
                </p>
              </div>
              <button
                onClick={gerarCalendario}
                disabled={savingCal || calSaved}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold flex-shrink-0 transition-all w-full sm:w-auto justify-center",
                  calSaved
                    ? "bg-accent-dim border border-accent-border text-accent cursor-default"
                    : "bg-accent text-background hover:bg-accent/90 disabled:opacity-50"
                )}
              >
                {savingCal
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>
                  : calSaved
                    ? <><Check className="w-3.5 h-3.5" /> 5 pautas salvas!</>
                    : <><CalendarDays className="w-3.5 h-3.5" /> Gerar Calendário</>}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          <Check className="w-3.5 h-3.5" /> {toast}
        </div>
      )}

      {/* Pauta modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(8,9,14,0.88)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-lg rounded-xl border flex flex-col" style={{ background: "var(--surface)", borderColor: "var(--border)", maxHeight: "80vh" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                <span className="text-[13px] font-semibold text-text-primary">Importar do Banco de Pautas</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-text-primary transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  autoFocus
                  value={pautaSearch}
                  onChange={e => setPautaSearch(e.target.value)}
                  placeholder="Buscar pauta..."
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-[12px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {loadingPautas ? (
                <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[12px] font-mono">Carregando pautas...</span>
                </div>
              ) : pautas.length === 0 ? (
                <p className="text-center py-12 text-[12px] text-text-muted">Nenhuma pauta encontrada.</p>
              ) : (
                <div className="space-y-1">
                  {pautas
                    .filter(p => !pautaSearch || p.titulo.toLowerCase().includes(pautaSearch.toLowerCase()))
                    .map(pauta => (
                      <button key={pauta.id} onClick={() => { setTema(pauta.titulo); setModalOpen(false) }}
                        className="w-full text-left px-4 py-3 rounded-lg border border-transparent hover:border-accent-border hover:bg-accent-dim/30 transition-all group">
                        <p className="text-[12px] font-medium text-text-primary group-hover:text-accent transition-colors">{pauta.titulo}</p>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-border text-text-muted mt-1 inline-block">{pauta.categoria}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
