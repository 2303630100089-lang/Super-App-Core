'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Package, ShoppingCart, Star, Edit2, Pause, Trash2, Plus, BarChart2, MessageSquare, Wallet, Bell, ShieldCheck } from 'lucide-react'

const WEEK_SALES = [8500, 12000, 9800, 15000, 11200, 18000, 14500]
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_SALES = Math.max(...WEEK_SALES)

const LISTINGS = [
  { id: '1', name: 'Premium Basmati Rice', price: '₹68/kg', qty: '1800 kg', status: 'active', emoji: '🌾' },
  { id: '2', name: 'Organic Wheat', price: '₹48/kg', qty: '3200 kg', status: 'active', emoji: '🌾' },
  { id: '3', name: 'Green Peas', price: '₹45/kg', qty: '450 kg', status: 'paused', emoji: '🫛' },
  { id: '4', name: 'Fresh Tomatoes', price: '₹22/kg', qty: '800 kg', status: 'active', emoji: '🍅' },
]

const RECENT_ORDERS = [
  { id: 'KB012', product: 'Basmati Rice', buyer: 'Mehta Exports', amount: '₹34,000', status: 'Delivered', emoji: '🌾' },
  { id: 'KB011', product: 'Green Peas', buyer: 'FreshMart', amount: '₹6,750', status: 'In Transit', emoji: '🫛' },
  { id: 'KB010', product: 'Organic Wheat', buyer: 'Health Bakery', amount: '₹19,200', status: 'Confirmed', emoji: '🌾' },
  { id: 'KB009', product: 'Tomatoes', buyer: 'City Hotels', amount: '₹4,400', status: 'Pending', emoji: '🍅' },
  { id: 'KB008', product: 'Basmati Rice', buyer: 'Rice Palace', amount: '₹27,200', status: 'Delivered', emoji: '🌾' },
]

const PRICE_ALERTS = [
  { crop: 'Wheat', current: 2150, target: 2300, emoji: '🌾' },
  { crop: 'Tomato', current: 1800, target: 2000, emoji: '🍅' },
  { crop: 'Onion', current: 2400, target: 2200, emoji: '🧅' },
]

const statusColors: Record<string, string> = {
  Delivered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  'In Transit': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
}

export default function DashboardPage() {
  const [activeRole, setActiveRole] = useState<'farmer' | 'vendor' | 'buyer'>('farmer')
  const [kyc] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl">
          {toast}
        </div>
      )}

      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/kisan-bazaar">
            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">Dashboard</h1>
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-4 space-y-5">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-lime-500 rounded-3xl p-5 text-white">
          <p className="text-sm font-bold opacity-80 mb-0.5">Good Morning 🌅</p>
          <h2 className="text-2xl font-black">Namaste, Ramesh Ji 🙏</h2>
          <p className="text-sm opacity-80 mt-1">Amritsar, Punjab • Member since 2022</p>
        </div>

        {/* KYC Banner */}
        {!kyc && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-black text-amber-800 dark:text-amber-300 text-sm">KYC Verification Pending</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Complete KYC to unlock withdrawals and verified badge</p>
            </div>
            <button className="bg-amber-500 text-white px-4 py-2 rounded-xl font-black text-xs whitespace-nowrap">
              Complete KYC
            </button>
          </div>
        )}

        {/* Role Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          {([['farmer', '👨‍🌾 Farmer'], ['vendor', '🏪 Vendor'], ['buyer', '🛒 Buyer']] as const).map(([role, label]) => (
            <button key={role} onClick={() => setActiveRole(role)}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${activeRole === role ? 'bg-white dark:bg-gray-900 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Sales', value: '₹1,24,500', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Active Listings', value: '8', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Pending Orders', value: '3', icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Rating', value: '4.7 ★', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-white dark:border-gray-700`}>
              <stat.icon size={18} className={`${stat.color} mb-2`} />
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Earnings Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">💰 Earnings Summary</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Available Balance', value: '₹45,200', color: 'text-green-600' },
              { label: 'This Month', value: '₹18,750', color: 'text-blue-600' },
              { label: 'Total Earned', value: '₹1,24,500', color: 'text-purple-600' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 text-center">
                <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => showToast('Withdraw request submitted!')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
            <Wallet size={16} /> Withdraw Earnings
          </button>
        </div>

        {/* Sales Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 dark:text-white">📊 Last 7 Days Sales</h2>
            <span className="text-xs text-green-600 font-black bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">+18.2%</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {WEEK_SALES.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[9px] font-black text-gray-400">₹{(val / 1000).toFixed(1)}k</p>
                <div
                  style={{ height: `${(val / MAX_SALES) * 80}%` }}
                  className={`w-full rounded-t-xl min-h-[4px] transition-all ${i === WEEK_SALES.length - 1 ? 'bg-gradient-to-t from-green-600 to-lime-400' : 'bg-gradient-to-t from-green-400/60 to-emerald-300/60'}`}
                />
                <p className="text-[9px] font-black text-gray-400">{WEEK_DAYS[i]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My Listings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 dark:text-white">📦 My Listings</h2>
            <Link href="/kisan-bazaar/sell">
              <button className="text-green-600 text-xs font-black flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl">
                <Plus size={12} /> Add New
              </button>
            </Link>
          </div>
          <div className="space-y-3">
            {LISTINGS.map(listing => (
              <div key={listing.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                <span className="text-2xl">{listing.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-gray-800 dark:text-white truncate">{listing.name}</p>
                  <p className="text-xs text-gray-500 font-bold">{listing.price} • {listing.qty}</p>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${listing.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  {listing.status}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => showToast('Edit mode coming soon!')} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg"><Edit2 size={12} /></button>
                  <button onClick={() => showToast('Listing paused')} className="p-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-lg"><Pause size={12} /></button>
                  <button onClick={() => showToast('Listing deleted')} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 dark:text-white">📋 Recent Orders</h2>
            <Link href="/kisan-bazaar/orders">
              <button className="text-green-600 text-xs font-black">View All →</button>
            </Link>
          </div>
          <div className="space-y-2">
            {RECENT_ORDERS.map(order => (
              <div key={order.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                <span className="text-lg">{order.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-gray-800 dark:text-white truncate">{order.product}</p>
                  <p className="text-xs text-gray-500 font-bold">{order.buyer}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-green-600">{order.amount}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusColors[order.status] || ''}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 dark:text-white">🔔 Price Alerts</h2>
            <Link href="/kisan-bazaar/mandi">
              <button className="text-green-600 text-xs font-black">Manage →</button>
            </Link>
          </div>
          <div className="space-y-2">
            {PRICE_ALERTS.map(alert => (
              <div key={alert.crop} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
                <span className="text-lg">{alert.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-sm text-gray-800 dark:text-white">{alert.crop}</p>
                  <p className="text-xs text-gray-500 font-bold">Current: ₹{alert.current}/q</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold">Alert at</p>
                  <p className="font-black text-sm text-amber-600">₹{alert.target}/q</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Plus, label: 'Add New Listing', href: '/kisan-bazaar/sell', color: 'bg-green-600 text-white' },
            { icon: BarChart2, label: 'Mandi Prices', href: '/kisan-bazaar/mandi', color: 'bg-blue-600 text-white' },
            { icon: MessageSquare, label: 'Messages', href: '/kisan-bazaar/chat', color: 'bg-purple-600 text-white' },
            { icon: Wallet, label: 'Withdraw', href: '#', color: 'bg-emerald-600 text-white' },
          ].map(action => (
            <Link key={action.label} href={action.href}>
              <div className={`${action.color} rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer`}>
                <action.icon size={20} />
                <p className="font-black text-sm">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
