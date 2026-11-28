"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Sparkles, Pencil, Trash2, ExternalLink } from "lucide-react"
import { pedirJSON, mensagemErroIA } from "@/lib/ia-json"
import { Panel, PxButton, PxInput, PxSelect, Segmented, Field, Tag, PxModal, PageHeader, CopyButton } from "@/components/px"

const ESPECIALIDADES = ["Nutrologia", "Endocrinologia", "Longevidade", "Metabolismo", "Geral"]
const FREQUENCIAS = ["Diaria", "3x/semana", "2x/semana", "1x/semana", "Esporadica"]
const RELEVANCIAS = ["Alta", "Media", "Baixa"]
const ROTULO: Record<string, string> = { Media: "Média", Diaria: "Diária", Esporadica: "Esporádica", "-": "Não informada" }
const rotulo = (v: string) => ROTULO[v] ?? v

interface Referencia {
  id: string; nome: string; especialidade: string; instagram: string
  seguidores: string; frequencia: string; temas: string[]
  relevancia: string; nota: string; site?: string; criada_em: string
}
interface Form {
  id?: string; nome: string; instagram: string; seguidores: string; especialidade: string
  frequencia: string; relevancia: string; site: string; temas: string; nota: string
}
interface Leitura {
  temas_pouco_cobertos: string[]; oportunidades: string[]; diferencial: string; formatos: string[]; ganchos: string[]
}
interface Sugestao { nome: string; instagram: string; tema_principal: string; por_que_seguir: string; fonte: string }

const FORM_VAZIO: Form = { nome: "", instagram: "", seguidores: "", especialidade: "Endocrinologia", frequencia: "2x/semana", relevancia: "Media", site: "", temas: "", nota: "" }
const areaCls = "w-full resize-none rounded-px-ctl border border-px-line bg-white px-3.5 py-2.5 text-[13.5px] text-px-ink placeholder:text-px-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-px-ink/40"

/** Lê "150k", "1,2M", "150.000" ou "2 mil". Devolve 0 quando não há número. */
function lerSeguidores(s: string): number {
  const m = s.trim().toLowerCase().match(/^([\d.,]+)\s*(k|mil|m|mi)?\b/)
  if (!m) return 0
  const [, num, suf] = m
  if (!suf) return /^\d{1,3}([.,]\d{3})+$/.test(num) ? parseInt(num.replace(/[.,]/g, ""), 10) : Math.round(parseFloat(num.replace(",", ".")) || 0)
  const n = parseFloat(num.replace(",", ".")) || 0
  return Math.round(n * (suf === "k" || suf === "mil" ? 1e3 : 1e6))
}
function formatarTotal(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " milhões"
  if (n >= 1e3) return Math.round(n / 1e3) + " mil"
  return String(n)
}

const handleValido = (h: string) => /^@[A-Za-z0-9._]{1,30}$/.test(h)
const paraForm = (r: Referencia): Form => ({
  id: r.id, nome: r.nome, instagram: r.instagram === "-" ? "" : r.instagram, seguidores: r.seguidores === "-" ? "" : r.seguidores,
  especialidade: r.especialidade, frequencia: r.frequencia, relevancia: r.relevancia, site: r.site ?? "", temas: (r.temas ?? []).join(", "), nota: r.nota ?? "",
})

/** Monta o corpo da API e devolve o erro de validação, se houver. */
function prepararCorpo(f: Form): { erro: string } | { corpo: Record<string, unknown> } {
  if (!f.nome.trim()) return { erro: "Informe o nome." }
  let insta = f.instagram.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "").replace(/^@/, "")
  insta = insta ? "@" + insta : "-"
  if (insta !== "-" && !handleValido(insta)) return { erro: "Usuário do Instagram inválido. Use letras, números, ponto ou sublinhado." }
  const site = f.site.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "")
  if (/\s/.test(site)) return { erro: "O site não pode ter espaços." }
  return {
    corpo: {
      nome: f.nome.trim(), instagram: insta, seguidores: f.seguidores.trim() || "-", especialidade: f.especialidade, frequencia: f.frequencia,
      relevancia: f.relevancia, site, nota: f.nota.trim(), temas: f.temas.split(",").map(t => t.trim()).filter(Boolean),
    },
  }
}

// ── Cadastro e edição ──────────────────────────────────────────────────────────
function FormularioModal({ inicial, onClose, onSalvo }: { inicial: Form; onClose: () => void; onSalvo: () => void }) {
  const [f, setF] = useState<Form>(inicial)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }))

  async function salvar() {
    const prep = prepararCorpo(f)
    if ("erro" in prep) { setErro(prep.erro); return }
    setSaving(true); setErro(null)
    try {
      const res = await fetch("/api/referencias", {
        method: f.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f.id ? { id: f.id, ...prep.corpo } : prep.corpo),
      })
      if (!res.ok) throw new Error("HTTP " + res.status)
      onSalvo()
    } catch (e) {
      console.error("[referencias] erro ao salvar:", e)
      setErro("Não foi possível salvar. Tente novamente.")
    } finally { setSaving(false) }
  }

  return (
    <PxModal open onClose={onClose} title={f.id ? "Editar referência" : "Nova referência"} className="max-w-xl">
      <div className="space-y-3">
        <Field label="Nome do médico" htmlFor="rf-nome"><PxInput id="rf-nome" value={f.nome} onChange={set("nome")} maxLength={120} /></Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Instagram" htmlFor="rf-insta"><PxInput id="rf-insta" value={f.instagram} onChange={set("instagram")} placeholder="@usuario" maxLength={60} /></Field>
          <Field label="Seguidores" htmlFor="rf-seg" hint="Como você viu no perfil, por exemplo 150k."><PxInput id="rf-seg" value={f.seguidores} onChange={set("seguidores")} maxLength={20} /></Field>
          <Field label="Especialidade" htmlFor="rf-esp"><PxSelect id="rf-esp" value={f.especialidade} onChange={set("especialidade")}>{ESPECIALIDADES.map(n => <option key={n}>{n}</option>)}</PxSelect></Field>
          <Field label="Frequência de posts" htmlFor="rf-freq">
            <PxSelect id="rf-freq" value={f.frequencia} onChange={set("frequencia")}>
              {FREQUENCIAS.map(n => <option key={n} value={n}>{rotulo(n)}</option>)}
              {!FREQUENCIAS.includes(f.frequencia) && <option value={f.frequencia}>{rotulo(f.frequencia)}</option>}
            </PxSelect>
          </Field>
          <Field label="Relevância" htmlFor="rf-rel"><PxSelect id="rf-rel" value={f.relevancia} onChange={set("relevancia")}>{RELEVANCIAS.map(n => <option key={n} value={n}>{rotulo(n)}</option>)}</PxSelect></Field>
          <Field label="Site" htmlFor="rf-site"><PxInput id="rf-site" value={f.site} onChange={set("site")} placeholder="opcional" maxLength={200} /></Field>
        </div>
        <Field label="Temas frequentes" htmlFor="rf-temas" hint="Separe por vírgula. Quanto mais temas, mais útil a leitura estratégica."><PxInput id="rf-temas" value={f.temas} onChange={set("temas")} placeholder="insulina, tireoide, emagrecimento" /></Field>
        <Field label="Observações" htmlFor="rf-nota"><textarea id="rf-nota" rows={3} value={f.nota} onChange={set("nota")} maxLength={1000} className={areaCls} /></Field>
        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <PxButton variant="secondary" onClick={onClose}>Cancelar</PxButton>
          <PxButton onClick={salvar} loading={saving}>{f.id ? "Salvar alterações" : "Adicionar"}</PxButton>
        </div>
      </div>
    </PxModal>
  )
}

// ── Leitura estratégica (usa só os dados cadastrados) ──────────────────────────
function LeituraModal({ referencia, onClose }: { referencia: Referencia; onClose: () => void }) {
  const [leitura, setLeitura] = useState<Leitura | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true
    const prompt =
      "Você ajuda um médico clínico geral, com foco em endocrinologia e nutrologia, a se posicionar no Instagram.\n" +
      "Ele cadastrou uma referência: " + referencia.nome + " (" + referencia.instagram + "), especialidade " + referencia.especialidade +
      (referencia.temas?.length ? ", temas cadastrados: " + referencia.temas.join(", ") : ", sem temas cadastrados") +
      (referencia.nota ? ". Observação dele: " + referencia.nota : "") + ".\n\n" +
      "IMPORTANTE: você NÃO tem acesso ao perfil. Não descreva posicionamento, tom de voz, pontos fracos nem métricas dessa pessoa, e não invente nada sobre ela. " +
      "Use apenas os dados acima para sugerir como o médico usuário pode se diferenciar: temas da especialidade que não aparecem na lista cadastrada, oportunidades, um diferencial e ganchos próprios. " +
      "Nada de promessa de resultado nem dado inventado.\n\n" +
      'Retorne SOMENTE JSON: {"temas_pouco_cobertos":["até 4"],"oportunidades":["3"],"diferencial":"2 frases","formatos":["até 3"],"ganchos":["2 exemplos de gancho de abertura"]}'
    pedirJSON<Partial<Leitura>>("/api/roteiros", prompt, 1200)
      .then(j => {
        if (!ativo) return
        const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()) : [])
        const r: Leitura = { temas_pouco_cobertos: arr(j.temas_pouco_cobertos), oportunidades: arr(j.oportunidades), diferencial: typeof j.diferencial === "string" ? j.diferencial : "", formatos: arr(j.formatos), ganchos: arr(j.ganchos) }
        if (!r.oportunidades.length && !r.diferencial) throw new Error("resposta vazia")
        setLeitura(r)
      })
      .catch(e => { if (ativo) { console.error("[referencias] leitura:", e); setErro(mensagemErroIA(e, "A IA devolveu uma resposta inesperada. Tente novamente.")) } })
      .finally(() => { if (ativo) setLoading(false) })
    return () => { ativo = false }
  }, [referencia])

  const texto = leitura ? [
    "Leitura estratégica: " + referencia.nome + " (" + referencia.instagram + ")",
    "", "Temas pouco cobertos: " + leitura.temas_pouco_cobertos.join(", "),
    "", "Oportunidades:", ...leitura.oportunidades.map(o => "- " + o),
    "", "Diferencial: " + leitura.diferencial,
    "Formatos: " + leitura.formatos.join(", "),
    "", "Ganchos:", ...leitura.ganchos.map(g => "- " + g),
  ].join("\n") : ""

  const Bloco = ({ titulo, itens }: { titulo: string; itens: string[] }) => itens.length === 0 ? null : (
    <section className="space-y-1.5">
      <h3 className="text-[13px] font-semibold text-px-ink">{titulo}</h3>
      <ul className="list-disc space-y-1 pl-5 text-[13.5px] leading-snug text-px-ink">{itens.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </section>
  )

  return (
    <PxModal open onClose={onClose} title={"Leitura estratégica: " + referencia.nome} className="max-w-xl">
      <div className="space-y-4">
        <p className="rounded-px-card bg-px-accent-soft px-3 py-2 text-[12.5px] leading-relaxed text-px-accent">
          Esta leitura usa só os dados que você cadastrou sobre o perfil. A IA não acessa o Instagram, então não avalia o conteúdo real dele.
        </p>
        {loading && <p role="status" className="py-10 text-center text-[14px] font-medium text-px-ink">Elaborando a leitura</p>}
        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
        {leitura && (
          <>
            {leitura.diferencial && (
              <section className="space-y-1.5">
                <h3 className="text-[13px] font-semibold text-px-ink">Como se diferenciar</h3>
                <p className="text-[14px] leading-relaxed text-px-ink">{leitura.diferencial}</p>
              </section>
            )}
            <Bloco titulo="Temas pouco cobertos na lista cadastrada" itens={leitura.temas_pouco_cobertos} />
            <Bloco titulo="Oportunidades" itens={leitura.oportunidades} />
            <Bloco titulo="Formatos sugeridos" itens={leitura.formatos} />
            <Bloco titulo="Ganchos de exemplo" itens={leitura.ganchos} />
            <div className="flex justify-end"><CopyButton text={texto} label="Copiar leitura" /></div>
          </>
        )}
      </div>
    </PxModal>
  )
}

// ── Descoberta de perfis (pesquisa na web, com fonte) ──────────────────────────
function DescobrirModal({ onClose, onAdicionado }: { onClose: () => void; onAdicionado: () => void }) {
  const [esp, setEsp] = useState("Endocrinologia")
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [perfis, setPerfis] = useState<Sugestao[] | null>(null)
  const [adicionados, setAdicionados] = useState<string[]>([])
  const [adicionando, setAdicionando] = useState<string[]>([])
  const [erroAdd, setErroAdd] = useState<{ h: string; msg: string } | null>(null)

  async function buscar() {
    if (esp.trim().length < 3 || loading) return
    setLoading(true); setErro(null); setPerfis(null); setAdicionados([]); setErroAdd(null)
    try {
      const res = await fetch("/api/referencias/descobrir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ especialidade: esp.trim() }) })
      const data = await res.json().catch(() => ({})) as { perfis?: Sugestao[]; error?: string }
      if (!res.ok || !Array.isArray(data.perfis)) throw new Error(data.error || "HTTP " + res.status)
      setPerfis(data.perfis)
    } catch (e) {
      console.error("[referencias] descobrir:", e)
      setErro("Não foi possível buscar perfis agora. Tente novamente.")
    } finally { setLoading(false) }
  }

  async function adicionar(p: Sugestao) {
    if (adicionando.includes(p.instagram) || adicionados.includes(p.instagram)) return
    setAdicionando(prev => [...prev, p.instagram]); setErroAdd(null)
    try {
      const espCadastro = ESPECIALIDADES.find(n => n.toLowerCase() === esp.trim().toLowerCase()) ?? "Geral"
      const res = await fetch("/api/referencias", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: p.nome, instagram: p.instagram, seguidores: "-", especialidade: espCadastro, frequencia: "-", relevancia: "Media", temas: p.tema_principal ? [p.tema_principal] : [], nota: "Sugerido por pesquisa na web. Fonte: " + p.fonte, site: "" }),
      })
      if (!res.ok) throw new Error("HTTP " + res.status)
      setAdicionados(prev => [...prev, p.instagram]); onAdicionado()
    } catch (e) {
      console.error("[referencias] adicionar sugestão:", e)
      setErroAdd({ h: p.instagram, msg: "Não foi possível adicionar. Tente novamente." })
    } finally { setAdicionando(prev => prev.filter(x => x !== p.instagram)) }
  }

  return (
    <PxModal open onClose={onClose} title="Descobrir perfis" className="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <Field label="Especialidade" htmlFor="ds-esp" className="flex-1">
            <PxInput id="ds-esp" value={esp} onChange={e => setEsp(e.target.value)} onKeyDown={e => { if (e.key === "Enter") buscar() }} maxLength={80} />
          </Field>
          <PxButton onClick={buscar} loading={loading} disabled={esp.trim().length < 3} leftIcon={Search}>{loading ? "Buscando" : "Buscar"}</PxButton>
        </div>
        <p className="text-[12.5px] text-px-muted">A busca usa a web e só mostra perfis com uma página de origem. Abra a fonte e confirme o perfil antes de adicionar.</p>
        {loading && <p role="status" className="py-8 text-center text-[14px] font-medium text-px-ink">Pesquisando perfis</p>}
        {erro && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger">{erro}</p>}
        {perfis && perfis.length === 0 && <p className="py-6 text-center text-[13px] text-px-muted">Nenhum perfil com fonte confiável foi encontrado. Tente outra especialidade.</p>}
        {perfis && perfis.length > 0 && (
          <ul className="space-y-3">
            {perfis.map(p => (
              <li key={p.instagram} className="space-y-2 rounded-px-card border border-px-line bg-white/60 p-3.5">
                <div>
                  <p className="text-[14px] font-semibold text-px-ink">{p.nome}</p>
                  <p className="text-[12.5px] text-px-muted">{p.instagram}</p>
                </div>
                {p.tema_principal && <p className="text-[13px] text-px-ink"><span className="text-px-muted">Tema: </span>{p.tema_principal}</p>}
                {p.por_que_seguir && <p className="text-[13px] text-px-ink"><span className="text-px-muted">Por que acompanhar: </span>{p.por_que_seguir}</p>}
                <a href={p.fonte} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12.5px] text-px-accent underline underline-offset-2">Fonte <ExternalLink className="h-3 w-3" aria-hidden /></a>
                {erroAdd?.h === p.instagram && <p role="alert" className="rounded-px-card bg-px-danger-soft px-3 py-2 text-[12.5px] text-px-danger">{erroAdd.msg}</p>}
                <div>
                  <PxButton size="sm" variant={adicionados.includes(p.instagram) ? "secondary" : "primary"} leftIcon={Plus} loading={adicionando.includes(p.instagram)} disabled={adicionados.includes(p.instagram)} onClick={() => adicionar(p)}>
                    {adicionados.includes(p.instagram) ? "Adicionado" : "Adicionar às referências"}
                  </PxButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PxModal>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────
export default function ReferenciasPage() {
  const [refs, setRefs] = useState<Referencia[]>([])
  const [loading, setLoading] = useState(true)
  const [erroLista, setErroLista] = useState(false)
  const [busca, setBusca] = useState("")
  const [filtroEsp, setFiltroEsp] = useState("Todos")
  const [filtroRel, setFiltroRel] = useState("Todas")
  const [form, setForm] = useState<Form | null>(null)
  const [leituraRef, setLeituraRef] = useState<Referencia | null>(null)
  const [descobrir, setDescobrir] = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErroLista(false)
    try {
      const res = await fetch("/api/referencias")
      const data = await res.json().catch(() => null)
      if (!res.ok || !Array.isArray(data)) throw new Error("HTTP " + res.status)
      setRefs(data)
    } catch (e) {
      console.error("[referencias] erro ao carregar:", e)
      setErroLista(true)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function remover(id: string) {
    setRemovendo(id); setErroAcao(null)
    try {
      const res = await fetch("/api/referencias", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error("HTTP " + res.status)
      setRefs(prev => prev.filter(r => r.id !== id)); setConfirmando(null)
    } catch (e) {
      console.error("[referencias] erro ao remover:", e)
      setErroAcao("Não foi possível remover. Tente novamente.")
    } finally { setRemovendo(null) }
  }

  const termo = busca.trim().toLowerCase()
  const ordem: Record<string, number> = { Alta: 0, Media: 1, Baixa: 2 }
  const filtradas = refs
    .filter(r => (filtroEsp === "Todos" || r.especialidade === filtroEsp) && (filtroRel === "Todas" || r.relevancia === filtroRel)
      && (!termo || r.nome.toLowerCase().includes(termo) || r.instagram.toLowerCase().includes(termo) || (r.temas ?? []).some(t => t.toLowerCase().includes(termo))))
    .sort((a, b) => (ordem[a.relevancia] ?? 2) - (ordem[b.relevancia] ?? 2) || a.nome.localeCompare(b.nome, "pt-BR"))

  const total = refs.reduce((s, r) => s + lerSeguidores(r.seguidores ?? ""), 0)
  const resumo = refs.length === 0 ? "" :
    refs.length + (refs.length === 1 ? " perfil" : " perfis") + ", " + refs.filter(r => r.relevancia === "Alta").length + " de alta relevância" +
    (total > 0 ? ", " + formatarTotal(total) + " de seguidores somados (valores informados por você)" : "")

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Monitor de Referências"
        caption={resumo || "Médicos que você acompanha no seu nicho"}
        actions={
          <div className="flex flex-wrap gap-2">
            <PxButton variant="secondary" size="sm" leftIcon={Sparkles} onClick={() => setDescobrir(true)}>Descobrir perfis</PxButton>
            <PxButton size="sm" leftIcon={Plus} onClick={() => setForm(FORM_VAZIO)}>Adicionar</PxButton>
          </div>
        }
      />
      {form && <FormularioModal inicial={form} onClose={() => setForm(null)} onSalvo={() => { setForm(null); carregar() }} />}
      {leituraRef && <LeituraModal referencia={leituraRef} onClose={() => setLeituraRef(null)} />}
      {descobrir && <DescobrirModal onClose={() => setDescobrir(false)} onAdicionado={carregar} />}

      <div className="space-y-4 px-4 pb-10 md:px-10">
        <Panel as="section" className="space-y-3">
          <Field label="Buscar" htmlFor="rf-busca">
            <PxInput id="rf-busca" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, @instagram ou tema" />
          </Field>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-px-ink">Especialidade</p>
              <Segmented label="Especialidade" value={filtroEsp} onChange={setFiltroEsp} options={["Todos", ...ESPECIALIDADES].map(n => ({ value: n, label: n }))} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-px-ink">Relevância</p>
              <Segmented label="Relevância" value={filtroRel} onChange={setFiltroRel} options={["Todas", ...RELEVANCIAS].map(n => ({ value: n, label: rotulo(n) }))} />
            </div>
          </div>
        </Panel>

        {erroAcao && <p role="alert" className="rounded-px-card bg-px-danger-soft px-4 py-3 text-[13px] text-px-danger">{erroAcao}</p>}
        {loading && <p role="status" className="py-16 text-center text-[13px] text-px-muted">Carregando referências</p>}
        {!loading && erroLista && (
          <Panel className="py-12 text-center">
            <p role="alert" className="text-[14px] font-semibold text-px-ink">Não foi possível carregar as referências</p>
            <div className="mt-3"><PxButton variant="secondary" size="sm" onClick={carregar}>Tentar de novo</PxButton></div>
          </Panel>
        )}
        {!loading && !erroLista && filtradas.length === 0 && (
          <Panel className="py-14 text-center">
            <p className="text-[15px] font-semibold text-px-ink">{refs.length === 0 ? "Nenhuma referência cadastrada" : "Nenhuma referência com esses filtros"}</p>
            <p className="mt-1 text-[13px] text-px-muted">{refs.length === 0 ? "Adicione os médicos que você acompanha ou use Descobrir perfis." : "Mude a busca ou os filtros acima."}</p>
          </Panel>
        )}

        {!loading && !erroLista && filtradas.length > 0 && (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtradas.map(r => {
              const temInsta = handleValido(r.instagram)
              return (
                <li key={r.id}>
                  <Panel as="article" className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-px-ink/5 text-[13px] font-semibold text-px-ink">
                          {r.nome.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-[14px] font-semibold text-px-ink">{r.nome}</h2>
                          <p className="truncate text-[12.5px] text-px-muted">{temInsta ? r.instagram : "Instagram não informado"}</p>
                        </div>
                      </div>
                      <Tag tone={r.relevancia === "Alta" ? "ink" : "neutral"}>Relevância {rotulo(r.relevancia).toLowerCase()}</Tag>
                    </div>

                    <dl className="grid grid-cols-3 gap-2 text-[12.5px]">
                      {[["Especialidade", r.especialidade], ["Seguidores", r.seguidores === "-" ? "Não informado" : r.seguidores], ["Frequência", rotulo(r.frequencia)]].map(([k, v]) => (
                        <div key={k} className="rounded-px-ctl bg-px-ink/[0.03] px-2.5 py-2">
                          <dt className="text-px-muted">{k}</dt>
                          <dd className="font-medium text-px-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    {r.temas?.length > 0 && <div className="flex flex-wrap gap-1.5">{r.temas.map(t => <Tag key={t} tone="neutral">{t}</Tag>)}</div>}
                    {r.nota && <p className="flex-1 text-[13px] leading-relaxed text-px-ink">{r.nota}</p>}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-px-line pt-3 text-[12.5px]">
                      {temInsta && <a href={"https://instagram.com/" + r.instagram.slice(1)} target="_blank" rel="noopener noreferrer" className="text-px-accent underline underline-offset-2">Ver perfil</a>}
                      {r.site && <a href={"https://" + r.site.replace(/^https?:\/\//i, "")} target="_blank" rel="noopener noreferrer" className="text-px-accent underline underline-offset-2">{r.site.replace(/^https?:\/\//i, "")}</a>}
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <PxButton variant="secondary" size="sm" leftIcon={Search} onClick={() => setLeituraRef(r)}>Leitura estratégica</PxButton>
                        <PxButton variant="quiet" size="sm" leftIcon={Pencil} aria-label={"Editar " + r.nome} onClick={() => setForm(paraForm(r))}>Editar</PxButton>
                        {confirmando === r.id ? (
                          <>
                            <PxButton variant="danger" size="sm" loading={removendo === r.id} onClick={() => remover(r.id)}>Confirmar remoção</PxButton>
                            <PxButton variant="quiet" size="sm" onClick={() => setConfirmando(null)}>Cancelar</PxButton>
                          </>
                        ) : (
                          <PxButton variant="quiet" size="sm" leftIcon={Trash2} aria-label={"Remover " + r.nome} onClick={() => { setConfirmando(r.id); setErroAcao(null) }}>Remover</PxButton>
                        )}
                      </div>
                    </div>
                  </Panel>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
