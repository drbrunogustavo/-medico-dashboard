import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES     = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo 'file' ausente." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo inválido. Use JPEG, PNG ou WebP." }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 2 MB." }, { status: 400 })
  }

  const ext      = file.type.split("/")[1].replace("jpeg", "jpg")
  const filename = `${crypto.randomUUID()}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.storage
    .from("anuncios-banners")
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[upload-imagem] storage:", error)
    return NextResponse.json({ error: "Erro ao salvar imagem." }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from("anuncios-banners")
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
