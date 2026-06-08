import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { inserirProntuario } from "@/lib/medx"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Você é o Copiloto de Consulta do PRAXIS — um assistente clínico de alto padrão para médicos especialistas em Endocrinologia, Nutrologia e Longevidade.

Seu papel é estruturar os dados de uma consulta e gerar materiais clínicos e de comunicação profissionais, éticos e personalizados.

Retorne SEMPRE JSON válido puro, sem markdown, sem texto antes ou depois do JSON.`

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "gerar"

  try {
    const body = await req.json() as {
      descricao:    string
      nomePaciente?: string
      idCliente?:   string
    }

    if (action === "prontuario") {
      const { descricao, idCliente = "" } = body
      const data = await inserirProntuario(descricao, idCliente)
      return NextResponse.json(data)
    }

    // ── Gerar copiloto completo ──────────────────────────────────────────────
    const nome = body.nomePaciente ?? "paciente"

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 6000,
      system:     SYSTEM,
      messages: [{
        role:    "user",
        content: `Dados da consulta do(a) ${nome}:\n${body.descricao}\n\n` +
`Gere o copiloto completo em JSON com exatamente estas 6 seções:
{
  "resumo": {
    "resumo": "Resumo clínico estruturado da consulta (3-5 parágrafos)",
    "hipoteses": ["Hipótese 1", "Hipótese 2"],
    "exames": [{"exame": "Nome", "justificativa": "Por que solicitar"}]
  },
  "planoAlimentar": {
    "orientacoes": "Orientações nutricionais gerais personalizadas (3-4 parágrafos)",
    "recomendados": ["Alimento 1", "Alimento 2"],
    "restritos": ["Alimento 1", "Alimento 2"],
    "horarios": "Sugestão de cronograma alimentar"
  },
  "orientacoesPaciente": {
    "texto": "Orientações em linguagem simples e empática para o paciente (3 parágrafos)",
    "pontosChave": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "expectativas": "O que esperar do tratamento"
  },
  "mensagensAdesao": [
    {"dia": "Dia 1 pós-consulta", "texto": "Mensagem WhatsApp completa empática"},
    {"dia": "Dia 3",              "texto": "Mensagem WhatsApp"},
    {"dia": "Dia 7",              "texto": "Mensagem WhatsApp"},
    {"dia": "Dia 15",             "texto": "Mensagem WhatsApp"},
    {"dia": "Dia 30",             "texto": "Mensagem WhatsApp"}
  ],
  "conteudoEducativo": [
    {"tipo": "Reel", "titulo": "Título do post", "briefing": "Briefing completo para criar o conteúdo"},
    {"tipo": "Carrossel", "titulo": "Título", "briefing": "Briefing"},
    {"tipo": "Story", "titulo": "Título", "briefing": "Briefing"}
  ],
  "prontuario": "Texto do prontuário estruturado completo, pronto para inserir no sistema, incluindo: queixa principal, história da doença atual, antecedentes, exame físico resumido, hipóteses diagnósticas, conduta e retorno."
}`,
      }],
    })

    const raw    = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean  = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx    = clean.indexOf("{")
    const parsed = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)

    return NextResponse.json(parsed)
  } catch (e) {
    console.error("[api/copiloto]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
