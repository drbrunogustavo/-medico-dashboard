import { createSupabaseServerClient } from "@/lib/supabase-server"

export function logAiUsage(params: {
  userId: string
  rota: string
  inputTokens?: number | null
  outputTokens?: number | null
}): void {
  ;(async () => {
    try {
      const supabase = createSupabaseServerClient()
      await supabase.from("ai_usage_log").insert({
        user_id:       params.userId,
        rota:          params.rota,
        input_tokens:  params.inputTokens ?? null,
        output_tokens: params.outputTokens ?? null,
      })
    } catch (e) {
      console.error("[log-ai-usage]", e)
    }
  })()
}
