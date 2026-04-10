import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const cookieOptions = {
  maxAge: 60 * 60 * 24 * 400, // 400 days (max allowed)
  path: '/',
  sameSite: 'lax' as const,
  secure: true,
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  )
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: create } = require('@supabase/supabase-js')
  return create(url, key)
}
