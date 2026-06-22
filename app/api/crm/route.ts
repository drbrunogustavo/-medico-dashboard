import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message)
  return String(e)
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const estagio = req.nextUrl.searchParams.get("estagio") ?? undefined

  try {
    const supabase = createSupabaseServerClient()
    let query = supabase
      .from("crm_leads")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })

    if (estagio) query = query.eq("estagio", estagio)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await req.json()
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from("crm_leads")
      .insert({ ...body, user_id: auth.userId })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Trigger nurturing non-blocking after lead creation
    if (data?.id) {
      const leadId = data.id
      const userId = auth.userId
      ;(async () => {
        try {
          const { gerarNurturingInline } = await import("@/lib/nurturing")
          await gerarNurturingInline(userId, leadId)
        } catch (e) {
          console.error("[crm/post] nurturing:", e)
        }
      })()
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 })
  }
}
