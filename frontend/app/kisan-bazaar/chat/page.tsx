'use client'

import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'

const CHATS = [
  {
    id: '1',
    product: 'Premium Basmati Rice',
    productId: '1',
    party: 'Suresh Traders',
    role: 'buyer',
    lastMsg: "₹41/kg is my final offer",
    lastPrice: '₹41/kg',
    time: '2 min ago',
    unread: 1,
    emoji: '🌾',
    color: 'from-yellow-400 to-amber-500',
  },
  {
    id: '2',
    product: 'Fresh Tomatoes',
    productId: '2',
    party: 'City Grocery Chain',
    role: 'seller',
    lastMsg: "Can you supply 200kg every week?",
    lastPrice: '₹20/kg',
    time: '1 hr ago',
    unread: 2,
    emoji: '🍅',
    color: 'from-red-400 to-rose-500',
  },
  {
    id: '3',
    product: 'Alphonso Mangoes',
    productId: '3',
    party: 'Mehta Exports',
    role: 'seller',
    lastMsg: "Deal accepted! Dispatching tomorrow.",
    lastPrice: '₹170/kg',
    time: '3 hr ago',
    unread: 0,
    emoji: '🥭',
    color: 'from-orange-400 to-yellow-500',
  },
  {
    id: '4',
    product: 'Organic Wheat',
    productId: '4',
    party: 'Health Bakery Co.',
    role: 'buyer',
    lastMsg: "I need 500kg of wheat. Best price?",
    lastPrice: '₹48/kg',
    time: 'Yesterday',
    unread: 0,
    emoji: '🌾',
    color: 'from-lime-400 to-green-500',
  },
  {
    id: '5',
    product: 'DAP Fertilizer',
    productId: '7',
    party: 'Krishi Supplies',
    role: 'buyer',
    lastMsg: "Please confirm the quantity available.",
    lastPrice: '₹1350/bag',
    time: '2 days ago',
    unread: 0,
    emoji: '🧪',
    color: 'from-blue-400 to-cyan-500',
  },
]

export default function ChatListPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/kisan-bazaar">
            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">💬 Negotiations</h1>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black px-3 py-1 rounded-full">
            {CHATS.reduce((acc, c) => acc + c.unread, 0)} unread
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-4 space-y-2">
        <p className="text-xs text-gray-400 font-bold px-1">Active price negotiations with buyers & sellers</p>
        {CHATS.map(chat => (
          <Link href={`/kisan-bazaar/chat/${chat.id}`} key={chat.id}>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 hover:border-green-200 dark:hover:border-green-800 transition-all cursor-pointer group">
              {/* Product Image */}
              <div className={`w-14 h-14 bg-gradient-to-br ${chat.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
                {chat.emoji}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="font-black text-sm text-gray-800 dark:text-white truncate">{chat.product}</p>
                  <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap flex-shrink-0">{chat.time}</span>
                </div>
                <p className="text-xs font-black text-gray-500 dark:text-gray-400 mb-1">{chat.party}</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 truncate">{chat.lastMsg}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                      {chat.lastPrice}
                    </span>
                    {chat.unread > 0 && (
                      <span className="w-5 h-5 bg-green-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full ${chat.role === 'buyer' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'}`}>
                  {"You're"} {chat.role === 'buyer' ? 'Buying' : 'Selling'}
                </span>
              </div>

              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0 group-hover:text-green-500 transition-colors" />
            </div>
          </Link>
        ))}
      </main>
    </div>
  )
}
