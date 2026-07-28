import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAgenda } from "@/lib/medx"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  if (auth.userId !== process.env.DOCTOR_USER_ID)
    return NextResponse.json({ error: "admin only" }, { status: 403 })

  const hoje = new Date().toISOString().split("T")[0]
  const raw = await getAgenda(hoje, hoje)

  const resumo = Array.isArray(raw) ? raw.map((a: Record<string,unknown>) => ({
    paciente: String(a.Descricao ?? "").split(",")[0].trim(),
    statusNumero: a.Status,
    tipoAgendamento: a.TipoAgendamento,
    inicio: a.Inicio,
  })) : []

  return NextResponse.json(resumo)
}
