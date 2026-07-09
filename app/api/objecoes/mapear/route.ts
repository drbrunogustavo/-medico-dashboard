import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"


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
export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { tema } = await request.json() as { tema: string }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 4000,
        system: `Você é um especialista em comportamento do paciente e marketing médico no Brasil. Você conhece profundamente as objeções reais que pacientes têm em relação a tratamentos médicos, baseado em anos de consultório e pesquisa de comportamento.

Retorne SOMENTE um JSON array. Sem markdown, sem texto extra.`,
        messages: [{
          role: 'user',
          content: `Tratamento/Tema: ${tema}

Gere 50 objeções reais que pacientes brasileiros têm sobre esse tema. Use linguagem coloquial — como o paciente realmente diria.

Cada objeção deve ter:
- id: número de 1 a 50
- texto: a objeção como o paciente formularia (linguagem coloquial, pode ser pergunta ou afirmação)
- categoria: uma das 5 categorias:
  "MEDO" — medos sobre segurança, riscos, efeitos a longo prazo
  "CUSTO/ACESSO" — questões de preço, convênio, acesso
  "EFICACIA" — dúvidas sobre se funciona
  "EFEITOS" — preocupações com efeitos colaterais imediatos
  "DEPENDENCIA" — sobre duração, dependência, uso contínuo

Distribua aproximadamente 10 objeções por categoria.
Retorne apenas o JSON array com os 50 objetos.`,
        }],
      }),
    })

    const data = await res.json() as {
      content?: { type: string; text: string }[]
      error?: { message: string }
    }
    if (data.error) throw new Error(data.error.message)

    const text  = data.content?.[0]?.text ?? '[]'
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = clean.indexOf('[')
    const end   = clean.lastIndexOf(']')
    const json  = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : '[]'

    return NextResponse.json({ objecoes: parseAIJson(json) })
  } catch (e) {
    console.error('[objecoes/mapear]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
