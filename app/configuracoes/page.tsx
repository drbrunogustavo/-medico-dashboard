"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Mail, ExternalLink, Download, Wifi } from "lucide-react"
import { Panel, PxButton, PxInput, PxCheckbox, Segmented, Field, Tag, PxModal, PageHeader } from "@/components/px"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

type Aba = "integracoes" | "notificacoes" | "seguranca" | "membros" | "plano"

interface TeamPermission {
  id: string; member_id: string; owner_id: string
  agenda_ver: boolean; agenda_editar: boolean; copiloto: boolean
  prontuario_ver: boolean; prontuario_escrever: boolean
  crm_ver: boolean; crm_editar: boolean
  financeiro_ver: boolean; financeiro_editar: boolean
  nps_ver: boolean; indicacoes_ver: boolean
  marketing_ver: boolean; marketing_usar: boolean
  configuracoes: boolean; gerenciar_membros: boolean
  updated_at: string
}
interface TeamMember {
  id: string; owner_id: string; user_id: string | null; email: string; nome: string
  cargo?: string | null; status: "pendente" | "ativo"; invite_token: string | null; created_at: string
  team_permissions: TeamPermission[]
}

const ABAS: { value: Aba; label: string }[] = [
  { value: "integracoes", label: "Integrações" },
  { value: "notificacoes", label: "Notificações" },
  { value: "seguranca", label: "Segurança" },
  { value: "membros", label: "Membros" },
  { value: "plano", label: "Plano" },
]

const erroBox = "rounded-px-card bg-px-danger-soft px-3 py-2 text-[13px] text-px-danger"

/* ───────────── Integrações ───────────── */

const INTEGRACOES = [
  { id: "zapi", name: "Z-API e WhatsApp", desc: "Automação de mensagens e nutrição de leads",
    fields: [{ key: "instance_id", label: "Instance ID", placeholder: "sua-instancia-123" }, { key: "token", label: "Token", placeholder: "Token da instância", secret: true }] },
  { id: "instagram", name: "Instagram (Meta)", desc: "Análise de desempenho de posts e stories",
    fields: [{ key: "page_id", label: "Page ID", placeholder: "123456789" }, { key: "access_token", label: "Access Token", placeholder: "EAAB...", secret: true }] },
  { id: "stripe", name: "Stripe", desc: "Gestão de pagamentos e assinaturas",
    fields: [{ key: "secret_key", label: "Secret Key", placeholder: "sk_live_...", secret: true }, { key: "webhook_secret", label: "Webhook Secret", placeholder: "whsec_...", secret: true }] },
  { id: "resend", name: "Resend (e-mail)", desc: "Envio de e-mails automáticos e campanhas",
    fields: [{ key: "api_key", label: "API Key", placeholder: "re_...", secret: true }, { key: "from_email", label: "E-mail remetente", placeholder: "noreply@suaclinica.com.br" }] },
  { id: "medx", name: "MedX", desc: "Prontuário eletrônico e agenda de consultas",
    fields: [{ key: "url", label: "URL do servidor", placeholder: "https://seu-servidor.medx" }, { key: "integration_token", label: "Token de integração", placeholder: "Token", secret: true }] },
] as const

type IntegState = Record<string, Record<string, string>>
interface ZapiTest { ok: boolean; connected?: boolean; smartphoneConnected?: boolean; error?: string }

function TabIntegracoes() {
  const [values, setValues] = useState<IntegState>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, { ok: boolean; texto: string }>>({})
  const [servidor, setServidor] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [testando, setTestando] = useState(false)
  const [zapi, setZapi] = useState<ZapiTest | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true); setErro(false)
    try {
      const [a, b] = await Promise.all([fetch("/api/integracoes"), fetch("/api/integrations/status")])
      if (!a.ok || !b.ok) throw new Error(`HTTP ${a.status}/${b.status}`)
      const rows = await a.json() as Array<{ tipo: string; config: Record<string, string> }>
      const vals: IntegState = {}
      rows.forEach(r => { vals[r.tipo] = r.config })
      setValues(vals); setServidor(await b.json())
    } catch (e) {
      console.error("[configuracoes] erro ao carregar integrações:", e); setErro(true)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const set = (id: string, key: string, v: string) => setValues(s => ({ ...s, [id]: { ...(s[id] ?? {}), [key]: v } }))

  async function salvar(id: string) {
    setSaving(id); setMsg(m => { const n = { ...m }; delete n[id]; return n })
    try {
      const r = await fetch("/api/integracoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: id, config: values[id] ?? {} }) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setMsg(m => ({ ...m, [id]: { ok: true, texto: "Credenciais salvas." } }))
    } catch (e) {
      console.error("[configuracoes] erro ao salvar integração:", e)
      setMsg(m => ({ ...m, [id]: { ok: false, texto: "Não foi possível salvar. Tente novamente." } }))
    } finally { setSaving(null) }
  }

  async function testarZapi() {
    setTestando(true); setZapi(null)
    try {
      const r = await fetch("/api/integrations/zapi-test", { method: "POST" })
      setZapi(await r.json() as ZapiTest)
    } catch { setZapi({ ok: false, error: "Erro de conexão" }) }
    finally { setTestando(false) }
  }

  if (loading) return <p role="status" className="py-10 text-center text-[13px] text-px-muted">Carregando integrações</p>
  if (erro) return (
    <Panel className="space-y-3 py-8 text-center">
      <p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar as integrações.</p>
      <div><PxButton onClick={carregar}>Tentar novamente</PxButton></div>
    </Panel>
  )

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-px-muted">O estado de cada conexão vem das variáveis do servidor. Salvar credenciais aqui não altera esse estado.</p>
      {INTEGRACOES.map(integ => (
        <Panel as="section" key={integ.id} className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-px-ink">{integ.name}</h2>
              <p className="text-[13px] text-px-muted">{integ.desc}</p>
            </div>
            <Tag tone={servidor[integ.id] ? "ok" : "neutral"}>{servidor[integ.id] ? "Ativa no servidor" : "Sem configuração no servidor"}</Tag>
          </div>
          {integ.fields.map(f => {
            const fid = `${integ.id}-${f.key}`
            const secreto = "secret" in f && f.secret
            const visivel = show[fid]
            return (
              <Field key={f.key} label={f.label} htmlFor={fid}>
                <div className="flex gap-2">
                  <PxInput id={fid} type={secreto && !visivel ? "password" : "text"} autoComplete="off" placeholder={f.placeholder}
                    value={values[integ.id]?.[f.key] ?? ""} onChange={e => set(integ.id, f.key, e.target.value)} className="font-mono" />
                  {secreto && <PxButton variant="quiet" aria-pressed={!!visivel} onClick={() => setShow(s => ({ ...s, [fid]: !s[fid] }))}>{visivel ? "Ocultar" : "Mostrar"}</PxButton>}
                </div>
              </Field>
            )
          })}
          <div className="flex flex-wrap items-center gap-2">
            <PxButton loading={saving === integ.id} onClick={() => salvar(integ.id)}>Salvar credenciais</PxButton>
            {integ.id === "zapi" && <PxButton variant="secondary" leftIcon={Wifi} loading={testando} onClick={testarZapi}>Testar conexão</PxButton>}
          </div>
          {msg[integ.id] && <p role={msg[integ.id].ok ? "status" : "alert"} className={msg[integ.id].ok ? "text-[13px] text-px-ok" : erroBox}>{msg[integ.id].texto}</p>}
          {integ.id === "zapi" && zapi && (
            <p role="status" className={`rounded-px-card px-3 py-2 text-[13px] ${zapi.ok && zapi.connected ? "bg-px-ok-soft text-px-ok" : zapi.ok ? "bg-px-warn-soft text-px-warn" : "bg-px-danger-soft text-px-danger"}`}>
              {zapi.ok && zapi.connected
                ? `WhatsApp conectado, ${zapi.smartphoneConnected ? "smartphone pareado" : "smartphone não detectado"}.`
                : zapi.ok ? "Instância encontrada, mas o WhatsApp está desconectado. Escaneie o QR code no painel da Z-API."
                : zapi.error ?? "Erro desconhecido"}
            </p>
          )}
        </Panel>
      ))}
    </div>
  )
}

/* ───────────── Notificações ───────────── */

function TabNotificacoes() {
  return (
    <Panel as="section" className="space-y-3">
      <h2 className="text-[15px] font-semibold text-px-ink">Preferências por tipo de alerta</h2>
      <p className="text-[13px] leading-relaxed text-px-muted">Esta escolha ainda não existe: o sistema não guarda quais alertas você quer receber, então os avisos seguem a configuração padrão.</p>
      <div><PxButton variant="secondary" href="/notificacoes">Ver minhas notificações</PxButton></div>
    </Panel>
  )
}

/* ───────────── Segurança ───────────── */

interface Sessao { id: string; device: string; ip: string; time: string; atual: boolean }

function TabSeguranca() {
  const [atual, setAtual] = useState(""); const [nova, setNova] = useState(""); const [conf, setConf] = useState("")
  const [ver, setVer] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState("")
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [sessLoading, setSessLoading] = useState(true)
  const [sessErro, setSessErro] = useState(false)

  useEffect(() => {
    fetch("/api/auth/sessions")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((d: unknown) => setSessoes(Array.isArray(d) ? d as Sessao[] : []))
      .catch(e => { console.error("[configuracoes] erro ao carregar sessões:", e); setSessErro(true) })
      .finally(() => setSessLoading(false))
  }, [])

  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setOk(false)
    if (!atual || !nova || !conf) { setErro("Preencha todos os campos."); return }
    if (nova.length < 8) { setErro("A nova senha precisa ter ao menos 8 caracteres."); return }
    if (nova !== conf) { setErro("Nova senha e confirmação não coincidem."); return }
    if (nova === atual) { setErro("A nova senha precisa ser diferente da atual."); return }
    setSalvando(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("sem usuário")
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: atual })
      if (e1) { setErro("A senha atual está incorreta."); return }
      const { error: e2 } = await supabase.auth.updateUser({ password: nova })
      if (e2) { setErro("Não foi possível alterar a senha. Tente novamente."); return }
      setOk(true); setAtual(""); setNova(""); setConf("")
    } catch (err) {
      console.error("[configuracoes] erro ao trocar senha:", err)
      setErro("Não foi possível alterar a senha. Tente novamente.")
    } finally { setSalvando(false) }
  }

  const tipo = ver ? "text" : "password"
  return (
    <div className="space-y-3">
      <Panel as="section">
        <form onSubmit={trocarSenha} className="space-y-4">
          <h2 className="text-[15px] font-semibold text-px-ink">Alterar senha</h2>
          <Field label="Senha atual" htmlFor="s-atual"><PxInput id="s-atual" type={tipo} autoComplete="current-password" value={atual} onChange={e => setAtual(e.target.value)} /></Field>
          <Field label="Nova senha" htmlFor="s-nova" hint="Mínimo de 8 caracteres."><PxInput id="s-nova" type={tipo} autoComplete="new-password" value={nova} onChange={e => setNova(e.target.value)} /></Field>
          <Field label="Confirmar nova senha" htmlFor="s-conf"><PxInput id="s-conf" type={tipo} autoComplete="new-password" value={conf} onChange={e => setConf(e.target.value)} /></Field>
          <PxCheckbox label="Mostrar senhas" checked={ver} onChange={() => setVer(v => !v)} />
          {erro && <p role="alert" className={erroBox}>{erro}</p>}
          {ok && <p role="status" className="text-[13px] text-px-ok">Senha alterada.</p>}
          <PxButton type="submit" loading={salvando}>Alterar senha</PxButton>
        </form>
      </Panel>

      <Panel as="section" className="space-y-3">
        <h2 className="text-[15px] font-semibold text-px-ink">Sessão atual</h2>
        {sessLoading ? <p role="status" className="text-[13px] text-px-muted">Carregando</p>
          : sessErro ? <p role="alert" className={erroBox}>Não foi possível carregar a sessão.</p>
          : sessoes.length === 0 ? <p className="text-[13px] text-px-muted">Nenhuma sessão encontrada.</p>
          : <ul className="space-y-2">{sessoes.map(s => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[14px] font-medium text-px-ink">{s.device}</p><p className="text-[12.5px] text-px-muted">Iniciada em {s.time}</p></div>
                {s.atual && <Tag tone="ink">Este dispositivo</Tag>}
              </li>))}</ul>}
        <p className="text-[12.5px] text-px-muted">O Supabase não permite listar nem encerrar sessões de outros dispositivos por aqui.</p>
      </Panel>

      <Panel as="section" className="space-y-1">
        <h2 className="text-[15px] font-semibold text-px-ink">Autenticação em duas etapas</h2>
        <p className="text-[13px] text-px-muted">Ainda não disponível.</p>
      </Panel>
    </div>
  )
}

/* ───────────── Membros ───────────── */

const PERM_SECTIONS = [
  { label: "Consultório", perms: [
    { key: "agenda_ver", label: "Agenda: ver" }, { key: "agenda_editar", label: "Agenda: editar" }, { key: "copiloto", label: "Copiloto de Consulta" },
    { key: "prontuario_ver", label: "Prontuários: ver" }, { key: "prontuario_escrever", label: "Prontuários: escrever" }] },
  { label: "Gestão", perms: [
    { key: "crm_ver", label: "CRM de Pacientes: ver" }, { key: "crm_editar", label: "CRM de Pacientes: editar" },
    { key: "financeiro_ver", label: "Financeiro: ver" }, { key: "financeiro_editar", label: "Financeiro: editar" },
    { key: "nps_ver", label: "Pesquisa NPS" }, { key: "indicacoes_ver", label: "Programa de Indicações" }] },
  { label: "Marketing", perms: [{ key: "marketing_ver", label: "Conteúdo: ver" }, { key: "marketing_usar", label: "Conteúdo: usar IA" }] },
]
const PERM_KEYS = ["agenda_ver","agenda_editar","copiloto","prontuario_ver","prontuario_escrever","crm_ver","crm_editar","financeiro_ver","financeiro_editar","nps_ver","indicacoes_ver","marketing_ver","marketing_usar","configuracoes","gerenciar_membros"] as const
const PERM_DEFAULT: Record<string, boolean> = { agenda_ver: true, crm_ver: true, marketing_ver: true }

function ConviteModal({ onClose, onSaved }: { onClose: () => void; onSaved: (m: TeamMember) => void }) {
  const [nome, setNome] = useState(""); const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false); const [erro, setErro] = useState("")

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) { setErro("Nome e e-mail são obrigatórios."); return }
    setLoading(true); setErro("")
    try {
      const r = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: nome.trim(), email: email.trim().toLowerCase() }) })
      const d = await r.json() as TeamMember & { error?: string }
      if (!r.ok) { setErro(d.error ?? "Não foi possível convidar."); return }
      onSaved(d); onClose()
    } catch { setErro("Erro de conexão.") }
    finally { setLoading(false) }
  }

  return (
    <PxModal open onClose={onClose} title="Convidar membro">
      <form onSubmit={enviar} className="space-y-4">
        <Field label="Nome completo" htmlFor="c-nome"><PxInput id="c-nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ana Paula" /></Field>
        <Field label="E-mail" htmlFor="c-email" hint="O convite vai para este e-mail. A pessoa precisa criar a conta com ele."><PxInput id="c-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@clinica.com" /></Field>
        {erro && <p role="alert" className={erroBox}>{erro}</p>}
        <div className="flex gap-2">
          <PxButton variant="quiet" onClick={onClose}>Cancelar</PxButton>
          <PxButton type="submit" loading={loading} fullWidth>Enviar convite</PxButton>
        </div>
      </form>
    </PxModal>
  )
}

function PermissoesModal({ member, onClose, onSaved }: { member: TeamMember; onClose: () => void; onSaved: (m: TeamMember) => void }) {
  const base = member.team_permissions?.[0]
  const [cargo, setCargo] = useState(member.cargo ?? "")
  const [perms, setPerms] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERM_KEYS.map(k => [k, (base as unknown as Record<string, boolean> | undefined)?.[k] ?? PERM_DEFAULT[k] ?? false])))
  const [loading, setLoading] = useState(false); const [erro, setErro] = useState("")

  async function salvar() {
    setLoading(true); setErro("")
    try {
      const r = await fetch("/api/team", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: member.id, cargo, permissions: perms }) })
      const d = await r.json() as Partial<TeamPermission> & { error?: string }
      if (!r.ok) { setErro(d.error ?? "Não foi possível salvar."); return }
      const atualizado = { id: base?.id ?? d.id ?? "", member_id: member.id, owner_id: member.owner_id, updated_at: new Date().toISOString(), ...perms } as unknown as TeamPermission
      onSaved({ ...member, cargo: cargo.trim() || undefined, team_permissions: [atualizado] }); onClose()
    } catch { setErro("Erro de conexão.") }
    finally { setLoading(false) }
  }

  return (
    <PxModal open onClose={onClose} title={`Permissões de ${member.nome}`}>
      <div className="space-y-5">
        <Field label="Função ou cargo" htmlFor="pm-cargo"><PxInput id="pm-cargo" value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Recepcionista, enfermeira, assistente" /></Field>
        {PERM_SECTIONS.map(sec => (
          <fieldset key={sec.label} className="space-y-2">
            <legend className="mb-1 text-[13px] font-semibold text-px-ink">{sec.label}</legend>
            {sec.perms.map(p => <PxCheckbox key={p.key} label={p.label} checked={perms[p.key] ?? false} onChange={() => setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))} />)}
          </fieldset>
        ))}
        {erro && <p role="alert" className={erroBox}>{erro}</p>}
        <div className="flex gap-2">
          <PxButton variant="quiet" onClick={onClose}>Cancelar</PxButton>
          <PxButton loading={loading} onClick={salvar} fullWidth>Salvar permissões</PxButton>
        </div>
      </div>
    </PxModal>
  )
}

function TabMembros() {
  const [membros, setMembros] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  const [convite, setConvite] = useState(false)
  const [editando, setEditando] = useState<TeamMember | null>(null)
  const [confirma, setConfirma] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [reenviado, setReenviado] = useState<string | null>(null)
  const [acaoErro, setAcaoErro] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setErroCarga(false)
    try {
      const r = await fetch("/api/team")
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d: unknown = await r.json()
      setMembros(Array.isArray(d) ? d as TeamMember[] : [])
    } catch (e) { console.error("[configuracoes] erro ao carregar membros:", e); setErroCarga(true) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function reenviar(id: string) {
    setOcupado(id); setAcaoErro("")
    try {
      const r = await fetch("/api/team/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ member_id: id }) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setReenviado(id); setTimeout(() => setReenviado(null), 3000)
    } catch (e) { console.error("[configuracoes] erro ao reenviar convite:", e); setAcaoErro("Não foi possível reenviar o convite.") }
    finally { setOcupado(null) }
  }

  async function remover(id: string) {
    if (confirma !== id) { setConfirma(id); return }
    setConfirma(null); setOcupado(id); setAcaoErro("")
    try {
      const r = await fetch(`/api/team?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setMembros(p => p.filter(m => m.id !== id))
    } catch (e) { console.error("[configuracoes] erro ao remover membro:", e); setAcaoErro("Não foi possível remover o membro.") }
    finally { setOcupado(null) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-px-muted">Quem pode acessar a clínica e o que cada pessoa vê.</p>
        <PxButton leftIcon={Plus} onClick={() => setConvite(true)}>Convidar membro</PxButton>
      </div>
      {acaoErro && <p role="alert" className={erroBox}>{acaoErro}</p>}
      {loading ? <p role="status" className="py-10 text-center text-[13px] text-px-muted">Carregando membros</p>
        : erroCarga ? <Panel className="space-y-3 py-8 text-center"><p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar a equipe.</p><div><PxButton onClick={carregar}>Tentar novamente</PxButton></div></Panel>
        : membros.length === 0 ? <Panel className="py-10 text-center"><p className="text-[14px] font-medium text-px-ink">Nenhum membro ainda</p><p className="text-[13px] text-px-muted">Convide sua equipe para trabalhar na plataforma.</p></Panel>
        : (
          <ul className="space-y-2">
            {membros.map(m => (
              <li key={m.id}><Panel as="article" className="flex flex-wrap items-center gap-3 !py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-px-ink">{m.nome}</p>
                  <p className="truncate text-[12.5px] text-px-muted">{m.email}{m.cargo ? `, ${m.cargo}` : ""}</p>
                </div>
                <Tag tone={m.status === "ativo" ? "ok" : "warn"}>{m.status === "ativo" ? "Ativo" : "Convite pendente"}</Tag>
                <div className="flex flex-wrap items-center gap-1">
                  {m.status === "pendente" && <PxButton variant="quiet" size="sm" leftIcon={Mail} loading={ocupado === m.id} onClick={() => reenviar(m.id)}>{reenviado === m.id ? "Reenviado" : "Reenviar"}</PxButton>}
                  <PxButton variant="quiet" size="sm" leftIcon={Pencil} onClick={() => setEditando(m)} aria-label={`Editar permissões de ${m.nome}`}>Permissões</PxButton>
                  {confirma === m.id ? (
                    <>
                      <PxButton variant="danger" size="sm" leftIcon={Trash2} onClick={() => remover(m.id)}>Confirmar remoção</PxButton>
                      <PxButton variant="quiet" size="sm" onClick={() => setConfirma(null)}>Cancelar</PxButton>
                    </>
                  ) : <PxButton variant="quiet" size="sm" leftIcon={Trash2} loading={ocupado === m.id} onClick={() => remover(m.id)} aria-label={`Remover ${m.nome}`}>Remover</PxButton>}
                </div>
              </Panel></li>
            ))}
          </ul>
        )}
      {convite && <ConviteModal onClose={() => setConvite(false)} onSaved={m => setMembros(p => [...p, m])} />}
      {editando && <PermissoesModal member={editando} onClose={() => setEditando(null)} onSaved={u => setMembros(p => p.map(m => m.id === u.id ? u : m))} />}
    </div>
  )
}

/* ───────────── Plano ───────────── */

interface PlanoUsuario { plano: string; status: string; assinatura_termina_em?: string | null; trial_termina_em?: string | null; hasStripe: boolean }
const NOME_PLANO: Record<string, string> = { trial: "Período de teste", starter: "Starter", pro: "Pro", elite: "Elite" }
const NOME_STATUS: Record<string, string> = { ativo: "Ativo", active: "Ativo", trialing: "Em teste", past_due: "Pagamento pendente", canceled: "Cancelado", cancelado: "Cancelado" }
const dataBR = (iso?: string | null) => { if (!iso) return null; const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("pt-BR") }

function TabPlano() {
  const [plano, setPlano] = useState<PlanoUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [abrindo, setAbrindo] = useState(false)
  const [portalErro, setPortalErro] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true); setErro(false)
    try {
      const r = await fetch("/api/planos")
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setPlano(await r.json())
    } catch (e) { console.error("[configuracoes] erro ao carregar plano:", e); setErro(true) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function abrirPortal() {
    setAbrindo(true); setPortalErro("")
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" })
      const d = await r.json().catch(() => ({})) as { url?: string; error?: string }
      if (!r.ok || !d.url || !/^https:\/\//.test(d.url)) { setPortalErro(d.error ?? "Não foi possível abrir o portal. Tente novamente."); return }
      window.location.href = d.url
    } catch { setPortalErro("Não foi possível abrir o portal. Tente novamente.") }
    finally { setAbrindo(false) }
  }

  if (loading) return <p role="status" className="py-10 text-center text-[13px] text-px-muted">Carregando plano</p>
  if (erro || !plano) return (
    <Panel className="space-y-3 py-8 text-center">
      <p role="alert" className="text-[14px] text-px-danger">Não foi possível carregar o plano.</p>
      <div><PxButton onClick={carregar}>Tentar novamente</PxButton></div>
    </Panel>
  )

  const fim = dataBR(plano.plano === "trial" ? plano.trial_termina_em : plano.assinatura_termina_em)
  return (
    <div className="space-y-3">
      <Panel as="section" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-semibold text-px-ink">{NOME_PLANO[plano.plano] ?? plano.plano}</h2>
            <p className="text-[13px] text-px-muted">{NOME_STATUS[plano.status] ?? plano.status}{fim ? `. ${plano.plano === "trial" ? "O teste termina" : "Vigente até"} ${fim}.` : "."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {plano.hasStripe && <PxButton variant="secondary" leftIcon={ExternalLink} loading={abrindo} onClick={abrirPortal}>Gerenciar no Stripe</PxButton>}
            <PxButton href="/planos">Ver planos</PxButton>
          </div>
        </div>
        {portalErro && <p role="alert" className={erroBox}>{portalErro}</p>}
        <p className="text-[12.5px] text-px-muted">Faturas e forma de pagamento ficam no portal do Stripe.</p>
      </Panel>

      <Panel as="section" className="space-y-3">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-px-ink" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold text-px-ink">Exportar meus dados</h2>
            <p className="text-[13px] text-px-muted">Baixe pacientes, leads, financeiro e outros registros quando quiser.</p>
          </div>
        </div>
        <div><PxButton variant="secondary" href="/exportar">Exportar dados</PxButton></div>
      </Panel>
    </div>
  )
}

/* ───────────── Página ───────────── */

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<Aba>("integracoes")
  useEffect(() => {
    const pedida = new URLSearchParams(window.location.search).get("aba")
    const valida = ABAS.find(a => a.value === pedida)
    if (valida) setAba(valida.value)
  }, [])
  return (
    <div className="animate-fade-in">
      <PageHeader title="Configurações" caption="Integrações, segurança, equipe e plano" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 md:px-10">
        <Segmented label="Seção de configurações" value={aba} onChange={setAba} options={ABAS} />
        {aba === "integracoes" && <TabIntegracoes />}
        {aba === "notificacoes" && <TabNotificacoes />}
        {aba === "seguranca" && <TabSeguranca />}
        {aba === "membros" && <TabMembros />}
        {aba === "plano" && <TabPlano />}
      </div>
    </div>
  )
}
