"use client"

import { useState } from "react"
import { ScanFace, ClipboardList } from "lucide-react"
import { PautasPickerModal } from "@/components/PautasPickerModal"
import { Panel, PxButton, Field, PxInput, PageHeader } from "@/components/px"

interface RaioXResult {
  medos: string[]; desejos: string[]; objecoes: string[]
  linguagem: string[]; conteudos: string[]; gatilhos: string[]
}

const SECTIONS: { key: keyof RaioXResult; label: string; desc: string }[] = [
  { key: "medos",     label: "Medos",                   desc: "O que esse perfil teme em relação ao tema" },
  { key: "desejos",   label: "Desejos",                 desc: "O que espera conquistar" },
  { key: "objecoes",  label: "Objeções",                desc: "Resistências à consulta e ao tratamento" },
  { key: "linguagem", label: "Linguagem que usam",      desc: "Palavras e frases que o paciente costuma usar" },
  { key: "conteudos", label: "Conteúdos que convertem", desc: "Formatos que esse perfil consome e compartilha" },
  { key: "gatilhos",  label: "Gatilhos de decisão",     desc: "O que leva esse paciente a marcar consulta" },
]

export default function RaioXPage() {
  const [perfil, setPerfil] = useState("")
  const [tema, setTema] = useState("")
  const [resultado, setResultado] = useState<RaioXResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null)
  const [salvo, setSalvo] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const analisar = async () => {
    if (!perfil.trim() || !tema.trim()) { setErro("Preencha o perfil do paciente e a condição ou tema."); return }
    setErro(null); setAviso(null); setLoading(true); setResultado(null); setSalvo(false)
    try {
      const res = await fetch("/api/raio-x", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ perfil, tema }) })
      const data = await res.json().catch(() => null) as (Partial<RaioXResult> & { error?: string }) | null
      if (!res.ok || !data || data.error) throw new Error(data?.error || "falha")
      setResultado({
        medos: data.medos ?? [], desejos: data.desejos ?? [], objecoes: data.objecoes ?? [],
        linguagem: data.linguagem ?? [], conteudos: data.conteudos ?? [], gatilhos: data.gatilhos ?? [],
      })
    } catch (e) {
      console.error("[raio-x] erro ao analisar perfil:", e)
      setErro("Não foi possível analisar o perfil. Tente novamente em instantes.")
    } finally { setLoading(false) }
  }

  const salvarPautas = async () => {
    if (!resultado) return
    setSalvando(true); setAviso(null)
    const top = resultado.conteudos.slice(0, 5)
    let salvas = 0
    for (const c of top) {
      try {
        const r = await fetch("/api/pautas", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: c, categoria: "Estratégia de Conteúdo", nota: `Perfil: ${perfil} | Tema: ${tema}`,
            prioridade: "Alta", estagio: "Ideia", tags: ["raio-x", perfil.split(",")[0]?.trim().toLowerCase() ?? "perfil"],
          }),
        })
        if (r.ok) salvas++
      } catch (e) { console.error("[raio-x] erro ao salvar pauta:", e) }
    }
    setSalvando(false)
    if (salvas === top.length) { setSalvo(true); setAviso({ tipo: "ok", texto: `${salvas} pauta${salvas !== 1 ? "s" : ""} salva${salvas !== 1 ? "s" : ""} no Banco de Pautas.` }) }
    else setAviso({ tipo: "erro", texto: `${salvas} de ${top.length} pautas foram salvas. Tente de novo para as restantes.` })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Raio-X de Pacientes" caption="Hipóteses sobre o que o paciente pensa antes de marcar a consulta" />
      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Perfil do paciente" htmlFor="rx-perfil">
              <PxInput id="rx-perfil" value={perfil} onChange={e => setPerfil(e.target.value)} placeholder="Mulher, 48 anos, climatério, classe C" />
            </Field>
            <Field label="Condição ou tema" htmlFor="rx-tema">
              <PxInput id="rx-tema" value={tema} onChange={e => setTema(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !loading) analisar() }} placeholder="Reposição hormonal, emagrecimento, GLP-1" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PxButton leftIcon={ScanFace} onClick={analisar} loading={loading} disabled={!perfil.trim() || !tema.trim()}>{loading ? "Analisando" : resultado ? "Analisar de novo" : "Analisar paciente"}</PxButton>
            <PxButton variant="secondary" leftIcon={ClipboardList} onClick={() => setModalOpen(true)}>Usar uma pauta como tema</PxButton>
          </div>
          <p className="text-[12.5px] text-px-muted">O resultado são hipóteses geradas pela IA a partir do perfil descrito. Não vem de pesquisa com seus pacientes.</p>
        </Panel>

        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erro}</p>}
        {loading && <p role="status" className="py-20 text-center text-[14px] font-medium text-px-ink">Mapeando o perfil do paciente</p>}

        {!loading && !resultado && !erro && (
          <Panel className="py-14 text-center">
            <p className="text-[15px] font-semibold text-px-ink">Descreva o paciente e o tema</p>
            <p className="mx-auto mt-1 max-w-lg text-[13px] text-px-muted">Você recebe medos, desejos, objeções, linguagem, conteúdos e gatilhos de decisão para esse perfil.</p>
          </Panel>
        )}

        {!loading && resultado && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map(s => {
                const itens = resultado[s.key]
                return (
                  <Panel as="section" key={s.key} className="space-y-2">
                    <div>
                      <h2 className="text-[14px] font-semibold text-px-ink">{s.label}</h2>
                      <p className="text-[12.5px] text-px-muted">{s.desc}</p>
                    </div>
                    {itens.length === 0
                      ? <p className="text-[13px] text-px-muted">A IA não devolveu itens nesta seção.</p>
                      : <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-relaxed text-px-ink/85">{itens.map((it, i) => <li key={i}>{it}</li>)}</ul>}
                  </Panel>
                )
              })}
            </div>

            <Panel as="section" tone="strong" className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-[14px] font-semibold text-px-ink">Salvar conteúdos no Banco de Pautas</h2>
                <p className="mt-0.5 text-[13px] text-px-muted">Salva os 5 primeiros conteúdos sugeridos como pautas de prioridade Alta.</p>
                {aviso && <p role={aviso.tipo === "erro" ? "alert" : "status"} className={`mt-1.5 text-[13px] font-medium ${aviso.tipo === "erro" ? "text-px-danger" : "text-px-ok"}`}>{aviso.texto}</p>}
              </div>
              <PxButton onClick={salvarPautas} loading={salvando} disabled={salvo || resultado.conteudos.length === 0}>{salvo ? "Pautas salvas" : "Salvar 5 pautas"}</PxButton>
            </Panel>
          </>
        )}
      </div>
      {modalOpen && <PautasPickerModal onSelect={t => setTema(t)} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
