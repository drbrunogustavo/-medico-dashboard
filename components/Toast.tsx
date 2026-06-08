import { Check, X, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info" | "warning"

interface ToastProps {
  message: string | null
  type?:   ToastType
}

const CONFIG: Record<ToastType, { Icon: React.ElementType; bg: string; border: string; text: string; iconCls: string }> = {
  success: { Icon: Check,         bg: "bg-card",          border: "border-accent-border",    text: "text-accent",    iconCls: "text-accent"    },
  error:   { Icon: X,             bg: "bg-red-950/95",    border: "border-red-500/50",       text: "text-red-200",   iconCls: "text-red-400"   },
  info:    { Icon: Info,          bg: "bg-blue-950/95",   border: "border-blue-500/50",      text: "text-blue-200",  iconCls: "text-blue-400"  },
  warning: { Icon: AlertTriangle, bg: "bg-amber-950/95",  border: "border-amber-500/50",     text: "text-amber-200", iconCls: "text-amber-400" },
}

export function Toast({ message, type = "success" }: ToastProps) {
  if (!message) return null
  const { Icon, bg, border, text, iconCls } = CONFIG[type]
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm",
        "flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl border animate-fade-in z-50",
        bg, border, text
      )}
    >
      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", iconCls)} />
      <span className="text-[12px] font-medium flex-1">{message}</span>
    </div>
  )
}
