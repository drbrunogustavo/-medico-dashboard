"use client"
import { useEffect, useRef, useState } from "react"

// ─── Shared hook ──────────────────────────────────────────────────────────────

function useInViewOnce() {
  const ref       = useRef<HTMLDivElement>(null)
  const [ok, set] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return { ref, ok }
}

// ─── Shared layout ────────────────────────────────────────────────────────────

const S = {
  wrap: {
    background: "#0a1628",
    borderRadius: 12,
    padding: 16,
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
    fontFamily: "Inter, sans-serif",
  } as React.CSSProperties,
  label: {
    fontSize: 8,
    color: "#3a5070",
    fontFamily: "monospace",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  card: {
    background: "#111e30",
    borderRadius: 8,
    padding: "8px 10px",
    border: "1px solid rgba(255,255,255,0.05)",
  } as React.CSSProperties,
  title: { fontSize: 12, fontWeight: 700, color: "#e8e4dc" } as React.CSSProperties,
}

// ─── MOCKUP 1 — Dashboard ─────────────────────────────────────────────────────

export function MockupDashboard() {
  const { ref, ok } = useInViewOnce()
  const bars = [42, 58, 35, 76, 88, 52, 94]
  const days = ["S", "T", "Q", "Q", "S", "S", "D"]
  const metrics = [
    { l: "Leads Ativos",  v: "24",     c: "#00c07f" },
    { l: "Consultas/sem", v: "8",      c: "#3b7fff" },
    { l: "NPS Score",     v: "4.9 ★",  c: "#d4af37" },
    { l: "Faturamento",   v: "R$18k",  c: "#8b5cf6" },
  ]

  return (
    <div ref={ref} style={S.wrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "3px", fontFamily: "monospace" }}>PRAXIS</div>
          <div style={S.title}>Centro de Comando</div>
        </div>
        <div style={{ fontSize: 8, color: "#2a4060" }}>Jun 2026</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {metrics.map(({ l, v, c }) => (
          <div key={l} style={{ ...S.card, opacity: ok ? 1 : 0, transition: "opacity 0.5s ease" }}>
            <div style={{ ...S.label, marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ ...S.label, marginBottom: 6 }}>Consultas / Semana</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 70 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: "100%",
                height: ok ? `${h}%` : "4%",
                background: i === 4 ? "#00c07f" : i === 6 ? "#00c07f" : "#1a2d45",
                borderRadius: "3px 3px 2px 2px",
                transition: `height 0.7s ease ${i * 80}ms`,
                minHeight: 4,
                opacity: i === 4 || i === 6 ? 1 : 0.6,
              }} />
              <div style={{ fontSize: 7, color: "#2a4060" }}>{days[i]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MOCKUP 2 — CRM Kanban ────────────────────────────────────────────────────

export function MockupCRM() {
  const { ref, ok } = useInViewOnce()

  const cols = [
    {
      label: "Novo Lead", color: "#d4af37",
      items: [
        { n: "Maria S.",  t: "Endocrinologia" },
        { n: "João R.",   t: "Nutrologia"     },
        { n: "Ana L.",    t: "Longevidade"    },
      ],
    },
    {
      label: "Agendado", color: "#3b7fff",
      items: [
        { n: "Carlos M.",  t: "Amanhã 14h" },
        { n: "Beatriz P.", t: "Qui 10h"    },
      ],
    },
    {
      label: "Ativo", color: "#00c07f",
      items: [
        { n: "Felipe A.", t: "Pós-consulta" },
        { n: "Clara N.",  t: "Fidelizado"   },
      ],
    },
  ]

  return (
    <div ref={ref} style={S.wrap}>
      <div style={S.title}>CRM de Leads</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, flex: 1 }}>
        {cols.map(({ label, color, items }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ ...S.label, color, borderBottom: `1px solid ${color}30`, paddingBottom: 4, marginBottom: 2 }}>
              {label} <span style={{ background: `${color}20`, padding: "0 4px", borderRadius: 999, fontSize: 7 }}>{items.length}</span>
            </div>
            {items.map(({ n, t }, i) => (
              <div key={i} style={{
                ...S.card,
                opacity: ok ? 1 : 0,
                transform: ok ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 0.4s ease ${i * 100}ms, transform 0.4s ease ${i * 100}ms`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#d0ccc8", marginBottom: 2 }}>{n}</div>
                <div style={{ fontSize: 8, color, fontFamily: "monospace" }}>{t}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MOCKUP 3 — Copiloto de Consulta ─────────────────────────────────────────

const INPUT_TXT  = "Paciente 52a, masculino. HAS controlada. Queixa de fadiga progressiva há 3 meses, perda de libido e ganho ponderal de 4kg."
const OUTPUT_TXT = `RESUMO (SOAP)
Subjetivo: Fadiga, hipolibidemia, ↑peso 4kg/3m
Avaliação: Suspeita de hipogonadismo + resistência insulínica

PLANO TERAPÊUTICO
1. Dosar: Testosterona total/livre, DHEA-S, TSH
2. Solicitar CGM 14 dias
3. Protocolo de exercício resistido

FOLLOW-UP AUTOMÁTICO
D+1, D+7 e D+30 — mensagens geradas automaticamente

SUGESTÃO DE CONTEÚDO
Reel: "3 sinais de que seus hormônios precisam de atenção"`

export function MockupCopiloto() {
  const { ref, ok } = useInViewOnce()
  const [text, setText]   = useState("")
  const [show, setShow]   = useState(false)

  useEffect(() => {
    if (!ok) return
    const t = setTimeout(() => setShow(true), 900)
    return () => clearTimeout(t)
  }, [ok])

  useEffect(() => {
    if (!show) return
    let i = 0
    const iv = setInterval(() => {
      i += 4
      setText(OUTPUT_TXT.slice(0, i))
      if (i >= OUTPUT_TXT.length) clearInterval(iv)
    }, 25)
    return () => clearInterval(iv)
  }, [show])

  return (
    <div ref={ref} style={S.wrap}>
      <div style={S.title}>Copiloto de Consulta</div>

      <div style={{ ...S.card, border: "1px solid rgba(0,192,127,0.2)", fontSize: 10, color: "#7090a8", lineHeight: 1.6 }}>
        {INPUT_TXT}
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <span style={{ fontSize: 8, background: "#00c07f", color: "#0a1628", fontWeight: 800, padding: "3px 10px", borderRadius: 5, fontFamily: "monospace" }}>
            GERAR IA
          </span>
        </div>
      </div>

      {show && (
        <div style={{
          ...S.card,
          flex: 1,
          border: "1px solid rgba(0,192,127,0.15)",
          fontSize: 9,
          color: "#8090a8",
          lineHeight: 1.7,
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          overflow: "hidden",
        }}>
          <span style={{ color: "#00c07f", fontWeight: 700 }}>● </span>
          {text}
          <span style={{
            display: "inline-block", width: 2, height: 10,
            background: "#00c07f", verticalAlign: "middle",
            animation: "copBlk 1s step-end infinite",
          }} />
        </div>
      )}
      <style>{`@keyframes copBlk{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  )
}

// ─── MOCKUP 4 — Calendário Editorial ─────────────────────────────────────────

const COLORS = { reel: "#8b5cf6", carrossel: "#3b7fff", story: "#ec4899", legenda: "#d4af37" } as const
type ContentType = keyof typeof COLORS

const CAL_DAYS: Array<ContentType | null> = [
  null, "reel", "story", null, "carrossel", null, null,
  "reel", null, "carrossel", "legenda", null, "story", null,
  null, "reel", "story", null, "carrossel", null, null,
  "reel", null, "story", "legenda", null, "carrossel", null,
  null, "reel",
]

export function MockupCalendario() {
  const { ref, ok } = useInViewOnce()
  const [tip, setTip] = useState<number | null>(null)

  const TIPS: Partial<Record<number, string>> = {
    1: "Hormônios na menopausa", 4: "5 sinais de resistência insulínica",
    7: "Emagrecimento x hormônios", 9: "Checkup preventivo",
    15: "Testosterona na mulher", 18: "Longevidade: o guia",
    21: "Metabolismo lento — mitos", 26: "Vitamina D e imunidade", 29: "Revisão do mês",
  }

  return (
    <div ref={ref} style={S.wrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={S.title}>Calendário Editorial</div>
        <div style={{ fontSize: 8, color: "#2a4060" }}>JUNHO 2026</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(COLORS).map(([k, c]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
            <span style={{ fontSize: 7, color: "#3a5070", fontFamily: "monospace", textTransform: "uppercase" }}>{k}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, flex: 1 }}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} style={{ ...S.label, textAlign: "center", paddingBottom: 2 }}>{d}</div>
        ))}
        {CAL_DAYS.map((type, i) => (
          <div
            key={i}
            onMouseEnter={() => type && setTip(i)}
            onMouseLeave={() => setTip(null)}
            style={{
              background: type ? `${COLORS[type]}18` : "#111e30",
              borderRadius: 4,
              padding: "4px 2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              border: `1px solid ${type ? COLORS[type] + "30" : "rgba(255,255,255,0.04)"}`,
              opacity: ok ? 1 : 0,
              transition: `opacity 0.3s ease ${i * 15}ms`,
              cursor: type ? "pointer" : "default",
              position: "relative",
            }}
          >
            <span style={{ fontSize: 7, color: type ? "#b0a89e" : "#1a2d40" }}>{i + 1}</span>
            {type && <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS[type] }} />}
            {tip === i && TIPS[i] && (
              <div style={{
                position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)",
                background: "#1a2d45", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4, padding: "3px 6px", fontSize: 8, color: "#d0ccc8",
                whiteSpace: "nowrap", zIndex: 20, pointerEvents: "none",
              }}>
                {TIPS[i]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MOCKUP 5 — Painel Executivo ──────────────────────────────────────────────

export function MockupExecutivo() {
  const { ref, ok } = useInViewOnce()

  const chartBars = [28, 34, 29, 45, 38, 52, 48, 61, 55, 72, 68, 85]
  const months    = ["J","F","M","A","M","J","J","A","S","O","N","D"]
  const max       = Math.max(...chartBars)

  const funnel = [
    { l: "Visitantes", v: "1.2k", pct: 100, c: "#3b7fff" },
    { l: "Leads",      v: "184",  pct: 60,  c: "#d4af37" },
    { l: "Agendados",  v: "52",   pct: 38,  c: "#00c07f" },
    { l: "Pacientes",  v: "38",   pct: 26,  c: "#8b5cf6" },
  ]

  return (
    <div ref={ref} style={S.wrap}>
      <div style={S.title}>Painel Executivo</div>

      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 6 }}>Faturamento — R$ mil</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 56 }}>
          {chartBars.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{
                width: "100%",
                height: ok ? `${(v / max) * 100}%` : "0%",
                background: i === chartBars.length - 1 ? "#00c07f" : `rgba(0,192,127,${0.2 + (v / max) * 0.4})`,
                borderRadius: "2px 2px 0 0",
                transition: `height 0.6s ease ${i * 50}ms`,
              }} />
              <div style={{ fontSize: 6, color: "#2a4060" }}>{months[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ ...S.label, marginBottom: 6 }}>Funil de Conversão</div>
        {funnel.map(({ l, v, pct, c }) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
            <div style={{ width: 48, fontSize: 7, color: "#4a6080", flexShrink: 0 }}>{l}</div>
            <div style={{ flex: 1, height: 10, background: "#111e30", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                width: ok ? `${pct}%` : "0%",
                height: "100%",
                background: c,
                borderRadius: 3,
                opacity: 0.8,
                transition: `width 0.7s ease`,
              }} />
            </div>
            <div style={{ width: 26, fontSize: 8, color: c, fontFamily: "monospace", textAlign: "right", flexShrink: 0 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Export wrapper ───────────────────────────────────────────────────────────

export function ProductMockup({ id }: { id: 1 | 2 | 3 | 4 | 5 }) {
  if (id === 1) return <MockupDashboard />
  if (id === 2) return <MockupCRM />
  if (id === 3) return <MockupCopiloto />
  if (id === 4) return <MockupCalendario />
  return <MockupExecutivo />
}
