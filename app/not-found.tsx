import { PraxisLogo } from "@/components/PraxisLogo"
import { PxButton } from "@/components/px/Button"

export default function NotFound() {
  return (
    <div className="px relative flex min-h-screen items-center justify-center px-6">
      <div className="px-stage" aria-hidden />
      <main className="relative z-10 max-w-md text-center">
        <div className="mb-10 flex justify-center"><PraxisLogo /></div>
        <p className="mb-3 text-[64px] font-semibold leading-none text-px-accent" aria-hidden>404</p>
        <h1 className="mb-3 text-[24px] font-semibold text-px-ink">Página não encontrada</h1>
        <p className="mb-8 text-[14px] leading-relaxed text-px-muted">O endereço não existe ou foi movido.</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PxButton href="/dashboard">Voltar ao Dashboard</PxButton>
          <PxButton href="/" variant="secondary">Ir para a página inicial</PxButton>
        </div>
      </main>
    </div>
  )
}
