'use client'

import { useState } from "react"
import { Star, ClipboardList } from "lucide-react"
import { PautasModal } from "@/components/PautasModal"
import { pedirJSON, mensagemErroIA } from "@/lib/ia-json"
import { Panel, PxButton, Segmented, Field, Tag, PageHeader, CopyButton } from "@/components/px"

const TIPOS = [
  { v: "dado",       l: "Dado Chocante",      ex: "X% das pessoas que fazem dieta..." },
  { v: "pergunta",   l: "Pergunta",           ex: "Por que médicos nunca te contam isso?" },
  { v: "polemico",   l: "Afirmação Polêmica", ex: "Dieta não emagrece. Ponto final." },
  { v: "segredo",    l: "Segredo Revelado",   ex: "O que a indústria não quer que você saiba..." },
  { v: "contra",     l: "Contra-intuitivo",   ex: "Comer mais pode te fazer emagrecer." },
  { v: "autoridade", l: "Autoridade",         ex: "Depois de anos atendendo, aprendi..." },
]
const FORMATOS = ["Reel", "Carrossel", "Feed", "Stories"]
const IMPACTO: Record<string, string> = { viral: "Viral", conversao: "Conversão", educativo: "Educativo", vendas: "Vendas" }

interface Gancho { texto: string; tipo: string; impacto?: string }

// Modelos de estrutura exibidos antes da primeira geração. Sem números de estudo: servem só de referência de formato.
const BIBLIOTECA_FIXA: Gancho[] = [
  { texto: "A maioria das pessoas que faz dieta recupera o peso perdido. Isso não é falta de vontade.", tipo: "Dado Chocante", impacto: "viral" },
  { texto: "O que a balança mostra não é o que importa. Te explico por quê.", tipo: "Contra-intuitivo", impacto: "educativo" },
  { texto: "Médico, te faço uma pergunta: você trata o sintoma ou a causa?", tipo: "Pergunta", impacto: "conversao" },
  { texto: "Depois de anos atendendo pacientes com obesidade, aprendi uma coisa:", tipo: "Autoridade", impacto: "educativo" },
  { texto: "Parar de comer não emagrece. E eu posso explicar o porquê.", tipo: "Afirmação Polêmica", impacto: "viral" },
  { texto: "Tem uma informação sobre tireoide que muita gente nunca ouviu no consultório.", tipo: "Segredo Revelado", impacto: "educativo" },
  { texto: "O exame voltou normal. O paciente continua com todos os sintomas. Por quê?", tipo: "Pergunta", impacto: "conversao" },
  { texto: "Insulina alta em jejum com glicose normal: o sinal que quase ninguém procura.", tipo: "Dado Chocante", impacto: "educativo" },
]

const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

function CartaoGancho({ g, fav, onFav }: { g: Gancho; fav: boolean; onFav: () => void }) {
  return (
    <Panel as="article" className="flex items-start gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="neutral">{g.tipo}</Tag>
          {g.impacto && IMPACTO[g.impacto] && <Tag tone="accent">{IMPACTO[g.impacto]}</Tag>}
        </div>
        <p className="text-[15px] italic leading-relaxed text-px-ink">&ldquo;{g.texto}&rdquo;</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <CopyButton text={g.texto} iconOnly />
        <PxButton variant={fav ? "primary" : "secondary"} size="sm" leftIcon={Star} onClick={onFav} aria-label={fav ? "Remover dos favoritos" : "Salvar nos favoritos"} />
      </div>
    </Panel>
  )
}

export default function GanchosPage() {
  const [tema, setTema] = useState("")
  const [tipos, setTipos] = useState<string[]>(["dado", "pergunta", "polemico"])
  const [formato, setFormato] = useState("Reel")
  const [ganchos, setGanchos] = useState<Gancho[]>(BIBLIOTECA_FIXA)
  const [gerado, setGerado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [favoritos, setFavoritos] = useState<Gancho[]>([])
  const [showPautas, setShowPautas] = useState(false)
  const [aba, setAba] = useState<"gerar" | "favoritos">("gerar")
  const [erro, setErro] = useState<string | null>(null)

  const toggleTipo = (v: string) => setTipos(prev => prev.includes(v) ? prev.filter(t => t !== v) : [...prev, v])
  const isFav = (g: Gancho) => favoritos.some(f => f.texto === g.texto)
  const toggleFav = (g: Gancho) => setFavoritos(prev => isFav(g) ? prev.filter(f => f.texto !== g.texto) : [g, ...prev])

  const gerar = async () => {
    if (!tema.trim() || !tipos.length) return
    setLoading(true); setErro(null)
    try {
      const tiposLabel = tipos.map(v => TIPOS.find(t => t.v === v)?.l).filter(Boolean).join(", ")
      const prompt =
        "Crie 8 ganchos de abertura para " + formato + " do médico usuário — Clínico-Geral, Endocrinologia e Nutrologia.\n" +
        "TEMA: " + tema + "\nTIPOS DE GANCHO: " + tiposLabel + "\n\n" +
        "REGRAS:\n" +
        "- Máx 2 frases por gancho — para o dedo no scroll em 3 segundos\n" +
        "- Tom: médico que fala como amigo, direto, sem academicismo\n" +
        '- Proibido: "Você sabia que", "Neste vídeo", "Hoje vou falar"\n' +
        "- Não invente números, percentuais nem estudos\n" +
        "- Distribua os tipos solicitados entre os 8 ganchos\n" +
        '- Para cada gancho, classifique o campo "impacto" com UM dos valores: viral | conversao | educativo | vendas\n' +
        "  viral=alto potencial de compartilhamento/provocação, conversao=leva ao agendamento/ação, educativo=ensina/conscientiza, vendas=oferta direta\n\n" +
        'Retorne SOMENTE JSON: {"ganchos":[{"texto":"...","tipo":"nome do tipo","impacto":"viral|conversao|educativo|vendas"}]}'
      const json = await pedirJSON<{ ganchos?: Gancho[] }>("/api/ganchos", prompt, 1200)
      if (!Array.isArray(json.ganchos)) throw new Error("sem ganchos")
      setGanchos(json.ganchos.map(g => ({ texto: g.texto, tipo: g.tipo, impacto: g.impacto })))
      setGerado(true); setAba("gerar")
    } catch (e) {
      console.error("[ganchos] erro ao gerar:", e)
      setErro(mensagemErroIA(e, "A IA devolveu uma resposta inesperada. Tente novamente."))
    } finally { setLoading(false) }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Biblioteca de Ganchos" caption="Aberturas que seguram o dedo no scroll" />
      {showPautas && <PautasModal onSelect={t => setTema(t)} onClose={() => setShowPautas(false)} />}

      <div className="grid grid-cols-1 gap-4 px-4 pb-10 md:px-10 lg:grid-cols-[320px_1fr]">
        <Panel as="aside" className="space-y-4 self-start">
          <Field label="Tema" htmlFor="gc-tema">
            <textarea id="gc-tema" value={tema} onChange={e => setTema(e.target.value)} rows={3} placeholder="Resistência à insulina" className={areaCls} />
          </Field>
          <PxButton variant="secondary" size="sm" leftIcon={ClipboardList} onClick={() => setShowPautas(true)}>Usar uma pauta do banco</PxButton>
          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-px-ink">Formato</p>
            <Segmented label="Formato" value={formato} onChange={setFormato} options={FORMATOS.map(f => ({ value: f, label: f }))} />
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-px-ink">Tipos de gancho <span className="font-normal text-px-muted">(escolha ao menos um)</span></p>
            <div role="group" aria-label="Tipos de gancho" className="flex flex-col gap-1.5">
              {TIPOS.map(t => {
                const ativo = tipos.includes(t.v)
                return (
                  <button key={t.v} type="button" aria-pressed={ativo} onClick={() => toggleTipo(t.v)}
                    className={`rounded-px-card border p-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-px-ink/40 ${ativo ? "border-px-ink bg-px-ink text-white" : "border-px-ink/15 bg-white text-px-ink hover:border-px-ink/40"}`}>
                    <span className="block text-[13.5px] font-semibold">{t.l}</span>
                    <span className={`block text-[12px] italic ${ativo ? "text-white/75" : "text-px-muted"}`}>{t.ex}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <PxButton fullWidth onClick={gerar} loading={loading} disabled={!tema.trim() || !tipos.length}>{loading ? "Gerando" : gerado ? "Gerar novos ganchos" : "Gerar ganchos"}</PxButton>
        </Panel>

        <div className="min-w-0 space-y-4">
          {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
          <Segmented label="Lista" value={aba} onChange={setAba}
            options={[{ value: "gerar", label: gerado ? "Ganchos gerados" : "Modelos" }, { value: "favoritos", label: `Favoritos (${favoritos.length})` }]} />

          {loading && <p role="status" className="py-24 text-center text-[14px] font-medium text-px-ink">Criando os ganchos</p>}

          {!loading && aba === "gerar" && (
            <>
              {!gerado && <p className="text-[13px] text-px-muted">Modelos de estrutura para referência. Informe o tema e gere ganchos sob medida.</p>}
              <ul className="space-y-3">
                {ganchos.map(g => <li key={g.texto}><CartaoGancho g={g} fav={isFav(g)} onFav={() => toggleFav(g)} /></li>)}
              </ul>
            </>
          )}

          {!loading && aba === "favoritos" && (
            favoritos.length === 0
              ? <Panel className="py-14 text-center"><p className="text-[15px] font-semibold text-px-ink">Nenhum favorito ainda</p><p className="mt-1 text-[13px] text-px-muted">Use a estrela em um gancho para guardá-lo aqui. A lista vale só enquanto a página estiver aberta.</p></Panel>
              : <ul className="space-y-3">{favoritos.map(g => <li key={g.texto}><CartaoGancho g={g} fav onFav={() => toggleFav(g)} /></li>)}</ul>
          )}
        </div>
      </div>
    </div>
  )
}
