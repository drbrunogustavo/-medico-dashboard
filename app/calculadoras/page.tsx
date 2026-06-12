"use client"

import { useState } from "react"
import {
  Calculator, Copy, Check, Scale, Activity, Flame,
  Droplets, Heart, Pill, Microscope, Ruler, AlertTriangle,
  Dumbbell, Baby, Stethoscope, Apple, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Copy hook ────────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(id: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }
  return { copied, copy }
}

// ─── Shared components ────────────────────────────────────────────────────────

function CopyButton({ id, text, copied, onCopy }: {
  id: string; text: string; copied: string | null; onCopy: (id: string, t: string) => void
}) {
  const isCopied = copied === id
  return (
    <button
      onClick={() => onCopy(id, text)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
      style={{
        background: isCopied ? "rgba(0,192,127,0.12)" : "var(--surface-2, var(--surface))",
        border: `1px solid ${isCopied ? "rgba(0,192,127,0.3)" : "var(--border)"}`,
        color: isCopied ? "#00c07f" : "var(--text-muted)",
      }}>
      {isCopied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
      {isCopied ? "Copiado!" : "Copiar"}
    </button>
  )
}

function ResultBox({ label, value, sub, color, copyId, copyText, copied, onCopy }: {
  label: string; value: string; sub?: string; color: string
  copyId: string; copyText: string; copied: string | null; onCopy: (id: string, t: string) => void
}) {
  return (
    <div className="mt-4 rounded-xl p-4 flex items-center justify-between gap-3"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <div>
        <div className="text-[10px] font-mono tracking-wider uppercase mb-1" style={{ color }}>
          {label}
        </div>
        <div className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
        {sub && <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</div>}
      </div>
      <CopyButton id={copyId} text={copyText} copied={copied} onCopy={onCopy} />
    </div>
  )
}

function Field({ label, unit, value, onChange, min, max, step = "any" }: {
  label: string; unit?: string; value: string
  onChange: (v: string) => void; min?: number; max?: number; step?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        {label} {unit && <span style={{ color: "var(--text-muted)" }}>({unit})</span>}
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  )
}

function FieldDate({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-colors"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        onFocus={e => (e.target.style.borderColor = "var(--accent)")}
        onBlur={e => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  )
}

function Select({ label, value, options, onChange }: {
  label: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-[13px] outline-none appearance-none"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function Toggle({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <div className="flex gap-1">
        {options.map(o => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: value === o ? "var(--accent-dim)" : "var(--surface)",
              border: `1px solid ${value === o ? "var(--accent-border)" : "var(--border)"}`,
              color: value === o ? "var(--accent)" : "var(--text-muted)",
            }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

function CalcCard({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2.5 p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon style={{ width: 14, height: 14, color }} />
        </div>
        <span className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>{title}</span>
      </div>
      <div className="p-4 flex-1">{children}</div>
    </div>
  )
}

function CheckItem({ label, points, checked, onChange }: {
  label: string; points: number; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div
        className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: checked ? "var(--accent-dim)" : "var(--surface)",
          border: `1px solid ${checked ? "var(--accent-border)" : "var(--border)"}`,
        }}
        onClick={() => onChange(!checked)}>
        {checked && <Check style={{ width: 9, height: 9, color: "var(--accent)" }} />}
      </div>
      <span className="text-[12px] flex-1 leading-relaxed" style={{ color: checked ? "var(--text-primary)" : "var(--text-secondary)" }}>
        {label}
      </span>
      <span className="text-[11px] font-mono font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
        style={{
          background: checked ? "var(--accent-dim)" : "var(--surface)",
          color: checked ? "var(--accent)" : "var(--text-muted)",
        }}>
        {points > 0 ? `+${points}` : points}
      </span>
    </label>
  )
}

function WarningBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg"
      style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
      <AlertTriangle style={{ width: 13, height: 13, color: "#fbbf24", flexShrink: 0, marginTop: 1 }} />
      <span className="text-[11px] leading-relaxed" style={{ color: "#fbbf24" }}>{text}</span>
    </div>
  )
}

// ─── ATIVIDADES ───────────────────────────────────────────────────────────────

const ATIVIDADES = [
  { value: "1.2",   label: "Sedentário (sem exercício)" },
  { value: "1.375", label: "Leve (1–3x/sem)" },
  { value: "1.55",  label: "Moderado (3–5x/sem)" },
  { value: "1.725", label: "Intenso (6–7x/sem)" },
  { value: "1.9",   label: "Muito intenso / Atleta" },
]

// ════════════════════════════════════════════════════════════════════════════
// ABA GERAL
// ════════════════════════════════════════════════════════════════════════════

function CalcIMC({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso, setPeso]     = useState("")
  const [altura, setAltura] = useState("")
  const p = parseFloat(peso); const h = parseFloat(altura)
  const imc = p > 0 && h > 0 ? p / Math.pow(h / 100, 2) : null
  function classify(v: number): { label: string; color: string } {
    if (v < 18.5) return { label: "Abaixo do peso",   color: "#3b7fff" }
    if (v < 25)   return { label: "Peso normal",       color: "#00c07f" }
    if (v < 30)   return { label: "Sobrepeso",         color: "#f59e0b" }
    if (v < 35)   return { label: "Obesidade Grau I",  color: "#f97316" }
    if (v < 40)   return { label: "Obesidade Grau II", color: "#ef4444" }
    return               { label: "Obesidade Grau III",color: "#dc2626" }
  }
  const cls  = imc ? classify(imc) : null
  const text = imc ? `IMC: ${imc.toFixed(1)} kg/m² — ${cls?.label} (Faixa ideal: 18.5–24.9)` : ""
  return (
    <CalcCard icon={Scale} title="IMC" color="#3b7fff">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
          <Field label="Altura" unit="cm" value={altura} onChange={setAltura} min={0} />
        </div>
        {imc && cls && (
          <ResultBox label="Resultado" value={`${imc.toFixed(1)} kg/m²`}
            sub={`${cls.label} · Faixa ideal: 18.5–24.9`}
            color={cls.color} copyId="imc" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcHOMA({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [gli, setGli] = useState(""); const [ins, setIns] = useState("")
  const g = parseFloat(gli); const i = parseFloat(ins)
  const homa = g > 0 && i > 0 ? (g * i) / 405 : null
  function classify(v: number): { label: string; color: string } {
    if (v < 2.5) return { label: "Normal",            color: "#00c07f" }
    if (v < 4.0) return { label: "Resistência leve",  color: "#f59e0b" }
    return             { label: "Resistência grave", color: "#ef4444" }
  }
  const cls  = homa ? classify(homa) : null
  const text = homa ? `HOMA-IR: ${homa.toFixed(2)} — ${cls?.label}` : ""
  return (
    <CalcCard icon={Activity} title="HOMA-IR" color="#f59e0b">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Glicemia jejum" unit="mg/dL" value={gli} onChange={setGli} min={0} />
          <Field label="Insulina jejum" unit="μU/mL" value={ins} onChange={setIns} min={0} />
        </div>
        {homa && cls && (
          <ResultBox label="HOMA-IR" value={homa.toFixed(2)}
            sub={`${cls.label} · <2.5 normal · 2.5–4.0 leve · >4.0 grave`}
            color={cls.color} copyId="homa" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcTMB({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,  setPeso]  = useState(""); const [alt,   setAlt]   = useState("")
  const [idade, setIdade] = useState(""); const [sexo,  setSexo]  = useState("Homem")
  const [fator, setFator] = useState("1.55")
  const p = parseFloat(peso); const h = parseFloat(alt)
  const a = parseFloat(idade); const f = parseFloat(fator)
  let tmb: number | null = null
  if (p > 0 && h > 0 && a > 0) {
    tmb = sexo === "Homem"
      ? 88.36 + (13.4 * p) + (4.8 * h) - (5.7 * a)
      : 447.6 + (9.2 * p) + (3.1 * h) - (4.3 * a)
  }
  const gasto = tmb ? Math.round(tmb * f) : null
  const text  = tmb ? `TMB: ${Math.round(tmb)} kcal/dia · Gasto total (${ATIVIDADES.find(x => x.value === fator)?.label}): ${gasto} kcal/dia` : ""
  return (
    <CalcCard icon={Flame} title="TMB (Harris-Benedict)" color="#f97316">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
          <Field label="Altura" unit="cm" value={alt} onChange={setAlt} min={0} />
          <Field label="Idade" unit="anos" value={idade} onChange={setIdade} min={0} />
        </div>
        <Toggle label="Sexo" options={["Homem", "Mulher"]} value={sexo} onChange={setSexo} />
        <Select label="Nível de atividade" value={fator} options={ATIVIDADES} onChange={setFator} />
        {tmb && gasto && (
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>TMB (metabolismo basal)</span>
              <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{Math.round(tmb)} kcal</span>
            </div>
            <ResultBox label="Gasto Calórico Total" value={`${gasto} kcal/dia`}
              sub={ATIVIDADES.find(x => x.value === fator)?.label}
              color="#f97316" copyId="tmb" copyText={text} copied={copied} onCopy={onCopy} />
          </div>
        )}
      </div>
    </CalcCard>
  )
}

function CalcAgua({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,      setPeso]      = useState("")
  const [atividade, setAtividade] = useState("Sedentário")
  const p = parseFloat(peso)
  const fatorMap: Record<string, number> = {
    "Sedentário": 35,
    "Ativo": 40,
    "Muito ativo": 45,
  }
  const fatorMin = fatorMap[atividade] ?? 35
  const fatorMax = atividade === "Ativo" ? 40 : atividade === "Muito ativo" ? 45 : 35
  const mlMin  = p > 0 ? p * fatorMin : null
  const mlMax  = p > 0 ? p * fatorMax : null
  const ltsMin = mlMin ? (mlMin / 1000).toFixed(1) : null
  const ltsMax = mlMax ? (mlMax / 1000).toFixed(1) : null
  const coposMin = mlMin ? Math.round(mlMin / 200) : null
  const coposMax = mlMax ? Math.round(mlMax / 200) : null
  const value    = ltsMin && ltsMax
    ? (ltsMin === ltsMax ? `${ltsMin} L/dia` : `${ltsMin}–${ltsMax} L/dia`)
    : ""
  const sub = coposMin && coposMax
    ? (coposMin === coposMax
        ? `${coposMin} copos de 200ml · ${fatorMin}ml/kg`
        : `${coposMin}–${coposMax} copos de 200ml · ${fatorMin}–${fatorMax}ml/kg`)
    : ""
  const text = value ? `Água diária recomendada (${atividade}): ${value} (${sub})` : ""
  return (
    <CalcCard icon={Droplets} title="Água Diária" color="#06b6d4">
      <div className="space-y-3">
        <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
        <Toggle label="Nível de atividade / clima"
          options={["Sedentário", "Ativo", "Muito ativo"]}
          value={atividade} onChange={setAtividade} />
        {value && (
          <ResultBox label="Ingestão Recomendada" value={value} sub={sub}
            color="#06b6d4" copyId="agua" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

// Framingham score calculation
function framinghamScore(
  sexo: string, idade: number, tc: number, hdl: number,
  pas: number, tratado: boolean, fumante: boolean
): number {
  let pts = 0
  if (sexo === "Homem") {
    if (idade < 35)      pts += -9
    else if (idade < 40) pts += -4
    else if (idade < 45) pts += 0
    else if (idade < 50) pts += 3
    else if (idade < 55) pts += 6
    else if (idade < 60) pts += 8
    else if (idade < 65) pts += 10
    else if (idade < 70) pts += 11
    else if (idade < 75) pts += 12
    else                 pts += 13
    const tcPts = idade < 40
      ? (tc < 160 ? 0 : tc < 200 ? 4 : tc < 240 ? 7 : tc < 280 ? 9 : 11)
      : idade < 50
      ? (tc < 160 ? 0 : tc < 200 ? 3 : tc < 240 ? 5 : tc < 280 ? 6 : 8)
      : idade < 60
      ? (tc < 160 ? 0 : tc < 200 ? 2 : tc < 240 ? 3 : tc < 280 ? 4 : 5)
      : idade < 70
      ? (tc < 160 ? 0 : tc < 200 ? 1 : tc < 240 ? 1 : tc < 280 ? 2 : 3)
      : (tc < 160 ? 0 : tc < 200 ? 0 : tc < 240 ? 0 : tc < 280 ? 1 : 1)
    pts += tcPts
    if (hdl >= 60)      pts += -1
    else if (hdl >= 50) pts += 0
    else if (hdl >= 40) pts += 1
    else                pts += 2
    if (!tratado) {
      if (pas < 120)      pts += 0
      else if (pas < 130) pts += 0
      else if (pas < 140) pts += 1
      else if (pas < 160) pts += 1
      else                pts += 2
    } else {
      if (pas < 120)      pts += 0
      else if (pas < 130) pts += 1
      else if (pas < 140) pts += 2
      else if (pas < 160) pts += 2
      else                pts += 3
    }
    if (fumante) pts += 8
    const table: Record<number, number> = {
      0:1,1:1,2:1,3:1,4:1,5:2,6:2,7:3,8:4,9:5,10:6,11:8,12:10,13:12,14:16,15:20,16:25,17:30
    }
    return table[Math.min(Math.max(pts, 0), 17)] ?? 30
  } else {
    if (idade < 35)      pts += -7
    else if (idade < 40) pts += -3
    else if (idade < 45) pts += 0
    else if (idade < 50) pts += 3
    else if (idade < 55) pts += 6
    else if (idade < 60) pts += 8
    else if (idade < 65) pts += 10
    else if (idade < 70) pts += 12
    else if (idade < 75) pts += 14
    else                 pts += 16
    const tcPts = idade < 40
      ? (tc < 160 ? 0 : tc < 200 ? 4 : tc < 240 ? 8 : tc < 280 ? 11 : 13)
      : idade < 50
      ? (tc < 160 ? 0 : tc < 200 ? 3 : tc < 240 ? 6 : tc < 280 ? 8 : 10)
      : idade < 60
      ? (tc < 160 ? 0 : tc < 200 ? 2 : tc < 240 ? 4 : tc < 280 ? 5 : 7)
      : idade < 70
      ? (tc < 160 ? 0 : tc < 200 ? 1 : tc < 240 ? 2 : tc < 280 ? 3 : 4)
      : (tc < 160 ? 0 : tc < 200 ? 1 : tc < 240 ? 1 : tc < 280 ? 2 : 2)
    pts += tcPts
    if (hdl >= 60)      pts += -1
    else if (hdl >= 50) pts += 0
    else if (hdl >= 40) pts += 1
    else                pts += 2
    if (!tratado) {
      if (pas < 120)      pts += 0
      else if (pas < 130) pts += 1
      else if (pas < 140) pts += 2
      else if (pas < 150) pts += 3
      else if (pas < 160) pts += 4
      else                pts += 5
    } else {
      if (pas < 120)      pts += 0
      else if (pas < 130) pts += 3
      else if (pas < 140) pts += 4
      else if (pas < 150) pts += 5
      else if (pas < 160) pts += 5
      else                pts += 6
    }
    if (fumante) pts += 9
    const table: Record<number, number> = {
      9:1,10:1,11:1,12:1,13:2,14:2,15:3,16:4,17:5,18:6,19:8,20:11,21:14,22:17,23:22,24:27,25:30
    }
    return table[Math.min(Math.max(pts, 9), 25)] ?? 30
  }
}

function CalcFramingham({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [sexo,    setSexo]    = useState("Homem")
  const [idade,   setIdade]   = useState(""); const [tc,  setTc]  = useState("")
  const [hdl,     setHdl]     = useState(""); const [pas, setPas] = useState("")
  const [tratado, setTratado] = useState("Não"); const [fumante, setFumante] = useState("Não")
  const i = parseFloat(idade); const t = parseFloat(tc)
  const h = parseFloat(hdl);   const p = parseFloat(pas)
  let risco: number | null = null
  if (i > 0 && t > 0 && h > 0 && p > 0) {
    risco = framinghamScore(sexo, i, t, h, p, tratado === "Sim", fumante === "Sim")
  }
  function classify(v: number): { label: string; color: string } {
    if (v < 10)  return { label: "Baixo risco",         color: "#00c07f" }
    if (v <= 20) return { label: "Risco intermediário", color: "#f59e0b" }
    return             { label: "Alto risco",           color: "#ef4444" }
  }
  const cls  = risco ? classify(risco) : null
  const text = risco ? `Risco Cardiovascular Framingham (10 anos): ${risco}% — ${cls?.label}` : ""
  return (
    <CalcCard icon={Heart} title="Risco Cardiovascular (Framingham)" color="#ef4444">
      <div className="space-y-3">
        <Toggle label="Sexo" options={["Homem", "Mulher"]} value={sexo} onChange={setSexo} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Idade" unit="anos" value={idade} onChange={setIdade} min={20} max={79} />
          <Field label="Col. Total" unit="mg/dL" value={tc} onChange={setTc} min={0} />
          <Field label="HDL" unit="mg/dL" value={hdl} onChange={setHdl} min={0} />
          <Field label="PAS" unit="mmHg" value={pas} onChange={setPas} min={0} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Toggle label="Trat. anti-hipert." options={["Sim","Não"]} value={tratado} onChange={setTratado} />
          <Toggle label="Fumante" options={["Sim","Não"]} value={fumante} onChange={setFumante} />
        </div>
        {risco && cls && (
          <ResultBox label="Risco em 10 anos" value={`${risco}%`}
            sub={`${cls.label} · <10% baixo · 10–20% intermediário · >20% alto`}
            color={cls.color} copyId="fram" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcGLP1({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,      setPeso]      = useState("")
  const [imc,       setImc]       = useState("")
  const [indicacao, setIndicacao] = useState("Obesidade")
  const [farmaco,   setFarmaco]   = useState("Semaglutida")
  const p = parseFloat(peso); const im = parseFloat(imc)
  let resultado = ""
  if (p > 0 || im > 0) {
    if (farmaco === "Semaglutida") {
      resultado = `Semaglutida (Ozempic/Wegovy) — ${indicacao}:\n` +
        `Sem 1–4: 0,25 mg/semana SC\n` +
        `Sem 5–8: 0,5 mg/semana SC\n` +
        `Sem 9–12: 1,0 mg/semana SC\n` +
        `Sem 13+: 1,7–2,4 mg/semana SC (ajustar conforme resposta)`
    } else if (farmaco === "Liraglutida") {
      resultado = `Liraglutida (Victoza/Saxenda) — ${indicacao}:\n` +
        `Sem 1: 0,6 mg/dia SC\n` +
        `Sem 2: 1,2 mg/dia SC\n` +
        `Sem 3+: 1,8 mg/dia SC (manutenção)\n` +
        `Obesidade (Saxenda): máx 3,0 mg/dia SC`
    } else {
      resultado = `Tirzepatida (Mounjaro) — ${indicacao}:\n` +
        `Sem 1–4: 2,5 mg/semana SC\n` +
        `Sem 5–8: 5,0 mg/semana SC\n` +
        `Sem 9–12: 7,5 mg/semana SC\n` +
        `Sem 13–16: 10,0 mg/semana SC\n` +
        `Sem 17–20: 12,5 mg/semana SC\n` +
        `Sem 21+: 15,0 mg/semana SC (dose máxima)`
    }
  }
  const aviso = "Dose inicial — ajustar conforme resposta clínica. Prescrição é responsabilidade médica."
  const text  = resultado ? `${resultado}\n\nAviso: ${aviso}` : ""
  return (
    <CalcCard icon={Pill} title="Protocolo GLP-1" color="#a78bfa">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
          <Field label="IMC" unit="kg/m²" value={imc} onChange={setImc} min={0} />
        </div>
        <Select label="Indicação" value={indicacao}
          options={[
            { value: "Obesidade",     label: "Obesidade (IMC ≥30)" },
            { value: "DM2",           label: "Diabetes Tipo 2" },
            { value: "Emagrecimento", label: "Sobrepeso com comorbidade" },
            { value: "Longevidade",   label: "Longevidade / Metabólico" },
          ]}
          onChange={setIndicacao} />
        <Toggle label="Fármaco" options={["Semaglutida","Liraglutida","Tirzepatida"]} value={farmaco} onChange={setFarmaco} />
        {resultado && (
          <div>
            <div className="mt-3 rounded-xl p-4"
              style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div className="text-[10px] font-mono tracking-wider uppercase mb-2" style={{ color: "#a78bfa" }}>
                Protocolo de Titulação
              </div>
              {resultado.split("\n").map((line, idx) => (
                <p key={idx} className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-2"><WarningBox text={aviso} /></div>
            <div className="mt-2 flex justify-end">
              <CopyButton id="glp1" text={text} copied={copied} onCopy={onCopy} />
            </div>
          </div>
        )}
      </div>
    </CalcCard>
  )
}

function calcCKDEPI(creat: number, idade: number, sexo: string): number {
  const kappa = sexo === "Mulher" ? 0.7 : 0.9
  const alpha = sexo === "Mulher" ? -0.241 : -0.302
  const sex   = sexo === "Mulher" ? 1.012 : 1.0
  const ratio = creat / kappa
  const term1 = Math.min(ratio, 1) ** alpha
  const term2 = Math.max(ratio, 1) ** (-1.200)
  return 142 * term1 * term2 * (0.9938 ** idade) * sex
}

function CalcTFG({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [creat, setCreat] = useState(""); const [idade, setIdade] = useState("")
  const [sexo, setSexo]   = useState("Homem")
  const c = parseFloat(creat); const i = parseFloat(idade)
  const tfg = c > 0 && i > 0 ? Math.round(calcCKDEPI(c, i, sexo)) : null
  function classify(v: number): { label: string; estadio: string; color: string } {
    if (v >= 90) return { estadio: "G1",  label: "Normal ou elevada",  color: "#00c07f" }
    if (v >= 60) return { estadio: "G2",  label: "Levemente reduzida", color: "#84cc16" }
    if (v >= 45) return { estadio: "G3a", label: "Redução leve–mod.",  color: "#f59e0b" }
    if (v >= 30) return { estadio: "G3b", label: "Redução mod–grave",  color: "#f97316" }
    if (v >= 15) return { estadio: "G4",  label: "Redução grave",      color: "#ef4444" }
    return              { estadio: "G5",  label: "Falência renal",     color: "#dc2626" }
  }
  const cls  = tfg ? classify(tfg) : null
  const text = tfg ? `TFG CKD-EPI: ${tfg} mL/min/1,73m² — Estádio ${cls?.estadio} (${cls?.label})` : ""
  return (
    <CalcCard icon={Microscope} title="TFG CKD-EPI" color="#06b6d4">
      <div className="space-y-3">
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Creatinina" unit="mg/dL" value={creat} onChange={setCreat} min={0} step="0.01" />
          <Field label="Idade" unit="anos" value={idade} onChange={setIdade} min={18} max={110} />
        </div>
        {tfg && cls && (
          <ResultBox label={`TFG · Estádio ${cls.estadio}`} value={`${tfg} mL/min/1,73m²`}
            sub={cls.label} color={cls.color}
            copyId="tfg" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcMetabolico({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [ca, setCa]     = useState("")
  const [sexo, setSexo] = useState("Homem")
  const v = parseFloat(ca)
  function classify(val: number, s: string): { label: string; color: string; rec: string } {
    if (s === "Homem") {
      if (val < 94)  return { label: "Normal",           color: "#00c07f", rec: "Manter hábitos saudáveis" }
      if (val < 102) return { label: "Risco aumentado",  color: "#f59e0b", rec: "Redução de peso e atividade física regular" }
      return               { label: "Alto risco",        color: "#ef4444", rec: "Avaliação metabólica completa urgente" }
    } else {
      if (val < 80)  return { label: "Normal",           color: "#00c07f", rec: "Manter hábitos saudáveis" }
      if (val < 88)  return { label: "Risco aumentado",  color: "#f59e0b", rec: "Redução de peso e atividade física regular" }
      return               { label: "Alto risco",        color: "#ef4444", rec: "Avaliação metabólica completa urgente" }
    }
  }
  const cls  = v > 0 ? classify(v, sexo) : null
  const ref  = sexo === "Homem" ? "normal <94 / risco ≥94 / alto ≥102 cm" : "normal <80 / risco ≥80 / alto ≥88 cm"
  const text = v > 0 && cls ? `Risco Metabólico (CA: ${v}cm, ${sexo}): ${cls.label}. ${cls.rec}` : ""
  return (
    <CalcCard icon={Ruler} title="Risco Metabólico (CA)" color="#e1306c">
      <div className="space-y-3">
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <Field label="Circunferência abdominal" unit="cm" value={ca} onChange={setCa} min={0} />
        <div className="text-[11px] p-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          Referência ({sexo}): {ref}
        </div>
        {v > 0 && cls && (
          <ResultBox label="Classificação" value={cls.label} sub={cls.rec}
            color={cls.color} copyId="meta" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcCastelli({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [ct,   setCt]   = useState("")
  const [hdl,  setHdl]  = useState("")
  const [ldl,  setLdl]  = useState("")
  const [sexo, setSexo] = useState("Homem")
  const ct_v = parseFloat(ct); const h = parseFloat(hdl); const l = parseFloat(ldl)
  const c1 = ct_v > 0 && h > 0 ? ct_v / h : null
  const c2 = l > 0   && h > 0 ? l / h    : null
  function classifyC1(v: number, s: string): { label: string; color: string } {
    if (s === "Homem") {
      if (v < 3.5) return { label: "Ótimo",      color: "#00c07f" }
      if (v <= 5.0) return { label: "Limítrofe",  color: "#f59e0b" }
      return              { label: "Alto",        color: "#ef4444" }
    } else {
      if (v < 3.0)  return { label: "Ótimo",      color: "#00c07f" }
      if (v <= 4.4) return { label: "Limítrofe",  color: "#f59e0b" }
      return               { label: "Alto",       color: "#ef4444" }
    }
  }
  function classifyC2(v: number, s: string): { label: string; color: string } {
    if (s === "Homem") {
      if (v < 2.0)  return { label: "Ótimo",     color: "#00c07f" }
      if (v <= 3.5) return { label: "Limítrofe", color: "#f59e0b" }
      return               { label: "Alto",      color: "#ef4444" }
    } else {
      if (v < 1.5)  return { label: "Ótimo",     color: "#00c07f" }
      if (v <= 3.0) return { label: "Limítrofe", color: "#f59e0b" }
      return               { label: "Alto",      color: "#ef4444" }
    }
  }
  const cls1 = c1 ? classifyC1(c1, sexo) : null
  const cls2 = c2 ? classifyC2(c2, sexo) : null
  const text = c1 && cls1
    ? `Castelli I: ${c1.toFixed(2)} (${cls1.label})${c2 && cls2 ? ` · Castelli II: ${c2.toFixed(2)} (${cls2.label})` : ""}`
    : ""
  return (
    <CalcCard icon={TrendingUp} title="Índice de Castelli" color="#8b5cf6">
      <div className="space-y-3">
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="CT" unit="mg/dL" value={ct} onChange={setCt} min={0} />
          <Field label="HDL" unit="mg/dL" value={hdl} onChange={setHdl} min={0} />
          <Field label="LDL" unit="mg/dL" value={ldl} onChange={setLdl} min={0} />
        </div>
        {c1 && cls1 && (
          <div className="space-y-2 mt-2">
            <div className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: `${cls1.color}10`, border: `1px solid ${cls1.color}25` }}>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: cls1.color }}>
                  Castelli I (CT/HDL)
                </div>
                <div className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{c1.toFixed(2)}</div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {cls1.label} · {sexo === "Homem" ? "ótimo <3.5 / limítrofe 3.5–5.0 / alto >5.0" : "ótimo <3.0 / limítrofe 3.0–4.4 / alto >4.4"}
                </div>
              </div>
            </div>
            {c2 && cls2 && (
              <div className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: `${cls2.color}10`, border: `1px solid ${cls2.color}25` }}>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: cls2.color }}>
                    Castelli II (LDL/HDL)
                  </div>
                  <div className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{c2.toFixed(2)}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {cls2.label} · {sexo === "Homem" ? "ótimo <2.0 / limítrofe 2.0–3.5 / alto >3.5" : "ótimo <1.5 / limítrofe 1.5–3.0 / alto >3.0"}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <CopyButton id="castelli" text={text} copied={copied} onCopy={onCopy} />
            </div>
          </div>
        )}
      </div>
    </CalcCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ABA ENDOCRINOLOGIA
// ════════════════════════════════════════════════════════════════════════════

function CalcLevotiroxina({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,      setPeso]      = useState("")
  const [tsh,       setTsh]       = useState("")
  const [idade,     setIdade]     = useState("")
  const [cardiopata,setCardiopata]= useState("Não")
  const p = parseFloat(peso); const i = parseFloat(idade)
  let doseMin = 0; let doseMax = 0; let estrategia = ""
  if (p > 0 && i > 0) {
    const idoso = i >= 60
    if (idoso || cardiopata === "Sim") {
      doseMin = Math.round(p * 0.5)
      doseMax = Math.round(p * 1.0)
      estrategia = "Iniciar com dose baixa (0.5 mcg/kg/dia) e titular gradualmente a cada 4–6 semanas conforme TSH"
    } else {
      doseMin = Math.round(p * 1.6)
      doseMax = Math.round(p * 1.6)
      estrategia = "Dose plena. Titular com TSH de controle em 6–8 semanas"
    }
  }
  const doseStr = doseMin === doseMax ? `${doseMin} mcg/dia` : `${doseMin}–${doseMax} mcg/dia`
  const text = p > 0 && i > 0 ? `Levotiroxina: ${doseStr} · ${estrategia}` : ""
  return (
    <CalcCard icon={Pill} title="Dose de Levotiroxina" color="#06b6d4">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
          <Field label="Idade" unit="anos" value={idade} onChange={setIdade} min={0} />
          <Field label="TSH" unit="mU/L" value={tsh} onChange={setTsh} min={0} step="0.01" />
        </div>
        <Toggle label="Cardiopata" options={["Sim","Não"]} value={cardiopata} onChange={setCardiopata} />
        {p > 0 && i > 0 && (
          <div className="space-y-2 mt-2">
            <ResultBox label="Dose Inicial Sugerida" value={doseStr}
              sub={estrategia} color="#06b6d4"
              copyId="levo" copyText={text} copied={copied} onCopy={onCopy} />
            <WarningBox text="Dose inicial — ajustar conforme TSH de controle a cada 6–8 semanas." />
          </div>
        )}
      </div>
    </CalcCard>
  )
}

function CalcFINDRISC({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [idadeGrp,  setIdadeGrp]  = useState("0")
  const [imcGrp,    setImcGrp]    = useState("0")
  const [caGrp,     setCaGrp]     = useState("0")
  const [atividade, setAtividade] = useState("0")
  const [vegetal,   setVegetal]   = useState("0")
  const [antihipert,setAntihipert]= useState("0")
  const [glicemia,  setGlicemia]  = useState("0")
  const [familiar,  setFamiliar]  = useState("0")
  const [sexo,      setSexo]      = useState("Homem")
  const score = [idadeGrp, imcGrp, caGrp, atividade, vegetal, antihipert, glicemia, familiar]
    .reduce((sum, v) => sum + parseInt(v, 10), 0)
  function classify(v: number): { label: string; color: string; prob: string } {
    if (v < 7)   return { label: "Baixo",       color: "#00c07f", prob: "<1%" }
    if (v < 12)  return { label: "Leve",        color: "#84cc16", prob: "~1%" }
    if (v < 15)  return { label: "Moderado",    color: "#f59e0b", prob: "~17%" }
    if (v <= 20) return { label: "Alto",        color: "#f97316", prob: "~33%" }
    return              { label: "Muito alto",  color: "#ef4444", prob: ">50%" }
  }
  const cls  = classify(score)
  const text = `FINDRISC: ${score} pontos — Risco ${cls.label} de DM2 em 10 anos (${cls.prob})`
  return (
    <CalcCard icon={Activity} title="Score FINDRISC (Risco DM2)" color="#f59e0b">
      <div className="space-y-3">
        <Toggle label="Sexo (para CA)" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <Select label="Idade" value={idadeGrp}
          options={[{ value:"0",label:"< 45 anos" },{ value:"2",label:"45–54 anos" },{ value:"3",label:"55–64 anos" },{ value:"4",label:"≥ 65 anos" }]}
          onChange={setIdadeGrp} />
        <Select label="IMC" value={imcGrp}
          options={[{ value:"0",label:"< 25 kg/m²" },{ value:"1",label:"25–30 kg/m²" },{ value:"3",label:"> 30 kg/m²" }]}
          onChange={setImcGrp} />
        <Select label={`Circunferência abdominal (${sexo})`} value={caGrp}
          options={sexo === "Homem"
            ? [{ value:"0",label:"< 94 cm (normal)" },{ value:"3",label:"94–102 cm (elevada)" },{ value:"4",label:"> 102 cm (muito elevada)" }]
            : [{ value:"0",label:"< 80 cm (normal)" },{ value:"3",label:"80–88 cm (elevada)" },{ value:"4",label:"> 88 cm (muito elevada)" }]}
          onChange={setCaGrp} />
        <Toggle label="Atividade física ≥ 30min/dia" options={["Sim","Não"]}
          value={atividade === "0" ? "Sim" : "Não"}
          onChange={v => setAtividade(v === "Sim" ? "0" : "2")} />
        <Toggle label="Vegetais/frutas diariamente" options={["Sim","Não"]}
          value={vegetal === "0" ? "Sim" : "Não"}
          onChange={v => setVegetal(v === "Sim" ? "0" : "1")} />
        <Toggle label="Uso de anti-hipertensivo" options={["Não","Sim"]}
          value={antihipert === "0" ? "Não" : "Sim"}
          onChange={v => setAntihipert(v === "Sim" ? "2" : "0")} />
        <Toggle label="Glicemia alta detectada previamente" options={["Não","Sim"]}
          value={glicemia === "0" ? "Não" : "Sim"}
          onChange={v => setGlicemia(v === "Sim" ? "5" : "0")} />
        <Select label="Familiar com DM" value={familiar}
          options={[{ value:"0",label:"Nenhum" },{ value:"3",label:"Avós, tio, primo" },{ value:"5",label:"Pai, mãe ou irmão(ã)" }]}
          onChange={setFamiliar} />
        <ResultBox label={`Score FINDRISC · Risco ${cls.label}`} value={`${score} pts`}
          sub={`Probabilidade DM2 em 10 anos: ${cls.prob}`}
          color={cls.color} copyId="findrisc" copyText={text} copied={copied} onCopy={onCopy} />
      </div>
    </CalcCard>
  )
}

function CalcBillewicz({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  type Item = { label: string; pts: number; checked: boolean }
  const [items, setItems] = useState<Item[]>([
    { label: "Diminuição da sudorese",    pts: 6,   checked: false },
    { label: "Rouquidão",                 pts: 5,   checked: false },
    { label: "Parestesia",                pts: 5,   checked: false },
    { label: "Constipação intestinal",    pts: 2,   checked: false },
    { label: "Aumento de peso",           pts: 1,   checked: false },
    { label: "Pele seca",                 pts: 3,   checked: false },
    { label: "Reflexos diminuídos",       pts: 3,   checked: false },
    { label: "Edema periorbitário",       pts: 4,   checked: false },
    { label: "Bradicardia (FC < 75)",     pts: 4,   checked: false },
    { label: "Movimentos lentos",         pts: 11,  checked: false },
    { label: "Taquicardia (FC > 90)",     pts: -4,  checked: false },
    { label: "Pele quente e úmida",       pts: -6,  checked: false },
    { label: "Fibrilação atrial",         pts: -3,  checked: false },
    { label: "Pés e mãos quentes",        pts: -2,  checked: false },
    { label: "Apetite aumentado",         pts: -3,  checked: false },
    { label: "Nervosismo",                pts: -2,  checked: false },
  ])
  const score = items.reduce((sum, it) => it.checked ? sum + it.pts : sum, 0)
  function classify(v: number): { label: string; color: string } {
    if (v > 25)  return { label: "Hipotireoidismo provável", color: "#ef4444" }
    if (v >= 10) return { label: "Hipotireoidismo suspeito", color: "#f59e0b" }
    return              { label: "Hipotireoidismo improvável", color: "#00c07f" }
  }
  const cls  = classify(score)
  const text = `Escore Billewicz: ${score} — ${cls.label}`
  const toggle = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it))
  }
  return (
    <CalcCard icon={Stethoscope} title="Escore de Billewicz (Hipotireoidismo)" color="#8b5cf6">
      <div className="space-y-2">
        {items.map((it, idx) => (
          <CheckItem key={idx} label={it.label} points={it.pts}
            checked={it.checked} onChange={() => toggle(idx)} />
        ))}
        <ResultBox label={`Score Billewicz`} value={`${score > 0 ? "+" : ""}${score}`}
          sub={cls.label} color={cls.color}
          copyId="billewicz" copyText={text} copied={copied} onCopy={onCopy} />
      </div>
    </CalcCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ABA NUTROLOGIA
// ════════════════════════════════════════════════════════════════════════════

function CalcProteina({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,     setPeso]     = useState("")
  const [objetivo, setObjetivo] = useState("manutencao")
  const p = parseFloat(peso)
  const ranges: Record<string, [number, number]> = {
    manutencao:  [0.8,  0.8],
    ativo:       [1.2,  1.6],
    hipertrofia: [1.6,  2.2],
    emagrec:     [1.2,  1.5],
    idoso:       [1.2,  1.6],
  }
  const [min, max] = ranges[objetivo] ?? [0.8, 0.8]
  const gMin = p > 0 ? Math.round(p * min) : null
  const gMax = p > 0 ? Math.round(p * max) : null
  const refMin = gMin ? Math.round(gMin / 4) : null
  const refMax = gMax ? Math.round(gMax / 4) : null
  const valueStr = gMin && gMax
    ? (gMin === gMax ? `${gMin} g/dia` : `${gMin}–${gMax} g/dia`)
    : ""
  const subStr = refMin && refMax
    ? (refMin === refMax ? `${refMin} g/refeição (4 refeições) · ${min} g/kg` : `${refMin}–${refMax} g/refeição (÷4) · ${min}–${max} g/kg`)
    : ""
  const text = valueStr ? `Necessidade proteica (${objetivo}): ${valueStr} · ${subStr}` : ""
  return (
    <CalcCard icon={Dumbbell} title="Necessidade Proteica" color="#f97316">
      <div className="space-y-3">
        <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
        <Select label="Objetivo" value={objetivo}
          options={[
            { value:"manutencao",  label:"Manutenção (0,8 g/kg)" },
            { value:"ativo",       label:"Ativo (1,2–1,6 g/kg)" },
            { value:"hipertrofia", label:"Hipertrofia (1,6–2,2 g/kg)" },
            { value:"emagrec",     label:"Emagrecimento (1,2–1,5 g/kg)" },
            { value:"idoso",       label:"Idoso ≥65 anos (1,2–1,6 g/kg)" },
          ]}
          onChange={setObjetivo} />
        {valueStr && (
          <ResultBox label="Proteína Diária" value={valueStr} sub={subStr}
            color="#f97316" copyId="proteina" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcDeficit({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [tmb,    setTmb]    = useState("")
  const [fator,  setFator]  = useState("1.55")
  const [meta,   setMeta]   = useState("0.5")
  const t = parseFloat(tmb); const f = parseFloat(fator); const m = parseFloat(meta)
  const get    = t > 0 ? Math.round(t * f) : null
  const deficit = Math.round((m * 7700) / 7)
  const alvo   = get ? get - deficit : null
  const alerta = deficit > 1000
  const text   = get && alvo
    ? `GET: ${get} kcal/dia · Déficit: ${deficit} kcal/dia · Alvo: ${alvo} kcal/dia (meta: -${meta} kg/semana)`
    : ""
  return (
    <CalcCard icon={Flame} title="Déficit Calórico para Emagrecimento" color="#ef4444">
      <div className="space-y-3">
        <Field label="TMB (Harris-Benedict)" unit="kcal" value={tmb} onChange={setTmb} min={0} />
        <Select label="Nível de atividade" value={fator} options={ATIVIDADES} onChange={setFator} />
        <Select label="Meta de perda por semana" value={meta}
          options={[
            { value:"0.25", label:"0,25 kg/semana (déficit ~275 kcal)" },
            { value:"0.5",  label:"0,5 kg/semana (déficit ~550 kcal)" },
            { value:"0.75", label:"0,75 kg/semana (déficit ~825 kcal)" },
            { value:"1.0",  label:"1,0 kg/semana (déficit ~1100 kcal)" },
          ]}
          onChange={setMeta} />
        {get && alvo && (
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>GET (gasto energético total)</span>
              <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{get} kcal</span>
            </div>
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>Déficit necessário</span>
              <span className="font-bold font-mono" style={{ color: alerta ? "#ef4444" : "var(--text-primary)" }}>{deficit} kcal/dia</span>
            </div>
            <ResultBox label="Calorias Alvo/Dia" value={`${alvo} kcal`}
              sub={`Déficit de ${deficit} kcal · meta ${meta} kg/semana`}
              color={alerta ? "#ef4444" : "#00c07f"}
              copyId="deficit" copyText={text} copied={copied} onCopy={onCopy} />
            {alerta && <WarningBox text="Déficit > 1000 kcal/dia pode causar perda de massa magra. Avalie com cautela." />}
          </div>
        )}
      </div>
    </CalcCard>
  )
}

function CalcIAC({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [quadril, setQuadril] = useState("")
  const [altura,  setAltura]  = useState("")
  const [sexo,    setSexo]    = useState("Homem")
  const q = parseFloat(quadril); const h = parseFloat(altura)
  const iac = q > 0 && h > 0 ? (q / Math.pow(h / 100, 1.5)) - 18 : null
  function classify(v: number, s: string): { label: string; color: string } {
    if (s === "Homem") {
      if (v < 8)   return { label: "Magro",     color: "#3b7fff" }
      if (v <= 19) return { label: "Normal",    color: "#00c07f" }
      if (v <= 25) return { label: "Sobrepeso", color: "#f59e0b" }
      return              { label: "Obeso",     color: "#ef4444" }
    } else {
      if (v < 21)  return { label: "Magra",     color: "#3b7fff" }
      if (v <= 32) return { label: "Normal",    color: "#00c07f" }
      if (v <= 38) return { label: "Sobrepeso", color: "#f59e0b" }
      return              { label: "Obesa",     color: "#ef4444" }
    }
  }
  const cls  = iac ? classify(iac, sexo) : null
  const ref  = sexo === "Homem" ? "magro <8 / normal 8–19 / sobrepeso 20–25 / obeso >25" : "magra <21 / normal 21–32 / sobrepeso 33–38 / obesa >38"
  const text = iac && cls ? `IAC: ${iac.toFixed(1)}% — ${cls.label}` : ""
  return (
    <CalcCard icon={Scale} title="Índice de Adiposidade Corporal (IAC)" color="#8b5cf6">
      <div className="space-y-3">
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quadril" unit="cm" value={quadril} onChange={setQuadril} min={0} />
          <Field label="Altura" unit="cm" value={altura} onChange={setAltura} min={0} />
        </div>
        <div className="text-[11px] p-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          Referência ({sexo}): {ref}
        </div>
        {iac && cls && (
          <ResultBox label="IAC" value={`${iac.toFixed(1)}%`}
            sub={`${cls.label} · Fórmula: (quadril / altura^1.5) − 18`}
            color={cls.color} copyId="iac" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ABA GINECOLOGIA
// ════════════════════════════════════════════════════════════════════════════

function CalcGestacional({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [imcPre,   setImcPre]   = useState("")
  const [trim,     setTrim]     = useState("1")
  const [multipla, setMultipla] = useState("Não")
  const imc = parseFloat(imcPre); const tr = parseInt(trim)
  type Faixa = { min: number; max: number; label: string }
  function faixaIOM(v: number): Faixa {
    if (v < 18.5) return { min: 12.5, max: 18, label: "Baixo peso" }
    if (v < 25)   return { min: 11.5, max: 16, label: "Peso normal" }
    if (v < 30)   return { min: 7,    max: 11.5, label: "Sobrepeso" }
    return               { min: 5,    max: 9, label: "Obesa" }
  }
  let faixa: Faixa | null = imc > 0 ? faixaIOM(imc) : null
  if (faixa && multipla === "Sim") {
    faixa = { ...faixa, min: faixa.min + 4, max: faixa.max + 5, label: faixa.label + " (gemelar)" }
  }
  const ganhoTrimStr = tr === 1 ? "0,5–2 kg" : tr === 2 ? "4–5 kg" : "4–5 kg"
  const text = faixa
    ? `Ganho gestacional recomendado (${faixa.label}): ${faixa.min}–${faixa.max} kg total · Trim ${tr}: ${ganhoTrimStr}`
    : ""
  return (
    <CalcCard icon={Baby} title="Ganho de Peso Gestacional (IOM)" color="#e1306c">
      <div className="space-y-3">
        <Field label="IMC pré-gestacional" unit="kg/m²" value={imcPre} onChange={setImcPre} min={0} step="0.1" />
        <Select label="Trimestre atual" value={trim}
          options={[{ value:"1",label:"1º Trimestre" },{ value:"2",label:"2º Trimestre" },{ value:"3",label:"3º Trimestre" }]}
          onChange={setTrim} />
        <Toggle label="Gestação múltipla" options={["Não","Sim"]} value={multipla} onChange={setMultipla} />
        {faixa && (
          <div className="space-y-2 mt-2">
            <ResultBox label="Ganho Total Recomendado" value={`${faixa.min}–${faixa.max} kg`}
              sub={`${faixa.label} · Ganho esperado no ${tr}º trim: ${ganhoTrimStr}`}
              color="#e1306c" copyId="gest" copyText={text} copied={copied} onCopy={onCopy} />
          </div>
        )}
      </div>
    </CalcCard>
  )
}

function CalcPreeclampsia({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  type Item = { label: string; pts: number; checked: boolean }
  const [items, setItems] = useState<Item[]>([
    { label: "Primigesta",                    pts: 2, checked: false },
    { label: "Idade > 40 anos",               pts: 1, checked: false },
    { label: "IMC > 35 kg/m²",               pts: 2, checked: false },
    { label: "Histórico pessoal de PE",       pts: 5, checked: false },
    { label: "Familiar 1° grau com PE",       pts: 2, checked: false },
    { label: "Gestação múltipla",             pts: 2, checked: false },
    { label: "Hipertensão arterial crônica",  pts: 3, checked: false },
    { label: "DM pré-gestacional",            pts: 2, checked: false },
    { label: "Doença renal crônica",          pts: 3, checked: false },
    { label: "LES ou Síndrome antifosfolípide", pts: 3, checked: false },
  ])
  const score = items.reduce((s, it) => it.checked ? s + it.pts : s, 0)
  function classify(v: number): { label: string; color: string; rec: string } {
    if (v < 3)  return { label: "Baixo risco",         color: "#00c07f", rec: "Monitoramento rotineiro" }
    if (v <= 5) return { label: "Risco intermediário", color: "#f59e0b", rec: "Vigilância intensificada" }
    return            { label: "Alto risco",           color: "#ef4444", rec: "Recomenda AAS 100–150 mg/dia até 36 semanas" }
  }
  const cls  = classify(score)
  const text = `Score PE: ${score} pontos — ${cls.label}. ${cls.rec}`
  const toggle = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it))
  }
  return (
    <CalcCard icon={Heart} title="Score de Risco de Pré-eclâmpsia" color="#ef4444">
      <div className="space-y-2">
        {items.map((it, idx) => (
          <CheckItem key={idx} label={it.label} points={it.pts}
            checked={it.checked} onChange={() => toggle(idx)} />
        ))}
        <ResultBox label={`Score PE · ${cls.label}`} value={`${score} pts`}
          sub={cls.rec} color={cls.color}
          copyId="pe" copyText={text} copied={copied} onCopy={onCopy} />
      </div>
    </CalcCard>
  )
}

function CalcJanelaFertil({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [ciclo,  setCiclo]  = useState("28")
  const [inicio, setInicio] = useState("")
  const c = parseInt(ciclo); const d = inicio ? new Date(inicio + "T12:00:00") : null
  let ovulacao: Date | null = null; let janelaInicio: Date | null = null; let janelaFim: Date | null = null
  if (d && c > 0) {
    ovulacao = new Date(d); ovulacao.setDate(d.getDate() + (c - 14))
    janelaInicio = new Date(ovulacao); janelaInicio.setDate(ovulacao.getDate() - 5)
    janelaFim    = new Date(ovulacao); janelaFim.setDate(ovulacao.getDate() + 1)
  }
  const fmt = (dt: Date) => dt.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" })
  const text = ovulacao && janelaInicio && janelaFim
    ? `Ovulação provável: ${fmt(ovulacao)} · Janela fértil: ${fmt(janelaInicio)} a ${fmt(janelaFim)}`
    : ""
  return (
    <CalcCard icon={Baby} title="Janela Fértil" color="#a78bfa">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duração do ciclo" unit="dias" value={ciclo} onChange={setCiclo} min={21} max={35} />
        </div>
        <FieldDate label="1° dia do último período" value={inicio} onChange={setInicio} />
        {ovulacao && janelaInicio && janelaFim && (
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>Ovulação provável</span>
              <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{fmt(ovulacao)}</span>
            </div>
            <ResultBox label="Janela Fértil" value={`${fmt(janelaInicio)} – ${fmt(janelaFim)}`}
              sub={`Ovulação no dia ${c - 14} do ciclo (±2 dias)`}
              color="#a78bfa" copyId="fertil" copyText={text} copied={copied} onCopy={onCopy} />
          </div>
        )}
      </div>
    </CalcCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ABA CARDIOLOGIA
// ════════════════════════════════════════════════════════════════════════════

function CalcWells({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  type Item = { label: string; pts: number; checked: boolean }
  const [items, setItems] = useState<Item[]>([
    { label: "Sinais e sintomas clínicos de TVP",                       pts: 3,   checked: false },
    { label: "Diagnóstico alternativo menos provável que TEP",          pts: 3,   checked: false },
    { label: "FC > 100 bpm",                                            pts: 1.5, checked: false },
    { label: "Imobilização ≥3 dias ou cirurgia nas últimas 4 semanas",  pts: 1.5, checked: false },
    { label: "TVP ou TEP prévio documentado",                           pts: 1.5, checked: false },
    { label: "Hemoptise",                                               pts: 1,   checked: false },
    { label: "Neoplasia ativa (tratamento em 6 meses ou paliativo)",    pts: 1,   checked: false },
  ])
  const score = items.reduce((s, it) => it.checked ? s + it.pts : s, 0)
  function classify(v: number): { label: string; color: string } {
    if (v <= 1) return { label: "Baixa probabilidade",         color: "#00c07f" }
    if (v <= 6) return { label: "Probabilidade intermediária", color: "#f59e0b" }
    return            { label: "Alta probabilidade",           color: "#ef4444" }
  }
  const cls  = classify(score)
  const text = `Wells TEP: ${score} pontos — ${cls.label}`
  const toggle = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it))
  }
  return (
    <CalcCard icon={Heart} title="Score de Wells (TEP)" color="#ef4444">
      <div className="space-y-2">
        {items.map((it, idx) => (
          <CheckItem key={idx} label={it.label} points={it.pts}
            checked={it.checked} onChange={() => toggle(idx)} />
        ))}
        <ResultBox label={`Wells TEP · ${cls.label}`} value={`${score} pts`}
          sub="≤1 baixa · 2–6 intermediária · ≥7 alta probabilidade"
          color={cls.color} copyId="wells" copyText={text} copied={copied} onCopy={onCopy} />
      </div>
    </CalcCard>
  )
}

function CalcCHA2DS2({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [sexo, setSexo] = useState("Homem")
  type Item = { label: string; pts: number; checked: boolean }
  const [items, setItems] = useState<Item[]>([
    { label: "C — ICC ou FEVE < 40%",                              pts: 1, checked: false },
    { label: "H — Hipertensão arterial",                           pts: 1, checked: false },
    { label: "A₂ — Idade ≥ 75 anos",                              pts: 2, checked: false },
    { label: "D — Diabetes mellitus",                              pts: 1, checked: false },
    { label: "S₂ — AVC / AIT / Tromboembolismo prévio",           pts: 2, checked: false },
    { label: "V — Doença vascular (IAM, placa aórtica, DAP)",     pts: 1, checked: false },
    { label: "A — Idade 65–74 anos",                              pts: 1, checked: false },
  ])
  const checkScore = items.reduce((s, it) => it.checked ? s + it.pts : s, 0)
  const scSexo = sexo === "Mulher" ? 1 : 0
  const score  = checkScore + scSexo
  function classify(v: number, s: string): { label: string; color: string; rec: string } {
    if (s === "Homem") {
      if (v === 0) return { label: "Sem indicação de anticoagulação", color: "#00c07f", rec: "Risco muito baixo" }
      if (v === 1) return { label: "Considerar anticoagulação",       color: "#f59e0b", rec: "Avaliar individualmente" }
      return             { label: "Anticoagulação recomendada",       color: "#ef4444", rec: "Iniciar anticoagulante oral" }
    } else {
      if (v <= 1) return { label: "Sem indicação de anticoagulação", color: "#00c07f", rec: "Risco muito baixo" }
      if (v === 2) return { label: "Considerar anticoagulação",      color: "#f59e0b", rec: "Avaliar individualmente" }
      return             { label: "Anticoagulação recomendada",      color: "#ef4444", rec: "Iniciar anticoagulante oral" }
    }
  }
  const cls  = classify(score, sexo)
  const text = `CHA₂DS₂-VASc: ${score} pontos — ${cls.label}. ${cls.rec}`
  const toggle = (idx: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it))
  }
  return (
    <CalcCard icon={Heart} title="CHA₂DS₂-VASc (Fibrilação Atrial)" color="#3b7fff">
      <div className="space-y-2">
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        {items.map((it, idx) => (
          <CheckItem key={idx} label={it.label} points={it.pts}
            checked={it.checked} onChange={() => toggle(idx)} />
        ))}
        {sexo === "Mulher" && (
          <div className="text-[11px] p-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
            Sexo feminino: +1 ponto (Sc) adicionado automaticamente
          </div>
        )}
        <ResultBox label={`CHA₂DS₂-VASc`} value={`${score} pts`}
          sub={`${cls.label} · ${cls.rec}`}
          color={cls.color} copyId="chads" copyText={text} copied={copied} onCopy={onCopy} />
      </div>
    </CalcCard>
  )
}

function CalcPressao({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [pas, setPas] = useState(""); const [pad, setPad] = useState("")
  const s = parseFloat(pas); const d = parseFloat(pad)
  const pp  = s > 0 && d > 0 ? s - d : null
  const pam = pp !== null && d > 0 ? Math.round(d + pp / 3) : null
  function classifyPP(v: number): { label: string; color: string } {
    if (v < 40) return { label: "Normal",                  color: "#00c07f" }
    if (v < 60) return { label: "Limítrofe",               color: "#f59e0b" }
    return            { label: "Aumentada (risco CV)",     color: "#ef4444" }
  }
  function classifyPAM(v: number): { label: string; color: string } {
    if (v < 65)  return { label: "Baixa (hipoperfusão)",  color: "#3b7fff" }
    if (v <= 100) return { label: "Normal",               color: "#00c07f" }
    return             { label: "Elevada",                color: "#ef4444" }
  }
  const clsPP  = pp  !== null ? classifyPP(pp)   : null
  const clsPAM = pam !== null ? classifyPAM(pam) : null
  const text = pp && pam && clsPP && clsPAM
    ? `PP: ${pp} mmHg (${clsPP.label}) · PAM: ${pam} mmHg (${clsPAM.label})`
    : ""
  return (
    <CalcCard icon={Activity} title="Pressão de Pulso e PAM" color="#8b5cf6">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="PAS" unit="mmHg" value={pas} onChange={setPas} min={0} />
          <Field label="PAD" unit="mmHg" value={pad} onChange={setPad} min={0} />
        </div>
        {pp !== null && pam !== null && clsPP && clsPAM && (
          <div className="space-y-2 mt-2">
            <div className="rounded-xl p-3" style={{ background: `${clsPP.color}10`, border: `1px solid ${clsPP.color}25` }}>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: clsPP.color }}>
                Pressão de Pulso (PP = PAS − PAD)
              </div>
              <div className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{pp} mmHg</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {clsPP.label} · normal &lt;40 mmHg · aumentada &gt;60 mmHg
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: `${clsPAM.color}10`, border: `1px solid ${clsPAM.color}25` }}>
              <div className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: clsPAM.color }}>
                Pressão Arterial Média (PAD + PP/3)
              </div>
              <div className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>{pam} mmHg</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {clsPAM.label} · normal 70–100 mmHg · meta UTI ≥65 mmHg
              </div>
            </div>
            <div className="flex justify-end">
              <CopyButton id="pressao" text={text} copied={copied} onCopy={onCopy} />
            </div>
          </div>
        )}
      </div>
    </CalcCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// ABA NUTRIÇÃO
// ════════════════════════════════════════════════════════════════════════════

function CalcCargaGlicemica({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [ig,    setIg]    = useState("")
  const [carbo, setCarbo] = useState("")
  const igV = parseFloat(ig); const carbV = parseFloat(carbo)
  const cg = igV > 0 && carbV > 0 ? (igV * carbV) / 100 : null
  function classify(v: number): { label: string; color: string } {
    if (v < 10) return { label: "Carga baixa",  color: "#00c07f" }
    if (v < 20) return { label: "Carga média",  color: "#f59e0b" }
    return            { label: "Carga alta",   color: "#ef4444" }
  }
  const cls  = cg ? classify(cg) : null
  const text = cg && cls ? `Carga Glicêmica: ${cg.toFixed(1)} — ${cls.label} (IG: ${igV}, Carbo: ${carbV}g)` : ""
  return (
    <CalcCard icon={Apple} title="Carga Glicêmica" color="#00c07f">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Índice Glicêmico" unit="0–100" value={ig} onChange={setIg} min={0} max={100} />
          <Field label="Carboidratos disponíveis" unit="g/porção" value={carbo} onChange={setCarbo} min={0} />
        </div>
        <div className="text-[11px] p-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          CG = (IG × carboidratos) / 100 · baixa &lt;10 / média 11–19 / alta ≥20
        </div>
        {cg && cls && (
          <ResultBox label="Carga Glicêmica" value={cg.toFixed(1)}
            sub={`${cls.label} · baixa <10 / média 11–19 / alta ≥20`}
            color={cls.color} copyId="cg" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcRCQ({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [cintura, setCintura] = useState(""); const [quadril, setQuadril] = useState("")
  const [sexo,    setSexo]    = useState("Homem")
  const c = parseFloat(cintura); const q = parseFloat(quadril)
  const rcq = c > 0 && q > 0 ? c / q : null
  function classify(v: number, s: string): { label: string; color: string } {
    if (s === "Homem") {
      if (v < 0.9)  return { label: "Risco baixo",     color: "#00c07f" }
      if (v < 1.0)  return { label: "Risco moderado",  color: "#f59e0b" }
      return               { label: "Risco alto",      color: "#ef4444" }
    } else {
      if (v < 0.8)  return { label: "Risco baixo",     color: "#00c07f" }
      if (v < 0.85) return { label: "Risco moderado",  color: "#f59e0b" }
      return               { label: "Risco alto",      color: "#ef4444" }
    }
  }
  const cls  = rcq ? classify(rcq, sexo) : null
  const ref  = sexo === "Homem" ? "baixo <0.90 / moderado 0.90–0.99 / alto ≥1.0" : "baixo <0.80 / moderado 0.80–0.84 / alto ≥0.85"
  const text = rcq && cls ? `RCQ: ${rcq.toFixed(2)} — ${cls.label} (${sexo})` : ""
  return (
    <CalcCard icon={Ruler} title="Relação Cintura/Quadril (RCQ)" color="#f59e0b">
      <div className="space-y-3">
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cintura" unit="cm" value={cintura} onChange={setCintura} min={0} />
          <Field label="Quadril" unit="cm" value={quadril} onChange={setQuadril} min={0} />
        </div>
        <div className="text-[11px] p-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          Referência ({sexo}): {ref}
        </div>
        {rcq && cls && (
          <ResultBox label="RCQ" value={rcq.toFixed(2)}
            sub={`${cls.label} · risco cardiovascular`}
            color={cls.color} copyId="rcq" copyText={text} copied={copied} onCopy={onCopy} />
        )}
      </div>
    </CalcCard>
  )
}

function CalcMifflin({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,  setPeso]  = useState(""); const [alt,   setAlt]   = useState("")
  const [idade, setIdade] = useState(""); const [sexo,  setSexo]  = useState("Homem")
  const [fator, setFator] = useState("1.55")
  const p = parseFloat(peso); const h = parseFloat(alt)
  const a = parseFloat(idade); const f = parseFloat(fator)
  let tmb: number | null = null
  if (p > 0 && h > 0 && a > 0) {
    tmb = sexo === "Homem"
      ? (10 * p) + (6.25 * h) - (5 * a) + 5
      : (10 * p) + (6.25 * h) - (5 * a) - 161
  }
  const get = tmb ? Math.round(tmb * f) : null
  const prot = get ? Math.round((get * 0.30) / 4) : null
  const carb  = get ? Math.round((get * 0.45) / 4) : null
  const gord  = get ? Math.round((get * 0.25) / 9) : null
  const text  = tmb && get ? `TMB Mifflin: ${Math.round(tmb)} kcal · GET: ${get} kcal · Proteínas: ${prot}g · Carboidratos: ${carb}g · Gorduras: ${gord}g` : ""
  return (
    <CalcCard icon={Flame} title="GET Mifflin-St Jeor + Macros" color="#f97316">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
          <Field label="Altura" unit="cm" value={alt} onChange={setAlt} min={0} />
          <Field label="Idade" unit="anos" value={idade} onChange={setIdade} min={0} />
        </div>
        <Toggle label="Sexo" options={["Homem","Mulher"]} value={sexo} onChange={setSexo} />
        <Select label="Nível de atividade" value={fator} options={ATIVIDADES} onChange={setFator} />
        {tmb && get && prot && carb && gord && (
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>TMB (Mifflin-St Jeor)</span>
              <span className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{Math.round(tmb)} kcal</span>
            </div>
            <ResultBox label="GET + Macros" value={`${get} kcal/dia`}
              sub={`P: ${prot}g (30%) · C: ${carb}g (45%) · G: ${gord}g (25%)`}
              color="#f97316" copyId="mifflin" copyText={text} copied={copied} onCopy={onCopy} />
          </div>
        )}
      </div>
    </CalcCard>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TAB DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

type TabId = "geral" | "endocrinologia" | "nutrologia" | "ginecologia" | "cardiologia" | "nutricao"

const TABS: { id: TabId; label: string }[] = [
  { id: "geral",          label: "Geral" },
  { id: "endocrinologia", label: "Endocrinologia" },
  { id: "nutrologia",     label: "Nutrologia" },
  { id: "ginecologia",    label: "Ginecologia" },
  { id: "cardiologia",    label: "Cardiologia" },
  { id: "nutricao",       label: "Nutrição" },
]

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function CalculadorasPage() {
  const { copied, copy }         = useCopy()
  const [activeTab, setActiveTab] = useState<TabId>("geral")

  const countMap: Record<TabId, number> = {
    geral: 9, endocrinologia: 3, nutrologia: 3, ginecologia: 3, cardiologia: 3, nutricao: 3,
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(59,127,255,0.12)", border: "1px solid rgba(59,127,255,0.25)" }}>
          <Calculator style={{ width: 16, height: 16, color: "#3b7fff" }} />
        </div>
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>Calculadoras Clínicas</h1>
          <p className="text-[11px] font-mono tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
            PRAXIS CONSULTÓRIO · {Object.values(countMap).reduce((a, b) => a + b, 0)} FERRAMENTAS · CÁLCULO EM TEMPO REAL
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap p-1 rounded-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{
              background: activeTab === tab.id ? "var(--accent-dim)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "var(--accent-border)" : "transparent"}`,
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
            }}>
            {tab.label}
            <span className="text-[9px] font-mono px-1 py-0.5 rounded"
              style={{
                background: activeTab === tab.id ? "var(--accent-dim)" : "var(--card)",
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
              }}>
              {countMap[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Tab: Geral */}
      {activeTab === "geral" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalcIMC        copied={copied} onCopy={copy} />
          <CalcHOMA       copied={copied} onCopy={copy} />
          <CalcTMB        copied={copied} onCopy={copy} />
          <CalcAgua       copied={copied} onCopy={copy} />
          <CalcFramingham copied={copied} onCopy={copy} />
          <CalcGLP1       copied={copied} onCopy={copy} />
          <CalcTFG        copied={copied} onCopy={copy} />
          <CalcMetabolico copied={copied} onCopy={copy} />
          <CalcCastelli   copied={copied} onCopy={copy} />
        </div>
      )}

      {/* Tab: Endocrinologia */}
      {activeTab === "endocrinologia" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalcLevotiroxina copied={copied} onCopy={copy} />
          <CalcFINDRISC     copied={copied} onCopy={copy} />
          <CalcBillewicz    copied={copied} onCopy={copy} />
        </div>
      )}

      {/* Tab: Nutrologia */}
      {activeTab === "nutrologia" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalcProteina copied={copied} onCopy={copy} />
          <CalcDeficit  copied={copied} onCopy={copy} />
          <CalcIAC      copied={copied} onCopy={copy} />
        </div>
      )}

      {/* Tab: Ginecologia */}
      {activeTab === "ginecologia" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalcGestacional  copied={copied} onCopy={copy} />
          <CalcPreeclampsia copied={copied} onCopy={copy} />
          <CalcJanelaFertil copied={copied} onCopy={copy} />
        </div>
      )}

      {/* Tab: Cardiologia */}
      {activeTab === "cardiologia" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalcWells   copied={copied} onCopy={copy} />
          <CalcCHA2DS2 copied={copied} onCopy={copy} />
          <CalcPressao copied={copied} onCopy={copy} />
        </div>
      )}

      {/* Tab: Nutrição */}
      {activeTab === "nutricao" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalcCargaGlicemica copied={copied} onCopy={copy} />
          <CalcRCQ            copied={copied} onCopy={copy} />
          <CalcMifflin        copied={copied} onCopy={copy} />
        </div>
      )}
    </div>
  )
}
