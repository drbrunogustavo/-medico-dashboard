import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { inserirProntuario } from "@/lib/medx"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Você é o Copiloto de Consulta do PRAXIS — assistente clínico especialista em Endocrinologia, Nutrologia e Longevidade.
Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois do JSON.`

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const action = req.nextUrl.searchParams.get("action") ?? "gerar"

  try {
    if (action === "prontuario") {
      const { prontuario, idPaciente } = await req.json() as {
        prontuario: string
        idPaciente: string
      }
      if (!prontuario || !idPaciente)
        return NextResponse.json({ error: "prontuario e idPaciente obrigatórios" }, { status: 400 })

      const data = await inserirProntuario(prontuario, idPaciente)
      return NextResponse.json({ ok: true, data })
    }

    // action === "gerar" (default)
    const body = await req.json() as {
      relato:         string
      dados?:         string
      tipoConsulta?:  string
      nomePaciente?:  string
    }

    const nome = body.nomePaciente ?? "paciente"
    const tipo = body.tipoConsulta ?? "Consulta"

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system:     SYSTEM,
      messages: [{
        role:    "user",
        content:
`Dados da consulta${nome !== "paciente" ? ` do(a) ${nome}` : ""}:
Tipo: ${tipo}

RELATO DA CONSULTA:
${body.relato}
${body.dados ? `\nDADOS OBJETIVOS:\n${body.dados}` : ""}

Retorne um JSON com exatamente estas 6 chaves:
{
  "resumo": "Resumo clínico estruturado em 2-3 parágrafos, incluindo quadro clínico, hipóteses diagnósticas e contexto",
  "plano": "Plano terapêutico detalhado: orientações não-farmacológicas, exames solicitados, medicações com dose/posologia, retorno",
  "orientacoes": "Orientações claras e em linguagem acessível para o paciente seguir em casa",
  "followup": "3 mensagens de follow-up prontas para enviar via WhatsApp ou e-mail nos dias D+1, D+7 e D+30 após a consulta",
  "conteudo": "2-3 ideias de conteúdo para redes sociais baseadas no tema clínico desta consulta, sem identificar o paciente",
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
