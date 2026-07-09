import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { AI_MODEL } from "@/lib/ai-config"
import { getAnthropicClient } from "@/lib/anthropic"


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  try { return JSON.parse(text) } catch { /* continua */ }
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) } catch { /* continua */ }
  const m1 = stripped.match(/\{[\s\S]*\}/)
  if (m1) { try { return JSON.parse(m1[0]) } catch { /* continua */ } }
  const m2 = stripped.match(/\[[\s\S]*\]/)
  if (m2) { try { return JSON.parse(m2[0]) } catch { /* continua */ } }
  throw new Error(`IA retornou resposta n\u00e3o parse\u00e1vel como JSON: ${text.slice(0, 120)}\u2026`)
}
export const maxDuration = 60


function getWeekKey() {
  const d = new Date()
  const year = d.getFullYear()
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const client = getAnthropicClient()
  try {
    const { especialidade = "Endocrinologia e Nutrologia" } = await req.json() as { especialidade?: string }
    const semana = getWeekKey()

    const supabase = createSupabaseServerClient()

    const { data: perfil } = await supabase
      .from("perfis")
      .select("cidade, estado")
      .eq("user_id", auth.userId)
      .maybeSingle()
    const local = perfil?.cidade ? `${perfil.cidade}, ${perfil.estado ?? ""}`.trim() : "Brasil"

    // Check 7-day cache
    const { data: cached } = await supabase
      .from("mercado_cache")
      .select("dados")
      .eq("semana", `${semana}-${especialidade}`)
      .maybeSingle()

    if (cached?.dados) {
      return NextResponse.json(cached.dados)
    }

    // Generate fresh intelligence
    const resp = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 4000,
      system: "Você é especialista em marketing médico e inteligência de mercado para médicos brasileiros. Retorne APENAS JSON válido, sem markdown.",
      messages: [{
        role: "user",
        content: `Gere um relatório de inteligência de mercado para um médico especialista em ${especialidade} no Brasil (${local}) para a semana de ${new Date().toLocaleDateString("pt-BR")}.

Retorne JSON neste formato:
{
  "semana": "${semana}",
  "especialidade": "${especialidade}",
  "tendencias": [
    {
      "topico": "Nome do tópico trending",
      "crescimento_pct": 35,
      "descricao": "Por que está em alta e oportunidade para o médico",
      "urgencia": "Alta|Média|Baixa",
      "tipo": "Científico|Comportamental|Sazonal|Viral"
    }
  ],
  "oportunidades_conteudo": [
    {
      "titulo": "Título do conteúdo sugerido",
      "formato": "Reel|Carrossel|Stories|Live",
      "pilar": "Educativo|Autoridade|Vendas|Relacionamento",
      "justificativa": "Por que criar agora",
      "potencial": "Alto|Médio|Baixo"
    }
  ],
  "perguntas_pacientes": [
    {
      "pergunta": "Pergunta frequente dos pacientes",
      "volume_estimado": "Alto|Médio",
      "resposta_curta": "Resposta objetiva para usar no conteúdo"
    }
  ],
  "concorrentes_destaque": [
    {
      "tipo": "Tipo de médico/perfil competindo pelo público",
      "estrategia": "O que estão fazendo bem",
      "oportunidade": "Como se diferenciar"
    }
  ],
  "resumo_executivo": "Resumo de 2-3 frases das principais oportunidades desta semana"
}`,
      }],
    })

    const raw = (resp.content.find(b => b.type === "text") as { text: string } | undefined)?.text ?? "{}"
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const idx = clean.indexOf("{")
    const dados = parseAIJson(idx >= 0 ? clean.slice(idx) : clean)

    // Cache in Supabase
    await supabase
      .from("mercado_cache")
      .upsert({ semana: `${semana}-${especialidade}`, dados }, { onConflict: "semana" })

    return NextResponse.json(dados)
  } catch (e) {
    console.error("[api/mercado]", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
