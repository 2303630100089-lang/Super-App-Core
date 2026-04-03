'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import { Smartphone, RefreshCw, CheckCircle2, Clock, QrCode } from 'lucide-react'
import axios from 'axios'

const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api'

type QRStatus = 'idle' | 'loading' | 'pending' | 'scanned' | 'success' | 'expired' | 'error'

export default function QRLoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [qrImage, setQrImage] = useState<string | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [status, setStatus] = useState<QRStatus>('idle')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(300)
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null)

  const clearPoll = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval)
      setPollInterval(null)
    }
  }, [pollInterval])

  const generateQR = useCallback(async () => {
    setStatus('loading')
    setQrImage(null)
    setQrToken(null)
    clearPoll()

    try {
      const { data } = await axios.post(`${AUTH_API}/auth/qr-login/generate`)
      setQrImage(data.qrImage)
      setQrToken(data.qrToken)
      setExpiresAt(Date.now() + data.expiresIn * 1000)
      setTimeLeft(data.expiresIn)
      setStatus('pending')
    } catch {
      setStatus('error')
    }
  }, [clearPoll])

  // Start polling once we have a QR token
  useEffect(() => {
    if (status !== 'pending' || !qrToken) return

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${AUTH_API}/auth/qr-login/status/${qrToken}`)

        if (data.status === 'pending') {
          return // Keep waiting
        }

        if (data.status === 'success') {
          clearInterval(interval)
          setStatus('success')
          // Log the user in using the returned token
          setAuth({ id: data.userId }, data.token)
          router.replace('/')
        }
      } catch (err: any) {
        if (err?.response?.status === 410) {
          clearInterval(interval)
          setStatus('expired')
        } else if (err?.response?.status === 200 && err?.response?.data?.status === 'scanned') {
          setStatus('scanned')
        }
      }
    }, 2000) // Poll every 2 seconds

    setPollInterval(interval)
    return () => clearInterval(interval)
  }, [status, qrToken, router])

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || status !== 'pending') return
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0) {
        clearInterval(timer)
        clearPoll()
        setStatus('expired')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAt, status, clearPoll])

  // Auto-generate QR on mount
  useEffect(() => {
    generateQR()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <QrCode size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black mb-1">Scan to Log In</h1>
          <p className="text-sm text-[var(--syn-comment)]">
            Open SuperApp on your phone and scan this QR code
          </p>
        </div>

        {/* QR Card */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-gray-200/20 dark:border-gray-800/20 p-8 shadow-xl text-center space-y-6">

          {/* QR Image */}
          <div className="relative inline-block">
            {status === 'loading' && (
              <div className="w-56 h-56 flex items-center justify-center bg-[var(--bg-elevated)] rounded-2xl mx-auto animate-pulse">
                <RefreshCw size={32} className="text-[var(--syn-comment)] animate-spin" />
              </div>
            )}

            {(status === 'pending' || status === 'scanned') && qrImage && (
              <div className="relative">
                <img
                  src={qrImage}
                  alt="QR Login Code"
                  className="w-56 h-56 rounded-2xl mx-auto border-4 border-white shadow-md"
                />
                {status === 'scanned' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
                    <div className="text-center space-y-2">
                      <Smartphone size={40} className="text-blue-500 mx-auto animate-bounce" />
                      <p className="text-sm font-bold text-blue-600">Phone scanned!</p>
                      <p className="text-xs text-gray-500">Confirm on your phone</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {status === 'success' && (
              <div className="w-56 h-56 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-2xl mx-auto border-4 border-green-300">
                <CheckCircle2 size={56} className="text-green-500 animate-bounce" />
                <p className="font-bold text-green-600 mt-2">Logging in…</p>
              </div>
            )}

            {(status === 'expired' || status === 'error') && (
              <div className="w-56 h-56 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-2xl mx-auto border-4 border-red-200">
                <Clock size={40} className="text-red-400 mb-2" />
                <p className="font-bold text-red-500 text-sm">
                  {status === 'expired' ? 'QR Expired' : 'Failed to generate'}
                </p>
                <button
                  onClick={generateQR}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Refresh QR
                </button>
              </div>
            )}
          </div>

          {/* Timer */}
          {status === 'pending' && (
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--syn-comment)]">
              <Clock size={14} />
              <span>Expires in <strong className={timeLeft < 30 ? 'text-red-500' : 'text-[var(--syn-function)]'}>{formatTime(timeLeft)}</strong></span>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-4 text-left space-y-3 text-sm">
            <p className="font-bold text-xs uppercase tracking-widest text-[var(--syn-comment)]">How it works</p>
            <div className="space-y-2">
              {[
                { num: '1', text: 'Open SuperApp on your phone' },
                { num: '2', text: 'Go to Settings → QR Login' },
                { num: '3', text: 'Scan this QR code' },
                { num: '4', text: 'Confirm on your phone' },
              ].map(step => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 text-xs font-black flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <p className="text-[var(--syn-comment)]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center text-sm text-[var(--syn-comment)] space-y-2">
          <p>
            Prefer email?{' '}
            <Link href="/login" className="text-[var(--syn-function)] font-bold hover:underline">
              Log in with password
            </Link>
          </p>
          <p>
            No account?{' '}
            <Link href="/register" className="text-[var(--syn-function)] font-bold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
