import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as Record<string, unknown>
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from("nurturing_sequencias")
    .update(body)
    .eq("id", params.id)
    .eq("user_id", auth.userId)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
