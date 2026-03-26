'use client'

import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import Link from 'next/link'
import { 
  Car, ShoppingBag, Utensils, Zap, Users, 
  Code2, Briefcase, Sparkles, UserPlus, MessageCircle,
  Clock, Package, MapPin, Search, Grid, Wallet, Gamepad2, ChevronRight, Star,
  Bell, Smartphone, Cpu, CloudRain,
  Heart, CalendarDays, ListTodo, Radio, Phone, FileText, ArrowUpRight, TrendingUp
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import MapComponent from '@/components/ui/MapComponent'
import clsx from 'clsx'

export default function HomePage() {
  const { user, isReady } = useAuth()
  const { activities, appMode } = useAuthStore()
  const [randomUsers, setRandomUsers] = useState<any[]>([])
  const [greeting, setGreeting] = useState('Hello')

  // Dynamic greeting
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good Morning')
    else if (h < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')
  }, [])

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile/list').catch(() => ({ data: [] }))
      return data
    },
    enabled: isReady
  })

  useEffect(() => {
    if (allUsers && allUsers.length > 0) {
      const shuffled = [...allUsers].sort(() => 0.5 - Math.random())
      setRandomUsers(shuffled.slice(0, 5))
    } else {
      setRandomUsers([])
    }
  }, [allUsers])

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/notifications/${user?.id}`)
      return data?.filter((n: any) => !n.isRead)?.length || 0
    },
    enabled: isReady && !!user?.id,
    refetchInterval: 15000
  })

  if (!isReady) return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Zap size={28} className="text-white" />
        </div>
        <p className="text-sm font-bold text-[var(--syn-comment)]">Loading your experience...</p>
      </div>
    </div>
  )

  // ─── Syntax-colored quick actions ─────────────────────────────────────────
  const quickApps = [
    { label: 'Chat',     icon: MessageCircle, color: 'from-blue-500 to-indigo-600',    shadow: 'shadow-blue-500/30',    href: '/chat' },
    { label: 'Dating',   icon: Heart,         color: 'from-pink-500 to-rose-600',      shadow: 'shadow-pink-500/30',    href: '/dating' },
    { label: 'Ride',     icon: Car,           color: 'from-amber-500 to-orange-600',   shadow: 'shadow-amber-500/30',   href: '/rides' },
    { label: 'Food',     icon: Utensils,      color: 'from-red-500 to-rose-600',       shadow: 'shadow-red-500/30',     href: '/food' },
    { label: 'Shop',     icon: ShoppingBag,   color: 'from-violet-500 to-purple-600',  shadow: 'shadow-violet-500/30',  href: '/marketplace' },
    { label: 'Calendar', icon: CalendarDays,  color: 'from-teal-500 to-emerald-600',   shadow: 'shadow-teal-500/30',    href: '/calendar' },
    { label: 'Tasks',    icon: ListTodo,      color: 'from-fuchsia-500 to-pink-600',   shadow: 'shadow-fuchsia-500/30', href: '/tasks' },
    { label: 'Jobs',     icon: Briefcase,     color: 'from-emerald-500 to-green-600',  shadow: 'shadow-emerald-500/30', href: '/professional' },
    { label: 'Live',     icon: Radio,         color: 'from-red-600 to-orange-600',     shadow: 'shadow-red-500/30',     href: '/live' },
    { label: 'Calls',    icon: Phone,         color: 'from-green-500 to-emerald-600',  shadow: 'shadow-green-500/30',   href: '/calls' },
    { label: 'Coding',   icon: Code2,         color: 'from-cyan-500 to-blue-600',      shadow: 'shadow-cyan-500/30',    href: '/coding' },
    { label: 'More',     icon: Grid,          color: 'from-gray-500 to-slate-600',     shadow: 'shadow-gray-500/30',    href: '/apps' },
  ]

  // ─── MOBILE VIEW ──────────────────────────────────────────────────────────
  const MobileView = () => (
    <div className="md:hidden flex flex-col bg-[var(--bg-primary)] min-h-screen pb-32">
      {/* Header */}
      <header className="p-5 pb-3 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-[var(--syn-type)] uppercase tracking-[0.2em] mb-1">{greeting}</p>
            <h1 className="text-2xl font-black tracking-tight">{user?.name?.split(' ')[0] || 'User'} 👋</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/notifications" prefetch={false} className="relative p-2.5 bg-[var(--bg-card)] rounded-2xl shadow-sm border border-gray-200/30 dark:border-gray-800/30 interactive">
              <Bell size={20} className="text-[var(--syn-variable)]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--syn-constant)] rounded-full border-2 border-[var(--bg-primary)] text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/settings" prefetch={false}>
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-500/20 interactive">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
          </div>
        </div>
        <form action={(formData) => {
          const query = formData.get('search')
          if (query) window.location.href = `/explore?q=${query}`
        }} className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--syn-comment)] group-focus-within:text-[var(--syn-function)] transition-colors" size={18} />
          <input 
            name="search"
            type="text" 
            placeholder="Search in Super App..."
            className="w-full bg-[var(--bg-card)] border border-gray-200/30 dark:border-gray-800/30 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm outline-none font-medium text-sm focus:ring-2 ring-[var(--syn-function)]/20 focus:border-[var(--syn-function)]/30 transition-all"
          />
        </form>
      </header>

      {/* Quick Icon Grid */}
      <section className="px-5 py-3">
        <div className="grid grid-cols-4 gap-3">
          {quickApps.map(item => (
            <Link key={item.label} href={item.href} prefetch={false} className="flex flex-col items-center gap-2 group">
              <div className={`bg-gradient-to-br ${item.color} p-3 rounded-2xl text-white shadow-lg ${item.shadow} group-active:scale-90 transition-all duration-200`}>
                <item.icon size={22} />
              </div>
              <span className="text-[9px] font-black text-[var(--syn-comment)] uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Ride Nearby Scroller */}
      <section className="px-5 py-3 space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-black text-sm uppercase tracking-widest">Ride Nearby</h2>
          <Link href="/rides" prefetch={false} className="text-[10px] font-black text-[var(--syn-string)] bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-xl flex items-center gap-1 interactive">
            <Clock size={10}/>2 min
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[
            { name: 'Tesla Model S', img: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&q=80', price: '$12' },
            { name: 'BMW i8', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&q=80', price: '$18' }
          ].map((car, i) => (
            <Link href="/rides" prefetch={false} key={i} className="min-w-[220px] bg-[var(--bg-card)] rounded-2xl p-2 shadow-sm border border-gray-200/30 dark:border-gray-800/30 flex items-center gap-3 card-hover">
              <img src={car.img} className="w-18 h-18 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-xs truncate">{car.name}</p>
                <p className="text-[10px] font-bold text-[var(--syn-function)]">{car.price} • Now</p>
              </div>
              <div className="mr-1 p-1.5 bg-[var(--bg-elevated)] rounded-xl">
                <ChevronRight size={14} className="text-[var(--syn-comment)]"/>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Order Food Scroller */}
      <section className="px-5 py-3 space-y-3">
        <h2 className="font-black text-sm uppercase tracking-widest px-1">Order Food</h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[
            { name: 'Pizza Hut', time: '20 mins', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
            { name: 'Burger Hub', time: '15 mins', img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80' }
          ].map((food, i) => (
            <Link href="/food" prefetch={false} key={i} className="min-w-[180px] bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-gray-200/30 dark:border-gray-800/30 card-hover">
              <img src={food.img} className="w-full h-24 object-cover" />
              <div className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-black text-[11px]">{food.name}</p>
                  <p className="text-[9px] font-bold text-[var(--syn-comment)]">{food.time}</p>
                </div>
                <div className="flex items-center gap-0.5 text-[var(--syn-variable)]">
                  <Star size={10} fill="currentColor"/>
                  <span className="text-[10px] font-black">4.5</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Mini Apps */}
      <section className="px-5 py-3 space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="font-black text-sm uppercase tracking-widest">Trending</h2>
          <ChevronRight size={18} className="text-[var(--syn-comment)]" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Flashcards', icon: Smartphone, bg: 'bg-red-500/10', text: 'text-[var(--syn-constant)]', href: '/notes' },
            { name: 'Weather', icon: CloudRain, bg: 'bg-blue-500/10', text: 'text-[var(--syn-function)]', href: '/apps/weather' },
            { name: 'Crypto', icon: Cpu, bg: 'bg-amber-500/10', text: 'text-[var(--syn-variable)]', href: '/wallet' },
          ].map(app => (
            <Link href={app.href} key={app.name} className="bg-[var(--bg-card)] p-4 rounded-2xl border border-gray-200/30 dark:border-gray-800/30 shadow-sm flex flex-col items-center gap-2 card-hover">
              <div className={`${app.bg} p-2.5 rounded-xl ${app.text}`}><app.icon size={20}/></div>
              <span className="text-[9px] font-black text-[var(--syn-comment)] uppercase tracking-wider">{app.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )

  // ─── DESKTOP VIEW ─────────────────────────────────────────────────────────
  const DesktopView = () => (
    <div className="hidden md:block p-8 space-y-8 max-w-6xl mx-auto pb-24">
      {/* Welcome Header */}
      <section className="flex justify-between items-center animate-slide-up">
        <div>
          <p className="text-xs font-black text-[var(--syn-type)] uppercase tracking-[0.2em] mb-1">{greeting}</p>
          <h1 className="text-3xl font-black tracking-tight">Hey, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
          <p className="text-[var(--syn-comment)] font-medium mt-1">Your world, unified.</p>
        </div>
        <div className="flex flex-row items-center gap-4">
          <Link href="/notifications" className="relative p-3 bg-[var(--bg-card)] rounded-2xl shadow-sm border border-gray-200/30 dark:border-gray-800/30 interactive">
            <Bell size={22} className="text-[var(--syn-variable)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--syn-constant)] rounded-full border-2 border-[var(--bg-primary)] text-[10px] font-black text-white flex items-center justify-center shadow-sm animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/settings">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] flex items-center justify-center text-white font-black shadow-xl shadow-purple-500/20 text-2xl interactive">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </div>
      </section>

      {/* Active Activities */}
      {activities.length > 0 && (
        <section className="space-y-4 animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-[var(--syn-function)]" size={20} />
            <h2 className="text-sm font-black uppercase tracking-widest">Active Orders & Rides</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {activities.map((act) => (
              <Link href={`/${act.type === 'ride' ? 'rides' : act.type === 'food' ? 'food' : 'marketplace'}`} key={act.id} className="min-w-[280px] bg-[var(--bg-card)] p-4 rounded-2xl border-2 border-[var(--syn-function)]/10 shadow-sm flex items-center gap-4 card-hover">
                <div className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
                  act.type === 'ride' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 
                  act.type === 'food' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 
                  'bg-gradient-to-br from-blue-500 to-indigo-600'
                )}>
                  {act.type === 'ride' ? <Car size={22}/> : act.type === 'food' ? <Utensils size={22}/> : <Package size={22}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm truncate">{act.title}</p>
                  <p className="text-[10px] font-bold text-[var(--syn-function)] uppercase tracking-widest">{act.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--syn-comment)] font-bold">{act.time}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mini Apps Grid */}
      <section className="animate-slide-up" style={{animationDelay: '0.15s'}}>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="text-[var(--syn-variable)]" size={20} />
          <h2 className="text-sm font-black uppercase tracking-widest">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {quickApps.map((app) => (
            <Link key={app.label} href={app.href} className="flex flex-col items-center gap-3 group">
              <div className={`bg-gradient-to-br ${app.color} p-4 rounded-2xl text-white shadow-lg ${app.shadow} group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                <app.icon size={24} />
              </div>
              <span className="text-xs font-bold text-[var(--syn-comment)] group-hover:text-[var(--text-primary)] text-center transition-colors">{app.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-2 space-y-4 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">People you may know</h2>
            <Link href="/chat?search=true" className="text-[var(--syn-function)] text-xs font-bold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={12}/>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {randomUsers.map((u) => (
              <div key={u.id} className="bg-[var(--bg-card)] p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-200/30 dark:border-gray-800/30 card-hover">
                <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{u.name}</p>
                  <p className="text-[10px] text-[var(--syn-comment)]">Recently joined</p>
                </div>
                <Link href={`/chat/${u.id}`} className="bg-[var(--syn-function)]/10 text-[var(--syn-function)] p-2.5 rounded-xl hover:bg-[var(--syn-function)] hover:text-white transition-all interactive">
                  <MessageCircle size={18} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 animate-slide-up" style={{animationDelay: '0.25s'}}>
          <h2 className="text-lg font-black">Around You</h2>
          <Link href="/explore" className="block bg-[var(--bg-card)] h-48 rounded-2xl overflow-hidden border border-gray-200/30 dark:border-gray-800/30 shadow-sm relative group cursor-pointer card-hover">
            <MapComponent className="h-full w-full grayscale dark:invert group-hover:grayscale-0 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 glass p-2 rounded-xl text-[10px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">Open Explore View</div>
          </Link>
          
          {appMode === 'user' && (
            <div className="bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] p-6 rounded-2xl text-white shadow-xl shadow-purple-500/20 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="font-black mb-2">⚡ Switch to Business</h3>
                <p className="text-xs opacity-80 mb-4">Start selling products or offering services.</p>
                <Link href="/settings" className="block w-full text-center bg-white text-[var(--syn-keyword)] py-3 rounded-xl text-sm font-black interactive shadow-lg">Get Started</Link>
              </div>
              <Briefcase size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
            </div>
          )}
        </section>
      </div>
    </div>
  )

  return (
    <>
      <MobileView />
      <DesktopView />
    </>
  )
}
