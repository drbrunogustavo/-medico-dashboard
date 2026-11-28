import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { FROM_EMAIL } from "@/lib/email-boas-vindas"

const CONTATO = "contato@praxisplataforma.com.br"

// Limite por IP, em memória (por instância), no mesmo padrão de /api/nps/public
const WINDOW_MS = 10 * 60_000
const MAX = 3
const store = new Map<string, { count: number; start: number }>()
function limitado(ip: string) {
  const now = Date.now()
  const e = store.get(ip)
  if (!e || now - e.start > WINDOW_MS) { store.set(ip, { count: 1, start: now }); return false }
  if (e.count >= MAX) return true
  e.count++
  return false
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string))
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  if (limitado(ip)) return NextResponse.json({ error: "Muitas solicitações. Tente novamente em alguns minutos." }, { status: 429 })

  const body = await req.json().catch(() => null) as { nome?: unknown; email?: unknown } | null
  const nome = typeof body?.nome === "string" ? body.nome.trim().slice(0, 120) : ""
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 160) : ""
  if (nome.length < 2 || !EMAIL_RE.test(email)) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })

  if (!process.env.RESEND_API_KEY) {
    console.error("[deletar-dados] RESEND_API_KEY não definido; solicitação não enviada")
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 })
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [CONTATO],
      replyTo: email,
      subject: `Solicitação de exclusão de dados (LGPD): ${nome.replace(/[\r\n]/g, " ")}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;color:#0D1B2A;">
          <h2 style="margin-bottom:8px;">Solicitação de exclusão de dados (LGPD, art. 18)</h2>
          <p><strong>Nome informado:</strong> ${esc(nome)}</p>
          <p><strong>E-mail informado:</strong> ${esc(email)}</p>
          <p><strong>Recebida em:</strong> ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
          <p style="color:#666;font-size:13px;">O formulário é público e não confirma que o e-mail pertence ao solicitante. Antes de excluir, confirme a identidade respondendo a este e-mail e comparando com o cadastro da plataforma.</p>
        </div>`,
    })
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[deletar-dados]", e instanceof Error ? e.message : "erro")
    return NextResponse.json({ error: "Não foi possível registrar a solicitação" }, { status: 502 })
  }
}
