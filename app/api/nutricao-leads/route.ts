import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CRONOGRAMA = [
  { dia: 1,  tipo: "Story",    titulo: "Conexão — identificação com a dor" },
  { dia: 3,  tipo: "Vídeo",    titulo: "Conteúdo educativo de valor"       },
  { dia: 5,  tipo: "Carrossel",titulo: "Aprofundamento do tema"            },
  { dia: 7,  tipo: "Story",    titulo: "Prova social — resultado/depoimento"},
  { dia: 10, tipo: "Vídeo",    titulo: "Conteúdo de autoridade"            },
  { dia: 14, tipo: "Mensagem", titulo: "Oferta suave — convite para consulta"},
  { dia: 21, tipo: "Mensagem", titulo: "Follow-up — urgência leve"         },
  { dia: 30, tipo: "Mensagem", titulo: "Último contato — oferta final"     },
]

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { searchParams } = req.nextUrl
  const action = searchParams.get("action") ?? "gerar"

  try {
    const body = await req.json() as {
      perfil:      string
      interesse:   string
      duracaoDias: number
      telefone?:   string | null
      trilha?:     unknown
      id?:         string
    }

    // ── Salvar lead no Supabase ──────────────────────────────────────────────
    if (action === "salvar") {
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("leads_nutricao")
        .insert({
          perfil:       body.perfil,
          interesse:    body.interesse,
          duracao_dias: body.duracaoDias,
          telefone:     body.telefone ?? null,
          trilha:       body.trilha,
          status:       "ativa",
          user_id:      auth.userId,
        })
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(data)
    }

    // ── Atualizar status ─────────────────────────────────────────────────────
    if (action === "status") {
      const { id, ...rest } = body as unknown as { id: string; status: string }
      const supabase = createSupabaseServerClient()
      const { data, error } = await supabase
        .from("leads_nutricao")
        .update(rest)
        .eq("id", id)
        .eq("user_id", auth.userId)
        .select()
        .single()
      if (error) throw error
      return NextResponse.json(data)
    }

    // ── Gerar trilha com Claude ──────────────────────────────────────────────
    const dias = body.duracaoDias === 7  ? CRONOGRAMA.filter(d => d.dia <= 7)
               : body.duracaoDias === 15 ? CRONOGRAMA.filter(d => d.dia <= 15)
               : CRONOGRAMA

    const resp = await client.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{
        role:    "user",
        content: `Você é especialista em nutrição de leads médicos para o Dr. Bruno Gustavo (Endocrinologia, Nutrologia, Longevidade — Poços de Caldas).

PERFIL DO LEAD: ${body.perfil}
INTERESSE DEMONSTRADO: ${body.interesse}
DURAÇÃO DA TRILHA: ${body.duracaoDias} dias

Crie uma trilha de conteúdo e comunicação para aquecer este lead até ele agendar uma consulta.

Cronograma a preencher:
${dias.map(d => `DIA ${d.dia} — ${d.tipo}: ${d.titulo}`).join("\n")}

Para cada item, retorne:
- Se tipo for "Mensagem": texto completo de WhatsApp personalizado para o perfil
- Se tipo for "Story", "Vídeo" ou "Carrossel": briefing completo para criar o conteúdo
  (objetivo, gancho de abertura, pontos principais, CTA)

Retorne JSON array:
[{
  "dia": 1,
  "tipo": "Story",
  "titulo": "Título",
  "texto": "Texto completo do WhatsApp OU briefing do conteúdo",
  "ehMensagem": false
}]

Retorne APENAS o JSON array, sem markdown.`,
      }],
    })

    const raw  = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "[]"
    const clean= raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx  = clean.indexOf("[")
    const dias2= JSON.parse(idx >= 0 ? clean.slice(idx) : clean)
    return NextResponse.json({ trilha: dias2 })
  } catch (e) {
    console.error("[api/nutricao-leads]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("leads_nutricao")
      .select("*")
      .eq("user_id", auth.userId)
      .order("criado_em", { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
