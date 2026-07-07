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
    const { topico, contexto = "" } = await req.json() as { topico: string; contexto?: string }

    if (!topico?.trim()) {
      return NextResponse.json({ error: "Tópico obrigatório" }, { status: 400 })
    }

    // Fetch user profile for context
    const supabase = createSupabaseServerClient()
    const { data: perfil } = await supabase
      .from("perfis")
      .select("nome, especialidade, cidade, estado, nicho, publico_alvo, tom_voz, marca_slogan, marca_tom_voz")
      .eq("user_id", auth.userId)
      .maybeSingle()

    const tomVoz = perfil?.marca_tom_voz ?? perfil?.tom_voz ?? "didático, acolhedor e confiante"
    const perfilCtx = perfil
      ? `Médico: ${perfil.nome ?? "o médico usuário"}. Especialidade: ${perfil.especialidade ?? "não informada"}. Cidade: ${perfil.cidade ?? "não informada"}${perfil.estado ? `, ${perfil.estado}` : ""}. Público: ${perfil.publico_alvo ?? "adultos preocupados com saúde e longevidade"}. Tom de voz: ${tomVoz}.${perfil.marca_slogan ? ` Slogan da marca: "${perfil.marca_slogan}".` : ""}`
      : "Médico: o médico usuário. Especialidade: não informada. Cidade: não informada. Tom: didático, acolhedor e confiante."

    // Inject temas favoritos from memoria
    let temasCtx = ""
    try {
      const { data: temas } = await supabase
        .from("memoria_clinica")
        .select("titulo, conteudo")
        .eq("user_id", auth.userId)
        .eq("tipo", "tema")
        .limit(5)
      if (temas?.length) {
        temasCtx = "\n\nTEMAS FAVORITOS DO MÉDICO:\n" + temas.map(t => `• ${t.titulo}: ${t.conteudo.slice(0, 150)}`).join("\n")
      }
    } catch (e) { console.error("[copiloto-conteudo] erro ao carregar temas da memória:", e) }

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 6000,
      system: `Você é o melhor ghostwriter médico do Brasil, especializado em conteúdo de saúde para Instagram. Gera conteúdo que viraliza, educa e converte. Retorne APENAS JSON válido, sem markdown.`,
      messages: [{
        role: "user",
        content: `${perfilCtx}${temasCtx}${contexto ? ` Contexto adicional: ${contexto}` : ""}

TÓPICO SOLICITADO: "${topico}"

Gere um pacote completo de conteúdo para Instagram. Retorne JSON:
{
  "topico": "${topico}",
  "reel": {
    "titulo": "Título do Reel (impactante)",
    "gancho": "Primeiro frame: gancho visual e texto (máx 7 palavras)",
    "roteiro": "Roteiro completo 30-60s com timestamps:\n[0-5s] ...\n[5-15s] ...\n[15-40s] ...\n[40-55s] ...\n[55-60s] CTA",
    "legenda": "Legenda completa para o Reel (150-200 palavras)",
    "cta": "CTA específico",
    "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  },
  "carrossel": {
    "titulo": "Título do Carrossel",
    "slides": [
      { "numero": 1, "titulo": "Capa — título impactante", "texto": "Texto da capa" },
      { "numero": 2, "titulo": "Slide 2", "texto": "Conteúdo informativo" },
      { "numero": 3, "titulo": "Slide 3", "texto": "Conteúdo informativo" },
      { "numero": 4, "titulo": "Slide 4", "texto": "Conteúdo informativo" },
      { "numero": 5, "titulo": "Slide 5", "texto": "Conteúdo informativo" },
      { "numero": 6, "titulo": "Conclusão + CTA", "texto": "Resumo e chamada para ação" }
    ],
    "legenda": "Legenda para o carrossel",
    "hashtags": ["tag1", "tag2", "tag3"]
  },
  "stories": {
    "sequencia": [
      { "numero": 1, "tipo": "Pergunta|Enquete|Info|CTA", "texto": "Conteúdo do card", "interacao": "Tipo de interação sugerida" },
      { "numero": 2, "tipo": "Info", "texto": "Conteúdo do card 2", "interacao": "" },
      { "numero": 3, "tipo": "Info", "texto": "Conteúdo do card 3", "interacao": "" },
      { "numero": 4, "tipo": "CTA", "texto": "Chamada final", "interacao": "Link para agendamento" }
    ]
  },
  "legenda_alternativa": {
    "versao": "Versão alternativa mais curta e direta (80-100 palavras)",
    "cta": "CTA mais urgente",
    "hashtags": ["tag1", "tag2"]
  }
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/copiloto-conteudo]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
