"use client"

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

const TOOLTIP = { background: "#13141d", border: "1px solid #1c1d2a", borderRadius: 8, fontSize: 12 }
const ORIGEM_COLORS = ["#ec4899", "#00c07f", "#3b7fff", "#22c55e", "#7c85a0"]

type RevenuePoint = { mes: string; valor?: number; projecao?: number }

export function RevenueProjectionChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barSize={24}>
        <XAxis dataKey="mes" tick={{ fill: "#7c85a0", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={TOOLTIP}
          formatter={(v: unknown) => [fmt(Number(v ?? 0)), ""]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="valor"    fill="#a855f7"   radius={[4, 4, 0, 0]} />
        <Bar dataKey="projecao" fill="#a855f740" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

type OrigemPoint = { origem: string; count: number }

type EstagioPoint = { estagio: string; count: number }

export function LeadsFunnelChart({ data }: { data: EstagioPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" barSize={14}>
        <XAxis type="number" tick={{ fill: "#7c85a0", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="estagio" tick={{ fill: "#7c85a0", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={100} />
        <Tooltip
          contentStyle={TOOLTIP}
          formatter={(v: unknown) => [Number(v ?? 0), "leads"]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="count" fill="#3b7fff" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function OrigemPieChart({ data }: { data: OrigemPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="origem" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={ORIGEM_COLORS[i % ORIGEM_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP}
          formatter={(v: unknown) => [Number(v ?? 0), "leads"]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
