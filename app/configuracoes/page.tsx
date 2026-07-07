"use client"

import { useState, useEffect } from "react"
import { TopBar } from "@/components/TopBar"
import { cn } from "@/lib/utils"
import {
  Plug, Bell, Palette, Shield, Users, CreditCard,
  CheckCircle2, XCircle, ChevronRight, ExternalLink,
  Eye, EyeOff, Loader2, AlertTriangle, Download, Wifi,
} from "lucide-react"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "integracoes" | "notificacoes" | "aparencia" | "seguranca" | "membros" | "faturamento"

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "integracoes",   label: "Integrações",    icon: Plug        },
  { id: "notificacoes",  label: "Notificações",   icon: Bell        },
  { id: "aparencia",     label: "Aparência",      icon: Palette     },
  { id: "seguranca",     label: "Segurança",      icon: Shield      },
  { id: "membros",       label: "Membros",        icon: Users       },
  { id: "faturamento",   label: "Plano",          icon: CreditCard  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-mono font-semibold tracking-[2px] uppercase mb-3"
      style={{ color: "var(--text-muted)" }}>
      {children}
    </h3>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-xl border", className)}
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {children}
    </div>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <div>
        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "w-10 h-5.5 rounded-full relative transition-all duration-200 flex-shrink-0",
      )}
      style={{
        width: 40, height: 22,
        background: checked ? "var(--accent)" : "var(--border)",
      }}
      aria-checked={checked}
      role="switch">
      <span
        className="absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{
          width: 18, height: 18,
          transform: checked ? "translateX(18px)" : "translateX(0)",
        }}
      />
    </button>
  )
}

// ─── Tab: Integrações ─────────────────────────────────────────────────────────

const INTEGRACOES = [
  {
    id: "zapi",
    name: "Zapi / WhatsApp",
    desc: "Automação de mensagens e nurturing de leads",
    connected: false,
    color: "#25D366",
    fields: [{ key: "instance_id", label: "Instance ID", placeholder: "sua-instancia-123" },
             { key: "token",       label: "Token",       placeholder: "Bearer xxxxxxxx",  type: "password" }],
  },
  {
    id: "instagram",
    name: "Instagram Meta",
    desc: "Análise de desempenho de posts e stories",
    connected: false,
    color: "#e1306c",
    fields: [{ key: "page_id",     label: "Page ID",      placeholder: "123456789" },
             { key: "access_token",label: "Access Token",  placeholder: "EAABxxxxxx", type: "password" }],
  },
  {
    id: "stripe",
    name: "Stripe",
    desc: "Gestão de pagamentos e assinaturas",
    connected: false,
    color: "#635bff",
    fields: [{ key: "secret_key",  label: "Secret Key",   placeholder: "sk_live_xxxxxxxx", type: "password" },
             { key: "webhook_secret", label: "Webhook Secret", placeholder: "whsec_xxxxxxxx", type: "password" }],
  },
  {
    id: "resend",
    name: "Resend / Email",
    desc: "Envio de emails automáticos e campanhas",
    connected: false,
    color: "#00c07f",
    fields: [{ key: "api_key",     label: "API Key",      placeholder: "re_xxxxxxxx", type: "password" },
             { key: "from_email",  label: "Email remetente", placeholder: "noreply@suaclinica.com.br" }],
  },
  {
    id: "medx",
    name: "MedX",
    desc: "Prontuário eletrônico e agenda de consultas",
    connected: false,
    color: "#3b7fff",
    fields: [
      { key: "url",               label: "URL do servidor",     placeholder: "https://medx65.azurewebsites.net" },
      { key: "integration_token", label: "Token de integração", placeholder: "seu-token-aqui", type: "password" },
    ],
  },
]

type IntegrationState = Record<string, Record<string, string>>

interface ZapiTestResult { ok: boolean; connected?: boolean; smartphoneConnected?: boolean; error?: string }

function TabIntegracoes() {
  const [values,         setValues]         = useState<IntegrationState>({})
  const [show,           setShow]           = useState<Record<string, boolean>>({})
  const [saving,         setSaving]         = useState<Record<string, boolean>>({})
  const [saved,          setSaved]          = useState<Record<string, boolean>>({})
  const [connected,      setConnected]      = useState<Record<string, boolean>>({})
  const [loading,        setLoading]        = useState(true)
  const [zapiTesting,    setZapiTesting]    = useState(false)
  const [zapiTestResult, setZapiTestResult] = useState<ZapiTestResult | null>(null)

  useEffect(() => {
    fetch("/api/integracoes")
      .then(r => r.json())
      .then((rows: Array<{ tipo: string; config: Record<string, string>; ativo: boolean }>) => {
        const vals: IntegrationState = {}
        const conn: Record<string, boolean> = {}
        rows.forEach(row => { vals[row.tipo] = row.config; conn[row.tipo] = row.ativo })
        setValues(vals)
        setConnected(conn)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (id: string, key: string, val: string) =>
    setValues(v => ({ ...v, [id]: { ...(v[id] ?? {}), [key]: val } }))

  const save = async (id: string) => {
    setSaving(s => ({ ...s, [id]: true }))
    const res = await fetch("/api/integracoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: id, config: values[id] ?? {} }),
    })
    setSaving(s => ({ ...s, [id]: false }))
    if (res.ok) {
      setConnected(c => ({ ...c, [id]: true }))
      setSaved(s => ({ ...s, [id]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000)
    }
  }

  const testZapi = async () => {
    setZapiTesting(true)
    setZapiTestResult(null)
    try {
      const res  = await fetch("/api/integrations/zapi-test", { method: "POST" })
      const data = await res.json() as ZapiTestResult
      setZapiTestResult(data)
    } catch { setZapiTestResult({ ok: false, error: "Erro de conexão" }) }
    finally   { setZapiTesting(false) }
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Conexões Externas</SectionTitle>
      {loading ? (
        <div className="flex items-center gap-2 py-8" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[12px]">Carregando integrações...</span>
        </div>
      ) : INTEGRACOES.map(integ => (
        <Card key={integ.id}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${integ.color}18`, border: `1px solid ${integ.color}30` }}>
              <Plug className="w-4 h-4" style={{ color: integ.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{integ.name}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{integ.desc}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {connected[integ.id]
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
              <span className="text-[11px] font-mono"
                style={{ color: connected[integ.id] ? "#10b981" : "var(--text-muted)" }}>
                {connected[integ.id] ? "Conectado" : "Desconectado"}
              </span>
            </div>
          </div>

          {/* Fields */}
          <div className="px-5 py-4 space-y-3">
            {integ.fields.map(f => (
              <div key={f.key}>
                <label className="block text-[11px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>
                  {f.label}
                </label>
                <div className="relative">
                  <input
                    type={f.type === "password" && !show[`${integ.id}_${f.key}`] ? "password" : "text"}
                    placeholder={f.placeholder}
                    value={values[integ.id]?.[f.key] ?? ""}
                    onChange={e => set(integ.id, f.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-[12px] font-mono bg-transparent outline-none focus:border-accent-border transition-colors pr-9"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                  />
                  {f.type === "password" && (
                    <button
                      onClick={() => setShow(s => ({ ...s, [`${integ.id}_${f.key}`]: !s[`${integ.id}_${f.key}`] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-muted)" }}>
                      {show[`${integ.id}_${f.key}`]
                        ? <EyeOff className="w-3.5 h-3.5" />
                        : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => save(integ.id)}
                disabled={saving[integ.id]}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all"
                style={{
                  background: saved[integ.id] ? "rgba(16,185,129,0.12)" : "var(--accent-dim)",
                  border: `1px solid ${saved[integ.id] ? "rgba(16,185,129,0.3)" : "var(--accent-border)"}`,
                  color: saved[integ.id] ? "#10b981" : "var(--accent)",
                }}>
                {saving[integ.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {saved[integ.id] ? "Salvo!" : saving[integ.id] ? "Salvando..." : "Salvar credenciais"}
              </button>

              {integ.id === "zapi" && (
                <button
                  onClick={testZapi}
                  disabled={zapiTesting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold border border-border text-text-muted hover:text-text-secondary transition-all"
                >
                  {zapiTesting
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Wifi className="w-3 h-3" />}
                  {zapiTesting ? "Testando..." : "Testar conexão"}
                </button>
              )}
            </div>

            {integ.id === "zapi" && zapiTestResult && (
              <div className={cn(
                "mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px]",
                zapiTestResult.ok && zapiTestResult.connected
                  ? "bg-green-500/10 border-green-500/25 text-green-400"
                  : zapiTestResult.ok && !zapiTestResult.connected
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  : "bg-red-500/10 border-red-500/25 text-red-400"
              )}>
                {zapiTestResult.ok && zapiTestResult.connected
                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  : zapiTestResult.ok
                  ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                <span>
                  {zapiTestResult.ok && zapiTestResult.connected
                    ? `WhatsApp conectado${zapiTestResult.smartphoneConnected ? " · smartphone pareado" : " · smartphone não detectado"}`
                    : zapiTestResult.ok && !zapiTestResult.connected
                    ? "Instância encontrada mas WhatsApp desconectado. Escaneie o QR code no painel Z-API."
                    : zapiTestResult.error ?? "Erro desconhecido"}
                </span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Tab: Notificações ────────────────────────────────────────────────────────

const NOTIF_ITEMS = [
  { id: "novo_lead",       label: "Novo lead captado",            sub: "Quando um novo lead entra no CRM" },
  { id: "mensagem_wp",     label: "Mensagem no WhatsApp",         sub: "Resposta de lead via Zapi" },
  { id: "nps_resposta",    label: "Resposta NPS recebida",        sub: "Paciente enviou avaliação" },
  { id: "nps_baixo",       label: "Alerta: NPS baixo (≤ 6)",     sub: "Email imediato quando paciente avalia com nota baixa" },
  { id: "leads_parados",   label: "Leads sem follow-up",         sub: "Alerta diário de leads sem resposta há mais de 48h" },
  { id: "agendamento",     label: "Novo agendamento",             sub: "Consulta marcada na agenda" },
  { id: "relatorio",       label: "Relatório semanal pronto",     sub: "Toda segunda às 11h" },
  { id: "trial_acabando",  label: "Trial expirando",              sub: "Lembrete 2 dias antes do trial expirar" },
  { id: "sistema",         label: "Atualizações do sistema",      sub: "Novidades e manutenções PRAXIS" },
]

function TabNotificacoes() {
  const [state, setState] = useState(() =>
    Object.fromEntries(NOTIF_ITEMS.map(n => [n.id, true]))
  )
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const saveAll = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Preferências de notificação</SectionTitle>
      <Card>
        {NOTIF_ITEMS.map(item => (
          <Row key={item.id} label={item.label} sub={item.sub}>
            <Toggle
              checked={state[item.id] ?? false}
              onChange={() => setState(s => ({ ...s, [item.id]: !s[item.id] }))}
            />
          </Row>
        ))}
      </Card>

      <button
        onClick={saveAll}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
        style={{
          background: saved ? "rgba(16,185,129,0.12)" : "var(--accent-dim)",
          border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "var(--accent-border)"}`,
          color: saved ? "#10b981" : "var(--accent)",
        }}>
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {saved ? "Preferências salvas!" : saving ? "Salvando..." : "Salvar preferências"}
      </button>
    </div>
  )
}

// ─── Tab: Aparência ───────────────────────────────────────────────────────────

function TabAparencia() {
  const [idioma,      setIdioma]      = useState("pt-BR")
  const [dataFmt,     setDataFmt]     = useState("dd/MM/yyyy")
  const [moeda,       setMoeda]       = useState("BRL")
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SelectField = ({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void
    options: { value: string; label: string }[]
  }) => (
    <div>
      <label className="block text-[11px] font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-[12px] bg-transparent outline-none transition-colors"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--card)" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="space-y-5">
      <SectionTitle>Preferências visuais</SectionTitle>

      <Card>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Tema</p>
            <div className="flex gap-3">
              {[
                { id: "off-white", label: "Off-White (padrão)", preview: "#F5F0E8" },
                { id: "dark",      label: "Escuro",             preview: "#08090e"  },
              ].map(t => (
                <label key={t.id}
                  className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div className="w-8 h-8 rounded-lg border flex-shrink-0"
                    style={{ background: t.preview, borderColor: "var(--border)" }} />
                  <div>
                    <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                    {t.id === "off-white" && (
                      <p className="text-[10px] font-mono" style={{ color: "var(--accent)" }}>Ativo</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 space-y-4">
          <SelectField
            label="Idioma"
            value={idioma}
            onChange={setIdioma}
            options={[
              { value: "pt-BR", label: "Português (Brasil)" },
              { value: "en-US", label: "English (US)" },
            ]}
          />
          <SelectField
            label="Formato de data"
            value={dataFmt}
            onChange={setDataFmt}
            options={[
              { value: "dd/MM/yyyy", label: "DD/MM/AAAA" },
              { value: "MM/dd/yyyy", label: "MM/DD/AAAA" },
              { value: "yyyy-MM-dd", label: "AAAA-MM-DD" },
            ]}
          />
          <SelectField
            label="Moeda"
            value={moeda}
            onChange={setMoeda}
            options={[
              { value: "BRL", label: "Real brasileiro (R$)" },
              { value: "USD", label: "US Dollar ($)" },
              { value: "EUR", label: "Euro (€)" },
            ]}
          />
        </div>
      </Card>

      <button
        onClick={save}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
        style={{
          background: saved ? "rgba(16,185,129,0.12)" : "var(--accent-dim)",
          border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "var(--accent-border)"}`,
          color: saved ? "#10b981" : "var(--accent)",
        }}>
        {saved ? "Salvo!" : "Salvar aparência"}
      </button>
    </div>
  )
}

// ─── Tab: Segurança ───────────────────────────────────────────────────────────

function TabSeguranca() {
  const [oldPwd,   setOldPwd]   = useState("")
  const [newPwd,   setNewPwd]   = useState("")
  const [confPwd,  setConfPwd]  = useState("")
  const [showPwds, setShowPwds] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState("")

  const changePwd = async () => {
    setError("")
    if (!oldPwd || !newPwd || !confPwd) { setError("Preencha todos os campos."); return }
    if (newPwd !== confPwd) { setError("Nova senha e confirmação não coincidem."); return }
    if (newPwd.length < 8)  { setError("Senha deve ter ao menos 8 caracteres."); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false)
    setSaved(true)
    setOldPwd(""); setNewPwd(""); setConfPwd("")
    setTimeout(() => setSaved(false), 3000)
  }

  const PwdInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-[11px] font-mono mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      <input
        type={showPwds ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-[12px] font-mono bg-transparent outline-none focus:border-accent-border transition-colors"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        placeholder="••••••••"
      />
    </div>
  )

  const SESSOES = [
    { device: "Chrome — macOS",           local: "São Paulo, SP",   atual: true,  time: "Agora"        },
    { device: "Safari — iPhone 15 Pro",   local: "São Paulo, SP",   atual: false, time: "Há 2 horas"   },
    { device: "Chrome — Windows",         local: "Curitiba, PR",    atual: false, time: "Ontem, 14h32" },
  ]

  return (
    <div className="space-y-5">
      <SectionTitle>Alterar senha</SectionTitle>
      <Card>
        <div className="p-5 space-y-4">
          <PwdInput label="Senha atual"              value={oldPwd}  onChange={setOldPwd}  />
          <PwdInput label="Nova senha"               value={newPwd}  onChange={setNewPwd}  />
          <PwdInput label="Confirmar nova senha"     value={confPwd} onChange={setConfPwd} />

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={showPwds} onChange={() => setShowPwds(s => !s)}
              className="w-3.5 h-3.5 accent-accent" />
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Mostrar senhas</span>
          </label>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p className="text-[11px]" style={{ color: "#ef4444" }}>{error}</p>
            </div>
          )}

          <button
            onClick={changePwd}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: saved ? "rgba(16,185,129,0.12)" : "var(--accent-dim)",
              border: `1px solid ${saved ? "rgba(16,185,129,0.3)" : "var(--accent-border)"}`,
              color: saved ? "#10b981" : "var(--accent)",
            }}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {saved ? "Senha alterada!" : saving ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      </Card>

      <SectionTitle>Sessões ativas</SectionTitle>
      <Card>
        {SESSOES.map((s, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
            style={{ borderColor: "var(--border)" }}>
            <div className="flex-1">
              <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{s.device}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {s.local} · {s.time}
              </p>
            </div>
            {s.atual ? (
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
                ATUAL
              </span>
            ) : (
              <button className="text-[11px] transition-colors" style={{ color: "var(--text-muted)" }}
                onClick={() => {}}>
                Encerrar
              </button>
            )}
          </div>
        ))}
      </Card>

      <SectionTitle>Autenticação 2FA</SectionTitle>
      <Card>
        <div className="flex items-center gap-3 px-5 py-4">
          <Shield className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          <div className="flex-1">
            <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              Autenticação de dois fatores
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Proteja ainda mais sua conta — em breve disponível.
            </p>
          </div>
          <span className="text-[9px] font-mono px-2.5 py-1 rounded-full"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            EM BREVE
          </span>
        </div>
      </Card>
    </div>
  )
}

// ─── Tab: Membros ─────────────────────────────────────────────────────────────

function TabMembros() {
  const PREVIEW = [
    { nome: "Administrador", email: "contato@praxisplataforma.com.br", role: "Admin", avatar: "P" },
    { nome: "Ana Secretaria",    email: "ana@clinica.com.br",       role: "Secretária",  avatar: "AS" },
    { nome: "Marcos Assistente", email: "marcos@clinica.com.br",    role: "Assistente",  avatar: "MA" },
  ]

  return (
    <div className="space-y-5">
      <SectionTitle>Equipe atual</SectionTitle>
      <Card>
        {PREVIEW.map((m, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
            style={{ borderColor: "var(--border)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>
              {m.avatar}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{m.nome}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{m.email}</p>
            </div>
            <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border"
              style={{
                background: m.role === "Admin" ? "var(--accent-dim)" : "var(--surface)",
                borderColor: m.role === "Admin" ? "var(--accent-border)" : "var(--border)",
                color: m.role === "Admin" ? "var(--accent)" : "var(--text-muted)",
              }}>
              {m.role.toUpperCase()}
            </span>
          </div>
        ))}
      </Card>

      <Link
        href="/configuracoes/membros"
        className="flex items-center justify-between px-5 py-4 rounded-xl border transition-all hover:-translate-y-0.5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Gerenciar membros
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Convide, edite permissões e remova membros da equipe
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
      </Link>
    </div>
  )
}

// ─── Tab: Faturamento ─────────────────────────────────────────────────────────

const HISTORICO = [
  { data: "10/05/2026", desc: "PRAXIS Elite — Mensal",  valor: "R$ 397",  status: "Pago" },
  { data: "10/04/2026", desc: "PRAXIS Elite — Mensal",  valor: "R$ 397",  status: "Pago" },
  { data: "10/03/2026", desc: "PRAXIS Elite — Mensal",  valor: "R$ 397",  status: "Pago" },
]

function TabFaturamento() {
  const [loadingPortal, setLoadingPortal] = useState(false)

  const abrirPortal = async () => {
    setLoadingPortal(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" }).catch(() => null)
    if (res?.ok) {
      const { url } = await res.json()
      if (url) window.location.href = url
    }
    setLoadingPortal(false)
  }

  return (
    <div className="space-y-5">
      {/* Plano atual */}
      <SectionTitle>Plano atual</SectionTitle>
      <Card>
        <div className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>PRAXIS Elite</span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
                ATIVO
              </span>
            </div>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              R$ 397/mês · Renova em 10/07/2026
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Módulos ilimitados","Membros ilimitados","Suporte prioritário","IA sem limites"].map(f => (
                <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={abrirPortal}
            disabled={loadingPortal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all flex-shrink-0"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)", color: "var(--accent)" }}>
            {loadingPortal ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Gerenciar no Stripe
          </button>
        </div>
      </Card>

      {/* Upgrade */}
      <Card>
        <div className="p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              PRAXIS Enterprise
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Múltiplas clínicas, white-label e acesso para até 50 membros. A partir de R$ 997/mês.
            </p>
          </div>
          <Link
            href="/planos"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all flex-shrink-0"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            Ver planos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>

      {/* Histórico */}
      <SectionTitle>Histórico de pagamentos</SectionTitle>
      <Card>
        {HISTORICO.map((h, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
            style={{ borderColor: "var(--border)" }}>
            <div className="flex-1">
              <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{h.desc}</p>
              <p className="text-[11px] mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>{h.data}</p>
            </div>
            <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>{h.valor}</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.22)", color: "#10b981" }}>
              {h.status.toUpperCase()}
            </span>
          </div>
        ))}
      </Card>

      {/* Seus dados */}
      <SectionTitle>Seus dados, sua decisão</SectionTitle>
      <Card>
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(184,151,106,0.12)", border: "1px solid rgba(184,151,106,0.25)" }}
            >
              <Download className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                Exporte todos os seus dados
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Você nunca fica preso à nossa plataforma. Exporte pacientes, leads, financeiro,
                consultas e muito mais a qualquer momento, sem burocracia.
              </p>
            </div>
          </div>
          <Link
            href="/exportar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background:   "rgba(184,151,106,0.1)",
              border:       "1px solid rgba(184,151,106,0.3)",
              color:        "var(--accent)",
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Exportar meus dados <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>("integracoes")

  const CONTENT: Record<Tab, React.ReactNode> = {
    integracoes:  <TabIntegracoes />,
    notificacoes: <TabNotificacoes />,
    aparencia:    <TabAparencia />,
    seguranca:    <TabSeguranca />,
    membros:      <TabMembros />,
    faturamento:  <TabFaturamento />,
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Configurações" subtitle="PRAXIS · PREFERÊNCIAS DO SISTEMA" />

      <div className="p-4 md:p-8 max-w-3xl">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all whitespace-nowrap flex-shrink-0",
                  active
                    ? "border-accent-border bg-accent-dim text-accent"
                    : "border-border text-text-muted hover:text-text-secondary hover:border-border-hover"
                )}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {CONTENT[tab]}
      </div>
    </div>
  )
}
