import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
}
const SIGNED_URL_TTL = 3600 // 1 hora

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServiceClient()

  const { data: pac } = await supabase
    .from("pacientes_local")
    .select("foto_url")
    .eq("id", params.id)
    .eq("user_id", auth.userId)
    .single()

  const stored = pac?.foto_url as string | null
  if (!stored) return NextResponse.json({ foto_url: null })

  const { data, error } = await supabase.storage
    .from("pacientes-fotos")
    .createSignedUrl(stored, SIGNED_URL_TTL)

  if (error || !data?.signedUrl) return NextResponse.json({ foto_url: null })
  return NextResponse.json({ foto_url: data.signedUrl })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = params
  const form   = await req.formData()
  const file   = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "file obrigatório" }, { status: 400 })

  if (!ALLOWED_MIME[file.type])
    return NextResponse.json({ error: "Tipo inválido. Use JPEG, PNG ou WebP." }, { status: 400 })
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Imagem muito grande. Máximo 5 MB." }, { status: 400 })

  const supabase = createSupabaseServiceClient()
  const ext      = ALLOWED_MIME[file.type]
  const path     = `${auth.userId}/${id}.${ext}`

  try {
    const { error: upErr } = await supabase.storage
      .from("pacientes-fotos")
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw new Error(upErr.message)

    await supabase
      .from("pacientes_local")
      .update({ foto_url: path })
      .eq("id", id)
      .eq("user_id", auth.userId)

    const { data: signed } = await supabase.storage
      .from("pacientes-fotos")
      .createSignedUrl(path, SIGNED_URL_TTL)

    return NextResponse.json({ foto_url: signed?.signedUrl ?? null })
  } catch (e) {
    console.error("[api/pacientes/[id]/foto POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
