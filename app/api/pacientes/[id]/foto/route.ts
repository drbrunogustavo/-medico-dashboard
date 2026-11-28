import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServiceClient } from "@/lib/supabase-service"
import { originGuard } from "@/lib/check-origin"

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
}
const SIGNED_URL_TTL = 3600 // 1 hora

// O tipo informado pelo navegador pode mentir: confere os primeiros bytes do arquivo.
function assinaturaConfere(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === "image/png")  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  if (mime === "image/webp") return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  return false
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServiceClient()

  const { data: pac } = await supabase
    .from("pacientes_local")
    .select("foto_url")
    .eq("id", (await params).id)
    .eq("user_id", auth.userId)
    .maybeSingle()

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
  { params }: { params: Promise<{ id: string }> }
) {
  const originErr = originGuard(req)
  if (originErr) return originErr

  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const { id } = await params
  const form   = await req.formData().catch(() => null)
  const file   = form?.get("file") as File | null
  if (!file || typeof file === "string") return NextResponse.json({ error: "file obrigatório" }, { status: 400 })

  if (!ALLOWED_MIME[file.type])
    return NextResponse.json({ error: "Tipo inválido. Use JPEG, PNG ou WebP." }, { status: 400 })
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Imagem muito grande. Máximo 5 MB." }, { status: 400 })

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!assinaturaConfere(bytes, file.type))
    return NextResponse.json({ error: "O arquivo não é uma imagem válida." }, { status: 400 })

  const supabase = createSupabaseServiceClient()
  const ext      = ALLOWED_MIME[file.type]
  const path     = `${auth.userId}/${id}.${ext}`

  try {
    // A foto só entra em ficha de paciente que pertence a quem está logado.
    const { data: pac, error: pacErr } = await supabase
      .from("pacientes_local").select("id, foto_url").eq("id", id).eq("user_id", auth.userId).maybeSingle()
    if (pacErr) throw new Error(pacErr.message)
    if (!pac) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 })

    const { error: upErr } = await supabase.storage
      .from("pacientes-fotos")
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw new Error(upErr.message)

    const { error: updErr } = await supabase
      .from("pacientes_local")
      .update({ foto_url: path })
      .eq("id", id)
      .eq("user_id", auth.userId)
    if (updErr) throw new Error(updErr.message)

    // Troca de formato (jpg para png, por exemplo) deixaria o arquivo antigo órfão na pasta.
    const anterior = pac.foto_url as string | null
    if (anterior && anterior !== path) await supabase.storage.from("pacientes-fotos").remove([anterior])

    const { data: signed } = await supabase.storage
      .from("pacientes-fotos")
      .createSignedUrl(path, SIGNED_URL_TTL)

    return NextResponse.json({ foto_url: signed?.signedUrl ?? null })
  } catch (e) {
    console.error("[api/pacientes/[id]/foto POST]", e)
    return NextResponse.json({ error: "Erro ao enviar a foto." }, { status: 500 })
  }
}
