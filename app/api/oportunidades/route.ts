import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { especialidade, localizacao, janela } = await request.json() as {
    especialidade: string
    localizacao: string
    janela: string
  }

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
        max_tokens: 5000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Você é um consultor de marketing médico especialista em sazonalidade, tendências de saúde e oportunidades de faturamento para médicos no Brasil. Combine análise de sazonalidade, tendências de redes sociais e comportamento de pacientes para identificar oportunidades concretas.

Retorne SOMENTE um JSON com 3 chaves (calendario, tendencias, alertas). Sem markdown, sem texto extra.`,
        messages: [{
          role: 'user',
          content: `Especialidade: ${especialidade}
Localização: ${localizacao}
Janela de análise: próximos ${janela} dias

Analise oportunidades para esse médico nos próximos ${janela} dias. Retorne um JSON com:

- calendario: array com 4-6 objetos, cada um com:
  { periodo: string, evento: string, oportunidade_conteudo: string, oportunidade_campanha: string, urgencia: "AGORA" | "EM BREVE" | "PLANEJAMENTO" }

- tendencias: array com 4-5 objetos, cada um com:
  { tema: string, janela_oportunidade: string, por_que_agora: string (2 linhas), concorrencia: "Baixa" | "Média" | "Alta", score: number (0-100) }

- alertas: array com 3-4 objetos, cada um com:
  { oportunidade: string, periodo: string, campanha: string (sugestão em 2-3 linhas), formatos: string[] (ex: ["Reel", "Story", "Anúncio"]) }

Retorne apenas o JSON puro.`,
        }],
      }),
    })

    const data = await res.json() as {
      content?: { type: string; text: string }[]
      error?: { message: string }
    }
    if (data.error) throw new Error(data.error.message)

    const textBlock = data.content?.find(b => b.type === 'text')
    const text  = textBlock?.text ?? '{}'
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = clean.indexOf('{')
    const end   = clean.lastIndexOf('}')
    const json  = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : '{}'

    return NextResponse.json(JSON.parse(json))
  } catch (e) {
    console.error('[oportunidades]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
