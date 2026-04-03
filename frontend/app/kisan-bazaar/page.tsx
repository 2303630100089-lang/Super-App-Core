'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Bell, ChevronRight, TrendingUp, TrendingDown, Star, MapPin, Leaf, Plus, BarChart2, Package, MessageSquare } from 'lucide-react'

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Machinery']

const MANDI_PRICES = [
  { crop: 'Wheat', price: 2150, unit: 'q', trend: 'up', change: '+2.3%' },
  { crop: 'Rice', price: 3200, unit: 'q', trend: 'down', change: '-1.1%' },
  { crop: 'Tomato', price: 1800, unit: 'q', trend: 'up', change: '+5.8%' },
  { crop: 'Onion', price: 2400, unit: 'q', trend: 'up', change: '+3.2%' },
  { crop: 'Potato', price: 1200, unit: 'q', trend: 'down', change: '-0.9%' },
]

const PRODUCTS = [
  { id: '1', name: 'Premium Basmati Rice', price: '₹68/kg', seller: 'Ramesh Farms', location: 'Punjab', organic: true, grade: 'A', color: 'from-yellow-400 to-amber-500', category: 'Grains' },
  { id: '2', name: 'Fresh Tomatoes', price: '₹22/kg', seller: 'Green Valley', location: 'Nashik', organic: false, grade: 'B', color: 'from-red-400 to-rose-500', category: 'Vegetables' },
  { id: '3', name: 'Alphonso Mangoes', price: '₹180/kg', seller: 'Konkan Orchards', location: 'Ratnagiri', organic: true, grade: 'A', color: 'from-orange-400 to-yellow-500', category: 'Fruits' },
  { id: '4', name: 'Hybrid Wheat Seeds', price: '₹120/kg', seller: 'AgroSeed Co.', location: 'Haryana', organic: false, grade: 'A', color: 'from-lime-400 to-green-500', category: 'Seeds' },
  { id: '5', name: 'Red Onions', price: '₹28/kg', seller: 'Marathwada Farms', location: 'Solapur', organic: false, grade: 'B', color: 'from-purple-400 to-pink-500', category: 'Vegetables' },
  { id: '6', name: 'Organic Spinach', price: '₹35/kg', seller: 'Healthy Greens', location: 'Pune', organic: true, grade: 'A', color: 'from-emerald-400 to-green-600', category: 'Vegetables' },
  { id: '7', name: 'DAP Fertilizer', price: '₹1350/bag', seller: 'Krishi Supplies', location: 'Indore', organic: false, grade: 'A', color: 'from-blue-400 to-cyan-500', category: 'Fertilizers' },
  { id: '8', name: 'Hand Tractor Tool', price: '₹4500/unit', seller: 'Farm Tools Hub', location: 'Ludhiana', organic: false, grade: 'B', color: 'from-gray-400 to-slate-500', category: 'Tools' },
]

export default function KisanBazaarPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [cartCount] = useState(2)

  const filtered = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-4 z-20">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">🌾 Kisan Bazaar</h1>
            <div className="flex items-center gap-2">
              <Link href="/kisan-bazaar/mandi">
                <button className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:scale-105 transition-transform">
                  <BarChart2 size={20} />
                </button>
              </Link>
              <button className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:scale-105 transition-transform relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Link href="/kisan-bazaar/orders">
                <button className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:scale-105 transition-transform relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">{cartCount}</span>
                  )}
                </button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search crops, seeds, fertilizers..."
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none dark:text-white placeholder-gray-400 focus:ring-2 ring-green-500 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-6 space-y-8">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-2xl whitespace-nowrap text-xs font-black uppercase tracking-wide transition-all ${
                activeCategory === cat
                  ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-green-600 via-emerald-500 to-lime-400 p-8 text-white">
          <div className="relative z-10">
            <p className="text-sm font-bold opacity-80 mb-1">🇮🇳 Made for Indian Farmers</p>
            <h2 className="text-3xl font-black mb-2 leading-tight">India's Agri<br />Marketplace</h2>
            <p className="text-sm opacity-90 mb-6 max-w-xs">Direct farm-to-buyer. No middlemen. Better prices for all.</p>
            <div className="flex gap-3">
              <Link href="/kisan-bazaar/products">
                <button className="bg-white text-green-700 px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-transform">
                  Browse Crops
                </button>
              </Link>
              <Link href="/kisan-bazaar/sell">
                <button className="bg-white/20 backdrop-blur border border-white/30 text-white px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-white/30 transition-all">
                  Sell Now
                </button>
              </Link>
            </div>
          </div>
          <div className="absolute right-4 top-4 text-8xl opacity-20 select-none">🌾</div>
          <div className="absolute right-16 bottom-4 text-5xl opacity-20 select-none">🚜</div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: '📊', label: 'Mandi', href: '/kisan-bazaar/mandi' },
            { icon: '📦', label: 'Orders', href: '/kisan-bazaar/orders' },
            { icon: '💬', label: 'Chat', href: '/kisan-bazaar/chat' },
            { icon: '🏪', label: 'Dashboard', href: '/kisan-bazaar/dashboard' },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 text-center hover:border-green-300 dark:hover:border-green-700 transition-colors cursor-pointer">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-black text-gray-600 dark:text-gray-400">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mandi Prices */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">📊 Today's Mandi Prices</h2>
            <Link href="/kisan-bazaar/mandi">
              <button className="text-green-600 text-xs font-black flex items-center gap-1">View All <ChevronRight size={14} /></button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {MANDI_PRICES.map(item => (
              <div key={item.crop} className="flex-shrink-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 w-36">
                <p className="font-black text-sm text-gray-800 dark:text-white mb-1">{item.crop}</p>
                <p className="text-lg font-black text-green-600">₹{item.price}</p>
                <p className="text-[10px] text-gray-400 mb-2">per quintal</p>
                <div className={`flex items-center gap-1 text-xs font-bold ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {item.change}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Listings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">⭐ Featured Listings</h2>
            <Link href="/kisan-bazaar/products">
              <button className="text-green-600 text-xs font-black flex items-center gap-1">See All <ChevronRight size={14} /></button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(product => (
              <Link href={`/kisan-bazaar/products/${product.id}`} key={product.id}>
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-200 dark:hover:border-green-800 transition-all group cursor-pointer">
                  <div className={`h-32 bg-gradient-to-br ${product.color} relative flex items-center justify-center`}>
                    <span className="text-4xl">
                      {product.category === 'Grains' ? '🌾' : product.category === 'Vegetables' ? '🥬' : product.category === 'Fruits' ? '🍋' : product.category === 'Seeds' ? '🌱' : product.category === 'Fertilizers' ? '🧪' : product.category === 'Tools' ? '🔧' : '🌿'}
                    </span>
                    {product.organic && (
                      <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Leaf size={8} /> Organic
                      </span>
                    )}
                    <span className="absolute top-2 right-2 bg-white/90 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                      Grade {product.grade}
                    </span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h3 className="font-black text-sm text-gray-900 dark:text-white leading-tight truncate">{product.name}</h3>
                    <p className="text-green-600 font-black text-base">{product.price}</p>
                    <p className="text-xs text-gray-500 font-bold">{product.seller}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                      <MapPin size={10} /> {product.location}
                    </div>
                    <button className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white text-xs font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1">
                      <Plus size={12} /> Add to Cart
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-20">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Link href="/kisan-bazaar/sell" className="flex-1">
            <button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none hover:scale-[1.02] transition-transform">
              <Plus size={18} /> List Your Product
            </button>
          </Link>
          <Link href="/kisan-bazaar/dashboard">
            <button className="px-5 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl font-black text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Package size={18} /> Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
