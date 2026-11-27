import * as React from "react"
import { cn } from "@/lib/utils"

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)

/** Barras em pílulas finas, uma por período. O maior valor fica em grafite; os demais, em tom médio. */
export function PillBars({ data, label, format = brl }: { data: { rotulo: string; valor: number }[]; label: string; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map(d => d.valor))
  const pico = data.findIndex(d => d.valor === max)
  return (
    <div role="img" aria-label={label}>
      <div className="flex h-[170px] items-end justify-between gap-2">
        {data.map((d, i) => {
          const h = d.valor > 0 ? Math.max(8, (d.valor / max) * 100) : 0
          return (
            <div key={d.rotulo + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[11.5px] font-semibold tabular-nums text-px-ink">{d.valor > 0 ? format(d.valor) : ""}</span>
              <div className="relative flex w-3.5 flex-1 items-end rounded-full bg-px-ink/[0.09]">
                <div className={cn("w-full rounded-full", i === pico ? "bg-px-ink" : "bg-[#7B766F]")} style={{ height: `${h}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between gap-2">
        {data.map((d, i) => <span key={d.rotulo + i} className="flex-1 text-center text-[12px] text-px-muted">{d.rotulo}</span>)}
      </div>
    </div>
  )
}

/** Linha de valores (por exemplo NPS). Períodos sem dado ficam como lacuna. */
export function LineSeries({ data, label, min = -100, max = 100 }: { data: { rotulo: string; valor: number | null }[]; label: string; min?: number; max?: number }) {
  const W = 420, H = 170, top = 14, base = 138
  const step = data.length > 1 ? (W - 40) / (data.length - 1) : 0
  const y = (v: number) => base - ((v - min) / (max - min)) * (base - top)
  const pts = data.map((d, i) => (d.valor === null ? null : { x: 20 + i * step, y: y(d.valor), v: d.valor }))
  const path = pts.reduce<string>((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? "L" : "M"}${p.x},${p.y} ` : acc), "")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="rgba(20,20,20,0.18)" strokeDasharray="3 4" />
      {path ? <path d={path} fill="none" stroke="#141414" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {pts.map((p, i) => p ? (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 6 : 4} fill="#141414" />
          <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="12" fontWeight="600" fill="#141414">{p.v}</text>
        </g>
      ) : null)}
      {data.map((d, i) => (
        <text key={d.rotulo + i} x={20 + i * step} y={base + 22} textAnchor="middle" fontSize="12" fill="#5C5750">{d.rotulo}</text>
      ))}
    </svg>
  )
}

/** Barras horizontais finas com rótulo e valor. `dark` para uso sobre painel cinza. */
export function BarList({ data, dark = false, className }: { data: { rotulo: string; valor: number }[]; dark?: boolean; className?: string }) {
  const max = Math.max(1, ...data.map(d => d.valor))
  return (
    <ul className={cn("space-y-3.5", className)}>
      {data.map(d => (
        <li key={d.rotulo}>
          <div className={cn("mb-1.5 flex items-baseline justify-between gap-3 text-[13px]", dark ? "text-white" : "text-px-ink")}>
            <span className="truncate">{d.rotulo}</span>
            <span className="font-semibold tabular-nums">{d.valor}</span>
          </div>
          <div className={cn("h-2 rounded-full", dark ? "bg-white/25" : "bg-px-ink/10")} aria-hidden>
            <div className={cn("h-2 rounded-full", dark ? "bg-white" : "bg-px-ink")} style={{ width: `${Math.max(4, (d.valor / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Anel de progresso com o valor no centro. */
export function Ring({ value, label, dark = false, size = 112 }: { value: number; label: string; dark?: boolean; size?: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const r = 44, c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-2" role="img" aria-label={`${label}: ${pct}%`}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke={dark ? "rgba(255,255,255,0.28)" : "rgba(20,20,20,0.12)"} strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={dark ? "#fff" : "#141414"} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 50 50)" />
        <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="500" fill={dark ? "#fff" : "#141414"}>{pct}%</text>
      </svg>
      <span className={cn("text-center text-[13px]", dark ? "text-white" : "text-px-ink")}>{label}</span>
    </div>
  )
}
