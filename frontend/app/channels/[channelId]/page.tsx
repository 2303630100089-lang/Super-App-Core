'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import {
  ArrowLeft, Bell, BellOff, Info, Send, X, Users, Shield, Edit3,
  Check, Loader2, Plus, Pin, BarChart2, Calendar, Clock,
  SmilePlus, Trash2, Copy, ChevronRight, Eye, TrendingUp, LogOut
} from 'lucide-react'
import clsx from 'clsx'

const QUICK_EMOJIS = ['👍','❤️','😮','🔥','😂','🎉','👏','💯']

export default function ChannelPage() {
  const { channelId } = useParams()
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const endRef = useRef<HTMLDivElement>(null)

  const [showInfo, setShowInfo] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [editDesc, setEditDesc] = useState(false)
  const [descVal, setDescVal] = useState('')
  const [addAdminId, setAddAdminId] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [reactionFor, setReactionFor] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')

  const { data: channelRaw, isLoading } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/super-comm/channel/${channelId}`)
      return data?.data || data
    },
    enabled: !!channelId
  })
  const channel = channelRaw

  const { data: analytics } = useQuery({
    queryKey: ['channel-analytics', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/super-comm/channel/${channelId}/analytics`)
      return data?.data
    },
    enabled: !!channelId && showAnalytics
  })

  useEffect(() => {
    if (!channelId) return
    api.get(`/super-comm/channel/${channelId}/messages`).then(r => {
      setMessages(Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [])
    }).catch(() => {})
  }, [channelId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (channel?.description) setDescVal(channel.description) }, [channel])

  const isAdmin = channel?.admins?.includes(user?.id) || channel?.ownerId === user?.id
  const isSubscribed = channel?.subscribers?.includes(user?.id)

  const sendMsg = async () => {
    if (!msgText.trim() || !isAdmin) return
    setSending(true)
    try {
      const { data } = await api.post(`/super-comm/channel/${channelId}/messages`, {
        senderId: user?.id, content: msgText,
        scheduledAt: scheduledAt || undefined
      })
      const msg = data?.data || data
      if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
        setMessages(prev => [...prev, msg])
      }
      setMsgText('')
      setScheduledAt('')
      setShowSchedule(false)
    } catch (e) { console.error(e) }
    finally { setSending(false) }
  }

  const recordView = async (msgId: string) => {
    api.post(`/super-comm/channel/${channelId}/messages/${msgId}/view`).catch(() => {})
  }

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      const { data } = await api.post(`/super-comm/channel/${channelId}/messages/${msgId}/react`, { userId: user?.id, emoji })
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: data?.data || m.reactions } : m))
    } catch {}
    setReactionFor(null)
  }

  const deleteMsg = async (msgId: string) => {
    await api.delete(`/super-comm/channel/${channelId}/messages/${msgId}`, { data: { userId: user?.id } }).catch(() => {})
    setMessages(prev => prev.filter(m => m._id !== msgId))
  }

  const pinMsg = async (msgId: string) => {
    await api.post(`/super-comm/channel/${channelId}/messages/${msgId}/pin`).catch(() => {})
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: !m.isPinned } : m))
  }

  const saveDesc = async () => {
    await api.put(`/super-comm/channel/${channelId}`, { description: descVal }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['channel', channelId] })
    setEditDesc(false)
  }

  const makeAdmin = async () => {
    if (!addAdminId.trim()) return
    await api.post(`/super-comm/channel/${channelId}/admin`, { userId: addAdminId }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['channel', channelId] })
    setAddAdminId('')
  }

  const subscribe = async () => {
    await api.post('/super-comm/channel/subscribe', { channelId, userId: user?.id }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['channel', channelId] })
  }

  const unsubscribe = async () => {
    await api.post('/super-comm/channel/unsubscribe', { channelId, userId: user?.id }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['channel', channelId] })
  }

  if (isLoading) return <div className="p-8 text-center dark:text-white animate-pulse">Loading channel...</div>

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]" onClick={() => setReactionFor(null)}>

      {/* Header */}
      <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl">
            <ArrowLeft size={20} className="text-[var(--text-primary)]"/>
          </button>
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
            {channel?.name?.[0] || '#'}
          </div>
          <div>
            <p className="font-black text-sm text-[var(--text-primary)]">{channel?.name || 'Channel'}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">{channel?.subscribers?.length || 0} subscribers</p>
          </div>
        </div>
        <div className="flex gap-1">
          {isAdmin && (
            <button onClick={() => setShowAnalytics(true)} className="p-2 bg-[var(--bg-elevated)] rounded-xl text-[var(--text-secondary)]" title="Analytics">
              <BarChart2 size={18}/>
            </button>
          )}
          {isSubscribed && !isAdmin && (
            <button onClick={unsubscribe} className="p-2 bg-[var(--bg-elevated)] rounded-xl text-[var(--text-secondary)]" title="Mute notifications">
              <BellOff size={18}/>
            </button>
          )}
          <button onClick={() => setShowInfo(true)} className="p-2 bg-[var(--bg-elevated)] rounded-xl text-[var(--text-secondary)]">
            <Info size={18}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <p className="font-black">No posts yet</p>
            {isAdmin && <p className="text-sm mt-1">You're an admin — send the first message!</p>}
          </div>
        )}
        {messages.map((msg: any) => {
          const grouped = (msg.reactions || []).reduce((acc: Record<string, string[]>, r: any) => {
            if (!acc[r.emoji]) acc[r.emoji] = []
            acc[r.emoji].push(r.userId)
            return acc
          }, {})
          return (
            <div
              key={msg._id}
              className="max-w-2xl mx-auto bg-[var(--bg-card)] rounded-[1.5rem] p-5 shadow-sm border border-[var(--border)] group relative"
              onMouseEnter={() => recordView(msg._id)}
            >
              {msg.isPinned && (
                <div className="flex items-center gap-1 text-yellow-400 text-[10px] font-black mb-2">
                  <Pin size={10}/> PINNED
                </div>
              )}
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-wrap gap-1">
                  {Object.entries(grouped).map(([emoji, voters]: [string, any]) => (
                    <button key={emoji} onClick={e => { e.stopPropagation(); handleReact(msg._id, emoji) }}
                      className={clsx(
                        'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all',
                        (voters as string[]).includes(user?.id || '')
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
                      )}>
                      {emoji} {(voters as string[]).length}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                  {msg.viewCount > 0 && (
                    <span className="flex items-center gap-1"><Eye size={10}/> {msg.viewCount}</span>
                  )}
                  <span className="font-bold">
                    {new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Reaction bar on hover */}
              {reactionFor === msg._id && (
                <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-2 py-1.5 shadow-xl z-20" onClick={e => e.stopPropagation()}>
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => handleReact(msg._id, e)}
                      className="text-lg w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] hover:scale-125 transition-all">
                      {e}
                    </button>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className={clsx('absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all')}>
                <button onClick={e => { e.stopPropagation(); setReactionFor(msg._id) }}
                  className="p-1.5 bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-blue-400 transition-colors">
                  <SmilePlus size={13}/>
                </button>
                {isAdmin && (
                  <>
                    <button onClick={e => { e.stopPropagation(); pinMsg(msg._id) }}
                      className="p-1.5 bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-yellow-400 transition-colors">
                      <Pin size={13}/>
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteMsg(msg._id) }}
                      className="p-1.5 bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                      <Trash2 size={13}/>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input — only admins can post */}
      {isAdmin ? (
        <div className="bg-[var(--bg-card)] border-t border-[var(--border)] p-3">
          {showSchedule && (
            <div className="flex items-center gap-2 mb-2 bg-[var(--bg-elevated)] rounded-xl px-3 py-2">
              <Calendar size={14} className="text-indigo-400 shrink-0"/>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none"/>
              <button onClick={() => { setShowSchedule(false); setScheduledAt('') }} className="text-[var(--text-secondary)]"><X size={14}/></button>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowSchedule(!showSchedule)}
              className={clsx('p-3 rounded-2xl shrink-0 transition-all', showSchedule ? 'bg-indigo-500/20 text-indigo-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]')}>
              <Clock size={18}/>
            </button>
            <input value={msgText} onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder={scheduledAt ? 'Schedule a post...' : 'Broadcast a message...'}
              className="flex-1 bg-[var(--bg-elevated)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 ring-indigo-500/20" />
            <button onClick={sendMsg} disabled={!msgText.trim() || sending}
              className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all">
              {sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border-t border-[var(--border)] p-4 text-center">
          {isSubscribed ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">You're subscribed</span>
              <button onClick={unsubscribe} className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all">
                <LogOut size={14}/> Unsubscribe
              </button>
            </div>
          ) : (
            <button onClick={subscribe} className="bg-indigo-600 text-white font-black px-8 py-3 rounded-2xl text-sm active:scale-95 transition-all">
              Subscribe to Channel
            </button>
          )}
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAnalytics(false)}>
          <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-400"/>
                <h3 className="font-black text-[var(--text-primary)]">Channel Analytics</h3>
              </div>
              <button onClick={() => setShowAnalytics(false)} className="p-2 bg-[var(--bg-elevated)] rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Subscribers', value: analytics?.subscriberCount ?? channel?.subscribers?.length ?? 0, icon: Users, color: 'text-blue-400' },
                { label: 'Posts', value: analytics?.totalMessages ?? 0, icon: Send, color: 'text-green-400' },
                { label: 'Total Views', value: analytics?.totalViews ?? 0, icon: Eye, color: 'text-purple-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[var(--bg-elevated)] rounded-2xl p-4 text-center border border-[var(--border)]">
                  <Icon size={20} className={clsx(color, 'mx-auto mb-2')}/>
                  <p className="font-black text-xl text-[var(--text-primary)]">{value.toLocaleString()}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {analytics?.topMessages?.length > 0 && (
              <div className="px-5 pb-5">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Top Posts by Views</p>
                <div className="space-y-2">
                  {analytics.topMessages.map((m: any) => (
                    <div key={m._id} className="flex items-center gap-3 p-2.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
                      <TrendingUp size={14} className="text-indigo-400 shrink-0"/>
                      <p className="flex-1 text-xs text-[var(--text-primary)] truncate">{m.content}</p>
                      <span className="text-xs font-black text-[var(--text-secondary)] flex items-center gap-1 shrink-0">
                        <Eye size={10}/> {m.viewCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Panel */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-black text-lg text-[var(--text-primary)]">Channel Info</h3>
              <button onClick={() => setShowInfo(false)} className="p-2 bg-[var(--bg-elevated)] rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                  {channel?.name?.[0]}
                </div>
                <div>
                  <p className="font-black text-lg text-[var(--text-primary)]">{channel?.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{channel?.subscribers?.length} subscribers</p>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full">{channel?.type || 'broadcast'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Description</p>
                  {isAdmin && (
                    <button onClick={() => setEditDesc(!editDesc)} className="text-indigo-500 text-xs font-bold flex items-center gap-1">
                      <Edit3 size={12}/> {editDesc ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
                {editDesc ? (
                  <div className="space-y-2">
                    <textarea value={descVal} onChange={e => setDescVal(e.target.value)} rows={3}
                      className="w-full bg-[var(--bg-elevated)] border-2 border-indigo-500 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none resize-none" />
                    <button onClick={saveDesc} className="w-full bg-indigo-600 text-white font-black py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                      <Check size={14}/> Save Description
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">{channel?.description || 'No description yet.'}</p>
                )}
              </div>

              {/* Admins */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Admins</p>
                {channel?.admins?.map((adminId: string) => (
                  <div key={adminId} className="flex items-center gap-3 p-2.5 bg-[var(--bg-elevated)] rounded-xl">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm uppercase">
                      {adminId[0]}
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)] flex-1">{adminId}</p>
                    <Shield size={14} className="text-indigo-500"/>
                  </div>
                ))}
              </div>

              {/* Add admin */}
              {channel?.ownerId === user?.id && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Add Sub-Admin</p>
                  <div className="flex gap-2">
                    <input value={addAdminId} onChange={e => setAddAdminId(e.target.value)}
                      placeholder="User ID to make admin"
                      className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none" />
                    <button onClick={makeAdmin} className="bg-indigo-600 text-white px-4 rounded-xl font-black text-sm active:scale-95 transition-all">
                      <Plus size={16}/>
                    </button>
                  </div>
                </div>
              )}

              {/* Unsubscribe */}
              {isSubscribed && !isAdmin && (
                <button onClick={unsubscribe} className="w-full flex items-center justify-center gap-2 p-3 border border-red-400/40 text-red-400 font-black rounded-2xl text-sm hover:bg-red-400/10 transition-all">
                  <LogOut size={14}/> Unsubscribe from Channel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


