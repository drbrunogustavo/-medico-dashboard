import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { captureAnthropicError } from "@/lib/anthropic"

const TIPOS = ["conservadora", "equilibrada", "polemica", "viral"] as const
const RISCOS = ["Baixo", "Médio", "Alto"] as const
type Tipo = (typeof TIPOS)[number]
type Risco = (typeof RISCOS)[number]

interface Abordagem { tipo: Tipo; titulo: string; gancho: string; estrutura: string[]; risco: Risco }

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  const stripped = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
  try { return JSON.parse(stripped) } catch { /* tenta recortar */ }
  const ini = stripped.indexOf("["), fim = stripped.lastIndexOf("]")
  if (ini >= 0 && fim > ini) return JSON.parse(stripped.slice(ini, fim + 1))
  throw new Error("resposta da IA fora do formato")
}

/** Mantém só abordagens completas, com campos limitados e valores de lista fechada. */
function normalizar(lista: unknown): Abordagem[] {
  if (!Array.isArray(lista)) return []
  const vistos = new Set<Tipo>()
  const out: Abordagem[] = []
  for (const item of lista) {
    if (!item || typeof item !== "object") continue
    const r = item as Record<string, unknown>
    const tipo = TIPOS.find(t => t === r.tipo)
    const titulo = txt(r.titulo, 140)
    const gancho = txt(r.gancho, 700)
    const estrutura = Array.isArray(r.estrutura) ? r.estrutura.map(p => txt(p, 300)).filter(Boolean).slice(0, 8) : []
    if (!tipo || vistos.has(tipo) || !titulo || !gancho || estrutura.length === 0) continue
    vistos.add(tipo)
    out.push({ tipo, titulo, gancho, estrutura, risco: RISCOS.find(x => x === r.risco) ?? "Médio" })
  }
  return TIPOS.flatMap(t => out.filter(a => a.tipo === t))
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json().catch(() => null) as { tema?: unknown } | null
  const tema = txt(body?.tema, 300)
  if (tema.length < 3) return NextResponse.json({ error: "Informe o tema do conteúdo." }, { status: 400 })

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 3000,
        system:
          "Você é estrategista de conteúdo para um médico clínico geral com foco em endocrinologia e nutrologia, no Instagram. " +
          "Gere abordagens que chamem atenção sem violar a ética médica brasileira: nada de promessa de resultado ou cura, " +
          "nada de dado, estudo, número de pacientes ou experiência pessoal inventados, e nenhuma afirmação que o médico não possa sustentar com literatura. " +
          "Quando um gancho depender de um dado, escreva o gancho de modo que ele funcione sem número, ou marque o trecho como [conferir fonte]. " +
          "Retorne SOMENTE um JSON array com exatamente 4 objetos. Sem markdown e sem texto extra.",
        messages: [{
          role: "user",
          content:
            "Tema médico: " + tema + "\n\n" +
            "Gere 4 abordagens para um Reel ou carrossel sobre este tema:\n" +
            "1. conservadora: tom seguro, baseado em evidências, sem polêmica\n" +
            "2. equilibrada: apresenta os dois lados e estimula reflexão crítica\n" +
            "3. polemica: questiona um consenso com respaldo científico real\n" +
            "4. viral: máximo impacto emocional, mas verdadeiro e sem sensacionalismo\n\n" +
            "Cada objeto tem:\n" +
            '- tipo: "conservadora" | "equilibrada" | "polemica" | "viral"\n' +
            "- titulo: título sugerido (máx 85 caracteres)\n" +
            "- gancho: as 3 primeiras linhas de abertura, separadas por \\n\n" +
            "- estrutura: array com exatamente 5 strings, os pontos do roteiro\n" +
            '- risco: "Baixo" | "Médio" | "Alto" (risco de crítica de colegas, do conselho de medicina ou de desinformação)\n\n' +
            "Retorne apenas o array JSON.",
        }],
      }),
    })

    const data = await res.json().catch(() => ({})) as { content?: { text?: string }[]; error?: { message?: string } }
    if (!res.ok || data.error) throw new Error(data.error?.message || "HTTP " + res.status)

    const abordagens = normalizar(parseAIJson(data.content?.[0]?.text ?? "[]"))
    if (abordagens.length === 0) throw new Error("nenhuma abordagem válida")
    return NextResponse.json({ abordagens })
  } catch (e) {
    captureAnthropicError(e, "/api/polemicas")
    console.error("[polemicas]", e)
    return NextResponse.json({ error: "Não foi possível gerar as abordagens. Tente novamente." }, { status: 502 })
  }
}
