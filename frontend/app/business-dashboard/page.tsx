'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { 
  LayoutDashboard, ShoppingCart, TrendingUp, Users, Package, 
  Settings, MapPin, Calendar, 
  Clock, CheckCircle2, XCircle, MessageCircle,
  Hotel, Utensils, Car, Info, Loader2,
  BarChart2, Megaphone, Star, DollarSign, Target, Zap, Globe,
  FileText, Tag, Gift, Percent, RefreshCw, Eye, Bell,
  ChevronRight, PlusCircle, Image as ImageIcon, Play, Pause,
  ShieldCheck, Truck, Store, BookOpen, TrendingDown, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

export default function BusinessDashboardPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['business-summary', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/business-dashboard/summary/${user?.id}`)
      return data.data
    },
    enabled: !!user?.id
  })

  // --- Mutations ---
  const acceptRideMutation = useMutation({
    mutationFn: async (rideId: string) => api.patch(`/rides/${rideId}/accept`, { driverId: user?.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-summary'] })
  })

  const rejectRideMutation = useMutation({
    mutationFn: async (rideId: string) => api.patch(`/rides/${rideId}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-summary'] })
  })

  const updateTableStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => 
      api.patch(`/food/restaurants/table-bookings/${bookingId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-summary'] })
  })

  const updateHotelStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => 
      api.patch(`/hotels/bookings/${bookingId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business-summary'] })
  })

  if (isLoading) return <div className="p-8 text-center animate-pulse font-black uppercase tracking-widest text-gray-400">Loading Business Hub...</div>
  if (error) return <div className="p-8 text-center text-red-500 font-bold">Business mode not enabled or service error.</div>

  const { profile, activeData, revenue, orders } = dashboard || { profile: {}, activeData: {}, revenue: {}, orders: {} }

  const renderActiveSection = () => {
    if (activeTab === 'overview') return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <section className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
               <TrendingUp className="text-blue-600" /> Earnings Analytics
            </h3>
            <div className="h-64 flex items-end justify-around gap-2 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl">
               {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                 <div key={i} className="w-full bg-blue-600 rounded-t-xl hover:bg-blue-500 transition-all relative group cursor-pointer" style={{ height: `${h}%` }}>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity font-black">₹{h * 100}</div>
                 </div>
               ))}
            </div>
         </section>

         <section className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800 shadow-sm">
            <h3 className="text-xl font-black mb-6 uppercase tracking-tighter flex items-center justify-between">
               Live Updates <span className="w-3 h-3 bg-green-500 rounded-full animate-ping" />
            </h3>
            <div className="space-y-4">
               {activeData?.orders?.length > 0 ? activeData.orders.slice(0, 3).map((ord: any) => (
                 <div key={ord._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border dark:border-gray-700">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center font-black">#</div>
                       <div>
                          <p className="font-black text-sm uppercase">Order {ord._id.slice(-6)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{ord.status}</p>
                       </div>
                    </div>
                    <Link href={`/chat/${ord.userId}`} className="p-2.5 bg-white dark:bg-gray-700 rounded-xl text-blue-600 shadow-sm border border-gray-100 dark:border-gray-600">
                       <MessageCircle size={18} />
                    </Link>
                 </div>
               )) : (
                 <div className="text-center py-10 opacity-30">
                    <Info className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase">No active transactions</p>
                 </div>
               )}
            </div>
         </section>
      </div>
    )

    if (activeTab === 'ads') return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Ads Manager <span className="text-xs text-blue-500 font-bold normal-case tracking-normal">(Meta-Style)</span></h2>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
            <PlusCircle size={16} /> Create Campaign
          </button>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Reach', value: '24,830', change: '+18%', up: true, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Impressions', value: '1.2M', change: '+32%', up: true, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-500/10' },
            { label: 'Clicks (CTR)', value: '3.4%', change: '-0.2%', up: false, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: 'Ad Spend', value: '₹12,400', change: '+5%', up: true, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800 shadow-sm">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-black dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
              <div className={clsx('flex items-center gap-1 text-[10px] font-black mt-2', stat.up ? 'text-emerald-500' : 'text-red-500')}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Active Campaigns */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 overflow-hidden">
          <div className="px-8 py-6 border-b dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tighter">Active Campaigns</h3>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">3 Running</span>
          </div>
          <div className="divide-y dark:divide-gray-800">
            {[
              { name: 'Summer Sale Campaign', type: 'Conversion', budget: '₹5,000', spent: '₹3,240', reach: '12,400', status: 'active' },
              { name: 'Brand Awareness Q2', type: 'Reach', budget: '₹8,000', spent: '₹6,100', reach: '28,900', status: 'active' },
              { name: 'New Product Launch', type: 'Traffic', budget: '₹3,500', spent: '₹900', reach: '4,200', status: 'paused' },
            ].map(campaign => (
              <div key={campaign.name} className="flex items-center justify-between px-8 py-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={clsx('w-3 h-3 rounded-full', campaign.status === 'active' ? 'bg-emerald-500' : 'bg-yellow-500')} />
                  <div>
                    <p className="font-black text-sm dark:text-white">{campaign.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{campaign.type} • Reach: {campaign.reach}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs font-black dark:text-white">{campaign.spent}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">of {campaign.budget}</p>
                  </div>
                  <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-blue-600 transition-colors">
                    {campaign.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><Users size={18} className="text-blue-600" /> Audience Demographics</h3>
            <div className="space-y-3">
              {[
                { label: '18-24 years', pct: 38 }, { label: '25-34 years', pct: 42 },
                { label: '35-44 years', pct: 14 }, { label: '45+ years', pct: 6 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs font-black mb-1">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="dark:text-white">{row.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><MapPin size={18} className="text-blue-600" /> Top Locations</h3>
            <div className="space-y-3">
              {[
                { city: 'Mumbai', pct: 28 }, { city: 'Delhi NCR', pct: 22 },
                { city: 'Bengaluru', pct: 19 }, { city: 'Hyderabad', pct: 14 }, { city: 'Other', pct: 17 },
              ].map(row => (
                <div key={row.city} className="flex items-center justify-between text-xs font-black">
                  <span className="text-gray-500">{row.city}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="dark:text-white w-8 text-right">{row.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )

    if (activeTab === 'store') return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Store Manager <span className="text-xs text-amber-500 font-bold normal-case tracking-normal">(Amazon Seller Style)</span></h2>
          <button className="flex items-center gap-2 bg-amber-500 text-black px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all">
            <PlusCircle size={16} /> Add Product
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Listings', value: '148', icon: Package, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { label: 'Pending Shipments', value: '23', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: 'Returns Requested', value: '4', icon: RefreshCw, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Seller Rating', value: '4.8★', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800 shadow-sm">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-2xl font-black dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Product Performance */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 overflow-hidden">
          <div className="px-8 py-6 border-b dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter">Top Products by Sales</h3>
          </div>
          <div className="divide-y dark:divide-gray-800">
            {[
              { name: 'Wireless Earbuds Pro', sku: 'SKU-4421', sold: 142, revenue: '₹1,42,000', stock: 38, trend: 'up' },
              { name: 'Smart Watch Series 3', sku: 'SKU-3892', sold: 98, revenue: '₹88,200', stock: 12, trend: 'up' },
              { name: 'Laptop Stand Aluminium', sku: 'SKU-5501', sold: 67, revenue: '₹33,500', stock: 54, trend: 'down' },
              { name: 'USB-C Hub 7-in-1', sku: 'SKU-2244', sold: 51, revenue: '₹25,500', stock: 89, trend: 'up' },
            ].map(product => (
              <div key={product.sku} className="flex items-center px-8 py-5 gap-6 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm dark:text-white truncate">{product.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{product.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black dark:text-white">{product.revenue}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{product.sold} sold</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={clsx('text-xs font-black', product.stock < 15 ? 'text-red-500' : 'text-emerald-500')}>{product.stock} left</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Stock</p>
                </div>
                <div className={clsx('shrink-0', product.trend === 'up' ? 'text-emerald-500' : 'text-red-500')}>
                  {product.trend === 'up' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FBA / Returns Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> Return Requests</h3>
            {[
              { item: 'USB-C Hub 7-in-1', reason: 'Item not as described', date: '2 hours ago', status: 'pending' },
              { item: 'Smart Watch', reason: 'Defective product', date: '1 day ago', status: 'approved' },
            ].map(ret => (
              <div key={ret.item} className="flex items-center justify-between py-3 border-b dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-black text-sm dark:text-white">{ret.item}</p>
                  <p className="text-[10px] text-gray-400">{ret.reason} • {ret.date}</p>
                </div>
                <span className={clsx('text-[9px] font-black uppercase px-2 py-1 rounded-full', ret.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400')}>
                  {ret.status}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-500" /> Seller Health Score</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-black text-emerald-500">94</div>
              <div>
                <p className="text-xs font-black uppercase text-emerald-500">Excellent</p>
                <p className="text-[10px] text-gray-400">Based on last 90 days performance</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'On-Time Dispatch', score: '98%', ok: true },
                { label: 'Return Rate', score: '2.1%', ok: true },
                { label: 'Customer Response', score: '96%', ok: true },
                { label: 'Negative Feedback', score: '1.4%', ok: true },
              ].map(metric => (
                <div key={metric.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{metric.label}</span>
                  <span className={clsx('font-black', metric.ok ? 'text-emerald-500' : 'text-red-500')}>{metric.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )

    if (activeTab === 'delivery') return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Delivery Hub <span className="text-xs text-orange-500 font-bold normal-case tracking-normal">(Swiggy Style)</span></h2>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Restaurant Online
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Live Orders', value: '8', icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10', urgent: true },
            { label: 'Avg Prep Time', value: '22 min', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { label: "Today's Orders", value: '67', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { label: "Today's Revenue", value: '₹18,450', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-500/10' },
          ].map(stat => (
            <div key={stat.label} className={clsx("bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800 shadow-sm", stat.urgent && 'border-red-500/30')}>
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon size={20} className={clsx(stat.color, stat.urgent && 'animate-pulse')} />
              </div>
              <p className="text-2xl font-black dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Live Order Queue */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 overflow-hidden">
          <div className="px-8 py-6 border-b dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tighter">Live Order Queue</h3>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
          <div className="divide-y dark:divide-gray-800">
            {[
              { id: 'ORD-8821', items: ['Butter Chicken x2', 'Naan x4'], time: '2 min ago', prep: '15 min', status: 'new', zone: 'Zone A' },
              { id: 'ORD-8820', items: ['Biryani x1', 'Raita x1', 'Gulab Jamun x2'], time: '8 min ago', prep: '8 min', status: 'preparing', zone: 'Zone B' },
              { id: 'ORD-8819', items: ['Pizza Margherita x2'], time: '18 min ago', prep: '2 min', status: 'ready', zone: 'Zone A' },
            ].map(order => (
              <div key={order.id} className="px-8 py-6 flex items-center gap-6">
                <div className={clsx('w-3 h-3 rounded-full shrink-0',
                  order.status === 'new' ? 'bg-blue-500 animate-pulse' :
                  order.status === 'preparing' ? 'bg-yellow-500' : 'bg-emerald-500'
                )} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-black text-sm dark:text-white">{order.id}</p>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{order.zone}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-bold">{order.items.join(', ')}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{order.time} • Est. prep: {order.prep}</p>
                </div>
                <div className="flex gap-2">
                  {order.status === 'new' && (
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">
                      Accept
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all">
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 transition-all">
                      Dispatch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><BookOpen size={18} className="text-orange-500" /> Menu Categories</h3>
            {[
              { name: 'Starters', items: 12, active: true },
              { name: 'Main Course', items: 24, active: true },
              { name: 'Breads & Rice', items: 8, active: true },
              { name: 'Desserts', items: 6, active: false },
              { name: 'Beverages', items: 10, active: true },
            ].map(cat => (
              <div key={cat.name} className="flex items-center justify-between py-2.5 border-b dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-black text-sm dark:text-white">{cat.name}</p>
                  <p className="text-[10px] text-gray-400">{cat.items} items</p>
                </div>
                <div className={clsx('text-[9px] font-black uppercase px-2 py-1 rounded-full cursor-pointer transition-all',
                  cat.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400')}>
                  {cat.active ? 'Active' : 'Hidden'}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><Percent size={18} className="text-orange-500" /> Active Promos & Offers</h3>
            {[
              { name: '20% OFF on first order', code: 'FIRST20', uses: 142, active: true },
              { name: 'Free delivery above ₹299', code: 'AUTO', uses: 89, active: true },
              { name: 'BOGO on starters', code: 'BOGO50', uses: 23, active: false },
            ].map(promo => (
              <div key={promo.code} className="flex items-center justify-between py-2.5 border-b dark:border-gray-800 last:border-0">
                <div>
                  <p className="font-black text-sm dark:text-white">{promo.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">Code: {promo.code} • Used {promo.uses}x</p>
                </div>
                <div className={clsx('w-8 h-5 rounded-full relative transition-all', promo.active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700')}>
                  <div className={clsx('w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all', promo.active ? 'left-4' : 'left-0.5')} />
                </div>
              </div>
            ))}
            <button className="mt-4 w-full py-2.5 border-2 border-dashed border-orange-500/30 text-orange-500 rounded-xl text-xs font-black uppercase tracking-widest hover:border-orange-500 transition-all flex items-center justify-center gap-2">
              <PlusCircle size={14} /> Add New Promo
            </button>
          </div>
        </div>
      </div>
    )

    if (activeTab === 'analytics') return (
      <div className="space-y-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Analytics & Insights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monthly Revenue', value: `₹${revenue?.total || '0'}`, change: '+12%', up: true },
            { label: 'Total Orders', value: String(orders?.total || 0), change: '+8%', up: true },
            { label: 'Repeat Customers', value: '68%', change: '+4%', up: true },
            { label: 'Avg Order Value', value: '₹485', change: '-2%', up: false },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
              <p className="text-3xl font-black dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{stat.label}</p>
              <div className={clsx('flex items-center gap-1 text-[10px] font-black mt-2', stat.up ? 'text-emerald-500' : 'text-red-500')}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {stat.change} vs last month
              </div>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-800">
          <h3 className="font-black uppercase tracking-tighter mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-48 flex items-end gap-3">
            {[
              { day: 'Mon', val: 62 }, { day: 'Tue', val: 45 }, { day: 'Wed', val: 78 },
              { day: 'Thu', val: 90 }, { day: 'Fri', val: 85 }, { day: 'Sat', val: 100 }, { day: 'Sun', val: 70 },
            ].map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl hover:from-blue-700 transition-all" style={{ height: `${d.val}%` }} />
                <span className="text-[10px] font-black text-gray-400 uppercase">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><Star size={18} className="text-amber-500" /> Customer Reviews</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-black text-amber-500">{profile.rating || '4.8'}</div>
              <div>
                <div className="flex gap-1 text-amber-400 text-lg mb-1">{'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}</div>
                <p className="text-[10px] text-gray-400">{profile.reviewCount || 0} total reviews</p>
              </div>
            </div>
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-3 mb-1.5">
                <span className="text-[10px] font-black text-gray-400 w-4">{star}★</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${star === 5 ? 72 : star === 4 ? 18 : star === 3 ? 6 : star === 2 ? 2 : 2}%` }} />
                </div>
                <span className="text-[10px] font-black text-gray-400 w-6">{star === 5 ? '72%' : star === 4 ? '18%' : star === 3 ? '6%' : '2%'}</span>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800">
            <h3 className="font-black uppercase tracking-tighter mb-4 flex items-center gap-2"><Tag size={18} className="text-purple-500" /> Top Categories</h3>
            {[
              { name: 'Main Course', orders: 312, pct: 46 },
              { name: 'Starters', orders: 198, pct: 30 },
              { name: 'Beverages', orders: 104, pct: 15 },
              { name: 'Desserts', orders: 61, pct: 9 },
            ].map(cat => (
              <div key={cat.name} className="mb-3">
                <div className="flex justify-between text-xs font-black mb-1">
                  <span className="text-gray-500">{cat.name}</span>
                  <span className="dark:text-white">{cat.orders} orders</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    if (activeTab === 'driver' || activeTab === 'rider') return (
      <div className="space-y-6">
         <h2 className="text-2xl font-black uppercase tracking-tighter">Pending Ride Requests</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeData?.rides?.map((ride: any) => (
              <div key={ride._id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5 space-y-5">
                 <div className="flex justify-between items-start">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">₹{ride.fare}</div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{ride.vehicleType}</span>
                 </div>
                 <div className="space-y-3">
                    <div className="flex gap-3">
                       <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                       <p className="text-sm font-bold dark:text-gray-200">{ride.pickup.address}</p>
                    </div>
                    <div className="flex gap-3">
                       <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                       <p className="text-sm font-bold dark:text-gray-200">{ride.drop.address}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => acceptRideMutation.mutate(ride._id)}
                      disabled={acceptRideMutation.isPending}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      {acceptRideMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Accept'}
                    </button>
                    <button 
                      onClick={() => rejectRideMutation.mutate(ride._id)}
                      disabled={rejectRideMutation.isPending}
                      className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400"
                    >
                      <XCircle size={20}/>
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    )

    if (activeTab === 'restaurant') return (
      <div className="space-y-10">
         <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Table Bookings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {activeData?.tableBookings?.map((book: any) => (
                 <div key={book._id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800 flex justify-between items-center">
                    <div className="flex gap-4">
                       <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl">
                          {book.guests}
                       </div>
                       <div>
                          <p className="font-black dark:text-white uppercase">{book.guestName}</p>
                          <p className="text-xs text-gray-400 font-bold flex items-center gap-1"><Clock size={12} /> {book.bookingTime} · {new Date(book.bookingDate).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                       <Link href={`/chat/${book.userId}`} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><MessageCircle size={20}/></Link>
                       <button 
                         onClick={() => updateTableStatusMutation.mutate({ bookingId: book._id, status: 'confirmed' })}
                         className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"
                       >
                         <CheckCircle2 size={20}/>
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </section>
      </div>
    )

    if (activeTab === 'hotel') return (
      <div className="space-y-6">
         <h2 className="text-2xl font-black uppercase tracking-tighter">Room Bookings</h2>
         <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 overflow-hidden">
            <table className="w-full text-left">
               <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                  <tr>
                     <th className="px-8 py-5">Guest</th>
                     <th className="px-8 py-5">Stay Dates</th>
                     <th className="px-8 py-5">Room</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y dark:divide-gray-800">
                  {activeData?.hotelBookings?.map((book: any) => (
                    <tr key={book._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                       <td className="px-8 py-6">
                          <p className="font-black text-sm dark:text-white">{book.guestName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{book.phone}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-xs font-bold dark:text-gray-300">{new Date(book.checkIn).toLocaleDateString()} → {new Date(book.checkOut).toLocaleDateString()}</p>
                       </td>
                       <td className="px-8 py-6 text-xs font-black uppercase text-blue-600">{book.roomType}</td>
                       <td className="px-8 py-6">
                          <span className="text-[9px] font-black uppercase px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800">{book.status}</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex gap-2">
                             <Link href={`/chat/${book.userId}`} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-blue-600 transition-colors"><MessageCircle size={18}/></Link>
                             <button 
                               onClick={() => updateHotelStatusMutation.mutate({ bookingId: book._id, status: 'confirmed' })}
                               className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-emerald-600 transition-colors"
                             >
                               <CheckCircle2 size={18}/>
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    )

    return <div className="text-center py-20 font-black text-gray-400 uppercase tracking-widest">Section Coming Soon</div>
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col hidden md:flex overflow-y-auto">
        <div className="p-8 border-b dark:border-gray-800">
          <h2 className="text-2xl font-black text-blue-600 tracking-tighter uppercase italic">Business Hub</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Control Center</p>
        </div>
        <nav className="flex-1 p-6 space-y-1">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">General</p>
          <button onClick={() => setActiveTab('overview')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'overview' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button onClick={() => setActiveTab('analytics')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'analytics' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <BarChart2 size={18} /> Analytics
          </button>

          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mt-4 mb-2">Meta-Style</p>
          <button onClick={() => setActiveTab('ads')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'ads' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <Megaphone size={18} /> Ads Manager
          </button>

          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mt-4 mb-2">Amazon-Style</p>
          <button onClick={() => setActiveTab('store')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'store' ? "bg-amber-500 text-black shadow-xl shadow-amber-500/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <Store size={18} /> Store Manager
          </button>

          {profile.roles?.includes('seller') && (
            <button onClick={() => setActiveTab('products')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'products' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
              <Package size={18} /> Marketplace
            </button>
          )}

          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mt-4 mb-2">Swiggy-Style</p>
          <button onClick={() => setActiveTab('delivery')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'delivery' ? "bg-orange-500 text-white shadow-xl shadow-orange-500/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <Truck size={18} /> Delivery Hub
          </button>

          {profile.roles?.includes('restaurant') && (
            <button onClick={() => setActiveTab('restaurant')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'restaurant' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
              <Utensils size={18} /> Dining & Food
            </button>
          )}

          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mt-4 mb-2">Uber-Style</p>
          {profile.roles?.includes('rider') && (
            <button onClick={() => setActiveTab('rider')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'rider' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
              <Car size={18} /> Logistics
            </button>
          )}

          {profile.roles?.includes('hotel') && (
            <button onClick={() => setActiveTab('hotel')} className={clsx("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest", activeTab === 'hotel' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800")}>
              <Hotel size={18} /> Hospitality
            </button>
          )}
        </nav>
        <div className="p-6 border-t dark:border-gray-800">
           <button className="flex items-center gap-4 p-4 w-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all font-black text-xs uppercase tracking-widest">
             <Settings size={18} /> Settings
           </button>
        </div>
      </aside>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-800 z-30 flex overflow-x-auto no-scrollbar px-2 py-2 gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'ads', label: 'Ads', icon: Megaphone },
          { id: 'store', label: 'Store', icon: Store },
          { id: 'delivery', label: 'Delivery', icon: Truck },
          { id: 'analytics', label: 'Stats', icon: BarChart2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={clsx("flex flex-col items-center gap-1 px-4 py-2 rounded-xl shrink-0 transition-all font-black text-[9px] uppercase tracking-widest",
              activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 pb-28 md:pb-12">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black dark:text-white uppercase tracking-tighter">{activeTab.replace(/-/g, ' ')}</h1>
            <p className="text-gray-500 font-bold text-sm mt-1 uppercase tracking-widest">Control panel for your business operations</p>
          </div>
          <div className="flex items-center gap-3 bg-green-500/10 text-green-600 px-5 py-2.5 rounded-full border border-green-500/20 font-black text-[10px] uppercase tracking-widest">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live System Active
          </div>
        </header>

        {/* Dynamic Stats for Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm hover:border-blue-500/50 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Earnings</p>
              <p className="text-4xl font-black dark:text-white">₹{revenue?.total || 0}</p>
              <div className="mt-4 text-[10px] font-bold text-emerald-500 uppercase">+12% vs last month</div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm hover:border-blue-500/50 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Orders</p>
              <p className="text-4xl font-black dark:text-white">{orders?.total || 0}</p>
              <div className="mt-4 text-[10px] font-bold text-blue-500 uppercase">{orders?.completed || 0} completed</div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm hover:border-blue-500/50 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Rating</p>
              <p className="text-4xl font-black dark:text-white">{profile.rating || '4.8'}</p>
              <div className="mt-4 text-[10px] font-bold text-orange-500 uppercase">{profile.reviewCount || 0} reviews</div>
            </div>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm hover:border-blue-500/50 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Active Data</p>
              <p className="text-4xl font-black dark:text-white">{(activeData?.orders?.length || 0) + (activeData?.rides?.length || 0)}</p>
              <div className="mt-4 text-[10px] font-bold text-purple-500 uppercase">Live interactions</div>
            </div>
          </div>
        )}

        {renderActiveSection()}
      </main>
    </div>
  )
}
