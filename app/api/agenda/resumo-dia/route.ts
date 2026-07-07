import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAgenda } from "@/lib/medx"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 30

interface Appt {
  paciente?:         string
  nomePaciente?:     string
  nomeContato?:      string
  hora?:             string
  horaInicio?:       string
  procedimento?:     string
  nomeProcedimento?: string
  status?:           string
  nomeStatus?:       string
  [key: string]:     unknown
}

export async function POST() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const hoje = new Date().toISOString().split("T")[0]
  const raw  = await getAgenda(hoje, hoje)
  const appts: Appt[] = Array.isArray(raw) ? raw : []

  if (appts.length === 0) {
    return NextResponse.json({ resumo: "Nenhum agendamento encontrado para hoje." })
  }

  const linhas = appts.map(a => {
    const nome = a.nomePaciente ?? a.nomeContato ?? a.paciente ?? "Paciente"
    const hora = a.horaInicio ?? a.hora ?? ""
    const proc = a.nomeProcedimento ?? a.procedimento ?? "Consulta"
    const st   = a.nomeStatus ?? a.status ?? ""
    return `${hora} — ${nome} (${proc})${st ? ` [${st}]` : ""}`
  }).join("\n")

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Você é um assistente clínico. Com base na agenda abaixo, escreva um briefing do dia para o médico em até 120 palavras. Mencione: total de pacientes, tipos de consulta presentes, algum destaque ou atenção especial se relevante. Tom direto e profissional.

AGENDA DE HOJE:
${linhas}

Responda em texto corrido, sem listas, sem markdown.`,
    }],
  })

  const resumo = msg.content.find(b => b.type === "text")?.text ?? ""
  return NextResponse.json({ resumo: resumo.trim() })
}
