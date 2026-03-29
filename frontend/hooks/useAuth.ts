import { useEffect, useState } from 'react'
import useAuthStore from '@/store/useAuthStore'
import { useRouter, usePathname } from 'next/navigation'
import api from '@/services/api'

export const useAuth = (requireAuth = true) => {
  const { user, token, setAuth, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for client-side hydration for zustand persist
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady || !token || !user?.id || user?.name) return;
    
    // Fetch profile if name is missing
    const fetchProfile = async () => {
        try {
            const profileRes = await api.get(`/users/profile/${user.id}`).catch(() => null)
            const profile = profileRes?.data?.data;
            
            // If profile fetch fails, use email as fallback name
            const resolvedName = profile?.name || profile?.username || user?.email?.split('@')[0] || 'User';
            if (resolvedName && resolvedName !== 'User') {
                setAuth({ 
                    id: user.id, 
                    email: profile?.email || user?.email,
                    name: resolvedName,
                    avatar: profile?.avatar
                }, token)
            } else if (resolvedName === 'User') {
                // Use minimal user info if profile unavailable
                setAuth({ 
                    id: user.id, 
                    email: user?.email,
                    name: resolvedName,
                    avatar: undefined
                }, token)
            }
        } catch (err) { console.error('Profile fetch failed', err) }
    }
    fetchProfile()
  }, [isReady, token, user?.id, user?.name])

  useEffect(() => {
    if (!isReady) return

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

    if (requireAuth && !token) {
      if (!isAuthRoute) router.push('/login')
    } else if (token && isAuthRoute) {
      router.push('/')
    }
  }, [token, requireAuth, router, pathname, isReady])

  return { user, token, logout, isReady, isAuthenticated: !!token }
}
