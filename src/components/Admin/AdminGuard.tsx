'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      // getSession() reads from cookies and auto-refreshes expired tokens
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/admin/login')
        return
      }

      setIsAuthed(true)
      setIsLoading(false)
    }
    checkAuth()

    // Refresh session every 10 minutes to keep it alive
    const interval = setInterval(() => {
      if (localStorage.getItem('rememberSession') !== 'false') {
        supabase.auth.refreshSession()
      }
    }, 10 * 60 * 1000)

    // Refresh when the app comes back to foreground (iOS PWA, tab switch, etc.)
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        if (localStorage.getItem('rememberSession') !== 'false') {
          supabase.auth.refreshSession()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/admin/login')
      }
      if (event === 'TOKEN_REFRESHED') {
        setIsAuthed(true)
      }
    })

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthed) return null

  return <>{children}</>
}
