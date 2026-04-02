'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getSettings, updateSettings, updateDatingProfile } from '@/services/apiServices'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Camera, Loader2, Mail, Lock, CheckCircle2, AlertCircle, Shield, Bell, Eye, Car,
  Briefcase, ChevronRight, User, Palette, Settings, Check, Package, Utensils, Hotel,
  Globe, Heart, Tag, Volume2, VolumeX, Moon, Sun, Smartphone, MapPin, CreditCard,
  Gift, Percent, Star, ShoppingBag, Truck, MessageCircle, UserCheck, UserX, BellOff,
  Languages, Download, Trash2, LogOut, Info, Zap, Film, Hash, Link, Music, BadgeCheck,
  RefreshCw, Clock, BarChart2, ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react'
import { updateEmail, updatePassword } from '@/services/authApi'
import api from '@/services/api'
import clsx from 'clsx'

export default function SettingsPage() {
  const { user, appMode, setAppMode, businessEnabled, setBusinessEnabled, businessType, setBusinessType } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [isUploading, setIsUploading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [securityStatus, setSecurityStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({ name: '', bio: '', avatar: '', username: '' })

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: () => getSettings(user?.id as string),
    enabled: !!user?.id
  })

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/users/profile/${user?.id}`)
      return data.data
    },
    enabled: !!user?.id
  })

  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || ''
      })
    }
  }, [profile])

  useEffect(() => {
    const enabled = settings?.business?.enabled
    if (typeof enabled === 'boolean') {
      setBusinessEnabled(enabled)
      if (!enabled && appMode === 'business') {
        setAppMode('user')
      }
    }
  }, [settings, setBusinessEnabled, appMode, setAppMode])

  const mutation = useMutation({
    mutationFn: ({ section, data }: { section: string, data: any }) => updateSettings(user?.id as string, section, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', user?.id] })
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/users/profile', { userId: user?.id, ...data })
        return response.data
      } catch (error: any) {
        throw new Error(error.response?.data?.error || error.message || 'Failed to save profile')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      setSecurityStatus({ type: 'success', message: 'Profile saved successfully! ✨' })
      setTimeout(() => setSecurityStatus({ type: '', message: '' }), 3000)
    },
    onError: (error: any) => {
      setSecurityStatus({ type: 'error', message: error.message || 'Failed to save profile' })
    }
  })

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData)
    } catch (error) {
      console.error('Profile save error:', error)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    try {
      setIsUploading(true)
      // Mock upload for local dev if supabase fails
      const mockUrl = URL.createObjectURL(file)
      setProfileData({ ...profileData, avatar: mockUrl })
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        setProfileData({ ...profileData, avatar: publicUrl })
      }
    } catch (error: any) {
      console.warn('Avatar upload failed, used local preview')
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggle = (section: string, key: string, value: boolean, nestedKey?: string) => {
    const currentSectionData = settings?.[section] || {}
    let newData = { ...currentSectionData }
    if (nestedKey) {
      newData[key] = { ...newData[key], [nestedKey]: value }
    } else {
      newData[key] = value
    }
    mutation.mutate({ section, data: newData })
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail) return
    setLoading(true)
    try {
      await updateEmail(newEmail)
      setSecurityStatus({ type: 'success', message: 'Email update sent. Check your inbox.' })
      setNewEmail('')
    } catch (err: any) {
      setSecurityStatus({ type: 'error', message: err.message || 'Failed to update email' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPass || newPass !== confirmPass) {
      setSecurityStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      await updatePassword(newPass)
      setSecurityStatus({ type: 'success', message: 'Password updated successfully!' })
      setNewPass(''); setConfirmPass('')
    } catch (err: any) {
      setSecurityStatus({ type: 'error', message: err.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  if (isSettingsLoading || isProfileLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        <p className="text-sm font-bold text-gray-500">Loading settings...</p>
      </div>
    </div>
  )

  const tabs = [
    { id: 'profile',       label: 'Profile',          icon: User,       color: 'text-purple-600',  bg: 'bg-purple-500/10' },
    { id: 'business',      label: 'Business Mode',    icon: Briefcase,  color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { id: 'privacy',       label: 'Privacy',          icon: Eye,        color: 'text-cyan-600',    bg: 'bg-cyan-500/10' },
    { id: 'notifications', label: 'Notifications',    icon: Bell,       color: 'text-orange-600',  bg: 'bg-orange-500/10' },
    { id: 'content',       label: 'Content & Feed',   icon: Film,       color: 'text-pink-600',    bg: 'bg-pink-500/10' },
    { id: 'commerce',      label: 'Shopping & Commerce', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { id: 'rides',         label: 'Rides & Delivery', icon: Car,        color: 'text-blue-600',    bg: 'bg-blue-500/10' },
    { id: 'discounts',     label: 'Discounts & Rewards', icon: Percent, color: 'text-rose-600',    bg: 'bg-rose-500/10' },
    { id: 'appearance',    label: 'Appearance',       icon: Palette,    color: 'text-indigo-600',  bg: 'bg-indigo-500/10' },
    { id: 'accessibility', label: 'Accessibility',    icon: Globe,      color: 'text-teal-600',    bg: 'bg-teal-500/10' },
    { id: 'security',      label: 'Security',         icon: Shield,     color: 'text-red-600',     bg: 'bg-red-500/10' },
    { id: 'data',          label: 'Data & Storage',   icon: Download,   color: 'text-gray-600',    bg: 'bg-gray-500/10' },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 pb-20">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          <Settings size={22} className="text-blue-500" /> Settings
        </h1>
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx("flex items-center gap-3 p-3 text-left rounded-2xl whitespace-nowrap transition-all text-sm",
                  isActive ? `${tab.bg} ${tab.color} font-bold shadow-sm` : "text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]")}>
                <tab.icon size={18} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden text-xs font-bold">{tab.label.split(' ')[0]}</span>
                {isActive && <ChevronRight size={14} className="ml-auto hidden md:block" />}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-[var(--bg-card)]/95 rounded-2xl shadow-2xl border border-gray-200/20 dark:border-gray-800/40 p-6 backdrop-blur-sm" key={activeTab}>
        
        {/* ─── PROFILE ─── */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/20 dark:border-gray-800/50 pb-4">
              <User size={20} className="text-purple-600" /> Profile Settings
            </h2>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-[var(--bg-elevated)] border-4 border-gray-200/20 dark:border-gray-800/50 shadow-xl">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--syn-comment)] font-black text-3xl">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-xl text-white cursor-pointer shadow-md hover:bg-blue-700 transition-colors">
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-xs text-[var(--syn-comment)] font-bold uppercase tracking-widest">Change Profile Photo</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">Display Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-[var(--text-primary)] transition-all font-bold hover:border-gray-200/40 dark:hover:border-gray-700/50" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">Username</label>
                  <input type="text" value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-[var(--text-primary)] transition-all font-bold hover:border-gray-200/40 dark:hover:border-gray-700/50" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">Bio</label>
                <textarea value={profileData.bio} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-[var(--text-primary)] transition-all font-medium hover:border-gray-200/40 dark:hover:border-gray-700/50" rows={4} />
              </div>
              {securityStatus.type && (
                <div className={clsx("p-3 rounded-xl flex items-center gap-2 text-sm font-bold",
                  securityStatus.type === 'success' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"
                )}>
                  {securityStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {securityStatus.message}
                </div>
              )}
              <button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {updateProfileMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} 
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* ─── BUSINESS MODE ─── */}
        {activeTab === 'business' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/20 dark:border-gray-800/50 pb-4">
              <Briefcase size={20} className="text-emerald-600" /> Business Mode
            </h2>
            <div className={clsx("p-6 rounded-3xl border-2 transition-all duration-300", businessEnabled ? "border-emerald-500 bg-emerald-500/5" : "border-gray-200/30 dark:border-gray-800/40 bg-[var(--bg-secondary)]")}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", businessEnabled ? "bg-emerald-500 text-white" : "bg-[var(--bg-elevated)] text-[var(--syn-comment)]")}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <p className="font-black dark:text-white uppercase tracking-tighter">Enable Business Hub</p>
                    <p className="text-xs text-gray-500 font-bold">Unlocks vendor tools and analytics</p>
                  </div>
                </div>
                <button onClick={() => {
                  const nextEnabled = !businessEnabled
                  setBusinessEnabled(nextEnabled)
                  setAppMode(nextEnabled ? 'business' : 'user')
                  mutation.mutate({ section: 'business', data: { enabled: nextEnabled } })
                }}
                  className={clsx("w-14 h-8 rounded-full relative transition-all duration-300", businessEnabled ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700")}>
                  <div className={clsx("w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm", businessEnabled ? "left-7" : "left-1")} />
                </button>
              </div>
              {businessEnabled && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Your Business Role</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'product_seller', label: 'Product Seller', icon: Package },
                      { id: 'rider', label: 'Ride/Delivery Driver', icon: Car },
                      { id: 'restaurant_manager', label: 'Restaurant Manager', icon: Utensils },
                      { id: 'hotel_manager', label: 'Hotel Manager', icon: Hotel }
                    ].map(role => (
                      <button key={role.id} onClick={() => setBusinessType(role.id as any)}
                        className={clsx("flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left", 
                          businessType === role.id ? "border-emerald-500 bg-[var(--bg-card)] shadow-md" : "border-transparent bg-[var(--bg-elevated)] grayscale opacity-70 hover:grayscale-0 hover:opacity-100")}>
                        <role.icon size={20} className={businessType === role.id ? "text-emerald-500" : "text-gray-400"} />
                        <span className="font-black text-sm uppercase tracking-tight">{role.label}</span>
                        {businessType === role.id && <Check size={16} className="ml-auto text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── PRIVACY ─── */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Eye size={20} className="text-cyan-600" /> Privacy & Visibility
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Account Privacy</p>
              {[
                { id: 'privateProfile', label: 'Private Account', desc: 'Only approved followers see your posts (Instagram-style)' },
                { id: 'showOnlineStatus', label: 'Online Status', desc: 'Show when you were last active' },
                { id: 'readReceipts', label: 'Read Receipts', desc: 'Let others know you\'ve read their messages' },
                { id: 'showActivity', label: 'Activity Status', desc: 'Show your activity on posts and stories' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-cyan-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.privacy?.[item.id] ?? true}
                    onChange={(e) => handleToggle('privacy', item.id, e.target.checked)} className="w-5 h-5 accent-cyan-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Interaction Controls</p>
              {[
                { id: 'allowTagging', label: 'Allow Tagging', desc: 'Let others tag you in posts and photos' },
                { id: 'allowMentions', label: 'Allow Mentions', desc: 'Anyone can mention you in posts' },
                { id: 'allowDMs', label: 'Direct Messages', desc: 'Who can send you direct messages' },
                { id: 'showFollowerCount', label: 'Show Follower Count', desc: 'Display your follower count publicly' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-cyan-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.privacy?.[item.id] ?? true}
                    onChange={(e) => handleToggle('privacy', item.id, e.target.checked)} className="w-5 h-5 accent-cyan-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Location & Data</p>
              {[
                { id: 'shareLocation', label: 'Share Location', desc: 'Allow location access for nearby features' },
                { id: 'locationHistory', label: 'Location History', desc: 'Save your location history for better recommendations' },
                { id: 'personalisedAds', label: 'Personalised Ads', desc: 'Show ads based on your activity' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-cyan-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.privacy?.[item.id] ?? false}
                    onChange={(e) => handleToggle('privacy', item.id, e.target.checked)} className="w-5 h-5 accent-cyan-500" />
                </label>
              ))}
            </div>

            <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-3">
              <p className="font-black text-sm uppercase tracking-tight">Blocked Accounts</p>
              <p className="text-[10px] text-gray-500">Manage people you&apos;ve blocked from seeing your profile or contacting you</p>
              <button className="text-xs font-black text-cyan-600 uppercase tracking-widest hover:underline">Manage Blocked List →</button>
            </div>

            <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-3">
              <p className="font-black text-sm uppercase tracking-tight">Close Friends</p>
              <p className="text-[10px] text-gray-500">Share stories and posts with a select group of people</p>
              <button className="text-xs font-black text-cyan-600 uppercase tracking-widest hover:underline">Edit Close Friends List →</button>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS ─── */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Bell size={20} className="text-orange-600" /> Notifications
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Push Notifications</p>
              {[
                { id: 'messages', label: 'Messages', desc: 'Direct messages and chat updates' },
                { id: 'likes', label: 'Likes & Reactions', desc: 'When someone likes your post or story' },
                { id: 'comments', label: 'Comments', desc: 'Replies and comments on your posts' },
                { id: 'mentions', label: 'Mentions & Tags', desc: 'When someone mentions or tags you' },
                { id: 'follows', label: 'New Followers', desc: 'When someone follows or requests to follow you' },
                { id: 'stories', label: 'Story Replies', desc: 'Replies and reactions to your stories' },
              ].map(cat => (
                <label key={cat.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-orange-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{cat.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{cat.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.notifications?.categories?.[cat.id] ?? true}
                    onChange={(e) => handleToggle('notifications', 'categories', e.target.checked, cat.id)} className="w-5 h-5 accent-orange-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Orders & Delivery</p>
              {[
                { id: 'orders', label: 'Order Updates', desc: 'Track your food, shopping, and service orders' },
                { id: 'rides', label: 'Ride Updates', desc: 'Driver location and trip status' },
                { id: 'delivery', label: 'Delivery Status', desc: 'Package and courier updates' },
                { id: 'deals', label: 'Deals & Offers', desc: 'Flash sales, discounts, and coupon alerts' },
              ].map(cat => (
                <label key={cat.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-orange-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{cat.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{cat.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.notifications?.categories?.[cat.id] ?? true}
                    onChange={(e) => handleToggle('notifications', 'categories', e.target.checked, cat.id)} className="w-5 h-5 accent-orange-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Quiet Hours (Do Not Disturb)</p>
              <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">Enable Quiet Hours</p>
                    <p className="text-[10px] text-gray-500">Mute all notifications during specified hours</p>
                  </div>
                  <input type="checkbox" checked={settings?.notifications?.quietHours?.enabled ?? false}
                    onChange={(e) => handleToggle('notifications', 'quietHours', e.target.checked, 'enabled')} className="w-5 h-5 accent-orange-500" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From</label>
                    <input type="time" defaultValue="22:00" className="w-full bg-[var(--bg-primary)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-2 text-sm text-[var(--text-primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To</label>
                    <input type="time" defaultValue="08:00" className="w-full bg-[var(--bg-primary)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-2 text-sm text-[var(--text-primary)] outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CONTENT & FEED ─── */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Film size={20} className="text-pink-600" /> Content & Feed Preferences
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Feed Algorithm (Instagram / Twitter Style)</p>
              {[
                { id: 'showSuggestedPosts', label: 'Suggested Posts', desc: 'See posts from accounts you don\'t follow' },
                { id: 'showReels', label: 'Reels & Short Videos', desc: 'Short video content in your feed' },
                { id: 'showSponsored', label: 'Sponsored Content', desc: 'Show relevant ads and promoted posts' },
                { id: 'chronologicalFeed', label: 'Chronological Feed', desc: 'Show posts in order of time posted (Twitter/X style)' },
                { id: 'sensitiveContent', label: 'Sensitive Content', desc: 'Show content that may be sensitive in nature' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-pink-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.content?.[item.id] ?? true}
                    onChange={(e) => handleToggle('content', item.id, e.target.checked)} className="w-5 h-5 accent-pink-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Story & Snap Settings (Snapchat Style)</p>
              {[
                { id: 'autoPlayStories', label: 'Auto-Play Stories', desc: 'Automatically advance through stories' },
                { id: 'storyAutoSave', label: 'Auto-Save Stories', desc: 'Automatically save your stories to archive' },
                { id: 'allowStoryReplies', label: 'Story Replies', desc: 'Allow replies to your stories' },
                { id: 'showSnapScore', label: 'Show Snap Score', desc: 'Display your snap engagement score publicly' },
                { id: 'ghostMode', label: 'Ghost Mode (Snap Map)', desc: 'Hide your location on the Snap Map' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-yellow-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.content?.[item.id] ?? true}
                    onChange={(e) => handleToggle('content', item.id, e.target.checked)} className="w-5 h-5 accent-yellow-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Messaging Preferences (Telegram / Discord Style)</p>
              {[
                { id: 'animatedEmoji', label: 'Animated Emoji', desc: 'Show animated stickers and emoji' },
                { id: 'linkPreviews', label: 'Link Previews', desc: 'Show previews when sharing links in chats' },
                { id: 'voiceMessages', label: 'Voice Messages', desc: 'Enable voice message recording in chats' },
                { id: 'groupInviteFilter', label: 'Group Invite Filter', desc: 'Only allow contacts to add you to groups' },
                { id: 'messageForwarding', label: 'Message Forwarding', desc: 'Allow others to forward your messages' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-blue-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.content?.[item.id] ?? true}
                    onChange={(e) => handleToggle('content', item.id, e.target.checked)} className="w-5 h-5 accent-blue-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Pinterest Board Style</p>
              {[
                { id: 'boardRecommendations', label: 'Board Recommendations', desc: 'Get pin and board suggestions based on interests' },
                { id: 'showTryOn', label: 'Visual Search & Try-On', desc: 'Enable AR try-on for fashion and decor pins' },
                { id: 'shoppingPins', label: 'Shopping Pins', desc: 'See buyable pins from linked stores' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-red-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.content?.[item.id] ?? true}
                    onChange={(e) => handleToggle('content', item.id, e.target.checked)} className="w-5 h-5 accent-red-500" />
                </label>
              ))}
            </div>

            <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-3">
              <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><Hash size={16} /> Muted Keywords & Hashtags</p>
              <p className="text-[10px] text-gray-500">Hide posts containing specific words or hashtags from your feed</p>
              <button className="text-xs font-black text-pink-600 uppercase tracking-widest hover:underline">Manage Muted Words →</button>
            </div>
          </div>
        )}

        {/* ─── SHOPPING & COMMERCE ─── */}
        {activeTab === 'commerce' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <ShoppingBag size={20} className="text-amber-600" /> Shopping & Commerce
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Payment & Checkout (Amazon / Flipkart Style)</p>
              <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">1-Click Purchase</p>
                    <p className="text-[10px] text-gray-500">Buy items instantly with saved payment method</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.oneClickPurchase ?? false}
                    onChange={(e) => handleToggle('commerce', 'oneClickPurchase', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">Save UPI / Cards</p>
                    <p className="text-[10px] text-gray-500">Remember payment methods for faster checkout</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.savePaymentMethods ?? true}
                    onChange={(e) => handleToggle('commerce', 'savePaymentMethods', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">Auto Apply Coupons</p>
                    <p className="text-[10px] text-gray-500">Automatically apply best available coupon at checkout</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.autoApplyCoupons ?? true}
                    onChange={(e) => handleToggle('commerce', 'autoApplyCoupons', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">COD Available</p>
                    <p className="text-[10px] text-gray-500">Allow Cash on Delivery as a payment option</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.codEnabled ?? true}
                    onChange={(e) => handleToggle('commerce', 'codEnabled', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Delivery Preferences (Flipkart / eBay Style)</p>
              <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Default Delivery Address</label>
                  <input type="text" placeholder="Add your default address..." className="w-full bg-[var(--bg-primary)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">Safe Pickup Points</p>
                    <p className="text-[10px] text-gray-500">Use nearby stores as delivery pickup locations</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.safePickup ?? false}
                    onChange={(e) => handleToggle('commerce', 'safePickup', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">Delivery Instructions</p>
                    <p className="text-[10px] text-gray-500">Save default delivery instructions for drivers</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.deliveryInstructions ?? false}
                    onChange={(e) => handleToggle('commerce', 'deliveryInstructions', e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Shopping Activity</p>
              {[
                { id: 'wishlistPublic', label: 'Public Wishlist', desc: 'Let friends see your shopping wishlist' },
                { id: 'purchaseHistory', label: 'Purchase History', desc: 'Save and review past orders' },
                { id: 'priceAlerts', label: 'Price Drop Alerts', desc: 'Get notified when wishlist items go on sale' },
                { id: 'reviewReminders', label: 'Review Reminders', desc: 'Remind me to rate products I\'ve purchased' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-amber-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.commerce?.[item.id] ?? true}
                    onChange={(e) => handleToggle('commerce', item.id, e.target.checked)} className="w-5 h-5 accent-amber-500" />
                </label>
              ))}
            </div>

            <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><CreditCard size={16} /> Saved Payment Methods</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Manage your cards, UPI IDs, and wallets</p>
              </div>
              <button className="text-xs font-black text-amber-600 uppercase tracking-widest hover:underline">Manage →</button>
            </div>
          </div>
        )}

        {/* ─── RIDES & DELIVERY ─── */}
        {activeTab === 'rides' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Car size={20} className="text-blue-600" /> Rides & Delivery
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Ride Preferences (Uber Style)</p>
              {[
                { id: 'rideSharing', label: 'Ride Sharing (Pool)', desc: 'Allow co-passengers to share your ride for lower fare' },
                { id: 'femaleDriverOnly', label: 'Female Driver Preference', desc: 'Request female drivers when available' },
                { id: 'petFriendly', label: 'Pet-Friendly Rides', desc: 'Filter rides that allow pets' },
                { id: 'accessibleVehicle', label: 'Accessibility Needs', desc: 'Request vehicles with accessibility features' },
                { id: 'quietMode', label: 'Quiet Mode', desc: 'Prefer minimal conversation during rides' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-blue-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.rides?.[item.id] ?? false}
                    onChange={(e) => handleToggle('rides', item.id, e.target.checked)} className="w-5 h-5 accent-blue-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Food Delivery Preferences (Swiggy Style)</p>
              {[
                { id: 'contactlessDelivery', label: 'Contactless Delivery', desc: 'Deliver to door without direct handoff' },
                { id: 'saveDeliveryInstructions', label: 'Save Delivery Instructions', desc: 'Default instructions for delivery partners' },
                { id: 'trackInRealTime', label: 'Real-Time Tracking', desc: 'Live map tracking for all deliveries' },
                { id: 'rateEveryOrder', label: 'Rate Every Order', desc: 'Prompt to rate after each delivery' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-orange-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.rides?.[item.id] ?? true}
                    onChange={(e) => handleToggle('rides', item.id, e.target.checked)} className="w-5 h-5 accent-orange-500" />
                </label>
              ))}
            </div>

            <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-3">
              <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> Saved Locations</p>
              <div className="space-y-2">
                {[
                  { label: 'Home', value: 'Add home address', icon: '🏠' },
                  { label: 'Work', value: 'Add work address', icon: '💼' },
                  { label: 'Other', value: 'Add saved place', icon: '📍' },
                ].map(loc => (
                  <button key={loc.label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-primary)] transition-all text-left">
                    <span className="text-lg">{loc.icon}</span>
                    <div>
                      <p className="font-black text-xs uppercase tracking-tight">{loc.label}</p>
                      <p className="text-[10px] text-gray-500">{loc.value}</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── DISCOUNTS & REWARDS ─── */}
        {activeTab === 'discounts' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Percent size={20} className="text-rose-600" /> Discounts & Rewards
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Super Coins', value: '2,450', icon: '🪙', color: 'text-amber-600', bg: 'bg-amber-500/10' },
                { label: 'Cashback Earned', value: '₹340', icon: '💰', color: 'text-green-600', bg: 'bg-green-500/10' },
                { label: 'Active Coupons', value: '7', icon: '🎫', color: 'text-purple-600', bg: 'bg-purple-500/10' },
              ].map(stat => (
                <div key={stat.label} className={clsx("p-5 rounded-2xl border", stat.bg)}>
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className={clsx("text-2xl font-black", stat.color)}>{stat.value}</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Loyalty & Rewards</p>
              {[
                { id: 'earnCoinsOnPurchase', label: 'Earn Coins on Purchase', desc: 'Get Super Coins for every order and transaction' },
                { id: 'redeemAtCheckout', label: 'Auto-Redeem at Checkout', desc: 'Automatically use coins to reduce order total' },
                { id: 'referralRewards', label: 'Referral Rewards', desc: 'Earn extra coins when friends join via your link' },
                { id: 'birthdayBonus', label: 'Birthday Bonus', desc: 'Get special rewards on your birthday' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-rose-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.discounts?.[item.id] ?? true}
                    onChange={(e) => handleToggle('discounts', item.id, e.target.checked)} className="w-5 h-5 accent-rose-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Deal Preferences</p>
              {[
                { id: 'flashSaleAlerts', label: 'Flash Sale Alerts', desc: 'Get notified about limited-time deals' },
                { id: 'priceHistoryTracking', label: 'Price History', desc: 'See price history before purchasing' },
                { id: 'bundleDeals', label: 'Bundle Deals', desc: 'Show discounted product bundles and combos' },
                { id: 'firstOrderDiscount', label: 'First-Order Discounts', desc: 'Apply special discounts for new categories' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-rose-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.discounts?.[item.id] ?? true}
                    onChange={(e) => handleToggle('discounts', item.id, e.target.checked)} className="w-5 h-5 accent-rose-500" />
                </label>
              ))}
            </div>

            <div className="p-5 bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-2xl space-y-2">
              <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><Gift size={16} className="text-rose-500" /> My Coupons & Vouchers</p>
              <p className="text-[10px] text-gray-500">View and manage all your discount codes, vouchers, and cashback offers</p>
              <button className="text-xs font-black text-rose-600 uppercase tracking-widest hover:underline">View All Coupons →</button>
            </div>
          </div>
        )}

        {/* ─── APPEARANCE ─── */}
        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Palette size={20} className="text-indigo-600" /> Appearance
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun, color: 'bg-white border-gray-200 text-gray-800' },
                  { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-gray-950 border-gray-700 text-white' },
                  { id: 'system', label: 'System', icon: Smartphone, color: 'bg-gradient-to-br from-white to-gray-950 border-gray-400 text-gray-600' },
                ].map(theme => (
                  <button key={theme.id} onClick={() => handleToggle('appearance', 'theme', true, theme.id)}
                    className={clsx("p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                      settings?.appearance?.theme === theme.id ? "border-indigo-500 bg-indigo-500/10" : "border-gray-200/30 dark:border-gray-800/50 hover:border-indigo-400")}>
                    <theme.icon size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Accent Color</p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { color: 'bg-blue-500', id: 'blue' }, { color: 'bg-purple-500', id: 'purple' },
                  { color: 'bg-pink-500', id: 'pink' }, { color: 'bg-rose-500', id: 'rose' },
                  { color: 'bg-orange-500', id: 'orange' }, { color: 'bg-green-500', id: 'green' },
                  { color: 'bg-teal-500', id: 'teal' }, { color: 'bg-yellow-400', id: 'yellow' },
                ].map(c => (
                  <button key={c.id} onClick={() => handleToggle('appearance', 'accentColor', true, c.id)}
                    className={clsx("w-10 h-10 rounded-full transition-all", c.color, settings?.appearance?.accentColor === c.id ? "ring-4 ring-offset-2 ring-offset-[var(--bg-card)] ring-current scale-110" : "hover:scale-105")} />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Display Options</p>
              {[
                { id: 'compactMode', label: 'Compact Mode', desc: 'Show more content with reduced padding' },
                { id: 'highContrast', label: 'High Contrast', desc: 'Increase contrast for better readability' },
                { id: 'reduceAnimations', label: 'Reduce Animations', desc: 'Minimise motion effects throughout the app' },
                { id: 'largerText', label: 'Larger Text', desc: 'Increase default text size across the app' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-indigo-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.appearance?.[item.id] ?? false}
                    onChange={(e) => handleToggle('appearance', item.id, e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">App Icon</p>
              <div className="grid grid-cols-4 gap-3">
                {['Default', 'Dark', 'Neon', 'Gold'].map(icon => (
                  <button key={icon} className={clsx("p-3 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all",
                    settings?.appearance?.appIcon === icon.toLowerCase() ? "border-indigo-500 bg-indigo-500/10" : "border-gray-200/30 dark:border-gray-800/50 hover:border-indigo-400")}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">SA</div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── ACCESSIBILITY ─── */}
        {activeTab === 'accessibility' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Globe size={20} className="text-teal-600" /> Accessibility & Language
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Language & Region</p>
              <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">App Language</label>
                  <select className="w-full bg-[var(--bg-primary)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-teal-500">
                    <option>English (US)</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Tamil (தமிழ்)</option>
                    <option>Telugu (తెలుగు)</option>
                    <option>Bengali (বাংলা)</option>
                    <option>Marathi (मराठी)</option>
                    <option>Gujarati (ગુજરાતી)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Currency</label>
                  <select className="w-full bg-[var(--bg-primary)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:border-teal-500">
                    <option>INR (₹) - Indian Rupee</option>
                    <option>USD ($) - US Dollar</option>
                    <option>EUR (€) - Euro</option>
                    <option>GBP (£) - British Pound</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Accessibility Features</p>
              {[
                { id: 'screenReader', label: 'Screen Reader Support', desc: 'Optimise for VoiceOver and TalkBack' },
                { id: 'captionsOnVideos', label: 'Auto-Captions on Videos', desc: 'Show closed captions on all videos' },
                { id: 'altTextImages', label: 'Auto Alt-Text for Images', desc: 'Describe images for visually impaired users' },
                { id: 'hapticFeedback', label: 'Haptic Feedback', desc: 'Vibrate on interactions and actions' },
                { id: 'boldText', label: 'Bold Text', desc: 'Make all text bold for easier reading' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-teal-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.accessibility?.[item.id] ?? false}
                    onChange={(e) => handleToggle('accessibility', item.id, e.target.checked)} className="w-5 h-5 accent-teal-500" />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ─── SECURITY ─── */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Shield size={20} className="text-red-600" /> Account Security
            </h2>
            <div className="space-y-5">
              <form onSubmit={handleUpdatePassword} className="space-y-4 p-6 border border-gray-200/30 dark:border-gray-800/40 rounded-[2rem] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                  <Lock size={14} /> Change Password
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="password" placeholder="New password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-[var(--text-primary)] transition-all font-bold hover:border-gray-200/40 dark:hover:border-gray-700/50" />
              <input type="password" placeholder="Confirm password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 text-[var(--text-primary)] transition-all font-bold hover:border-gray-200/40 dark:hover:border-gray-700/50" />
                </div>
                <button type="submit" disabled={loading || !newPass}
                  className="w-full bg-red-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all">
                  Update Security Credentials
                </button>
              </form>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Two-Factor Authentication</p>
                {[
                  { id: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
                  { id: 'loginAlerts', label: 'Login Alerts', desc: 'Get notified when someone logs into your account from a new device' },
                  { id: 'trustedDevices', label: 'Trusted Devices Only', desc: 'Require verification on unrecognized devices' },
                ].map(item => (
                  <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-red-500/5 transition-all">
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                    </div>
                    <input type="checkbox" checked={settings?.security?.[item.id] ?? false}
                      onChange={(e) => handleToggle('security', item.id, e.target.checked)} className="w-5 h-5 accent-red-500" />
                  </label>
                ))}
              </div>

              <div className="p-5 bg-[var(--bg-elevated)] rounded-2xl space-y-2">
                <p className="font-black text-sm uppercase tracking-tight flex items-center gap-2"><Smartphone size={16} className="text-red-500" /> Active Sessions</p>
                <p className="text-[10px] text-gray-500">View and manage all devices where you are logged in</p>
                <button className="text-xs font-black text-red-600 uppercase tracking-widest hover:underline">Manage Sessions →</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── DATA & STORAGE ─── */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-xl font-black flex items-center gap-2 border-b dark:border-gray-800 pb-4">
              <Download size={20} className="text-gray-600" /> Data & Storage
            </h2>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-2">Media Storage</p>
              {[
                { id: 'autoDownloadWifi', label: 'Auto-Download on Wi-Fi', desc: 'Automatically download media when on Wi-Fi' },
                { id: 'autoDownloadData', label: 'Auto-Download on Mobile Data', desc: 'Automatically download on cellular data (uses data)' },
                { id: 'saveMediaToGallery', label: 'Save to Gallery', desc: 'Automatically save received media to your gallery' },
              ].map(item => (
                <label key={item.id} className="flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl cursor-pointer hover:bg-gray-500/5 transition-all">
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                  </div>
                  <input type="checkbox" checked={settings?.data?.[item.id] ?? true}
                    onChange={(e) => handleToggle('data', item.id, e.target.checked)} className="w-5 h-5 accent-gray-500" />
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Data</p>
              {[
                { label: 'Download Your Data', icon: Download, desc: 'Request a copy of all your data', color: 'text-blue-600' },
                { label: 'Clear Cache', icon: RefreshCw, desc: 'Free up space by clearing temporary files', color: 'text-orange-600' },
                { label: 'Delete Account', icon: Trash2, desc: 'Permanently delete your account and all data', color: 'text-red-600' },
              ].map(item => (
                <button key={item.label} className="w-full flex items-center justify-between p-5 bg-[var(--bg-elevated)] rounded-2xl hover:bg-[var(--bg-primary)] transition-all">
                  <div className="flex items-center gap-4">
                    <item.icon size={20} className={item.color} />
                    <div className="text-left">
                      <p className={clsx("font-black text-sm uppercase tracking-tight", item.color)}>{item.label}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
