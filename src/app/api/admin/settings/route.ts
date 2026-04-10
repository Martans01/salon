import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { slot_duration_minutes, advance_booking_days } = body

    const supabase = createServiceClient()

    // Get existing settings ID
    const { data: existing } = await supabase
      .from('admin_settings')
      .select('id')
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }

    const updates: Record<string, number> = {}
    if (slot_duration_minutes) updates.slot_duration_minutes = slot_duration_minutes
    if (advance_booking_days) updates.advance_booking_days = advance_booking_days

    const { data, error } = await supabase
      .from('admin_settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
