import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET() {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('display_order')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, address, phone, lat, lng, image_url } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get next display_order
    const { data: last } = await supabase
      .from('branches')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const display_order = (last?.display_order ?? -1) + 1
    const slug = slugify(name.trim())

    const { data, error } = await supabase
      .from('branches')
      .insert({
        name: name.trim(),
        slug,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        lat: lat ?? null,
        lng: lng ?? null,
        image_url: image_url?.trim() || null,
        display_order,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una sucursal con ese nombre' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating branch:', error)
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 })
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

    const allowed = ['name', 'address', 'phone', 'lat', 'lng', 'image_url', 'is_active', 'display_order']
    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in fields) {
        updateData[key] = fields[key]
      }
    }

    // Auto-update slug if name changes
    if (updateData.name && typeof updateData.name === 'string') {
      updateData.slug = slugify(updateData.name)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json({ error: 'Error al actualizar sucursal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const supabase = createServiceClient()

  // Soft delete
  const { data, error } = await supabase
    .from('branches')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
