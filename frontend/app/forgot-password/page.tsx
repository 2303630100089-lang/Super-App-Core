'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/services/authApi'
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await resetPassword(email)
      setMessage('Password reset link sent! Please check your email.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-80px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-[-60px] h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.10),transparent_50%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.12),transparent_48%)]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/80 p-7 shadow-[0_20px_80px_-35px_rgba(139,92,246,0.45)] backdrop-blur-xl sm:p-8">
        {/* Back link */}
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-violet-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Login
        </Link>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl shadow-violet-900/40">
            <Mail size={28} className="text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-7 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">Account Recovery</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email and we'll send you a secure reset link.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-300">{message}</p>
          </div>
        )}

        {/* Form */}
        {!message && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-600/80 bg-slate-800/80 px-3.5 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-violet-400/80 focus:ring-2 focus:ring-violet-400/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-slate-500">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
