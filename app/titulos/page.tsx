'use client'

import { useState } from "react"
import { Copy, Check, ClipboardList } from "lucide-react"
import { PautasModal } from "@/components/PautasModal"
import { pedirJSON, mensagemErroIA } from "@/lib/ia-json"
import { Panel, PxButton, Segmented, Field, Tag, PageHeader } from "@/components/px"

const FORMATOS = ["Reel", "Carrossel", "Feed", "Stories"]
const OBJETIVOS = [
  { v: "curiosidade", l: "Curiosidade" },
  { v: "autoridade",  l: "Autoridade" },
  { v: "urgencia",    l: "Urgência" },
  { v: "pergunta",    l: "Pergunta" },
  { v: "choque",      l: "Dado chocante" },
]

interface Titulo { texto: string; tipo: string }

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function CopyBtn({ text }: { text: string }) {
  const [estado, setEstado] = useState<"" | "ok" | "erro">("")
  async function copiar() {
    try { await navigator.clipboard.writeText(text); setEstado("ok") } catch { setEstado("erro") }
    setTimeout(() => setEstado(""), 1800)
  }
  return (
    <PxButton variant="secondary" size="sm" leftIcon={estado === "ok" ? Check : Copy} onClick={copiar}>
      {estado === "ok" ? "Copiado" : estado === "erro" ? "Não foi possível copiar" : "Copiar"}
    </PxButton>
  )
}

export default function TitulosPage() {
  const [tema, setTema] = useState("")
  const [formato, setFormato] = useState("Reel")
  const [objetivo, setObjetivo] = useState("curiosidade")
  const [titulos, setTitulos] = useState<Titulo[]>([])
  const [loading, setLoading] = useState(false)
  const [showPautas, setShowPautas] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const gerar = async () => {
    if (!tema.trim()) return
    setLoading(true); setErro(null)
    try {
      const obj = OBJETIVOS.find(o => o.v === objetivo)
      const prompt =
        "Crie 10 títulos/headlines para um post de " + formato + " do médico usuário — Clínico-Geral, Endocrinologia e Nutrologia.\n" +
        "TEMA: " + tema + "\nOBJETIVO: " + obj?.l + "\n" +
        "REGRAS: diretos, sem enrolação, máx 12 palavras cada, sem clichês de IA.\n" +
        'Retorne SOMENTE JSON: {"titulos":[{"texto":"...","tipo":"' + obj?.l + '"}]}'
      const json = await pedirJSON<{ titulos?: Titulo[] }>("/api/titulos", prompt, 1000)
      if (!Array.isArray(json.titulos)) throw new Error("sem titulos")
      setTitulos(json.titulos)
    } catch (e) {
      console.error("[titulos] erro ao gerar:", e)
      setErro(mensagemErroIA(e, "A IA devolveu uma resposta inesperada. Tente novamente."))
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Gerador de Títulos" caption="Títulos com mais potencial de clique para vídeos e posts" />
      {showPautas && <PautasModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}

      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[300px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema" htmlFor="tt-tema">
            <textarea id="tt-tema" value={tema} onChange={e => setTema(e.target.value)} rows={3} placeholder="Resistência à insulina em pessoas magras" className={areaCls} />
          </Field>
          <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Formato</p>
            <Segmented label="Formato" value={formato} onChange={setFormato} options={FORMATOS.map(f => ({ value: f, label: f }))} />
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Objetivo</p>
            <Segmented label="Objetivo" value={objetivo} onChange={setObjetivo} options={OBJETIVOS.map(o => ({ value: o.v, label: o.l }))} />
          </div>
          <PxButton fullWidth onClick={gerar} loading={loading} disabled={!tema.trim()}>{loading ? "Gerando" : titulos.length ? "Gerar novamente" : "Gerar títulos"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Criando os títulos</p>}

          {!titulos.length && !loading && (
            <Panel className="py-16 text-center">
              <p className="text-[15px] font-semibold text-px-ink">Defina o tema e gere os títulos</p>
              <p className="mt-1 text-[13px] text-px-muted">Você recebe 10 opções no objetivo escolhido.</p>
            </Panel>
          )}

          {!loading && titulos.length > 0 && (
            <>
              <p className="text-[13px] text-px-muted">{titulos.length} títulos para {formato}</p>
              <ol className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {titulos.map((t, i) => (
                  <li key={i}>
                    <Panel as="article" className="flex h-full flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-semibold text-px-muted">{String(i + 1).padStart(2, "0")}</span>
                        <Tag tone="neutral">{t.tipo}</Tag>
                      </div>
                      <p className="flex-1 text-[15px] font-semibold leading-relaxed text-px-ink">{t.texto}</p>
                      <div className="flex justify-end"><CopyBtn text={t.texto} /></div>
                    </Panel>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
