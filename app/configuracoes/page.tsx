"use client"

import { TopBar } from "@/components/TopBar"

export default function ConfiguracoesPage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="Configurações" subtitle="PRAXIS · PREFERÊNCIAS DO SISTEMA" />

      <div className="p-4 md:p-8 max-w-2xl space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-text-primary">Plataforma</h2>
            <p className="text-[12px] text-text-muted mt-0.5">Informações da sua conta PRAXIS.</p>
          </div>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border">
            {[
              { label: "Plano",       value: "Elite"                    },
              { label: "Usuário",     value: "Dr. Bruno Gustavo"        },
              { label: "Email",       value: "brunogustavosa@gmail.com" },
              { label: "Versão",      value: "PRAXIS v3.0"              },
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
