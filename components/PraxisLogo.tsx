import { cn } from "@/lib/utils"

interface PraxisLogoProps {
  compact?: boolean
  className?: string
}

export function PraxisLogo({ compact = false, className }: PraxisLogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <PraxisSymbol size={28} />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PraxisSymbol size={32} />
      <div>
        <div className="text-[18px] font-semibold leading-none tracking-[4px] text-px-ink">PRAXIS</div>
        <div className="mt-1 text-[10px] uppercase leading-none tracking-[2px] text-px-muted">Gestão de clínicas</div>
      </div>
    </div>
  )
}

function PraxisSymbol({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PRAXIS">
      <circle cx="16" cy="16" r="14" stroke="#141414" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="70 18" strokeDashoffset="12" opacity="0.5" />
      <path d="M10 22V10h5.5a4 4 0 0 1 0 8H10" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18" y1="14" x2="23" y2="22" stroke="#8A5A2B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
