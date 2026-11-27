import { Check, X, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info" | "warning"

interface ToastProps {
  message: string | null
  type?:   ToastType
}

// Cores literais: o aviso aparece em páginas dentro e fora do escopo .px.
// Todas com texto branco em contraste acima de 7:1.
const CONFIG: Record<ToastType, { Icon: React.ElementType; bg: string }> = {
  success: { Icon: Check,         bg: "bg-[#141414]" },
  error:   { Icon: X,             bg: "bg-[#9B2C1F]" },
  info:    { Icon: Info,          bg: "bg-[#3F3B36]" },
  warning: { Icon: AlertTriangle, bg: "bg-[#7A4E00]" },
}

export function Toast({ message, type = "success" }: ToastProps) {
  if (!message) return null
  const { Icon, bg } = CONFIG[type]
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // acima do menu inferior flutuante
        "fixed bottom-28 left-4 right-4 md:left-auto md:right-6 md:max-w-sm",
        "z-[70] flex items-center gap-2.5 rounded-2xl px-4 py-3 text-white shadow-[0_10px_30px_rgba(20,20,20,0.25)] animate-fade-in",
        bg
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 text-[13.5px] font-medium">{message}</span>
    </div>
  )
}
