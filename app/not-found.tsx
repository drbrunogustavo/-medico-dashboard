import Link from "next/link"
import { PraxisLogo } from "@/components/PraxisLogo"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#F5F0E8" }}>
      <div className="text-center px-6 max-w-md">

        <div className="flex justify-center mb-10">
          <PraxisLogo />
        </div>

        <div
          className="text-[96px] font-bold leading-none mb-4 select-none"
          style={{ color: "#b8976a", fontFamily: "var(--font-playfair), Georgia, serif" }}>
          404
        </div>

        <h1
          className="text-[24px] font-semibold mb-3"
          style={{ color: "#0D1B2A", fontFamily: "var(--font-playfair), Georgia, serif" }}>
          Página não encontrada
        </h1>

        <p className="text-[14px] leading-relaxed mb-10" style={{ color: "#6a5a4a" }}>
          A página que você procura não existe ou foi movida.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 w-full sm:w-auto justify-center"
            style={{ background: "#b8976a", color: "#fff" }}>
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold transition-all w-full sm:w-auto justify-center"
            style={{ background: "#fff", border: "1px solid #e8ddd0", color: "#6a5a4a" }}>
            <Home className="w-4 h-4" />
            Ir para página inicial
          </Link>
        </div>

      </div>
    </div>
  )
}
