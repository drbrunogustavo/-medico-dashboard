import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id }   = params
  const form     = await req.formData()
  const file     = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "file obrigatório" }, { status: 400 })

  const ALLOWED_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png":  "png",
    "image/webp": "webp",
  }
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

    const { data: { publicUrl } } = supabase.storage
      .from("pacientes-fotos")
      .getPublicUrl(path)

    await supabase
      .from("pacientes_local")
      .update({ foto_url: publicUrl })
      .eq("id", id)
      .eq("user_id", auth.userId)

    return NextResponse.json({ foto_url: publicUrl })
  } catch (e) {
    console.error("[api/pacientes/[id]/foto POST]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
