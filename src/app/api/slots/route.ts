import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const type = searchParams.get('type') || 'en_tienda'
  const barber_id = searchParams.get('barber_id')
  const branch_id = searchParams.get('branch_id')

  const supabase = createServiceClient()

  try {
    if (date) {
      // Get slots for a specific date
      let slotQuery = supabase
        .from('time_slots')
        .select('id, date, start_time, end_time, is_booked')
        .eq('date', date)
        .eq('type', type)
        .order('start_time')

      if (barber_id) slotQuery = slotQuery.eq('barber_id', barber_id)
      else slotQuery = slotQuery.is('barber_id', null)
      if (branch_id) slotQuery = slotQuery.eq('branch_id', branch_id)

      const { data, error } = await slotQuery

      if (error) throw error
      return NextResponse.json(data)
    }

    if (from && to) {
      // Get dates that have available slots in range
      let rangeQuery = supabase
        .from('time_slots')
        .select('date, is_booked')
        .gte('date', from)
        .lte('date', to)
        .eq('type', type)
        .order('date')

      if (barber_id) rangeQuery = rangeQuery.eq('barber_id', barber_id)
      else rangeQuery = rangeQuery.is('barber_id', null)
      if (branch_id) rangeQuery = rangeQuery.eq('branch_id', branch_id)

      const { data, error } = await rangeQuery

      if (error) throw error

      // Group by date and return dates with at least one available slot
      const dateMap = new Map<string, { total: number; available: number }>()
      for (const slot of data) {
        const existing = dateMap.get(slot.date) || { total: 0, available: 0 }
        existing.total++
        if (!slot.is_booked) existing.available++
        dateMap.set(slot.date, existing)
      }

      const availableDates = Array.from(dateMap.entries())
        .filter(([, info]) => info.available > 0)
        .map(([date, info]) => ({ date, ...info }))

      return NextResponse.json(availableDates)
    }

    return NextResponse.json({ error: 'Provide date or from/to params' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Error fetching slots' }, { status: 500 })
  }
}
