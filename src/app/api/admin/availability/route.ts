import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateSlotsFromAvailability } from '@/lib/utils/slots'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return null
  }
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const supabase = createServiceClient()

  const type = searchParams.get('type') || 'en_tienda'
  const barber_id = searchParams.get('barber_id')
  const branch_id = searchParams.get('branch_id')

  let query = supabase
    .from('availability')
    .select('*')
    .eq('type', type)
    .order('date')
    .order('start_time')

  if (barber_id) query = query.eq('barber_id', barber_id)
  else query = query.is('barber_id', null)
  if (branch_id) query = query.eq('branch_id', branch_id)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

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
    const { date, start_time, end_time, type = 'en_tienda', barber_id = null, branch_id = null } = body

    if (!date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Fecha y horarios requeridos' }, { status: 400 })
    }

    if (!['en_tienda', 'delivery'].includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get slot duration from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('slot_duration_minutes')
      .single()

    const duration = settings?.slot_duration_minutes || 30

    // Create availability
    const { data: availability, error: avError } = await supabase
      .from('availability')
      .insert({ date, start_time, end_time, type, barber_id, branch_id })
      .select()
      .single()

    if (avError) {
      if (avError.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe disponibilidad para esa fecha y hora' },
          { status: 409 }
        )
      }
      throw avError
    }

    // Generate time slots
    const slots = generateSlotsFromAvailability({
      date,
      start_time,
      end_time,
      duration_minutes: duration,
      availability_id: availability.id,
    })

    // Filter out slots that already exist for this date+type+barber (from overlapping availability)
    let existingQuery = supabase
      .from('time_slots')
      .select('start_time')
      .eq('date', date)
      .eq('type', type)

    if (barber_id) existingQuery = existingQuery.eq('barber_id', barber_id)
    else existingQuery = existingQuery.is('barber_id', null)
    if (branch_id) existingQuery = existingQuery.eq('branch_id', branch_id)

    const { data: existingSlots } = await existingQuery

    const existingStartTimes = new Set(existingSlots?.map((s: { start_time: string }) => s.start_time) || [])
    const newSlots = slots
      .filter((s) => !existingStartTimes.has(s.start_time))
      .map((s) => ({ ...s, type, barber_id, branch_id }))

    if (newSlots.length > 0) {
      const { error: slotError } = await supabase
        .from('time_slots')
        .insert(newSlots)

      if (slotError) {
        // Rollback availability if slots fail
        await supabase.from('availability').delete().eq('id', availability.id)
        throw slotError
      }
    }

    return NextResponse.json({ availability, slots_created: newSlots.length }, { status: 201 })
  } catch (error) {
    console.error('Error creating availability:', error)
    return NextResponse.json({ error: 'Error al crear disponibilidad' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const supabase = createServiceClient()

  // Check if any slots are booked
  const { data: bookedSlots } = await supabase
    .from('time_slots')
    .select('id')
    .eq('availability_id', id)
    .eq('is_booked', true)

  if (bookedSlots && bookedSlots.length > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: hay citas reservadas en este horario' },
      { status: 409 }
    )
  }

  // Delete availability (cascades to time_slots)
  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
