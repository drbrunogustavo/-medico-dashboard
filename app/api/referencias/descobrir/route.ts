import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { AI_MODEL } from "@/lib/ai-config"
import { captureAnthropicError } from "@/lib/anthropic"

export const maxDuration = 60

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

function urlHttp(v: unknown) {
  const s = txt(v, 300)
  try { const u = new URL(s); return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "" } catch { return "" }
}

function normalizar(raw: unknown) {
  const lista = Array.isArray((raw as { perfis?: unknown })?.perfis) ? (raw as { perfis: unknown[] }).perfis : []
  const vistos = new Set<string>()
  const out: { nome: string; instagram: string; tema_principal: string; por_que_seguir: string; fonte: string }[] = []
  for (const item of lista) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const handle = txt(o.instagram, 40).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "")
    const nome = txt(o.nome, 120)
    const fonte = urlHttp(o.fonte)
    // Só entra perfil com handle válido e uma fonte da pesquisa que o sustente.
    if (!nome || !/^[A-Za-z0-9._]{1,30}$/.test(handle) || !fonte || vistos.has(handle.toLowerCase())) continue
    vistos.add(handle.toLowerCase())
    out.push({ nome, instagram: "@" + handle, tema_principal: txt(o.tema_principal, 120), por_que_seguir: txt(o.por_que_seguir, 240), fonte })
  }
  return out.slice(0, 6)
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json().catch(() => null) as { especialidade?: unknown } | null
  const especialidade = txt(body?.especialidade, 80)
  if (especialidade.length < 3) return NextResponse.json({ error: "Informe a especialidade." }, { status: 400 })

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 2500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
        system:
          "Você ajuda um médico brasileiro a mapear perfis de referência no Instagram. Use a pesquisa na web. " +
          "Inclua apenas médicos brasileiros cujo perfil apareceu nos resultados e informe a URL da página que o sustenta. " +
          "Nunca invente @, nome nem número de seguidores; se não encontrar, devolva a lista vazia. " +
          "A resposta final deve ser SOMENTE o JSON, sem markdown.",
        messages: [{
          role: "user",
          content:
            "Encontre até 5 médicos brasileiros com presença relevante no Instagram na área de " + especialidade + ".\n" +
            'Retorne {"perfis":[{"nome":"Dr. Nome","instagram":"@handle","tema_principal":"tema que mais aborda","por_que_seguir":"motivo em 1 frase","fonte":"https://url-da-pagina-consultada"}]}',
        }],
      }),
    })
    const data = await res.json().catch(() => ({})) as { content?: { type: string; text?: string }[]; error?: { message?: string } }
    if (!res.ok || data.error) throw new Error(data.error?.message || "HTTP " + res.status)

    const blocos = (data.content ?? []).filter(b => b.type === "text" && b.text?.includes("{"))
    const texto = blocos[blocos.length - 1]?.text ?? ""
    const ini = texto.indexOf("{"), fim = texto.lastIndexOf("}")
    if (ini < 0 || fim <= ini) throw new Error("sem JSON na resposta")
    return NextResponse.json({ perfis: normalizar(JSON.parse(texto.slice(ini, fim + 1))) })
  } catch (e) {
    captureAnthropicError(e, "/api/referencias/descobrir")
    console.error("[referencias/descobrir]", e)
    return NextResponse.json({ error: "Não foi possível buscar perfis agora. Tente novamente." }, { status: 502 })
  }
}
