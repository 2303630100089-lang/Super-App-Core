'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Plus, X, Upload, ChevronDown } from 'lucide-react'

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Machinery']
const GRADES = ['A', 'B', 'C']
const UNITS = ['kg', 'quintal', 'ton']

type BulkTier = { qty: string; price: string }

export default function SellPage() {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  // Step 1
  const [category, setCategory] = useState('')
  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [grade, setGrade] = useState('A')
  const [organic, setOrganic] = useState(false)
  const [harvestDate, setHarvestDate] = useState('')

  // Step 2
  const [basePrice, setBasePrice] = useState('')
  const [unit, setUnit] = useState('kg')
  const [availableQty, setAvailableQty] = useState('')
  const [moq, setMoq] = useState('')
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>([{ qty: '', price: '' }])

  // Step 3
  const [address, setAddress] = useState('')
  const [deliveryOptions, setDeliveryOptions] = useState<string[]>([])

  const toggleDelivery = (opt: string) => {
    setDeliveryOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  const addBulkTier = () => setBulkTiers(prev => [...prev, { qty: '', price: '' }])
  const removeBulkTier = (i: number) => setBulkTiers(prev => prev.filter((_, idx) => idx !== i))
  const updateTier = (i: number, field: 'qty' | 'price', val: string) => {
    setBulkTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  const handleSubmit = () => setSubmitted(true)

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 text-center max-w-sm w-full space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto">
            ✅
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Listing Live!</h2>
          <p className="text-gray-500 text-sm">Your product <strong className="text-gray-800 dark:text-white">{productName}</strong> has been listed on Kisan Bazaar. Buyers can now see and order your produce.</p>
          <div className="space-y-3">
            <Link href="/kisan-bazaar/dashboard">
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3.5 rounded-2xl font-black">View Dashboard</button>
            </Link>
            <Link href="/kisan-bazaar">
              <button className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3.5 rounded-2xl font-black">Back to Home</button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/kisan-bazaar">
            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">List Your Product</h1>
          <span className="text-sm font-black text-gray-400">Step {step}/3</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${
                  step > s ? 'bg-green-600 text-white' : step === s ? 'bg-green-600 text-white ring-4 ring-green-100 dark:ring-green-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  {step > s ? <Check size={14} /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-green-500' : 'bg-gray-100 dark:bg-gray-800'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-wide">
            <span className={step >= 1 ? 'text-green-600' : ''}>Product</span>
            <span className={step >= 2 ? 'text-green-600' : ''}>Pricing</span>
            <span className={step >= 3 ? 'text-green-600' : ''}>Location</span>
          </div>
        </div>

        {/* Step 1: Product Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h2 className="font-black text-gray-900 dark:text-white text-lg">📦 Product Details</h2>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Category *</label>
                <div className="relative">
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white appearance-none font-bold">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Product Name *</label>
                <input type="text" placeholder="e.g. Premium Basmati Rice" value={productName} onChange={e => setProductName(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500 transition-all" />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Description</label>
                <textarea placeholder="Describe your product, quality, storage conditions..." value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white resize-none focus:ring-2 ring-green-500 transition-all" />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-wide">Quality Grade</label>
                <div className="flex gap-3">
                  {GRADES.map(g => (
                    <button key={g} onClick={() => setGrade(g)}
                      className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 transition-all ${grade === g ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      Grade {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-sm text-gray-700 dark:text-gray-300">Organic Product</p>
                  <p className="text-xs text-gray-400">No chemicals/pesticides used</p>
                </div>
                <button onClick={() => setOrganic(!organic)}
                  className={`w-14 h-7 rounded-full transition-all relative ${organic ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${organic ? 'translate-x-7' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Harvest Date</label>
                <input type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Quantity */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h2 className="font-black text-gray-900 dark:text-white text-lg">💰 Pricing & Quantity</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Base Price (₹) *</label>
                  <input type="number" placeholder="0" value={basePrice} onChange={e => setBasePrice(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Unit</label>
                  <div className="relative">
                    <select value={unit} onChange={e => setUnit(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white appearance-none font-bold">
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Available Qty *</label>
                  <input type="number" placeholder={`in ${unit}`} value={availableQty} onChange={e => setAvailableQty(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Min Order (MOQ)</label>
                  <input type="number" placeholder={`in ${unit}`} value={moq} onChange={e => setMoq(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500 transition-all" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wide">Bulk Pricing Tiers</label>
                  <button onClick={addBulkTier} className="text-green-600 text-xs font-black flex items-center gap-1">
                    <Plus size={12} /> Add Tier
                  </button>
                </div>
                <div className="space-y-2">
                  {bulkTiers.map((tier, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input type="text" placeholder={`Min qty (${unit})`} value={tier.qty} onChange={e => updateTier(i, 'qty', e.target.value)}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none dark:text-white" />
                      <input type="text" placeholder="Price/unit (₹)" value={tier.price} onChange={e => updateTier(i, 'price', e.target.value)}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm outline-none dark:text-white" />
                      {bulkTiers.length > 1 && (
                        <button onClick={() => removeBulkTier(i)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location & Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h2 className="font-black text-gray-900 dark:text-white text-lg">📍 Location & Photos</h2>

              {/* Photo Upload */}
              <div>
                <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-wide">Product Photos</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="font-black text-gray-500 text-sm">Click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB each</p>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-300">
                      <Plus size={16} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Farm/Pickup Address *</label>
                <textarea placeholder="Village, Taluka, District, State, PIN" value={address} onChange={e => setAddress(e.target.value)}
                  rows={3} className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white resize-none focus:ring-2 ring-green-500 transition-all" />
              </div>

              {/* Delivery Options */}
              <div>
                <label className="text-xs font-black text-gray-500 mb-3 block uppercase tracking-wide">Delivery Options</label>
                <div className="space-y-3">
                  {[
                    { id: 'pickup', label: 'Self Pickup', desc: 'Buyer visits your location', icon: '🏚️' },
                    { id: 'seller', label: 'Seller Delivery', desc: 'You deliver to buyer', icon: '🚛' },
                    { id: 'platform', label: 'Platform Delivery', desc: 'We arrange logistics', icon: '📦' },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-3 cursor-pointer bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <input type="checkbox" checked={deliveryOptions.includes(opt.id)} onChange={() => toggleDelivery(opt.id)}
                        className="accent-green-600 w-4 h-4" />
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <p className="font-black text-sm text-gray-800 dark:text-white">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-6 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-sm">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-green-200 dark:shadow-none hover:scale-[1.02] transition-transform">
              Next Step →
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-green-200 dark:shadow-none hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
              <Check size={18} /> Submit Listing
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
