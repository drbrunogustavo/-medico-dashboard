import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient } from "@/lib/anthropic"
import { PDFParse } from "pdf-parse"

export const maxDuration = 60

interface ExameExtraido {
  nome:       string
  valor:      string
  unidade?:   string
  referencia?: string
  tendencia?: "up" | "down" | "stable"
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file || file.type !== "application/pdf")
    return NextResponse.json({ error: "PDF obrigatório" }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) })
  const { text } = await parser.getText()

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `Extraia os exames laboratoriais deste laudo médico e retorne APENAS JSON.

TEXTO DO LAUDO:
${text.slice(0, 8000)}

Retorne um array JSON:
[{"nome": "...", "valor": "...", "unidade": "...", "referencia": "...", "tendencia": "up|down|stable"}]

Regras:
- nome: nome do exame (ex: "HbA1c", "Glicemia de Jejum", "TSH")
- valor: valor numérico como string (ex: "6.2")
- unidade: unidade de medida (ex: "%", "mg/dL", "mUI/L") — omitir se ausente
- referencia: intervalo de referência como string (ex: "< 7%") — omitir se ausente
- tendencia: "up" se acima do ref, "down" se abaixo, "stable" se normal — omitir se não determinável
- Inclua APENAS exames com valores numéricos identificáveis
- Máximo 30 exames`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "[]"
  let exames: ExameExtraido[] = []
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const s = cleaned.indexOf("["); const e = cleaned.lastIndexOf("]")
    exames = JSON.parse(s !== -1 && e > s ? cleaned.slice(s, e + 1) : cleaned)
  } catch { /* retorna vazio */ }

  return NextResponse.json({
    exames: Array.isArray(exames) ? exames.slice(0, 30) : [],
  })
}
