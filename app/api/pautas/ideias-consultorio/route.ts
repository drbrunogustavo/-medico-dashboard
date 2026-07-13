import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { getAnthropicClient } from "@/lib/anthropic"

export const maxDuration = 30

const CATEGORIAS = [
  "Nutrologia", "Endocrinologia", "Longevidade", "Metabolismo",
  "Microbioma", "Hormônios", "Anti-aging", "Genômica",
]

interface IdeiaConsultorio {
  titulo:       string
  formato:      "reel" | "carrossel" | "post"
  categoria:    string
  justificativa: string
}

export async function POST() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServiceClient()

  const { data: historico } = await supabase
    .from("copiloto_historico")
    .select("resultado, paciente_nome, tipo_consulta")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(15)

  const resumos = (historico ?? [])
    .map(h => {
      const res = h.resultado as { resumo?: string } | null
      return res?.resumo?.trim()
    })
    .filter(Boolean)
    .slice(0, 10)

  if (resumos.length === 0) {
    return NextResponse.json({
      sugestoes: [],
      aviso: "Nenhuma consulta registrada no Copiloto ainda. Registre suas primeiras consultas para gerar ideias.",
    })
  }

  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Você é um estrategista de conteúdo médico. Com base nos resumos de consultas reais abaixo, gere 5 sugestões de pauta para redes sociais (Instagram/YouTube) do médico.

RESUMOS DAS ÚLTIMAS CONSULTAS:
${resumos.map((r, i) => `${i + 1}. ${r}`).join("\n\n")}

Categorias disponíveis: ${CATEGORIAS.join(", ")}

Retorne APENAS JSON — array de 5 objetos:
[
  {
    "titulo": "título do conteúdo (pergunta ou afirmação impactante, ≤12 palavras)",
    "formato": "reel|carrossel|post",
    "categoria": "uma das categorias listadas",
    "justificativa": "1 frase explicando por que esse tema é relevante para os seus pacientes (≤15 palavras)"
  }
]

Regras:
- Basear cada sugestão em um padrão real visto nas consultas
- Não citar dados pessoais de pacientes
- Títulos devem ser diretos, educativos e com potencial de engajamento
- Distribuir os 5 formatos (pelo menos 1 reel, 1 carrossel, 1 post)`,
    }],
  })

  const raw = msg.content.find(b => b.type === "text")?.text ?? "[]"
  let sugestoes: IdeiaConsultorio[] = []
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    const s = cleaned.indexOf("["); const e = cleaned.lastIndexOf("]")
    const parsed  = JSON.parse(s !== -1 && e > s ? cleaned.slice(s, e + 1) : cleaned)
    sugestoes = (Array.isArray(parsed) ? parsed : []).slice(0, 5).filter(
      (s: unknown): s is IdeiaConsultorio =>
        typeof s === "object" && s !== null &&
        typeof (s as IdeiaConsultorio).titulo === "string" &&
        ["reel","carrossel","post"].includes((s as IdeiaConsultorio).formato)
    )
  } catch { /* retorna vazio */ }

  return NextResponse.json({ sugestoes })
}
