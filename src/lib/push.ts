import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

interface PushPayload {
  title: string
  body: string
}

export interface PushResult {
  sent: number
  failed: number
  total: number
  error?: string
}

export async function sendPushToAdmin(payload: PushPayload): Promise<PushResult> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification')
    return { sent: 0, failed: 0, total: 0, error: 'VAPID keys not configured' }
  }

  const supabase = createServiceClient()

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error) {
    console.error('Failed to fetch push subscriptions:', error)
    return { sent: 0, failed: 0, total: 0, error: 'Failed to fetch subscriptions from database' }
  }

  if (!subscriptions?.length) {
    console.log('No push subscriptions found, skipping notification')
    return { sent: 0, failed: 0, total: 0, error: 'No push subscriptions found in database' }
  }

  console.log(`Sending push notification to ${subscriptions.length} subscription(s)`)

  const results = await Promise.allSettled(
    subscriptions.map(async (sub: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          console.log('Removed expired push subscription:', sub.endpoint)
        } else {
          throw err
        }
      }
    })
  )

  const failures = results.filter((r) => r.status === 'rejected')
  const successes = results.filter((r) => r.status === 'fulfilled')
  if (successes.length) {
    console.log(`Push notification sent successfully to ${successes.length} subscription(s)`)
  }
  if (failures.length) {
    console.error(`Push failed for ${failures.length}/${subscriptions.length} subscriptions`)
  }

  return { sent: successes.length, failed: failures.length, total: subscriptions.length }
}
