import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient, captureAnthropicError } from "@/lib/anthropic"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { AI_MODEL } from "@/lib/ai-config"
import { logAiUsage } from "@/lib/log-ai-usage"

export const maxDuration = 120

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
const CACHE_DAYS = 7

function ncbiKey() {
  const k = process.env.NCBI_API_KEY
  return k ? `&api_key=${encodeURIComponent(k)}` : ""
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`
}

// Sub-call rápida: traduz o tema do usuário para termo PubMed em inglês/MeSH
async function traduzirParaIngles(tema: string, userId: string): Promise<string> {
  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 60,
    messages: [{
      role: "user",
      content: `Translate this medical topic to the best PubMed search term in English, using MeSH terms when applicable. Reply with ONLY the search term, no explanation, no quotes: ${tema}`,
    }],
  })
  logAiUsage({ userId, rota: "estudos/traducao", inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens })
  return msg.content.find(b => b.type === "text")?.text?.trim() ?? tema
}

async function pubmedSearch(termEN: string, anos: number | null): Promise<string[]> {
  let dateFilter = ""
  if (anos !== null) {
    const today = new Date()
    const from  = new Date(today)
    if (anos < 1) {
      from.setMonth(today.getMonth() - Math.round(anos * 12))
    } else {
      from.setFullYear(today.getFullYear() - anos)
    }
    dateFilter = `&datetype=pdat&mindate=${fmtDate(from)}&maxdate=${fmtDate(today)}`
  }
  // Sem [Title/Abstract]: permite MeSH expansion automática do PubMed
  const url =
    `${NCBI_BASE}/esearch.fcgi?db=pubmed` +
    `&term=${encodeURIComponent(termEN)}` +
    `&retmax=8&sort=date${dateFilter}&retmode=json${ncbiKey()}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`PubMed esearch HTTP ${res.status}`)
  const data = await res.json() as { esearchresult?: { idlist?: string[] } }
  return data.esearchresult?.idlist ?? []
}

async function pubmedFetch(ids: string[]): Promise<string> {
  const url =
    `${NCBI_BASE}/efetch.fcgi?db=pubmed` +
    `&id=${ids.join(",")}` +
    `&retmode=text&rettype=abstract${ncbiKey()}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`PubMed efetch HTTP ${res.status}`)
  return res.text()
}

interface Estudo {
  id: string
  nome: string
  tipo: string
  n: number
  duracao: string
  desfechoPrincipal: string
  resultado: string
  nivelEvidencia: string
  aplicacaoClinica: string
  ano: number
  journal: string
}

interface ResultadoEstudos {
  tema: string
  estudos: Estudo[]
  resumo: string
  fonte?: string
}

function normalizarEstudos(estudos: Estudo[]): Estudo[] {
  return (estudos ?? []).map(e => ({
    ...e,
    n: typeof e.n === "number" ? e.n : 0,
  }))
}

function parseClaudeJSON(text: string): ResultadoEstudos {
  // Tentativa 1: parse direto
  try { return JSON.parse(text) as ResultadoEstudos } catch { /* continua */ }
  // Tentativa 2: remove code fences (```json ... ``` ou ``` ... ```)
  const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  try { return JSON.parse(stripped) as ResultadoEstudos } catch { /* continua */ }
  // Tentativa 3: extrai primeiro bloco { ... } do texto
  const match = text.match(/\{[\s\S]*\}/)
  if (match) { try { return JSON.parse(match[0]) as ResultadoEstudos } catch { /* continua */ } }
  throw new Error(`Claude retornou resposta não parseável como JSON: ${text.slice(0, 120)}…`)
}

async function classificarComClaude(tema: string, abstracts: string, userId: string): Promise<ResultadoEstudos> {
  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 2500,
    system: `Você é um especialista em medicina baseada em evidências. Analise os abstracts de artigos do PubMed fornecidos e extraia informações estruturadas.

CRÍTICO — REGRA ABSOLUTA: Baseie-se EXCLUSIVAMENTE nos abstracts fornecidos abaixo. Não adicione, não invente e não complemente com estudos do seu conhecimento próprio. Se o PubMed retornou poucos abstracts, retorne apenas esses estudos — a lista pode ter 1, 2 ou 3 itens, e está correto assim. Dados não presentes nos abstracts devem ser: n=0, duracao="não informado".

Retorne APENAS um JSON válido, sem markdown, sem texto extra:
{
  "tema": "string",
  "estudos": [
    {
      "id": "string-slug-do-pmid",
      "nome": "nome do estudo (se tiver nome formal) ou título abreviado",
      "tipo": "ECR" | "Metanálise" | "Coorte" | "Revisão Sistemática" | "Estudo Observacional",
      "n": number,
      "duracao": "string",
      "desfechoPrincipal": "string em português",
      "resultado": "string com achados principais em português",
      "nivelEvidencia": "A" | "B" | "C",
      "aplicacaoClinica": "string com implicação prática em português",
      "ano": number,
      "journal": "string"
    }
  ],
  "resumo": "string em português resumindo apenas o que os abstracts acima revelam"
}

Critérios de tipo:
- ECR: menciona randomização, RCT, randomized controlled trial
- Metanálise: meta-analysis, metanálise, pooled analysis de múltiplos estudos
- Revisão Sistemática: systematic review sem metanálise quantitativa
- Coorte: cohort study, estudo de coorte, prospectivo/retrospectivo de grupo
- Estudo Observacional: caso-controle, transversal, cross-sectional, relato de caso

Nível de evidência:
- A: ECR bem desenhado ou Metanálise de ECRs
- B: Coorte bem desenhada, Revisão Sistemática sem metanálise, ECR com limitações
- C: Observacional, caso-controle, consenso de especialistas, estudo de fase inicial`,
    messages: [{
      role: "user",
      content: `Tema buscado: ${tema}

Abstracts do PubMed retornados (ordenados por data, mais recentes primeiro):

${abstracts}

Extraia SOMENTE os estudos presentes nos abstracts acima. Não acrescente nenhum estudo externo.`,
    }],
  })

  logAiUsage({ userId, rota: "estudos", inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens })
  const text   = msg.content.find(b => b.type === "text")?.text ?? "{}"
  const parsed = parseClaudeJSON(text)
  parsed.estudos = normalizarEstudos(parsed.estudos)
  return parsed
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json() as { tema: string; anos?: number | null }
  const tema = body.tema?.trim()
  if (!tema) return NextResponse.json({ error: "Tema não informado" }, { status: 400 })

  // anos: número de anos para filtrar (null = todos); default 5 se não enviado
  const anos: number | null = body.anos !== undefined ? body.anos : 5

  const temaKey  = tema.toLowerCase()
  const cacheKey = `${temaKey}|${anos ?? "todos"}`
  const supabase = createSupabaseServiceClient()

  // ── 1. Verificar cache ────────────────────────────────────────────────────
  const cutoff = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: cached } = await supabase
    .from("estudos_cache")
    .select("resultado_json")
    .eq("tema", cacheKey)
    .gt("criado_em", cutoff)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached?.resultado_json) {
    return NextResponse.json(cached.resultado_json)
  }

  // ── 2. Traduzir para inglês/MeSH antes da busca ───────────────────────────
  let termEN = tema
  try {
    termEN = await traduzirParaIngles(tema, auth.userId)
  } catch (e) {
    captureAnthropicError(e, "/api/estudos")
    console.warn("[estudos] tradução falhou, usando termo original:", e)
  }

  // ── 3. Busca no PubMed ────────────────────────────────────────────────────
  let ids: string[] = []
  let abstracts     = ""
  let pubmedOk      = true

  try {
    ids = await pubmedSearch(termEN, anos)
  } catch (e) {
    captureAnthropicError(e, "/api/estudos")
    console.error("[estudos] PubMed esearch falhou:", e)
    pubmedOk = false
  }

  if (pubmedOk && ids.length === 0) {
    const anosLabel = anos === null
      ? "em todos os anos"
      : anos < 1
        ? `nos últimos ${Math.round(anos * 12)} meses`
        : `nos últimos ${anos} ano${anos !== 1 ? "s" : ""}`
    const empty: ResultadoEstudos = {
      tema,
      estudos: [],
      resumo: `Nenhum estudo encontrado no PubMed para "${tema}" ${anosLabel}. Tente ampliar o período ou usar termos diferentes.`,
      fonte: "pubmed",
    }
    await supabase.from("estudos_cache").insert({ tema: cacheKey, resultado_json: empty })
    return NextResponse.json(empty)
  }

  if (pubmedOk) {
    try {
      abstracts = await pubmedFetch(ids)
    } catch (e) {
      captureAnthropicError(e, "/api/estudos")
      console.error("[estudos] PubMed efetch falhou:", e)
      pubmedOk = false
    }
  }

  // ── 4. Classificação com Claude ───────────────────────────────────────────
  try {
    let resultado: ResultadoEstudos

    if (pubmedOk && abstracts.trim()) {
      resultado = await classificarComClaude(tema, abstracts, auth.userId)
      resultado.fonte = "pubmed"
    } else {
      // Fallback: Claude com conhecimento próprio (PubMed indisponível)
      const anthropic = getAnthropicClient()
      const msg = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 3000,
        system: `Você é um especialista em medicina baseada em evidências. A busca em tempo real no PubMed falhou. Liste os principais estudos clínicos sobre o tema, incluindo APENAS estudos reais e verificáveis. Retorne APENAS JSON válido sem markdown:
{"tema":"string","estudos":[{"id":"string","nome":"string","tipo":"ECR"|"Metanálise"|"Coorte"|"Revisão Sistemática"|"Estudo Observacional","n":number,"duracao":"string","desfechoPrincipal":"string","resultado":"string","nivelEvidencia":"A"|"B"|"C","aplicacaoClinica":"string","ano":number,"journal":"string"}],"resumo":"string"}`,
        messages: [{ role: "user", content: `Liste 4-6 estudos clínicos principais sobre: ${tema}` }],
      })
      logAiUsage({ userId: auth.userId, rota: "estudos/fallback", inputTokens: msg.usage.input_tokens, outputTokens: msg.usage.output_tokens })
      const text = msg.content.find(b => b.type === "text")?.text ?? "{}"
      resultado  = parseClaudeJSON(text)
      resultado.fonte   = "fallback-ia"
      resultado.estudos = normalizarEstudos(resultado.estudos)
    }

    // ── 5. Salvar no cache ────────────────────────────────────────────────
    await supabase.from("estudos_cache").insert({ tema: cacheKey, resultado_json: resultado })

    return NextResponse.json(resultado)
  } catch (e) {
    captureAnthropicError(e, "/api/estudos")
    console.error("[estudos] erro ao processar:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
