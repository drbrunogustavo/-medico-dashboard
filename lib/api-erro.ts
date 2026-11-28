import { NextResponse } from "next/server"

/** Resposta 500 padrão: o detalhe vai para o log do servidor, o cliente recebe só um texto genérico. */
export function erroInterno(tag: string, e: unknown, status = 500) {
  console.error(tag, e)
  return NextResponse.json({ error: "Erro interno. Tente novamente em instantes." }, { status })
}
