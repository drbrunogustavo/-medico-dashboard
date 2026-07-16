import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"
import { logAiUsage } from "@/lib/log-ai-usage"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const m1 = stripped.match(/\{[\s\S]*\}/)
  if (m1) { try { return JSON.parse(m1[0]) } catch { /* continua */ } }
  const m2 = stripped.match(/\[[\s\S]*\]/)
  if (m2) { try { return JSON.parse(m2[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta n\u00e3o parse\u00e1vel como JSON: ${text.slice(0, 120)}\u2026`)
}
export const maxDuration = 60


export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()
  try {
    const { tema, slides = 7, objetivo = "Educativo", tom = "Profissional" } = await req.json() as {
      tema: string; slides?: number; objetivo?: string; tom?: string
    }
    if (!tema?.trim()) return NextResponse.json({ error: "Tema é obrigatório" }, { status: 400 })

    // Brand kit context
    let brandCtx = ""
    try {
      const supabase = createSupabaseServerClient()
      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome, especialidade, publico_alvo, marca_slogan, marca_tom_voz")
        .eq("user_id", auth.userId)
        .maybeSingle()
      if (perfil) {
        const parts: string[] = []
        if (perfil.especialidade) parts.push(`Especialidade: ${perfil.especialidade}`)
        if (perfil.publico_alvo)  parts.push(`Público-alvo: ${perfil.publico_alvo}`)
        if (perfil.marca_slogan)  parts.push(`Slogan: "${perfil.marca_slogan}"`)
        if (perfil.marca_tom_voz) parts.push(`Tom de voz: ${perfil.marca_tom_voz}`)
        if (parts.length) brandCtx = "\n\nMARCA DO MÉDICO:\n" + parts.join("\n")
      }
    } catch { /* non-blocking */ }

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 3000,
      system: "Você é especialista em criação de carrosséis para Instagram de médicos no Brasil. Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois.",
      messages: [{
        role: "user",
        content: `Crie um carrossel do Instagram para o médico usuário.${brandCtx}

TEMA: ${tema}
NÚMERO DE SLIDES: ${slides}
OBJETIVO: ${objetivo}
TOM: ${tom}

Slide 1 = Capa impactante. Slides intermediários = conteúdo. Último slide = CTA.

Retorne JSON:
{
  "titulo": "título da capa (texto impactante)",
  "subtitulo": "subtítulo da capa",
  "slides": [
    { "numero": 1, "titulo": "Texto principal do slide", "conteudo": "Texto completo do slide (2-3 linhas)", "dica_visual": "Sugestão de layout/cor de fundo" }
  ],
  "cta": "Call-to-action do último slide",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "legenda": "Legenda completa para acompanhar o post (inclui gancho + conteúdo + CTA + hashtags)"
}`,
      }],
    })

    logAiUsage({ userId: auth.userId, rota: "carrossel", inputTokens: resp.usage.input_tokens, outputTokens: resp.usage.output_tokens })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(parseAIJson(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    captureAnthropicError(e, "/api/carrossel")
    console.error("[api/carrossel]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
