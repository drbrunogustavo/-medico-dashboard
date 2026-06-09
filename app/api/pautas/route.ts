import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("pautas")
    .select("*")
    .eq("user_id", auth.userId)
    .order("criada_em", { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json() as Record<string, unknown>
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("pautas")
    .insert({ ...body, user_id: auth.userId })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await request.json() as Record<string, unknown>
  const { id, ...updates } = body
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("pautas")
    .update(updates)
    .eq("id", id)
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = await request.json() as { id: string }
  const supabase = createSupabaseServerClient()
  const { error } = await supabase
    .from("pautas")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
