import { createSupabaseServerClient } from "@/lib/supabase-server"

type ServerClient = ReturnType<typeof createSupabaseServerClient>

// Cota mensal de gerações de IA por plano (alinhado com a página /planos).
const LIMITES: Record<string, number> = { starter: 30, pro: 200, elite: 999999 }

export async function checkAiRateLimit(
  userId: string,
  plano: string,
  supabase: ServerClient,
): Promise<{ allowed: boolean; remaining: number }> {
  const limite = LIMITES[plano] ?? 30

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", inicioMes.toISOString())

  const usado = count ?? 0
  return { allowed: usado < limite, remaining: Math.max(0, limite - usado) }
}
