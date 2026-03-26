'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getSettings, updateSettings } from '@/services/apiServices'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, Loader2, Mail, Lock, CheckCircle2, Shield, Bell, Eye, Car, Briefcase, ChevronRight, User, Palette, Settings } from 'lucide-react'
import { updateEmail, updatePassword } from '@/services/authApi'
import clsx from 'clsx'

export default function SettingsPage() {
  const { user, appMode, setAppMode } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [isUploading, setIsUploading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [securityStatus, setSecurityStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({ username: '', bio: '', avatar: '' })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: () => getSettings(user?.id as string),
    enabled: !!user?.id
  })

  if (settings?.profile && !profileData.username && !profileData.bio && !profileData.avatar) {
    setProfileData({
      username: settings.profile.username || '',
      bio: settings.profile.bio || '',
      avatar: settings.profile.avatar || ''
    })
  }

  const mutation = useMutation({
    mutationFn: ({ section, data }: { section: string, data: any }) => updateSettings(user?.id as string, section, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', user?.id] })
      alert('Settings updated successfully')
    }
  })

  const handleSaveProfile = () => mutation.mutate({ section: 'profile', data: profileData })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    try {
      setIsUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          alert('⚠️ Storage Bucket not configured.')
          setProfileData({ ...profileData, avatar: URL.createObjectURL(file) })
          return
        }
        throw uploadError
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setProfileData({ ...profileData, avatar: publicUrl })
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggle = (section: string, key: string, value: boolean, nestedKey?: string) => {
    const currentSectionData = settings[section] || {}
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-[var(--syn-function)]" />
        <p className="text-sm font-bold text-[var(--syn-comment)]">Loading settings...</p>
      </div>
    </div>
  )

  // Tab config with syntax-highlighting colors
  const tabs = [
    { id: 'profile',       label: 'Profile',        icon: User,     color: 'text-[var(--syn-keyword)]',  bg: 'bg-purple-500/10' },
    { id: 'business',      label: 'Business Mode',  icon: Briefcase, color: 'text-[var(--syn-string)]',  bg: 'bg-emerald-500/10' },
    { id: 'privacy',       label: 'Privacy',        icon: Eye,      color: 'text-[var(--syn-type)]',     bg: 'bg-cyan-500/10' },
    { id: 'notifications', label: 'Notifications',  icon: Bell,     color: 'text-[var(--syn-variable)]', bg: 'bg-orange-500/10' },
    { id: 'rideDelivery',  label: 'Ride & Delivery', icon: Car,     color: 'text-[var(--syn-function)]', bg: 'bg-blue-500/10' },
    { id: 'security',      label: 'Security',       icon: Shield,   color: 'text-[var(--syn-constant)]', bg: 'bg-red-500/10' },
  ]

  const activeTabData = tabs.find(t => t.id === activeTab)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 animate-slide-up">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <h1 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Settings size={22} className="text-[var(--syn-comment)]" />
          Settings
        </h1>
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-4 md:pb-0 no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-3 p-3 text-left rounded-2xl whitespace-nowrap transition-all text-sm",
                  isActive 
                    ? `${tab.bg} ${tab.color} font-bold shadow-sm` 
                    : "text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)]"
                )}
              >
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
      <div className="flex-1 bg-[var(--bg-card)] rounded-2xl shadow-sm border border-gray-200/30 dark:border-gray-800/30 p-6 animate-scale-in" key={activeTab}>
        
        {/* ─── PROFILE ─── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/30 dark:border-gray-800/30 pb-4">
              <User size={20} className="text-[var(--syn-keyword)]" />
              Profile Settings
            </h2>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl overflow-hidden bg-[var(--bg-elevated)] border-4 border-[var(--bg-card)] shadow-lg">
                  {settings?.profile?.avatar ? (
                    <img src={settings.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--syn-comment)] font-black text-3xl bg-gradient-to-br from-[var(--syn-keyword)] to-[var(--syn-function)] text-white">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[var(--syn-function)] p-2 rounded-xl text-white cursor-pointer shadow-md hover:bg-blue-700 transition-colors interactive">
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-xs text-[var(--syn-comment)]">Tap to change profile picture</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">Username</label>
                <input 
                  type="text" 
                  value={profileData.username} 
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/30 dark:border-gray-800/30 rounded-xl p-3 outline-none focus:ring-2 ring-[var(--syn-keyword)]/20 focus:border-[var(--syn-keyword)]/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">Bio</label>
                <textarea 
                  value={profileData.bio} 
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/30 dark:border-gray-800/30 rounded-xl p-3 outline-none focus:ring-2 ring-[var(--syn-keyword)]/20 transition-all"
                  rows={4}
                />
              </div>
              <button 
                onClick={handleSaveProfile}
                className="w-full bg-gradient-to-r from-[var(--syn-keyword)] to-[var(--syn-function)] text-white font-black py-3.5 rounded-xl interactive shadow-lg shadow-purple-500/20"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        )}

        {/* ─── BUSINESS MODE ─── */}
        {activeTab === 'business' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/30 dark:border-gray-800/30 pb-4">
              <Briefcase size={20} className="text-[var(--syn-string)]" />
              Business Mode
            </h2>
            
            {/* Big toggle card */}
            <div className={clsx(
              "p-6 rounded-2xl border-2 transition-all duration-300",
              appMode === 'business' 
                ? "border-emerald-500/30 bg-emerald-500/5" 
                : "border-gray-200/30 dark:border-gray-800/30"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                    appMode === 'business' 
                      ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20" 
                      : "bg-[var(--bg-elevated)] text-[var(--syn-comment)]"
                  )}>
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <p className="font-black">Enable Business Mode</p>
                    <p className="text-xs text-[var(--syn-comment)]">Unlocks merchant tools, analytics, and business apps</p>
                  </div>
                </div>
                <button
                  onClick={() => setAppMode(appMode === 'business' ? 'user' : 'business')}
                  className={clsx(
                    "w-14 h-8 rounded-full relative transition-all duration-300 interactive",
                    appMode === 'business' ? "bg-[var(--syn-string)]" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <div className={clsx(
                    "w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                    appMode === 'business' ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              
              {appMode === 'business' && (
                <div className="space-y-3 mt-4 pt-4 border-t border-emerald-500/10 animate-slide-up">
                  <p className="text-xs font-black text-[var(--syn-string)] uppercase tracking-widest">✓ Business Features Enabled</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Dashboard', 'Product Management', 'Order Tracking', 'Revenue Analytics', 'Customer Data', 'Store Settings'].map(feature => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-[var(--syn-comment)] bg-[var(--bg-elevated)] p-2.5 rounded-xl">
                        <CheckCircle2 size={14} className="text-[var(--syn-string)] shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--syn-comment)] italic mt-2">
                    Business apps will appear in the <span className="text-[var(--syn-type)] font-bold">Apps</span> section.
                  </p>
                </div>
              )}
            </div>

            {/* Info note */}
            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Palette size={20} className="text-[var(--syn-function)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--syn-function)]">How it works</p>
                <p className="text-[11px] text-[var(--syn-comment)] leading-relaxed mt-1">
                  When Business Mode is ON, you'll see a <span className="text-[var(--syn-string)] font-bold">Business</span> category in the Apps section with tools like Dashboard, Product Manager, Analytics, and more. Your bottom navigation also switches to business-focused items.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── PRIVACY ─── */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/30 dark:border-gray-800/30 pb-4">
              <Eye size={20} className="text-[var(--syn-type)]" />
              Privacy
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl cursor-pointer group hover:bg-cyan-500/5 transition-all">
                <div>
                  <p className="font-bold text-sm">Read Receipts</p>
                  <p className="text-xs text-[var(--syn-comment)]">Let others know you've read their messages</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.privacy?.readReceipts ?? true}
                  onChange={(e) => handleToggle('privacy', 'readReceipts', e.target.checked)}
                  className="w-5 h-5 accent-[var(--syn-type)] rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS ─── */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/30 dark:border-gray-800/30 pb-4">
              <Bell size={20} className="text-[var(--syn-variable)]" />
              Notifications
            </h2>
            <div className="space-y-2">
              {['messages', 'likes', 'comments', 'orders', 'rides'].map(cat => (
                <label key={cat} className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl cursor-pointer hover:bg-orange-500/5 transition-all">
                  <span className="font-bold capitalize text-sm">{cat}</span>
                  <input 
                    type="checkbox" 
                    checked={settings?.notifications?.categories?.[cat] ?? true}
                    onChange={(e) => handleToggle('notifications', 'categories', e.target.checked, cat)}
                    className="w-5 h-5 accent-[var(--syn-variable)] rounded"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ─── RIDE & DELIVERY ─── */}
        {activeTab === 'rideDelivery' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/30 dark:border-gray-800/30 pb-4">
              <Car size={20} className="text-[var(--syn-function)]" />
              Ride & Delivery Mode
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">App Mode</label>
                <select 
                  value={settings?.rideDelivery?.mode || 'user'}
                  onChange={(e) => mutation.mutate({ section: 'rideDelivery', data: { ...settings?.rideDelivery, mode: e.target.value } })}
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/30 dark:border-gray-800/30 rounded-xl p-3.5 outline-none focus:ring-2 ring-[var(--syn-function)]/20 transition-all"
                >
                  <option value="user">👤 User (Book Rides/Food)</option>
                  <option value="driver">🚗 Driver (Accept Rides/Delivery)</option>
                  <option value="both">🔄 Both</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ─── SECURITY ─── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 border-b border-gray-200/30 dark:border-gray-800/30 pb-4">
              <Shield size={20} className="text-[var(--syn-constant)]" />
              Security
            </h2>
            
            {securityStatus.message && (
              <div className={clsx(
                "p-3.5 rounded-xl flex items-center gap-2 text-sm animate-scale-in",
                securityStatus.type === 'success' 
                  ? 'bg-emerald-500/10 text-[var(--syn-string)] border border-emerald-500/20' 
                  : 'bg-red-500/10 text-[var(--syn-constant)] border border-red-500/20'
              )}>
                {securityStatus.type === 'success' && <CheckCircle2 size={16} />}
                {securityStatus.message}
              </div>
            )}

            <div className="space-y-5">
              {/* Email Change */}
              <form onSubmit={handleUpdateEmail} className="space-y-3 p-5 border border-gray-200/30 dark:border-gray-800/30 rounded-2xl hover:border-blue-500/20 transition-colors">
                <div className="flex items-center gap-2 text-sm font-black">
                  <Mail size={16} className="text-[var(--syn-function)]" />
                  Change Email Address
                </div>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="New email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 bg-[var(--bg-elevated)] border border-gray-200/30 dark:border-gray-800/30 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-[var(--syn-function)]/20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={loading || !newEmail}
                    className="bg-[var(--syn-function)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all interactive"
                  >
                    Update
                  </button>
                </div>
                <p className="text-[10px] text-[var(--syn-comment)]">You will need to verify the new email address.</p>
              </form>

              {/* Password Change */}
              <form onSubmit={handleUpdatePassword} className="space-y-3 p-5 border border-gray-200/30 dark:border-gray-800/30 rounded-2xl hover:border-red-500/20 transition-colors">
                <div className="flex items-center gap-2 text-sm font-black">
                  <Lock size={16} className="text-[var(--syn-constant)]" />
                  Update Password
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input 
                    type="password" 
                    placeholder="New password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="bg-[var(--bg-elevated)] border border-gray-200/30 dark:border-gray-800/30 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-[var(--syn-constant)]/20 transition-all"
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="bg-[var(--bg-elevated)] border border-gray-200/30 dark:border-gray-800/30 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-[var(--syn-constant)]/20 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading || !newPass}
                  className="w-full bg-[var(--syn-constant)] text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-all interactive"
                >
                  Change Password
                </button>
              </form>

              <label className="flex items-center justify-between p-4 bg-[var(--bg-elevated)] rounded-xl cursor-pointer hover:bg-red-500/5 transition-all">
                <div>
                  <p className="font-bold text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-[var(--syn-comment)]">Extra layer of protection</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings?.security?.twoFactorAuth ?? false}
                  onChange={(e) => handleToggle('security', 'twoFactorAuth', e.target.checked)}
                  className="w-5 h-5 accent-[var(--syn-constant)] rounded"
                />
              </label>

              <div>
                <h3 className="text-xs font-black text-[var(--syn-comment)] uppercase tracking-widest mb-3">Active Sessions</h3>
                <div className="space-y-2">
                  {settings?.security?.activeSessions?.map((session: any) => (
                    <div key={session._id} className="flex items-center justify-between p-3.5 bg-[var(--bg-elevated)] rounded-xl">
                      <div>
                        <p className="text-sm font-bold">{session.deviceType || 'Web Browser'}</p>
                        <p className="text-xs text-[var(--syn-comment)]">Last login: {new Date(session.lastLogin).toLocaleDateString()}</p>
                      </div>
                      <button className="text-[var(--syn-constant)] text-xs font-black hover:underline">Revoke</button>
                    </div>
                  )) || <p className="text-sm text-[var(--syn-comment)] italic text-center p-4 text-xs">No other active sessions</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
