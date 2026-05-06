import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Você é especialista em marketing médico digital para Instagram do Dr. Bruno Gustavo (@drbrunogustavo), médico clínico-geral pós-graduado em Endocrinologia e Nutrologia. Público: 35–60 anos, classe média-alta, foco em emagrecimento, longevidade, performance e saúde hormonal. Crie conteúdo de autoridade, baseado em evidência, sofisticado. IMPORTANTE: textos CURTOS e IMPACTANTES. Responda APENAS com JSON válido, sem markdown.`

function buildSlideSchema() {
  return `{
  "numero": number,
  "tipo": "capa|conteudo|cta|unica",
  "tag": "INFORMAÇÃO ou null",
  "headline": "MÁXIMO 55 CHARS EM CAIXA ALTA",
  "subtitulo": "máximo 60 chars ou null",
  "texto": "máximo 120 chars, 2-3 linhas curtas ou null",
  "cientifico": false,
  "dados": "dado científico impactante máximo 70 chars ou null",
  "fonte": "NEJM|JAMA|The Lancet|Nature Medicine|Diabetes Care ou null"
}`
}

export async function POST(request: Request) {
  const { tema, tipo, numSlides, singleSlide, instrucao } = await request.json()

  // Single slide regeneration
  if (singleSlide) {
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM,
        messages: [{
          role: "user",
          content: `Regenere o slide ${singleSlide.numero} (tipo: ${singleSlide.tipo}) sobre "${tema}" com a seguinte correção: ${instrucao}.
Retorne APENAS o JSON do slide:
${buildSlideSchema()}`
        }]
      })
      const texto = message.content[0].type === 'text' ? message.content[0].text : ''
      const clean = texto.replace(/```json|```/g, "").trim()
      const idx = clean.indexOf("{")
      const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
      return NextResponse.json({ slide: parsed })
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: "Erro ao regenerar slide" }, { status: 500 })
    }
  }

  // Full carousel/single generation
  const count = tipo === 'unica' ? 1 : numSlides
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Crie ${count} slide(s) sobre: "${tema}".

${tipo === 'carrossel' ? `
ESTRUTURA OBRIGATÓRIA:
- Slide 1: tipo "capa" — tag "INFORMAÇÃO", headline impactante (quebra de crença ou dado chocante), subtítulo opcional
- Slides 2 a ${count - 1}: tipo "conteudo" — headline direto, texto curto 2-3 linhas. Ao menos 2 slides com cientifico: true (dados reais: valores p, %, n amostral)
- Slide ${count}: tipo "cta"
` : `tipo "unica" — headline, subtítulo e texto curto.`}

REGRAS CRÍTICAS:
- Headlines: MÁXIMO 55 chars, CAIXA ALTA, impactantes
- Textos: MÁXIMO 120 chars, diretos, sem enrolação
- Dados científicos: valores reais (ex: "Redução de 23% no peso corporal (p<0.001, n=1.961)")
- NÃO repetir informações entre slides

Retorne APENAS JSON:
{
  "slides": [${buildSlideSchema()}]
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
