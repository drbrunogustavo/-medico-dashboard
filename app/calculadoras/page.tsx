"use client"

import { useState } from "react"
import {
  Calculator, Copy, Check, Scale, Activity, Flame,
  Droplets, Heart, Pill, Microscope, Ruler,
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

// ─── Shared CopyButton ────────────────────────────────────────────────────────

function CopyButton({ id, text, copied, onCopy }: {
  id: string; text: string; copied: string | null; onCopy: (id: string, t: string) => void
}) {
  const isCopied = copied === id
  return (
    <button
      onClick={() => onCopy(id, text)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
      style={{
        background: isCopied ? "rgba(0,192,127,0.12)" : "var(--surface-2)",
        border: `1px solid ${isCopied ? "rgba(0,192,127,0.3)" : "var(--border)"}`,
        color: isCopied ? "#00c07f" : "var(--text-muted)",
      }}>
      {isCopied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
      {isCopied ? "Copiado!" : "Copiar"}
    </button>
  )
}

// ─── ResultBox ────────────────────────────────────────────────────────────────

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

// ─── Input field ──────────────────────────────────────────────────────────────

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

// ─── Card wrapper ─────────────────────────────────────────────────────────────

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

// ─── 1. IMC ───────────────────────────────────────────────────────────────────

function CalcIMC({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso, setPeso]     = useState("")
  const [altura, setAltura] = useState("")

  const p = parseFloat(peso)
  const h = parseFloat(altura)
  const imc = p > 0 && h > 0 ? p / Math.pow(h / 100, 2) : null

  function classify(v: number): { label: string; color: string } {
    if (v < 18.5) return { label: "Abaixo do peso",  color: "#3b7fff" }
    if (v < 25)   return { label: "Peso normal",      color: "#00c07f" }
    if (v < 30)   return { label: "Sobrepeso",        color: "#f59e0b" }
    if (v < 35)   return { label: "Obesidade Grau I", color: "#f97316" }
    if (v < 40)   return { label: "Obesidade Grau II",color: "#ef4444" }
    return              { label: "Obesidade Grau III",color: "#dc2626" }
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
          <ResultBox
            label="Resultado" value={`${imc.toFixed(1)} kg/m²`}
            sub={`${cls.label} · Faixa ideal: 18.5–24.9`}
            color={cls.color}
            copyId="imc" copyText={text} copied={copied} onCopy={onCopy}
          />
        )}
      </div>
    </CalcCard>
  )
}

// ─── 2. HOMA-IR ───────────────────────────────────────────────────────────────

function CalcHOMA({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [gli, setGli]   = useState("")
  const [ins, setIns]   = useState("")

  const g = parseFloat(gli)
  const i = parseFloat(ins)
  const homa = g > 0 && i > 0 ? (g * i) / 405 : null

  function classify(v: number): { label: string; color: string } {
    if (v < 2.5) return { label: "Normal",                color: "#00c07f" }
    if (v < 4.0) return { label: "Resistência leve",      color: "#f59e0b" }
    return            { label: "Resistência grave",      color: "#ef4444" }
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
          <ResultBox
            label="HOMA-IR" value={homa.toFixed(2)}
            sub={`${cls.label} · <2.5 normal · 2.5–4.0 leve · >4.0 grave`}
            color={cls.color}
            copyId="homa" copyText={text} copied={copied} onCopy={onCopy}
          />
        )}
      </div>
    </CalcCard>
  )
}

// ─── 3. TMB Harris-Benedict ───────────────────────────────────────────────────

const ATIVIDADES = [
  { value: "1.2",  label: "Sedentário (sem exercício)" },
  { value: "1.375",label: "Leve (1–3x/sem)" },
  { value: "1.55", label: "Moderado (3–5x/sem)" },
  { value: "1.725",label: "Intenso (6–7x/sem)" },
  { value: "1.9",  label: "Muito intenso / Atleta" },
]

function CalcTMB({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,  setPeso]   = useState("")
  const [alt,   setAlt]    = useState("")
  const [idade, setIdade]  = useState("")
  const [sexo,  setSexo]   = useState("Homem")
  const [fator, setFator]  = useState("1.55")

  const p = parseFloat(peso); const h = parseFloat(alt)
  const a = parseFloat(idade); const f = parseFloat(fator)

  let tmb: number | null = null
  if (p > 0 && h > 0 && a > 0) {
    tmb = sexo === "Homem"
      ? 88.36 + (13.4 * p) + (4.8 * h) - (5.7 * a)
      : 447.6 + (9.2 * p) + (3.1 * h) - (4.3 * a)
  }
  const gasto = tmb ? Math.round(tmb * f) : null
  const text  = tmb ? `TMB: ${Math.round(tmb)} kcal/dia · Gasto total (${ATIVIDADES.find(x=>x.value===fator)?.label}): ${gasto} kcal/dia` : ""

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
            <ResultBox
              label="Gasto Calórico Total" value={`${gasto} kcal/dia`}
              sub={ATIVIDADES.find(x => x.value === fator)?.label}
              color="#f97316"
              copyId="tmb" copyText={text} copied={copied} onCopy={onCopy}
            />
          </div>
        )}
      </div>
    </CalcCard>
  )
}

// ─── 4. Água diária ───────────────────────────────────────────────────────────

function CalcAgua({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso, setPeso] = useState("")
  const p    = parseFloat(peso)
  const ml   = p > 0 ? p * 35 : null
  const lts  = ml ? (ml / 1000).toFixed(2) : null
  const copos = ml ? Math.round(ml / 200) : null
  const text  = ml ? `Água diária recomendada: ${lts} L/dia (${copos} copos de 200ml)` : ""

  return (
    <CalcCard icon={Droplets} title="Água Diária" color="#06b6d4">
      <div className="space-y-3">
        <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
        {ml && (
          <ResultBox
            label="Ingestão Recomendada" value={`${lts} L/dia`}
            sub={`${copos} copos de 200ml · Fórmula: peso × 35ml`}
            color="#06b6d4"
            copyId="agua" copyText={text} copied={copied} onCopy={onCopy}
          />
        )}
      </div>
    </CalcCard>
  )
}

// ─── 5. Framingham ────────────────────────────────────────────────────────────

// ATP III Framingham point scoring
function framinghamScore(
  sexo: string, idade: number, tc: number, hdl: number,
  pas: number, tratado: boolean, fumante: boolean
): number {
  let pts = 0

  if (sexo === "Homem") {
    // Age
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

    // TC by age group
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

    // HDL
    if (hdl >= 60)      pts += -1
    else if (hdl >= 50) pts += 0
    else if (hdl >= 40) pts += 1
    else                pts += 2

    // SBP
    if (!tratado) {
      if (pas < 120)       pts += 0
      else if (pas < 130)  pts += 0
      else if (pas < 140)  pts += 1
      else if (pas < 160)  pts += 1
      else                 pts += 2
    } else {
      if (pas < 120)       pts += 0
      else if (pas < 130)  pts += 1
      else if (pas < 140)  pts += 2
      else if (pas < 160)  pts += 2
      else                 pts += 3
    }

    if (fumante) pts += 8

    const table: Record<number, number> = {
      0:1,1:1,2:1,3:1,4:1,5:2,6:2,7:3,8:4,9:5,10:6,11:8,12:10,13:12,14:16,15:20,16:25,17:30
    }
    return table[Math.min(Math.max(pts, 0), 17)] ?? 30

  } else {
    // Women
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
      if (pas < 120)       pts += 0
      else if (pas < 130)  pts += 1
      else if (pas < 140)  pts += 2
      else if (pas < 150)  pts += 3
      else if (pas < 160)  pts += 4
      else                 pts += 5
    } else {
      if (pas < 120)       pts += 0
      else if (pas < 130)  pts += 3
      else if (pas < 140)  pts += 4
      else if (pas < 150)  pts += 5
      else if (pas < 160)  pts += 5
      else                 pts += 6
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
  const [idade,   setIdade]   = useState("")
  const [tc,      setTc]      = useState("")
  const [hdl,     setHdl]     = useState("")
  const [pas,     setPas]     = useState("")
  const [tratado, setTratado] = useState("Não")
  const [fumante, setFumante] = useState("Não")

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
          <ResultBox
            label="Risco em 10 anos" value={`${risco}%`}
            sub={`${cls.label} · <10% baixo · 10–20% intermediário · >20% alto`}
            color={cls.color}
            copyId="fram" copyText={text} copied={copied} onCopy={onCopy}
          />
        )}
      </div>
    </CalcCard>
  )
}

// ─── 6. Dose GLP-1 ────────────────────────────────────────────────────────────

function CalcGLP1({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [peso,      setPeso]      = useState("")
  const [imc,       setImc]       = useState("")
  const [indicacao, setIndicacao] = useState("Obesidade")
  const [farmaco,   setFarmaco]   = useState("Semaglutida")

  const p = parseFloat(peso); const i = parseFloat(imc)

  let resultado = ""
  if (p > 0 || i > 0) {
    if (farmaco === "Semaglutida") {
      resultado = `Semaglutida (Ozempic/Wegovy) — ${indicacao}:\n` +
        `Sem 1–4: 0,25 mg/semana SC\n` +
        `Sem 5–8: 0,5 mg/semana SC\n` +
        `Sem 9–12: 1,0 mg/semana SC\n` +
        `Sem 13+: 1,7–2,4 mg/semana SC (ajustar conforme resposta)`
    } else {
      resultado = `Liraglutida (Victoza/Saxenda) — ${indicacao}:\n` +
        `Sem 1: 0,6 mg/dia SC\n` +
        `Sem 2: 1,2 mg/dia SC\n` +
        `Sem 3+: 1,8 mg/dia SC (manutenção)\n` +
        `Obesidade (Saxenda): máx 3,0 mg/dia SC`
    }
  }

  const aviso = "⚠️ Referência clínica. Prescrição é responsabilidade médica."
  const text  = resultado ? `${resultado}\n\n${aviso}` : ""

  return (
    <CalcCard icon={Pill} title="Protocolo GLP-1" color="#a78bfa">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso" unit="kg" value={peso} onChange={setPeso} min={0} />
          <Field label="IMC" unit="kg/m²" value={imc} onChange={setImc} min={0} />
        </div>
        <Select
          label="Indicação"
          value={indicacao}
          options={[
            { value: "Obesidade",       label: "Obesidade (IMC ≥30)" },
            { value: "DM2",             label: "Diabetes Tipo 2" },
            { value: "Emagrecimento",   label: "Sobrepeso com comorbidade" },
            { value: "Longevidade",     label: "Longevidade / Metabólico" },
          ]}
          onChange={setIndicacao}
        />
        <Toggle label="Fármaco" options={["Semaglutida","Liraglutida"]} value={farmaco} onChange={setFarmaco} />

        {resultado && (
          <div>
            <div className="mt-3 rounded-xl p-4"
              style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
              <div className="text-[10px] font-mono tracking-wider uppercase mb-2" style={{ color: "#a78bfa" }}>
                Protocolo de Titulação
              </div>
              {resultado.split("\n").map((line, i) => (
                <p key={i} className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2 p-3 rounded-lg"
              style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <span className="text-[11px] leading-relaxed" style={{ color: "#fbbf24" }}>
                {aviso}
              </span>
            </div>
            <div className="mt-2 flex justify-end">
              <CopyButton id="glp1" text={text} copied={copied} onCopy={onCopy} />
            </div>
          </div>
        )}
      </div>
    </CalcCard>
  )
}

// ─── 7. TFG CKD-EPI ──────────────────────────────────────────────────────────

function calcCKDEPI(creat: number, idade: number, sexo: string): number {
  const kappa = sexo === "Mulher" ? 0.7  : 0.9
  const alpha = sexo === "Mulher" ? -0.241 : -0.302
  const sex   = sexo === "Mulher" ? 1.012 : 1.0
  const ratio = creat / kappa
  const term1 = Math.min(ratio, 1) ** alpha
  const term2 = Math.max(ratio, 1) ** (-1.200)
  return 142 * term1 * term2 * (0.9938 ** idade) * sex
}

function CalcTFG({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [creat, setCreat] = useState("")
  const [idade, setIdade] = useState("")
  const [sexo,  setSexo]  = useState("Homem")

  const c = parseFloat(creat); const i = parseFloat(idade)
  const tfg = c > 0 && i > 0 ? Math.round(calcCKDEPI(c, i, sexo)) : null

  function classify(v: number): { label: string; estadio: string; color: string } {
    if (v >= 90)       return { estadio: "G1", label: "Normal ou elevada",  color: "#00c07f" }
    if (v >= 60)       return { estadio: "G2", label: "Levemente reduzida", color: "#84cc16" }
    if (v >= 45)       return { estadio: "G3a",label: "Redução leve–mod.",  color: "#f59e0b" }
    if (v >= 30)       return { estadio: "G3b",label: "Redução mod–grave",  color: "#f97316" }
    if (v >= 15)       return { estadio: "G4", label: "Redução grave",      color: "#ef4444" }
    return                    { estadio: "G5", label: "Falência renal",     color: "#dc2626" }
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
          <ResultBox
            label={`TFG · Estádio ${cls.estadio}`} value={`${tfg} mL/min/1,73m²`}
            sub={cls.label}
            color={cls.color}
            copyId="tfg" copyText={text} copied={copied} onCopy={onCopy}
          />
        )}
      </div>
    </CalcCard>
  )
}

// ─── 8. Risco Metabólico ──────────────────────────────────────────────────────

function CalcMetabolico({ copied, onCopy }: { copied: string | null; onCopy: (id: string, t: string) => void }) {
  const [ca,   setCa]   = useState("")
  const [sexo, setSexo] = useState("Homem")

  const v = parseFloat(ca)

  function classify(v: number, s: string): { label: string; color: string; rec: string } {
    if (s === "Homem") {
      if (v < 94)  return { label: "Normal",      color: "#00c07f", rec: "Manter hábitos saudáveis" }
      if (v < 102) return { label: "Risco aumentado",  color: "#f59e0b", rec: "Redução de peso e atividade física regular" }
      return              { label: "Alto risco",   color: "#ef4444", rec: "Avaliação metabólica completa urgente" }
    } else {
      if (v < 80)  return { label: "Normal",      color: "#00c07f", rec: "Manter hábitos saudáveis" }
      if (v < 88)  return { label: "Risco aumentado",  color: "#f59e0b", rec: "Redução de peso e atividade física regular" }
      return              { label: "Alto risco",   color: "#ef4444", rec: "Avaliação metabólica completa urgente" }
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
          <>
            <ResultBox
              label="Classificação" value={cls.label}
              sub={cls.rec}
              color={cls.color}
              copyId="meta" copyText={text} copied={copied} onCopy={onCopy}
            />
          </>
        )}
      </div>
    </CalcCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalculadorasPage() {
  const { copied, copy } = useCopy()

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
            PRAXIS CONSULTÓRIO · 8 FERRAMENTAS · CÁLCULO EM TEMPO REAL
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        <CalcIMC         copied={copied} onCopy={copy} />
        <CalcHOMA        copied={copied} onCopy={copy} />
        <CalcTMB         copied={copied} onCopy={copy} />
        <CalcAgua        copied={copied} onCopy={copy} />
        <CalcFramingham  copied={copied} onCopy={copy} />
        <CalcGLP1        copied={copied} onCopy={copy} />
        <CalcTFG         copied={copied} onCopy={copy} />
        <CalcMetabolico  copied={copied} onCopy={copy} />
      </div>
    </div>
  )
}
