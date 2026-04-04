'use client'

import React, { useState, useEffect } from 'react'
import { Bookmark, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import api from '@/services/api'
import useAuthStore from '@/store/useAuthStore'
import PostDisplay from '@/components/PostDisplay'

export default function BookmarksPage() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    api.get(`/social/feed/bookmarks?userId=${user.id}`)
      .then(r => setPosts(r.data?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.id])

  const handleLike = async (postId: string) => {
    try {
      await api.post('/social/posts/like', { postId, userId: user?.id })
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p
        const likes = p.likes?.includes(user?.id || '')
          ? p.likes.filter((id: string) => id !== user?.id)
          : [...(p.likes || []), user?.id || '']
        return { ...p, likes }
      }))
    } catch (e) {}
  }

  const handleBookmark = async (postId: string) => {
    try {
      await api.post('/social/posts/bookmark', { postId, userId: user?.id })
      setPosts(prev => prev.filter(p => p._id !== postId))
    } catch (e) {}
  }

  const handleReact = async (postId: string, reaction: string | null) => {
    try {
      await api.post('/social/posts/react', { postId, userId: user?.id, reaction })
    } catch (e) {}
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 min-h-screen">
      <div className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/40 px-4 py-4 flex items-center gap-3">
        <Link href="/feed" className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-colors text-[var(--syn-comment)]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <Bookmark size={20} className="text-yellow-500" />
          <h1 className="font-black text-xl text-[var(--text-primary)]">Saved Posts</h1>
        </div>
        <span className="ml-auto text-xs text-[var(--syn-comment)] font-bold">{posts.length} saved</span>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-[var(--bg-elevated)]" />
                  <div className="space-y-2">
                    <div className="w-24 h-3 bg-[var(--bg-elevated)] rounded" />
                    <div className="w-16 h-2 bg-[var(--bg-elevated)] rounded" />
                  </div>
                </div>
                <div className="w-full h-4 bg-[var(--bg-elevated)] rounded mb-2" />
                <div className="w-3/4 h-4 bg-[var(--bg-elevated)] rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🔖</span>
            <p className="font-black text-lg text-[var(--text-primary)] mt-4">No saved posts yet</p>
            <p className="text-[var(--syn-comment)] text-sm mt-1">Bookmark posts to save them here.</p>
            <Link href="/feed" className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-full font-bold text-sm hover:brightness-110">
              Browse Feed
            </Link>
          </div>
        ) : (
          posts.map(p => (
            <PostDisplay
              key={p._id}
              post={p}
              currentUserId={user?.id}
              onLike={handleLike}
              onRepost={async () => {}}
              onShare={async () => {}}
              onReport={async () => {}}
              onMention={() => {}}
              onBookmark={handleBookmark}
              onReact={handleReact}
            />
          ))
        )}
      </div>
    </div>
  )
}
