// Salvar em: app/roteiros/page.tsx
'use client'
import { useState, useCallback, useEffect } from 'react'
import { PautasModal } from '@/components/PautasModal'
import { Toast } from '@/components/Toast'
import { AI_MODEL } from "@/lib/ai-config"

const D = {
  bg:'var(--background)',surface:'var(--surface)',card:'var(--surface-2)',border:'var(--border)',
  text:'var(--text-primary)',text2:'var(--text-secondary)',muted:'var(--text-muted)',
  accent:'var(--accent)',adim:'var(--accent-dim)',aborder:'var(--accent-border)',atext:'var(--accent-text)',
  font:"'Inter', system-ui, sans-serif",mono:"'JetBrains Mono', monospace",
}

type Duracao = '15s'|'30s'|'60s'|'90s'
type Estilo  = 'talking-head'|'texto-tela'|'broll'|'misto'
interface Bloco{id:number;tempo:string;tipo:'gancho'|'problema'|'conteudo'|'insight'|'cta';fala:string;visual:string;corte:string}
interface Roteiro{titulo:string;blocos:Bloco[];legenda:string;hashtags:string[];hook:string}

const TIPO={gancho:{label:'GANCHO',color:'#00c07f',icon:'⚡'},problema:{label:'PROBLEMA',color:'#f59e0b',icon:'🎯'},conteudo:{label:'CONTEÚDO',color:'#3b7fff',icon:'📋'},insight:{label:'INSIGHT',color:'#a78bfa',icon:'💡'},cta:{label:'CTA',color:'#00e893',icon:'👆'}}
const DURACOES=[{v:'15s',l:'15s',d:'Viral curto'},{v:'30s',l:'30s',d:'Stories'},{v:'60s',l:'60s',d:'Educativo'},{v:'90s',l:'90s',d:'Detalhado'}]
const ESTILOS=[{v:'talking-head',l:'Talking Head',d:'Médico direto para câmera'},{v:'texto-tela',l:'Texto na Tela',d:'Palavras + fala'},{v:'broll',l:'B-Roll',d:'Imagens + voz over'},{v:'misto',l:'Misto',d:'Combinação'}]

const inp:React.CSSProperties={background:D.card,border:`1px solid ${D.border}`,color:D.text,borderRadius:7,padding:'9px 13px',fontSize:16,width:'100%',fontFamily:D.font,outline:'none'}
function CopyBtn({text,label='⎘ Copiar'}:{text:string;label?:string}){const[ok,setOk]=useState(false);return<button onClick={()=>{navigator.clipboard.writeText(text);setOk(true);setTimeout(()=>setOk(false),1600)}} style={{padding:'6px 14px',borderRadius:6,border:`1px solid ${ok?D.aborder:D.border}`,background:ok?D.adim:'none',color:ok?D.atext:D.muted,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:D.font}}>{ok?'✓ Copiado':label}</button>}

export default function RoteirosPage(){
  const[tema,setTema]=useState('');const[publico,setPublico]=useState('');const[duracao,setDuracao]=useState<Duracao>('60s');const[estilo,setEstilo]=useState<Estilo>('talking-head')
  const[roteiro,setRoteiro]=useState<Roteiro|null>(null);const[loading,setLoading]=useState(false);const[editIdx,setEditIdx]=useState<number|null>(null);const[editInstr,setEditInstr]=useState('');const[regenLoad,setRegenLoad]=useState(false);const[activeTab,setActiveTab]=useState<'roteiro'|'legenda'|'hashtags'>('roteiro');const[showPautas,setShowPautas]=useState(false)
  const[errMsg,setErrMsg]=useState<string|null>(null)
  const showErr=(msg:string)=>{setErrMsg(msg);setTimeout(()=>setErrMsg(null),4000)}
  const isMob=typeof window!=='undefined'&&window.innerWidth<768
  useEffect(()=>{
    if(typeof window==='undefined')return
    const urlTema=new URLSearchParams(window.location.search).get('tema')
    if(urlTema){setTema(decodeURIComponent(urlTema));return}
    const saved=localStorage.getItem('praxis_roteiro_tema')
    if(saved){setTema(saved);localStorage.removeItem('praxis_roteiro_tema')}
  },[])
  const gerar=useCallback(async()=>{
    if(!tema.trim())return;setLoading(true)
    try{const prompt = [
        'Você é roteirista médico para Reels do médico usuário — Clínico-Geral, Endocrinologia e Nutrologia.',
        'TEMA: ' + tema + (publico ? ' | PÚBLICO: ' + publico : ''),
        'DURAÇÃO: ' + duracao + ' | ESTILO: ' + estilo,
        'Tom: direto, humano, sem enrolação. Gancho nos primeiros 3 segundos.',
        '',
        'Retorne SOMENTE JSON válido sem markdown:',
        '{"titulo":"título do reel","hook":"gancho abertura max 2 frases","blocos":[{"id":1,"tempo":"0:00-0:03","tipo":"gancho","fala":"texto falado","visual":"o que aparece na tela","corte":"corte seco"}],"legenda":"legenda completa Instagram max 2200 chars","hashtags":["tag1","tag2"]}',
        '',
        'Tipos em ordem: gancho, problema, conteudo (1-3x), insight, cta. Máx 5 hashtags.',
      ].join('\n')
    const res=await fetch('/api/roteiros',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:AI_MODEL,max_tokens:2000,messages:[{role:'user',content:prompt}]})})
    const data=await res.json();const raw=(data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim();const startIdx=raw.indexOf('{');const jsonStr=startIdx>=0?raw.slice(startIdx):raw;const json=JSON.parse(jsonStr)
    if(!json.blocos){console.error('API response:',json);throw new Error('Resposta inesperada da IA. Tente novamente.')};setRoteiro(json as Roteiro);setActiveTab('roteiro');setEditIdx(null)
    }catch(e){const m=String(e);showErr(m.includes('rate_limit')?'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.':'Erro ao gerar roteiro. Tente novamente.')}
    setLoading(false)
  },[tema,publico,duracao,estilo])
  const regenBloco=useCallback(async(idx:number)=>{
    if(!roteiro||!editInstr.trim())return;setRegenLoad(true)
    try{const b=roteiro.blocos[idx];const prompt='Reescreva bloco para o médico usuário. Tom: humano.\ntipo="'+b.tipo+'" | fala="'+b.fala+'"\nINSTRUÇÃO: '+editInstr+'\nRetorne SOMENTE JSON: {"fala":"...","visual":"...","corte":"..."}'
    const res=await fetch('/api/roteiros',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:AI_MODEL,max_tokens:400,messages:[{role:'user',content:prompt}]})})
    const data=await res.json();const json=JSON.parse((data.content?.[0]?.text||'{}').replace(/```json/g,'').replace(/```/g,'').trim())
    setRoteiro(prev=>prev?{...prev,blocos:prev.blocos.map((bl,i)=>i===idx?{...bl,...json}:bl)}:prev);setEditInstr('');setEditIdx(null)
    }catch(e){const m=String(e);showErr(m.includes('rate_limit')?'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.':'Erro ao gerar roteiro. Tente novamente.')}
    setRegenLoad(false)
  },[roteiro,editInstr])
  const txt=roteiro?roteiro.blocos.map(b=>'['+b.tempo+'] '+b.tipo.toUpperCase()+'\nFALA: '+b.fala+'\nVISUAL: '+b.visual+'\nCORTE: '+b.corte).join('\n\n'):''
  const btnS=(a:boolean):React.CSSProperties=>({padding:'9px 12px',borderRadius:7,border:`1px solid ${a?D.aborder:D.border}`,cursor:'pointer',fontFamily:D.font,fontWeight:600,fontSize:12,background:a?D.adim:'none',color:a?D.atext:D.muted,transition:'all 0.15s',textAlign:'left' as const})
  return(
    <div className="min-h-screen" style={{fontFamily:D.font,color:D.text}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {showPautas&&<PautasModal onSelect={(t)=>{setTema(t);setShowPautas(false)}} onClose={()=>setShowPautas(false)}/>}
      <div className="border-b border-border bg-surface" style={{padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontSize:17,fontWeight:700,color:D.text,margin:0}}>Gerador de Roteiros</h1><p style={{fontSize:10,color:D.muted,margin:'2px 0 0',fontFamily:D.mono,letterSpacing:1}}>ROTEIROS PARA REELS</p><p style={{fontSize:11,color:D.text2,margin:'4px 0 0',fontFamily:D.font}}>Crie roteiros de vídeo prontos para gravar a partir de um tema ou referência.</p></div>
        <button onClick={gerar} disabled={loading||!tema.trim()} style={{background:tema.trim()?D.accent:'none',color:tema.trim()?D.bg:D.muted,border:`1px solid ${tema.trim()?D.accent:D.border}`,padding:'9px 20px',borderRadius:8,fontWeight:700,fontSize:13,cursor:tema.trim()?'pointer':'not-allowed',fontFamily:D.font}}>{loading?'⟳ Gerando...':'✦ Gerar Roteiro'}</button>
      </div>
      <div style={{display:'flex',height:isMob?'auto':'calc(100vh - 68px)',flexDirection:isMob?'column':'row'}}>
        <div className="bg-card border-r border-border" style={{width:isMob?'100%':280,flexShrink:0,overflowY:'auto',padding:18,display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}><span style={{fontSize:10,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',fontFamily:D.mono}}>Tema</span><button onClick={()=>setShowPautas(true)} style={{fontSize:10,fontWeight:700,color:D.atext,background:D.adim,border:`1px solid ${D.aborder}`,borderRadius:5,padding:'3px 9px',cursor:'pointer',fontFamily:D.mono}}>📋 Pautas</button></div>
            <textarea value={tema} onChange={e=>setTema(e.target.value)} rows={3} placeholder="Ex: Andropausa e TRT" style={{...inp,resize:'none',display:'block'}}/>
          </div>
          <div><span style={{fontSize:10,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',fontFamily:D.mono,display:'block',marginBottom:7}}>Público (opcional)</span><input value={publico} onChange={e=>setPublico(e.target.value)} placeholder="Ex: Homens acima de 40 anos" style={inp}/></div>
          <div><span style={{fontSize:10,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',fontFamily:D.mono,display:'block',marginBottom:7}}>Duração</span><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>{DURACOES.map(d=><button key={d.v} onClick={()=>setDuracao(d.v as Duracao)} style={btnS(duracao===d.v)}><div style={{fontWeight:700,fontSize:14}}>{d.l}</div><div style={{fontSize:10,opacity:.7}}>{d.d}</div></button>)}</div></div>
          <div><span style={{fontSize:10,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',fontFamily:D.mono,display:'block',marginBottom:7}}>Estilo</span><div style={{display:'flex',flexDirection:'column',gap:5}}>{ESTILOS.map(e=><button key={e.v} onClick={()=>setEstilo(e.v as Estilo)} style={btnS(estilo===e.v)}><div style={{fontWeight:700,fontSize:12}}>{e.l}</div><div style={{fontSize:10,opacity:.7}}>{e.d}</div></button>)}</div></div>
        </div>
        <div className="bg-background" style={{flex:1,overflowY:'auto',padding:isMob?14:24}}>
          {!roteiro&&!loading&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'55vh',gap:10,opacity:.35}}><div style={{fontSize:44}}>🎬</div><div style={{color:D.muted,fontSize:11,fontWeight:700,letterSpacing:3,textTransform:'uppercase',textAlign:'center',fontFamily:D.mono}}>Defina o tema e clique<br/>em ✦ Gerar Roteiro</div></div>}
          {loading&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'55vh',gap:14}}><div style={{width:36,height:36,border:`3px solid ${D.adim}`,borderTop:`3px solid ${D.accent}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><div style={{color:D.accent,fontSize:11,fontWeight:700,letterSpacing:2,fontFamily:D.mono}}>ESCREVENDO ROTEIRO...</div></div>}
          {roteiro&&!loading&&<>
            <div style={{marginBottom:18}}>
              <div style={{color:D.muted,fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',marginBottom:4,fontFamily:D.mono}}>{duracao} · {ESTILOS.find(e=>e.v===estilo)?.l}</div>
              <h2 style={{margin:'0 0 10px',fontSize:18,fontWeight:700,color:D.text}}>{roteiro.titulo}</h2>
              <div style={{padding:'10px 14px',background:D.adim,border:`1px solid ${D.aborder}`,borderRadius:8,display:'flex',gap:10,alignItems:'flex-start',marginBottom:14}}>
                <span>⚡</span><div><div style={{color:D.atext,fontSize:9,fontWeight:700,letterSpacing:3,textTransform:'uppercase',marginBottom:3,fontFamily:D.mono}}>GANCHO</div><div style={{color:D.text,fontSize:13,fontStyle:'italic',lineHeight:1.5}}>"{roteiro.hook}"</div></div>
              </div>
              <div style={{display:'flex',gap:2,borderBottom:`1px solid ${D.border}`}}>
                {(['roteiro','legenda','hashtags'] as const).map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:'7px 14px',border:'none',borderBottom:activeTab===tab?`2px solid ${D.accent}`:'2px solid transparent',background:'none',color:activeTab===tab?D.accent:D.muted,fontWeight:700,fontSize:10,cursor:'pointer',textTransform:'uppercase',letterSpacing:2,fontFamily:D.mono,marginBottom:-1}}>{tab==='roteiro'?'🎬 Roteiro':tab==='legenda'?'📝 Legenda':'# Hashtags'}</button>)}
                {activeTab==='roteiro'&&<div style={{marginLeft:'auto',paddingBottom:3}}><CopyBtn text={txt} label="⎘ Copiar"/></div>}
              </div>
            </div>
            {activeTab==='roteiro'&&<div style={{display:'flex',flexDirection:'column',gap:8}}>
              {roteiro.blocos.map((b,idx)=>{const cfg=TIPO[b.tipo];const isEd=editIdx===idx;return(
                <div key={b.id} style={{background:D.card,border:`1px solid ${isEd?D.aborder:D.border}`,borderRadius:9,overflow:'hidden',borderLeft:`3px solid ${cfg.color}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 13px',borderBottom:`1px solid ${D.border}`,background:D.surface}}>
                    <span>{cfg.icon}</span><span style={{fontSize:9,fontWeight:700,color:cfg.color,letterSpacing:3,fontFamily:D.mono}}>{cfg.label}</span><span style={{fontSize:10,color:D.muted,fontFamily:D.mono}}>{b.tempo}</span>
                    <button onClick={()=>{setEditIdx(isEd?null:idx);setEditInstr('')}} style={{marginLeft:'auto',padding:'3px 9px',borderRadius:5,border:`1px solid ${isEd?D.aborder:D.border}`,background:isEd?D.adim:'none',color:isEd?D.atext:D.muted,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:D.font}}>{isEd?'✕':'✦ Editar'}</button>
                  </div>
                  <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:9}}>
                    <div><div style={{fontSize:9,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',marginBottom:4,fontFamily:D.mono}}>🎙 FALA</div>{isEd?<textarea value={b.fala} rows={3} onChange={e=>setRoteiro(prev=>prev?{...prev,blocos:prev.blocos.map((bl,i)=>i===idx?{...bl,fala:e.target.value}:bl)}:prev)} style={{...inp,resize:'none',display:'block',fontSize:13}}/>:<div style={{color:D.text,fontSize:13,lineHeight:1.6}}>{b.fala}</div>}</div>
                    <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr auto',gap:9}}>
                      <div><div style={{fontSize:9,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',marginBottom:4,fontFamily:D.mono}}>🎥 VISUAL</div>{isEd?<input value={b.visual} onChange={e=>setRoteiro(prev=>prev?{...prev,blocos:prev.blocos.map((bl,i)=>i===idx?{...bl,visual:e.target.value}:bl)}:prev)} style={{...inp,fontSize:12}}/>:<div style={{color:D.text2,fontSize:12,lineHeight:1.5}}>{b.visual}</div>}</div>
                      <div style={{minWidth:130}}><div style={{fontSize:9,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',marginBottom:4,fontFamily:D.mono}}>✂ CORTE</div>{isEd?<input value={b.corte} onChange={e=>setRoteiro(prev=>prev?{...prev,blocos:prev.blocos.map((bl,i)=>i===idx?{...bl,corte:e.target.value}:bl)}:prev)} style={{...inp,fontSize:11}}/>:<span style={{display:'inline-block',padding:'3px 9px',borderRadius:20,background:D.adim,border:`1px solid ${D.aborder}`,color:D.atext,fontSize:10,fontWeight:700,fontFamily:D.mono}}>{b.corte}</span>}</div>
                    </div>
                    {isEd&&<div style={{paddingTop:9,borderTop:`1px solid ${D.border}`}}><div style={{fontSize:9,fontWeight:700,color:D.atext,letterSpacing:3,textTransform:'uppercase',marginBottom:7,fontFamily:D.mono}}>✦ REGENERAR COM IA</div><div style={{display:'flex',gap:7}}><input value={editInstr} onChange={e=>setEditInstr(e.target.value)} placeholder="Ex: mais impactante, use dado do NEJM..." style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==='Enter'&&editInstr.trim())regenBloco(idx)}}/><button onClick={()=>regenBloco(idx)} disabled={regenLoad||!editInstr.trim()} style={{padding:'9px 12px',borderRadius:7,border:`1px solid ${D.aborder}`,background:editInstr.trim()?D.adim:'none',color:editInstr.trim()?D.atext:D.muted,fontWeight:700,fontSize:11,cursor:editInstr.trim()?'pointer':'not-allowed',fontFamily:D.font}}>{regenLoad?'⟳':'⚡'}</button></div></div>}
                  </div>
                </div>
              )})}
            </div>}
            {activeTab==='legenda'&&<div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:9}}><span style={{fontSize:9,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',fontFamily:D.mono}}>{roteiro.legenda.length}/2200</span><CopyBtn text={roteiro.legenda+'\n\n'+roteiro.hashtags.map(h=>'#'+h).join(' ')} label="⎘ Copiar legenda"/></div><textarea value={roteiro.legenda} rows={16} onChange={e=>setRoteiro(prev=>prev?{...prev,legenda:e.target.value}:prev)} style={{...inp,resize:'none',display:'block',lineHeight:1.7,fontSize:13}}/></div>}
            {activeTab==='hashtags'&&<div><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><span style={{fontSize:9,fontWeight:700,color:D.muted,letterSpacing:3,textTransform:'uppercase',fontFamily:D.mono}}>{roteiro.hashtags.length} hashtags</span><CopyBtn text={roteiro.hashtags.map(h=>'#'+h).join(' ')} label="⎘ Copiar todas"/></div><div style={{display:'flex',flexWrap:'wrap',gap:7}}>{roteiro.hashtags.map((h,i)=><div key={i} style={{display:'flex',alignItems:'center',background:D.card,border:`1px solid ${D.border}`,borderRadius:20,overflow:'hidden'}}><span style={{padding:'6px 11px',color:D.atext,fontSize:12,fontWeight:700,fontFamily:D.mono}}>#{h}</span><button onClick={()=>setRoteiro(prev=>prev?{...prev,hashtags:prev.hashtags.filter((_,j)=>j!==i)}:prev)} style={{padding:'6px 9px',background:'none',border:'none',color:D.muted,cursor:'pointer',fontSize:10}}>✕</button></div>)}</div><div style={{marginTop:14,display:'flex',gap:7}}><input id="ht" type="text" placeholder="Adicionar hashtag..." style={{...inp,flex:1}} onKeyDown={e=>{if(e.key==='Enter'){const v=(e.target as HTMLInputElement).value.replace('#','').trim();if(v){setRoteiro(prev=>prev?{...prev,hashtags:[...prev.hashtags,v]}:prev);(e.target as HTMLInputElement).value=''}}}}/><button onClick={()=>{const i=document.getElementById('ht') as HTMLInputElement;const v=i.value.replace('#','').trim();if(v){setRoteiro(prev=>prev?{...prev,hashtags:[...prev.hashtags,v]}:prev);i.value=''}}} style={{padding:'9px 12px',borderRadius:7,border:`1px solid ${D.border}`,background:D.card,color:D.atext,fontWeight:700,fontSize:11,cursor:'pointer',fontFamily:D.font}}>+</button></div></div>}
          </>}
        </div>
      </div>
      <Toast message={errMsg} type="error" />
    </div>
  )
}
