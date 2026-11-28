"use client"

import { useState, useEffect } from "react"
import { Copy, Check, ClipboardList, Save, RotateCcw } from "lucide-react"
import { PautasModal } from "@/components/PautasModal"
import { pedirJSON, mensagemErroIA } from "@/lib/ia-json"
import { Panel, PxButton, Segmented, Field, Tag, PageHeader } from "@/components/px"

const NICHOS = ["Nutrologia", "Endocrinologia", "Longevidade", "Metabolismo", "Hormônios", "Anti-aging", "Emagrecimento", "Diabetes", "Tireoide"]
const OBJETIVOS = [
  { v: "alcance", l: "Alcance", desc: "Hashtags amplas, para chegar a mais pessoas" },
  { v: "nicho", l: "Nicho médico", desc: "Médicos e profissionais de saúde" },
  { v: "engajamento", l: "Engajamento", desc: "Audiência que comenta e salva" },
  { v: "local", l: "Local", desc: "Sua cidade e região" },
]
const TIPOS = ["nicho", "alcance", "engajamento", "local"]
const LIMITE = 5
const CHAVE_SETS = "praxis:hashtags:sets"

interface HashtagResult { hashtag: string; motivo: string; tipo: string }

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

/** Limpa o que a IA devolve: tira #, espaços e símbolos, descarta vazias e repetidas. */
function limparHashtags(lista: unknown): HashtagResult[] {
  if (!Array.isArray(lista)) return []
  const vistos = new Set<string>()
  const out: HashtagResult[] = []
  for (const h of lista) {
    if (!h || typeof h !== "object") continue
    const r = h as Record<string, unknown>
    const tag = typeof r.hashtag === "string" ? r.hashtag.replace(/^#+/, "").replace(/[^A-Za-z0-9_\u00C0-\u00FF]/g, "") : ""
    if (!tag || vistos.has(tag.toLowerCase())) continue
    vistos.add(tag.toLowerCase())
    out.push({
      hashtag: tag,
      motivo: typeof r.motivo === "string" ? r.motivo.trim() : "",
      tipo: typeof r.tipo === "string" && TIPOS.includes(r.tipo) ? r.tipo : "nicho",
    })
  }
  return out.slice(0, LIMITE)
}

function CopyBtn({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "erro">("")
  async function copiar() {
    try { await navigator.clipboard.writeText(text); setEstado("ok") } catch { setEstado("erro") }
    setTimeout(() => setEstado(""), 1800)
  }
  return (
    <PxButton variant="secondary" size="sm" leftIcon={estado === "ok" ? Check : Copy} onClick={copiar}>
      {estado === "ok" ? "Copiado" : estado === "erro" ? "Não foi possível copiar" : label}
    </PxButton>
  )
}

export default function HashtagsPage() {
  const [tema, setTema] = useState("")
  const [nicho, setNicho] = useState("Nutrologia")
  const [objetivo, setObjetivo] = useState("alcance")
  const [resultado, setResultado] = useState<HashtagResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showPautas, setShowPautas] = useState(false)
  const [salvos, setSalvos] = useState<string[][]>([])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAVE_SETS)
      const lista = raw ? JSON.parse(raw) : []
      if (Array.isArray(lista)) setSalvos(lista.filter((s): s is string[] => Array.isArray(s) && s.every(x => typeof x === "string")).slice(0, 5))
    } catch { /* sem armazenamento: os sets valem só nesta visita */ }
  }, [])

  const gravarSets = (lista: string[][]) => {
    setSalvos(lista)
    try { localStorage.setItem(CHAVE_SETS, JSON.stringify(lista)) } catch { /* ignora */ }
  }

  const gerar = async () => {
    if (!tema.trim() || loading) return
    setLoading(true); setErro(null)
    try {
      const obj = OBJETIVOS.find(o => o.v === objetivo)
      const prompt =
        "Sugira EXATAMENTE " + LIMITE + " hashtags em português para o Instagram de um médico clínico geral com foco em " + nicho + ".\n" +
        "TEMA DO POST: " + tema.trim() + "\nOBJETIVO: " + obj?.l + ", " + obj?.desc + "\n\n" +
        "REGRAS:\n" +
        "- O Instagram aceita no máximo " + LIMITE + " hashtags por post, então use exatamente " + LIMITE + ".\n" +
        "- Misture 1 ou 2 hashtags amplas, 2 ou 3 de porte médio e 1 de nicho.\n" +
        "- Evite genéricas demais, como #saude ou #medico.\n" +
        "- Não cite números de posts por hashtag, pois você não tem acesso a essa contagem.\n" +
        "- Não use hashtags que prometam resultado, cura ou emagrecimento garantido.\n\n" +
        'Retorne SOMENTE JSON: {"hashtags":[{"hashtag":"semcerquilha","motivo":"motivo em 1 frase","tipo":"nicho|alcance|engajamento|local"}]}'
      const json = await pedirJSON<{ hashtags?: unknown }>("/api/roteiros", prompt, 800)
      const lista = limparHashtags(json.hashtags)
      if (lista.length === 0) throw new Error("sem hashtags")
      setResultado(lista)
    } catch (e) {
      console.error("[hashtags] erro ao gerar:", e)
      setErro(mensagemErroIA(e, "A IA devolveu uma resposta inesperada. Tente novamente."))
    } finally { setLoading(false) }
  }

  const bloco = resultado.map(h => "#" + h.hashtag).join(" ")
  const jaSalvo = salvos.some(s => s.join(" ") === bloco)

  const salvarSet = () => {
    if (!resultado.length || jaSalvo) return
    gravarSets([resultado.map(h => "#" + h.hashtag), ...salvos].slice(0, 5))
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Análise de Hashtags" caption="Hashtags para o seu próximo post, no limite que o Instagram permite" />
      {showPautas && <PautasModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}

      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4 self-start">
          <Panel as="aside" className="space-y-4">
            <Field label="Tema do post" htmlFor="ht-tema">
              <textarea id="ht-tema" value={tema} onChange={e => setTema(e.target.value)} rows={3} placeholder="Ex: tireoide e ganho de peso" className={areaCls} />
            </Field>
            <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-px-ink">Nicho principal</p>
              <Segmented label="Nicho principal" value={nicho} onChange={setNicho} options={NICHOS.map(n => ({ value: n, label: n }))} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-px-ink">Objetivo</p>
              <Segmented label="Objetivo" value={objetivo} onChange={setObjetivo} options={OBJETIVOS.map(o => ({ value: o.v, label: o.l }))} />
              <p className="text-[12.5px] text-px-muted">{OBJETIVOS.find(o => o.v === objetivo)?.desc}</p>
            </div>
            <PxButton fullWidth onClick={gerar} loading={loading} disabled={!tema.trim()}>
              {loading ? "Gerando" : resultado.length ? "Gerar novamente" : "Gerar hashtags"}
            </PxButton>
          </Panel>

          {salvos.length > 0 && (
            <Panel as="aside" className="space-y-3">
              <h2 className="text-[15px] font-semibold text-px-ink">Sets salvos</h2>
              <p className="text-[12.5px] text-px-muted">Ficam guardados neste navegador, até 5.</p>
              <ul className="space-y-3">
                {salvos.map((set, i) => (
                  <li key={i} className="space-y-2 rounded-px-card border border-px-line bg-white/60 p-3">
                    <p className="text-[13px] leading-relaxed text-px-ink">{set.join(" ")}</p>
                    <div className="flex gap-2">
                      <CopyBtn text={set.join(" ")} label="Copiar set" />
                      <PxButton variant="quiet" size="sm" aria-label={`Remover set ${i + 1}`} onClick={() => gravarSets(salvos.filter((_, j) => j !== i))}>Remover</PxButton>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <p role="note" className="rounded-px-card bg-px-accent-soft px-4 py-3 text-[13.5px] leading-relaxed text-px-accent">
            Desde dezembro de 2025, o Instagram aceita no máximo 5 hashtags por post ou Reel. A plataforma recomenda poucas hashtags, bem direcionadas ao tema.
          </p>

          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Analisando hashtags</p>}

          {!resultado.length && !loading && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e gere as hashtags</p>
              <p className="mt-1 text-[13px] text-px-muted">Você recebe 5 sugestões, cada uma com o motivo da escolha.</p>
            </Panel>
          )}

          {!loading && resultado.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] text-px-muted">{resultado.length} hashtags para {nicho}</p>
                <div className="flex flex-wrap gap-2">
                  <PxButton variant="secondary" size="sm" leftIcon={Save} disabled={jaSalvo} onClick={salvarSet}>{jaSalvo ? "Set salvo" : "Salvar set"}</PxButton>
                  <CopyBtn text={bloco} label="Copiar todas" />
                  <PxButton variant="secondary" size="sm" leftIcon={RotateCcw} onClick={gerar}>Regerar</PxButton>
                </div>
              </div>

              <ol className="space-y-3">
                {resultado.map((h, i) => (
                  <li key={h.hashtag}>
                    <Panel as="article" className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="w-6 text-[15px] font-semibold tabular-nums text-px-muted">{i + 1}</span>
                      <div className="min-w-[200px] flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[18px] font-semibold text-px-ink">#{h.hashtag}</span>
                          <Tag tone="neutral">{h.tipo}</Tag>
                        </div>
                        {h.motivo && <p className="text-[13.5px] leading-snug text-px-muted">{h.motivo}</p>}
                      </div>
                      <CopyBtn text={"#" + h.hashtag} />
                    </Panel>
                  </li>
                ))}
              </ol>

              <Panel as="section" className="space-y-2">
                <h2 className="text-[15px] font-semibold text-px-ink">Bloco para colar na legenda</h2>
                <p className="text-[14px] leading-loose text-px-ink">{bloco}</p>
                <p className="text-[12.5px] text-px-muted">A IA sugere as hashtags pelo tema e não tem acesso ao número real de posts de cada uma. Confira o porte no Instagram antes de publicar.</p>
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
