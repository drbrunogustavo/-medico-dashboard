"use client"

import {
  BarChart as ReBarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts"

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v)
}

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
}
const LABEL_STYLE = { color: "var(--text-secondary)" }

export function RevenueChart({ data }: { data: { mes: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <ReBarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <ReTooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: unknown) => [fmtBRL(Number(v)), "Receita"]}
          labelStyle={LABEL_STYLE}
        />
        <Bar dataKey="valor" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}

export function NpsChart({ data }: { data: { mes: string; nps: number | null }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 5, 10]}
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <ReTooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: unknown) => [String(v), "NPS"]}
          labelStyle={LABEL_STYLE}
        />
        <Line dataKey="nps" stroke="var(--accent)" strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function FunnelChart({ data }: { data: { estagio: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <ReBarChart layout="vertical" data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="estagio"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <ReTooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: unknown) => [String(v), "Leads"]}
          labelStyle={LABEL_STYLE}
        />
        <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}
