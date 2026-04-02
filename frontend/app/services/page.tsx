'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Search, Star, MapPin, Filter, MessageCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import api from '@/services/api'
import useAuthStore from '@/store/useAuthStore'

const FALLBACK_PROVIDERS = [
  { _id: '1', name: 'Amit Kumar', category: 'Plumber', rating: 4.8, reviewCount: 156, hourlyRate: 200, avatar: 'https://i.pravatar.cc/150?u=amit' },
  { _id: '2', name: 'Sarah Wilson', category: 'Graphic Designer', rating: 4.9, reviewCount: 89, hourlyRate: 450, avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { _id: '3', name: 'David Chen', category: 'Electrician', rating: 4.7, reviewCount: 210, hourlyRate: 300, avatar: 'https://i.pravatar.cc/150?u=david' },
  { _id: '4', name: 'Lisa Ray', category: 'Tutor (Maths)', rating: 5.0, reviewCount: 45, hourlyRate: 250, avatar: 'https://i.pravatar.cc/150?u=lisa' },
]

export default function ServicesHubPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')

  const { data: providers = FALLBACK_PROVIDERS, isLoading } = useQuery({
    queryKey: ['top-providers'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/economy/providers/top')
        return (data.providers || data.data || []).length > 0 ? (data.providers || data.data) : FALLBACK_PROVIDERS
      } catch {
        return FALLBACK_PROVIDERS
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const filtered = providers.filter((p: any) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      <header className="p-6 border-b dark:border-gray-800">
        <h1 className="text-2xl font-bold dark:text-white mb-4">Local Services</h1>
        <div className="flex gap-2">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search for services (Plumber, Designer...)"
                    className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
            </div>
            <button className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-gray-600 dark:text-gray-400"><Filter size={20} /></button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold dark:text-white">Featured Professionals</h2>
            <button className="text-blue-600 text-xs font-bold">Near You</button>
        </div>

        {isLoading && <div className="text-center py-8"><Loader2 className="mx-auto animate-spin text-blue-500" size={28}/></div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((pro: any) => (
                <div key={pro._id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm flex gap-4">
                    <img src={pro.avatar || pro.profileImage || `https://i.pravatar.cc/150?u=${pro._id}`} className="w-20 h-20 rounded-xl object-cover" alt="" />
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold dark:text-white">{pro.name}</h3>
                                <p className="text-xs text-blue-600 font-medium">{pro.category || pro.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold dark:text-white text-sm">₹{pro.hourlyRate || pro.rate}/hr</p>
                                {pro.distance && (
                                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                      <MapPin size={10} />
                                      <span>{pro.distance} km</span>
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                                <Star size={14} fill="currentColor" />
                                <span>{pro.rating}</span>
                                <span className="text-gray-400 font-normal">({pro.reviewCount || pro.reviews})</span>
                            </div>
                            <Link href={`/chat/${pro.userId || pro._id}`} className="ml-auto bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                                <MessageCircle size={14} />
                                Hire
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-2">
                <Briefcase className="text-blue-600" size={24} />
                <h3 className="font-bold dark:text-white text-lg">Become a Freelancer</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Earn money by offering your services to millions of users on SuperApp.</p>
            <Link href="/settings" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-transform hover:scale-105">
              Enable Business Mode
            </Link>
        </div>
      </div>
    </div>
  )
}

