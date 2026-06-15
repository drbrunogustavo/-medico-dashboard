"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { TrendingUp, ArrowRight, Calculator } from "lucide-react"

const BG   = "#F5F0E8"
const GOLD  = "#b8976a"
const DARK  = "#0D1B2A"
const TEXT2 = "#6a5a4a"
const MUTED = "#8a7a6a"
const PLANO_PRECO = 397

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

export function SimuladorROI({ ctaHref = "/planos" }: { ctaHref?: string }) {
  const [consulta,  setConsulta]  = useState(500)
  const [pacientes, setPacientes] = useState(5)

  const { receitaMes, receitaAno, roi, payback, consultasParaPagar } = useMemo(() => {
    const receitaMes  = consulta * pacientes
    const receitaAno  = receitaMes * 12
    const roi         = Math.round(((receitaMes - PLANO_PRECO) / PLANO_PRECO) * 100)
    const payback     = Math.ceil(PLANO_PRECO / consulta)
    const consultasParaPagar = Math.ceil(PLANO_PRECO / consulta)
    return { receitaMes, receitaAno, roi, payback, consultasParaPagar }
  }, [consulta, pacientes])

  const sliderStyle = (val: number, min: number, max: number): React.CSSProperties => ({
    background: `linear-gradient(to right, ${GOLD} 0%, ${GOLD} ${((val - min) / (max - min)) * 100}%, rgba(13,27,42,0.15) ${((val - min) / (max - min)) * 100}%, rgba(13,27,42,0.15) 100%)`,
  })

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(13,27,42,0.10)", boxShadow: "0 4px 40px rgba(13,27,42,0.06)" }}>
      <div className="px-7 py-5 border-b" style={{ borderColor: "rgba(13,27,42,0.07)", background: BG }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
            <Calculator style={{ width: 18, height: 18, color: GOLD }} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "2px", textTransform: "uppercase" }}>SIMULADOR DE ROI</p>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: DARK }}>Quanto o PRAXIS vale para você?</h3>
          </div>
        </div>
      </div>

      <div className="p-7 space-y-6">
        {/* Sliders */}
        <div className="space-y-5">
          {/* Slider 1 — Valor da consulta */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: 13, fontWeight: 600, color: DARK }}>Valor da sua consulta</label>
              <span style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{fmt(consulta)}</span>
            </div>
            <input
              type="range" min={150} max={2000} step={50} value={consulta}
              onChange={e => setConsulta(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={sliderStyle(consulta, 150, 2000)}
            />
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 10, color: MUTED }}>R$150</span>
              <span style={{ fontSize: 10, color: MUTED }}>R$2.000</span>
            </div>
          </div>

          {/* Slider 2 — Novos pacientes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={{ fontSize: 13, fontWeight: 600, color: DARK }}>Novos pacientes/mês com o PRAXIS</label>
              <span style={{ fontSize: 18, fontWeight: 800, color: GOLD }}>{pacientes} pacientes</span>
            </div>
            <input
              type="range" min={1} max={20} step={1} value={pacientes}
              onChange={e => setPacientes(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={sliderStyle(pacientes, 1, 20)}
            />
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 10, color: MUTED }}>1</span>
              <span style={{ fontSize: 10, color: MUTED }}>20</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: GOLD, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>RECEITA ADICIONAL/MÊS</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: DARK, lineHeight: 1 }}>{fmt(receitaMes)}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(13,27,42,0.03)", border: "1px solid rgba(13,27,42,0.08)" }}>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>RECEITA ADICIONAL/ANO</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: DARK, lineHeight: 1 }}>{fmt(receitaAno)}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(13,27,42,0.03)", border: "1px solid rgba(13,27,42,0.08)" }}>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>RETORNO SOBRE INVESTIMENTO</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: roi > 0 ? "#16a34a" : "#dc2626", lineHeight: 1 }}>{roi > 0 ? "+" : ""}{roi}%</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(13,27,42,0.03)", border: "1px solid rgba(13,27,42,0.08)" }}>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: MUTED, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>PAYBACK</p>
            <p style={{ fontSize: 26, fontWeight: 800, color: DARK, lineHeight: 1 }}>{payback}d</p>
          </div>
        </div>

        {/* Highlight */}
        <div className="rounded-xl px-5 py-4 flex items-start gap-3" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}25` }}>
          <TrendingUp style={{ width: 18, height: 18, color: GOLD, flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: TEXT2, lineHeight: 1.6 }}>
            Com o <strong style={{ color: DARK }}>PRAXIS OS por R$397/mês</strong>, apenas{" "}
            <strong style={{ color: GOLD }}>{consultasParaPagar} consulta{consultasParaPagar > 1 ? "s" : ""} extra</strong>{" "}
            já cobre o investimento. O restante é <strong style={{ color: DARK }}>lucro puro</strong>.
          </p>
        </div>

        <Link
          href={ctaHref}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-[14px] transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: GOLD, color: DARK }}
        >
          Quero esses resultados <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${GOLD};
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(184,151,106,0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${GOLD};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(184,151,106,0.4);
        }
      `}</style>
    </div>
  )
}
