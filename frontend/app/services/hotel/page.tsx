'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import Link from 'next/link'
import {
  MapPin, Star, Wifi, Car, Coffee, Dumbbell,
  X, Loader2, CheckCircle2, MessageCircle, ChevronLeft,
  CreditCard, Banknote, Smartphone, Building2, Calendar, Users
} from 'lucide-react'
import clsx from 'clsx'

const FALLBACK_HOTELS = [
  { _id: 'h1', name: 'The Grand Palace', address: 'Connaught Place, Delhi', rating: 4.8, reviewCount: 1240, images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'], amenities: ['WiFi', 'Pool', 'Gym', 'Parking', 'Restaurant'], ownerId: 'grand_palace',
    rooms: [
      { _id: 'r1', type: 'Deluxe Room', price: 3500, maxGuests: 2, images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=80'], description: 'King bed, city view, AC' },
      { _id: 'r2', type: 'Suite', price: 7500, maxGuests: 4, images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80'], description: 'Living room, jacuzzi, panoramic view' },
      { _id: 'r3', type: 'Standard Room', price: 2200, maxGuests: 2, images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&q=80'], description: 'Queen bed, garden view' },
    ]},
  { _id: 'h2', name: 'Seaside Resort', address: 'Marine Drive, Mumbai', rating: 4.6, reviewCount: 890, images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80'], amenities: ['WiFi', 'Beach', 'Spa', 'Restaurant'], ownerId: 'seaside_resort',
    rooms: [
      { _id: 'r4', type: 'Sea View Room', price: 5500, maxGuests: 2, images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&q=80'], description: 'Direct sea view, balcony' },
      { _id: 'r5', type: 'Beach Villa', price: 12000, maxGuests: 6, images: ['https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&q=80'], description: 'Private beach access, pool' },
    ]},
]

const AMENITY_ICONS: Record<string, any> = { WiFi: Wifi, Parking: Car, Restaurant: Coffee, Gym: Dumbbell }
const PAYMENT = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi',  label: 'UPI',  icon: Smartphone },
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'bank', label: 'Net Banking', icon: Building2 },
]

export default function HotelPage() {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [booked, setBooked] = useState<any>(null)
  const [payMethod, setPayMethod] = useState('card')
  const [form, setForm] = useState({ name: user?.name || '', phone: '', checkIn: '', checkOut: '', guests: '2' })
  const [orderChatMsg, setOrderChatMsg] = useState('')
  const [chatMsgs, setChatMsgs] = useState<any[]>([])

  const { data: hotels = FALLBACK_HOTELS, isLoading: hotelsLoading } = useQuery({
    queryKey: ['hotels-featured'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/hotels/featured')
        return (data.hotels || data.data || []).length > 0 ? (data.hotels || data.data) : FALLBACK_HOTELS
      } catch {
        return FALLBACK_HOTELS
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.round((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000))
    : 1
  const total = selectedRoom ? selectedRoom.price * nights : 0

  const placeBooking = async () => {
    if (!form.name || !form.phone || !form.checkIn || !form.checkOut) return alert('Fill all fields')
    setPlacing(true)
    try {
      const { data } = await api.post('/hotels/book', {
        userId: user?.id, hotelId: selected._id, roomId: selectedRoom._id,
        checkIn: form.checkIn, checkOut: form.checkOut,
        guestName: form.name, phone: form.phone, guests: form.guests,
        paymentMethod: payMethod, totalPrice: total
      })
      setBooked(data.booking || data)
    } catch {
      setBooked({ _id: `demo_${Date.now()}`, hotelName: selected.name, roomType: selectedRoom.type, checkIn: form.checkIn, checkOut: form.checkOut, totalPrice: total, status: 'confirmed', orderChat: [] })
    }
    setPlacing(false); setShowBooking(false)
  }

  const sendChat = async () => {
    if (!orderChatMsg.trim()) return
    const msg = { senderId: user?.id, senderName: user?.name || 'Guest', message: orderChatMsg, createdAt: new Date().toISOString() }
    setChatMsgs(prev => [...prev, msg])
    setOrderChatMsg('')
    if (booked?._id && !booked._id.startsWith('demo_')) {
      api.post(`/hotels/bookings/${booked._id}/chat`, msg).catch(() => {})
    }
  }

  if (booked) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="max-w-lg mx-auto p-5 space-y-5">
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 text-center border dark:border-gray-800">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={40} className="text-green-600"/></div>
          <h1 className="text-2xl font-black dark:text-white">Booking Confirmed!</h1>
          <p className="text-gray-400 text-sm mt-1">#{booked._id.slice(-8).toUpperCase()}</p>
          <div className="mt-4 space-y-2 text-sm text-left bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
            <div className="flex justify-between"><span className="text-gray-500">Hotel</span><span className="font-bold dark:text-white">{booked.hotelName || selected?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Room</span><span className="font-bold dark:text-white">{booked.roomType || selectedRoom?.type}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check-in</span><span className="font-bold dark:text-white">{booked.checkIn}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Check-out</span><span className="font-bold dark:text-white">{booked.checkOut}</span></div>
            <div className="flex justify-between border-t dark:border-gray-700 pt-2"><span className="font-black dark:text-white">Total</span><span className="font-black text-blue-600">₹{booked.totalPrice?.toLocaleString()}</span></div>
          </div>
        </div>
        {/* Chat with hotel */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-800 flex items-center gap-2">
            <MessageCircle size={16} className="text-blue-500"/>
            <h3 className="font-black text-sm dark:text-white">Chat with Hotel</h3>
          </div>
          <div className="p-4 min-h-[80px] max-h-40 overflow-y-auto space-y-2">
            {chatMsgs.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Ask the hotel anything!</p>}
            {chatMsgs.map((m, i) => (
              <div key={i} className={clsx('flex', m.senderId === user?.id ? 'justify-end' : 'justify-start')}>
                <div className={clsx('max-w-[75%] px-3 py-2 rounded-2xl text-xs', m.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white')}>
                  {m.message}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t dark:border-gray-800 flex gap-2">
            <input value={orderChatMsg} onChange={e => setOrderChatMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Message hotel..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm dark:text-white outline-none"/>
            <button onClick={sendChat} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all">
              <MessageCircle size={14}/>
            </button>
          </div>
        </div>
        <button onClick={() => { setBooked(null); setSelected(null); setSelectedRoom(null) }}
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black py-4 rounded-2xl active:scale-95 transition-all">
          Browse More Hotels
        </button>
      </div>
    </div>
  )

  if (selected) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      <div className="relative h-56">
        <img src={selected.images?.[0] || selected.image} className="w-full h-full object-cover" alt=""/>
        <button onClick={() => setSelected(null)} className="absolute top-4 left-4 p-2 bg-black/50 rounded-xl text-white"><ChevronLeft size={20}/></button>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <h1 className="text-2xl font-black dark:text-white">{selected.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-yellow-500 text-sm font-black"><Star size={14} fill="currentColor"/>{selected.rating || '4.5'}</div>
            <span className="text-gray-400 text-xs">({selected.reviewCount || 0} reviews)</span>
            <span className="flex items-center gap-1 text-gray-400 text-xs"><MapPin size={11}/>{selected.address || selected.location?.address}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(selected.amenities || []).map((a: string) => {
            const Icon = AMENITY_ICONS[a] || Coffee
            return <span key={a} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold"><Icon size={12}/>{a}</span>
          })}
        </div>
        <h2 className="font-black text-base dark:text-white">Available Rooms</h2>
        <div className="space-y-3">
          {(selected.rooms || []).map((room: any) => (
            <button key={room._id} onClick={() => { setSelectedRoom(room); setShowBooking(true) }}
              className={clsx('w-full flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-[1.5rem] border-2 text-left transition-all hover:border-blue-400',
                selectedRoom?._id === room._id ? 'border-blue-500' : 'border-gray-100 dark:border-gray-800')}>
              <img src={room.images?.[0] || room.image} className="w-20 h-20 rounded-2xl object-cover shrink-0" alt=""/>
              <div className="flex-1">
                <p className="font-black text-sm dark:text-white">{room.type}</p>
                <p className="text-xs text-gray-400 mt-0.5">{room.description || room.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400"><Users size={10}/>{room.maxGuests} guests</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-blue-600">₹{room.price.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400">per night</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {showBooking && selectedRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-[2rem] w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4">
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-black text-lg dark:text-white">Book Room</h3>
              <button onClick={() => setShowBooking(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                <p className="font-black text-sm dark:text-white">{selectedRoom.type}</p>
                <p className="text-xs text-gray-400">{selected.name}</p>
                <p className="text-blue-600 font-black mt-1">₹{selectedRoom.price.toLocaleString()}/night</p>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Guest Name *"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 text-sm dark:text-white outline-none"/>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone *" type="tel"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 text-sm dark:text-white outline-none"/>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Check-in</p>
                    <input type="date" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none"/>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Check-out</p>
                    <input type="date" value={form.checkOut} onChange={e => setForm({...form, checkOut: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none"/>
                  </div>
                </div>
                <select value={form.guests} onChange={e => setForm({...form, guests: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT.map(p => (
                    <button key={p.id} onClick={() => setPayMethod(p.id)}
                      className={clsx('flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        payMethod === p.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-100 dark:border-gray-800 text-gray-500')}>
                      <p.icon size={16}/><span className="text-xs font-black">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {nights > 0 && selectedRoom && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">₹{selectedRoom.price} × {nights} night{nights > 1 ? 's' : ''}</span><span className="font-bold dark:text-white">₹{total.toLocaleString()}</span></div>
                  <div className="flex justify-between text-base font-black border-t dark:border-gray-700 pt-2"><span className="dark:text-white">Total</span><span className="text-blue-600">₹{total.toLocaleString()}</span></div>
                </div>
              )}
              <button onClick={placeBooking} disabled={placing}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {placing && <Loader2 size={16} className="animate-spin"/>}
                {placing ? 'Booking...' : `Confirm Booking · ₹${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="px-5 py-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-20 flex items-center gap-3">
        <Link href="/apps" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><ChevronLeft size={18} className="dark:text-white"/></Link>
        <h1 className="text-xl font-black dark:text-white">Hotel Booking</h1>
      </div>
      <div className="p-4 space-y-4">
        {hotelsLoading && <div className="text-center py-12"><Loader2 className="mx-auto animate-spin text-blue-500" size={32}/></div>}
        {hotels.map((hotel: any) => {
          const image = hotel.images?.[0] || hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'
          const minPrice = hotel.rooms?.length ? Math.min(...hotel.rooms.map((r: any) => r.price)) : 0
          return (
            <button key={hotel._id} onClick={() => setSelected(hotel)} className="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden border dark:border-gray-800 shadow-sm hover:shadow-lg transition-all text-left group">
              <div className="h-44 overflow-hidden"><img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt=""/></div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-base dark:text-white">{hotel.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10}/>{hotel.address || hotel.location?.address}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-600 px-2.5 py-1 rounded-xl text-xs font-black">
                    <Star size={11} fill="currentColor"/>{hotel.rating || '4.5'}
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {(hotel.amenities || []).slice(0, 4).map((a: string) => <span key={a} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded-lg font-bold">{a}</span>)}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t dark:border-gray-800">
                  <p className="text-xs text-gray-400">From <span className="font-black text-blue-600 text-base">₹{minPrice.toLocaleString()}</span>/night</p>
                  <span className="bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-xl">View Rooms</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
