import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAuth } from '@/lib/auth-check'

const supabase = createClient(
  'https://dnieitrfrjboswlfxzjw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuaWVpdHJmcmpib3N3bGZ4emp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDg2NzQsImV4cCI6MjA5MzQyNDY3NH0.6ZLpwHG2RkzhXjt1LegPgtcMAv0GfyslLPfNkqu0DkY'
)

export async function GET() {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const { data, error } = await supabase
    .from('referencias')
    .select('*')
    .order('criada_em', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const body = await request.json()
  const { error } = await supabase.from('referencias').insert(body)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const body = await request.json()
  const { id, ...updates } = body
  const { error } = await supabase
    .from('referencias')
    .update(updates)
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const auth = await checkAuth()
  if (!auth.authenticated) return auth.response
  const { id } = await request.json()
  const { error } = await supabase.from('referencias').delete().eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
