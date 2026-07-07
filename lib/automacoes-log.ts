import { createSupabaseServiceClient } from "@/lib/supabase-service"

export type AutomacaoStatus = "ok" | "parcial" | "erro"

export async function logAutomacao(
  tipo:      string,
  status:    AutomacaoStatus,
  detalhes?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient()
    await supabase.from("automacoes_log").insert({
      tipo,
      status,
      detalhes: detalhes ?? null,
    })
  } catch {
    // never block the cron response
  }
}
