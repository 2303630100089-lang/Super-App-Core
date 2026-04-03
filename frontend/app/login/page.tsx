'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { login, signInWithOAuth } from '@/services/authApi'
import useAuthStore from '@/store/useAuthStore'

import api from '@/services/api'

export default function LoginPage() {
  const { isReady } = useAuth(false)
  const setAuth = useAuthStore(state => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (!isReady) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login(email, password)
      // Set initial auth state
      setAuth({ id: data.userId, email }, data.token)
      
      // Fetch full profile to get name/avatar etc.
      try {
          const profileRes = await api.get(`/users/profile/${data.userId}`)
          const profile = profileRes.data.data; // user-service returns { status, data: user }
          if (profile) {
              setAuth({ 
                  id: data.userId, 
                  email: profile.email || email,
                  name: profile.name,
                  avatar: profile.avatar
              }, data.token)
          }
      } catch (profileErr) {
          console.error("Could not fetch profile", profileErr)
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-80px] h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-[-60px] h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.12),transparent_48%)]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/80 p-7 shadow-[0_20px_80px_-35px_rgba(56,189,248,0.45)] backdrop-blur-xl sm:p-8">
        <div className="mb-7">
          <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/90">Welcome Back</p>
          <h1 className="text-center text-3xl font-black tracking-tight text-white">Super App Login</h1>
          <p className="mt-2 text-center text-sm text-slate-400">Access your unified dashboard, chats, rides and more.</p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">Email</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/20"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Password</label>
              <Link href="/forgot-password" title="Password reset" className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/80 focus:ring-2 focus:ring-cyan-400/20"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 py-3 font-bold text-white shadow-lg shadow-cyan-900/40 transition hover:brightness-110 active:scale-[0.98]"
          >
            Login
          </button>
        </form>

        <div className="mt-7">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700/80" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => signInWithOAuth('google')}
              className="flex w-full items-center justify-center rounded-xl border border-slate-600/70 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/80 active:scale-[0.98]"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="mr-2 h-5 w-5" alt="Google" />
              <span>Google</span>
            </button>
            <button
              onClick={() => signInWithOAuth('github')}
              className="flex w-full items-center justify-center rounded-xl border border-slate-600/70 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/80 active:scale-[0.98]"
            >
              <svg className="mr-2 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              GitHub
            </button>
          </div>
        </div>

        <p className="mt-7 text-center text-sm font-medium text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-cyan-300 transition hover:text-cyan-200 hover:underline">
            Sign up for free
          </Link>
        </p>
        <p className="mt-3 text-center text-sm font-medium text-slate-400">
          Or{' '}
          <Link href="/login/qr" className="font-bold text-cyan-300 transition hover:text-cyan-200 hover:underline">
            Scan QR code to log in
          </Link>
        </p>
      </div>
    </div>
  )
}
