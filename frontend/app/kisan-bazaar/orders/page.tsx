'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, RotateCcw, X, MessageSquare, Check, ChevronRight, Truck } from 'lucide-react'

type Status = 'Pending' | 'Confirmed' | 'In Transit' | 'Delivered' | 'Cancelled'

const statusColors: Record<Status, string> = {
  Pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  Confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'In Transit': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Delivered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
}

const ORDERS = [
  { id: 'KB001', product: 'Premium Basmati Rice', qty: '200 kg', amount: '₹13,600', status: 'Delivered' as Status, date: 'Jan 14, 2025', seller: 'Ramesh Farms', emoji: '🌾' },
  { id: 'KB002', product: 'Fresh Tomatoes', qty: '100 kg', amount: '₹2,200', status: 'In Transit' as Status, date: 'Jan 16, 2025', seller: 'Green Valley', emoji: '🍅' },
  { id: 'KB003', product: 'Alphonso Mangoes', qty: '50 kg', amount: '₹9,000', status: 'Confirmed' as Status, date: 'Jan 17, 2025', seller: 'Konkan Orchards', emoji: '🥭' },
  { id: 'KB004', product: 'DAP Fertilizer', qty: '5 bags', amount: '₹6,750', status: 'Pending' as Status, date: 'Jan 18, 2025', seller: 'Krishi Supplies', emoji: '🧪' },
  { id: 'KB005', product: 'Red Onions', qty: '300 kg', amount: '₹8,400', status: 'Cancelled' as Status, date: 'Jan 10, 2025', seller: 'Marathwada Farms', emoji: '🧅' },
]

const SALES = [
  { id: 'SL001', product: 'Wheat Grains', qty: '500 kg', amount: '₹32,500', status: 'Delivered' as Status, date: 'Jan 12, 2025', buyer: 'Suresh Traders', emoji: '🌾' },
  { id: 'SL002', product: 'Organic Spinach', qty: '80 kg', amount: '₹2,800', status: 'In Transit' as Status, date: 'Jan 15, 2025', buyer: 'City Grocery', emoji: '🥬' },
  { id: 'SL003', product: 'Green Peas', qty: '150 kg', amount: '₹6,750', status: 'Confirmed' as Status, date: 'Jan 17, 2025', buyer: 'FreshMart', emoji: '🫛' },
  { id: 'SL004', product: 'Cotton Seeds', qty: '200 kg', amount: '₹17,000', status: 'Pending' as Status, date: 'Jan 18, 2025', buyer: 'Vidarbha Textiles', emoji: '🌸' },
  { id: 'SL005', product: 'Jaggery', qty: '100 kg', amount: '₹5,500', status: 'Delivered' as Status, date: 'Jan 8, 2025', buyer: 'Natural Sweets', emoji: '🍯' },
]

const RFQS = [
  { id: 'RFQ001', product: 'Basmati Rice', from: 'Mehta Exports', qty: '2 Ton', message: 'Need premium quality for export. Please quote best price for 2 ton.', date: 'Jan 18, 2025', emoji: '🌾' },
  { id: 'RFQ002', product: 'Organic Wheat', from: 'Healthy Foods Ltd', qty: '500 kg', message: 'Looking for certified organic wheat. Delivery to Mumbai required.', date: 'Jan 17, 2025', emoji: '🌾' },
  { id: 'RFQ003', product: 'Fresh Vegetables Mix', from: 'Star Hotels', qty: '200 kg/week', message: 'Need weekly supply for our hotel chain in Pune. Mixed vegetables.', date: 'Jan 16, 2025', emoji: '🥬' },
]

const TIMELINE = ['Placed', 'Confirmed', 'Dispatched', 'Delivered']

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'sales' | 'rfqs'>('orders')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const getTimelineStep = (status: Status) => {
    const map: Record<string, number> = { Pending: 0, Confirmed: 1, 'In Transit': 2, Delivered: 3 }
    return map[status] ?? 0
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
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/kisan-bazaar">
            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">Orders</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          {([['orders', '📦 My Orders'], ['sales', '🏪 Sales'], ['rfqs', '📋 RFQs']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-900 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* My Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {ORDERS.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {order.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white leading-tight">{order.product}</h3>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold mt-0.5">{order.seller}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{order.qty} • {order.date}</p>
                      <p className="font-black text-sm text-green-600">{order.amount}</p>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                {order.status !== 'Cancelled' && (
                  <div className="flex items-center gap-1">
                    {TIMELINE.map((step, i) => (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                          i <= getTimelineStep(order.status) ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                        }`}>
                          {i <= getTimelineStep(order.status) ? <Check size={10} /> : i + 1}
                        </div>
                        {i < TIMELINE.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-0.5 ${i < getTimelineStep(order.status) ? 'bg-green-400' : 'bg-gray-100 dark:bg-gray-700'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 text-[10px] text-gray-400 font-bold justify-between px-0.5">
                  {TIMELINE.map(s => <span key={s}>{s}</span>)}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'In Transit' && (
                    <button className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <Truck size={12} /> Track
                    </button>
                  )}
                  {order.status === 'Delivered' && (
                    <button onClick={() => showToast('Reorder placed! 🔄')} className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <RotateCcw size={12} /> Reorder
                    </button>
                  )}
                  {(order.status === 'Pending' || order.status === 'Confirmed') && (
                    <button onClick={() => showToast('Cancellation requested')} className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-500 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <X size={12} /> Cancel
                    </button>
                  )}
                  <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                    <Package size={12} /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-3">
            {SALES.map(sale => (
              <div key={sale.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {sale.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">{sale.product}</h3>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap ${statusColors[sale.status]}`}>
                        {sale.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold">Buyer: {sale.buyer}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">{sale.qty} • {sale.date}</p>
                      <p className="font-black text-sm text-green-600">{sale.amount}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                    <MessageSquare size={12} /> Message
                  </button>
                  {sale.status === 'Pending' && (
                    <button onClick={() => showToast('Order confirmed! ✅')} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                      <Check size={12} /> Confirm
                    </button>
                  )}
                  <button className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                    <ChevronRight size={12} /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RFQs Tab */}
        {activeTab === 'rfqs' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-bold">📋 Incoming quote requests from buyers</p>
            {RFQS.map(rfq => (
              <div key={rfq.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center text-xl flex-shrink-0">
                    {rfq.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white">{rfq.product}</h3>
                      <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-full">New</span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold">From: {rfq.from} • Qty: {rfq.qty}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rfq.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{rfq.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => showToast(`RFQ from ${rfq.from} rejected`)}
                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-500 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                    <X size={12} /> Reject
                  </button>
                  <button onClick={() => showToast(`Opening reply for ${rfq.from}...`)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1">
                    <MessageSquare size={12} /> Reply with Quote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
