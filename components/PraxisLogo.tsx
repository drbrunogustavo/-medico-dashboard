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
        <div
          className="text-[18px] font-semibold tracking-[4px] text-text-primary leading-none"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif", letterSpacing: "4px" }}
        >
          PRAXIS
        </div>
        <div className="text-[8px] font-sans text-text-muted tracking-[3px] uppercase mt-1 leading-none">
          Sistema Operacional de Clínicas
        </div>
      </div>
    </div>
  )
}

function PraxisSymbol({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PRAXIS"
    >
      {/* Outer ring — broken circle suggesting precision and motion */}
      <circle
        cx="16" cy="16" r="14"
        stroke="#00c07f"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="70 18"
        strokeDashoffset="12"
        opacity="0.6"
      />
      {/* Inner geometric — P shape abstracted as two lines + arc */}
      <path
        d="M10 22V10h5.5a4 4 0 0 1 0 8H10"
        stroke="#f5f5f7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Accent diagonal slash — dynamic energy */}
      <line
        x1="18" y1="14"
        x2="23" y2="22"
        stroke="#00c07f"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  )
}
