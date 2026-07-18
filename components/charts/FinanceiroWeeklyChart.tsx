"use client"

import {
  BarChart as ReBarChart, Bar,
  XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts"

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

export default function FinanceiroWeeklyChart({ data }: { data: { semana: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <ReBarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="semana"
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v: unknown) => {
            const n = Number(v)
            return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)
          }}
        />
        <ReTooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          formatter={(v: unknown) => [fmt(Number(v)), "Receita"]}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}
