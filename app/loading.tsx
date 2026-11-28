import { PraxisLogo } from "@/components/PraxisLogo"

export default function Loading() {
  return (
    <div className="px relative flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="px-stage" aria-hidden />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <PraxisLogo />
        <svg className="animate-spin" width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
          <circle cx="14" cy="14" r="11" stroke="rgba(27,27,27,0.15)" strokeWidth="2.5" />
          <path d="M14 3 A11 11 0 0 1 25 14" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span className="text-[13px] text-px-muted">Carregando</span>
      </div>
    </div>
  )
}
