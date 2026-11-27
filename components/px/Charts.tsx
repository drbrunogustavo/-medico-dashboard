import * as React from "react"
import { cn } from "@/lib/utils"

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)

/** Colunas de valor por período. A última coluna (período atual) usa o cobre; as demais, o grafite. */
export function ColumnChart({ data, label }: { data: { rotulo: string; valor: number }[]; label: string }) {
  const max = Math.max(1, ...data.map(d => d.valor))
  const W = 420, H = 190, base = 160, gap = 12
  const bw = (W - gap * (data.length + 1)) / Math.max(1, data.length)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      <line x1="0" y1={base} x2={W} y2={base} stroke="rgba(20,20,20,0.15)" />
      {data.map((d, i) => {
        const h = Math.max(d.valor > 0 ? 3 : 0, (d.valor / max) * (base - 26))
        const x = gap + i * (bw + gap)
        const atual = i === data.length - 1
        return (
          <g key={d.rotulo + i}>
            <rect x={x} y={base - h} width={bw} height={h} rx="6" fill={atual ? "#8A5A2B" : "#3A3836"} />
            <text x={x + bw / 2} y={base - h - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill="#141414">{d.valor > 0 ? brl(d.valor) : ""}</text>
            <text x={x + bw / 2} y={base + 20} textAnchor="middle" fontSize="12" fill="#5C5750">{d.rotulo}</text>
          </g>
        )
      })}
    </svg>
  )
}

/** Linha de valores (0 a 100, por exemplo NPS). Períodos sem dado ficam como lacuna. */
export function LineSeries({ data, label, min = -100, max = 100 }: { data: { rotulo: string; valor: number | null }[]; label: string; min?: number; max?: number }) {
  const W = 420, H = 170, top = 14, base = 138
  const step = data.length > 1 ? (W - 40) / (data.length - 1) : 0
  const y = (v: number) => base - ((v - min) / (max - min)) * (base - top)
  const pts = data.map((d, i) => (d.valor === null ? null : { x: 20 + i * step, y: y(d.valor), v: d.valor }))
  const path = pts.reduce<string>((acc, p, i) => (p ? acc + `${acc && pts[i - 1] ? "L" : "M"}${p.x},${p.y} ` : acc), "")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="rgba(20,20,20,0.15)" strokeDasharray="3 4" />
      {path ? <path d={path} fill="none" stroke="#141414" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
      {pts.map((p, i) => p ? (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? "#8A5A2B" : "#141414"} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="#141414">{p.v}</text>
        </g>
      ) : null)}
      {data.map((d, i) => (
        <text key={d.rotulo + i} x={20 + i * step} y={base + 22} textAnchor="middle" fontSize="12" fill="#5C5750">{d.rotulo}</text>
      ))}
    </svg>
  )
}

/** Barras horizontais com rótulo e valor, para funis e rankings. */
export function BarList({ data, className }: { data: { rotulo: string; valor: number }[]; className?: string }) {
  const max = Math.max(1, ...data.map(d => d.valor))
  return (
    <ul className={cn("space-y-3", className)}>
      {data.map(d => (
        <li key={d.rotulo}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-px-ink">{d.rotulo}</span>
            <span className="font-semibold tabular-nums text-px-ink">{d.valor}</span>
          </div>
          <div className="h-2 rounded-full bg-px-ink/10" aria-hidden>
            <div className="h-2 rounded-full bg-px-ink" style={{ width: `${Math.max(3, (d.valor / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
