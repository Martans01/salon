import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const branch_id = searchParams.get('branch_id')

  const supabase = createServiceClient()

  let query = supabase
    .from('barbers')
    .select('*, branch:branches(id, name)')
    .order('display_order')
    .order('name')

  if (branch_id) query = query.eq('branch_id', branch_id)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, title, bio, image_url, phone, instagram, years_of_experience, branch_id, commission_percent } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get next display_order
    const { data: last } = await supabase
      .from('barbers')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const display_order = (last?.display_order ?? -1) + 1

    const { data, error } = await supabase
      .from('barbers')
      .insert({
        name: name.trim(),
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        image_url: image_url?.trim() || null,
        phone: phone?.trim() || null,
        instagram: instagram?.trim() || null,
        years_of_experience: years_of_experience ?? 0,
        branch_id: branch_id || null,
        commission_percent: commission_percent ?? 50,
        display_order,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating barber:', error)
    return NextResponse.json({ error: 'Error al crear estilista' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Only allow known fields
    const allowed = ['name', 'title', 'bio', 'image_url', 'phone', 'instagram', 'years_of_experience', 'is_active', 'display_order', 'branch_id', 'commission_percent']
    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in fields) {
        updateData[key] = fields[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('barbers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating barber:', error)
    return NextResponse.json({ error: 'Error al actualizar estilista' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const supabase = createServiceClient()

  // Soft delete: set is_active = false
  const { data, error } = await supabase
    .from('barbers')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
