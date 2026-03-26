'use client'

import Link from 'next/link'
import useAuthStore from '@/store/useAuthStore'
import { useState, useMemo } from 'react'
import { 
  ShoppingBag, Utensils, Wallet, Code2, Briefcase, Car, ShieldCheck,
  Heart, MessageSquare, Zap, Smartphone, MapPin, Search,
  LayoutDashboard, Store, Truck, TrendingUp, Package, Settings,
  BarChart3, Users, Receipt, ArrowUpRight, Grid, Sparkles,
  Radio, Phone, CalendarDays, ListTodo, FileText, Gamepad2, Hotel, CloudRain
} from 'lucide-react'
import clsx from 'clsx'

interface AppItem {
  name: string
  icon: any
  gradient: string
  shadow: string
  href: string
  desc: string
  category: string
}

const allApps: AppItem[] = [
  // Social & Communication
  { name: 'Dating',        icon: Heart,        gradient: 'from-pink-500 to-rose-600',     shadow: 'shadow-pink-500/20',    href: '/dating',              desc: 'Swipe & match',       category: 'Social' },
  { name: 'Blind Date',    icon: MessageSquare, gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20',  href: '/random-chat',         desc: 'Anonymous chat',      category: 'Social' },
  { name: 'Stories',        icon: Smartphone,   gradient: 'from-amber-400 to-orange-500',  shadow: 'shadow-amber-500/20',   href: '/status',              desc: 'Share your day',      category: 'Social' },
  { name: 'Snaps',          icon: Zap,          gradient: 'from-yellow-500 to-amber-600',  shadow: 'shadow-yellow-500/20',  href: '/snaps',               desc: 'Disappearing media',  category: 'Social' },
  { name: 'Live',           icon: Radio,        gradient: 'from-red-500 to-rose-600',      shadow: 'shadow-red-500/20',     href: '/live',                desc: 'Go live now',         category: 'Social' },
  { name: 'Calls',          icon: Phone,        gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20',   href: '/calls',               desc: 'Voice & video',       category: 'Social' },

  // Rides & Travel
  { name: 'Ride Hailing',  icon: Car,           gradient: 'from-blue-500 to-indigo-600',   shadow: 'shadow-blue-500/20',    href: '/rides',               desc: 'Car, Auto, Bike',     category: 'Travel' },
  { name: 'Hotel Booking', icon: Hotel,         gradient: 'from-teal-500 to-cyan-600',     shadow: 'shadow-teal-500/20',    href: '/services/hotel',      desc: 'Book rooms',          category: 'Travel' },
  { name: 'Table Booking', icon: Utensils,      gradient: 'from-orange-500 to-red-500',    shadow: 'shadow-orange-500/20',  href: '/services/table-booking', desc: 'Reserve a table',  category: 'Travel' },

  // Shopping & Food
  { name: 'Marketplace',   icon: ShoppingBag,   gradient: 'from-indigo-500 to-blue-600',   shadow: 'shadow-indigo-500/20',  href: '/marketplace',         desc: 'Buy & sell',          category: 'Shopping' },
  { name: 'Food Delivery', icon: Utensils,      gradient: 'from-red-500 to-orange-500',    shadow: 'shadow-red-500/20',     href: '/food',                desc: 'Order food',          category: 'Shopping' },

  // Productivity
  { name: 'Calendar',      icon: CalendarDays,  gradient: 'from-teal-500 to-emerald-600',  shadow: 'shadow-teal-500/20',    href: '/calendar',            desc: 'Manage schedule',     category: 'Productivity' },
  { name: 'Tasks',         icon: ListTodo,      gradient: 'from-fuchsia-500 to-pink-600',  shadow: 'shadow-fuchsia-500/20', href: '/tasks',               desc: 'Get things done',     category: 'Productivity' },
  { name: 'Notes',         icon: FileText,      gradient: 'from-yellow-500 to-amber-600',  shadow: 'shadow-yellow-500/20',  href: '/notes',               desc: 'Flashcards & notes',  category: 'Productivity' },
  { name: 'Forms',         icon: FileText,      gradient: 'from-sky-500 to-blue-600',      shadow: 'shadow-sky-500/20',     href: '/forms',               desc: 'Create forms',        category: 'Productivity' },

  // Games
  { name: 'Games',         icon: Gamepad2,      gradient: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20', href: '/apps/games',          desc: 'Play with friends',   category: 'Entertainment' },

  // Professional
  { name: 'Coding Hub',    icon: Code2,         gradient: 'from-cyan-500 to-blue-600',     shadow: 'shadow-cyan-500/20',    href: '/coding',              desc: 'Dev stats & practice', category: 'Professional' },
  { name: 'Professional',  icon: Briefcase,     gradient: 'from-emerald-500 to-teal-600',  shadow: 'shadow-emerald-500/20', href: '/professional',        desc: 'Jobs & network',      category: 'Professional' },

  // Finance
  { name: 'Wallet',        icon: Wallet,        gradient: 'from-blue-500 to-cyan-500',     shadow: 'shadow-blue-500/20',    href: '/wallet',              desc: 'Payments & UPI',      category: 'Finance' },
  { name: 'Local Services', icon: ShieldCheck,  gradient: 'from-gray-600 to-slate-700',    shadow: 'shadow-gray-500/20',    href: '/services',            desc: 'Hire pros',           category: 'Services' },
]

// Business-only apps (visible when business mode is enabled)
const businessApps: AppItem[] = [
  { name: 'Dashboard',     icon: LayoutDashboard, gradient: 'from-emerald-500 to-green-600',  shadow: 'shadow-emerald-500/20', href: '/business-dashboard', desc: 'Overview & analytics', category: 'Business' },
  { name: 'My Products',   icon: Package,         gradient: 'from-blue-500 to-indigo-600',    shadow: 'shadow-blue-500/20',    href: '/marketplace/manage', desc: 'Manage listings',     category: 'Business' },
  { name: 'Ride Jobs',     icon: Truck,           gradient: 'from-amber-500 to-orange-600',   shadow: 'shadow-amber-500/20',   href: '/rides/jobs',          desc: 'Accept rides',        category: 'Business' },
  { name: 'Food Orders',   icon: Receipt,         gradient: 'from-red-500 to-rose-600',       shadow: 'shadow-red-500/20',     href: '/food/orders',         desc: 'Restaurant panel',    category: 'Business' },
  { name: 'Analytics',     icon: BarChart3,       gradient: 'from-violet-500 to-purple-600',  shadow: 'shadow-violet-500/20',  href: '/business/analytics',  desc: 'Revenue tracking',    category: 'Business' },
  { name: 'Customers',     icon: Users,           gradient: 'from-pink-500 to-rose-600',      shadow: 'shadow-pink-500/20',    href: '/business/customers',  desc: 'User management',     category: 'Business' },
  { name: 'Store Settings', icon: Settings,       gradient: 'from-gray-500 to-slate-600',     shadow: 'shadow-gray-500/20',    href: '/business/settings',   desc: 'Configure shop',      category: 'Business' },
  { name: 'Sales',          icon: TrendingUp,     gradient: 'from-teal-500 to-cyan-600',      shadow: 'shadow-teal-500/20',    href: '/business/sales',      desc: 'Revenue reports',     category: 'Business' },
]

export default function AppsPage() {
  const { addActivity, appMode } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  // Merge business apps when in business mode
  const visibleApps = useMemo(() => {
    const apps = appMode === 'business' ? [...businessApps, ...allApps] : allApps
    let filtered = apps
    if (searchQuery.trim()) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (activeCategory !== 'All') {
      filtered = filtered.filter(a => a.category === activeCategory)
    }
    return filtered
  }, [appMode, searchQuery, activeCategory])

  const categories = useMemo(() => {
    const cats = appMode === 'business' 
      ? ['All', 'Business', 'Social', 'Travel', 'Shopping', 'Productivity', 'Entertainment', 'Professional', 'Finance', 'Services']
      : ['All', 'Social', 'Travel', 'Shopping', 'Productivity', 'Entertainment', 'Professional', 'Finance', 'Services']
    return cats
  }, [appMode])

  // Category color mapping (syntax-highlighting style)
  const categoryColors: Record<string, { text: string, bg: string }> = {
    'All':            { text: 'text-[var(--syn-keyword)]',  bg: 'bg-purple-500/10' },
    'Business':       { text: 'text-[var(--syn-string)]',   bg: 'bg-emerald-500/10' },
    'Social':         { text: 'text-[var(--syn-number)]',   bg: 'bg-pink-500/10' },
    'Travel':         { text: 'text-[var(--syn-function)]', bg: 'bg-blue-500/10' },
    'Shopping':       { text: 'text-[var(--syn-variable)]', bg: 'bg-orange-500/10' },
    'Productivity':   { text: 'text-[var(--syn-type)]',     bg: 'bg-cyan-500/10' },
    'Entertainment':  { text: 'text-[var(--syn-string)]',   bg: 'bg-emerald-500/10' },
    'Professional':   { text: 'text-[var(--syn-decorator)]',bg: 'bg-indigo-500/10' },
    'Finance':        { text: 'text-[var(--syn-function)]', bg: 'bg-blue-500/10' },
    'Services':       { text: 'text-[var(--syn-comment)]',  bg: 'bg-gray-500/10' },
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-28 bg-[var(--bg-primary)] min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Grid size={20} className="text-[var(--syn-type)]" />
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {appMode === 'business' ? '💼 Business & Apps' : '🧩 Mini Apps'}
            </h1>
          </div>
          <p className="text-[var(--syn-comment)] font-medium text-sm">
            {appMode === 'business' 
              ? 'Manage your business and explore the ecosystem.'
              : 'Explore the unified ecosystem.'}
          </p>
        </div>
        <div className="relative group max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--syn-comment)] group-focus-within:text-[var(--syn-function)] transition-colors" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mini apps..." 
            className="w-full bg-[var(--bg-card)] border border-gray-200/30 dark:border-gray-800/30 focus:border-[var(--syn-function)]/50 rounded-2xl py-3 pl-12 pr-4 outline-none shadow-sm transition-all focus:ring-2 ring-[var(--syn-function)]/10"
          />
        </div>
      </header>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 animate-slide-up" style={{animationDelay: '0.05s'}}>
        {categories.map(cat => {
          const isActive = activeCategory === cat
          const colors = categoryColors[cat] || { text: 'text-[var(--syn-comment)]', bg: 'bg-gray-500/10' }
          return (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border",
                isActive 
                  ? `${colors.bg} ${colors.text} border-current/20 shadow-sm` 
                  : "border-transparent text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Business Section Banner (only in business mode) */}
      {appMode === 'business' && activeCategory === 'All' && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 rounded-2xl text-white shadow-lg shadow-emerald-500/20 flex items-center gap-4 animate-scale-in">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-lg border border-white/20 shrink-0">
            <TrendingUp size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg">Business Mode Active</h3>
            <p className="text-xs opacity-80">Your merchant tools are shown first. Manage products, track orders, view analytics.</p>
          </div>
          <Link href="/business-dashboard" className="bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-black text-sm interactive shrink-0 hidden sm:block">
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Apps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {visibleApps.map((app, idx) => (
          <Link 
            key={`${app.name}-${app.href}`}
            href={app.href} 
            onClick={() => {
              addActivity({
                id: Date.now().toString(),
                type: 'purchase',
                title: `Opened ${app.name}`,
                status: 'Active',
                time: 'Just now'
              })
            }}
            className="group bg-[var(--bg-card)] p-4 md:p-5 rounded-2xl border border-gray-200/30 dark:border-gray-800/30 card-hover animate-slide-up"
            style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
          >
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className={`bg-gradient-to-br ${app.gradient} p-3.5 rounded-2xl text-white shadow-lg ${app.shadow} group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}>
                <app.icon size={24} />
              </div>
              <div>
                <h3 className="font-black text-sm md:text-base group-hover:text-[var(--syn-function)] transition-colors leading-tight mb-0.5">{app.name}</h3>
                <p className="text-[10px] md:text-xs text-[var(--syn-comment)] font-medium">{app.desc}</p>
              </div>
              {/* Category badge */}
              <span className={clsx(
                "text-[8px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-lg",
                categoryColors[app.category]?.bg || 'bg-gray-500/10',
                categoryColors[app.category]?.text || 'text-[var(--syn-comment)]'
              )}>
                {app.category}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {visibleApps.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-3xl flex items-center justify-center mx-auto">
            <Search size={32} className="text-[var(--syn-comment)]" />
          </div>
          <p className="text-[var(--syn-comment)] font-bold">No apps found for "{searchQuery}"</p>
          <button onClick={() => { setSearchQuery(''); setActiveCategory('All') }} className="text-[var(--syn-function)] text-xs font-black uppercase tracking-widest">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
