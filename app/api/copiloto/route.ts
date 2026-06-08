import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Você é o Copiloto de Consulta do PRAXIS — assistente clínico para médicos especialistas em Endocrinologia, Nutrologia e Longevidade.
Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois.`

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json() as {
      descricao:     string
      nomePaciente?: string
    }

    const nome = body.nomePaciente ?? "paciente"

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 4000,
      system:     SYSTEM,
      messages: [{
        role:    "user",
        content:
`Dados da consulta do(a) ${nome}:
${body.descricao}

Retorne um JSON com exatamente estas 4 chaves:
{
  "resumo": "Resumo clínico estruturado da consulta em 2-3 parágrafos",
  "hipoteses": ["Hipótese diagnóstica 1", "Hipótese 2", "Hipótese 3"],
  "conduta": "Conduta sugerida: orientações, exames solicitados, medicações, retorno — em texto corrido",
  "prontuario": "QUEIXA PRINCIPAL:\\n...\\n\\nHISTÓRIA DA DOENÇA ATUAL:\\n...\\n\\nANTECEDENTES:\\n...\\n\\nEXAME FÍSICO:\\n...\\n\\nHIPÓTESES DIAGNÓSTICAS:\\n...\\n\\nCONDUTA:\\n...\\n\\nRETORNO:\\n..."
}`,
      }],
    })

    const raw   = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? ""
    const clean = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
    const start = clean.indexOf("{")
    const end   = clean.lastIndexOf("}")

    if (start === -1 || end === -1) {
      console.error("[api/copiloto] JSON não encontrado:", clean.slice(0, 200))
      return NextResponse.json({ error: "Claude não retornou JSON válido. Tente novamente." }, { status: 502 })
    }

    const parsed = JSON.parse(clean.slice(start, end + 1))
    return NextResponse.json(parsed)
  } catch (e) {
    console.error("[api/copiloto]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
