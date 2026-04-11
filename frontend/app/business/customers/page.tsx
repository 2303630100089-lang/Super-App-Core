'use client'

import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { Users, Search, Mail, Phone, ShoppingBag, Star, ArrowUpRight, Loader2, UserCheck } from 'lucide-react'
import { useState, useMemo } from 'react'
import clsx from 'clsx'

interface Customer {
  _id: string
  name: string
  email: string
  phone?: string
  totalOrders: number
  totalSpent: number
  lastOrderAt: string
  rating?: number
  status: 'active' | 'inactive' | 'blocked'
}

export default function BusinessCustomersPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all')

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['business-customers', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/business-dashboard/customers/${user?.id}`)
      return Array.isArray(data) ? data : (data?.data ?? [])
    },
    enabled: !!user?.id,
  })

  const filtered = useMemo(() => {
    let list = customers
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        c =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q),
      )
    }
    return list
  }, [customers, statusFilter, search])

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0)
  const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders ?? 0), 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const statusBadge = (status: Customer['status']) => {
    const map = {
      active: 'bg-emerald-500/20 text-emerald-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      blocked: 'bg-red-500/20 text-red-400',
    }
    return map[status] ?? map.inactive
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="bg-pink-600 dark:bg-pink-700 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Customers</h1>
            <p className="text-pink-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Your buyer base
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <Users size={24} />
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Customers', value: totalCustomers.toString(), icon: Users },
            { label: 'Active Buyers', value: activeCustomers.toString(), icon: UserCheck },
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: ShoppingBag },
            { label: 'Avg Order Value', value: `₹${avgOrderValue.toFixed(0)}`, icon: ArrowUpRight },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
              <p className="text-[9px] font-black text-pink-100 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-lg font-black">{stat.value}</p>
            </div>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 shadow-sm"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['all', 'active', 'inactive', 'blocked'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={clsx(
                'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border',
                statusFilter === s
                  ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-pink-400',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-pink-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Users size={36} className="text-slate-300" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-wide">No customers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(customer => (
              <div
                key={customer._id}
                className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                  {customer.name?.[0]?.toUpperCase() ?? '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{customer.name}</p>
                    <span className={clsx('text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase', statusBadge(customer.status))}>
                      {customer.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Mail size={10} /> {customer.email}
                    </span>
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={10} /> {customer.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-wider">
                    <span className="text-emerald-500 flex items-center gap-1">
                      <ShoppingBag size={10} /> {customer.totalOrders ?? 0} orders
                    </span>
                    <span className="text-blue-500">₹{(customer.totalSpent ?? 0).toLocaleString('en-IN')}</span>
                    {customer.rating != null && (
                      <span className="text-amber-500 flex items-center gap-1">
                        <Star size={10} className="fill-amber-500" /> {customer.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Last order */}
                {customer.lastOrderAt && (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Last order</p>
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                      {new Date(customer.lastOrderAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
