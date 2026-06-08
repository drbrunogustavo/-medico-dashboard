import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "gerar"

  try {
    const body = await req.json() as {
      nomePaciente:   string
      idPacienteMedx?: string
      tipoTrilha:     "pre_consulta" | "pos_consulta"
      contexto?:      string
      trilha?:        unknown
    }

    // ── Salvar trilha no Supabase ────────────────────────────────────────────
    if (action === "salvar") {
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("nutricao_pacientes_trilhas")
        .insert({
          id_paciente_medx: body.idPacienteMedx ?? null,
          nome_paciente:    body.nomePaciente,
          tipo_trilha:      body.tipoTrilha,
          mensagens:        body.trilha,
          status:           "ativa",
          user_id:          auth.userId,
        })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(data)
    }

    // ── Gerar mensagens com Claude ───────────────────────────────────────────
    const isPre = body.tipoTrilha === "pre_consulta"

    const trilhaSpec = isPre
      ? `TRILHA PRÉ-CONSULTA para ${body.nomePaciente}:
- D-1 (dia anterior): mensagem enviando PDF de exames + link anamnese + orientações para bioimpedância
- D-0 (dia da consulta, manhã): localização do consultório + horário + pedir para chegar 15 minutos antes + orientações bioimpedância`
      : `TRILHA PÓS-CONSULTA para ${body.nomePaciente}:
- H+2 (2 horas após consulta): mensagem empática de boas-vindas ao tratamento + link Google Review
- D+1: reforço empático das 3 orientações principais da consulta
- D+15: check-in de adesão ao tratamento — como está se sentindo?
- D-15 (15 dias antes do retorno): lembrete para refazer os exames de controle`

    const contexto = body.contexto ? `\nContexto da consulta: ${body.contexto}` : ""

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{
        role:    "user",
        content: `Você é o assistente de comunicação clínica do Dr. Bruno Gustavo, endocrinologista e nutrólogo em Poços de Caldas.

Crie as mensagens de WhatsApp para a seguinte trilha:

${trilhaSpec}${contexto}

Tom: empático, profissional, humano. Use o primeiro nome do paciente. Não seja genérico.
Médico: Dr. Bruno Gustavo — Endocrinologia, Nutrologia e Longevidade.

Retorne JSON: [{"timing": "D-1", "titulo": "Título", "texto": "Mensagem completa de WhatsApp"}]
Retorne APENAS o JSON array, sem markdown.`,
      }],
    })

    const raw  = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "[]"
    const clean= raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx  = clean.indexOf("[")
    const msgs = JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json({ mensagens: msgs })
  } catch (e) {
    console.error("[api/nutricao-pacientes]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("nutricao_pacientes_trilhas")
      .select("*")
      .eq("user_id", auth.userId)
      .order("criado_em", { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
