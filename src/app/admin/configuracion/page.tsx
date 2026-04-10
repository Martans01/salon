'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/Admin/AdminLayout'
import { createClient } from '@/lib/supabase/client'
import type { AdminSettings } from '@/types'

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
  } catch {
    // ignore
  }
  return {}
}

interface PushDiagnostics {
  vapidKey: boolean
  serviceWorker: boolean
  permission: NotificationPermission | 'unsupported'
  subscription: boolean
  dbSubscription: boolean | null
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form values
  const [slotDuration, setSlotDuration] = useState(30)
  const [advanceDays, setAdvanceDays] = useState(14)

  // Push state
  const [pushDiag, setPushDiag] = useState<PushDiagnostics>({
    vapidKey: false,
    serviceWorker: false,
    permission: 'unsupported',
    subscription: false,
    dbSubscription: null,
  })
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerResult, setRegisterResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const registerAndSubscribe = async () => {
    if (!('serviceWorker' in navigator)) return null

    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    } catch {
      return null
    }

    let swReg: ServiceWorkerRegistration
    try {
      swReg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('SW ready timeout')), 10000)),
      ])
    } catch {
      return null
    }

    let sub = await swReg.pushManager.getSubscription()

    if (!sub) {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return null
      try {
        sub = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        })
      } catch {
        return null
      }
    }

    try {
      const toBase64Url = (buf: ArrayBuffer) =>
        btoa(String.fromCharCode(...new Uint8Array(buf)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      const authHeader = await getAuthHeader()
      const res = await fetch('/api/admin/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: p256dh ? toBase64Url(p256dh) : '',
            auth: auth ? toBase64Url(auth) : '',
          },
        }),
      })
      if (res.ok) return sub
    } catch {
      // save failed
    }

    return sub
  }

  const autoSaveSubscription = async (sub: PushSubscription) => {
    try {
      const toBase64Url = (buf: ArrayBuffer) =>
        btoa(String.fromCharCode(...new Uint8Array(buf)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      const authHeader = await getAuthHeader()
      const res = await fetch('/api/admin/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: p256dh ? toBase64Url(p256dh) : '',
            auth: auth ? toBase64Url(auth) : '',
          },
        }),
      })
      if (res.ok) {
        setPushDiag(prev => ({ ...prev, dbSubscription: true }))
      }
    } catch {
      // auto-save failed silently
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
          setSlotDuration(data.slot_duration_minutes)
          setAdvanceDays(data.advance_booking_days)
        }
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()

    async function checkPush() {
      const diag: PushDiagnostics = {
        vapidKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        serviceWorker: false,
        permission: 'unsupported',
        subscription: false,
        dbSubscription: null,
      }

      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        setPushDiag(diag)
        return
      }

      diag.permission = Notification.permission

      // Check for active SW
      if (navigator.serviceWorker.controller) {
        diag.serviceWorker = true
      } else {
        const regs = await navigator.serviceWorker.getRegistrations()
        if (regs.length > 0) {
          diag.serviceWorker = true
        } else {
          // No SW registered, register one
          try {
            await navigator.serviceWorker.register('/sw.js', { scope: '/' })
            diag.serviceWorker = true
          } catch {
            // registration failed
          }
        }
      }

      // Get subscription if SW is ready
      try {
        const swReg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ])

        const sub = await swReg.pushManager.getSubscription()
        if (sub) {
          diag.subscription = true

          // Check if subscription is in DB
          try {
            const authHeader = await getAuthHeader()
            const res = await fetch('/api/admin/push-subscription/check', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeader },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            })
            if (res.ok) {
              const data = await res.json()
              diag.dbSubscription = !!data.exists
              // Auto-save if not in DB
              if (!data.exists) {
                setPushDiag({ ...diag })
                await autoSaveSubscription(sub)
                return
              }
            }
          } catch {
            // check failed
          }
        } else if (diag.permission === 'granted' && diag.vapidKey) {
          // Permission granted but no subscription — create one
          try {
            const newSub = await swReg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            })
            diag.subscription = true
            setPushDiag({ ...diag })
            await autoSaveSubscription(newSub)
            return
          } catch {
            // subscribe failed
          }
        }
      } catch {
        // SW ready timeout
      }

      setPushDiag(diag)
    }
    checkPush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_duration_minutes: slotDuration,
          advance_booking_days: advanceDays,
        }),
      })

      if (!res.ok) throw new Error()

      const data = await res.json()
      setSettings(data)
      setMessage({ type: 'success', text: 'Configuración guardada' })
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegisterSW = async () => {
    setIsRegistering(true)
    setRegisterResult(null)
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        setPushDiag(prev => ({ ...prev, permission: perm }))
        if (perm !== 'granted') {
          setRegisterResult({ type: 'error', text: 'Permiso denegado' })
          return
        }
      }
      const sub = await registerAndSubscribe()
      if (sub) {
        setPushDiag(prev => ({
          ...prev,
          serviceWorker: true,
          permission: 'granted',
          subscription: true,
          dbSubscription: true,
        }))
        setRegisterResult({ type: 'success', text: 'Notificaciones activadas correctamente' })
      } else {
        setRegisterResult({ type: 'error', text: 'No se pudo activar. Verifica los permisos del navegador.' })
      }
    } catch {
      setRegisterResult({ type: 'error', text: 'Error al activar notificaciones' })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleTestPush = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const authHeader = await getAuthHeader()
      const res = await fetch('/api/admin/push-test', { method: 'POST', headers: { ...authHeader } })
      const data = await res.json()
      if (!res.ok) {
        setTestResult({ type: 'error', text: data.error || 'Error al enviar' })
      } else if (data.error) {
        setTestResult({ type: 'error', text: data.error })
      } else if (data.sent > 0) {
        setTestResult({ type: 'success', text: `Enviada a ${data.sent} dispositivo(s)` })
      } else {
        setTestResult({ type: 'error', text: `0 enviadas, ${data.failed} fallidas de ${data.total}` })
      }
    } catch {
      setTestResult({ type: 'error', text: 'Error de conexión' })
    } finally {
      setIsTesting(false)
    }
  }

  const hasChanges = settings && (
    slotDuration !== settings.slot_duration_minutes ||
    advanceDays !== settings.advance_booking_days
  )

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Ajustes generales y notificaciones</p>
        </div>

        {isLoading ? (
          <div className="shimmer-skeleton rounded-xl h-60" />
        ) : (
          <div className="max-w-md space-y-6">
            {/* Slot duration */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div>
                <h3 className="text-white font-semibold">Duración de cada cita</h3>
                <p className="text-zinc-500 text-sm">Tiempo en minutos para cada slot de reserva</p>
              </div>
              <div className="flex gap-2">
                {[30, 45, 60].map(min => (
                  <button
                    key={min}
                    onClick={() => setSlotDuration(min)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      slotDuration === min
                        ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                        : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {/* Advance booking days */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div>
                <h3 className="text-white font-semibold">Días de anticipación</h3>
                <p className="text-zinc-500 text-sm">Cuántos días en el futuro pueden los clientes reservar</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={7}
                  max={30}
                  value={advanceDays}
                  onChange={(e) => setAdvanceDays(Number(e.target.value))}
                  className="flex-1 accent-pink-500"
                />
                <span className="text-white font-medium w-16 text-right">{advanceDays} días</span>
              </div>
            </div>

            {/* Save */}
            {message && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`w-full py-3 rounded-lg bg-pink-500 text-white font-bold hover:bg-pink-600 transition-all disabled:opacity-50 ${hasChanges ? 'glow-button' : ''}`}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            {/* Push notifications */}
            <div className="glass-card rounded-xl p-5 space-y-4">
              <h3 className="text-white font-semibold">Notificaciones</h3>

              {/* Status indicator */}
              {(() => {
                const { vapidKey, serviceWorker, permission, subscription, dbSubscription } = pushDiag
                const allReady = vapidKey && serviceWorker && permission === 'granted' && subscription && dbSubscription === true
                const isPartial = permission === 'granted' && (!subscription || dbSubscription === false)
                const isVerifying = dbSubscription === null && permission !== 'unsupported'

                if (isVerifying) {
                  return <p className="text-zinc-500 text-sm">Verificando...</p>
                }

                if (allReady) {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                      <span className="text-green-400 text-sm font-medium">Notificaciones activas en este dispositivo</span>
                    </div>
                  )
                }

                if (isPartial) {
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]" />
                        <span className="text-yellow-400 text-sm font-medium">Configuración incompleta</span>
                      </div>
                      <button
                        onClick={handleRegisterSW}
                        disabled={isRegistering}
                        className="w-full py-2.5 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-all disabled:opacity-50"
                      >
                        {isRegistering ? 'Activando...' : 'Registrar este dispositivo'}
                      </button>
                    </>
                  )
                }

                // Inactive state
                return (
                  <>
                    <p className="text-zinc-400 text-sm">Recibe alertas cuando un cliente reserve una cita.</p>
                    <button
                      onClick={handleRegisterSW}
                      disabled={isRegistering}
                      className="w-full py-2.5 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-all disabled:opacity-50"
                    >
                      {isRegistering ? 'Activando...' : 'Activar notificaciones'}
                    </button>
                  </>
                )
              })()}

              {registerResult && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  registerResult.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {registerResult.text}
                </div>
              )}

              {/* Test push button */}
              <button
                onClick={handleTestPush}
                disabled={isTesting}
                className="w-full py-2.5 rounded-lg bg-white/[0.05] text-zinc-300 text-sm font-medium hover:bg-white/[0.08] hover:text-white transition-all disabled:opacity-50"
              >
                {isTesting ? 'Enviando...' : 'Enviar prueba'}
              </button>

              {testResult && (
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  testResult.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {testResult.text}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
