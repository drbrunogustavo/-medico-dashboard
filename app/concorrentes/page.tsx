"use client"

import { TopBar } from "@/components/TopBar"
import { BarChart, Zap } from "lucide-react"
import Link from "next/link"

export default function ConcorrentesPage() {
  return (
    <div className="animate-fade-in">
      <TopBar
        title="Análise de Concorrentes"
        subtitle="EM BREVE · MONITORAMENTO COMPETITIVO · GAPS DE CONTEÚDO"
      />
      <div className="p-4 md:p-8 flex flex-col items-center justify-center py-16 md:py-24 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
          <BarChart className="w-8 h-8 text-text-muted" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-[18px] font-bold text-text-primary mb-2">Em desenvolvimento</h2>
          <p className="text-[13px] text-text-muted leading-relaxed">
            Este módulo estará disponível em breve. Monitore médicos concorrentes, analise estratégias de conteúdo, identifique gaps e descubra oportunidades de diferenciação.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/referencias" className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-text-secondary text-[12px] font-medium hover:border-accent-border hover:text-accent transition-all">
            Ver Monitor de Referências
          </Link>
          <Link href="/radar" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-dim border border-accent-border text-accent text-[12px] font-semibold hover:bg-accent/20 transition-all">
            <Zap className="w-3.5 h-3.5" /> Abrir Radar de Tendências
          </Link>
        </div>
      </div>
    </div>
  )
}
