'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { socketService } from '@/lib/socket'
import Link from 'next/link'
import {
  Send, ArrowLeft, Plus, Image as ImageIcon, BarChart2,
  Calendar, Clock, Bell, AlertTriangle, MoreVertical,
  Reply, Trash2, Phone, Video, Check, CheckCheck,
  X, User, Loader2, Info
} from 'lucide-react'
import clsx from 'clsx'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Msg {
  _id: string; content: string; sender: string; chatId?: string
  type?: string; replyTo?: any; reactions?: { emoji: string; user: string }[]
  createdAt: string; status?: string
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Av = ({ name, avatar }: { name?: string; avatar?: string }) => {
  if (avatar) return <img src={avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 uppercase">
      {name?.[0] || 'U'}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg, isMe, onReact, onReply, onDelete, userName }: {
  msg: Msg; isMe: boolean
  onReact: (id: string, emoji: string) => void
  onReply: (msg: Msg) => void
  onDelete: (id: string) => void
  userName?: string
}) {
  const [showEmoji, setShowEmoji] = useState(false)

  let parsed: any = null
  if (msg.type && msg.type !== 'text') {
    try { parsed = JSON.parse(msg.content) } catch { parsed = null }
  }

  const renderContent = () => {
    if (parsed && msg.type === 'poll') return (
      <div className="space-y-2 min-w-[200px]">
        <p className="font-black text-sm">{parsed.question}</p>
        {parsed.options?.map((o: string, i: number) => (
          <button key={i} className="w-full text-left p-2.5 rounded-xl border-2 border-white/20 bg-white/10 hover:bg-white/25 text-xs font-bold transition-all">{o}</button>
        ))}
      </div>
    )
    if (parsed && msg.type === 'event') return (
      <div className="space-y-1.5 min-w-[180px]">
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase opacity-70"><Calendar size={12}/>{parsed.type || 'Event'}</div>
        <p className="font-black text-sm">{parsed.title}</p>
        {parsed.date && <p className="text-[10px] opacity-70 flex items-center gap-1"><Clock size={10}/>{parsed.date} {parsed.time}</p>}
        {parsed.location && <p className="text-[10px] opacity-70">{parsed.location}</p>}
      </div>
    )
    if (msg.type === 'alert') return (
      <div className="flex items-start gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5"/><p className="text-sm font-bold">{msg.content}</p></div>
    )
    if (msg.type === 'notice') return (
      <div className="flex items-start gap-2"><Bell size={16} className="shrink-0 mt-0.5"/><p className="text-sm font-bold">{msg.content}</p></div>
    )
    if (msg.type === 'reminder') return (
      <div className="flex items-start gap-2"><Clock size={16} className="shrink-0 mt-0.5"/><p className="text-sm font-bold">{msg.content}</p></div>
    )
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
  }

  return (
    <div className={clsx('flex gap-2 group px-4 mb-3', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe && <Av name={userName} />}
      <div className="max-w-[75%] space-y-1">
        {msg.replyTo && (
          <div className="text-[10px] opacity-60 border-l-2 border-current pl-2 mb-1 truncate">
            ↩ {msg.replyTo.content}
          </div>
        )}
        <div className={clsx('relative px-4 py-3 rounded-2xl shadow-sm',
          isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border dark:border-gray-700',
          msg.type === 'alert' && 'bg-red-500 text-white',
          msg.type === 'notice' && 'bg-amber-400 text-black',
          msg.type === 'reminder' && 'bg-indigo-500 text-white',
        )}>
          {renderContent()}
          <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
            <span className="text-[9px]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {isMe && (msg.status === 'read' ? <CheckCheck size={11}/> : <Check size={11}/>)}
          </div>
          {/* Reactions */}
          {(msg.reactions?.length || 0) > 0 && (
            <div className="absolute -bottom-3 flex gap-0.5 bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5 shadow border dark:border-gray-600 text-xs">
              {Array.from(new Set(msg.reactions!.map(r => r.emoji))).map((e, i) => <span key={i}>{e}</span>)}
            </div>
          )}
        </div>
        {/* Action bar on hover */}
        <div className={clsx('hidden group-hover:flex items-center gap-1', isMe ? 'justify-end' : 'justify-start')}>
          <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-lg p-1">
            {showEmoji ? (
              <>
                {['❤️','👍','🔥','😂','😮','😢'].map(e => (
                  <button key={e} onClick={() => { onReact(msg._id, e); setShowEmoji(false) }}
                    className="hover:scale-125 transition-transform text-sm px-0.5">{e}</button>
                ))}
                <button onClick={() => setShowEmoji(false)} className="p-1 text-gray-400"><X size={12}/></button>
              </>
            ) : (
              <>
                <button onClick={() => setShowEmoji(true)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">😊</button>
                <button onClick={() => onReply(msg)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-blue-500"><Reply size={14}/></button>
                {isMe && <button onClick={() => onDelete(msg._id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-400"><Trash2 size={14}/></button>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const { id: chatId } = useParams()
  const { user } = useAuthStore()
  const router = useRouter()

  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [showAttach, setShowAttach] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [chatInfo, setChatInfo] = useState<any>(null)

  // Special message modals
  const [modal, setModal] = useState<'poll'|'event'|'reminder'|'notice'|'alert'|null>(null)
  const [pollQ, setPollQ] = useState(''); const [pollOpts, setPollOpts] = useState(['',''])
  const [eventData, setEventData] = useState({ title:'', type:'Event', date:'', time:'', location:'' })
  const [specialText, setSpecialText] = useState('')

  const endRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<any>(null)

  const scrollBottom = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [])

  // Socket setup
  useEffect(() => {
    if (!user || !chatId) return
    const socket = socketService.connect(user)
    socketService.joinChat(chatId as string)
    socket?.on('message received', (m: any) => {
      if (m.chatId === chatId || m.chat === chatId) {
        setMessages(prev => [...prev, m]); scrollBottom()
      }
    })
    socket?.on('typing', (room: string) => { if (room === chatId) setOtherTyping(true) })
    socket?.on('stop typing', (room: string) => { if (room === chatId) setOtherTyping(false) })
    return () => { socket?.off('message received'); socket?.off('typing'); socket?.off('stop typing') }
  }, [user, chatId, scrollBottom])

  // Fetch messages + chat info
  useEffect(() => {
    if (!chatId) return
    const load = async () => {
      try {
        const [msgRes, chatRes] = await Promise.all([
          api.get(`/chats/messages/${chatId}`).catch(() => ({ data: [] })),
          api.get(`/chats?userId=${user?.id}`).catch(() => ({ data: [] }))
        ])
        const msgs = Array.isArray(msgRes.data) ? msgRes.data : msgRes.data?.data || []
        setMessages(msgs)
        const chats = Array.isArray(chatRes.data) ? chatRes.data : chatRes.data?.data || []
        const thisChat = chats.find((c: any) => c._id === chatId)
        setChatInfo(thisChat)
        if (thisChat) {
          const other = thisChat.users?.find((u: any) => u.userId !== user?.id)
          if (other?.userId) {
            const profileRes = await api.get(`/users/profile/${other.userId}`).catch(() => null)
            setOtherUser(profileRes?.data?.data || { userId: other.userId, name: other.userId })
          }
        } else {
          // chatId might be a userId (direct link from search)
          const profileRes = await api.get(`/users/profile/${chatId}`).catch(() => null)
          if (profileRes?.data?.data) {
            setOtherUser(profileRes.data.data)
            // Create/access chat
            const chatCreate = await api.post('/chats', { userId: user?.id, targetUserId: chatId }).catch(() => null)
            if (chatCreate?.data?._id) {
              router.replace(`/chat/${chatCreate.data._id}`)
            }
          }
        }
      } catch (e) { console.error(e) }
    }
    load()
  }, [chatId, user?.id])

  useEffect(() => { scrollBottom() }, [messages, scrollBottom])

  const sendMsg = async (type = 'text', content?: string) => {
    const msgContent = content ?? text
    if (!msgContent.trim()) return
    setSending(true)
    const tempId = `temp_${Date.now()}`
    const tempMsg: Msg = { _id: tempId, content: msgContent, sender: user?.id || '', chatId: chatId as string, type, replyTo, createdAt: new Date().toISOString(), status: 'pending', reactions: [] }
    setMessages(prev => [...prev, tempMsg])
    setText(''); setReplyTo(null); setShowAttach(false)
    try {
      const res = await api.post('/chats/messages', { content: msgContent, chatId, senderId: user?.id, type, replyToId: replyTo?._id })
      const saved = res.data?.data || res.data
      socketService.sendMessage(saved)
      setMessages(prev => prev.map(m => m._id === tempId ? { ...saved, status: 'sent' } : m))
    } catch { setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m)) }
    finally { setSending(false) }
  }

  const handleTyping = (val: string) => {
    setText(val)
    socketService.emitTyping(chatId as string)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socketService.emitStopTyping(chatId as string), 2000)
  }

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      await api.put('/chats/messages/react', { messageId: msgId, userId: user?.id, emoji })
      setMessages(prev => prev.map(m => {
        if (m._id !== msgId) return m
        const reactions = (m.reactions || []).filter(r => r.user !== user?.id)
        return { ...m, reactions: [...reactions, { emoji, user: user?.id || '' }] }
      }))
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m._id !== msgId))
  }

  const sendSpecial = () => {
    if (modal === 'poll') {
      const opts = pollOpts.filter(o => o.trim())
      if (!pollQ.trim() || opts.length < 2) return
      sendMsg('poll', JSON.stringify({ question: pollQ, options: opts }))
      setPollQ(''); setPollOpts(['',''])
    } else if (modal === 'event') {
      if (!eventData.title.trim()) return
      sendMsg('event', JSON.stringify(eventData))
      setEventData({ title:'', type:'Event', date:'', time:'', location:'' })
    } else if (modal) {
      if (!specialText.trim()) return
      sendMsg(modal, specialText)
      setSpecialText('')
    }
    setModal(null)
  }

  const displayName = chatInfo?.chatName || otherUser?.name || otherUser?.userId || (chatId as string).slice(0, 8)

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><ArrowLeft size={20} className="dark:text-white"/></button>
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black uppercase">
              {displayName[0]}
            </div>
            <div className="text-left">
              <p className="font-black text-sm dark:text-white">{displayName}</p>
              <p className="text-[10px] text-gray-400 font-bold">
                {otherTyping ? '✍️ typing...' : 'tap to view profile'}
              </p>
            </div>
          </button>
        </div>
        <div className="flex gap-1">
          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><Phone size={19}/></button>
          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><Video size={19}/></button>
          <button onClick={() => setShowProfile(true)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><Info size={19}/></button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.map(msg => (
          <MsgBubble key={msg._id} msg={msg}
            isMe={msg.sender === user?.id}
            userName={otherUser?.name}
            onReact={handleReact} onReply={setReplyTo} onDelete={handleDelete} />
        ))}
        {otherTyping && (
          <div className="flex gap-2 px-4">
            <Av name={otherUser?.name} avatar={otherUser?.avatar} />
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }}/>)}</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Reply bar ── */}
      {replyTo && (
        <div className="mx-4 mb-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl px-4 py-2 flex justify-between items-center">
          <p className="text-xs dark:text-gray-300 truncate"><span className="font-bold text-blue-600">Reply: </span>{replyTo.content}</p>
          <button onClick={() => setReplyTo(null)} className="text-blue-500 ml-2"><X size={14}/></button>
        </div>
      )}

      {/* ── Input ── */}
      <div className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 p-3 relative z-10">
        <div className="flex items-end gap-2">
          <button onClick={() => setShowAttach(!showAttach)}
            className={clsx('p-3 rounded-2xl transition-all shrink-0', showAttach ? 'bg-blue-600 text-white rotate-45' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
            <Plus size={22}/>
          </button>
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2.5 border-2 border-transparent focus-within:border-blue-500 transition-all">
            <textarea value={text} onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
              placeholder="Message..." rows={1}
              className="w-full bg-transparent outline-none dark:text-white resize-none max-h-28 text-sm" />
          </div>
          <button onClick={() => sendMsg()} disabled={!text.trim() || sending}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0 shadow-lg">
            {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
          </button>
        </div>

        {/* Attach menu */}
        {showAttach && (
          <div className="absolute bottom-full mb-3 left-3 right-3 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border dark:border-gray-800 p-5 grid grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
            {[
              { icon: BarChart2, label: 'Poll', color: 'bg-purple-500', action: () => { setModal('poll'); setShowAttach(false) } },
              { icon: Calendar, label: 'Event', color: 'bg-blue-500', action: () => { setModal('event'); setShowAttach(false) } },
              { icon: Clock, label: 'Reminder', color: 'bg-indigo-500', action: () => { setModal('reminder'); setShowAttach(false) } },
              { icon: Bell, label: 'Notice', color: 'bg-amber-500', action: () => { setModal('notice'); setShowAttach(false) } },
              { icon: AlertTriangle, label: 'Alert', color: 'bg-red-500', action: () => { setModal('alert'); setShowAttach(false) } },
              { icon: ImageIcon, label: 'Media', color: 'bg-green-500', action: () => setShowAttach(false) },
            ].map(item => (
              <button key={item.label} onClick={item.action} className="flex flex-col items-center gap-2 group">
                <div className={clsx('p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform', item.color)}>
                  <item.icon size={22}/>
                </div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Profile Drawer ── */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowProfile(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-sm shadow-2xl border dark:border-gray-800 overflow-hidden animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="h-24 bg-gradient-to-br from-blue-500 to-indigo-600" />
            <div className="px-6 pb-6 -mt-10">
              <div className="w-20 h-20 rounded-3xl bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center text-3xl font-black text-blue-600 uppercase mb-4">
                {otherUser?.avatar ? <img src={otherUser.avatar} className="w-full h-full object-cover rounded-3xl" alt="" /> : displayName[0]}
              </div>
              <h2 className="font-black text-xl dark:text-white">{otherUser?.name || displayName}</h2>
              <p className="text-sm text-gray-400 mb-1">@{otherUser?.userId || chatId}</p>
              {otherUser?.bio && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{otherUser.bio}</p>}
              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowProfile(false)} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-2xl text-sm active:scale-95 transition-all">Message</button>
                <Link href={`/u/${otherUser?.userId || chatId}`} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black py-3 rounded-2xl text-sm text-center active:scale-95 transition-all">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Special Message Modals ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md shadow-2xl border dark:border-gray-800 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-black text-lg dark:text-white capitalize">Create {modal}</h3>
              <button onClick={() => setModal(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              {modal === 'poll' && (
                <>
                  <input value={pollQ} onChange={e => setPollQ(e.target.value)} placeholder="Your question..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-xl p-3.5 font-bold dark:text-white outline-none" />
                  {pollOpts.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={o} onChange={e => { const n=[...pollOpts]; n[i]=e.target.value; setPollOpts(n) }}
                        placeholder={`Option ${i+1}`}
                        className="flex-1 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none" />
                      {pollOpts.length > 2 && <button onClick={() => setPollOpts(pollOpts.filter((_,j)=>j!==i))} className="p-2 text-red-400"><X size={16}/></button>}
                    </div>
                  ))}
                  {pollOpts.length < 6 && <button onClick={() => setPollOpts([...pollOpts,''])} className="text-purple-500 text-xs font-black uppercase tracking-widest">+ Add Option</button>}
                </>
              )}
              {modal === 'event' && (
                <>
                  <input value={eventData.title} onChange={e => setEventData({...eventData, title: e.target.value})} placeholder="Event title"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 font-bold dark:text-white outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={eventData.date} onChange={e => setEventData({...eventData, date: e.target.value})} placeholder="Date (e.g. 25 Dec)"
                      className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none" />
                    <input value={eventData.time} onChange={e => setEventData({...eventData, time: e.target.value})} placeholder="Time (e.g. 6 PM)"
                      className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none" />
                  </div>
                  <input value={eventData.location} onChange={e => setEventData({...eventData, location: e.target.value})} placeholder="Location (optional)"
                    className="w-full bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none" />
                </>
              )}
              {['reminder','notice','alert'].includes(modal) && (
                <textarea value={specialText} onChange={e => setSpecialText(e.target.value)} placeholder={`${modal} message...`} rows={3}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 dark:text-white outline-none resize-none" />
              )}
            </div>
            <div className="p-5 border-t dark:border-gray-800">
              <button onClick={sendSpecial}
                className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl uppercase tracking-widest active:scale-95 transition-all">
                Send {modal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
