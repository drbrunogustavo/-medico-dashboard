import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  const { tema, tipo, numSlides } = await request.json()
  const count = tipo === 'unica' ? 1 : numSlides

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: `Você é especialista em marketing médico digital para Instagram do Dr. Bruno Gustavo (@drbrunogustavo), médico clínico-geral pós-graduado em Endocrinologia e Nutrologia. Público: homens e mulheres 35–60 anos, classe média-alta, focados em emagrecimento, longevidade, performance e saúde hormonal. Crie conteúdo de autoridade, baseado em evidência científica real, sofisticado e direto. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois.`,
      messages: [{
        role: "user",
        content: `Crie conteúdo para ${count} slide(s) sobre o tema: "${tema}".

${tipo === 'carrossel' ? `
ESTRUTURA OBRIGATÓRIA DOS ${count} SLIDES:
- Slide 1: tipo "capa" — tag "INFORMAÇÃO", headline forte em CAIXA ALTA (quebra de crença ou dado impactante), subtítulo opcional em itálico
- Slides 2 a ${count - 1}: tipo "conteudo" — título em CAIXA ALTA, texto de apoio 2-4 linhas diretas e informativas. Ao menos 2 slides devem ter cientifico: true com dados reais de estudos (valores de p, percentuais, coorte)
- Slide ${count}: tipo "cta" — conteúdo fixo de call to action
` : `
ESTRUTURA: tipo "unica" — headline impactante em CAIXA ALTA, subtítulo e texto de apoio.
`}

Retorne APENAS este JSON (sem nenhum texto fora):
{
  "slides": [
    {
      "numero": 1,
      "tipo": "capa|conteudo|cta|unica",
      "tag": "INFORMAÇÃO ou null",
      "headline": "TÍTULO EM CAIXA ALTA",
      "subtitulo": "frase em itálico ou null",
      "texto": "2-4 linhas de conteúdo médico direto ou null",
      "cientifico": false,
      "dados": "ex: 'Redução de 18% nos marcadores inflamatórios (p<0.001)' ou null",
      "fonte": "NEJM|JAMA|The Lancet|Nature Medicine|Diabetes Care ou null"
    }
  ]
}`
      }]
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = texto.replace(/```json|```/g, "").trim()
    const idx = clean.indexOf("{")
    const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json(parsed)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao gerar conteúdo" }, { status: 500 })
  }
}
