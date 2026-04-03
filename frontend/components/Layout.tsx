'use client'

import { useAuth } from '@/hooks/useAuth'
import useAuthStore from '@/store/useAuthStore'
import { 
  Home, MessageCircle, Compass, Grid, User, LogOut, 
  LayoutDashboard, Briefcase, Code2, Rss, Utensils, 
  ShoppingBag, Wallet, ChevronRight, ShieldCheck, 
  Truck, Store, Info, Moon, Sun, Zap
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useState, useEffect } from 'react'
import OfflineBanner from '@/components/OfflineBanner'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, isReady } = useAuth()
  const { appMode, setAppMode, businessEnabled, user } = useAuthStore()
  const pathname = usePathname()
  const [showModeInfo, setShowModeInfo] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  useEffect(() => {
    if (!businessEnabled && appMode === 'business') {
      setAppMode('user')
    }
  }, [businessEnabled, appMode, setAppMode])

  if (!isReady) return null
  if (!isAuthenticated) return <>{children}</>

  const profileHref = user?.id ? `/u/${encodeURIComponent(user.id)}` : '/'

  // Color-coded nav items — each icon/label has its own unique hue like syntax highlighting
  const navItems = {
    user: [
      { label: 'Home', icon: Home, href: '/', color: 'text-[var(--syn-keyword)]', bg: 'bg-purple-500/10' },
      { label: 'Feed', icon: Rss, href: '/feed', color: 'text-[var(--syn-variable)]', bg: 'bg-orange-500/10' },
      { label: 'Messages', icon: MessageCircle, href: '/chat', color: 'text-[var(--syn-function)]', bg: 'bg-blue-500/10' },
      { label: 'Apps', icon: Grid, href: '/apps', color: 'text-[var(--syn-type)]', bg: 'bg-cyan-500/10' },
      { label: 'Profile', icon: User, href: profileHref, color: 'text-[var(--syn-comment)]', bg: 'bg-gray-500/10' },
    ],
    business: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/business-dashboard', color: 'text-[var(--syn-string)]', bg: 'bg-emerald-500/10' },
      { label: 'Listings', icon: Store, href: '/marketplace/manage', color: 'text-[var(--syn-variable)]', bg: 'bg-orange-500/10' },
      { label: 'Ride Jobs', icon: Truck, href: '/rides/jobs', color: 'text-[var(--syn-function)]', bg: 'bg-blue-500/10' },
      { label: 'Analytics', icon: ShieldCheck, href: '/business/analytics', color: 'text-[var(--syn-keyword)]', bg: 'bg-purple-500/10' },
      { label: 'Profile', icon: User, href: profileHref, color: 'text-[var(--syn-comment)]', bg: 'bg-gray-500/10' },
    ]
  }

  const currentNav = navItems[appMode as 'user' | 'business'] || navItems.user

  return (
    <div className="flex h-screen bg-[var(--bg-primary)]">
      {/* ─── Sidebar (Desktop) ─── */}
      <aside className="hidden md:flex flex-col w-72 bg-[var(--bg-card)] border-r border-gray-200/50 dark:border-gray-800/50">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tighter shimmer-text">SUPERAPP</h1>
            <p className="text-[9px] font-bold text-[var(--syn-comment)] uppercase tracking-[0.2em]">v2.0</p>
          </div>
        </div>

        {/* Mode Switcher (show only when business is enabled) */}
        {businessEnabled && (
          <div className="px-4 mb-4">
            <div className="bg-[var(--bg-elevated)] p-1.5 rounded-2xl flex gap-1 border border-gray-200/20 dark:border-gray-700/30 shadow-inner">
              {(['user', 'business'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAppMode(mode)}
                  className={clsx(
                    "flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-300",
                    appMode === mode
                      ? mode === 'user'
                        ? "bg-gradient-to-r from-[var(--syn-keyword)] to-[var(--syn-function)] text-white shadow-md shadow-purple-500/20"
                        : "bg-gradient-to-r from-[var(--syn-string)] to-[var(--syn-type)] text-white shadow-md shadow-emerald-500/20"
                      : "text-[var(--syn-comment)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {mode === 'user' ? '👤 Personal' : '💼 Business'}
                </button>
              ))}
            </div>
            <button
              onMouseEnter={() => setShowModeInfo(true)}
              onMouseLeave={() => setShowModeInfo(false)}
              className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--syn-comment)] hover:text-[var(--syn-function)] ml-1 transition-colors"
            >
              <Info size={12} />
              What are App Modes?
            </button>

            {showModeInfo && (
              <div className="absolute left-72 top-24 w-72 p-5 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-gray-200/30 dark:border-gray-700/40 z-50 animate-scale-in">
                <h4 className="font-black text-sm mb-3">Switching App Modes</h4>
                <p className="text-xs text-[var(--syn-comment)] leading-relaxed">
                  <span className="text-[var(--syn-keyword)] font-black">PERSONAL:</span> Social life - chat, shop, date, book rides and food.<br /><br />
                  <span className="text-[var(--syn-string)] font-black">BUSINESS:</span> Merchant tools - sell products, manage deliveries, track earnings.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {currentNav.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={clsx(
                "flex items-center justify-between group p-3.5 rounded-2xl transition-all duration-200",
                isActive 
                  ? `${item.bg} ${item.color} shadow-sm` 
                  : "text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              )}>
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "p-1.5 rounded-xl transition-all",
                    isActive && item.bg
                  )}>
                    <item.icon size={20} className={clsx(
                      isActive ? "scale-110" : "group-hover:scale-110 transition-transform"
                    )} />
                  </div>
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="animate-slide-up" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-200/30 dark:border-gray-800/30 space-y-2">
          <button onClick={logout} className="flex items-center gap-3 p-3 w-full text-[var(--syn-constant)] font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </div>
      </main>

      {/* ─── Bottom Nav (Mobile) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-gray-200/30 dark:border-gray-700/30 flex justify-around py-2 pb-safe z-50">
        {currentNav.slice(0, 5).map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={clsx(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all",
              isActive 
                ? `${item.color} ${item.bg}` 
                : "text-[var(--syn-comment)]"
            )}>
              <item.icon size={22} className={clsx(isActive && "scale-110 transition-transform")} />
              <span className="text-[9px] font-black tracking-wider">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <OfflineBanner />
    </div>
  )
}
