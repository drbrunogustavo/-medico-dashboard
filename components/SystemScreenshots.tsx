"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, LayoutGrid, Bot, CalendarDays,
  ArrowRight, TrendingUp, Users, Star, DollarSign,
  ChevronRight,
} from "lucide-react"

const GOLD  = "#b8976a"
const DARK  = "#0D1B2A"
const BG    = "#F5F0E8"
const CARD  = "#FFFFFF"
const BORDER = "rgba(13,27,42,0.10)"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScreenTab {
  id:      number
  label:   string
  icon:    React.ElementType
  color:   string
}

const TABS: ScreenTab[] = [
  { id: 1, label: "Dashboard",  icon: LayoutDashboard, color: "#16a34a" },
  { id: 2, label: "CRM",        icon: LayoutGrid,      color: "#3b7fff" },
  { id: 3, label: "Copiloto",   icon: Bot,             color: GOLD      },
  { id: 4, label: "Calendário", icon: CalendarDays,    color: "#a78bfa" },
]

// ─── Mock Sidebar ─────────────────────────────────────────────────────────────

function MockSidebar({ active }: { active: string }) {
  const items = [
    { label: "Dashboard",  icon: LayoutDashboard },
    { label: "CRM",        icon: LayoutGrid      },
    { label: "Copiloto",   icon: Bot             },
    { label: "Calendário", icon: CalendarDays    },
  ]
  return (
    <div style={{ width: 48, background: "#0f0f10", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4, flexShrink: 0 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: GOLD }}>P</span>
      </div>
      {items.map(({ label, icon: Icon }) => (
        <div key={label} style={{
          width: 34, height: 34, borderRadius: 8,
          background: label === active ? `${GOLD}18` : "transparent",
          border: label === active ? `1px solid ${GOLD}35` : "1px solid transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}>
          <Icon style={{ width: 14, height: 14, color: label === active ? GOLD : "rgba(255,255,255,0.25)" }} />
        </div>
      ))}
    </div>
  )
}

// ─── Screenshot 1 — Dashboard ─────────────────────────────────────────────────

function ScreenDashboard() {
  const metrics = [
    { label: "Leads CRM", value: "32", sub: "+4 esta semana", color: "#3b7fff" },
    { label: "Faturamento", value: "R$24.8k", sub: "mês atual", color: "#16a34a" },
    { label: "NPS Score", value: "8.7", sub: "92% promotores", color: GOLD },
    { label: "Consultas", value: "18", sub: "agendadas mês", color: "#a78bfa" },
  ]
  const bars = [42, 55, 48, 67, 72, 80]
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun"]
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
      {/* Topbar */}
      <div style={{ height: 38, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.9)", letterSpacing: "0.5px" }}>Dashboard</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${GOLD}25`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: GOLD }}>MG</span>
          </div>
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: "12px 14px", overflowY: "hidden" }}>
        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${m.color}20`, borderRadius: 8, padding: "9px 11px" }}>
              <div style={{ fontSize: 8, color: "rgba(245,245,247,0.4)", marginBottom: 4, letterSpacing: 1 }}>{m.label.toUpperCase()}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 8, color: "rgba(245,245,247,0.35)", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "9px 11px" }}>
          <div style={{ fontSize: 8, color: "rgba(245,245,247,0.4)", letterSpacing: 1, marginBottom: 8 }}>FATURAMENTO 6 MESES</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 44 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ width: "100%", height: `${h * 0.55}px`, borderRadius: 3, background: `${GOLD}${i === 5 ? "ee" : "55"}`, transition: "height 0.5s ease" }} />
                <span style={{ fontSize: 7, color: "rgba(245,245,247,0.3)" }}>{months[i]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Activity feed */}
        <div style={{ marginTop: 8 }}>
          {[
            { txt: "Lead Maria S. entrou no funil",     t: "2min",  c: "#3b7fff" },
            { txt: "Nurturing D+7 enviado para 3 leads", t: "14min", c: GOLD      },
            { txt: "Consulta Ana P. concluída",          t: "1h",    c: "#16a34a" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.c, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: "rgba(245,245,247,0.55)", flex: 1 }}>{a.txt}</span>
              <span style={{ fontSize: 8, color: "rgba(245,245,247,0.25)" }}>{a.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screenshot 2 — CRM ───────────────────────────────────────────────────────

function ScreenCRM() {
  const cols = [
    { label: "Novo Lead", color: "#d97706", leads: [{ n:"Lucas M.", e:"Emagrecimento", o:"Instagram" }, { n:"Fernanda T.", e:"Hormônios", o:"Indicação" }] },
    { label: "Em Contato", color: "#3b7fff", leads: [{ n:"Roberto A.", e:"Longevidade", o:"Google", nur: true }, { n:"Carla N.", e:"Tireoide", o:"Instagram" }] },
    { label: "Agendado",  color: "#16a34a", leads: [{ n:"Sandra L.", e:"Check-up", o:"Indicação", nur: true }] },
    { label: "Paciente",  color: "#16a34a", leads: [{ n:"Paulo R.", e:"Diabetes T2", o:"Instagram" }] },
  ]
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 38, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.9)" }}>CRM de Leads</span>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 7, padding: "12px 14px", overflowX: "auto" }}>
        {cols.map(col => (
          <div key={col.label} style={{ minWidth: 90, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: col.color }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(245,245,247,0.5)", letterSpacing: 1 }}>{col.label.toUpperCase()}</span>
              <span style={{ fontSize: 8, color: "rgba(245,245,247,0.25)", marginLeft: "auto" }}>{col.leads.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {col.leads.map(l => (
                <div key={l.n} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${col.color}18`, borderRadius: 7, padding: "8px 9px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,245,247,0.85)", marginBottom: 2 }}>{l.n}</div>
                  <div style={{ fontSize: 8, color: "rgba(245,245,247,0.35)", marginBottom: l.nur ? 4 : 0 }}>{l.e}</div>
                  {l.nur && (
                    <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 5px", borderRadius: 99, background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}30` }}>NUR</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screenshot 3 — Copiloto ──────────────────────────────────────────────────

function ScreenCopiloto() {
  const sections = [
    { label: "Resumo Clínico", color: "#3b7fff", txt: "Paciente do sexo feminino, 45 anos, com quadro de hipotireoidismo subclínico (TSH 6.2) associado a síndrome metabólica. Ganho ponderal de 8kg em 6 meses..." },
    { label: "Plano Terapêutico", color: GOLD, txt: "1. Levotiroxina 25mcg/dia em jejum. 2. Restrição calórica 500 kcal/dia. 3. Atividade física aeróbica 150min/semana..." },
    { label: "Follow-up D+7", color: "#16a34a", txt: "Olá! Como está se sentindo após iniciar o tratamento? Algum sintoma novo como palpitações ou insônia?" },
  ]
  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 38, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", padding: "0 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.9)" }}>Copiloto de Consulta</span>
      </div>
      <div style={{ flex: 1, padding: "12px 14px", overflowY: "hidden", display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "9px 11px" }}>
          <div style={{ fontSize: 8, color: "rgba(245,245,247,0.35)", letterSpacing: 1, marginBottom: 5 }}>RELATO DA CONSULTA</div>
          <p style={{ fontSize: 9, color: "rgba(245,245,247,0.55)", lineHeight: 1.5 }}>
            Paciente 45 anos, queixa de fadiga progressiva, ganho de peso 8kg em 6 meses, intolerância ao frio. TSH 6.2, T4L 0.9. Circunferência abdominal 94cm. HAS em uso de losartana 50mg...
          </p>
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}20`, borderRadius: 8, padding: "8px 11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: s.color, letterSpacing: 0.5 }}>{s.label.toUpperCase()}</span>
            </div>
            <p style={{ fontSize: 8.5, color: "rgba(245,245,247,0.5)", lineHeight: 1.5 }}>{s.txt}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screenshot 4 — Calendário ────────────────────────────────────────────────

function ScreenCalendario() {
  const tipos = [
    { label: "Reels",    color: "#a78bfa" },
    { label: "Carrossel",color: "#3b7fff" },
    { label: "Stories",  color: "#d97706" },
  ]
  const posts: Record<number, { tipo: number; titulo: string }> = {
    3:  { tipo: 0, titulo: "3 sinais de que seu cortisol está alto" },
    5:  { tipo: 1, titulo: "Guia completo: hormônios e emagrecimento" },
    8:  { tipo: 2, titulo: "Dica rápida: café da manhã hormonal" },
    10: { tipo: 0, titulo: "Por que sua dieta não funciona?" },
    12: { tipo: 1, titulo: "GLP-1: o que a ciência diz" },
    15: { tipo: 2, titulo: "Hidratação e metabolismo" },
    17: { tipo: 0, titulo: "TSH: o que o seu exame revela" },
    19: { tipo: 1, titulo: "Protocolo longevidade: o guia" },
    22: { tipo: 0, titulo: "Resistência à insulina: sintomas" },
    24: { tipo: 2, titulo: "Estresse e ganho de peso" },
    26: { tipo: 1, titulo: "Vitamina D e imunidade" },
    29: { tipo: 0, titulo: "Mitos sobre jejum intermitente" },
  }
  const [hovered, setHovered] = useState<number | null>(null)
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  const weekDays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"]

  return (
    <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
      <div style={{ height: 38, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.9)" }}>Calendário Editorial</span>
        <span style={{ fontSize: 9, color: "rgba(245,245,247,0.3)" }}>Junho 2026</span>
      </div>
      <div style={{ flex: 1, padding: "10px 14px", overflowY: "hidden" }}>
        {/* Week days header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
          {weekDays.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 7, color: "rgba(245,245,247,0.25)", fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {days.map(d => {
            const post = posts[d]
            return (
              <div key={d}
                onMouseEnter={() => post ? setHovered(d) : null}
                onMouseLeave={() => setHovered(null)}
                style={{ position: "relative", aspectRatio: "1", borderRadius: 5, background: post ? `${tipos[post.tipo].color}12` : "rgba(255,255,255,0.02)", border: `1px solid ${post ? tipos[post.tipo].color + "25" : "rgba(255,255,255,0.04)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: post ? "pointer" : "default" }}>
                <span style={{ fontSize: 8, color: post ? "rgba(245,245,247,0.7)" : "rgba(245,245,247,0.25)", fontWeight: post ? 600 : 400 }}>{d}</span>
                {post && <div style={{ width: 5, height: 5, borderRadius: "50%", background: tipos[post.tipo].color, marginTop: 2 }} />}
                {hovered === d && post && (
                  <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", border: `1px solid ${tipos[post.tipo].color}40`, borderRadius: 6, padding: "5px 8px", whiteSpace: "nowrap", zIndex: 10, fontSize: 8, color: "rgba(245,245,247,0.85)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                    {posts[d]?.titulo}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 10, marginTop: 8, justifyContent: "center" }}>
          {tipos.map(t => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.color }} />
              <span style={{ fontSize: 8, color: "rgba(245,245,247,0.35)" }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SystemScreenshots() {
  const [active, setActive] = useState(1)

  const screens: Record<number, { component: React.ReactNode; label: string }> = {
    1: { component: <ScreenDashboard />, label: "Dashboard" },
    2: { component: <ScreenCRM />,       label: "CRM" },
    3: { component: <ScreenCopiloto />,  label: "Copiloto" },
    4: { component: <ScreenCalendario />,label: "Calendário" },
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: active === t.id ? t.color : "transparent",
              color: active === t.id ? "#fff" : "#6a5a4a",
              border: active === t.id ? `1px solid ${t.color}` : `1px solid ${BORDER}`,
              transition: "all 0.2s",
            }}
          >
            <t.icon style={{ width: 13, height: 13 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Screenshot frame */}
      <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: `0 24px 80px rgba(13,27,42,0.18), 0 0 0 1px ${BORDER}` }}>
        {/* Browser chrome */}
        <div style={{ background: "#161618", padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#ff5f57","#febc2e","#28c840"].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 5, padding: "3px 10px", fontSize: 9, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
            app.praxisplataforma.com.br
          </div>
        </div>

        {/* App window */}
        <div style={{ background: "#0a0a0b", display: "flex", height: 340 }}>
          <MockSidebar active={screens[active].label} />
          {screens[active].component}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/demo"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 10, background: DARK, color: GOLD, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          Ver demonstração ao vivo <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
    </div>
  )
}
