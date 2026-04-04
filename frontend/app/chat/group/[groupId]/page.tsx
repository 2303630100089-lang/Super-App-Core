'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { socketService } from '@/lib/socket'
import {
  ArrowLeft, Send, Plus, Info, X, Users, Shield, ShieldOff,
  UserMinus, Edit3, Check, Loader2, BarChart2, Calendar,
  Clock, Bell, AlertTriangle, Pin, Link2, SmilePlus,
  Reply, Trash2, Volume2, VolumeX, Ban, Copy, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Reaction { userId: string; emoji: string }
interface Msg {
  _id: string; senderId: string; senderName?: string; content: string; type?: string
  createdAt: string; reactions?: Reaction[]; replyTo?: any; isPinned?: boolean
  isDeleted?: boolean; isEdited?: boolean
}

const QUICK_EMOJIS = ['👍','❤️','😂','😮','😢','🔥','🎉','👏']

// ─── Reaction bar ───────────────────────────────────────────────────────────────
function ReactionBar({ msgId, userId, existing, onReact, onClose }: { msgId: string; userId: string; existing: Reaction[]; onReact: (e: string) => void; onClose: () => void }) {
  const userEmoji = existing.find(r => r.userId === userId)?.emoji
  return (
    <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-2 py-1.5 shadow-xl z-50 animate-in zoom-in-90">
      {QUICK_EMOJIS.map(e => (
        <button key={e} onClick={() => { onReact(e); onClose() }}
          className={clsx('text-lg leading-none w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-125', userEmoji === e ? 'bg-blue-500/20' : 'hover:bg-[var(--bg-elevated)]')}>
          {e}
        </button>
      ))}
    </div>
  )
}

// ─── Message bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg, isMe, isAdmin, userId, onReact, onReply, onPin, onDelete, onContextMenu }: {
  msg: Msg; isMe: boolean; isAdmin: boolean; userId: string
  onReact: (msgId: string, emoji: string) => void
  onReply: (msg: Msg) => void
  onPin: (msgId: string) => void
  onDelete: (msgId: string) => void
  onContextMenu: (msgId: string, e: React.MouseEvent) => void
}) {
  if (msg.isDeleted && !msg.content) return (
    <div className="flex px-4 mb-2 justify-center">
      <span className="text-xs text-[var(--text-secondary)] italic">🗑️ Message deleted</span>
    </div>
  )

  let parsed: any = null
  if (msg.type && msg.type !== 'text' && msg.type !== 'system') {
    try { parsed = JSON.parse(msg.content) } catch {}
  }

  if (msg.type === 'system') return (
    <div className="flex px-4 mb-2 justify-center">
      <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-3 py-1 rounded-full border border-[var(--border)]">{msg.content}</span>
    </div>
  )

  const grouped = msg.reactions?.reduce((acc: Record<string, string[]>, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = []
    acc[r.emoji].push(r.userId)
    return acc
  }, {})

  const renderContent = () => {
    if (parsed?.question) return (
      <div className="space-y-2 min-w-[200px]">
        <p className="font-black text-sm">{parsed.question}</p>
        {parsed.options?.map((o: string, i: number) => (
          <div key={i} className="p-2.5 rounded-xl border-2 border-white/20 bg-white/10 text-xs font-bold hover:bg-white/20 transition-all cursor-pointer">{o}</div>
        ))}
        <p className="text-[10px] opacity-60 font-bold uppercase tracking-wider">📊 Poll</p>
      </div>
    )
    if (msg.type === 'alert') return <div className="flex items-center gap-2"><AlertTriangle size={14}/><p className="text-sm font-bold">{msg.content}</p></div>
    if (msg.type === 'notice') return <div className="flex items-center gap-2"><Bell size={14}/><p className="text-sm font-bold">{msg.content}</p></div>
    if (msg.type === 'reminder') return <div className="flex items-center gap-2"><Clock size={14}/><p className="text-sm font-bold">{msg.content}</p></div>
    if (parsed?.title) return (
      <div className="space-y-1">
        <p className="font-black text-sm">📅 {parsed.title}</p>
        {parsed.date && <p className="text-xs opacity-80">{parsed.date}{parsed.time ? ` · ${parsed.time}` : ''}</p>}
        {parsed.location && <p className="text-xs opacity-80">📍 {parsed.location}</p>}
      </div>
    )
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
  }

  return (
    <div className={clsx('flex px-3 mb-2 group', isMe ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[78%]">
        {/* Sender name */}
        {!isMe && <p className="text-[10px] font-black text-blue-400 mb-1 px-1">{msg.senderName || msg.senderId}</p>}

        {/* Reply preview */}
        {msg.replyTo && (
          <div className={clsx('text-xs px-3 py-1.5 rounded-t-xl rounded-b-sm border-l-2 mb-1 opacity-80',
            isMe ? 'bg-blue-700 border-blue-300 text-blue-100' : 'bg-[var(--bg-elevated)] border-blue-400 text-[var(--text-secondary)]')}>
            <p className="font-black">↩ {msg.replyTo.senderId}</p>
            <p className="truncate">{msg.replyTo.content}</p>
          </div>
        )}

        {/* Main bubble */}
        <div
          className={clsx(
            'relative px-4 py-3 rounded-2xl shadow-sm select-text',
            isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]',
            msg.type === 'alert' && 'bg-red-500 text-white',
            msg.type === 'notice' && 'bg-amber-400 text-black',
            msg.type === 'reminder' && 'bg-indigo-500 text-white',
            msg.isPinned && 'ring-2 ring-yellow-400/60',
          )}
          onContextMenu={e => onContextMenu(msg._id, e)}
        >
          {msg.isPinned && <div className="absolute -top-2 -right-2 text-yellow-400"><Pin size={12}/></div>}
          {renderContent()}
          <div className={clsx('flex items-center justify-end gap-1 mt-1.5')}>
            {msg.isEdited && <span className="text-[9px] opacity-50">edited</span>}
            <p className={clsx('text-[9px]', isMe ? 'opacity-60' : 'text-[var(--text-secondary)]')}>
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Reactions */}
        {grouped && Object.keys(grouped).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(grouped).map(([emoji, voters]) => (
              <button key={emoji} onClick={() => onReact(msg._id, emoji)}
                className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all',
                  voters.includes(userId)
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-blue-400'
                )}>
                {emoji} <span className="font-bold">{voters.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick action bar on hover */}
        <div className={clsx('flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-all', isMe ? 'justify-end' : 'justify-start')}>
          <button onClick={() => onReply(msg)} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-blue-400 transition-colors">
            <Reply size={12}/>
          </button>
          {(isMe || isAdmin) && (
            <button onClick={() => onPin(msg._id)} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-yellow-400 transition-colors">
              <Pin size={12}/>
            </button>
          )}
          {(isMe || isAdmin) && (
            <button onClick={() => onDelete(msg._id)} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors">
              <Trash2 size={12}/>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function GroupChatPage() {
  const { groupId } = useParams()
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [contextMsgId, setContextMsgId] = useState<string | null>(null)
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 })
  const [showReactionFor, setShowReactionFor] = useState<string | null>(null)
  const [modal, setModal] = useState<'poll'|'event'|'reminder'|'notice'|'alert'|null>(null)
  const [specialText, setSpecialText] = useState('')
  const [pollQ, setPollQ] = useState(''); const [pollOpts, setPollOpts] = useState(['', ''])
  const [eventData, setEventData] = useState({ title: '', date: '', time: '', location: '' })

  // Info panel
  const [editDesc, setEditDesc] = useState(false)
  const [descVal, setDescVal] = useState('')
  const [addMemberId, setAddMemberId] = useState('')
  const [savingDesc, setSavingDesc] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [infoTab, setInfoTab] = useState<'info'|'members'>('info')
  const [memberAction, setMemberAction] = useState<{uid: string; action: 'mute'|'ban'} | null>(null)

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data } = await api.get(`/super-comm/group/${groupId}`)
      return data
    },
    enabled: !!groupId
  })

  const chatId = group?.chatId?._id || group?.chatId

  // Load messages
  useEffect(() => {
    if (!groupId) return
    api.get(`/super-comm/group/${groupId}/messages`).then(r => {
      setMessages(Array.isArray(r.data?.data) ? r.data.data : [])
    }).catch(() => {
      if (chatId) {
        api.get(`/super-comm/chat/${chatId}/messages`).then(r => {
          setMessages(Array.isArray(r.data) ? r.data : [])
        }).catch(() => {})
      }
    })
  }, [groupId, chatId])

  // Socket
  useEffect(() => {
    if (!user || !chatId) return
    const socket = socketService.connect(user)
    socketService.joinChat(chatId)
    socket?.on('message_received', (m: any) => {
      if (m.chatId === chatId || m.chatId?._id === chatId) {
        setMessages(prev => [...prev, m])
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    })
    return () => { socket?.off('message_received') }
  }, [user, chatId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (group?.description) setDescVal(group.description) }, [group])

  const isAdmin = group?.admins?.includes(user?.id)
  const groupName = group?.chatId?.chatName || group?.name || 'Group'
  const participants: string[] = group?.chatId?.participants || []

  const sendMsg = async (type = 'text', content?: string) => {
    const msgContent = content ?? text
    if (!msgContent.trim()) return
    setSending(true)
    const tempId = `t_${Date.now()}`
    const temp: Msg = { _id: tempId, senderId: user?.id || '', content: msgContent, type, createdAt: new Date().toISOString(), replyTo: replyTo || undefined }
    setMessages(prev => [...prev, temp])
    setText('')
    setReplyTo(null)
    try {
      const { data } = await api.post(`/super-comm/group/${groupId}/messages`, {
        senderId: user?.id, content: msgContent,
        replyTo: replyTo?._id || null,
        mentions: (msgContent.match(/@([a-zA-Z0-9_]+)/g) || []).map((m: string) => m.slice(1))
      })
      const msg = data?.data || data
      socketService.sendMessage({ ...msg, chatId })
      setMessages(prev => prev.map(m => m._id === tempId ? msg : m))
    } catch { setMessages(prev => prev.filter(m => m._id !== tempId)) }
    finally { setSending(false) }
  }

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      const { data } = await api.post(`/super-comm/group/${groupId}/messages/${msgId}/react`, { userId: user?.id, emoji })
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reactions: data?.data || m.reactions } : m))
    } catch {}
    setShowReactionFor(null)
  }

  const handlePin = async (msgId: string) => {
    await api.post(`/super-comm/group/${groupId}/messages/${msgId}/pin`).catch(() => {})
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isPinned: !m.isPinned } : m))
  }

  const handleDelete = async (msgId: string) => {
    await api.delete(`/super-comm/group/${groupId}/messages/${msgId}`, { data: { userId: user?.id, forEveryone: isAdmin } }).catch(() => {})
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true, content: '' } : m))
  }

  const handleContextMenu = (msgId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setContextMsgId(msgId)
    setContextPos({ x: e.clientX, y: e.clientY })
  }

  const sendSpecial = () => {
    if (modal === 'poll') {
      const opts = pollOpts.filter(o => o.trim())
      if (!pollQ.trim() || opts.length < 2) return
      sendMsg('poll', JSON.stringify({ question: pollQ, options: opts }))
      setPollQ(''); setPollOpts(['', ''])
    } else if (modal === 'event') {
      if (!eventData.title.trim()) return
      sendMsg('event', JSON.stringify(eventData))
      setEventData({ title: '', date: '', time: '', location: '' })
    } else if (modal) {
      if (!specialText.trim()) return
      sendMsg(modal, specialText)
      setSpecialText('')
    }
    setModal(null)
  }

  const saveDesc = async () => {
    setSavingDesc(true)
    await api.patch(`/super-comm/group/${groupId}/description`, { description: descVal }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
    setEditDesc(false); setSavingDesc(false)
  }

  const makeAdmin = async (uid: string) => {
    await api.post(`/super-comm/group/${groupId}/admin`, { userId: uid }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
  }

  const removeAdmin = async (uid: string) => {
    await api.delete(`/super-comm/group/${groupId}/admin/${uid}`).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
  }

  const removeMember = async (uid: string) => {
    await api.delete(`/super-comm/group/${groupId}/members/${uid}`).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
  }

  const addMember = async () => {
    if (!addMemberId.trim()) return
    await api.post(`/super-comm/group/${groupId}/members`, { userIds: [addMemberId] }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
    setAddMemberId('')
  }

  const copyInviteLink = async () => {
    const link = inviteLink || `${window.location.origin}/invite/group/${group?.inviteCode || groupId}`
    setInviteLink(link)
    await navigator.clipboard.writeText(link).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const muteMember = async (uid: string) => {
    await api.post(`/group/${groupId}/mute`, { userId: uid, muteDurationSeconds: 3600 }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
    setMemberAction(null)
  }

  const banMember = async (uid: string) => {
    await api.post(`/group/${groupId}/ban`, { userId: uid }).catch(() => {})
    qc.invalidateQueries({ queryKey: ['group', groupId] })
    setMemberAction(null)
  }

  const pinnedMessages = messages.filter(m => m.isPinned && !m.isDeleted)

  if (isLoading) return (
    <div className="flex items-center justify-center h-full bg-[var(--bg-primary)]">
      <Loader2 size={28} className="animate-spin text-blue-600"/>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden" onClick={() => { setContextMsgId(null); setShowReactionFor(null) }}>

      {/* Header */}
      <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl">
            <ArrowLeft size={20} className="text-[var(--text-primary)]"/>
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg">
            {groupName[0]}
          </div>
          <div>
            <p className="font-black text-sm text-[var(--text-primary)]">{groupName}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">{participants.length} members</p>
          </div>
        </div>
        <div className="flex gap-1">
          {pinnedMessages.length > 0 && (
            <button onClick={() => setShowPinned(true)} className="p-2 bg-yellow-500/20 rounded-xl text-yellow-400 relative">
              <Pin size={16}/>
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{pinnedMessages.length}</span>
            </button>
          )}
          <button onClick={() => setShowInfo(true)} className="p-2 bg-[var(--bg-elevated)] rounded-xl text-[var(--text-secondary)]">
            <Info size={18}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {messages.length === 0 && (
          <div className="text-center py-16 text-[var(--text-secondary)]">
            <div className="text-4xl mb-2">👋</div>
            <p className="font-black">Say hello to the group!</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg._id} className="relative">
            {showReactionFor === msg._id && (
              <div className={clsx('absolute z-30', msg.senderId === user?.id ? 'right-4 bottom-full mb-1' : 'left-4 bottom-full mb-1')}>
                <ReactionBar
                  msgId={msg._id} userId={user?.id || ''}
                  existing={msg.reactions || []}
                  onReact={(e) => handleReact(msg._id, e)}
                  onClose={() => setShowReactionFor(null)}
                />
              </div>
            )}
            <Bubble
              msg={msg} isMe={msg.senderId === user?.id}
              isAdmin={!!isAdmin} userId={user?.id || ''}
              onReact={handleReact}
              onReply={m => { setReplyTo(m); inputRef.current?.focus() }}
              onPin={handlePin}
              onDelete={handleDelete}
              onContextMenu={handleContextMenu}
            />
          </div>
        ))}
        <div ref={endRef}/>
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="mx-3 mb-1 flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Replying to {replyTo.senderId}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-[var(--text-secondary)] hover:text-red-400">
            <X size={14}/>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="bg-[var(--bg-card)] border-t border-[var(--border)] p-3 relative z-10">
        <div className="flex items-end gap-2">
          <button
            onClick={() => setShowAttach(!showAttach)}
            className={clsx('p-3 rounded-2xl transition-all shrink-0', showAttach ? 'bg-blue-600 text-white rotate-45' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]')}
          >
            <Plus size={22}/>
          </button>
          <div className="flex-1 bg-[var(--bg-elevated)] rounded-2xl px-4 py-2.5 border-2 border-transparent focus-within:border-blue-500 transition-all">
            <textarea
              ref={inputRef}
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
              placeholder="Message group..." rows={1}
              className="w-full bg-transparent outline-none text-[var(--text-primary)] resize-none max-h-28 text-sm"
            />
          </div>
          <button
            onClick={() => showReactionFor ? setShowReactionFor(null) : null}
            className="p-3 rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] shrink-0"
            title="React"
          >
            <SmilePlus size={20}/>
          </button>
          <button onClick={() => sendMsg()} disabled={!text.trim() || sending}
            className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all shrink-0">
            {sending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
          </button>
        </div>

        {/* Attach menu */}
        {showAttach && (
          <div className="absolute bottom-full mb-3 left-3 right-3 bg-[var(--bg-card)] rounded-[2rem] shadow-2xl border border-[var(--border)] p-5 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 z-20">
            {[
              { icon: BarChart2, label: 'Poll',     color: 'bg-purple-500', action: () => { setModal('poll');     setShowAttach(false) } },
              { icon: Calendar,  label: 'Event',    color: 'bg-blue-500',   action: () => { setModal('event');    setShowAttach(false) } },
              { icon: Clock,     label: 'Reminder', color: 'bg-indigo-500', action: () => { setModal('reminder'); setShowAttach(false) } },
              { icon: Bell,      label: 'Notice',   color: 'bg-amber-500',  action: () => { setModal('notice');   setShowAttach(false) } },
              { icon: AlertTriangle, label: 'Alert', color: 'bg-red-500',   action: () => { setModal('alert');    setShowAttach(false) } },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-2 group">
                <div className={clsx('p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform', item.color)}><item.icon size={22}/></div>
                <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMsgId && (
        <div
          className="fixed z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl py-2 min-w-[160px]"
          style={{ left: Math.min(contextPos.x, window.innerWidth - 180), top: Math.min(contextPos.y, window.innerHeight - 200) }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { icon: SmilePlus, label: 'React', action: () => { setShowReactionFor(contextMsgId); setContextMsgId(null) } },
            { icon: Reply,   label: 'Reply', action: () => { const m = messages.find(x => x._id === contextMsgId); if (m) setReplyTo(m); setContextMsgId(null) } },
            { icon: Pin,     label: 'Pin',   action: () => { handlePin(contextMsgId); setContextMsgId(null) } },
            { icon: Trash2,  label: 'Delete', action: () => { handleDelete(contextMsgId); setContextMsgId(null) }, danger: true },
          ].map(item => (
            <button key={item.label} onClick={item.action}
              className={clsx('w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold hover:bg-[var(--bg-elevated)] transition-colors',
                (item as any).danger ? 'text-red-400' : 'text-[var(--text-primary)]')}>
              <item.icon size={15}/>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Pinned messages panel */}
      {showPinned && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowPinned(false)}>
          <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)]">
              <div className="flex items-center gap-2">
                <Pin size={16} className="text-yellow-400"/>
                <h3 className="font-black text-[var(--text-primary)]">Pinned Messages</h3>
              </div>
              <button onClick={() => setShowPinned(false)} className="p-2 bg-[var(--bg-elevated)] rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-4 space-y-3">
              {pinnedMessages.length === 0 && <p className="text-center text-[var(--text-secondary)] py-8">No pinned messages</p>}
              {pinnedMessages.map(msg => (
                <div key={msg._id} className="p-3 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)]">
                  <p className="text-[10px] font-black text-blue-400 mb-1">{msg.senderId}</p>
                  <p className="text-sm text-[var(--text-primary)]">{msg.content}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">{new Date(msg.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Group Info Panel */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            {/* Panel header */}
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
              <h3 className="font-black text-lg text-[var(--text-primary)]">Group Info</h3>
              <button onClick={() => setShowInfo(false)} className="p-2 bg-[var(--bg-elevated)] rounded-xl"><X size={18}/></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
              {(['info', 'members'] as const).map(t => (
                <button key={t} onClick={() => setInfoTab(t)}
                  className={clsx('flex-1 py-3 text-sm font-black capitalize transition-all',
                    infoTab === t ? 'text-blue-500 border-b-2 border-blue-500' : 'text-[var(--text-secondary)]')}>
                  {t === 'info' ? '📋 Info' : `👥 Members (${participants.length})`}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-5">
              {infoTab === 'info' && (
                <>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">{groupName[0]}</div>
                    <div>
                      <p className="font-black text-lg text-[var(--text-primary)]">{groupName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{participants.length} members</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Description</p>
                      {isAdmin && (
                        <button onClick={() => setEditDesc(!editDesc)} className="text-blue-500 text-xs font-bold flex items-center gap-1">
                          <Edit3 size={12}/>{editDesc ? 'Cancel' : 'Edit'}
                        </button>
                      )}
                    </div>
                    {editDesc ? (
                      <div className="space-y-2">
                        <textarea value={descVal} onChange={e => setDescVal(e.target.value)} rows={3}
                          className="w-full bg-[var(--bg-elevated)] border-2 border-blue-500 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none resize-none"/>
                        <button onClick={saveDesc} disabled={savingDesc}
                          className="w-full bg-blue-600 text-white font-black py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                          {savingDesc ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">{group?.description || 'No description yet.'}</p>
                    )}
                  </div>

                  {/* Invite link */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Invite Link</p>
                    <button onClick={copyInviteLink}
                      className="w-full flex items-center gap-3 p-3.5 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] hover:border-blue-500/50 transition-all">
                      <Link2 size={16} className="text-blue-400 shrink-0"/>
                      <p className="text-xs text-[var(--text-secondary)] truncate flex-1">
                        {inviteLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/group/${group?.inviteCode || groupId}`}
                      </p>
                      {linkCopied ? <Check size={16} className="text-green-400 shrink-0"/> : <Copy size={16} className="text-[var(--text-secondary)] shrink-0"/>}
                    </button>
                  </div>

                  {/* Add member (admin only) */}
                  {isAdmin && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Add Member</p>
                      <div className="flex gap-2">
                        <input value={addMemberId} onChange={e => setAddMemberId(e.target.value)} placeholder="User ID"
                          className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none"/>
                        <button onClick={addMember} className="bg-blue-600 text-white px-4 rounded-xl font-black text-sm active:scale-95 transition-all">Add</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {infoTab === 'members' && (
                <div className="space-y-2">
                  {participants.map((uid: string) => {
                    const isThisAdmin = group?.admins?.includes(uid)
                    const isMe = uid === user?.id
                    return (
                      <div key={uid} className="flex items-center gap-3 p-2.5 bg-[var(--bg-elevated)] rounded-xl">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 uppercase">{uid[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{uid}{isMe && ' (You)'}</p>
                          {isThisAdmin && <p className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1"><Shield size={9}/>Admin</p>}
                        </div>
                        {isAdmin && !isMe && (
                          <div className="flex gap-0.5">
                            {!isThisAdmin ? (
                              <button onClick={() => makeAdmin(uid)} title="Make admin" className="p-1.5 text-green-500 hover:bg-green-900/20 rounded-lg transition-colors"><Shield size={14}/></button>
                            ) : (
                              <button onClick={() => removeAdmin(uid)} title="Remove admin" className="p-1.5 text-orange-500 hover:bg-orange-900/20 rounded-lg transition-colors"><ShieldOff size={14}/></button>
                            )}
                            <button onClick={() => muteMember(uid)} title="Mute member" className="p-1.5 text-yellow-500 hover:bg-yellow-900/20 rounded-lg transition-colors"><VolumeX size={14}/></button>
                            <button onClick={() => banMember(uid)} title="Ban member" className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><Ban size={14}/></button>
                            <button onClick={() => removeMember(uid)} title="Remove member" className="p-1.5 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"><UserMinus size={14}/></button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Special message modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
              <h3 className="font-black text-lg text-[var(--text-primary)] capitalize">Create {modal}</h3>
              <button onClick={() => setModal(null)} className="p-2 bg-[var(--bg-elevated)] rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              {modal === 'poll' && (
                <>
                  <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="Your question..."
                    className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-purple-500 rounded-xl p-3.5 font-bold text-[var(--text-primary)] outline-none"/>
                  {pollOpts.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={o} onChange={e => { const n=[...pollOpts]; n[i]=e.target.value; setPollOpts(n) }} placeholder={`Option ${i+1}`}
                        className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none"/>
                      {pollOpts.length > 2 && <button onClick={() => setPollOpts(pollOpts.filter((_,j)=>j!==i))} className="p-2 text-red-400"><X size={16}/></button>}
                    </div>
                  ))}
                  {pollOpts.length < 6 && <button onClick={() => setPollOpts([...pollOpts,''])} className="text-purple-500 text-xs font-black uppercase tracking-widest">+ Add Option</button>}
                </>
              )}
              {modal === 'event' && (
                <>
                  <input value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} placeholder="Event title"
                    className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 font-bold text-[var(--text-primary)] outline-none"/>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={eventData.date} onChange={e => setEventData({...eventData, date: e.target.value})}
                      className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none"/>
                    <input type="time" value={eventData.time} onChange={e => setEventData({...eventData, time: e.target.value})}
                      className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none"/>
                  </div>
                  <input value={eventData.location} onChange={e => setEventData({...eventData, location: e.target.value})} placeholder="Location"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none"/>
                </>
              )}
              {['reminder','notice','alert'].includes(modal) && (
                <textarea value={specialText} onChange={e => setSpecialText(e.target.value)} placeholder={`${modal} message...`} rows={3}
                  className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 text-[var(--text-primary)] outline-none resize-none"/>
              )}
            </div>
            <div className="p-5 border-t border-[var(--border)]">
              <button onClick={sendSpecial} className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl uppercase tracking-widest active:scale-95 transition-all">
                Send {modal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
