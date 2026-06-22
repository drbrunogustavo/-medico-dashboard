"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { StatCard } from "@/components/StatCard"
import { Plus, Users, TrendingUp, Eye, Star, ExternalLink, Search, Instagram, Globe, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NICHOS    = ["Todos","Nutrologia","Endocrinologia","Longevidade","Metabolismo","Geral"]
const RELEVANCIA = ["Todas","Alta","Media","Baixa"]

interface Referencia {
  id: string; nome: string; especialidade: string; instagram: string
  seguidores: string; frequencia: string; temas: string[]
  relevancia: string; nota: string; site?: string; criada_em: string
}

interface AnaliseResult {
  perfil:        { nome:string; handle:string; especialidade:string; posicionamento:string; tom:string; frequencia:string; formatos:string[] }
  temas:         { principal:string; secundarios:string[]; gaps:string[] }
  pontos_fortes: string[]
  pontos_fracos: string[]
  oportunidades: string[]
  estrategia:    { diferencial:string; temas_atacar:string[]; formatos_rec:string[]; gancho:string }
  score:         { conteudo:number; consistencia:number; engajamento:number; nicho:number }
}

const RELEVANCIA_STYLES: Record<string,string> = {
  "Alta": "bg-red-50 border-red-300 text-red-600",
  "Media":"bg-amber-50 border-amber-300 text-amber-600",
  "Baixa":"bg-green-50 border-green-300 text-green-700",
}
const FREQ_STYLES: Record<string,string> = {
  "Diaria":"text-emerald-400","3x/semana":"text-blue-400",
  "2x/semana":"text-blue-400","1x/semana":"text-amber-400","Esporadica":"text-text-muted",
}

// ── Análise Modal ──────────────────────────────────────────────────────────────
function ScoreBar({ label, value }: { label:string; value:number }) {
  const color = value >= 7 ? '#16a34a' : value >= 5 ? 'var(--accent)' : '#dc2626'
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:2, textTransform:'uppercase' as const }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:900, color }}>{value}/10</span>
      </div>
      <div style={{ height:5, borderRadius:3, background:'var(--border)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:(value*10)+'%', borderRadius:3, background:color }} />
      </div>
    </div>
  )
}

function ATag({ text, color='var(--accent)' }: { text:string; color?:string }) {
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, color, background:'var(--surface-2)', border:`1px solid ${color}`, display:'inline-block', margin:'2px 3px 2px 0' }}>
      {text}
    </span>
  )
}

function ASection({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, padding:'16px 20px', marginBottom:12 }}>
      <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:12 }}>{title}</div>
      {children}
    </div>
  )
}

function AnaliseModal({ referencia, onClose }: { referencia: Referencia; onClose: () => void }) {
  const [resultado, setResultado] = useState<AnaliseResult|null>(null)
  const [loading,   setLoading]   = useState(true)
  const [erro,      setErro]      = useState('')
  const [copied,    setCopied]    = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        const handle = referencia.instagram.replace('@','')
        console.log('[AnaliseModal] iniciando análise para:', handle)

        const prompt =
          'Você é estrategista de conteúdo médico. Analise o perfil @' + handle +
          ' (especialidade: ' + referencia.especialidade + (referencia.temas?.length ? ', temas conhecidos: ' + referencia.temas.join(', ') : '') + ')' +
          ' do ponto de vista do médico usuário.\n\n' +
          'Gere análise estratégica completa. Se não conhecer o perfil, baseie-se em perfis típicos desta especialidade.\n\n' +
          'Retorne SOMENTE JSON válido, sem nenhum texto antes ou depois:\n' +
          '{"perfil":{"nome":"nome ou estimado","handle":"@' + handle + '","especialidade":"' + referencia.especialidade + '","posicionamento":"como se posiciona","tom":"tom de voz","frequencia":"frequência estimada","formatos":["Reels","Carrossel"]},' +
          '"temas":{"principal":"tema dominante","secundarios":["tema2","tema3"],"gaps":["gap1","gap2"]},' +
          '"pontos_fortes":["forte1","forte2","forte3"],' +
          '"pontos_fracos":["fraco1","fraco2"],' +
          '"oportunidades":["oportunidade para o médico 1","oportunidade 2","oportunidade 3"],' +
          '"estrategia":{"diferencial":"como o médico se diferencia em 2 frases","temas_atacar":["tema1"],"formatos_rec":["formato1"],"gancho":"exemplo de gancho para competir"},' +
          '"score":{"conteudo":7,"consistencia":6,"engajamento":7,"nicho":7}}'

        console.log('[AnaliseModal] chamando /api/roteiros...')
        const res = await fetch('/api/roteiros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model:      'claude-sonnet-4-6',
            max_tokens: 2000,
            messages:   [{ role: 'user', content: prompt }],
          }),
        })

        console.log('[AnaliseModal] status HTTP:', res.status)
        if (!res.ok) throw new Error(`HTTP ${res.status} — verifique autenticação e ANTHROPIC_API_KEY.`)

        const data = await res.json()
        console.log('[AnaliseModal] data.type:', data.type, '| content[0].type:', data.content?.[0]?.type)

        if (data.error) throw new Error(`API error: ${JSON.stringify(data.error)}`)
        if (data.type === 'error') throw new Error(`Anthropic error: ${data.error?.message ?? JSON.stringify(data)}`)

        const text  = data.content?.[0]?.text
        if (!text) throw new Error(`Resposta sem texto. content: ${JSON.stringify(data.content)}`)

        console.log('[AnaliseModal] texto recebido (primeiros 200 chars):', text.slice(0, 200))

        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const idx   = clean.indexOf('{')
        const end   = clean.lastIndexOf('}')
        if (idx === -1 || end === -1) throw new Error(`JSON não encontrado na resposta: ${clean.slice(0, 100)}`)

        const jsonStr = clean.slice(idx, end + 1)
        const json    = JSON.parse(jsonStr) as AnaliseResult

        if (!json.perfil) throw new Error(`Campo "perfil" ausente. Chaves: ${Object.keys(json).join(', ')}`)

        console.log('[AnaliseModal] análise concluída com sucesso')
        setResultado(json)
      } catch(e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[AnaliseModal] ERRO:', e)
        setErro(msg)
      }
      setLoading(false)
    }
    run()
  }, [referencia])

  const relatorio = resultado ? [
    '=== ANÁLISE: ' + referencia.instagram + ' ===',
    'Posicionamento: ' + resultado.perfil.posicionamento,
    'Tom: ' + resultado.perfil.tom + ' | Frequência: ' + resultado.perfil.frequencia,
    '\nTEMAS',
    'Principal: ' + resultado.temas.principal,
    'Secundários: ' + resultado.temas.secundarios.join(', '),
    'Gaps: ' + resultado.temas.gaps.join(', '),
    '\nFORTES: ' + resultado.pontos_fortes.join(' | '),
    'FRACOS: ' + resultado.pontos_fracos.join(' | '),
    '\nOPORTUNIDADES PARA VOCÊ',
    ...resultado.oportunidades.map(o=>'→ '+o),
    '\nESTRATÉGIA',
    'Diferencial: ' + resultado.estrategia.diferencial,
    'Temas: ' + resultado.estrategia.temas_atacar.join(', '),
    'Gancho: ' + resultado.estrategia.gancho,
  ].join('\n') : ''

  const copy = () => {
    navigator.clipboard.writeText(relatorio)
    setCopied(true); setTimeout(()=>setCopied(false),1600)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, width:'calc(100% - 32px)', maxWidth:680, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.15)' }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ color:'var(--text-muted)', fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase' as const, marginBottom:4 }}>Análise Estratégica</div>
            <div style={{ color:'var(--accent)', fontSize:17, fontWeight:900 }}>{referencia.instagram}</div>
            <div style={{ color:'var(--text-secondary)', fontSize:11, marginTop:2 }}>{referencia.nome} · {referencia.especialidade}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {resultado && (
              <button onClick={copy} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid rgba(200,168,76,0.3)', background:copied?'rgba(200,168,76,0.12)':'none', color:copied?'var(--accent)':'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                {copied?'✓ Copiado':'⎘ Exportar'}
              </button>
            )}
            <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:22, cursor:'pointer', padding:'4px 8px', lineHeight:1 }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:16 }}>
              <div style={{ width:40, height:40, border:'3px solid rgba(200,168,76,0.2)', borderTop:'3px solid #C9A84C', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ color:'var(--accent)', fontSize:12, fontWeight:700, letterSpacing:2 }}>ANALISANDO {referencia.instagram.toUpperCase()}...</div>
            </div>
          )}
          {erro && <div style={{ padding:'14px 18px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:13 }}>{erro}</div>}
          {resultado && !loading && (
            <>
              {/* Scores */}
              <ASection title="Score">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <ScoreBar label="Conteúdo"    value={resultado.score.conteudo} />
                  <ScoreBar label="Consistência" value={resultado.score.consistencia} />
                  <ScoreBar label="Engajamento"  value={resultado.score.engajamento} />
                  <ScoreBar label="Domínio de Nicho" value={resultado.score.nicho} />
                </div>
              </ASection>

              {/* Perfil */}
              <ASection title="Perfil">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                  {[
                    {l:'Posicionamento', v:resultado.perfil.posicionamento},
                    {l:'Tom de Voz',     v:resultado.perfil.tom},
                    {l:'Frequência',     v:resultado.perfil.frequencia},
                  ].map(i=>(
                    <div key={i.l} style={{ padding:'8px 12px', background:'var(--surface-2)', borderRadius:7, border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:8, fontWeight:700, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:3 }}>{i.l}</div>
                      <div style={{ color:'var(--text-primary)', fontSize:11, lineHeight:1.4 }}>{i.v}</div>
                    </div>
                  ))}
                  <div style={{ padding:'8px 12px', background:'var(--surface-2)', borderRadius:7, border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:8, fontWeight:700, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:5 }}>Formatos</div>
                    <div>{resultado.perfil.formatos.map(f=><ATag key={f} text={f} color="#b8976a" />)}</div>
                  </div>
                </div>
              </ASection>

              {/* Temas */}
              <ASection title="Mapa de Temas">
                <div style={{ padding:'8px 14px', background:'rgba(200,168,76,0.07)', border:'1px solid rgba(200,168,76,0.2)', borderRadius:7, marginBottom:10, color:'var(--text-primary)', fontSize:13, fontWeight:700 }}>
                  {resultado.temas.principal}
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:6 }}>Secundários</div>
                  {resultado.temas.secundarios.map(t=><ATag key={t} text={t} />)}
                </div>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:'#16a34a', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:6 }}>Gaps — Não Aborda</div>
                  {resultado.temas.gaps.map(t=><ATag key={t} text={t} color="#16a34a" />)}
                </div>
              </ASection>

              {/* Fortes / Fracos */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:12 }}>
                <ASection title="✅ Pontos Fortes">
                  {resultado.pontos_fortes.map((p,i)=>(
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                      <span style={{ color:'#16a34a', flexShrink:0 }}>+</span>
                      <span style={{ color:'var(--text-secondary)', fontSize:12, lineHeight:1.5 }}>{p}</span>
                    </div>
                  ))}
                </ASection>
                <ASection title="⚠️ Pontos Fracos">
                  {resultado.pontos_fracos.map((p,i)=>(
                    <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
                      <span style={{ color:'#dc2626', flexShrink:0 }}>−</span>
                      <span style={{ color:'var(--text-secondary)', fontSize:12, lineHeight:1.5 }}>{p}</span>
                    </div>
                  ))}
                </ASection>
              </div>

              {/* Oportunidades */}
              <ASection title="🎯 Oportunidades para você">
                {resultado.oportunidades.map((o,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, padding:'10px 14px', background:'rgba(200,168,76,0.05)', border:'1px solid rgba(200,168,76,0.15)', borderRadius:7, marginBottom:8 }}>
                    <span style={{ color:'var(--accent)', fontWeight:900, flexShrink:0 }}>→</span>
                    <span style={{ color:'var(--text-primary)', fontSize:12, lineHeight:1.5 }}>{o}</span>
                  </div>
                ))}
              </ASection>

              {/* Estratégia */}
              <ASection title="⚡ Estratégia Recomendada">
                <div style={{ padding:'12px 16px', background:'rgba(200,168,76,0.08)', border:'1px solid rgba(200,168,76,0.25)', borderRadius:8, marginBottom:12, color:'var(--text-primary)', fontSize:13, lineHeight:1.6, fontStyle:'italic', fontFamily:"Georgia,serif" }}>
                  "{resultado.estrategia.diferencial}"
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:6 }}>Temas para Atacar</div>
                    {resultado.estrategia.temas_atacar.map(t=><ATag key={t} text={t} color="rgba(167,139,250,0.9)" />)}
                  </div>
                  <div>
                    <div style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', letterSpacing:3, textTransform:'uppercase' as const, marginBottom:6 }}>Formatos Rec.</div>
                    {resultado.estrategia.formatos_rec.map(f=><ATag key={f} text={f} color="rgba(96,165,250,0.9)" />)}
                  </div>
                </div>
                <div style={{ padding:'10px 14px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text-secondary)', fontSize:12, lineHeight:1.6, fontStyle:'italic' }}>
                  "{resultado.estrategia.gancho}"
                </div>
              </ASection>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function ReferenciasPage() {
  const [refs, setRefs]               = useState<Referencia[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [search, setSearch]           = useState("")
  const [filterNicho, setFilterNicho] = useState("Todos")
  const [filterRel, setFilterRel]     = useState("Todas")
  const [showForm, setShowForm]       = useState(false)
  const [newNome, setNewNome]         = useState("")
  const [newInsta, setNewInsta]       = useState("")
  const [newEsp, setNewEsp]           = useState("Endocrinologia")
  const [newSeg, setNewSeg]           = useState("")
  const [newFreq, setNewFreq]         = useState("2x/semana")
  const [newRel, setNewRel]           = useState("Media")
  const [newNota, setNewNota]         = useState("")
  const [newSite, setNewSite]         = useState("")
  const [newTemas, setNewTemas]       = useState("")
  const [toast, setToast]             = useState<string | null>(null)
  const [editRef, setEditRef]         = useState<Referencia | null>(null)
  const [analiseRef, setAnaliseRef]   = useState<Referencia | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const fetchRefs = async () => {
    setLoading(true)
    try { const res = await fetch('/api/referencias'); setRefs(await res.json() || []) }
    catch (e) { console.error(e) }
    setLoading(false)
  }
  useEffect(() => { fetchRefs() }, [])

  const filtered = refs
    .filter(r => {
      if (filterNicho !== "Todos" && r.especialidade !== filterNicho) return false
      if (filterRel !== "Todas" && r.relevancia !== filterRel) return false
      if (search && !r.nome.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a,b) => { const o:Record<string,number>={Alta:0,Media:1,Baixa:2}; return (o[a.relevancia]??2)-(o[b.relevancia]??2) })

  const addRef = async () => {
    if (!newNome.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/referencias', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          nome:newNome, especialidade:newEsp, instagram:newInsta||"-",
          seguidores:newSeg||"-", frequencia:newFreq,
          temas: newTemas ? newTemas.split(",").map(t=>t.trim()).filter(Boolean) : [],
          relevancia:newRel, nota:newNota, site:newSite,
        })
      })
      if (res.ok) { showToast("Referencia salva!"); setNewNome(""); setNewInsta(""); setNewNota(""); setNewSite(""); setNewSeg(""); setNewTemas(""); setShowForm(false); fetchRefs() }
      else showToast("Erro ao salvar.")
    } catch(e) { showToast("Erro ao salvar.") }
    setSaving(false)
  }

  const removeRef = async (id:string) => {
    try {
      const res = await fetch('/api/referencias', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
      if (res.ok) { showToast("Removida."); setRefs(prev=>prev.filter(r=>r.id!==id)) }
    } catch(e) { showToast("Erro ao remover.") }
  }

  const updateRef = async (ref: Referencia) => {
    try {
      const res = await fetch('/api/referencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ref)
      })
      if (res.ok) {
        showToast("Referencia atualizada!")
        setRefs(prev => prev.map(r => r.id === ref.id ? ref : r))
        setEditRef(null)
      } else { showToast("Erro ao atualizar.") }
    } catch { showToast("Erro ao atualizar.") }
  }

  const totalSeg = refs.map(r=>parseInt(r.seguidores.replace(/[^0-9]/g,""))||0).reduce((a,b)=>a+b,0)
  const fmtSeg = totalSeg>0?(totalSeg>=1000000?(totalSeg/1000000).toFixed(1)+"M+":(totalSeg/1000).toFixed(0)+"k+"):"-"

  return (
    <div className="animate-fade-in">
      {analiseRef && <AnaliseModal referencia={analiseRef} onClose={() => setAnaliseRef(null)} />}

      <TopBar title="Monitor de Referencias" subtitle="MEDICOS INFLUENTES NO SEU NICHO"
        actions={
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Adicionar Referencia
          </button>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Perfis"          value={refs.length}                             sub="referencias ativas" icon={Users}      accent="green" />
          <StatCard label="Alta Relevancia" value={refs.filter(r=>r.relevancia==="Alta").length} sub="prioritarios"  icon={Star}       accent="red"   />
          <StatCard label="Especialidades"  value={new Set(refs.map(r=>r.especialidade)).size}   sub="nichos"        icon={TrendingUp} accent="blue"  />
          <StatCard label="Seguidores"      value={fmtSeg}                                  sub="alcance combinado"  icon={Eye}        accent="amber" />
        </div>

        {showForm && (
          <div className="bg-card border border-accent-border rounded-lg p-6 space-y-4 animate-fade-in">
            <div className="text-[11px] font-mono text-accent tracking-widest uppercase">Nova Referencia</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newNome} onChange={e=>setNewNome(e.target.value)} placeholder="Nome do medico..."
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 col-span-2" />
              <input value={newInsta} onChange={e=>setNewInsta(e.target.value)} placeholder="@instagram"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              <input value={newSeg} onChange={e=>setNewSeg(e.target.value)} placeholder="Seguidores (ex: 150k)"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              <select value={newEsp} onChange={e=>setNewEsp(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {NICHOS.filter(n=>n!=="Todos").map(n=><option key={n}>{n}</option>)}
              </select>
              <select value={newFreq} onChange={e=>setNewFreq(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Diaria","3x/semana","2x/semana","1x/semana","Esporadica"].map(f=><option key={f}>{f}</option>)}
              </select>
              <select value={newRel} onChange={e=>setNewRel(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                {["Alta","Media","Baixa"].map(r=><option key={r}>{r}</option>)}
              </select>
              <input value={newSite} onChange={e=>setNewSite(e.target.value)} placeholder="Site (opcional)"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40" />
              <input value={newTemas} onChange={e=>setNewTemas(e.target.value)} placeholder="Temas frequentes (ex: insulina, tireoide, emagrecimento)"
                className="bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 col-span-2" />
            </div>
            <textarea value={newNota} onChange={e=>setNewNota(e.target.value)} placeholder="Observacoes..." rows={3}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-[13px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent/40 resize-none" />
            <div className="flex gap-3">
              <button onClick={addRef} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-medium hover:bg-accent/20 transition-colors disabled:opacity-50">
                <Plus className="w-3.5 h-3.5" /> {saving?"Salvando...":"Adicionar"}
              </button>
              <button onClick={()=>setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-text-muted text-[12px] hover:text-text-secondary transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou @instagram..."
              className="flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-muted outline-none" />
          </div>
          <div className="border-t border-border pt-3 space-y-2.5">
            {[
              {label:"Nicho",      items:NICHOS,     value:filterNicho, set:setFilterNicho},
              {label:"Relevancia", items:RELEVANCIA, value:filterRel,   set:setFilterRel},
            ].map(g=>(
              <div key={g.label} className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase w-16 flex-shrink-0">{g.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map(item=>(
                    <button key={item} onClick={()=>g.set(item)}
                      className={cn("text-[10px] px-2.5 py-0.5 rounded-full border transition-all",
                        g.value===item?"bg-accent-dim border-accent-border text-accent-text font-medium":"border-border text-text-muted hover:text-text-secondary")}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Carregando referencias...</div>
        ) : filtered.length===0 ? (
          <div className="text-center py-16 text-text-muted text-[13px]">Nenhuma referencia encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(r=>(
              <div key={r.id} className="group bg-card border border-border hover:border-border-hover rounded-lg p-5 transition-all duration-150">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-dim border border-accent-border flex items-center justify-center flex-shrink-0 text-[13px] font-semibold text-accent">
                      {r.nome.split(" ").slice(0,2).map((n:string)=>n[0]).join("")}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-text-primary">{r.nome}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Instagram className="w-3 h-3 text-text-muted" />
                        <span className="text-[10px] font-mono text-text-secondary">{r.instagram}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border", RELEVANCIA_STYLES[r.relevancia]||RELEVANCIA_STYLES["Media"])}>
                      {r.relevancia}
                    </span>
                    <button onClick={()=>removeRef(r.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded border border-border flex items-center justify-center text-text-muted hover:text-red-400 hover:border-red-500/40 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    {label:"Especialidade", value:r.especialidade, colored:false},
                    {label:"Seguidores",    value:r.seguidores,    colored:false},
                    {label:"Frequencia",    value:r.frequencia,    colored:true},
                  ].map(info=>(
                    <div key={info.label} className="bg-background border border-border rounded-md px-3 py-2">
                      <div className="text-[8px] font-mono text-text-muted tracking-widest uppercase mb-0.5">{info.label}</div>
                      <div className={cn("text-[11px] font-medium", info.colored?(FREQ_STYLES[info.value]||"text-text-secondary"):"text-text-primary")}>{info.value}</div>
                    </div>
                  ))}
                </div>

                {r.temas && r.temas.length>0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.temas.map((t:string)=>(
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-accent-dim border border-accent-border text-accent-text font-mono">{t}</span>
                    ))}
                  </div>
                )}

                {r.nota && <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{r.nota}</p>}

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <a href={"https://instagram.com/"+r.instagram.replace("@","")} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                    <Instagram className="w-3 h-3" /> Ver perfil
                  </a>
                  {r.site && (
                    <a href={"https://"+r.site} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
                      <Globe className="w-3 h-3" /> {r.site}
                    </a>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setAnaliseRef(r)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-md border border-border text-text-muted hover:text-accent hover:border-accent-border text-[10px] font-mono transition-all whitespace-nowrap">
                      🔍 Análise
                    </button>
                    <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Editar Referência ── */}
      {editRef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.8)'}} onClick={()=>setEditRef(null)}>
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="text-[13px] font-semibold text-text-primary">Editar Referência</div>
              <button onClick={()=>setEditRef(null)} className="text-text-muted hover:text-text-primary text-lg">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={editRef.nome} onChange={e=>setEditRef(p=>p?{...p,nome:e.target.value}:p)}
                  placeholder="Nome" className="col-span-2 bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40"/>
                <input value={editRef.instagram} onChange={e=>setEditRef(p=>p?{...p,instagram:e.target.value}:p)}
                  placeholder="@instagram" className="bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40"/>
                <input value={editRef.seguidores} onChange={e=>setEditRef(p=>p?{...p,seguidores:e.target.value}:p)}
                  placeholder="Seguidores" className="bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40"/>
                <select value={editRef.especialidade} onChange={e=>setEditRef(p=>p?{...p,especialidade:e.target.value}:p)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                  {["Nutrologia","Endocrinologia","Longevidade","Metabolismo","Geral"].map(n=><option key={n}>{n}</option>)}
                </select>
                <select value={editRef.frequencia} onChange={e=>setEditRef(p=>p?{...p,frequencia:e.target.value}:p)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                  {["Diaria","3x/semana","2x/semana","1x/semana","Esporadica"].map(f=><option key={f}>{f}</option>)}
                </select>
                <select value={editRef.relevancia} onChange={e=>setEditRef(p=>p?{...p,relevancia:e.target.value}:p)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-[12px] text-text-primary outline-none focus:border-accent/40">
                  {["Alta","Media","Baixa"].map(r=><option key={r}>{r}</option>)}
                </select>
                <input value={editRef.site||''} onChange={e=>setEditRef(p=>p?{...p,site:e.target.value}:p)}
                  placeholder="Site (opcional)" className="bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40"/>
                <input value={(editRef.temas||[]).join(', ')} onChange={e=>setEditRef(p=>p?{...p,temas:e.target.value.split(',').map(t=>t.trim()).filter(Boolean)}:p)}
                  placeholder="Temas (separados por vírgula)" className="col-span-2 bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40"/>
              </div>
              <textarea value={editRef.nota} onChange={e=>setEditRef(p=>p?{...p,nota:e.target.value}:p)}
                placeholder="Observações..." rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent/40 resize-none"/>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>editRef&&updateRef(editRef)}
                  className="flex-1 py-2.5 rounded-lg bg-accent border border-accent text-background text-[13px] font-semibold hover:opacity-90 transition-opacity">
                  Salvar alterações
                </button>
                <button onClick={()=>setEditRef(null)}
                  className="px-4 py-2.5 rounded-lg border border-border text-text-muted text-[12px] hover:text-text-secondary transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-card border border-accent-border text-accent text-[12px] px-4 py-3 rounded-lg shadow-xl animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
