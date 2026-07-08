import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth-check"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response

  const supabase = createSupabaseServerClient()

  const { data: asset, error: fetchErr } = await supabase
    .from("marca_assets")
    .select("arquivo_url")
    .eq("id", params.id)
    .eq("user_id", auth.userId)
    .single()

  if (fetchErr || !asset) {
    return NextResponse.json({ error: "Asset não encontrado" }, { status: 404 })
  }

  // Extrai path relativo do bucket da URL pública para remoção do storage
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/perfil-assets/`
  const storagePath = (asset.arquivo_url as string).startsWith(base)
    ? (asset.arquivo_url as string).slice(base.length)
    : null

  if (storagePath) {
    await supabase.storage.from("perfil-assets").remove([storagePath])
  }

  const { error } = await supabase
    .from("marca_assets")
    .delete()
    .eq("id", params.id)
    .eq("user_id", auth.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
