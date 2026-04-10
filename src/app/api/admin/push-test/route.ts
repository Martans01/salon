import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushToAdmin } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = await createClient()
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const result = await sendPushToAdmin({
      title: 'Prueba',
      body: 'Las notificaciones funcionan correctamente',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Push test error:', error)
    return NextResponse.json({ error: 'Error al enviar notificación de prueba' }, { status: 500 })
  }
}
