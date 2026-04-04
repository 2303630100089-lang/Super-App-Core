'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { useRouter } from 'next/navigation'
import {
  Users, Plus, Search, X, Settings, Lock, Globe,
  ChevronRight, Hash, Loader2, Check, ArrowLeft
} from 'lucide-react'
import clsx from 'clsx'

const EMOJI_CATEGORIES = ['💬', '🎮', '🎨', '📚', '🏃', '🍕', '💼', '🎵', '🌍', '❤️']

const Av = ({ name, avatar, size = 12 }: { name?: string; avatar?: string; size?: number }) => {
  const sz = `w-${size} h-${size}`
  if (avatar) return <img src={avatar} className={clsx(sz, 'rounded-2xl object-cover shrink-0')} alt="" />
  return (
    <div className={clsx(sz, 'rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shrink-0 uppercase text-sm')}>
      {name?.[0] || 'G'}
    </div>
  )
}

type Tab = 'my' | 'discover'

export default function GroupsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()

  const [tab, setTab] = useState<Tab>('my')
  const [showCreate, setShowCreate] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [discoverQ, setDiscoverQ] = useState('')

  // Create form state
  const [groupName, setGroupName] = useState('')
  const [groupDesc, setGroupDesc] = useState('')
  const [groupPrivacy, setGroupPrivacy] = useState<'public' | 'private'>('private')
  const [selectedEmoji, setSelectedEmoji] = useState('💬')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<any[]>([])
  const [creating, setCreating] = useState(false)

  // My groups
  const { data: myGroups = [], isLoading: loadingMyGroups } = useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      const res = await api.get(`/group/user/${user?.id}`)
      return Array.isArray(res.data?.data) ? res.data.data : []
    },
    enabled: !!user?.id
  })

  // Discover public groups
  const { data: publicGroups = [], isLoading: loadingPublic } = useQuery({
    queryKey: ['public-groups', discoverQ],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '30' })
      if (discoverQ) params.set('q', discoverQ)
      const res = await api.get(`/group/public?${params}`)
      return Array.isArray(res.data?.data) ? res.data.data : []
    },
    enabled: tab === 'discover'
  })

  // User search for member selection
  const { data: userList = [] } = useQuery({
    queryKey: ['user-list'],
    queryFn: async () => {
      const res = await api.get('/users/profile/list').catch(() => ({ data: [] }))
      return Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
    },
    enabled: showCreate
  })

  const filteredUsers = memberSearch
    ? userList.filter((u: any) =>
        (u.name || u.username || '')?.toLowerCase().includes(memberSearch.toLowerCase()) &&
        (u.userId || u._id) !== user?.id
      )
    : userList.filter((u: any) => (u.userId || u._id) !== user?.id).slice(0, 12)

  const toggleMember = (u: any) => {
    const id = u.userId || u._id
    setSelectedMembers(prev =>
      prev.find(x => (x.userId || x._id) === id) ? prev.filter(x => (x.userId || x._id) !== id) : [...prev, u]
    )
  }

  const handleCreate = async () => {
    if (!groupName.trim() || !user?.id) return
    setCreating(true)
    try {
      const res = await api.post('/super-comm/group/create', {
        name: groupName,
        description: groupDesc,
        participants: selectedMembers.map(u => u.userId || u._id),
        adminId: user.id,
        avatar: selectedEmoji,
        privacy: groupPrivacy
      })
      const groupId = res.data?.group?._id
      qc.invalidateQueries({ queryKey: ['my-groups', user?.id] })
      setShowCreate(false)
      setGroupName(''); setGroupDesc(''); setSelectedMembers([])
      if (groupId) router.push(`/chat/group/${groupId}`)
    } catch (e) { console.error(e) }
    finally { setCreating(false) }
  }

  const joinGroup = async (groupId: string) => {
    try {
      await api.post(`/group/${groupId}/members`, { userId: user?.id, userName: user?.name })
      qc.invalidateQueries({ queryKey: ['my-groups', user?.id] })
      qc.invalidateQueries({ queryKey: ['public-groups'] })
      router.push(`/chat/group/${groupId}`)
    } catch (e) { console.error(e) }
  }

  const filtered = searchQ
    ? myGroups.filter((g: any) => g.name?.toLowerCase().includes(searchQ.toLowerCase()))
    : myGroups

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
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
              <h1 className="font-black text-xl text-[var(--text-primary)]">Groups</h1>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Communities & Chat Groups</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-4 py-2.5 rounded-2xl text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus size={16} /> New Group
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pb-0">
          {(['my', 'discover'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 py-2.5 text-sm font-black capitalize rounded-t-xl transition-all border-b-2',
                tab === t
                  ? 'text-blue-500 border-blue-500 bg-blue-500/5'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              )}
            >
              {t === 'my' ? 'My Groups' : '🌐 Discover'}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={tab === 'my' ? searchQ : discoverQ}
            onChange={e => tab === 'my' ? setSearchQ(e.target.value) : setDiscoverQ(e.target.value)}
            placeholder={tab === 'my' ? 'Search my groups...' : 'Discover groups...'}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {tab === 'my' && (
          <>
            {loadingMyGroups && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            )}
            {!loadingMyGroups && filtered.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">👥</div>
                <p className="font-black text-[var(--text-primary)] mb-1">No groups yet</p>
                <p className="text-sm text-[var(--text-secondary)]">Create a group or join one from Discover</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 bg-blue-600 text-white font-black px-6 py-2.5 rounded-2xl text-sm"
                >
                  Create Group
                </button>
              </div>
            )}
            {filtered.map((group: any) => (
              <button
                key={group._id}
                onClick={() => router.push(`/chat/group/${group._id}`)}
                className="w-full flex items-center gap-3 p-3.5 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] rounded-2xl transition-all border border-[var(--border)] text-left"
              >
                <Av name={group.name} avatar={group.avatar} size={12} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-[var(--text-primary)] truncate">{group.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {group.description || `${group.members?.length || 0} members`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {group.settings?.isPublic
                    ? <Globe size={12} className="text-green-400" />
                    : <Lock size={12} className="text-[var(--text-secondary)]" />
                  }
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                </div>
              </button>
            ))}
          </>
        )}

        {tab === 'discover' && (
          <>
            {loadingPublic && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            )}
            {!loadingPublic && publicGroups.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🔍</div>
                <p className="font-black text-[var(--text-primary)] mb-1">No public groups found</p>
                <p className="text-sm text-[var(--text-secondary)]">Try a different search term</p>
              </div>
            )}
            {publicGroups.map((group: any) => {
              const isMember = group.members?.some((m: any) => (m.userId || m) === user?.id)
              return (
                <div
                  key={group._id}
                  className="flex items-center gap-3 p-3.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]"
                >
                  <Av name={group.name} avatar={group.avatar} size={12} />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-[var(--text-primary)] truncate">{group.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {group.memberCount || 0} members
                      {group.settings?.category ? ` · ${group.settings.category}` : ''}
                    </p>
                    {group.description && (
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{group.description}</p>
                    )}
                  </div>
                  {isMember ? (
                    <button
                      onClick={() => router.push(`/chat/group/${group._id}`)}
                      className="bg-green-600/20 text-green-400 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Check size={12} /> Open
                    </button>
                  ) : (
                    <button
                      onClick={() => joinGroup(group._id)}
                      className="bg-blue-600 text-white font-black px-3 py-1.5 rounded-xl text-xs active:scale-95 transition-all"
                    >
                      Join
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)] z-10">
              <div>
                <h3 className="font-black text-lg text-[var(--text-primary)]">New Group</h3>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Create a community</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 bg-[var(--bg-elevated)] hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Emoji avatar picker */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Group Icon</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_CATEGORIES.map(e => (
                    <button
                      key={e}
                      onClick={() => setSelectedEmoji(e)}
                      className={clsx(
                        'w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all',
                        selectedEmoji === e
                          ? 'bg-blue-500/20 ring-2 ring-blue-500'
                          : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Group Name *</p>
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full bg-[var(--bg-elevated)] border-2 border-transparent focus:border-blue-500 rounded-xl p-3 font-bold text-[var(--text-primary)] outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Description</p>
                <textarea
                  value={groupDesc}
                  onChange={e => setGroupDesc(e.target.value)}
                  placeholder="What's this group about?"
                  rows={2}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] outline-none resize-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Privacy */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Privacy</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['private', 'public'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setGroupPrivacy(p)}
                      className={clsx(
                        'p-3 rounded-xl border-2 transition-all flex items-center gap-2',
                        groupPrivacy === p
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-[var(--border)] text-[var(--text-secondary)]'
                      )}
                    >
                      {p === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                      <span className="font-black text-sm capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add members */}
              <div>
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Add Members</p>
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedMembers.map(u => (
                      <span key={u.userId || u._id} className="flex items-center gap-1.5 bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-500/30">
                        {u.name || u.username}
                        <button onClick={() => toggleMember(u)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    placeholder="Search people..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl pl-8 pr-3 py-2 text-sm text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {filteredUsers.map((u: any) => {
                    const id = u.userId || u._id
                    const selected = selectedMembers.some(x => (x.userId || x._id) === id)
                    return (
                      <button
                        key={id}
                        onClick={() => toggleMember(u)}
                        className={clsx(
                          'w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left',
                          selected ? 'bg-blue-500/10' : 'hover:bg-[var(--bg-elevated)]'
                        )}
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shrink-0 uppercase">
                          {(u.name || u.username || '?')[0]}
                        </div>
                        <span className="text-sm font-bold text-[var(--text-primary)] flex-1 truncate">{u.name || u.username}</span>
                        {selected && <Check size={14} className="text-blue-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={!groupName.trim() || creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/25"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                {creating ? 'Creating...' : `Create Group${selectedMembers.length > 0 ? ` · ${selectedMembers.length + 1} members` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
