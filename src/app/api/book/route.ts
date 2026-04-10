import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushToAdmin } from '@/lib/push'
import type { DeliveryLocation } from '@/types'

function formatTimeAmPm(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      time_slot_id,
      client_name,
      client_phone,
      services,
      appointment_type = 'en_tienda',
      delivery_location,
      barber_id,
      branch_id,
    }: {
      time_slot_id: string
      client_name: string
      client_phone: string
      services: string[]
      appointment_type?: 'en_tienda' | 'delivery'
      delivery_location?: DeliveryLocation
      barber_id?: string
      branch_id?: string
    } = body

    if (!time_slot_id || !client_name || !client_phone || !services?.length) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (appointment_type === 'delivery' && !delivery_location) {
      return NextResponse.json(
        { error: 'Ubicación requerida para citas delivery' },
        { status: 400 }
      )
    }

    // Validate phone format (+507 XXXX-XXXX)
    const phoneClean = client_phone.replace(/[\s-]/g, '')
    if (!/^\+507\d{7,8}$/.test(phoneClean)) {
      return NextResponse.json(
        { error: 'Número de teléfono inválido. Formato: +507 XXXX-XXXX' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase.rpc('book_slot', {
      p_time_slot_id: time_slot_id,
      p_client_name: client_name.trim(),
      p_client_phone: phoneClean,
      p_services: services,
      p_appointment_type: appointment_type,
      p_delivery_location: delivery_location ?? null,
      p_barber_id: barber_id ?? null,
      p_branch_id: branch_id ?? null,
    })

    if (error) {
      if (error.message?.includes('SLOT_ALREADY_BOOKED')) {
        return NextResponse.json(
          { error: 'Este horario ya fue reservado. Por favor selecciona otro.' },
          { status: 409 }
        )
      }
      throw error
    }

    // Fetch barber and branch names if applicable
    let barberName = ''
    let branchName = ''
    if (barber_id) {
      const { data: barber } = await supabase.from('barbers').select('name').eq('id', barber_id).single()
      if (barber) barberName = barber.name
    }
    if (branch_id) {
      const { data: branch } = await supabase.from('branches').select('name').eq('id', branch_id).single()
      if (branch) branchName = branch.name
    }

    // Send push notification to admin (non-blocking)
    const isDelivery = appointment_type === 'delivery'
    const extra = [barberName, branchName].filter(Boolean).join(' · ')
    sendPushToAdmin({
      title: isDelivery ? 'Nueva Cita Delivery' : 'Nueva Cita',
      body: `${client_name}${extra ? ` (${extra})` : ''} - ${services.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')} - ${formatTimeAmPm(data.start_time)}`,
    }).catch(console.error)

    // Attach names for confirmation page
    if (barberName) data.barber_name = barberName
    if (branchName) data.branch_name = branchName

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: 'Error al crear la reserva' },
      { status: 500 }
    )
  }
}
