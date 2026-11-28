"use client"

import { useState } from "react"
import { BookOpen, Check, Plus, RefreshCw } from "lucide-react"
import { PautasModal } from "@/components/PautasModal"
import { Panel, PxButton, PxInput, Field, Tag, PageHeader } from "@/components/px"

type Tipo = "conservadora" | "equilibrada" | "polemica" | "viral"
type Risco = "Baixo" | "Médio" | "Alto"

interface Abordagem {
  tipo: Tipo
  titulo: string
  gancho: string
  estrutura: string[]
  risco: Risco
}

const TIPO_INFO: Record<Tipo, { label: string; desc: string }> = {
  conservadora: { label: "Conservadora", desc: "Tom seguro, baseado em evidências" },
  equilibrada: { label: "Equilibrada", desc: "Apresenta os dois lados e estimula reflexão" },
  polemica: { label: "Polêmica controlada", desc: "Questiona um consenso com respaldo científico" },
  viral: { label: "Alto impacto", desc: "Máxima carga emocional, sem sensacionalismo" },
}

const RISCO_TONE: Record<Risco, "ok" | "warn" | "danger"> = { Baixo: "ok", Médio: "warn", Alto: "danger" }

export default function PolemicasPage() {
  const [tema, setTema] = useState("")
  const [abordagens, setAbordagens] = useState<Abordagem[]>([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvos, setSalvos] = useState<Tipo[]>([])
  const [salvando, setSalvando] = useState<Tipo[]>([])
  const [erroSalvar, setErroSalvar] = useState<{ tipo: Tipo; msg: string } | null>(null)
  const [showPautas, setShowPautas] = useState(false)

  async function gerar() {
    const t = tema.trim()
    if (t.length < 3 || loading) return
    setErro(null); setLoading(true); setAbordagens([]); setSalvos([]); setErroSalvar(null)
    try {
      const res = await fetch("/api/polemicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: t }),
      })
      const data = await res.json().catch(() => ({})) as { abordagens?: Abordagem[]; error?: string }
      if (!res.ok || !Array.isArray(data.abordagens) || data.abordagens.length === 0)
        throw new Error(data.error || "HTTP " + res.status)
      setAbordagens(data.abordagens)
    } catch (e) {
      console.error("[polemicas] erro ao gerar:", e)
      setErro("Não foi possível gerar as abordagens. Tente novamente.")
    } finally { setLoading(false) }
  }

  async function salvar(ab: Abordagem) {
    if (salvando.includes(ab.tipo) || salvos.includes(ab.tipo)) return
    setSalvando(prev => [...prev, ab.tipo]); setErroSalvar(null)
    try {
      const res = await fetch("/api/pautas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: ab.titulo,
          nota: "[" + TIPO_INFO[ab.tipo].label.toUpperCase() + "] " + ab.gancho.replace(/\n/g, " ") + "\n\nEstrutura:\n" + ab.estrutura.map((p, i) => (i + 1) + ". " + p.replace(/^\d+\.\s*/, "")).join("\n"),
          categoria: "Oportunidade de Conteúdo",
          prioridade: "Média",
          estagio: "Ideia",
          tags: [ab.tipo, "risco-" + ab.risco.toLowerCase().replace("é", "e")],
        }),
      })
      if (!res.ok) throw new Error("HTTP " + res.status)
      setSalvos(prev => [...prev, ab.tipo])
    } catch (e) {
      console.error("[polemicas] erro ao salvar abordagem:", e)
      setErroSalvar({ tipo: ab.tipo, msg: "Não foi possível salvar. Tente novamente." })
    } finally { setSalvando(prev => prev.filter(x => x !== ab.tipo)) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Polêmicas Controladas"
        caption="Quatro abordagens para o mesmo tema, do tom mais seguro ao de maior impacto"
        actions={abordagens.length > 0 ? (
          <PxButton variant="secondary" size="sm" leftIcon={RefreshCw} onClick={() => { setAbordagens([]); setErro(null); setSalvos([]) }}>Nova análise</PxButton>
        ) : undefined}
      />
      {showPautas && <PautasModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-3">
          <Field label="Tema do conteúdo" htmlFor="pol-tema" hint="Cada abordagem vem com título, gancho de abertura e cinco pontos de roteiro.">
            <PxInput
              id="pol-tema"
              value={tema}
              onChange={e => setTema(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") gerar() }}
              maxLength={300}
              placeholder="Ex: resistência à insulina, testosterona e andropausa, GLP-1 sem diabetes"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <PxButton onClick={gerar} loading={loading} disabled={tema.trim().length < 3}>{loading ? "Gerando" : abordagens.length ? "Gerar novamente" : "Gerar abordagens"}</PxButton>
            <PxButton variant="secondary" leftIcon={BookOpen} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          </div>
        </Panel>

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
        {loading && <p role="status" className="py-20 text-center text-[14px] font-medium text-px-ink">Elaborando as abordagens</p>}

        {!loading && abordagens.length === 0 && !erro && (
          <Panel className="py-14 text-center">
            <p className="text-[15px] font-semibold text-px-ink">Informe um tema para começar</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-px-muted">
              Você recebe uma abordagem conservadora, uma equilibrada, uma polêmica e uma de alto impacto. Revise cada afirmação e cite fonte antes de publicar.
            </p>
          </Panel>
        )}

        {!loading && abordagens.length > 0 && (
          <>
            <p className="text-[12.5px] text-px-muted">
              O risco é uma avaliação da IA sobre chance de crítica ou desinformação. Os ganchos são sugestões: confira dados e fontes antes de gravar.
            </p>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {abordagens.map(ab => {
                const info = TIPO_INFO[ab.tipo]
                const salvo = salvos.includes(ab.tipo)
                return (
                  <li key={ab.tipo}>
                    <Panel as="article" className="flex h-full flex-col gap-4">
                      <header className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h2 className="text-[14px] font-semibold text-px-ink">{info.label}</h2>
                          <Tag tone={RISCO_TONE[ab.risco]}>Risco {ab.risco.toLowerCase()}</Tag>
                        </div>
                        <p className="text-[12.5px] text-px-muted">{info.desc}</p>
                      </header>

                      <section className="space-y-1">
                        <h3 className="text-[12px] font-medium text-px-muted">Título sugerido</h3>
                        <p className="text-[14px] font-semibold leading-snug text-px-ink">{ab.titulo}</p>
                      </section>

                      <section className="space-y-1">
                        <h3 className="text-[12px] font-medium text-px-muted">Gancho de abertura</h3>
                        <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-px-ink">{ab.gancho}</p>
                      </section>

                      <section className="flex-1 space-y-1">
                        <h3 className="text-[12px] font-medium text-px-muted">Estrutura do roteiro</h3>
                        <ol className="space-y-1.5">
                          {ab.estrutura.map((p, i) => (
                            <li key={i} className="flex gap-2 text-[13px] leading-snug text-px-ink">
                              <span className="w-4 shrink-0 tabular-nums text-px-muted">{i + 1}</span>
                              <span>{p.replace(/^\d+\.\s*/, "")}</span>
                            </li>
                          ))}
                        </ol>
                      </section>

                      <div className="space-y-2">
                        {erroSalvar?.tipo === ab.tipo && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[12.5px] text-px-danger">{erroSalvar.msg}</p>}
                        <PxButton
                          fullWidth
                          variant={salvo ? "secondary" : "primary"}
                          leftIcon={salvo ? Check : Plus}
                          loading={salvando.includes(ab.tipo)}
                          disabled={salvo}
                          onClick={() => salvar(ab)}
                        >
                          {salvo ? "Salva no banco de pautas" : "Salvar no banco de pautas"}
                        </PxButton>
                      </div>
                    </Panel>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
