import { PraxisLogo } from "@/components/PraxisLogo"

export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
      style={{ background: "#F5F0E8" }}>
      <PraxisLogo />
      <div className="flex flex-col items-center gap-3">
        {/* Golden spinner */}
        <svg
          className="animate-spin"
          width="28" height="28" viewBox="0 0 28 28" fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="11" stroke="#e8ddd0" strokeWidth="2.5" />
          <path
            d="M14 3 A11 11 0 0 1 25 14"
            stroke="#b8976a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <span
          className="text-[11px] font-mono tracking-widest uppercase"
          style={{ color: "#9a8a7a" }}>
          Carregando...
        </span>
      </div>
    </div>
  )
}
