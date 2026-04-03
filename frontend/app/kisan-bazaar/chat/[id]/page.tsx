'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Mic, X, Check, ChevronRight } from 'lucide-react'

type Message = {
  id: number
  sender: 'me' | 'them'
  text?: string
  offer?: { price: string; qty: string }
  time: string
  read?: boolean
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, sender: 'them', text: "I need 500kg of wheat. What's your best price?", time: '10:02 AM', read: true },
  { id: 2, sender: 'me', text: 'For 500kg, I can offer ₹42/kg. Quality Grade A, freshly harvested.', time: '10:05 AM', read: true },
  { id: 3, sender: 'them', offer: { price: '₹39/kg', qty: '500 kg' }, time: '10:08 AM', read: true },
  { id: 4, sender: 'me', text: '₹39 is too low. My cost is already ₹36/kg. Let me do ₹41/kg — final offer.', time: '10:10 AM', read: true },
  { id: 5, sender: 'them', offer: { price: '₹40/kg', qty: '500 kg' }, time: '10:12 AM', read: true },
  { id: 6, sender: 'me', text: '₹41/kg is my final offer. I can include free delivery to your location.', time: '10:15 AM', read: false },
]

export default function ChatDetailPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerQty, setOfferQty] = useState('')
  const [showConfirm, setShowConfirm] = useState<'accept' | 'reject' | null>(null)
  const [dealDone, setDealDone] = useState<'accepted' | 'rejected' | null>(null)
  const [toast, setToast] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: prev.length + 1, sender: 'me', text: input, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }])
    setInput('')
  }

  const sendOffer = () => {
    if (!offerPrice || !offerQty) return
    setMessages(prev => [...prev, {
      id: prev.length + 1, sender: 'me', offer: { price: offerPrice, qty: offerQty }, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }])
    setShowOfferModal(false)
    setOfferPrice('')
    setOfferQty('')
  }

  const handleDeal = (type: 'accept' | 'reject') => {
    setDealDone(type)
    setShowConfirm(null)
    showToast(type === 'accept' ? '🎉 Deal accepted! Order created.' : '❌ Deal rejected.')
    if (type === 'accept') {
      setMessages(prev => [...prev, {
        id: prev.length + 1, sender: 'me', text: '✅ Deal accepted! I will arrange the delivery.', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }])
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 py-3 z-20 flex items-center gap-3 flex-shrink-0">
        <Link href="/kisan-bazaar/chat">
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          🌾
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-gray-800 dark:text-white truncate">Premium Basmati Rice</p>
          <p className="text-xs text-gray-500 font-bold">Suresh Traders</p>
        </div>
        <Link href="/kisan-bazaar/products/1">
          <button className="text-green-600 text-xs font-black flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-xl">
            View Product <ChevronRight size={12} />
          </button>
        </Link>
      </header>

      {/* Deal Done Banner */}
      {dealDone && (
        <div className={`px-4 py-3 flex items-center justify-center gap-2 text-sm font-black ${dealDone === 'accepted' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {dealDone === 'accepted' ? '🎉 Deal Accepted — Order #KB025 Created' : '❌ Negotiation Closed'}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            {msg.offer ? (
              /* Offer Bubble */
              <div className={`max-w-[70%] rounded-2xl overflow-hidden border-2 ${
                msg.sender === 'me'
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                  : 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
              }`}>
                <div className={`px-4 py-2 text-white text-xs font-black ${msg.sender === 'me' ? 'bg-green-500' : 'bg-orange-500'}`}>
                  {msg.sender === 'me' ? '💰 My Offer' : '💰 Counter Offer'}
                </div>
                <div className="p-4">
                  <p className={`text-2xl font-black ${msg.sender === 'me' ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'}`}>{msg.offer.price}</p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Quantity: {msg.offer.qty}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{msg.time}</p>
                </div>
              </div>
            ) : (
              /* Text Bubble */
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                msg.sender === 'me'
                  ? 'bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-br-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'me' ? 'text-green-200' : 'text-gray-400'}`}>
                  <span className="text-[10px]">{msg.time}</span>
                  {msg.sender === 'me' && (
                    <Check size={10} className={msg.read ? 'text-green-200' : 'text-green-400'} />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Deal Accept/Reject */}
      {!dealDone && (
        <div className="px-4 py-2 bg-white/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          <button onClick={() => setShowConfirm('reject')}
            className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-500 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1">
            <X size={14} /> Reject Deal
          </button>
          <button onClick={() => setShowConfirm('accept')}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1">
            <Check size={14} /> Accept Deal
          </button>
        </div>
      )}

      {/* Bottom Input */}
      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowOfferModal(true)}
            className="px-3 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl font-black text-xs whitespace-nowrap flex items-center gap-1">
            💰 Make Offer
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm outline-none dark:text-white"
            />
          </div>
          <button onClick={() => showToast('Voice message coming soon 🎤')}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl">
            <Mic size={18} />
          </button>
          <button onClick={sendMessage}
            className="p-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl disabled:opacity-50"
            disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white text-lg">💰 Make an Offer</h3>
              <button onClick={() => setShowOfferModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500"><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Your Price (₹/kg)</label>
              <input type="text" placeholder="e.g. ₹42/kg" value={offerPrice} onChange={e => setOfferPrice(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 mb-1.5 block uppercase tracking-wide">Quantity</label>
              <input type="text" placeholder="e.g. 500 kg" value={offerQty} onChange={e => setOfferQty(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm outline-none dark:text-white focus:ring-2 ring-green-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOfferModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3 rounded-2xl font-black text-sm">Cancel</button>
              <button onClick={sendOffer}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-2xl font-black text-sm">Send Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 space-y-4 max-w-sm w-full text-center">
            <div className="text-5xl">{showConfirm === 'accept' ? '🤝' : '❌'}</div>
            <h3 className="font-black text-xl text-gray-900 dark:text-white">
              {showConfirm === 'accept' ? 'Accept this deal?' : 'Reject this negotiation?'}
            </h3>
            <p className="text-sm text-gray-500">
              {showConfirm === 'accept' ? 'An order will be created and both parties will be notified.' : 'This will close the negotiation permanently.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-3 rounded-2xl font-black text-sm">Cancel</button>
              <button onClick={() => handleDeal(showConfirm)}
                className={`flex-1 py-3 rounded-2xl font-black text-sm text-white ${showConfirm === 'accept' ? 'bg-green-600' : 'bg-red-500'}`}>
                {showConfirm === 'accept' ? 'Yes, Accept' : 'Yes, Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
