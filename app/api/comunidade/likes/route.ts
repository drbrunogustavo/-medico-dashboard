import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { post_id } = await req.json() as { post_id?: string }
  if (!post_id) return NextResponse.json({ error: "post_id obrigatório" }, { status: 400 })

  const supabase = createSupabaseServerClient()

  const { data: existing } = await supabase
    .from("comunidade_likes")
    .select("id")
    .eq("post_id", post_id)
    .eq("user_id", auth.userId)
    .maybeSingle()

  if (existing) {
    await supabase.from("comunidade_likes").delete().eq("id", existing.id)
    return NextResponse.json({ liked: false })
  }

  await supabase.from("comunidade_likes").insert({ post_id, user_id: auth.userId })
  return NextResponse.json({ liked: true })
}
