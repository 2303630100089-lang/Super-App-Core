'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { register, signInWithOAuth } from '@/services/authApi'
import useAuthStore from '@/store/useAuthStore'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap, Mail, Lock, User } from 'lucide-react'
import clsx from 'clsx'

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (pw.length >= 12) score++
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-400' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' }
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-400' }
  return { score, label: 'Very Strong', color: 'bg-emerald-500' }
}

export default function RegisterPage() {
  const { isReady } = useAuth(false)
  const setAuth = useAuthStore(state => state.setAuth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const strength = useMemo(() => getPasswordStrength(password), [password])

  if (!isReady) return null

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(email, password)
      setAuth({ id: data.userId, email, name: name.trim() || undefined }, data.token)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-80px] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-[-60px] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_50%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_48%)]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/80 p-7 shadow-[0_20px_80px_-35px_rgba(16,185,129,0.45)] backdrop-blur-xl sm:p-8">
        {/* Logo */}
        <div className="mb-7">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-900/40">
              <Zap size={28} className="text-white" />
            </div>
          </div>
          <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">Create Account</p>
          <h1 className="text-center text-3xl font-black tracking-tight text-white">Join SuperApp</h1>
          <p className="mt-2 text-center text-sm text-slate-400">Start your all-in-one digital journey in seconds.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-sm font-medium text-red-200">
            <span className="mt-0.5 shrink-0 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your display name"
                className="w-full rounded-xl border border-slate-600/80 bg-slate-800/80 pl-10 pr-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-600/80 bg-slate-800/80 pl-10 pr-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a strong password"
                className="w-full rounded-xl border border-slate-600/80 bg-slate-800/80 pl-10 pr-11 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400/80 focus:ring-2 focus:ring-emerald-400/20"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={clsx(
                        'h-1 flex-1 rounded-full transition-all duration-300',
                        i <= strength.score ? strength.color : 'bg-slate-700'
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Strength: <span className={clsx('font-bold', strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-amber-400' : strength.score <= 3 ? 'text-yellow-400' : 'text-emerald-400')}>{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-7 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/80" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-900 px-3 text-slate-400">Or sign up with</span>
          </div>
        </div>

        {/* OAuth */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => signInWithOAuth('google')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/80 active:scale-[0.98]"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
            <span>Google</span>
          </button>
          <button
            onClick={() => signInWithOAuth('github')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/80 active:scale-[0.98]"
          >
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </button>
        </div>

        <p className="mt-7 text-center text-sm font-medium text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-emerald-300 transition hover:text-emerald-200 hover:underline">
            Sign in here
          </Link>
        </p>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-600">
          By creating an account, you agree to our{' '}
          <span className="font-semibold text-slate-500">Terms of Service</span> and{' '}
          <span className="font-semibold text-slate-500">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
