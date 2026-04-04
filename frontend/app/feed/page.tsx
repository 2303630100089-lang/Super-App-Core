'use client'

import React, { useState, useEffect, useRef } from 'react'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Loader2, Sparkles, Edit3, Play, Bookmark
} from 'lucide-react'
import clsx from 'clsx'
import Link from 'next/link'
import PostComposerModal from '@/components/PostComposerModal'
import PostDisplay from '@/components/PostDisplay'

// ─── Types ────────────────────────────────────────────────────────────────────
type PostType = 'text' | 'image' | 'video' | 'poll' | 'notice' | 'reddit_post' | 'event' | 'reminder' | 'alert'
interface MediaItem { url: string; type: 'image' | 'video' }

interface Post {
  _id: string; userId: string; userName?: string; userAvatar?: string;
  type: PostType; content: string; media?: MediaItem[];
  likes: string[]; commentCount: number; shares?: any[];
  hashtags?: string[]; mentions?: string[]; location?: { address: string };
  isReel?: boolean; metadata?: any; createdAt: string;
  reports?: any[]; reportCount?: number; isDeleted?: boolean;
  reposts?: any[]; pollVotes?: any;
}

const AvatarWithFallback = ({ src, name, className }: { src?: string; name?: string; className?: string }) => {
  const [errored, setErrored] = useState(false)
  const label = (name || 'U').trim().charAt(0).toUpperCase() || 'U'

  if (!src || errored) {
    return (
      <div className={clsx('flex items-center justify-center bg-blue-600 text-white font-black', className)}>
        {label}
      </div>
    )
  }

  return <img src={src} className={className} alt={name || 'avatar'} onError={() => setErrored(true)} />
}

// ─── Story Components ────────────────────────────────────────────────────────
const StoryCircle = ({ user, active, onClick }: { user: any; active?: boolean; onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 shrink-0 group">
    <div className={clsx(
      "w-16 h-16 rounded-full p-0.5 transition-all group-active:scale-90",
      active ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" : "bg-[var(--bg-elevated)]"
    )}>
      <div className="w-full h-full rounded-full border-2 border-[var(--bg-primary)] overflow-hidden">
        <AvatarWithFallback src={user.userAvatar} name={user.userName || user.userId} className="w-full h-full object-cover" />
      </div>
    </div>
    <span className="text-[10px] font-bold text-[var(--syn-comment)] truncate w-16 uppercase tracking-tighter">
      {user.userName || 'User'}
    </span>
  </button>
)

// ─── Story Viewer Modal ──────────────────────────────────────────────────────
const StoryViewerModal = ({ story, onClose }: { story: any; onClose: () => void }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <AvatarWithFallback src={story.userAvatar} name={story.userName || story.userId} className="w-10 h-10 rounded-full object-cover" />
          <span className="font-bold text-white text-sm">{story.userName || story.userId || 'User'}</span>
          <span className="text-xs text-gray-400 ml-auto">{story.createdAt ? new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
        {story.mediaType === 'video' ? (
          <video
            src={story.mediaUrl}
            className="w-full rounded-2xl max-h-[70vh] object-cover"
            autoPlay
            controls
            playsInline
          />
        ) : (
          <img
            src={story.mediaUrl}
            alt="Story"
            className="w-full rounded-2xl max-h-[70vh] object-cover"
          />
        )}
        {story.caption && (
          <p className="mt-2 text-white text-sm text-center px-2">{story.caption}</p>
        )}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white text-2xl font-bold"
          aria-label="Close story"
        >✕</button>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [stories, setStories] = useState<any[]>([])
  const [showComposer, setShowComposer] = useState(false)
  const [storyUploading, setStoryUploading] = useState(false)
  const [viewingStory, setViewingStory] = useState<any | null>(null)
  const storyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchFeed()
    fetchStories()
  }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      const res = await api.post('/social/feed', { followingIds: [], limit: 50 })
      if (res.data.status === 'success') setPosts(res.data.data)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fetchStories = async () => {
    try {
      const followingIds = user?.id ? [user.id] : []
      const res = await api.post('/social/stories/feed', { followingIds, userId: user?.id })
      const payload = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setStories(payload)
    } catch (e) { console.error(e) }
  }

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setStoryUploading(true)
    try {
      const safeName = file.name.replace(/\s+/g, '_')
      const path = `stories/${user.id}/${Date.now()}_${safeName}`
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (error) throw error

      const { data } = supabase.storage.from('media').getPublicUrl(path)
      const mediaUrl = data?.publicUrl
      if (!mediaUrl) throw new Error('No media URL generated')

      await api.post('/social/stories', {
        userId: user.id,
        userName: user.name || 'User',
        userAvatar: user.avatar || '',
        mediaUrl,
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        caption: ''
      })

      await fetchStories()
    } catch (err) {
      console.error('Failed to create story:', err)
      alert('Unable to upload story right now. Please try again.')
    } finally {
      setStoryUploading(false)
      e.target.value = ''
    }
  }

  const handleCreatePost = async (postData: any) => {
    setPosting(true)
    try {
      const payload = {
        userId: user?.id,
        userName: user?.name,
        userAvatar: user?.avatar,
        ...postData
      }
      const res = await api.post('/social/posts', payload)
      if (res.data.status === 'success') {
        setPosts([res.data.data, ...posts])
      }
    } catch (e) { console.error(e) } finally { setPosting(false) }
  }

  const handleLike = async (postId: string) => {
    try {
      await api.post('/social/posts/like', { postId, userId: user?.id })
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p
        const likes = p.likes.includes(user?.id || '') 
          ? p.likes.filter(id => id !== user?.id)
          : [...p.likes, user?.id || '']
        return { ...p, likes }
      }))
    } catch (e) {}
  }

  const handleReact = async (postId: string, reaction: string | null) => {
    try {
      await api.post('/social/posts/react', { postId, userId: user?.id, reaction })
      await fetchFeed()
    } catch (e) { console.error(e) }
  }

  const handleBookmark = async (postId: string) => {
    try {
      await api.post('/social/posts/bookmark', { postId, userId: user?.id })
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p
        const savedBy = (p as any).savedBy || []
        const isBookmarked = savedBy.includes(user?.id || '')
        return { ...p, savedBy: isBookmarked ? savedBy.filter((id: string) => id !== user?.id) : [...savedBy, user?.id || ''] }
      }))
    } catch (e) { console.error(e) }
  }

  const handleEditPost = async (postId: string, content: string) => {
    try {
      await api.put(`/social/posts/${postId}`, { userId: user?.id, content })
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, content } : p))
    } catch (e) { console.error(e) }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await api.post('/social/posts/delete', { postId, userId: user?.id })
      setPosts(prev => prev.filter(p => p._id !== postId))
    } catch (e) { console.error(e) }
  }

  const handleRepost = async (postId: string) => {
    try {
      const res = await api.post('/social/posts/repost', { postId, userId: user?.id })
      if (res.data.status === 'success') {
        alert('Post reposted!')
        fetchFeed()
      }
    } catch (e) { console.error(e) }
  }

  const handleShare = async (postId: string, targetUserIds: string[]) => {
    try {
      await api.post('/social/posts/share', { postId, userId: user?.id, targetUserIds })
      alert('Post shared!')
    } catch (e) { console.error(e) }
  }

  const handleReport = async (postId: string, reason: string, description: string) => {
    try {
      const res = await api.post('/social/posts/report', { 
        postId, 
        userId: user?.id, 
        reason, 
        description 
      })
      if (res.data.status === 'success') {
        alert(res.data.message)
        fetchFeed()
      }
    } catch (e) { console.error(e) }
  }

  const handleMention = async (userId: string, userName: string) => {
    // Could open user profile or add mention to new post
    console.log('Mention clicked:', userName)
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 min-h-screen relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-40 right-[-120px] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* Stories Bar */}
      <div className="flex gap-4 overflow-x-auto p-6 no-scrollbar bg-[var(--bg-card)]/85 border-b border-gray-200/20 dark:border-gray-800/40 sticky top-0 z-20 shadow-lg backdrop-blur-xl">
        <input
          ref={storyInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleCreateStory}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            onClick={() => !storyUploading && storyInputRef.current?.click()}
            className="w-16 h-16 rounded-full border-2 border-dashed border-gray-400/40 dark:border-gray-700/50 flex items-center justify-center p-1 cursor-pointer hover:border-blue-500 transition-all"
          >
            <div className="w-full h-full rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--syn-comment)]">
              {storyUploading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={24} />}
            </div>
          </div>
          <span className="text-[10px] font-black text-[var(--syn-comment)] uppercase tracking-tighter">
            {storyUploading ? 'Uploading...' : 'Your Story'}
          </span>
        </div>
        {stories.map((s, i) => <StoryCircle key={i} user={s} active={s.hasUnviewed} onClick={() => setViewingStory(s)} />)}
      </div>

      {/* Post Composer Button + Quick Links */}
      <div className="p-6 bg-[var(--bg-card)]/95 border-b border-gray-200/20 dark:border-gray-800/40 mb-6 shadow-lg">
        <button
          onClick={() => setShowComposer(true)}
          className="w-full flex items-center gap-4 p-4 bg-[var(--bg-elevated)] rounded-2xl hover:ring-2 hover:ring-blue-500/50 transition-all group mb-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden shrink-0">
            <AvatarWithFallback src={user?.avatar} name={user?.name || user?.id} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-black text-[var(--text-primary)] uppercase tracking-widest">Create Something Amazing ✨</p>
            <p className="text-xs text-[var(--syn-comment)]">Text • Photo • Video • Poll • Event • Reminder & more</p>
          </div>
          <Edit3 size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
        </button>
        <div className="flex gap-2">
          <Link href="/reels"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl text-xs font-black text-pink-500 hover:bg-pink-500/20 transition-all">
            <Play size={14} fill="currentColor" /> Reels
          </Link>
          <Link href="/bookmarks"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl text-xs font-black text-[var(--syn-comment)] hover:text-yellow-500 hover:border-yellow-500/30 transition-all">
            <Bookmark size={14} /> Saved
          </Link>
          <Link href="/explore"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl text-xs font-black text-[var(--syn-comment)] hover:text-blue-500 hover:border-blue-500/30 transition-all">
            🔍 Explore
          </Link>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="px-4">
        {loading ? (
          <div className="space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--bg-elevated)]" />
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-[var(--bg-elevated)] rounded" />
                    <div className="w-16 h-2 bg-[var(--bg-elevated)] rounded" />
                  </div>
                </div>
                <div className="w-full h-4 bg-[var(--bg-elevated)] rounded mb-2" />
                <div className="w-3/4 h-4 bg-[var(--bg-elevated)] rounded mb-4" />
                <div className="w-full h-48 bg-[var(--bg-elevated)] rounded-[1.5rem]" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map(p => (
            <PostDisplay
              key={p._id}
              post={p}
              currentUserId={user?.id}
              onLike={handleLike}
              onRepost={handleRepost}
              onShare={handleShare}
              onReport={handleReport}
              onMention={handleMention}
              onComment={() => {}}
              onBookmark={handleBookmark}
              onReact={handleReact}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Sparkles size={48} className="mx-auto text-[var(--syn-comment)] mb-3" />
            <p className="text-[var(--text-primary)] font-bold">No posts yet. Be the first to post! 🚀</p>
          </div>
        )}
      </div>

      {/* Post Composer Modal */}
      <PostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        onSubmit={handleCreatePost}
        isLoading={posting}
      />

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewerModal
          story={viewingStory}
          onClose={() => setViewingStory(null)}
        />
      )}
    </div>
  )
}
