'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import Link from 'next/link'
import { Search, Plus, MessageCircle, X, Users, Hash, ChevronRight, Loader2 } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Av = ({ name, avatar, size = 14 }: { name?: string; avatar?: string; size?: number }) => {
  const sz = `w-${size} h-${size}`
  if (avatar) return <img src={avatar} className={clsx(sz, 'rounded-2xl object-cover shrink-0')} alt="" />
  return (
    <div className={clsx(sz, 'rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shrink-0 uppercase text-sm')}>
      {name?.[0] || 'U'}
    </div>
  )
}

type ModalType = 'chat' | 'group' | 'channel' | null

export default function ChatListPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [modal, setModal] = useState<ModalType>(null)
  const [modalName, setModalName] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (searchParams.get('search') === 'true') setSearchQuery(' ')
  }, [searchParams])

  // Fetch existing chats, groups, and channels
  const { data: allConversations = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const [regularChats, superGroups, superChannels] = await Promise.all([
        api.get(`/chats?userId=${user?.id}`).then(r => r.data).catch(() => []),
        api.get(`/super-comm/group/user/${user?.id}`).then(r => r.data).catch(() => []),
        api.get(`/super-comm/channel/user/${user?.id}`).then(r => r.data).catch(() => [])
      ]);

      const merged = [
        ...regularChats.map((c: any) => ({ ...c, type: 'chat', id: `chat-${c._id || Math.random()}` })),
        ...(Array.isArray(superGroups) ? superGroups : []).map((g: any) => ({ ...g.chat, type: 'group', groupId: g.group?._id, id: `group-${g.group?._id || Math.random()}` })),
        ...(Array.isArray(superChannels) ? superChannels : []).map((c: any) => ({ ...c, type: 'channel', chatId: c._id, id: `channel-${c._id || Math.random()}` }))
      ];

      return merged.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    },
    enabled: !!user?.id
  })

  // Search users – combines user-service list with super-comm profile search by username
  const { data: searchUsers = [], isFetching: searching } = useQuery({
    queryKey: ['user-search', searchQuery.trim()],
    queryFn: async () => {
      const q = searchQuery.trim()

      // Always fetch the base user list
      const { data } = await api.get('/users/profile/list').catch(() => ({ data: [] }))
      const list: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []

      if (!q) return list

      // Also search profiles by username/uniqueId from super-comm
      const profileResults: any[] = await api
        .get(`/super-comm/profile/search?q=${encodeURIComponent(q)}`)
        .then((r) => (Array.isArray(r.data) ? r.data : []))
        .catch(() => [])

      // Normalize profile results to match user list shape
      const profileMapped = profileResults.map((p: any) => ({
        userId: p.userId,
        _id: p.userId,
        name: p.username,
        avatar: p.avatar,
        username: p.username,
        uniqueId: p.uniqueId,
      }))

      // Combine and deduplicate by userId
      const combined = [...list, ...profileMapped]
      const seen = new Set<string>()
      const deduped = combined.filter((u) => {
        const id = u.userId || u._id
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

      return deduped.filter((u: any) =>
        u.name?.toLowerCase().includes(q.toLowerCase()) ||
        u.username?.toLowerCase().includes(q.toLowerCase()) ||
        u.uniqueId?.toLowerCase().includes(q.toLowerCase()) ||
        u.userId?.toLowerCase().includes(q.toLowerCase())
      )
    },
    enabled: true
  })

  const toggleUser = (u: any) => {
    const id = u.userId || u._id;
    setSelectedUsers(prev =>
      prev.find(x => (x.userId || x._id) === id) ? prev.filter(x => (x.userId || x._id) !== id) : [...prev, u]
    )
  }

  const handleCreate = async () => {
    if (!user?.id) return
    setCreating(true)
    try {
      if (modal === 'channel') {
        const res = await api.post('/super-comm/channel/create', {
          name: modalName, description: modalDesc, ownerId: user.id
        })
        const channelId = res.data?._id || res.data?.id;
        if (channelId && selectedUsers.length > 0) {
          await api.post(`/super-comm/channel/${channelId}/members`, {
            userIds: selectedUsers.map(u => u.userId || u._id)
          }).catch(() => {});
        }
      } else if (modal === 'group') {
        await api.post('/super-comm/group/create', {
          name: modalName, description: modalDesc,
          participants: selectedUsers.map(u => u.userId || u._id),
          adminId: user.id
        })
      } else if (modal === 'chat' && selectedUsers.length > 0) {
        const targetId = selectedUsers[0].userId || selectedUsers[0]._id;
        await api.post('/chats', {
          userId: user.id,
          targetUserId: targetId
        })
        router.push(`/chat/${targetId}`)
        setModal(null); return
      }
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] })
      setModal(null); setModalName(''); setModalDesc(''); setSelectedUsers([])
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-48 left-[-90px] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* ── Create Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-gray-200/20 dark:border-gray-800/40 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-200/20 dark:border-gray-800/40 flex justify-between items-center bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card)]/50">
              <div>
                <h3 className="font-black text-lg text-[var(--text-primary)] capitalize">Create {modal}</h3>
                <p className="text-[10px] text-[var(--syn-comment)] font-bold uppercase tracking-widest">
                  {modal === 'channel' ? '📢 Broadcast to subscribers' : modal === 'group' ? '👥 Group conversation' : '💬 Direct message'}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="p-2 bg-[var(--bg-elevated)] hover:bg-red-500/20 text-[var(--syn-comment)] hover:text-red-400 rounded-xl transition-all"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {modal !== 'chat' && (
                <>
                  <input value={modalName} onChange={e => setModalName(e.target.value)}
                    placeholder={`${modal === 'channel' ? 'Channel' : 'Group'} name`}
                    className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-blue-500 rounded-xl p-3.5 font-bold text-[var(--text-primary)] outline-none transition-all focus:ring-2 focus:ring-blue-500/30 hover:border-gray-200/40 dark:hover:border-gray-700/50" />
                  <input value={modalDesc} onChange={e => setModalDesc(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all hover:border-gray-200/40 dark:hover:border-gray-700/50" />
                </>
              )}
              <div>
                <p className="text-[10px] font-black text-[var(--syn-comment)] uppercase tracking-widest mb-2">
                  {modal === 'chat' ? 'Select person' : 'Add members'}
                </p>
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedUsers.map(u => (
                      <span key={u.userId || u._id} className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-500/40 backdrop-blur-sm">
                        {u.name}
                        <button onClick={() => toggleUser(u)} className="hover:text-blue-200"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {searchUsers.map((u: any) => (
                    <label key={u.userId || u._id} className="flex items-center gap-3 p-2.5 hover:bg-[var(--bg-elevated)] rounded-xl cursor-pointer transition-all group">
                      <input type={modal === 'chat' ? 'radio' : 'checkbox'} name="user"
                        checked={!!selectedUsers.find(x => (x.userId || x._id) === (u.userId || u._id))}
                        onChange={() => modal === 'chat' ? setSelectedUsers([u]) : toggleUser(u)}
                        className="accent-blue-600 w-4 h-4" />
                      <Av name={u.name} avatar={u.avatar} size={9} />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-300 transition-colors">{u.name}</p>
                        <p className="text-[10px] text-[var(--syn-comment)]">@{u.userId || u._id}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200/20 dark:border-gray-800/40 bg-gradient-to-r from-[var(--bg-card)]/50 to-[var(--bg-card)]">
              <button onClick={handleCreate}
                disabled={creating || (modal !== 'chat' && !modalName.trim()) || (modal === 'chat' && selectedUsers.length === 0)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/30">
                {creating && <Loader2 size={16} className="animate-spin" />}
                {modal === 'chat' ? '💬 Open Chat' : `✨ Create ${modal}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="p-5 border-b border-gray-200/20 dark:border-gray-800/40 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card)]/50 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-blue-500/10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text tracking-tight">💬 Messages</h1>
          <div className="flex gap-2">
            <button onClick={() => setModal('channel')} className="p-2.5 bg-purple-500/15 text-purple-300 rounded-xl text-[10px] font-black flex items-center gap-1.5 px-3 border border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/50 transition-all active:scale-95">
              <Hash size={14}/> Channel
            </button>
            <button onClick={() => setModal('group')} className="p-2.5 bg-emerald-500/15 text-emerald-300 rounded-xl text-[10px] font-black flex items-center gap-1.5 px-3 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all active:scale-95">
              <Users size={14}/> Group
            </button>
            <button onClick={() => setModal('chat')} className="p-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg shadow-blue-500/40 transition-all active:scale-95">
              <Plus size={18}/>
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--syn-comment)]" size={17} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search people, groups..."
            className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-2xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] text-sm transition-all hover:border-gray-200/40 dark:hover:border-gray-700/50" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="p-3 space-y-1">
            <p className="px-3 py-2 text-[10px] font-black text-[var(--syn-comment)] uppercase tracking-widest">👤 People</p>
            {searching && (
              <div className="p-8 text-center space-y-3 text-[var(--syn-comment)]">
                <Loader2 size={24} className="animate-spin mx-auto text-blue-400" />
                <p className="text-sm font-semibold">Searching...</p>
              </div>
            )}
            {searchUsers.length > 0 && searchUsers.map((u: any) => (
              <Link href={`/chat/${u.userId || u._id}`} key={u.userId || u._id}
                className="flex items-center gap-3 p-3 hover:bg-[var(--bg-elevated)] rounded-2xl transition-all group hover:shadow-md hover:shadow-blue-500/10">
                <Av name={u.name} avatar={u.avatar} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--text-primary)] group-hover:text-blue-300 transition-colors">{u.name}</p>
                  <p className="text-[10px] text-[var(--syn-comment)]">@{u.userId || u._id}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30 transform group-hover:scale-110">
                  <MessageCircle size={16}/>
                </div>
              </Link>
            ))}
            {!searching && searchUsers.length === 0 && (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-elevated)]/50 rounded-3xl flex items-center justify-center mx-auto text-[var(--syn-comment)] shadow-lg">
                  <Search size={32}/>
                </div>
                <p className="text-[var(--syn-comment)] text-sm font-bold">No users found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 space-y-1">
            <p className="px-3 py-2 text-[10px] font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text uppercase tracking-widest">⏱️ Recent</p>
            {chatsLoading ? (
              <div className="space-y-2 p-1">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-elevated)]/50 rounded-2xl animate-pulse shadow-md" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-elevated)]/50 rounded-full animate-pulse" />
                      <div className="h-2 w-32 bg-gradient-to-r from-[var(--bg-elevated)]/50 to-[var(--bg-elevated)]/20 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : allConversations.length > 0 ? allConversations.map((chat: any) => {
              const isGroup = chat.type === 'group'
              const isChannel = chat.type === 'channel'
              const otherUser = chat.users?.find((u: any) => u.userId !== user?.id)
              const name = chat.chatName || chat.name || otherUser?.userId || 'Chat'
              
              let href = `/chat/${chat._id}`
              if (isGroup) href = `/chat/group/${chat.groupId}`
              if (isChannel) href = `/channels/${chat.chatId}`
              
              return (
                <Link href={href} key={chat._id}
                  className="flex items-center gap-3 p-3 hover:bg-[var(--bg-elevated)] rounded-2xl transition-all group hover:shadow-md hover:shadow-blue-500/10">
                  <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-md transition-all',
                    isGroup ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:border-emerald-500/50 group-hover:shadow-lg group-hover:shadow-emerald-500/20' : 
                    isChannel ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:border-purple-500/50 group-hover:shadow-lg group-hover:shadow-purple-500/20' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/20')}>
                    {isGroup ? <Users size={22}/> : isChannel ? <Hash size={22}/> : name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-sm text-[var(--text-primary)] truncate group-hover:text-blue-300 transition-colors">{name}</p>
                      <span className="text-[10px] text-[var(--syn-comment)] shrink-0 ml-2">
                        {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--syn-comment)] truncate group-hover:text-gray-400 transition-colors">{chat.latestMessage?.content || 'No messages yet'}</p>
                  </div>
                  <ChevronRight size={16} className="text-[var(--syn-comment)] shrink-0 group-hover:text-blue-400 transition-colors" />
                </Link>
              )
            }) : (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-elevated)]/50 rounded-3xl flex items-center justify-center mx-auto text-[var(--syn-comment)] shadow-lg">
                  <MessageCircle size={32}/>
                </div>
                <p className="text-[var(--syn-comment)] text-sm font-bold">No conversations yet</p>
                <button onClick={() => setModal('chat')} className="text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300 transition-colors">💬 Start chatting</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

