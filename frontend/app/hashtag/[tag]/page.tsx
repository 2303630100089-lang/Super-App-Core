'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Hash, TrendingUp, ArrowLeft, Search } from 'lucide-react'
import api from '@/services/api'
import useAuthStore from '@/store/useAuthStore'
import PostDisplay from '@/components/PostDisplay'
import Link from 'next/link'

interface TrendingTag {
  hashtag: string
  count: number
  totalScore: number
}

export default function HashtagPage() {
  const params = useParams()
  const tag = decodeURIComponent(String(params.tag || ''))
  const { user } = useAuthStore()

  const [posts, setPosts] = useState<any[]>([])
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTag, setSearchTag] = useState(tag)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (tag) {
      setSearchTag(tag)
      fetchPostsByTag(tag, 1)
    }
    fetchTrending()
  }, [tag])

  const fetchPostsByTag = async (t: string, p: number) => {
    try {
      setLoading(true)
      const res = await api.get(`/social/search/hashtag?hashtag=${encodeURIComponent(t)}&page=${p}&limit=20`)
      const data = res.data?.data || []
      if (p === 1) setPosts(data)
      else setPosts(prev => [...prev, ...data])
      setHasMore(data.length === 20)
    } catch (e) { console.error(e) } finally { setLoading(false) }  }

  const fetchTrending = async () => {
    try {
      const res = await api.get('/social/trending/hashtags?limit=15')
      setTrending(res.data?.data || [])
    } catch (e) { console.error(e) }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTag.trim()) return
    const cleaned = searchTag.trim().replace('#', '')
    window.history.pushState(null, '', `/hashtag/${cleaned}`)
    setPage(1)
    fetchPostsByTag(cleaned, 1)
  }

  const handleLike = async (postId: string) => {
    try {
      await api.post('/social/posts/like', { postId, userId: user?.id })
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p
        const likes = p.likes?.includes(user?.id)
          ? p.likes.filter((id: string) => id !== user?.id)
          : [...(p.likes || []), user?.id || '']
        return { ...p, likes }
      }))
    } catch (e) {}
  }

  const handleRepost = async (postId: string) => {
    try {
      await api.post('/social/posts/repost', { postId, userId: user?.id })
    } catch (e) { console.error(e) }
  }

  const handleShare = async (postId: string, targetUserIds: string[]) => {
    try {
      await api.post('/social/posts/share', { postId, userId: user?.id, targetUserIds })
    } catch (e) { console.error(e) }
  }

  const handleReport = async (postId: string, reason: string, description: string) => {
    try {
      await api.post('/social/posts/report', { postId, userId: user?.id, reason, description })
    } catch (e) { console.error(e) }
  }

  const handleBookmark = async (postId: string) => {
    try {
      await api.post('/social/posts/bookmark', { postId, userId: user?.id })
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p
        const savedBy = p.savedBy || []
        const isBookmarked = savedBy.includes(user?.id || '')
        return { ...p, savedBy: isBookmarked ? savedBy.filter((id: string) => id !== user?.id) : [...savedBy, user?.id || ''] }
      }))
    } catch (e) { console.error(e) }
  }

  const handleReact = async (postId: string, reaction: string | null) => {
    try {
      await api.post('/social/posts/react', { postId, userId: user?.id, reaction })
    } catch (e) { console.error(e) }
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-800/40 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/feed"
            className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-colors text-[var(--syn-comment)]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-black text-xl text-[var(--text-primary)] flex items-center gap-1.5">
              <Hash size={20} className="text-blue-500" />
              {tag || 'Hashtags'}
            </h1>
            <p className="text-xs text-[var(--syn-comment)]">{posts.length} posts</p>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[var(--bg-elevated)] rounded-xl px-3 py-2 border border-gray-200/20 dark:border-gray-800/40">
            <Search size={16} className="text-[var(--syn-comment)] shrink-0" />
            <input
              type="text"
              value={searchTag}
              onChange={e => setSearchTag(e.target.value)}
              placeholder="Search hashtag..."
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] text-sm focus:outline-none"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:brightness-110">
            Search
          </button>
        </form>
      </div>

      <div className="px-4 pt-4">
        {/* Trending hashtags sidebar */}
        {trending.length > 0 && (
          <div className="mb-6 bg-[var(--bg-card)] rounded-[1.5rem] border border-gray-200/20 dark:border-gray-800/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-orange-500" />
              <span className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">Trending This Week</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map(t => (
                <Link
                  key={t.hashtag}
                  href={`/hashtag/${encodeURIComponent(t.hashtag)}`}
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-blue-500/10 hover:text-blue-500 transition-all flex items-center gap-1"
                >
                  <span className="text-blue-500">#</span>
                  {t.hashtag}
                  <span className="text-[var(--syn-comment)] font-normal ml-1">{t.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {loading && posts.length === 0 ? (
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
            <span className="text-5xl">🔍</span>
            <p className="font-black text-lg text-[var(--text-primary)] mt-4">No posts for #{tag}</p>
            <p className="text-[var(--syn-comment)] text-sm mt-1">Be the first to use this hashtag!</p>
            <Link href="/feed" className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-full font-bold text-sm hover:brightness-110">
              Create Post
            </Link>
          </div>
        ) : (
          <>
            {posts.map(p => (
              <PostDisplay
                key={p._id}
                post={p}
                currentUserId={user?.id}
                onLike={handleLike}
                onRepost={handleRepost}
                onShare={handleShare}
                onReport={handleReport}
                onMention={() => {}}
                onBookmark={handleBookmark}
                onReact={handleReact}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => {
                  const next = page + 1
                  setPage(next)
                  fetchPostsByTag(tag, next)
                }}
                className="w-full py-3 text-sm font-bold text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
