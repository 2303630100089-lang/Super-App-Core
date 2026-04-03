'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import api from '@/services/api'
import useAuthStore from '@/store/useAuthStore'
import ReactMarkdown from 'react-markdown'
import {
  MapPin, Link as LinkIcon, UserPlus, LayoutDashboard, Share2,
  Settings, UserMinus, Eye, Users, Heart, Code2, Calendar,
  Globe, CheckCircle2, UserCheck
} from 'lucide-react'
import DevStats from '@/components/profile/DevStats'
import ProjectShowcase from '@/components/profile/ProjectShowcase'
import Link from 'next/link'
import { useMemo, useState } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 'lg' }: { src?: string; name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-28 h-28 md:w-36 md:h-36 text-4xl' : size === 'md' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-base'
  const initials = name ? name[0].toUpperCase() : '?'
  return (
    <div className={`${dim} rounded-full flex-shrink-0 bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 flex items-center justify-center font-black text-white shadow-xl ring-4 ring-white dark:ring-gray-900 overflow-hidden`}>
      {src ? <img src={src} className="w-full h-full object-cover" alt={name} /> : initials}
    </div>
  )
}

function StatPill({ count, label, onClick }: { count: number; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center px-4 py-2 rounded-2xl hover:bg-white/10 dark:hover:bg-white/5 transition-all group">
      <span className="text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">{count.toLocaleString()}</span>
      <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
    </button>
  )
}

function UserCard({ item, isFollowing, onFollow, showFollow }: {
  item: any; isFollowing?: boolean; onFollow?: () => void; showFollow?: boolean
}) {
  return (
    <Link href={`/u/${item.username || item.userId}`}
      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all group">
      <Avatar src={item.avatar} name={item.username || item.userId} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
          {item.username || item.userId}
        </p>
        <p className="text-xs text-gray-400 truncate">@{item.uniqueId || item.userId}</p>
        {item.bio && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{item.bio}</p>}
      </div>
      {showFollow && onFollow && (
        <button
          onClick={(e) => { e.preventDefault(); onFollow(); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isFollowing
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500'
            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </Link>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { username } = useParams()
  const { user, appMode } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'about' | 'friends' | 'followers' | 'following' | 'suggested' | 'settings'>('about')
  const [copied, setCopied] = useState(false)

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await api.get(`/super-comm/profile/${username}`)
      return data
    }
  })

  const followMutation = useMutation({
    mutationFn: () => api.post('/super-comm/profile/follow', {
      followerId: user?.id,
      followingId: profile?.userId
    }),
    onSuccess: () => {
      refetch()
      refetchViewerFollowing()
    }
  })

  const followSuggestionMutation = useMutation({
    mutationFn: (followingId: string) => api.post('/super-comm/profile/follow', {
      followerId: user?.id,
      followingId
    }),
    onSuccess: () => {
      refetch()
      refetchViewerFollowing()
    }
  })

  const { data: followers = [] } = useQuery({
    queryKey: ['profile-followers', profile?.userId],
    queryFn: async () => {
      if (!profile?.userId) return []
      const { data } = await api.get(`/super-comm/profile/${profile.userId}/followers`).catch(() => ({ data: [] }))
      return Array.isArray(data) ? data : []
    },
    enabled: !!profile?.userId
  })

  const { data: following = [] } = useQuery({
    queryKey: ['profile-following', profile?.userId],
    queryFn: async () => {
      if (!profile?.userId) return []
      const { data } = await api.get(`/super-comm/profile/${profile.userId}/following`).catch(() => ({ data: [] }))
      return Array.isArray(data) ? data : []
    },
    enabled: !!profile?.userId
  })

  const { data: viewerFollowing = [], refetch: refetchViewerFollowing } = useQuery({
    queryKey: ['viewer-following', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await api.get(`/super-comm/profile/${user.id}/following`).catch(() => ({ data: [] }))
      return Array.isArray(data) ? data : []
    },
    enabled: !!user?.id
  })

  const { data: friends = [] } = useQuery({
    queryKey: ['profile-friends', profile?.userId],
    queryFn: async () => {
      if (!profile?.userId) return []
      const { data } = await api.get(`/super-comm/profile/${profile.userId}/friends`).catch(() => ({ data: [] }))
      return Array.isArray(data) ? data : []
    },
    enabled: !!profile?.userId
  })

  const { data: suggestions = [] } = useQuery({
    queryKey: ['profile-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await api.get(`/super-comm/profile/${user.id}/suggestions?limit=8`).catch(() => ({ data: [] }))
      return Array.isArray(data) ? data : []
    },
    enabled: !!user?.id
  })

  const isFollowingProfile = useMemo(
    () => viewerFollowing.some((item: any) => item.userId === profile?.userId),
    [viewerFollowing, profile?.userId]
  )

  const isFriend = useMemo(
    () => friends.some((f: any) => f.userId === user?.id) ||
      (isFollowingProfile && followers.some((f: any) => f.userId === user?.id)),
    [friends, isFollowingProfile, followers, user?.id]
  )

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 pb-20 animate-pulse">
        <div className="h-48 rounded-3xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
        <div className="flex gap-4">
          <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 -mt-14 ml-6 ring-4 ring-white dark:ring-gray-900" />
          <div className="flex-1 space-y-3 pt-4">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  // ── Profile Not Found ────────────────────────────────────────────────────────

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-6 mt-20">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-4xl">
          👤
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            The user <span className="font-bold text-blue-500">@{username as string}</span> hasn't set up their profile yet, or this account does not exist.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/explore" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
            Explore People
          </Link>
          <Link href="/" className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.userId
  const followerCount = profile.followersCount ?? followers.length
  const followingCount = profile.followingCount ?? following.length

  const tabs = [
    { key: 'about', label: 'About', count: null },
    { key: 'friends', label: 'Friends', count: friends.length },
    { key: 'followers', label: 'Followers', count: followerCount },
    { key: 'following', label: 'Following', count: followingCount },
    { key: 'suggested', label: 'Suggested', count: null },
    ...(isOwnProfile ? [{ key: 'settings', label: 'Settings', count: null }] : [])
  ]

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* ── Cover Banner ──────────────────────────────────────────────────── */}
      <div className="relative h-44 md:h-56 rounded-b-3xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'10\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      </div>

      {/* ── Profile Header ────────────────────────────────────────────────── */}
      <div className="px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 md:-mt-16">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar src={profile.avatar} name={profile.username} size="lg" />
            {isFriend && !isOwnProfile && (
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                <UserCheck size={10} className="text-white" />
              </div>
            )}
          </div>

          {/* Name + Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 md:pb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">{profile.username}</h1>
                {profile.isPublic === false && (
                  <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Private</span>
                )}
                {isFriend && !isOwnProfile && (
                  <span className="text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Heart size={9} fill="currentColor" /> Friends
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 font-medium">@{profile.uniqueId}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {isOwnProfile && appMode === 'business' && (
                <Link href="/business-dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
              )}
              {isOwnProfile ? (
                <Link href="/settings"
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Edit Profile
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                    className={`px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all ${isFollowingProfile
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none'}`}
                  >
                    {isFollowingProfile ? <UserMinus size={16} /> : <UserPlus size={16} />}
                    {isFollowingProfile ? 'Unfollow' : 'Follow'}
                  </button>
                  <Link href={`/chat/${profile.userId}`}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    Message
                  </Link>
                </>
              )}
              <button onClick={handleShare}
                className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Share2 size={18} />
              </button>
              {copied && (
                <span className="text-xs text-green-500 font-bold self-center">Copied!</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Bio & Meta ────────────────────────────────────────────────────── */}
        <div className="mt-5 space-y-3">
          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">{profile.bio}</p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            {profile.location && (
              <span className="flex items-center gap-1.5"><MapPin size={15} className="text-red-400" /> {profile.location}</span>
            )}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-500 hover:underline">
                <Globe size={15} /> {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {profile.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-gray-400" />
                Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            )}
            {(profile.profileViews ?? 0) > 0 && (
              <span className="flex items-center gap-1.5"><Eye size={15} className="text-purple-400" /> {profile.profileViews?.toLocaleString()} views</span>
            )}
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1 mt-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-2 border border-gray-100 dark:border-gray-700/50">
          <StatPill count={followerCount} label="Followers" onClick={() => setActiveTab('followers')} />
          <div className="w-px bg-gray-200 dark:bg-gray-700 self-center h-6 mx-1" />
          <StatPill count={followingCount} label="Following" onClick={() => setActiveTab('following')} />
          <div className="w-px bg-gray-200 dark:bg-gray-700 self-center h-6 mx-1" />
          <StatPill count={friends.length} label="Friends" onClick={() => setActiveTab('friends')} />
          {(profile.connectionsCount ?? 0) > 0 && (
            <>
              <div className="w-px bg-gray-200 dark:bg-gray-700 self-center h-6 mx-1" />
              <StatPill count={profile.connectionsCount ?? 0} label="Connections" />
            </>
          )}
        </div>

        {/* ── Coding Handles ───────────────────────────────────────────────── */}
        {profile.codingHandles && Object.values(profile.codingHandles).some(Boolean) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.codingHandles.leetcode && (
              <a href={`https://leetcode.com/${profile.codingHandles.leetcode}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-800/40 hover:bg-orange-100 transition-colors">
                <Code2 size={12} /> LeetCode
              </a>
            )}
            {profile.codingHandles.codeforces && (
              <a href={`https://codeforces.com/profile/${profile.codingHandles.codeforces}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 transition-colors">
                <Code2 size={12} /> Codeforces
              </a>
            )}
            {profile.codingHandles.codechef && (
              <a href={`https://codechef.com/users/${profile.codingHandles.codechef}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 transition-colors">
                <Code2 size={12} /> CodeChef
              </a>
            )}
            {profile.codingHandles.gfg && (
              <a href={`https://auth.geeksforgeeks.org/user/${profile.codingHandles.gfg}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/40 hover:bg-green-100 transition-colors">
                <Code2 size={12} /> GFG
              </a>
            )}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="mt-6 flex gap-1 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-800 rounded-2xl p-1.5 border border-gray-100 dark:border-gray-700/50 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.key ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <div className="mt-6 space-y-6">

          {/* Dev Stats – always shown when handles exist */}
          {profile.codingHandles && Object.values(profile.codingHandles).some(Boolean) && activeTab === 'about' && (
            <DevStats handles={profile.codingHandles} />
          )}

          {/* About / Posts Tab */}
          {activeTab === 'about' && (
            <>
              {profile.profileMarkdown && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 shadow-sm">
                  <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-500" /> README
                  </h2>
                  <article className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{profile.profileMarkdown}</ReactMarkdown>
                  </article>
                </div>
              )}
              {profile.projects && profile.projects.length > 0 && (
                <ProjectShowcase projects={profile.projects} />
              )}
              {!profile.profileMarkdown && (!profile.projects || profile.projects.length === 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12 shadow-sm text-center text-gray-400">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="font-semibold text-sm">No content yet</p>
                  {isOwnProfile && (
                    <Link href="/settings" className="mt-3 inline-block text-blue-500 text-xs font-bold hover:underline">
                      Add your bio & projects →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 md:p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Heart size={14} className="text-pink-500" fill="currentColor" /> Friends ({friends.length})
              </h2>
              <div className="space-y-1">
                {friends.map((item: any) => (
                  <UserCard
                    key={item.userId}
                    item={item}
                    isFollowing={viewerFollowing.some((f: any) => f.userId === item.userId)}
                    onFollow={() => followSuggestionMutation.mutate(item.userId)}
                    showFollow={!isOwnProfile && item.userId !== user?.id}
                  />
                ))}
                {friends.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">🤝</div>
                    <p className="text-sm font-semibold">No friends yet</p>
                    <p className="text-xs mt-1">Friends are people who follow each other</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 md:p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> Followers ({followers.length})
              </h2>
              <div className="space-y-1">
                {followers.map((item: any) => (
                  <UserCard
                    key={item.userId}
                    item={item}
                    isFollowing={viewerFollowing.some((f: any) => f.userId === item.userId)}
                    onFollow={() => followSuggestionMutation.mutate(item.userId)}
                    showFollow={item.userId !== user?.id}
                  />
                ))}
                {followers.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">👥</div>
                    <p className="text-sm font-semibold">No followers yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 md:p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserCheck size={14} className="text-emerald-500" /> Following ({following.length})
              </h2>
              <div className="space-y-1">
                {following.map((item: any) => (
                  <UserCard
                    key={item.userId}
                    item={item}
                    isFollowing={viewerFollowing.some((f: any) => f.userId === item.userId)}
                    onFollow={() => followSuggestionMutation.mutate(item.userId)}
                    showFollow={item.userId !== user?.id}
                  />
                ))}
                {following.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-sm font-semibold">Not following anyone yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested Tab */}
          {activeTab === 'suggested' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4 md:p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserPlus size={14} className="text-violet-500" /> People You May Know
              </h2>
              <div className="space-y-1">
                {suggestions.map((item: any) => (
                  <div key={item.userId} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all">
                    <Link href={`/u/${item.username || item.userId}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar src={item.avatar} name={item.username || item.userId} size="md" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.username || item.userId}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {item.mutualCount > 0 ? `${item.mutualCount} mutual · ` : ''}{item.followersCount?.toLocaleString()} followers
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => followSuggestionMutation.mutate(item.userId)}
                      disabled={followSuggestionMutation.isPending}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
                    >
                      Follow
                    </button>
                  </div>
                ))}
                {suggestions.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">✨</div>
                    <p className="text-sm font-semibold">No suggestions right now</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && isOwnProfile && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 shadow-sm">
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings size={14} className="text-gray-500" /> Profile Settings
              </h2>
              <p className="text-sm text-gray-500 mb-5">Manage your account, privacy, and app preferences.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/settings"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:opacity-90 transition-opacity">
                  <Settings size={15} /> Open Settings
                </Link>
                {appMode === 'business' && (
                  <Link href="/business-dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors">
                    <LayoutDashboard size={15} /> Business Dashboard
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
