import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('[push-sub POST] Authorization header:', token ? `present (${token.length} chars)` : 'MISSING')

    const supabase = await createClient()
    const authMethod = token ? 'getUser(token)' : 'getUser()'
    console.log('[push-sub POST] Auth method:', authMethod)
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    console.log('[push-sub POST] Auth result:', user ? `user=${user.id}` : `NO USER, error=${authError?.message || 'none'}`)

    if (!user) {
      return NextResponse.json({ error: 'No autorizado', step: 'auth', authMethod, authError: authError?.message }, { status: 401 })
    }

    const { endpoint, keys } = await request.json()
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.log('[push-sub POST] Invalid payload:', { endpoint: !!endpoint, p256dh: !!keys?.p256dh, auth: !!keys?.auth })
      return NextResponse.json({ error: 'Datos de suscripción inválidos', step: 'validation' }, { status: 400 })
    }

    console.log('[push-sub POST] Upsert payload:', {
      endpoint: endpoint.substring(0, 30) + '...',
      p256dh_len: keys.p256dh.length,
      auth_len: keys.auth.length,
    })

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('push_subscriptions')
      .upsert(
        { endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'endpoint' }
      )

    if (error) {
      console.log('[push-sub POST] Upsert ERROR:', error.message, error.code, error.details)
      return NextResponse.json({ error: 'Error al guardar suscripción', step: 'upsert', detail: error.message }, { status: 500 })
    }

    console.log('[push-sub POST] Upsert SUCCESS')
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[push-sub POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Error al guardar suscripción', step: 'catch', detail: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = await createClient()
    const { data: { user } } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { endpoint } = await request.json()
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requerido' }, { status: 400 })
    }

    const serviceClient = createServiceClient()
    const { error } = await serviceClient
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json({ error: 'Error al eliminar suscripción' }, { status: 500 })
  }
}
