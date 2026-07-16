import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 60

function parseAIJson<T>(text: string): T {
  try { return JSON.parse(text) as T } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) as T } catch { /* continua */ }
  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) as T } catch { /* continua */ } }
  throw new Error(`IA retornou resposta não parseável como JSON: ${text.slice(0, 120)}…`)
}

interface MedicamentoSugestao {
  nome: string
  dose: string
  ajuste?: string
}

interface ResultadoSugestao {
  justificativa: string
  medicamentos1aLinha: MedicamentoSugestao[]
  examesRecomendados: string[]
  alertas: string[]
  retornoPrevisto: string
}

function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null
  const nascimento = new Date(dataNascimento)
  const hoje = new Date()
  const anos = hoje.getFullYear() - nascimento.getFullYear()
  const mesPassou = hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate())
  return mesPassou ? anos : anos - 1
}

function calcularIMC(peso: number | null, altura: number | null): number | null {
  if (!peso || !altura || altura === 0) return null
  const alturaM = altura / 100
  return Math.round((peso / (alturaM * alturaM)) * 10) / 10
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as { pacienteId?: string; diagnosticoId?: string; diagnosticoNome?: string }
  const { pacienteId, diagnosticoId, diagnosticoNome } = body

  if (!pacienteId) {
    return NextResponse.json({ error: "pacienteId obrigatório" }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  const { data: pac, error: pacErr } = await supabase
    .from("pacientes_local")
    .select("nome,peso,altura,data_nascimento,sexo,medicamentos,protocolo_ativo,circunferencia_ab")
    .eq("id", pacienteId)
    .eq("user_id", auth.userId)
    .single()

  if (pacErr || !pac) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })
  }

  const idade = calcularIdade(pac.data_nascimento as string | null)
  const imc   = calcularIMC(pac.peso as number | null, pac.altura as number | null)

  const contextoClinico = [
    pac.nome ? `Paciente: ${pac.nome}` : null,
    idade    ? `Idade: ${idade} anos`  : null,
    pac.sexo ? `Sexo biológico: ${pac.sexo === "M" ? "Masculino" : pac.sexo === "F" ? "Feminino" : "Outro"}` : null,
    pac.peso    ? `Peso: ${pac.peso} kg`  : null,
    pac.altura  ? `Altura: ${pac.altura} cm` : null,
    imc         ? `IMC: ${imc} kg/m²`    : null,
    pac.circunferencia_ab ? `Circunferência abdominal: ${pac.circunferencia_ab} cm` : null,
    pac.protocolo_ativo ? `Protocolo ativo: ${pac.protocolo_ativo}` : null,
    pac.medicamentos && Array.isArray(pac.medicamentos) && pac.medicamentos.length > 0
      ? `Medicamentos em uso: ${(pac.medicamentos as string[]).join(", ")}`
      : null,
  ].filter(Boolean).join("\n")

  const prompt = `Você é um assistente clínico. Com base nos dados do paciente abaixo, gere uma sugestão de prescrição personalizada para o diagnóstico indicado.

DADOS DO PACIENTE:
${contextoClinico}

DIAGNÓSTICO: ${diagnosticoNome ?? diagnosticoId ?? "não especificado"}

Responda APENAS com um JSON válido, sem markdown, no seguinte formato:
{
  "justificativa": "string — explicação clínica considerando os dados do paciente",
  "medicamentos1aLinha": [
    { "nome": "string", "dose": "string", "ajuste": "string ou null" }
  ],
  "examesRecomendados": ["string"],
  "alertas": ["string — contraindicações ou cuidados especiais para este paciente"],
  "retornoPrevisto": "string — ex: 30 dias, 3 meses"
}`

  try {
    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })

    const text = message.content.find(b => b.type === "text")?.text ?? ""
    let resultado: ResultadoSugestao
    try {
      resultado = parseAIJson<ResultadoSugestao>(text)
    } catch {
      return NextResponse.json({ error: "IA retornou formato inválido", raw: text.slice(0, 200) }, { status: 500 })
    }

    const { data: saved, error: saveErr } = await supabase
      .from("prescricoes_sugestoes")
      .insert({
        user_id:         auth.userId,
        paciente_id:     pacienteId,
        diagnostico_id:  diagnosticoId   ?? null,
        diagnostico_nome: diagnosticoNome ?? null,
        resultado,
      })
      .select("id")
      .single()

    if (saveErr) {
      console.error("[prescricao/sugestao] save error:", saveErr.message)
    }

    return NextResponse.json({ ...resultado, sugestaoId: saved?.id ?? null })
  } catch (e) {
    captureAnthropicError(e, "/api/prescricao/sugestao")
    console.error("[prescricao/sugestao POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
