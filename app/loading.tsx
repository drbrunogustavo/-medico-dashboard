import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-accent animate-spin" />
    </div>
  )
}
