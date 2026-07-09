import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


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
export const maxDuration = 20

interface CidSugerido {
  codigo: string
  descricao: string
  justificativa: string
}

function errMsg(e: unknown) { return e instanceof Error ? e.message : String(e) }

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const client = getAnthropicClient()

  const { resumo, plano } = await req.json() as { resumo: string; plano?: string }
  if (!resumo?.trim()) return NextResponse.json({ cids: [] })

  try {
    const resp = await client.messages.create({
      model:      AI_MODEL,
      max_tokens: 600,
      system:     "Você é um médico especialista em codificação CID-10. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role:    "user",
        content: `Com base no resumo clínico abaixo, sugira exatamente 3 hipóteses diagnósticas com seus códigos CID-10 mais prováveis.

RESUMO CLÍNICO:
${resumo.slice(0, 1500)}
${plano ? `\nPLANO TERAPÊUTICO:\n${plano.slice(0, 500)}` : ""}

Retorne JSON:
{
  "cids": [
    {
      "codigo": "E11.9",
      "descricao": "Diabetes mellitus tipo 2 sem complicações",
      "justificativa": "Breve justificativa clínica (máx 60 chars)"
    }
  ]
}

Regras:
- Exatamente 3 CIDs, do mais ao menos provável
- Use CID-10 brasileiro (versão 2022)
- Prefira os diagnósticos mais relevantes para o plano de tratamento descrito`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
    const s = clean.indexOf("{"); const e = clean.lastIndexOf("}")
    if (s === -1 || e === -1) return NextResponse.json({ cids: [] })

    const parsed = parseAIJson(clean.slice(s, e + 1)) as { cids?: CidSugerido[] }
    return NextResponse.json({ cids: (parsed.cids ?? []).slice(0, 3) })
  } catch (e) {
    console.error("[sugerir-cid]", errMsg(e))
    return NextResponse.json({ cids: [] })
  }
}
