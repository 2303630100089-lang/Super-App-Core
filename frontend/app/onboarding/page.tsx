'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions, PermissionType } from '@/hooks/usePermissions'
import useAuthStore from '@/store/useAuthStore'
import { Camera, Mic, MapPin, Bell, Users, CheckCircle2, Zap } from 'lucide-react'
import clsx from 'clsx'

const PERMISSIONS_TO_REQUEST: {
  type: PermissionType | 'storage'
  label: string
  emoji: string
  Icon: React.ElementType
  description: string
  benefit: string
  glowColor: string
  gradientFrom: string
  gradientTo: string
}[] = [
  {
    type: 'camera',
    label: 'Camera',
    emoji: '📷',
    Icon: Camera,
    description: 'Take snaps, join video calls, and update your profile photo.',
    benefit: 'Used in Snaps & Calls',
    glowColor: 'rgba(6,182,212,0.35)',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-600',
  },
  {
    type: 'microphone',
    label: 'Microphone',
    emoji: '🎤',
    Icon: Mic,
    description: 'Send voice notes, make calls, and join live conversations.',
    benefit: 'Used in Calls & Voice Notes',
    glowColor: 'rgba(139,92,246,0.35)',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-700',
  },
  {
    type: 'location',
    label: 'Location',
    emoji: '📍',
    Icon: MapPin,
    description: 'Book rides, order food, and discover local places around you.',
    benefit: 'Used in Rides, Food & Explore',
    glowColor: 'rgba(16,185,129,0.35)',
    gradientFrom: 'from-emerald-400',
    gradientTo: 'to-teal-600',
  },
  {
    type: 'notifications',
    label: 'Notifications',
    emoji: '🔔',
    Icon: Bell,
    description: 'Get instant alerts for messages, orders, and important updates.',
    benefit: 'Stay always in the loop',
    glowColor: 'rgba(245,158,11,0.35)',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
  },
  {
    type: 'contacts',
    label: 'Contacts',
    emoji: '👥',
    Icon: Users,
    description: 'Find and connect with your friends who are already on SuperApp.',
    benefit: 'Find friends instantly',
    glowColor: 'rgba(236,72,153,0.35)',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
  },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [granted, setGranted] = useState<Set<number>>(new Set())
  const { permissions, requestPermission } = usePermissions()
  const { user } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const currentPermission = PERMISSIONS_TO_REQUEST[step]
  const progress = ((step) / PERMISSIONS_TO_REQUEST.length) * 100

  const handleNext = async () => {
    if (step < PERMISSIONS_TO_REQUEST.length - 1) {
      setStep(s => s + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handleRequest = async () => {
    if (currentPermission.type !== 'storage') {
      await requestPermission(currentPermission.type as PermissionType)
    }
    setGranted(prev => new Set([...prev, step]))
    handleNext()
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:5002'}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          permissions,
          onboardingCompleted: true,
        }),
      })
      if (response.ok) {
        router.push('/feed')
      } else {
        console.error('Failed to save settings:', await response.text())
        router.push('/feed')
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      router.push('/feed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-[-80px] h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -right-20 bottom-[-60px] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="relative w-full max-w-sm rounded-3xl border border-slate-700/60 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30">
              <Zap size={32} className="text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-black text-white">Welcome to SuperApp!</h1>
          <p className="mb-7 text-sm text-slate-400">Please log in to continue with the setup.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full rounded-xl bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 py-3.5 font-bold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 active:scale-[0.98]"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const CurrentIcon = currentPermission.Icon

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700"
          style={{ background: currentPermission.glowColor }}
        />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">SUPERAPP SETUP</span>
          </div>
          <p className="text-[11px] text-slate-500">{step + 1} of {PERMISSIONS_TO_REQUEST.length} — almost done!</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-800">
            <div
              className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-500', currentPermission.gradientFrom, currentPermission.gradientTo)}
              style={{ width: `${((step + 1) / PERMISSIONS_TO_REQUEST.length) * 100}%` }}
            />
          </div>

          <div className="p-7 sm:p-8">
            {/* Step dots */}
            <div className="mb-8 flex justify-center gap-2">
              {PERMISSIONS_TO_REQUEST.map((p, i) => (
                <div
                  key={i}
                  className={clsx(
                    'h-2 rounded-full transition-all duration-300',
                    i === step
                      ? `w-6 bg-gradient-to-r ${p.gradientFrom} ${p.gradientTo}`
                      : i < step
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-slate-700'
                  )}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div
                className={clsx(
                  'flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br shadow-2xl transition-all duration-500',
                  currentPermission.gradientFrom,
                  currentPermission.gradientTo
                )}
                style={{ boxShadow: `0 20px 60px -15px ${currentPermission.glowColor}` }}
              >
                <CurrentIcon size={44} className="text-white" strokeWidth={1.5} />
              </div>
            </div>

            {/* Text */}
            <div className="mb-2 text-center">
              <p className={clsx(
                'mb-1 text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r bg-clip-text text-transparent',
                currentPermission.gradientFrom, currentPermission.gradientTo
              )}>
                {currentPermission.benefit}
              </p>
              <h2 className="mb-3 text-2xl font-black text-white">{currentPermission.label} Access</h2>
              <p className="text-sm leading-relaxed text-slate-400">{currentPermission.description}</p>
            </div>

            {/* Already granted badge */}
            {granted.has(step) && (
              <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 size={14} />
                Permission granted
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-800 p-5 sm:p-6 space-y-3">
            <button
              onClick={handleRequest}
              disabled={loading}
              className={clsx(
                'w-full rounded-2xl bg-gradient-to-r py-4 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50',
                currentPermission.gradientFrom,
                currentPermission.gradientTo
              )}
              style={{ boxShadow: `0 8px 30px -8px ${currentPermission.glowColor}` }}
            >
              {loading ? 'Setting up…' : step === PERMISSIONS_TO_REQUEST.length - 1 ? 'Allow & Finish Setup' : 'Allow Access'}
            </button>
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-700/60 py-3.5 text-sm font-semibold text-slate-400 transition hover:border-slate-600 hover:text-slate-200 active:scale-[0.98] disabled:opacity-50"
            >
              {step === PERMISSIONS_TO_REQUEST.length - 1 ? 'Skip & Continue' : 'Maybe Later'}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-5 text-center text-[11px] text-slate-600">
          You can always change permissions later in{' '}
          <span className="font-semibold text-slate-400">Settings → Privacy</span>
        </p>
      </div>
    </div>
  )
}
