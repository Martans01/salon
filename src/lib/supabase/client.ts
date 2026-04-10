import { createBrowserClient } from '@supabase/ssr'

const cookieOptions = {
  maxAge: 60 * 60 * 24 * 400, // 400 days (max allowed)
  path: '/',
  sameSite: 'lax' as const,
  secure: true,
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  return createBrowserClient(url, key, { cookieOptions })
}
