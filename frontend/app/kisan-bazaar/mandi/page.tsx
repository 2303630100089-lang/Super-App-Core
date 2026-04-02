'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react'

const LOCATIONS = ['Mumbai', 'Delhi', 'Punjab', 'Maharashtra', 'Uttar Pradesh', 'Gujarat', 'Rajasthan', 'Karnataka']

const CROPS = [
  { name: 'Wheat', min: 2050, max: 2250, modal: 2150, trend: 'up', change: 2.3, emoji: '🌾' },
  { name: 'Rice (Paddy)', min: 3050, max: 3350, modal: 3200, trend: 'down', change: 1.1, emoji: '🍚' },
  { name: 'Tomato', min: 1600, max: 2000, modal: 1800, trend: 'up', change: 5.8, emoji: '🍅' },
  { name: 'Onion', min: 2200, max: 2600, modal: 2400, trend: 'up', change: 3.2, emoji: '🧅' },
  { name: 'Potato', min: 1100, max: 1300, modal: 1200, trend: 'down', change: 0.9, emoji: '🥔' },
  { name: 'Maize', min: 1850, max: 2050, modal: 1950, trend: 'up', change: 1.5, emoji: '🌽' },
  { name: 'Soybean', min: 4200, max: 4600, modal: 4400, trend: 'flat', change: 0, emoji: '🫘' },
  { name: 'Cotton', min: 6500, max: 7000, modal: 6750, trend: 'up', change: 2.8, emoji: '🌸' },
  { name: 'Sugarcane', min: 340, max: 380, modal: 360, trend: 'flat', change: 0, emoji: '🎋' },
  { name: 'Mustard', min: 5200, max: 5600, modal: 5400, trend: 'up', change: 4.1, emoji: '🌻' },
  { name: 'Groundnut', min: 5400, max: 5900, modal: 5650, trend: 'down', change: 1.8, emoji: '🥜' },
  { name: 'Turmeric', min: 7500, max: 8500, modal: 8000, trend: 'up', change: 6.2, emoji: '🟡' },
  { name: 'Garlic', min: 3200, max: 3800, modal: 3500, trend: 'down', change: 2.4, emoji: '🧄' },
  { name: 'Green Peas', min: 2800, max: 3200, modal: 3000, trend: 'up', change: 3.7, emoji: '🫛' },
  { name: 'Chilli (Red)', min: 9000, max: 11000, modal: 10000, trend: 'up', change: 7.5, emoji: '🌶️' },
]

type MandiPrices = Record<string, number>

const COMPARE_DATA: Record<string, MandiPrices> = {
  Mumbai: { Wheat: 2200, Rice: 3300, Tomato: 1900 },
  Delhi: { Wheat: 2100, Rice: 3150, Tomato: 1750 },
  Punjab: { Wheat: 2150, Rice: 3200, Tomato: 1800 },
}

const WEEK_DATA = [42, 48, 45, 52, 58, 54, 61] // relative bar heights
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MandiPage() {
  const [location, setLocation] = useState('Mumbai')
  const [search, setSearch] = useState('')
  const [alerts, setAlerts] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareCrop, setCompareCrop] = useState('Wheat')

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const toggleAlert = (crop: string) => {
    const next = new Set(alerts)
    if (next.has(crop)) {
      next.delete(crop)
      showToast(`Alert removed for ${crop}`)
    } else {
      next.add(crop)
      showToast(`🔔 Alert set for ${crop}`)
    }
    setAlerts(next)
  }

  const filtered = CROPS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl transition-all">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/kisan-bazaar">
            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">📊 Mandi Price Board</h1>
          <button onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-2 rounded-xl font-black text-xs transition-all ${compareMode ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            Compare
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-4 space-y-6">
        {/* Location & Date */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">Today's Date</p>
              <p className="font-black text-sm text-gray-800 dark:text-white">📅 {today}</p>
            </div>
            <div className="flex-shrink-0">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-1">Mandi Location</p>
              <select value={location} onChange={e => setLocation(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm font-black text-gray-800 dark:text-white outline-none border-none">
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search crop..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none dark:text-white focus:ring-2 ring-green-500 transition-all"
          />
        </div>

        {/* Crop Price Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-black text-gray-900 dark:text-white">📋 Prices in ₹/Quintal — {location} Mandi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3 pl-4 font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Crop</th>
                  <th className="text-right p-3 font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Min</th>
                  <th className="text-right p-3 font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Max</th>
                  <th className="text-right p-3 font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Modal</th>
                  <th className="text-right p-3 font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Trend</th>
                  <th className="text-right p-3 pr-4 font-black text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Alert</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((crop, i) => (
                  <tr key={crop.name} className={`border-t border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                    <td className="p-3 pl-4 font-black text-gray-800 dark:text-white">
                      <span className="mr-2">{crop.emoji}</span>{crop.name}
                    </td>
                    <td className="p-3 text-right text-gray-600 dark:text-gray-400 font-bold">₹{crop.min}</td>
                    <td className="p-3 text-right text-gray-600 dark:text-gray-400 font-bold">₹{crop.max}</td>
                    <td className="p-3 text-right font-black text-gray-900 dark:text-white">₹{crop.modal}</td>
                    <td className="p-3 text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black ${
                        crop.trend === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        crop.trend === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {crop.trend === 'up' ? <TrendingUp size={10} /> : crop.trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
                        {crop.change > 0 ? `+${crop.change}%` : crop.change === 0 ? '0%' : `-${crop.change}%`}
                      </div>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button onClick={() => toggleAlert(crop.name)}
                        className={`p-1.5 rounded-xl transition-colors ${alerts.has(crop.name) ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-green-500'}`}>
                        <Bell size={13} fill={alerts.has(crop.name) ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">📈 Weekly Price Trend</h2>
          <div className="flex items-end gap-2 h-32">
            {WEEK_DATA.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  style={{ height: `${(val / 70) * 100}%` }}
                  className="w-full rounded-t-xl bg-gradient-to-t from-green-600 to-emerald-400 transition-all hover:opacity-80 min-h-[8px]"
                />
                <p className="text-[9px] font-black text-gray-400">{WEEK_DAYS[i]}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center font-bold">Index based on weighted average of top 5 crops</p>
        </div>

        {/* Compare Prices */}
        {compareMode && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-black text-gray-900 dark:text-white mb-4">⚖️ Compare Prices Across Mandis</h2>
            <div className="mb-4">
              <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-wide">Select Crop</label>
              <div className="flex gap-2 flex-wrap">
                {['Wheat', 'Rice', 'Tomato'].map(c => (
                  <button key={c} onClick={() => setCompareCrop(c)}
                    className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${compareCrop === c ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(COMPARE_DATA).map(([mandi, prices]) => (
                <div key={mandi} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-center">
                  <p className="font-black text-sm text-gray-700 dark:text-gray-300 mb-2">{mandi}</p>
                  <p className="text-2xl font-black text-green-600">₹{prices[compareCrop] ?? 'N/A'}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">/quintal</p>
                  {prices[compareCrop] === Math.min(...Object.values(COMPARE_DATA).map(p => p[compareCrop] || Infinity)) && (
                    <span className="inline-block mt-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-full">Lowest</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Alerts */}
        {alerts.size > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-200 dark:border-green-800 p-4">
            <h3 className="font-black text-green-800 dark:text-green-300 mb-3 text-sm">🔔 Your Price Alerts ({alerts.size})</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(alerts).map(crop => (
                <span key={crop} className="bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 text-xs font-black px-3 py-1.5 rounded-full border border-green-200 dark:border-green-700 flex items-center gap-1">
                  🔔 {crop}
                  <button onClick={() => toggleAlert(crop)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
