import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


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

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/carrossel]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
