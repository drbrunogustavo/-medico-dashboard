// Salvar em: app/whatsapp/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { MobileOnlyHeader } from "@/components/MobileOnlyHeader"

const D = {
  bg:'var(--background)', surface:'var(--surface)', card:'var(--surface-2)', border:'var(--border)', bdHov:'var(--border-hover)',
  text:'var(--text-primary)', text2:'var(--text-secondary)', muted:'var(--text-muted)',
  accent:'var(--accent)', adim:'var(--accent-dim)', aborder:'var(--accent-border)', atext:'var(--accent-text)',
  warn:'#f59e0b', wdim:'rgba(245,158,11,0.12)', wborder:'rgba(245,158,11,0.3)',
  blue:'#3b7fff', bdim:'rgba(59,127,255,0.12)', bborder:'rgba(59,127,255,0.3)',
  red:'#ef4444', rdim:'rgba(239,68,68,0.12)', rborder:'rgba(239,68,68,0.3)',
  font:"'Inter', system-ui, sans-serif", mono:"'JetBrains Mono', monospace",
}

type TabId = 'visao-geral' | 'configuracao' | 'fluxos' | 'respostas' | 'integracao'
type StatusAgente = 'ativo' | 'pausado' | 'configurando'

interface FluxoItem { id: string; nome: string; descricao: string; ativo: boolean; emoji: string; passos: number }
interface RespostaRapida { id: string; gatilho: string; resposta: string; ativo: boolean }
interface ConfigAgente {
  nome: string; saudacao: string; despedida: string; horario_inicio: string
  horario_fim: string; dias_semana: string[]; tempo_resposta: string
  n8n_webhook: string; medx_token: string; numero_whatsapp: string
}

const FLUXOS_DEFAULT: FluxoItem[] = [
  { id:'1', nome:'Pré-cadastro de Paciente', descricao:'Coleta dados → cria prontuário no MedX → envia lista de exames assinada', ativo:false, emoji:'📋', passos:7 },
  { id:'2', nome:'Agendamento de Consulta',  descricao:'Verifica disponibilidade → confirma horário → envia lembrete 24h antes', ativo:false, emoji:'📅', passos:5 },
  { id:'3', nome:'Programa de Acompanhamento 30 dias', descricao:'Check-ins semanais → orientações personalizadas → relatório mensal', ativo:false, emoji:'🎯', passos:12 },
  { id:'4', nome:'Programa de Acompanhamento 90 dias', descricao:'Protocolo completo com avaliações, exames e ajustes de conduta', ativo:false, emoji:'📈', passos:18 },
  { id:'5', nome:'Triagem Inteligente Pré-consulta',   descricao:'Anamnese guiada por IA → briefing para o médico → preparo do prontuário', ativo:false, emoji:'🧠', passos:9 },
  { id:'6', nome:'Envio de Resultados de Exames',      descricao:'Recebe exames do paciente → IA interpreta → médico valida → envia resposta', ativo:false, emoji:'🔬', passos:4 },
]

const RESPOSTAS_DEFAULT: RespostaRapida[] = [
  { id:'1', gatilho:'oi|olá|boa tarde|bom dia|boa noite', resposta:'Olá! Sou o assistente da clínica. Como posso ajudar você hoje?', ativo:true },
  { id:'2', gatilho:'consulta|agendar|horário|marcar', resposta:'Ótimo! Para agendar sua consulta, preciso de algumas informações. Você já é paciente da nossa clínica?', ativo:true },
  { id:'3', gatilho:'exame|resultado|laudo', resposta:'Pode enviar seus exames por aqui. Nossa equipe irá analisar e retornaremos em até 48h úteis.', ativo:true },
  { id:'4', gatilho:'preço|valor|quanto custa|convênio', resposta:'As consultas são particulares. Para valores e disponibilidade, acesse nossa agenda online ou aguarde nosso contato.', ativo:true },
  { id:'5', gatilho:'urgência|emergência|dor forte', resposta:'Em caso de emergência, ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo. Este canal é para consultas eletivas.', ativo:true },
]

const CONFIG_DEFAULT: ConfigAgente = {
  nome: 'Assistente PRAXIS',
  saudacao: 'Olá! Sou o assistente virtual da clínica — Clínico-Geral, Endocrinologista e Nutrólogo. Como posso ajudar?',
  despedida: 'Obrigado pelo contato! Nossa equipe está à disposição. Até logo! 👨‍⚕️',
  horario_inicio: '08:00', horario_fim: '18:00',
  dias_semana: ['seg','ter','qua','qui','sex'],
  tempo_resposta: '30', n8n_webhook: '', medx_token: '', numero_whatsapp: '',
}

const inp: React.CSSProperties = { background:D.card, border:`1px solid ${D.border}`, color:D.text, borderRadius:7, padding:'9px 13px', fontSize:13, width:'100%', fontFamily:D.font, outline:'none' }
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:7, fontFamily:D.mono }}>{children}</div>
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background:D.card, border:`1px solid ${D.border}`, borderRadius:10, padding:'20px 22px', ...style }}>{children}</div>
}
function Badge({ label, color, bg }: { label:string; color:string; bg:string }) {
  return <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, color, background:bg, fontFamily:D.mono, letterSpacing:1 }}>{label}</span>
}
function Toggle({ value, onChange }: { value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width:42, height:22, borderRadius:11, background:value?D.accent:D.border, border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:3, left:value?22:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
    </button>
  )
}

export default function WhatsAppPage() {
  const [tab, setTab]           = useState<TabId>('visao-geral')
  const [status, setStatus]     = useState<StatusAgente>('configurando')
  const [fluxos, setFluxos]     = useState<FluxoItem[]>(FLUXOS_DEFAULT)
  const [respostas, setRespostas] = useState<RespostaRapida[]>(RESPOSTAS_DEFAULT)
  const [config, setConfig]     = useState<ConfigAgente>(CONFIG_DEFAULT)
  const [saved, setSaved]       = useState(false)
  const [isMob, setIsMob]       = useState(false)
  const [novaResposta, setNovaResposta] = useState({ gatilho:'', resposta:'' })
  const [showNovaResposta, setShowNovaResposta] = useState(false)

  useEffect(() => { setIsMob(window.innerWidth < 768) }, [])

  const salvarConfig = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleFluxo = (id: string) => {
    setFluxos(prev => prev.map(f => f.id === id ? { ...f, ativo: !f.ativo } : f))
  }

  const statusConfig = {
    ativo:        { label:'AGENTE ATIVO',       color:D.accent, bg:D.adim,  border:D.aborder },
    pausado:      { label:'AGENTE PAUSADO',      color:D.warn,   bg:D.wdim,  border:D.wborder },
    configurando: { label:'EM CONFIGURAÇÃO',     color:D.blue,   bg:D.bdim,  border:D.bborder },
  }
  const st = statusConfig[status]

  const TABS: { id:TabId; label:string; emoji:string }[] = [
    { id:'visao-geral',  label:'Visão Geral', emoji:'📊' },
    { id:'configuracao', label:'Configuração', emoji:'⚙️' },
    { id:'fluxos',       label:'Fluxos',      emoji:'🔀' },
    { id:'respostas',    label:'Respostas',   emoji:'💬' },
    { id:'integracao',   label:'Integração',  emoji:'🔌' },
  ]

  const fluxosAtivos = fluxos.filter(f => f.ativo).length

  return (
    <div className="min-h-screen" style={{ fontFamily:D.font, color:D.text }}>
      <MobileOnlyHeader title="Agente WhatsApp" />
      {/* Header */}
      <div className="border-b border-border bg-surface" style={{ padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:D.adim, border:`1px solid ${D.aborder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📱</div>
          <div>
            <h1 style={{ fontSize:17, fontWeight:700, color:D.text, margin:0 }}>Agente WhatsApp</h1>
            <p style={{ fontSize:10, color:D.muted, margin:'2px 0 0', fontFamily:D.mono, letterSpacing:1 }}>ASSISTENTE VIRTUAL · DR. BRUNO GUSTAVO</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:10, fontWeight:700, padding:'5px 12px', borderRadius:20, color:st.color, background:st.bg, border:`1px solid ${st.border}`, fontFamily:D.mono, letterSpacing:1 }}>
            ● {st.label}
          </span>
          <select value={status} onChange={e => setStatus(e.target.value as StatusAgente)}
            style={{ ...inp, width:'auto', fontSize:12, padding:'7px 12px' }}>
            <option value="ativo">Ativar Agente</option>
            <option value="pausado">Pausar Agente</option>
            <option value="configurando">Modo Configuração</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface border-b border-border" style={{ padding:'0 24px', display:'flex', gap:2, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'11px 16px', border:'none', borderBottom:tab===t.id?`2px solid ${D.accent}`:'2px solid transparent', background:'none', color:tab===t.id?D.accent:D.muted, fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase', letterSpacing:1.5, fontFamily:D.mono, whiteSpace:'nowrap', marginBottom:-1 }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:isMob?14:24 }}>

        {/* ── ABA VISÃO GERAL ── */}
        {tab === 'visao-geral' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Alerta de configuração */}
            {status === 'configurando' && (
              <div style={{ padding:'14px 18px', borderRadius:10, background:D.bdim, border:`1px solid ${D.bborder}`, display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:20 }}>⚙️</span>
                <div>
                  <div style={{ color:D.blue, fontWeight:700, fontSize:13, marginBottom:4 }}>Configure antes de ativar</div>
                  <div style={{ color:D.text2, fontSize:12, lineHeight:1.6 }}>
                    Preencha o webhook do n8n e o token do MedX na aba <strong style={{ color:D.text }}>Integração</strong>, depois ative os fluxos desejados em <strong style={{ color:D.text }}>Fluxos</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr 1fr':'repeat(4, 1fr)', gap:12 }}>
              {[
                { label:'Fluxos Ativos',       value:fluxosAtivos,             sub:'de '+fluxos.length+' disponíveis', color:D.accent, bg:D.adim },
                { label:'Respostas Rápidas',    value:respostas.filter(r=>r.ativo).length, sub:'configuradas', color:D.blue,   bg:D.bdim },
                { label:'Conversas Hoje',       value:'—',                      sub:'aguardando n8n',  color:D.warn,   bg:D.wdim },
                { label:'Pacientes Cadastrados',value:'—',                      sub:'via pré-cadastro',color:D.accent, bg:D.adim },
              ].map((s, i) => (
                <div key={i} style={{ padding:'16px 18px', borderRadius:10, background:D.card, border:`1px solid ${D.border}` }}>
                  <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:8, fontFamily:D.mono }}>{s.label}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:s.color, marginBottom:4 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:D.text2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Fluxos resumo */}
            <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'1fr 1fr', gap:12 }}>
              <Card>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:14, fontFamily:D.mono }}>Fluxos Configurados</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {fluxos.map(f => (
                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, background:f.ativo?D.adim:D.surface, border:`1px solid ${f.ativo?D.aborder:D.border}` }}>
                      <span style={{ fontSize:16 }}>{f.emoji}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:f.ativo?D.atext:D.text2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.nome}</div>
                        <div style={{ fontSize:10, color:D.muted, fontFamily:D.mono }}>{f.passos} passos</div>
                      </div>
                      <Badge label={f.ativo?'ATIVO':'OFF'} color={f.ativo?D.atext:D.muted} bg={f.ativo?D.adim:'none'} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:14, fontFamily:D.mono }}>Checklist de Configuração</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    { label:'Número WhatsApp cadastrado', done: !!config.numero_whatsapp },
                    { label:'Webhook n8n configurado',    done: !!config.n8n_webhook },
                    { label:'Token MedX inserido',        done: !!config.medx_token },
                    { label:'Pelo menos 1 fluxo ativo',   done: fluxosAtivos > 0 },
                    { label:'Respostas rápidas ativas',   done: respostas.some(r=>r.ativo) },
                    { label:'Mensagem de saudação definida', done: !!config.saudacao },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{item.done?'✅':'⬜'}</span>
                      <span style={{ fontSize:13, color:item.done?D.text:D.text2 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Próximos passos */}
            <Card>
              <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:14, fontFamily:D.mono }}>Próximos Passos para Ativar</div>
              <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'1fr 1fr 1fr', gap:12 }}>
                {[
                  { n:'1', titulo:'Configurar n8n', desc:'Instale o n8n no Railway.app e cole o webhook abaixo na aba Integração.', url:'https://railway.app', label:'Abrir Railway' },
                  { n:'2', titulo:'Obter API MedX', desc:'Contate o suporte MedX pelo (21) 97225-5372 e solicite o código de assinante.', url:'https://wa.me/5521972255372', label:'Contatar MedX' },
                  { n:'3', titulo:'Ativar Fluxos', desc:'Acesse a aba Fluxos, ative os que deseja e clique em Salvar Configuração.', url:'#', label:'Ir para Fluxos' },
                ].map(step => (
                  <div key={step.n} style={{ padding:'16px', borderRadius:9, background:D.surface, border:`1px solid ${D.border}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:D.adim, border:`1px solid ${D.aborder}`, display:'flex', alignItems:'center', justifyContent:'center', color:D.atext, fontWeight:800, fontSize:13, fontFamily:D.mono, flexShrink:0 }}>{step.n}</div>
                      <div style={{ fontWeight:700, fontSize:13, color:D.text }}>{step.titulo}</div>
                    </div>
                    <div style={{ fontSize:12, color:D.text2, lineHeight:1.6, marginBottom:12 }}>{step.desc}</div>
                    <a href={step.url} target="_blank" rel="noreferrer"
                      style={{ display:'inline-block', padding:'6px 14px', borderRadius:6, background:D.adim, border:`1px solid ${D.aborder}`, color:D.atext, fontSize:11, fontWeight:700, textDecoration:'none', fontFamily:D.mono }}>
                      {step.label} →
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── ABA CONFIGURAÇÃO ── */}
        {tab === 'configuracao' && (
          <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'1fr 1fr', gap:16 }}>
            <Card>
              <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:16, fontFamily:D.mono }}>Identidade do Agente</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <Label>Nome do Agente</Label>
                  <input value={config.nome} onChange={e => setConfig(p=>({...p,nome:e.target.value}))} style={inp}/>
                </div>
                <div>
                  <Label>Número WhatsApp (com DDD)</Label>
                  <input value={config.numero_whatsapp} onChange={e => setConfig(p=>({...p,numero_whatsapp:e.target.value}))} placeholder="Ex: 5535999999999" style={inp}/>
                </div>
                <div>
                  <Label>Mensagem de Saudação</Label>
                  <textarea value={config.saudacao} onChange={e => setConfig(p=>({...p,saudacao:e.target.value}))} rows={4} style={{...inp, resize:'none', display:'block', lineHeight:1.6}}/>
                </div>
                <div>
                  <Label>Mensagem de Despedida</Label>
                  <textarea value={config.despedida} onChange={e => setConfig(p=>({...p,despedida:e.target.value}))} rows={3} style={{...inp, resize:'none', display:'block', lineHeight:1.6}}/>
                </div>
              </div>
            </Card>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <Card>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:16, fontFamily:D.mono }}>Horário de Atendimento</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  <div>
                    <Label>Início</Label>
                    <input type="time" value={config.horario_inicio} onChange={e => setConfig(p=>({...p,horario_inicio:e.target.value}))} style={inp}/>
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <input type="time" value={config.horario_fim} onChange={e => setConfig(p=>({...p,horario_fim:e.target.value}))} style={inp}/>
                  </div>
                </div>
                <Label>Dias da Semana</Label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[['seg','Seg'],['ter','Ter'],['qua','Qua'],['qui','Qui'],['sex','Sex'],['sab','Sáb'],['dom','Dom']].map(([v,l]) => {
                    const on = config.dias_semana.includes(v)
                    return (
                      <button key={v} onClick={() => setConfig(p=>({ ...p, dias_semana: on ? p.dias_semana.filter(d=>d!==v) : [...p.dias_semana, v] }))}
                        style={{ padding:'6px 12px', borderRadius:6, border:`1px solid ${on?D.aborder:D.border}`, background:on?D.adim:'none', color:on?D.atext:D.muted, fontWeight:700, fontSize:11, cursor:'pointer', fontFamily:D.mono }}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </Card>
              <Card>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:16, fontFamily:D.mono }}>Tempo de Resposta</div>
                <Label>Tempo máximo para resposta automática (segundos)</Label>
                <input type="number" value={config.tempo_resposta} onChange={e => setConfig(p=>({...p,tempo_resposta:e.target.value}))} style={{...inp, width:120}} min={5} max={300}/>
                <div style={{ fontSize:11, color:D.muted, marginTop:8 }}>Mensagens fora do horário recebem resposta automática informando o horário de atendimento.</div>
              </Card>
              <button onClick={salvarConfig}
                style={{ padding:'12px', borderRadius:9, background:saved?D.adim:D.accent, border:`1px solid ${saved?D.aborder:D.accent}`, color:saved?D.atext:'var(--background)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:D.font, transition:'all 0.2s' }}>
                {saved ? '✓ Configuração salva!' : '💾 Salvar Configuração'}
              </button>
            </div>
          </div>
        )}

        {/* ── ABA FLUXOS ── */}
        {tab === 'fluxos' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ padding:'12px 16px', borderRadius:9, background:D.adim, border:`1px solid ${D.aborder}`, fontSize:12, color:D.text2, lineHeight:1.6 }}>
              <strong style={{ color:D.atext }}>Como funcionam os fluxos:</strong> Cada fluxo é uma conversa automatizada no WhatsApp. Quando ativo, o agente guia o paciente pelos passos automaticamente via n8n. Ative apenas os fluxos que já estão configurados no n8n.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {fluxos.map(f => (
                <div key={f.id} style={{ background:D.card, border:`1px solid ${f.ativo?D.aborder:D.border}`, borderRadius:10, padding:'18px 20px', borderLeft:`4px solid ${f.ativo?D.accent:D.border}` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                    <span style={{ fontSize:28, flexShrink:0 }}>{f.emoji}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:f.ativo?D.text:D.text2 }}>{f.nome}</span>
                        <Badge label={f.ativo?'ATIVO':'INATIVO'} color={f.ativo?D.atext:D.muted} bg={f.ativo?D.adim:'none'} />
                        <span style={{ fontSize:10, color:D.muted, fontFamily:D.mono }}>{f.passos} passos</span>
                      </div>
                      <div style={{ fontSize:12, color:D.text2, lineHeight:1.6 }}>{f.descricao}</div>
                    </div>
                    <Toggle value={f.ativo} onChange={() => toggleFluxo(f.id)} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={salvarConfig}
              style={{ padding:'12px', borderRadius:9, background:saved?D.adim:D.accent, border:`1px solid ${saved?D.aborder:D.accent}`, color:saved?D.atext:'var(--background)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:D.font }}>
              {saved ? '✓ Salvo!' : '💾 Salvar Fluxos'}
            </button>
          </div>
        )}

        {/* ── ABA RESPOSTAS RÁPIDAS ── */}
        {tab === 'respostas' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <div style={{ fontSize:12, color:D.text2, lineHeight:1.6 }}>
                Palavras-chave que ativam respostas automáticas. Separe variações com <code style={{ background:D.card, padding:'1px 6px', borderRadius:4, color:D.atext, fontFamily:D.mono }}>|</code>
              </div>
              <button onClick={() => setShowNovaResposta(true)}
                style={{ padding:'8px 16px', borderRadius:7, background:D.adim, border:`1px solid ${D.aborder}`, color:D.atext, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:D.font }}>
                + Nova Resposta
              </button>
            </div>

            {showNovaResposta && (
              <Card style={{ border:`1px solid ${D.aborder}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:D.atext, letterSpacing:3, textTransform:'uppercase', marginBottom:14, fontFamily:D.mono }}>Nova Resposta Rápida</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <Label>Gatilhos (separe com |)</Label>
                    <input value={novaResposta.gatilho} onChange={e => setNovaResposta(p=>({...p,gatilho:e.target.value}))} placeholder="Ex: consulta|agendar|marcar" style={inp}/>
                  </div>
                  <div>
                    <Label>Resposta Automática</Label>
                    <textarea value={novaResposta.resposta} onChange={e => setNovaResposta(p=>({...p,resposta:e.target.value}))} rows={3} placeholder="Mensagem enviada quando o gatilho for detectado..." style={{...inp,resize:'none',display:'block',lineHeight:1.6}}/>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => {
                      if (novaResposta.gatilho && novaResposta.resposta) {
                        setRespostas(prev => [...prev, { id:Date.now().toString(), ...novaResposta, ativo:true }])
                        setNovaResposta({ gatilho:'', resposta:'' })
                        setShowNovaResposta(false)
                      }
                    }} style={{ flex:1, padding:'9px', borderRadius:7, background:D.accent, border:'none', color:'var(--background)', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:D.font }}>
                      Adicionar
                    </button>
                    <button onClick={() => setShowNovaResposta(false)}
                      style={{ padding:'9px 16px', borderRadius:7, background:'none', border:`1px solid ${D.border}`, color:D.muted, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:D.font }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {respostas.map(r => (
              <div key={r.id} style={{ background:D.card, border:`1px solid ${r.ativo?D.border:D.border}`, borderRadius:10, padding:'16px 18px', opacity:r.ativo?1:0.5 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:2, marginBottom:6, fontFamily:D.mono }}>GATILHOS</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
                      {r.gatilho.split('|').map((g,i) => (
                        <span key={i} style={{ fontSize:11, padding:'3px 9px', borderRadius:5, background:D.surface, border:`1px solid ${D.border}`, color:D.atext, fontFamily:D.mono }}>{g.trim()}</span>
                      ))}
                    </div>
                    <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:2, marginBottom:6, fontFamily:D.mono }}>RESPOSTA</div>
                    <div style={{ fontSize:13, color:D.text2, lineHeight:1.6 }}>{r.resposta}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <Toggle value={r.ativo} onChange={v => setRespostas(prev => prev.map(x => x.id===r.id?{...x,ativo:v}:x))} />
                    <button onClick={() => setRespostas(prev => prev.filter(x => x.id!==r.id))}
                      style={{ width:28, height:28, borderRadius:6, background:'none', border:`1px solid ${D.border}`, color:D.muted, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ABA INTEGRAÇÃO ── */}
        {tab === 'integracao' && (
          <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'1fr 1fr', gap:16 }}>

            {/* n8n */}
            <Card style={{ border:`1px solid ${config.n8n_webhook?D.aborder:D.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:24 }}>⚡</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:D.text }}>n8n</div>
                  <div style={{ fontSize:10, color:config.n8n_webhook?D.atext:D.muted, fontFamily:D.mono }}>
                    {config.n8n_webhook ? '● CONECTADO' : '○ NÃO CONFIGURADO'}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <Label>URL do Webhook n8n</Label>
                  <input value={config.n8n_webhook} onChange={e => setConfig(p=>({...p,n8n_webhook:e.target.value}))}
                    placeholder="https://n8n-production-xxxx.up.railway.app/webhook/whatsapp" style={inp}/>
                  <div style={{ fontSize:11, color:D.muted, marginTop:6, lineHeight:1.6 }}>Cole a URL gerada no Railway após instalar o n8n.</div>
                </div>
                <div style={{ padding:'12px 14px', borderRadius:8, background:D.surface, border:`1px solid ${D.border}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:D.text, marginBottom:6 }}>Como obter a URL:</div>
                  <ol style={{ fontSize:11, color:D.text2, margin:0, paddingLeft:16, lineHeight:1.8 }}>
                    <li>Acesse <a href="https://railway.app" target="_blank" rel="noreferrer" style={{ color:D.atext }}>railway.app</a> e instale o template n8n</li>
                    <li>Copie a URL pública gerada</li>
                    <li>No n8n, crie um workflow com Trigger Webhook</li>
                    <li>Cole a URL completa do webhook aqui</li>
                  </ol>
                </div>
              </div>
            </Card>

            {/* MedX */}
            <Card style={{ border:`1px solid ${config.medx_token?D.aborder:D.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ fontSize:24 }}>🏥</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:D.text }}>MedX</div>
                  <div style={{ fontSize:10, color:config.medx_token?D.atext:D.muted, fontFamily:D.mono }}>
                    {config.medx_token ? '● CONECTADO' : '○ NÃO CONFIGURADO'}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <Label>Token de Integração MedX</Label>
                  <input value={config.medx_token} onChange={e => setConfig(p=>({...p,medx_token:e.target.value}))}
                    placeholder="Cole seu token de integração aqui" type="password" style={inp}/>
                  <div style={{ fontSize:11, color:D.muted, marginTop:6, lineHeight:1.6 }}>Encontrado em: MedX → Configurações → Integrações → Token</div>
                </div>
                <div style={{ padding:'12px 14px', borderRadius:8, background:D.surface, border:`1px solid ${D.border}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:D.text, marginBottom:6 }}>Funcionalidades habilitadas com MedX:</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {['Criar prontuário de novo paciente','Buscar agenda disponível','Enviar lista de exames assinada digitalmente','Confirmar agendamentos','Enviar receitas e atestados'].map((item,i) => (
                      <div key={i} style={{ fontSize:11, color:D.text2, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:config.medx_token?D.accent:D.border }}>●</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Fluxo do pré-cadastro */}
            <div style={{ gridColumn:isMob?'1':'1 / -1' }}>
              <Card>
                <div style={{ fontSize:10, fontWeight:700, color:D.muted, letterSpacing:3, textTransform:'uppercase', marginBottom:16, fontFamily:D.mono }}>Fluxo: Pré-cadastro + Lista de Exames</div>
                <div style={{ display:'grid', gridTemplateColumns:isMob?'1fr':'repeat(5, 1fr)', gap:8, alignItems:'center' }}>
                  {[
                    { emoji:'👋', titulo:'Paciente envia "Olá"', sub:'WhatsApp' },
                    { emoji:'📝', titulo:'Agente coleta dados', sub:'Nome, CPF, queixa' },
                    { emoji:'🧠', titulo:'Claude gera lista de exames', sub:'Personalizada' },
                    { emoji:'🏥', titulo:'n8n cria paciente no MedX', sub:'Prontuário automático' },
                    { emoji:'📄', titulo:'MedX envia lista assinada', sub:'Assinatura digital' },
                  ].map((step, i) => (
                    <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                      {i > 0 && !isMob && <div style={{ position:'absolute', marginLeft:-20, fontSize:16, color:D.muted }}>→</div>}
                      <div style={{ width:48, height:48, borderRadius:12, background:D.adim, border:`1px solid ${D.aborder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                        {step.emoji}
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:D.text, lineHeight:1.3 }}>{step.titulo}</div>
                        <div style={{ fontSize:10, color:D.muted, fontFamily:D.mono, marginTop:2 }}>{step.sub}</div>
                      </div>
                      {i < 4 && isMob && <div style={{ fontSize:20, color:D.muted }}>↓</div>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <button onClick={salvarConfig} style={{ gridColumn:isMob?'1':'1 / -1', padding:'12px', borderRadius:9, background:saved?D.adim:D.accent, border:`1px solid ${saved?D.aborder:D.accent}`, color:saved?D.atext:'var(--background)', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:D.font }}>
              {saved ? '✓ Configuração salva!' : '💾 Salvar Integrações'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
