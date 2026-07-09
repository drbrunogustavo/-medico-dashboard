import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { getAnthropicClient } from "@/lib/anthropic"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { AI_MODEL } from "@/lib/ai-config"

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
const CACHE_DAYS = 7

function ncbiKey() {
  const k = process.env.NCBI_API_KEY
  return k ? `&api_key=${encodeURIComponent(k)}` : ""
}

async function pubmedSearch(tema: string): Promise<string[]> {
  const url =
    `${NCBI_BASE}/esearch.fcgi?db=pubmed` +
    `&term=${encodeURIComponent(tema + "[Title/Abstract]")}` +
    `&retmax=8&sort=date&retmode=json${ncbiKey()}`
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

async function classificarComClaude(tema: string, abstracts: string): Promise<ResultadoEstudos> {
  const anthropic = getAnthropicClient()
  const msg = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 4000,
    system: `Você é um especialista em medicina baseada em evidências. Analise os abstracts de artigos do PubMed fornecidos e extraia informações estruturadas.

IMPORTANTE: Baseie-se EXCLUSIVAMENTE no que está nos abstracts. Não invente dados ausentes. Se o N amostral não estiver explícito, use 0. Se a duração não estiver clara, use "não informado".

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
  "resumo": "string em português resumindo o panorama geral das evidências encontradas"
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

Abstracts do PubMed (ordenados por data de publicação, mais recentes primeiro):

${abstracts}

Extraia os dados estruturados de cada artigo listado acima e retorne o JSON.`,
    }],
  })

  const text = msg.content.find(b => b.type === "text")?.text ?? "{}"
  const parsed = JSON.parse(text) as ResultadoEstudos

  // Garantir que n seja sempre number para não quebrar o frontend
  parsed.estudos = (parsed.estudos ?? []).map(e => ({
    ...e,
    n: typeof e.n === "number" ? e.n : 0,
  }))

  return parsed
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { tema } = await request.json() as { tema: string }
  if (!tema?.trim()) {
    return NextResponse.json({ error: "Tema não informado" }, { status: 400 })
  }

  const temaKey = tema.trim().toLowerCase()
  const supabase = createSupabaseServiceClient()

  // ── 1. Verificar cache ────────────────────────────────────────────────────
  const cutoff = new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data: cached } = await supabase
    .from("estudos_cache")
    .select("resultado_json")
    .eq("tema", temaKey)
    .gt("criado_em", cutoff)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached?.resultado_json) {
    return NextResponse.json(cached.resultado_json)
  }

  // ── 2. Busca no PubMed ────────────────────────────────────────────────────
  let ids: string[] = []
  let abstracts = ""
  let pubmedOk = true

  try {
    ids = await pubmedSearch(tema)
  } catch (e) {
    console.error("[estudos] PubMed esearch falhou:", e)
    pubmedOk = false
  }

  if (pubmedOk && ids.length === 0) {
    const empty: ResultadoEstudos = {
      tema,
      estudos: [],
      resumo: `Nenhum estudo encontrado no PubMed para o tema "${tema}". Tente termos em inglês ou mais específicos.`,
      fonte: "pubmed",
    }
    await supabase.from("estudos_cache").insert({ tema: temaKey, resultado_json: empty })
    return NextResponse.json(empty)
  }

  if (pubmedOk) {
    try {
      abstracts = await pubmedFetch(ids)
    } catch (e) {
      console.error("[estudos] PubMed efetch falhou:", e)
      pubmedOk = false
    }
  }

  // ── 3. Classificação com Claude ───────────────────────────────────────────
  try {
    let resultado: ResultadoEstudos

    if (pubmedOk && abstracts.trim()) {
      resultado = await classificarComClaude(tema, abstracts)
      resultado.fonte = "pubmed"
    } else {
      // Fallback: Claude com conhecimento próprio, deixando claro para o usuário
      const anthropic = getAnthropicClient()
      const msg = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 3000,
        system: `Você é um especialista em medicina baseada em evidências. A busca em tempo real no PubMed falhou. Use seu conhecimento de treinamento para listar os principais estudos sobre o tema, incluindo apenas estudos reais e verificáveis. Retorne APENAS JSON válido sem markdown:
{
  "tema": "string",
  "estudos": [{ "id": "string", "nome": "string", "tipo": "ECR"|"Metanálise"|"Coorte"|"Revisão Sistemática"|"Estudo Observacional", "n": number, "duracao": "string", "desfechoPrincipal": "string", "resultado": "string", "nivelEvidencia": "A"|"B"|"C", "aplicacaoClinica": "string", "ano": number, "journal": "string" }],
  "resumo": "string"
}`,
        messages: [{ role: "user", content: `Liste 4-6 estudos clínicos principais sobre: ${tema}` }],
      })
      const text = msg.content.find(b => b.type === "text")?.text ?? "{}"
      resultado = JSON.parse(text) as ResultadoEstudos
      resultado.fonte = "fallback-ia"
      resultado.estudos = (resultado.estudos ?? []).map(e => ({ ...e, n: typeof e.n === "number" ? e.n : 0 }))
    }

    // ── 4. Salvar no cache ────────────────────────────────────────────────
    await supabase.from("estudos_cache").insert({ tema: temaKey, resultado_json: resultado })

    return NextResponse.json(resultado)
  } catch (e) {
    console.error("[estudos] erro ao processar:", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
