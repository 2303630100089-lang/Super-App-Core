'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import {
  Settings, Store, Bell, CreditCard, Truck,
  Save, Loader2, CheckCircle2, AlertCircle,
  MapPin, Clock, Phone, Mail, Link2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

interface BusinessSettings {
  storeName?: string
  description?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  openTime?: string
  closeTime?: string
  acceptCash?: boolean
  acceptCard?: boolean
  acceptWallet?: boolean
  deliveryEnabled?: boolean
  deliveryRadius?: number
  autoAcceptOrders?: boolean
  notifyNewOrder?: boolean
  notifyNewReview?: boolean
  notifyLowStock?: boolean
}

const defaultSettings: BusinessSettings = {
  storeName: '',
  description: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  openTime: '09:00',
  closeTime: '21:00',
  acceptCash: true,
  acceptCard: true,
  acceptWallet: true,
  deliveryEnabled: true,
  deliveryRadius: 10,
  autoAcceptOrders: false,
  notifyNewOrder: true,
  notifyNewReview: true,
  notifyLowStock: true,
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700',
      )}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export default function BusinessSettingsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const { isLoading } = useQuery({
    queryKey: ['business-settings', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/settings/${user?.id}`)
      const s = data?.data?.business ?? data?.data ?? {}
      return s
    },
    enabled: !!user?.id,
    onSuccess: (data: BusinessSettings) => {
      setSettings(prev => ({ ...defaultSettings, ...prev, ...data }))
    },
  } as any)

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/settings/${user?.id}/business`, settings)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings', user?.id] })
      setSaved(true)
      setSaveError('')
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err: any) => {
      setSaveError(err.message ?? 'Failed to save settings')
    },
  })

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const inputCls =
    'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-400 transition'

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
      {/* Header */}
      <header className="bg-slate-700 dark:bg-slate-800 text-white p-6 pb-8 rounded-b-[2.5rem] shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Store Settings</h1>
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configure your business</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <Settings size={24} />
          </div>
        </div>
      </header>

      <main className="px-4 -mt-2 space-y-5 pt-4">
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold px-4 py-3 rounded-2xl">
            <CheckCircle2 size={16} /> Settings saved successfully!
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-3 rounded-2xl">
            <AlertCircle size={16} /> {saveError}
          </div>
        )}

        {/* Store Identity */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Store size={16} className="text-emerald-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Store Identity</h2>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Store Name</label>
            <input
              value={settings.storeName}
              onChange={e => set('storeName', e.target.value)}
              placeholder="My Awesome Store"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Description</label>
            <textarea
              value={settings.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What do you sell or offer?"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1">
                <Clock size={10} /> Opens
              </label>
              <input type="time" value={settings.openTime} onChange={e => set('openTime', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1">
                <Clock size={10} /> Closes
              </label>
              <input type="time" value={settings.closeTime} onChange={e => set('closeTime', e.target.value)} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Phone size={16} className="text-blue-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Contact & Location</h2>
          </div>
          {[
            { key: 'phone', label: 'Phone', icon: Phone, placeholder: '+91 98765 43210' },
            { key: 'email', label: 'Business Email', icon: Mail, placeholder: 'store@example.com' },
            { key: 'website', label: 'Website', icon: Link2, placeholder: 'https://mystore.com' },
            { key: 'address', label: 'Address', icon: MapPin, placeholder: 'Full store address' },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block flex items-center gap-1">
                <Icon size={10} /> {label}
              </label>
              <input
                value={(settings as any)[key] ?? ''}
                onChange={e => set(key as keyof BusinessSettings, e.target.value)}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </section>

        {/* Payments */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-violet-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Payment Methods</h2>
          </div>
          {[
            { key: 'acceptCash', label: 'Accept Cash on Delivery' },
            { key: 'acceptCard', label: 'Accept Card Payments' },
            { key: 'acceptWallet', label: 'Accept Wallet / UPI' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
              <ToggleSwitch
                checked={!!(settings as any)[key]}
                onChange={v => set(key as keyof BusinessSettings, v)}
              />
            </div>
          ))}
        </section>

        {/* Delivery */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={16} className="text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Delivery Options</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Enable Delivery</span>
            <ToggleSwitch checked={!!settings.deliveryEnabled} onChange={v => set('deliveryEnabled', v)} />
          </div>
          {settings.deliveryEnabled && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                Delivery Radius (km)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.deliveryRadius ?? 10}
                onChange={e => set('deliveryRadius', Number(e.target.value))}
                className={inputCls}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Auto-Accept Orders</span>
            <ToggleSwitch checked={!!settings.autoAcceptOrders} onChange={v => set('autoAcceptOrders', v)} />
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-rose-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Notifications</h2>
          </div>
          {[
            { key: 'notifyNewOrder', label: 'New Order Alerts' },
            { key: 'notifyNewReview', label: 'New Review Alerts' },
            { key: 'notifyLowStock', label: 'Low Stock Alerts' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
              <ToggleSwitch
                checked={!!(settings as any)[key]}
                onChange={v => set(key as keyof BusinessSettings, v)}
              />
            </div>
          ))}
        </section>

        {/* Save Button */}
        <button
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save size={18} /> Save Settings
            </>
          )}
        </button>
      </main>
    </div>
  )
}
