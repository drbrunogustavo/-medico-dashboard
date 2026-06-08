"use client"

import { TopBar } from "@/components/TopBar"
import { useTheme, type Theme } from "@/hooks/useTheme"
import { Monitor, Moon, Sun, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Theme preview card ────────────────────────────────────────────────────────

function ThemeCard({
  id, label, subtitle, active, onClick, preview,
}: {
  id:       string
  label:    string
  subtitle: string
  active:   boolean
  onClick:  () => void
  preview:  React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-xl border overflow-hidden transition-all text-left w-full",
        "hover:border-border-hover",
        active
          ? "border-accent shadow-[0_0_0_2px_var(--accent-border)]"
          : "border-border"
      )}
    >
      {/* Preview */}
      <div className="h-32 w-full overflow-hidden">{preview}</div>

      {/* Label */}
      <div className="flex items-center justify-between p-4 bg-surface">
        <div>
          <div className="text-[13px] font-semibold text-text-primary">{label}</div>
          <div className="text-[11px] text-text-muted mt-0.5">{subtitle}</div>
        </div>
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          active
            ? "border-accent bg-accent"
            : "border-border bg-surface-2"
        )}>
          {active && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
        </div>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { theme, setTheme, followSystem, enableFollowSystem, mounted } = useTheme()

  if (!mounted) {
    return (
      <div className="animate-fade-in">
        <TopBar title="Configurações" subtitle="PRAXIS · PREFERÊNCIAS" />
        <div className="p-4 md:p-8">
          <div className="h-48 bg-surface border border-border rounded-xl shimmer" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="Configurações" subtitle="PRAXIS · PREFERÊNCIAS DO SISTEMA" />

      <div className="p-4 md:p-8 max-w-2xl space-y-8">

        {/* ── Aparência ────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary">Aparência</h2>
            <p className="text-[12px] text-text-muted mt-0.5">Escolha o tema visual da plataforma.</p>
          </div>

          {/* Theme cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Dark */}
            <ThemeCard
              id="dark"
              label="Modo Escuro"
              subtitle="Ideal para uso noturno"
              active={!followSystem && theme === "dark"}
              onClick={() => setTheme("dark")}
              preview={
                <div className="h-full w-full p-3" style={{ background: "#080808" }}>
                  <div className="flex gap-2 h-full">
                    {/* Fake sidebar */}
                    <div className="w-10 h-full rounded-md" style={{ background: "#0f0f0f", border: "1px solid #1f1f1f" }}>
                      <div className="m-1.5 h-4 rounded" style={{ background: "#1f1f1f" }} />
                      {[1,2,3,4].map(i => (
                        <div key={i} className="mx-1.5 my-1 h-2 rounded" style={{ background: i === 2 ? "rgba(0,192,127,0.15)" : "#161616", width: `${50 + i * 8}%` }} />
                      ))}
                    </div>
                    {/* Fake content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="h-5 rounded" style={{ background: "#0f0f0f", border: "1px solid #1f1f1f" }} />
                      <div className="grid grid-cols-2 gap-1 h-16">
                        <div className="rounded" style={{ background: "#161616", border: "1px solid #1f1f1f" }} />
                        <div className="rounded" style={{ background: "#161616", border: "1px solid rgba(0,192,127,0.2)" }} />
                      </div>
                      <div className="h-8 rounded" style={{ background: "#161616", border: "1px solid #1f1f1f" }} />
                    </div>
                  </div>
                </div>
              }
            />

            {/* Light */}
            <ThemeCard
              id="light"
              label="Modo Claro"
              subtitle="Ideal para uso diurno"
              active={!followSystem && theme === "light"}
              onClick={() => setTheme("light")}
              preview={
                <div className="h-full w-full p-3" style={{ background: "#f5f5f0" }}>
                  <div className="flex gap-2 h-full">
                    {/* Fake sidebar */}
                    <div className="w-10 h-full rounded-md" style={{ background: "#ffffff", border: "1px solid #e0e0d8" }}>
                      <div className="m-1.5 h-4 rounded" style={{ background: "#e0e0d8" }} />
                      {[1,2,3,4].map(i => (
                        <div key={i} className="mx-1.5 my-1 h-2 rounded" style={{ background: i === 2 ? "rgba(0,168,107,0.12)" : "#f0f0eb", width: `${50 + i * 8}%` }} />
                      ))}
                    </div>
                    {/* Fake content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="h-5 rounded" style={{ background: "#ffffff", border: "1px solid #e0e0d8" }} />
                      <div className="grid grid-cols-2 gap-1 h-16">
                        <div className="rounded" style={{ background: "#ffffff", border: "1px solid #e0e0d8" }} />
                        <div className="rounded" style={{ background: "#ffffff", border: "1px solid rgba(0,168,107,0.2)" }} />
                      </div>
                      <div className="h-8 rounded" style={{ background: "#ffffff", border: "1px solid #e0e0d8" }} />
                    </div>
                  </div>
                </div>
              }
            />
          </div>

          {/* Follow system toggle */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 rounded-xl border transition-colors",
            followSystem
              ? "bg-accent-dim border-accent-border"
              : "bg-surface border-border hover:border-border-hover"
          )}>
            <div className="flex items-center gap-3">
              <Monitor className={cn("w-4 h-4 flex-shrink-0", followSystem ? "text-accent" : "text-text-muted")} />
              <div>
                <div className="text-[13px] font-medium text-text-primary">Seguir sistema</div>
                <div className="text-[11px] text-text-muted">
                  Alterna automaticamente conforme o sistema operacional
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={() => enableFollowSystem(!followSystem)}
              role="switch"
              aria-checked={followSystem}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors flex-shrink-0",
                followSystem ? "bg-accent" : "bg-border"
              )}
            >
              <span className={cn(
                "absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform",
                followSystem && "translate-x-4"
              )} />
            </button>
          </div>

          {/* Current state indicator */}
          <div className="flex items-center gap-2 px-1">
            {theme === "dark"
              ? <Moon className="w-3.5 h-3.5 text-text-muted" />
              : <Sun  className="w-3.5 h-3.5 text-text-muted" />}
            <span className="text-[11px] text-text-muted">
              {followSystem
                ? `Usando preferência do sistema · ${theme === "dark" ? "Escuro" : "Claro"}`
                : `Tema selecionado manualmente · ${theme === "dark" ? "Escuro" : "Claro"}`}
            </span>
          </div>
        </section>

        {/* ── Divisor ───────────────────────────────────────────────────── */}
        <div className="h-px bg-border" />

        {/* ── Plataforma (placeholder) ──────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary">Plataforma</h2>
            <p className="text-[12px] text-text-muted mt-0.5">Informações da sua conta PRAXIS.</p>
          </div>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {[
              { label: "Plano",       value: "Elite"                   },
              { label: "Usuário",     value: "Dr. Bruno Gustavo"       },
              { label: "Email",       value: "brunogustavosa@gmail.com"},
              { label: "Versão",      value: "PRAXIS v3.0"             },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-[12px] text-text-muted">{row.label}</span>
                <span className="text-[12px] font-medium text-text-primary">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
