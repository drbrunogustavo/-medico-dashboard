"use client"

import { useEffect, useRef, useState } from "react"
import {
  UserPlus, LayoutGrid, MessageSquare, Stethoscope,
  Bot, Bell, Star, Instagram, ArrowRight,
} from "lucide-react"

interface Step {
  id:    number
  icon:  React.ElementType
  label: string
  sub:   string
  color: string
}

const STEPS: Step[] = [
  { id: 1, icon: UserPlus,     label: "Lead",         sub: "Captação",         color: "#3b7fff" },
  { id: 2, icon: LayoutGrid,   label: "CRM",          sub: "Qualificação",     color: "#a78bfa" },
  { id: 3, icon: MessageSquare,label: "Nurturing",    sub: "WhatsApp / E-mail",color: "#d4af37" },
  { id: 4, icon: Stethoscope,  label: "Consulta",     sub: "Atendimento",      color: "#ec4899" },
  { id: 5, icon: Bot,          label: "Copiloto",     sub: "IA na consulta",   color: "var(--accent)" },
  { id: 6, icon: Bell,         label: "Follow-up",    sub: "Pós-consulta",     color: "#f97316" },
  { id: 7, icon: Star,         label: "NPS",          sub: "Satisfação",       color: "#eab308" },
  { id: 8, icon: Instagram,    label: "Conteúdo",     sub: "Redes sociais",    color: "#3b7fff" },
]

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOk(true); obs.disconnect() } }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, ok }
}

export function FluxoIntegrado() {
  const { ref, ok } = useInView()
  const [active, setActive] = useState<number | null>(null)

  return (
    <div ref={ref} className="w-full">

      {/* ── Desktop: horizontal row ──────────────────────────────────────── */}
      <div className="hidden md:flex items-center justify-between gap-0 relative">
        {/* Animated connector line */}
        <div className="absolute top-1/2 left-[32px] right-[32px] h-[2px] -translate-y-1/2 overflow-hidden" style={{ zIndex: 0 }}>
          <div
            className="h-full transition-all ease-out"
            style={{
              width: ok ? "100%" : "0%",
              transitionDuration: "1.4s",
              background: "linear-gradient(90deg, #3b7fff 0%, #a78bfa 25%, var(--accent) 50%, #ec4899 75%, #eab308 100%)",
              opacity: 0.5,
            }}
          />
        </div>

        {STEPS.map((step, i) => {
          const Icon = step.icon
          const delay = i * 100
          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 cursor-pointer relative"
              style={{ zIndex: 1 }}
              onMouseEnter={() => setActive(step.id)}
              onMouseLeave={() => setActive(null)}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: active === step.id ? step.color + "22" : "var(--card)",
                  border: `1.5px solid ${active === step.id ? step.color : "var(--border)"}`,
                  transform: ok ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
                  opacity: ok ? 1 : 0,
                  transition: `transform 500ms ${delay}ms ease-out, opacity 500ms ${delay}ms ease-out, background 200ms, border 200ms, box-shadow 200ms`,
                  boxShadow: active === step.id ? `0 0 20px ${step.color}30` : "none",
                  willChange: "transform, opacity",
                }}
              >
                <Icon className="w-6 h-6" style={{ color: step.color }} />
              </div>
              <div className="text-center">
                <div className="text-[12px] font-semibold text-text-primary leading-tight">{step.label}</div>
                <div className="text-[10px] text-text-muted">{step.sub}</div>
              </div>
              {/* Arrow between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className="absolute -right-3.5 top-6 text-text-muted"
                  style={{ opacity: ok ? 0.4 : 0, transition: `opacity 400ms ${delay + 300}ms` }}
                >
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Mobile: vertical timeline ────────────────────────────────────── */}
      <div className="md:hidden relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3.5 top-4 bottom-4 w-[2px] overflow-hidden">
          <div
            className="w-full transition-all ease-out"
            style={{
              height: ok ? "100%" : "0%",
              transitionDuration: "1.2s",
              background: "linear-gradient(180deg, #3b7fff, #a78bfa, var(--accent), #ec4899, #eab308)",
              opacity: 0.5,
            }}
          />
        </div>

        <div className="space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const delay = i * 80
            return (
              <div
                key={step.id}
                className="flex items-center gap-4"
                style={{
                  transform: ok ? "translateX(0)" : "translateX(-16px)",
                  opacity: ok ? 1 : 0,
                  transition: `transform 450ms ${delay}ms ease-out, opacity 450ms ${delay}ms ease-out`,
                  willChange: "transform, opacity",
                }}
              >
                {/* Node dot */}
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 -ml-8"
                  style={{ background: step.color + "1a", border: `1.5px solid ${step.color}60` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: step.color }} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-text-primary">{step.label}</div>
                  <div className="text-[11px] text-text-muted">{step.sub}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Return arrow label */}
      <div
        className="text-center mt-6 text-[11px] font-mono text-text-muted tracking-widest uppercase"
        style={{ opacity: ok ? 1 : 0, transition: "opacity 800ms 1200ms" }}
      >
        ↺ ciclo contínuo de crescimento e fidelização
      </div>
    </div>
  )
}
