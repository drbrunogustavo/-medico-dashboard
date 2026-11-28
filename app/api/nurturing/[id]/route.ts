import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { erroInterno } from "@/lib/api-erro"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const body = await req.json() as Record<string, unknown>
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("nurturing_sequencias")
    .update(body)
    .eq("id", (await params).id)
    .eq("user_id", auth.userId)
    .select()
    .single()
  if (error) return erroInterno("[nurturing/[id]]", error)
  return NextResponse.json(data)
}
