import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL, getAnthropicClient } from "@/lib/ai-config"


export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()
  try {
    const { conteudo, formatos = ["carrossel", "story", "legenda", "whatsapp"] } = await req.json() as {
      conteudo: string; formatos?: string[]
    }
    if (!conteudo?.trim()) return NextResponse.json({ error: "Conteúdo é obrigatório" }, { status: 400 })

    const formatosStr = formatos.join(", ")

    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 4000,
      system: "Você é especialista em repurposing de conteúdo médico para redes sociais. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role: "user",
        content: `Repurpose o seguinte conteúdo do médico usuário para diferentes formatos.

CONTEÚDO ORIGINAL:
${conteudo}

FORMATOS SOLICITADOS: ${formatosStr}

Retorne JSON com as chaves correspondentes aos formatos solicitados:
{
  "carrossel": { "titulo": "...", "slides": ["capa", "slide 1", "slide 2", "CTA"], "cta": "..." },
  "story": { "slides": ["texto slide 1", "texto slide 2", "texto slide 3 (CTA)"] },
  "legenda": "Legenda completa para Instagram com gancho + corpo + CTA + hashtags",
  "whatsapp": "Mensagem adaptada para WhatsApp — tom próximo e informal mas com autoridade médica",
  "tweet": "Post para X (Twitter) — máx 280 chars",
  "email": "Assunto: ...\\n\\nCorpo do e-mail formatado"
}

Inclua APENAS os formatos solicitados (${formatosStr}). Escreva tudo em português brasileiro.`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    return NextResponse.json(JSON.parse(idx >= 0 ? clean.slice(idx) : clean))
  } catch (e) {
    console.error("[api/repurposing]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
