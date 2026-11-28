import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 60

const URGENCIAS = ["AGORA", "EM BREVE", "PLANEJAMENTO"] as const
const CONCORRENCIAS = ["Baixa", "Média", "Alta"] as const
const JANELAS = ["30", "60", "90"]

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
const lista = (v: unknown) => (Array.isArray(v) ? v : [])
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseAIJson(text: string): any {
  const limpo = text.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim()
  try { return JSON.parse(limpo) } catch { /* tenta recortar */ }
  const ini = limpo.indexOf("{"), fim = limpo.lastIndexOf("}")
  if (ini >= 0 && fim > ini) return JSON.parse(limpo.slice(ini, fim + 1))
  throw new Error("resposta da IA fora do formato")
}

function normalizar(raw: unknown) {
  const r = obj(raw) ?? {}
  const calendario = lista(r.calendario).flatMap(i => {
    const o = obj(i); if (!o) return []
    const evento = txt(o.evento, 200), conteudo = txt(o.oportunidade_conteudo, 300)
    if (!evento || !conteudo) return []
    return [{
      periodo: txt(o.periodo, 80), evento, oportunidade_conteudo: conteudo,
      oportunidade_campanha: txt(o.oportunidade_campanha, 300),
      urgencia: URGENCIAS.find(u => u === o.urgencia) ?? "PLANEJAMENTO",
    }]
  }).slice(0, 8)
  const tendencias = lista(r.tendencias).flatMap(i => {
    const o = obj(i); if (!o) return []
    const tema = txt(o.tema, 160); if (!tema) return []
    return [{
      tema, janela_oportunidade: txt(o.janela_oportunidade, 120), por_que_agora: txt(o.por_que_agora, 500),
      concorrencia: CONCORRENCIAS.find(c => c === o.concorrencia) ?? "Média", fonte: txt(o.fonte, 160),
    }]
  }).slice(0, 8)
  const alertas = lista(r.alertas).flatMap(i => {
    const o = obj(i); if (!o) return []
    const oportunidade = txt(o.oportunidade, 240); if (!oportunidade) return []
    return [{
      oportunidade, periodo: txt(o.periodo, 100), campanha: txt(o.campanha, 600),
      formatos: lista(o.formatos).map(f => txt(f, 30)).filter(Boolean).slice(0, 5),
    }]
  }).slice(0, 6)
  return { calendario, tendencias, alertas }
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const especialidade = txt(body?.especialidade, 120)
  const localizacao = txt(body?.localizacao, 120) || "Brasil"
  const janela = typeof body?.janela === "string" && JANELAS.includes(body.janela) ? body.janela : ""
  if (!especialidade || !janela) return NextResponse.json({ error: "Informe a especialidade e a janela de análise." }, { status: 400 })

  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full" })

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
        max_tokens: 4500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
        system:
          "Você é consultor de marketing médico no Brasil, especialista em sazonalidade e tendências de saúde. " +
          "Hoje é " + hoje + ". Use essa data para tudo que for 'próximo', 'agora' ou 'em breve'; nunca sugira datas já passadas. " +
          "Base as tendências em pesquisa na web e informe a fonte consultada; se não houver fonte, deixe 'fonte' vazio e não afirme que algo está em alta. " +
          "Não invente números, estatísticas nem estudos. As campanhas devem respeitar a publicidade médica no Brasil: " +
          "sem promessa de resultado, sem promoção de preço ou sorteio, sem antes e depois. " +
          "A resposta final deve ser SOMENTE o JSON, sem markdown e sem texto antes ou depois.",
        messages: [{
          role: "user",
          content:
            "Especialidade: " + especialidade + "\nLocalização: " + localizacao + "\nJanela: próximos " + janela + " dias a partir de hoje\n\n" +
            "Retorne um JSON com 3 chaves:\n" +
            '- calendario: 4 a 6 objetos { periodo, evento, oportunidade_conteudo, oportunidade_campanha, urgencia: "AGORA" | "EM BREVE" | "PLANEJAMENTO" }, apenas eventos dentro da janela\n' +
            '- tendencias: 3 a 5 objetos { tema, janela_oportunidade, por_que_agora (até 2 frases), concorrencia: "Baixa" | "Média" | "Alta", fonte }\n' +
            '- alertas: 3 ou 4 objetos { oportunidade, periodo, campanha (2 a 3 frases), formatos: string[] como ["Reel", "Carrossel", "Story"] }\n\n' +
            "Retorne apenas o JSON.",
        }],
      }),
    })

    const data = await res.json().catch(() => ({})) as { content?: { type: string; text?: string }[]; error?: { message?: string } }
    if (!res.ok || data.error) throw new Error(data.error?.message || "HTTP " + res.status)

    // Com pesquisa web, o primeiro bloco de texto costuma ser um preâmbulo: vale o último que traz o JSON.
    const blocos = (data.content ?? []).filter(b => b.type === "text" && b.text?.includes("{"))
    const texto = blocos[blocos.length - 1]?.text
    if (!texto) throw new Error("sem JSON na resposta")

    const resultado = normalizar(parseAIJson(texto))
    if (resultado.calendario.length + resultado.tendencias.length + resultado.alertas.length === 0) throw new Error("resultado vazio")
    return NextResponse.json(resultado)
  } catch (e) {
    captureAnthropicError(e, "/api/oportunidades")
    console.error("[oportunidades]", e)
    return NextResponse.json({ error: "Não foi possível detectar oportunidades. Tente novamente." }, { status: 502 })
  }
}
