"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Sparkles, Copy, Check, RefreshCw, FileText, Instagram, Video, Image } from "lucide-react"
import { cn } from "@/lib/utils"

const FORMATOS = [
  { id: "carrossel", label: "Carrossel", icon: "📊", desc: "Sequência de slides educativos" },
  { id: "reels",     label: "Reels",     icon: "🎬", desc: "Vídeo curto e dinâmico" },
  { id: "feed",      label: "Feed",      icon: "🖼️", desc: "Post único informativo" },
  { id: "stories",   label: "Stories",   icon: "⚡", desc: "Conteúdo rápido e direto" },
]

const TONS = ["Educativo", "Inspirador", "Científico", "Casual", "Urgente"]

interface Pauta {
  id: string
  titulo: string
  categoria: string
  nota: string
  fonte?: string
}

interface Legenda {
  gancho: string
  desenvolvimento: string
  cta: string
  hashtags: string
  completa: string
}

export default function LegendaPage() {
  const [pautas, setPautas]         = useState<Pauta[]>([])
  const [pautaSel, setPautaSel]     = useState<Pauta | null>(null)
  const [formato, setFormato]       = useState("carrossel")
  const [tom, setTom]               = useState("Educativo")
  const [emojis, setEmojis]         = useState(true)
  const [loading, setLoading]       = useState(false)
  const [legenda, setLegenda]       = useState<Legenda | null>(null)
  const [copiado, setCopiado]       = useState(false)
  const [topico, setTopico]         = useState("")
  const [usarPauta, setUsarPauta]   = useState(true)
  const [toast, setToast]           = useState<string | null>(null)
  const [geradas, setGeradas]       = useState(0)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  useEffect(() => {
    fetch('/api/pautas')
      .then(r => r.json())
      .then(data => setPautas(data || []))
      .catch(console.error)
  }, [])

  const gerarLegenda = async () => {
    const tema = usarPauta ? pautaSel?.titulo : topico
    if (!tema?.trim()) {
      showToast("Selecione uma pauta ou digite um tema!")
      return
    }

    setLoading(true)
    setLegenda(null)

    const contexto = usarPauta && pautaSel
      ? `Título: ${pautaSel.titulo}\nCategoria: ${pautaSel.categoria}\nNotas: ${pautaSel.nota || "Nenhuma"}\nFonte: ${pautaSel.fonte || "Não informada"}`
      : `Tema: ${topico}`

    try {
      const res = await fetch('/api/legendas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tema, contexto, formato, tom, emojis })
})
const parsed = await res.json()
setLegenda(parsed)
setGeradas(g => g + 1)
    } catch (e) {
      console.error(e)
      showToast("Erro ao gerar legenda. Tente novamente.")
    }
    setLoading(false)
  }

  const copiar = () => {
    if (!legenda) return
    navigator.clipboard.writeText(legenda.completa)
    setCopiado(true)
    showToast("Legenda copiada!")
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Gerador de Legendas"
        subtitle="INSTAGRAM · IA ESPECIALIZADA EM CONTEÚDO MÉDICO"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-dim border border-accent-border">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[11px] font-mono text-accent">{geradas} geradas</span>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Legendas Geradas"  value={geradas}         sub="nesta sessão"      icon={Sparkles} accent="green" />
          <StatCard label="Pautas Disponíveis" value={pautas.length}  sub="no banco"          icon={FileText} accent="blue"  />
          <StatCard label="Formatos"           value={FORMATOS.length} sub="disponíveis"      icon={Instagram} accent="amber" />
          <StatCard label="Modelo IA"          value="Sonnet"          sub="Claude 4"         icon={Sparkles} accent="green" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Painel esquerdo — configuração */}
          <div className="space-y-5">

            {/* Fonte do tema */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-4">Tema da Legenda</div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => setUsarPauta(true)}
                  className={cn("flex-1 py-2 rounded-lg text-[12px] font-medium border transition-all",
                    usarPauta ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:text-text-secondary")}>
                  Usar Pauta do Banco
                </button>
                <button onClick={() => setUsarPauta(false)}
                  className={cn("flex-1 py-2 rounded-lg text-[12px] font-medium border transition-all",
                    !usarPauta ? "bg-accent-dim border-accent-border text-accent" : "border-border text-text-muted hover:text-text-secondary")}>
                  Digitar Tema Livre
                </button>
              </div>

              {usarPauta ? (
                <div className="space-y-2">
                  {pautas.length === 0 ? (
                    <div className="text-center py-6 text-text-muted text-[12px]">
                      Nenhuma pauta no banco ainda.
                    </div>
                  ) : (
                    pautas.slice(0, 6).map(p => (
                      <button key={p.id} onClick={() => setPautaSel(p)}
                        className={cn("w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                          pautaSel?.id === p.id
                            ? "bg-accent-dim border-accent-border"
                            : "border-border hover:border-border-hover"
                        )}>
                        <div className={cn("text-[12px] font-medium leading-snug", pautaSel?.id === p.id ? "text-accent-text" : "text-text-primary")}>
                          {p.titulo}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">{p.categoria}</div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <textarea
                  value={topico}
                  onChange={e => setTopico(e.target.value)}
                  placeholder="Ex: Resistência insulínica em pessoas magras e como identificar..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 resize-none"
                />
              )}
            </div>

            {/* Formato */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-4">Formato do Post</div>
              <div className="grid grid-cols-2 gap-2">
                {FORMATOS.map(f => (
                  <button key={f.id} onClick={() => setFormato(f.id)}
                    className={cn("flex flex-col items-start px-3 py-3 rounded-lg border transition-all",
                      formato === f.id
                        ? "bg-accent-dim border-accent-border"
                        : "border-border hover:border-border-hover"
                    )}>
                    <span className="text-[18px] mb-1">{f.icon}</span>
                    <span className={cn("text-[12px] font-medium", formato === f.id ? "text-accent-text" : "text-text-primary")}>{f.label}</span>
                    <span className="text-[10px] text-text-muted">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tom e opções */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <div>
                <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-3">Tom de Voz</div>
                <div className="flex flex-wrap gap-2">
                  {TONS.map(t => (
                    <button key={t} onClick={() => setTom(t)}
                      className={cn("text-[11px] px-3 py-1.5 rounded-full border transition-all",
                        tom === t
                          ? "bg-accent-dim border-accent-border text-accent-text font-medium"
                          : "border-border text-text-muted hover:text-text-secondary"
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[12px] text-text-secondary">Incluir emojis</span>
                <button onClick={() => setEmojis(v => !v)}
                  className={cn("w-10 h-5 rounded-full transition-all relative",
                    emojis ? "bg-accent" : "bg-border"
                  )}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
                    emojis ? "left-5" : "left-0.5"
                  )} />
                </button>
              </div>
            </div>

            {/* Botão gerar */}
            <button onClick={gerarLegenda} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg bg-accent border border-accent text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando com IA...</>
                : <><Sparkles className="w-4 h-4" /> Gerar Legenda</>
              }
            </button>
          </div>

          {/* Painel direito — resultado */}
          <div className="space-y-4">
            {!legenda && !loading && (
              <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-dim border border-accent-border flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-text-primary mb-2">Pronto para criar</div>
                  <div className="text-[12px] text-text-secondary">
                    Selecione uma pauta ou digite um tema,<br />escolha o formato e clique em Gerar Legenda.
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
                <RefreshCw className="w-10 h-10 text-accent animate-spin" />
                <div className="text-[12px] font-mono text-text-muted tracking-widest">GERANDO LEGENDA COM IA...</div>
              </div>
            )}

            {legenda && !loading && (
              <div className="space-y-4">
                {/* Gancho */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-[9px] font-mono text-accent tracking-widest uppercase mb-2">🎯 Gancho</div>
                  <p className="text-[13px] text-text-primary font-medium leading-relaxed">{legenda.gancho}</p>
                </div>

                {/* Desenvolvimento */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-[9px] font-mono text-blue-text tracking-widest uppercase mb-2">📝 Desenvolvimento</div>
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{legenda.desenvolvimento}</p>
                </div>

                {/* CTA */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-[9px] font-mono text-amber-400 tracking-widest uppercase mb-2">👆 CTA</div>
                  <p className="text-[13px] text-text-primary font-medium leading-relaxed">{legenda.cta}</p>
                </div>

                {/* Hashtags */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="text-[9px] font-mono text-text-muted tracking-widest uppercase mb-2"># Hashtags</div>
                  <p className="text-[11px] text-text-secondary leading-relaxed">{legenda.hashtags}</p>
                </div>

                {/* Legenda completa */}
                <div className="bg-card border border-accent-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[9px] font-mono text-accent tracking-widest uppercase">✅ Legenda Completa</div>
                    <button onClick={copiar}
                      className={cn("flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all",
                        copiado
                          ? "bg-accent-dim border-accent-border text-accent"
                          : "border-border text-text-muted hover:border-accent-border hover:text-accent"
                      )}>
                      {copiado ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar tudo</>}
                    </button>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-line">{legenda.completa}</p>
                </div>

                {/* Gerar novamente */}
                <button onClick={gerarLegenda}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-text-muted text-[12px] hover:text-text-secondary hover:border-border-hover transition-all">
                  <RefreshCw className="w-3.5 h-3.5" /> Gerar outra versão
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  )
}