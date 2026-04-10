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
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const barber_id = searchParams.get('barber_id')
  const branch_id = searchParams.get('branch_id')

  const supabase = createServiceClient()

  const hasDateFilter = from || to
  let query = supabase
    .from('appointments')
    .select(`
      *,
      time_slot:time_slots${hasDateFilter ? '!inner' : ''}(*),
      barber:barbers(id, name, image_url),
      branch:branches(id, name)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (barber_id) query = query.eq('barber_id', barber_id)
  if (branch_id) query = query.eq('branch_id', branch_id)
  if (from) query = query.gte('time_slot.date', from)
  if (to) query = query.lte('time_slot.date', to)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, status, new_time_slot_id, payment_amount, payment_method } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Change time slot
    if (new_time_slot_id) {
      const { data: current, error: fetchErr } = await supabase
        .from('appointments')
        .select('time_slot_id')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr

      const { data: newSlot, error: slotErr } = await supabase
        .from('time_slots')
        .select('is_booked')
        .eq('id', new_time_slot_id)
        .single()
      if (slotErr) throw slotErr
      if (newSlot.is_booked) {
        return NextResponse.json({ error: 'Este horario ya fue reservado' }, { status: 409 })
      }

      // Free old slot
      await supabase.from('time_slots').update({ is_booked: false }).eq('id', current.time_slot_id)
      // Book new slot
      await supabase.from('time_slots').update({ is_booked: true }).eq('id', new_time_slot_id)
      // Update appointment
      const { data, error } = await supabase
        .from('appointments')
        .update({ time_slot_id: new_time_slot_id })
        .eq('id', id)
        .select('*, time_slot:time_slots(*)')
        .single()
      if (error) throw error

      return NextResponse.json(data)
    }

    // Status change
    if (!status) {
      return NextResponse.json({ error: 'Status o new_time_slot_id requerido' }, { status: 400 })
    }

    const validStatuses = ['pendiente', 'confirmada', 'cancelada', 'completada']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    // Require payment info when completing
    if (status === 'completada') {
      if (!payment_amount || payment_amount <= 0) {
        return NextResponse.json({ error: 'Monto de pago requerido' }, { status: 400 })
      }
      const validMethods = ['efectivo', 'yappy']
      if (!payment_method || !validMethods.includes(payment_method)) {
        return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = { status }
    if (status === 'completada') {
      updateData.payment_amount = payment_amount
      updateData.payment_method = payment_method
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`*, time_slot:time_slots(*)`)
      .single()

    if (error) throw error

    // If cancelled, free up the time slot
    if (status === 'cancelada') {
      await supabase
        .from('time_slots')
        .update({ is_booked: false })
        .eq('id', data.time_slot_id)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Error al actualizar cita' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()

    // Get the appointment to free the time slot
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('time_slot_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    // Free the time slot
    if (appointment?.time_slot_id) {
      await supabase
        .from('time_slots')
        .update({ is_booked: false })
        .eq('id', appointment.time_slot_id)
    }

    // Delete the appointment
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Error al eliminar cita' }, { status: 500 })
  }
}
