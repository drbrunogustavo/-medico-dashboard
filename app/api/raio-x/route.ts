import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"
import { captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 60

function parseAIJson(text: string): unknown {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta não parseável como JSON: ${text.slice(0, 120)}…`)
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { perfil, tema } = await request.json() as { perfil: string; tema: string }

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
        system: `Você é um psicólogo comportamental especialista em marketing médico e comportamento do paciente. Você entende profundamente as motivações, medos, desejos e padrões de linguagem de diferentes perfis de pacientes médicos no Brasil. Analise com precisão clínica e psicológica o perfil fornecido.

Retorne SOMENTE um JSON com exatamente 6 chaves. Sem markdown, sem texto extra.`,
        messages: [{
          role: 'user',
          content: `Perfil do paciente: ${perfil}
Condição/Tema: ${tema}

Analise profundamente esse perfil e retorne um JSON com estas 6 chaves:
- medos: array com 7 strings — medos reais e específicos desse perfil em relação ao tema (seja específico, não genérico)
- desejos: array com 7 strings — desejos e aspirações reais em relação ao tema
- objecoes: array com 7 strings — objeções comuns à consulta ou tratamento (ex: "É muito caro", "Vou ter que tomar para sempre?")
- linguagem: array com 8 strings — palavras e frases EXATAS que esse paciente usa no dia a dia (não linguagem médica — linguagem coloquial real, com aspas quando for frase)
- conteudos: array com 8 strings — tipos de conteúdo no Instagram que esse perfil consome e compartilha
- gatilhos: array com 6 strings — o que faz esse paciente finalmente marcar uma consulta

Retorne apenas o JSON puro.`,
        }],
      }),
    })

    const data = await res.json() as {
      content?: { type: string; text: string }[]
      error?: { message: string }
    }
    if (data.error) throw new Error(data.error.message)

    const text = data.content?.[0]?.text ?? '{}'
    return NextResponse.json(parseAIJson(text))
  } catch (e) {
    captureAnthropicError(e, "/api/raio-x")
    console.error('[raio-x]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
