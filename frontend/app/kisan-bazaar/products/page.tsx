'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter, X, ChevronDown, Leaf, MapPin, Star, SlidersHorizontal, TrendingUp } from 'lucide-react'

const PRODUCTS = [
  { id: '1', name: 'Premium Basmati Rice', price: 68, unit: 'kg', seller: 'Ramesh Farms', location: 'Punjab', organic: true, grade: 'A', category: 'Grains', rating: 4.8, distance: 12, color: 'from-yellow-400 to-amber-500', emoji: '🌾' },
  { id: '2', name: 'Fresh Tomatoes', price: 22, unit: 'kg', seller: 'Green Valley', location: 'Nashik', organic: false, grade: 'B', category: 'Vegetables', rating: 4.2, distance: 45, color: 'from-red-400 to-rose-500', emoji: '🍅' },
  { id: '3', name: 'Alphonso Mangoes', price: 180, unit: 'kg', seller: 'Konkan Orchards', location: 'Ratnagiri', organic: true, grade: 'A', category: 'Fruits', rating: 4.9, distance: 85, color: 'from-orange-400 to-yellow-500', emoji: '🥭' },
  { id: '4', name: 'Hybrid Wheat Seeds', price: 120, unit: 'kg', seller: 'AgroSeed Co.', location: 'Haryana', organic: false, grade: 'A', category: 'Seeds', rating: 4.5, distance: 30, color: 'from-lime-400 to-green-500', emoji: '🌱' },
  { id: '5', name: 'Red Onions', price: 28, unit: 'kg', seller: 'Marathwada Farms', location: 'Solapur', organic: false, grade: 'B', category: 'Vegetables', rating: 3.9, distance: 65, color: 'from-purple-400 to-pink-500', emoji: '🧅' },
  { id: '6', name: 'Organic Spinach', price: 35, unit: 'kg', seller: 'Healthy Greens', location: 'Pune', organic: true, grade: 'A', category: 'Vegetables', rating: 4.7, distance: 8, color: 'from-emerald-400 to-green-600', emoji: '🥬' },
  { id: '7', name: 'DAP Fertilizer', price: 1350, unit: 'bag', seller: 'Krishi Supplies', location: 'Indore', organic: false, grade: 'A', category: 'Fertilizers', rating: 4.6, distance: 120, color: 'from-blue-400 to-cyan-500', emoji: '🧪' },
  { id: '8', name: 'Hand Tractor Tool', price: 4500, unit: 'unit', seller: 'Farm Tools Hub', location: 'Ludhiana', organic: false, grade: 'B', category: 'Tools', rating: 4.3, distance: 200, color: 'from-gray-400 to-slate-500', emoji: '🔧' },
  { id: '9', name: 'Green Peas', price: 45, unit: 'kg', seller: 'Himachal Fresh', location: 'Shimla', organic: true, grade: 'A', category: 'Vegetables', rating: 4.8, distance: 95, color: 'from-green-400 to-teal-500', emoji: '🫛' },
  { id: '10', name: 'Sugarcane Jaggery', price: 55, unit: 'kg', seller: 'Kolhapur Farms', location: 'Kolhapur', organic: true, grade: 'A', category: 'Grains', rating: 4.9, distance: 55, color: 'from-amber-400 to-orange-500', emoji: '🍯' },
  { id: '11', name: 'Cotton Seeds', price: 85, unit: 'kg', seller: 'Vidarbha Seeds', location: 'Nagpur', organic: false, grade: 'B', category: 'Seeds', rating: 4.1, distance: 75, color: 'from-sky-300 to-blue-400', emoji: '🌸' },
  { id: '12', name: 'Mini Cultivator', price: 25000, unit: 'unit', seller: 'AgriMach', location: 'Coimbatore', organic: false, grade: 'A', category: 'Machinery', rating: 4.7, distance: 300, color: 'from-orange-500 to-red-500', emoji: '🚜' },
]

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Machinery']
const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Newest', 'Distance']
const GRADES = ['A', 'B', 'C']
const DISTANCES = ['10km', '50km', '100km', 'Any']

export default function ProductsPage() {
  const [showFilter, setShowFilter] = useState(false)
  const [sort, setSort] = useState('Relevance')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [organicOnly, setOrganicOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [maxPrice, setMaxPrice] = useState(50000)
  const [distance, setDistance] = useState('Any')

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }
  const toggleGrade = (g: string) => {
    setSelectedGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  let filtered = PRODUCTS.filter(p => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false
    if (selectedGrades.length > 0 && !selectedGrades.includes(p.grade)) return false
    if (organicOnly && !p.organic) return false
    if (p.price > maxPrice) return false
    if (minRating > 0 && p.rating < minRating) return false
    if (distance !== 'Any' && p.distance > parseInt(distance)) return false
    return true
  })

  if (sort === 'Price: Low to High') filtered = [...filtered].sort((a, b) => a.price - b.price)
  else if (sort === 'Price: High to Low') filtered = [...filtered].sort((a, b) => b.price - a.price)
  else if (sort === 'Distance') filtered = [...filtered].sort((a, b) => a.distance - b.distance)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-6">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/kisan-bazaar">
            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">Products</h1>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl px-3 py-2 outline-none border-none"
            >
              {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2.5 rounded-xl transition-colors ${showFilter ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full flex gap-6 px-4 py-4">
        {/* Filter Sidebar (desktop) */}
        <aside className={`${showFilter ? 'block' : 'hidden'} md:block w-64 flex-shrink-0`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-6 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white">Filters</h3>
              <button onClick={() => { setSelectedCategories([]); setSelectedGrades([]); setOrganicOnly(false); setMaxPrice(50000); setMinRating(0); setDistance('Any') }}
                className="text-xs text-green-600 font-bold">Reset</button>
            </div>

            {/* Price Range */}
            <div>
              <p className="font-black text-sm text-gray-700 dark:text-gray-300 mb-3">Max Price: ₹{maxPrice.toLocaleString()}</p>
              <input type="range" min={0} max={50000} step={500} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-green-600" />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                <span>₹0</span><span>₹50,000</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="font-black text-sm text-gray-700 dark:text-gray-300 mb-3">Category</p>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)}
                      className="accent-green-600 rounded" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Organic */}
            <div className="flex items-center justify-between">
              <p className="font-black text-sm text-gray-700 dark:text-gray-300">Organic Only</p>
              <button onClick={() => setOrganicOnly(!organicOnly)}
                className={`w-12 h-6 rounded-full transition-colors ${organicOnly ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${organicOnly ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Grade */}
            <div>
              <p className="font-black text-sm text-gray-700 dark:text-gray-300 mb-3">Quality Grade</p>
              <div className="flex gap-2">
                {GRADES.map(g => (
                  <button key={g} onClick={() => toggleGrade(g)}
                    className={`flex-1 py-1.5 rounded-xl font-black text-sm border-2 transition-colors ${selectedGrades.includes(g) ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div>
              <p className="font-black text-sm text-gray-700 dark:text-gray-300 mb-3">Distance</p>
              <div className="space-y-2">
                {DISTANCES.map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="distance" checked={distance === d} onChange={() => setDistance(d)} className="accent-green-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">{d}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="font-black text-sm text-gray-700 dark:text-gray-300 mb-3">Min Rating</p>
              <div className="flex gap-2">
                {[0, 3, 4].map(r => (
                  <button key={r} onClick={() => setMinRating(r)}
                    className={`flex-1 py-1.5 rounded-xl font-black text-xs border-2 transition-colors ${minRating === r ? 'bg-green-600 border-green-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {r === 0 ? 'All' : `${r}★+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mb-4">{filtered.length} products found</p>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <span className="text-6xl">🌿</span>
              <p className="text-gray-500 font-black text-lg">No products found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters</p>
              <button onClick={() => { setSelectedCategories([]); setSelectedGrades([]); setOrganicOnly(false); setMaxPrice(50000); setMinRating(0); setDistance('Any') }}
                className="bg-green-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(product => (
                <Link href={`/kisan-bazaar/products/${product.id}`} key={product.id}>
                  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-200 dark:hover:border-green-800 transition-all cursor-pointer">
                    <div className={`h-28 bg-gradient-to-br ${product.color} relative flex items-center justify-center`}>
                      <span className="text-3xl">{product.emoji}</span>
                      {product.organic && (
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Leaf size={7} /> Organic
                        </span>
                      )}
                      <span className="absolute top-2 right-2 bg-white/90 text-gray-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        Grade {product.grade}
                      </span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white leading-tight line-clamp-2">{product.name}</h3>
                      <p className="text-green-600 font-black text-sm">₹{product.price}/{product.unit}</p>
                      <p className="text-xs text-gray-500 font-bold truncate">{product.seller}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 text-[10px] text-gray-400 font-bold">
                          <MapPin size={9} /> {product.location}
                        </div>
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-black">
                          <Star size={9} fill="currentColor" /> {product.rating}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                        <TrendingUp size={9} /> {product.distance}km away
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
