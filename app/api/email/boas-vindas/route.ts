import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { buildBoasVindasHtml, FROM_EMAIL, REPLY_TO } from "@/lib/email-boas-vindas"

const getResend = () => new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurado." }, { status: 503 })
  }

  const body = await req.json() as { nome?: string; email?: string }
  if (!body.nome || !body.email) {
    return NextResponse.json({ error: "nome e email são obrigatórios." }, { status: 400 })
  }

  const nome = body.nome.replace(/^Dr\.?\s*/i, "")
  const primeiroNome = nome.split(" ")[0] ?? nome

  const { data, error } = await getResend().emails.send({
    from:     FROM_EMAIL,
    to:       [body.email],
    replyTo:  REPLY_TO,
    subject:  `Bem-vindo ao PRAXIS, Dr. ${primeiroNome}! 🎉`,
    html:     buildBoasVindasHtml(body.nome),
  })

  if (error) {
    console.error("[email/boas-vindas] Resend error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 })
}
