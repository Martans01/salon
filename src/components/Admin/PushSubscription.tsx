'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      console.log('[PushSub] getAuthHeader: token found', session.access_token.substring(0, 8) + '...')
      return { Authorization: `Bearer ${session.access_token}` }
    }
    console.log('[PushSub] getAuthHeader: no session')
  } catch (e) {
    console.log('[PushSub] getAuthHeader: error', e)
  }
  return {}
}

async function saveSubscription(subscription: PushSubscription) {
  const toBase64Url = (buffer: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

  const authHeader = await getAuthHeader()
  console.log('[PushSub] saveSubscription: auth=' + !!authHeader.Authorization + ', endpoint=' + subscription.endpoint.substring(0, 30) + '...')
  const res = await fetch('/api/admin/push-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: toBase64Url(subscription.getKey('p256dh')!),
        auth: toBase64Url(subscription.getKey('auth')!),
      },
    }),
  })

  const data = await res.json().catch(() => ({}))
  console.log('[PushSub] saveSubscription: status=' + res.status + ', body=' + JSON.stringify(data))
  if (!res.ok) {
    throw new Error(`Error al guardar suscripción push (${res.status}): ${data.error || res.statusText}`)
  }
}

async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) as BufferSource,
  })
  await saveSubscription(subscription)
  return subscription
}

export default function PushSubscription() {
  const [showBanner, setShowBanner] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !('Notification' in window) || !('serviceWorker' in navigator)) return

    if (Notification.permission === 'granted') {
      const subVersion = 'push-sub-v2'
      if (!localStorage.getItem(subVersion)) {
        navigator.serviceWorker.ready.then(async (reg) => {
          const existing = await reg.pushManager.getSubscription()
          if (existing) await existing.unsubscribe()
          await subscribeToPush()
          localStorage.setItem(subVersion, '1')
        }).catch((err) => {
          console.error(err)
          setError(err instanceof Error ? err.message : 'Error al guardar suscripción push')
        })
      } else {
        subscribeToPush().catch((err) => {
          console.error(err)
          setError(err instanceof Error ? err.message : 'Error al guardar suscripción push')
        })
      }
      return
    }

    if (Notification.permission === 'default') {
      setShowBanner(true)
    }
  }, [])

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await subscribeToPush()
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Error al activar notificaciones')
    }
    setShowBanner(false)
  }

  if (!showBanner && !error) return null

  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {showBanner && (
        <div className="bg-zinc-900/60 border border-pink-500/20 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-zinc-300 text-sm">
              Activa las notificaciones para recibir alertas de nuevas citas
            </p>
          </div>
          <button
            onClick={handleEnable}
            className="bg-pink-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors whitespace-nowrap"
          >
            Activar
          </button>
        </div>
      )}
    </>
  )
}
