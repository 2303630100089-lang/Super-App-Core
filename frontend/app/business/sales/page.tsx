'use client'

import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  ShoppingBag, DollarSign, Package, RefreshCw,
  Download, Loader2, Receipt,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import clsx from 'clsx'

interface SaleSummary {
  totalRevenue: number
  totalOrders: number
  totalRefunds: number
  netRevenue: number
  avgOrderValue: number
  revenueChange: number   // % vs previous period
  orderChange: number
}

interface SaleItem {
  _id: string
  productName: string
  quantity: number
  amount: number
  status: 'completed' | 'refunded' | 'pending'
  createdAt: string
}

const RANGES = ['24h', '7d', '30d', '90d', 'All'] as const
type Range = typeof RANGES[number]

const BAR_MOCK = [55, 70, 45, 90, 60, 80, 40, 95, 75, 85, 65, 88]
const BAR_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BusinessSalesPage() {
  const { user } = useAuthStore()
  const [range, setRange] = useState<Range>('7d')

  const { data: summary, isLoading: summaryLoading } = useQuery<SaleSummary>({
    queryKey: ['business-sales-summary', user?.id, range],
    queryFn: async () => {
      const { data } = await api.get(`/business-dashboard/sales/summary/${user?.id}?range=${range}`)
      return data?.data ?? data
    },
    enabled: !!user?.id,
  })

  const { data: sales = [], isLoading: salesLoading } = useQuery<SaleItem[]>({
    queryKey: ['business-sales-list', user?.id, range],
    queryFn: async () => {
      const { data } = await api.get(`/business-dashboard/sales/${user?.id}?range=${range}`)
      return Array.isArray(data) ? data : (data?.data ?? [])
    },
    enabled: !!user?.id,
  })

  const isLoading = summaryLoading || salesLoading

  const statCards = useMemo(() => [
    {
      label: 'Net Revenue',
      value: `₹${(summary?.netRevenue ?? 0).toLocaleString('en-IN')}`,
      change: summary?.revenueChange ?? 0,
      color: 'text-emerald-600',
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: (summary?.totalOrders ?? 0).toString(),
      change: summary?.orderChange ?? 0,
      color: 'text-blue-600',
      icon: ShoppingBag,
    },
    {
      label: 'Avg Order Value',
      value: `₹${(summary?.avgOrderValue ?? 0).toFixed(0)}`,
      change: 0,
      color: 'text-violet-600',
      icon: Package,
    },
    {
      label: 'Refunds',
      value: `₹${(summary?.totalRefunds ?? 0).toLocaleString('en-IN')}`,
      change: 0,
      color: 'text-red-600',
      icon: RefreshCw,
    },
  ], [summary])

  const statusStyle = (status: SaleItem['status']) => {
    const map = {
      completed: 'bg-emerald-500/20 text-emerald-400',
      refunded: 'bg-red-500/20 text-red-400',
      pending: 'bg-amber-500/20 text-amber-400',
    }
    return map[status] ?? map.pending
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="bg-teal-600 dark:bg-teal-700 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Sales & Revenue</h1>
            <p className="text-teal-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Track your earnings</p>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Range selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={clsx(
                'px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                range === r ? 'bg-white text-teal-600 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 -mt-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(stat => {
            const up = stat.change >= 0
            return (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <div className={clsx('p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800', stat.color)}>
                    <stat.icon size={12} />
                  </div>
                </div>
                {isLoading ? (
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</p>
                )}
                {stat.change !== 0 && (
                  <div className={clsx('flex items-center gap-1 mt-1', up ? 'text-emerald-500' : 'text-red-500')}>
                    {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    <span className="text-[9px] font-black">{Math.abs(stat.change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Revenue bar chart (visual) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Monthly Revenue Trend</h2>
          </div>
          <div className="h-36 flex items-end gap-1.5 px-1">
            {BAR_MOCK.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-teal-100 dark:bg-teal-900/40 rounded-t-lg hover:bg-teal-500 transition-colors relative"
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[7px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ₹{(h * 1000).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1">
            {BAR_LABELS.filter((_, i) => i % 3 === 0).map(l => (
              <span key={l} className="text-[8px] font-black text-slate-400 uppercase">
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Recent Transactions</h2>
            <button className="flex items-center gap-1 text-[9px] font-black text-teal-600 uppercase tracking-widest">
              <Download size={12} /> Export
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-teal-500" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
              <Receipt size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-wide">No sales in this period</p>
            </div>
          ) : (
            sales.map(sale => (
              <div
                key={sale._id}
                className="bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate">{sale.productName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Qty {sale.quantity} • {new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-800 dark:text-white">
                    ₹{sale.amount.toLocaleString('en-IN')}
                  </p>
                  <span className={clsx('text-[8px] font-black px-2 py-0.5 rounded-lg uppercase', statusStyle(sale.status))}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
