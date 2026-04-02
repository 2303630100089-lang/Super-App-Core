'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Leaf, ShieldCheck, MessageSquare, ShoppingCart, Zap, Phone, X, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react'

const PRODUCT = {
  id: '1',
  name: 'Premium Basmati Rice',
  description: 'Long-grain, aromatic basmati rice grown in the fertile plains of Punjab. Sun-dried, hand-sorted, and packed fresh. Perfect for biryani, pulao, and everyday cooking. No pesticides used in the last 2 years.',
  price: 68,
  unit: 'kg',
  grade: 'A',
  organic: true,
  category: 'Grains',
  harvestDate: '2025-01-15',
  availableQty: 2500,
  moq: 50,
  seller: { name: 'Ramesh Kumar', farm: 'Ramesh Farms', location: 'Amritsar, Punjab', verified: true, rating: 4.8, totalSales: 142, since: '2022' },
  colors: ['from-yellow-400 to-amber-500', 'from-amber-300 to-yellow-400', 'from-lime-300 to-yellow-300'],
  bulkPricing: [
    { qty: '50 kg', price: '₹65/kg' },
    { qty: '100 kg', price: '₹62/kg' },
    { qty: '500 kg', price: '₹58/kg' },
    { qty: '1 Ton+', price: 'Contact' },
  ],
  reviews: [
    { name: 'Suresh Patel', rating: 5, comment: 'Excellent quality rice! Very aromatic. Will order again.', date: '2 days ago' },
    { name: 'Priya Nair', rating: 4, comment: 'Good quality, fast delivery. Slightly different from description.', date: '1 week ago' },
    { name: 'Amit Joshi', rating: 5, comment: 'Best basmati I have found online. Ramesh Ji is very responsive.', date: '2 weeks ago' },
  ],
}

const SIMILAR = [
  { id: '4', name: 'Sona Masoori Rice', price: '₹52/kg', color: 'from-amber-300 to-yellow-400', emoji: '🌾' },
  { id: '10', name: 'Jaggery Brown Rice', price: '₹72/kg', color: 'from-orange-300 to-amber-400', emoji: '🌾' },
  { id: '2', name: 'Jowar Grains', price: '₹38/kg', color: 'from-lime-400 to-green-500', emoji: '🌾' },
]

export default function ProductDetailPage() {
  const [qty, setQty] = useState(50)
  const [activeImage, setActiveImage] = useState(0)
  const [showRFQ, setShowRFQ] = useState(false)
  const [rfqMessage, setRfqMessage] = useState('')
  const [rfqQty, setRfqQty] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20 flex items-center gap-3">
        <Link href="/kisan-bazaar/products">
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <h1 className="text-base font-black text-gray-900 dark:text-white flex-1 truncate">{PRODUCT.name}</h1>
        <Link href="/kisan-bazaar/orders">
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
            <ShoppingCart size={20} />
          </button>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-4 space-y-6">
        {/* Image Gallery */}
        <div className="relative rounded-3xl overflow-hidden">
          <div className={`h-56 bg-gradient-to-br ${PRODUCT.colors[activeImage]} flex items-center justify-center text-7xl`}>
            🌾
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {PRODUCT.colors.map((_, i) => (
              <button key={i} onClick={() => setActiveImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${activeImage === i ? 'bg-white w-6' : 'bg-white/50'}`} />
            ))}
          </div>
          <button onClick={() => setActiveImage(p => (p - 1 + PRODUCT.colors.length) % PRODUCT.colors.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-xl">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setActiveImage(p => (p + 1) % PRODUCT.colors.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-xl">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {PRODUCT.organic && (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Leaf size={9} /> Organic
                  </span>
                )}
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Grade {PRODUCT.grade}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">{PRODUCT.name}</h1>
              <p className="text-3xl font-black text-green-600 mt-1">₹{PRODUCT.price}<span className="text-lg text-gray-400">/{PRODUCT.unit}</span></p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{PRODUCT.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wide mb-1">Harvest Date</p>
              <p className="font-black text-gray-800 dark:text-white">📅 {PRODUCT.harvestDate}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wide mb-1">Available Qty</p>
              <p className="font-black text-gray-800 dark:text-white">📦 {PRODUCT.availableQty.toLocaleString()} kg</p>
            </div>
          </div>

          {/* MOQ Notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-3 flex items-center gap-2">
            <span className="text-amber-500 text-lg">⚠️</span>
            <p className="text-xs font-black text-amber-700 dark:text-amber-400">Minimum order: {PRODUCT.moq} kg</p>
          </div>
        </div>

        {/* Bulk Pricing Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">💰 Bulk Pricing</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-green-50 dark:bg-green-900/20">
                <tr>
                  <th className="text-left p-3 font-black text-green-700 dark:text-green-400 text-xs uppercase tracking-wide">Quantity</th>
                  <th className="text-right p-3 font-black text-green-700 dark:text-green-400 text-xs uppercase tracking-wide">Price</th>
                  <th className="text-right p-3 font-black text-green-700 dark:text-green-400 text-xs uppercase tracking-wide">Savings</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCT.bulkPricing.map((tier, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="p-3 font-bold text-gray-700 dark:text-gray-300">{tier.qty}</td>
                    <td className="p-3 text-right font-black text-gray-900 dark:text-white">{tier.price}</td>
                    <td className="p-3 text-right">
                      {tier.price !== 'Contact' ? (
                        <span className="text-green-600 font-black text-xs bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                          Save {Math.round((1 - parseInt(tier.price) / PRODUCT.price) * 100)}%
                        </span>
                      ) : (
                        <span className="text-blue-500 font-bold text-xs">Negotiate</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">Select Quantity</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => setQty(q => Math.max(PRODUCT.moq, q - 10))}
              className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl font-black text-2xl text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              −
            </button>
            <div className="flex-1 text-center">
              <p className="text-3xl font-black text-gray-900 dark:text-white">{qty} kg</p>
              <p className="text-sm text-green-600 font-bold">₹{qty * PRODUCT.price} total</p>
            </div>
            <button onClick={() => setQty(q => Math.min(PRODUCT.availableQty, q + 10))}
              className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl font-black text-2xl text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              +
            </button>
          </div>
        </div>

        {/* Seller Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">👨‍🌾 Seller Profile</h2>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
              🧑‍🌾
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-black text-gray-900 dark:text-white">{PRODUCT.seller.name}</p>
                {PRODUCT.seller.verified && <BadgeCheck size={16} className="text-blue-500" />}
              </div>
              <p className="text-sm text-gray-500 font-bold">{PRODUCT.seller.farm}</p>
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                <MapPin size={12} /> {PRODUCT.seller.location}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                  <p className="font-black text-amber-500 text-base flex items-center justify-center gap-0.5"><Star size={12} fill="currentColor" /> {PRODUCT.seller.rating}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Rating</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                  <p className="font-black text-gray-800 dark:text-white text-base">{PRODUCT.seller.totalSales}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Sales</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2">
                  <p className="font-black text-gray-800 dark:text-white text-base">{PRODUCT.seller.since}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Since</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
              <Phone size={15} /> Call
            </button>
            <Link href={`/kisan-bazaar/chat/1?product=${PRODUCT.id}`} className="flex-1">
              <button className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
                <MessageSquare size={15} /> Chat
              </button>
            </Link>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-black text-gray-900 dark:text-white mb-4">⭐ Reviews</h2>
          <div className="space-y-4">
            {PRODUCT.reviews.map((r, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-black">
                      {r.name[0]}
                    </div>
                    <p className="font-black text-sm text-gray-800 dark:text-white">{r.name}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={10} className={j < r.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>
                <p className="text-[10px] text-gray-400 mt-1">{r.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Products */}
        <div>
          <h2 className="font-black text-gray-900 dark:text-white mb-3">Similar Products</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {SIMILAR.map(p => (
              <Link href={`/kisan-bazaar/products/${p.id}`} key={p.id}>
                <div className="flex-shrink-0 w-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <div className={`h-20 bg-gradient-to-br ${p.color} flex items-center justify-center text-3xl`}>{p.emoji}</div>
                  <div className="p-2.5">
                    <p className="font-black text-xs text-gray-800 dark:text-white leading-tight">{p.name}</p>
                    <p className="text-green-600 font-black text-sm mt-0.5">{p.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-20">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowRFQ(true)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1">
              📋 Request Quote
            </button>
            <Link href={`/kisan-bazaar/chat/1?product=${PRODUCT.id}`} className="flex-1">
              <button className="w-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1">
                💬 Negotiate Price
              </button>
            </Link>
          </div>
          <div className="flex gap-2">
            <button onClick={() => showToast(`Added ${qty}kg to cart! 🛒`)}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2">
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button onClick={() => showToast('Redirecting to checkout...')}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none">
              <Zap size={16} /> Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* RFQ Modal */}
      {showRFQ && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white text-lg">📋 Request for Quote</h3>
              <button onClick={() => setShowRFQ(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500">{PRODUCT.name} • {PRODUCT.seller.name}</p>
            <div>
              <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Required Quantity (kg)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={rfqQty}
                onChange={e => setRfqQty(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Message to Seller</label>
              <textarea
                placeholder="Describe your requirements, delivery location, preferred price..."
                value={rfqMessage}
                onChange={e => setRfqMessage(e.target.value)}
                rows={4}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white resize-none focus:ring-2 ring-green-500"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRFQ(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3 rounded-2xl font-black text-sm">
                Cancel
              </button>
              <button onClick={() => { setShowRFQ(false); showToast('RFQ sent successfully! 📨') }}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-2xl font-black text-sm">
                Send RFQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
