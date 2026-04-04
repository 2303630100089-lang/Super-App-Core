'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { useRouter } from 'next/navigation'
import {
  Hash, Plus, Search, X, Globe, Lock, Megaphone,
  ChevronRight, Loader2, Check, ArrowLeft, Users, Radio
} from 'lucide-react'
import clsx from 'clsx'

const CHANNEL_TYPES = [
  { value: '', label: 'All', icon: Globe },
  { value: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { value: 'text', label: 'Text', icon: Hash },
  { value: 'announcement', label: 'News', icon: Radio },
]

const Av = ({ name, avatar }: { name?: string; avatar?: string }) => {
  if (avatar && !avatar.startsWith('http') === false)
    return <img src={avatar} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="" />
  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shrink-0 uppercase">
      {name?.[0] || '#'}
    </div>
  )
}

export default function ChannelsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()

  const [tab, setTab] = useState<'my' | 'explore'>('my')
  const [showCreate, setShowCreate] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [exploreQ, setExploreQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Create form
  const [channelName, setChannelName] = useState('')
  const [channelDesc, setChannelDesc] = useState('')
  const [channelType, setChannelType] = useState('broadcast')
  const [creating, setCreating] = useState(false)

  // My channels
  const { data: myChannels = [], isLoading: loadingMy } = useQuery({
    queryKey: ['my-channels', user?.id],
    queryFn: async () => {
      const res = await api.get(`/super-comm/channel/user/${user?.id}`)
      return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    },
    enabled: !!user?.id
  })

  // Explore channels
  const { data: exploreChannels = [], isLoading: loadingExplore } = useQuery({
    queryKey: ['explore-channels', exploreQ, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30' })
      if (exploreQ) params.set('q', exploreQ)
      if (typeFilter) params.set('type', typeFilter)
      const res = await api.get(`/super-comm/channel/explore?${params}`)
      return Array.isArray(res.data?.data) ? res.data.data : []
    },
    enabled: tab === 'explore'
  })

  const handleCreate = async () => {
    if (!channelName.trim() || !user?.id) return
    setCreating(true)
    try {
      const res = await api.post('/super-comm/channel', {
        name: channelName,
        description: channelDesc,
        ownerId: user.id,
        type: channelType
      })
      const channelId = res.data?.data?._id || res.data?._id
      qc.invalidateQueries({ queryKey: ['my-channels'] })
      setShowCreate(false)
      setChannelName(''); setChannelDesc('')
      if (channelId) router.push(`/channels/${channelId}`)
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  const subscribeToChannel = async (channelId: string) => {
    try {
      await api.post('/super-comm/channel/subscribe', { channelId, userId: user?.id })
      qc.invalidateQueries({ queryKey: ['my-channels'] })
      qc.invalidateQueries({ queryKey: ['explore-channels'] })
      router.push(`/channels/${channelId}`)
    } catch (e) { console.error(e) }
  }

  const filteredMy = searchQ
    ? myChannels.filter((c: any) => c.name?.toLowerCase().includes(searchQ.toLowerCase()))
    : myChannels

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-48 left-[-90px] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 pt-4 pb-0 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl">
              <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
            </button>
            <div>
              <h1 className="font-black text-xl text-[var(--text-primary)]">Channels</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Broadcasts & Communities</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus size={16} /> New Channel
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['my', 'explore'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 py-2.5 text-sm font-black capitalize rounded-t-xl transition-all border-b-2',
                tab === t
                  ? 'text-indigo-500 border-indigo-500 bg-indigo-500/5'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              )}
            >
              {t === 'my' ? 'My Channels' : '🔭 Explore'}
            </button>
          ))}
        </div>
      </div>

      {/* Search & filter */}
      <div className="px-4 py-3 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={tab === 'my' ? searchQ : exploreQ}
            onChange={e => tab === 'my' ? setSearchQ(e.target.value) : setExploreQ(e.target.value)}
            placeholder={tab === 'my' ? 'Search my channels...' : 'Search channels...'}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50"
          />
        </div>

        {tab === 'explore' && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CHANNEL_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border',
                  typeFilter === value
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
                )}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {tab === 'my' && (
          <>
            {loadingMy && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            )}
            {!loadingMy && filteredMy.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📢</div>
                <p className="font-black text-[var(--text-primary)] mb-1">No channels yet</p>
                <p className="text-sm text-[var(--text-secondary)]">Create a channel or subscribe to one</p>
                <div className="flex gap-2 justify-center mt-4">
                  <button onClick={() => setShowCreate(true)} className="bg-indigo-600 text-white font-black px-5 py-2.5 rounded-2xl text-sm">
                    Create Channel
                  </button>
                  <button onClick={() => setTab('explore')} className="bg-[var(--bg-elevated)] text-[var(--text-primary)] font-black px-5 py-2.5 rounded-2xl text-sm border border-[var(--border)]">
                    Explore
                  </button>
                </div>
              </div>
            )}
            {filteredMy.map((ch: any) => (
              <button
                key={ch._id}
                onClick={() => router.push(`/channels/${ch._id}`)}
                className="w-full flex items-center gap-3 p-3.5 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] rounded-2xl transition-all border border-[var(--border)] text-left"
              >
                <Av name={ch.name} avatar={ch.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-[var(--text-primary)] truncate">{ch.name}</p>
                    <span className={clsx(
                      'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0',
                      ch.type === 'broadcast'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-indigo-500/20 text-indigo-400'
                    )}>
                      {ch.type || 'text'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                    <Users size={10} />
                    {ch.subscribers?.length || 0} subscribers
                  </p>
                </div>
                <ChevronRight size={16} className="text-[var(--text-secondary)] shrink-0" />
              </button>
            ))}
          </>
        )}

        {tab === 'explore' && (
          <>
            {loadingExplore && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            )}
            {!loadingExplore && exploreChannels.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🔭</div>
                <p className="font-black text-[var(--text-primary)] mb-1">No channels found</p>
                <p className="text-sm text-[var(--text-secondary)]">Try different filters or create your own</p>
              </div>
            )}
            {exploreChannels.map((ch: any) => {
              const isSubscribed = ch.subscribers?.includes(user?.id)
              const isAdmin = ch.admins?.includes(user?.id) || ch.ownerId === user?.id
              return (
                <div
                  key={ch._id}
                  className="flex items-start gap-3 p-3.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]"
                >
                  <Av name={ch.name} avatar={ch.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-black text-sm text-[var(--text-primary)] truncate">{ch.name}</p>
                      <span className={clsx(
                        'text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0',
                        ch.type === 'broadcast' ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'
                      )}>
                        {ch.type || 'text'}
                      </span>
                    </div>
                    {ch.description && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-1">{ch.description}</p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                      <Users size={10} /> {ch.subscribers?.length || 0} subscribers
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isAdmin || isSubscribed ? (
                      <button
                        onClick={() => router.push(`/channels/${ch._id}`)}
                        className="bg-green-600/20 text-green-400 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                      >
                        <Check size={12} /> Open
                      </button>
                    ) : (
                      <button
                        onClick={() => subscribeToChannel(ch._id)}
                        className="bg-indigo-600 text-white font-black px-3 py-1.5 rounded-xl text-xs active:scale-95 transition-all"
                      >
                        Subscribe
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-[var(--text-primary)]">New Channel</h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Broadcast to your audience</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 bg-[var(--bg-elevated)] hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Channel type */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Channel Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'broadcast', label: 'Broadcast', desc: 'One-way announcements', icon: Megaphone },
                    { value: 'text', label: 'Community', desc: 'Two-way discussions', icon: Hash },
                    { value: 'announcement', label: 'News Feed', desc: 'Curated content', icon: Radio },
                    { value: 'forum', label: 'Forum', desc: 'Threaded discussions', icon: Globe },
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setChannelType(value)}
                      className={clsx(
                        'p-3 rounded-xl border-2 transition-all text-left',
                        channelType === value
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-[var(--border)] hover:border-indigo-500/30'
                      )}
                    >
                      <Icon size={16} className={channelType === value ? 'text-indigo-400 mb-1' : 'text-[var(--text-secondary)] mb-1'} />
                      <p className={clsx('font-black text-xs', channelType === value ? 'text-indigo-400' : 'text-[var(--text-primary)]')}>{label}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Channel Name *</p>
                <input
                  value={channelName}
                  onChange={e => setChannelName(e.target.value)}
                  placeholder="e.g. Daily Tech News"
                  className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-indigo-500 rounded-xl p-3 font-bold text-[var(--text-primary)] outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Description</p>
                <textarea
                  value={channelDesc}
                  onChange={e => setChannelDesc(e.target.value)}
                  placeholder="Tell people what this channel is about..."
                  rows={3}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none resize-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={!channelName.trim() || creating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-500/25"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                {creating ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
