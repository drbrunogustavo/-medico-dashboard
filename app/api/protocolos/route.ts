import { NextRequest, NextResponse } from 'next/server'
import { checkAuth } from '@/lib/auth-check'
import { AI_MODEL } from "@/lib/ai-config"

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { protocolo, contexto, protocolo_base } = await request.json() as {
    protocolo: string
    contexto: string
    protocolo_base: string
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
        max_tokens: 2000,
        system: `Você é um especialista em medicina baseada em evidências, com expertise em endocrinologia, nutrologia e medicina do estilo de vida.
Sua tarefa é personalizar um protocolo clínico padrão para um paciente específico, considerando o contexto fornecido pelo médico.
Responda em texto corrido estruturado, com seções claras, linguagem técnica adequada para médicos.
Seja objetivo, prático e baseado em evidências. Inclua doses específicas quando relevante.`,
        messages: [{
          role: 'user',
          content: `Protocolo base: ${protocolo}

${protocolo_base}

---

Contexto do paciente: ${contexto}

Gere um protocolo personalizado para este paciente específico, adaptando o protocolo padrão às suas características. Organize em seções: Avaliação Específica, Conduta Proposta, Medicações (com doses), Monitoramento e Alertas Específicos.`,
        }],
      }),
    })

    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()
    const texto = data.content?.[0]?.text ?? ''
    return NextResponse.json({ texto })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
