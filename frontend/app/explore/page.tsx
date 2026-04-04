'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getSocialFeed } from '@/services/apiServices'
import { TrendingUp, Search, Play } from 'lucide-react'
import Link from 'next/link'
import api from '@/services/api'
import PostDisplay from '@/components/PostDisplay'

interface TrendingTag {
  hashtag: string
  count: number
}

export default function SocialFeedPage() {
  const { user } = useAuthStore()
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState<any[]>([])

  const { data: feedPosts, isLoading } = useQuery({
    queryKey: ['social-feed', user?.id],
    queryFn: () => getSocialFeed(user?.id as string),
    enabled: !!user?.id
  })

  useEffect(() => {
    if (feedPosts) setPosts(feedPosts)
  }, [feedPosts])

  useEffect(() => {
    api.get('/social/trending/hashtags?limit=10')
      .then(r => setTrending(r.data?.data || []))
      .catch(() => {})
  }, [])

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

  const handleRepost = async (postId: string) => {
    try {
      await api.post('/social/posts/repost', { postId, userId: user?.id })
    } catch (e) {}
  }

  const handleShare = async (postId: string, targetUserIds: string[]) => {
    try {
      await api.post('/social/posts/share', { postId, userId: user?.id, targetUserIds })
    } catch (e) {}
  }

  const handleReport = async (postId: string, reason: string, description: string) => {
    try {
      await api.post('/social/posts/report', { postId, userId: user?.id, reason, description })
    } catch (e) {}
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
    } catch (e) {}
  }

  const handleReact = async (postId: string, reaction: string | null) => {
    try {
      await api.post('/social/posts/react', { postId, userId: user?.id, reaction })
    } catch (e) {}
  }

  const filteredPosts = searchQuery
    ? posts.filter(p => p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || p.hashtags?.some((h: string) => h.toLowerCase().includes(searchQuery.toLowerCase())))
    : posts

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[-120px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-40 right-[-120px] h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card)]/50 backdrop-blur-xl p-5 border-b border-gray-200/20 dark:border-gray-800/40 z-10 shadow-lg shadow-blue-500/10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text tracking-tight">🔍 Explore</h1>
          <Link href="/reels"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl text-xs font-black hover:brightness-110 transition-all">
            <Play size={12} fill="white" /> Reels
          </Link>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--syn-comment)]" size={17} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search posts, people, tags..."
            className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-700/40 rounded-2xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] text-sm transition-all hover:border-gray-200/40 dark:hover:border-gray-700/50"
          />
        </div>
      </header>

      {/* Trending hashtags */}
      {trending.length > 0 && (
        <div className="px-4 pt-4">
          <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-gray-200/20 dark:border-gray-800/40 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-orange-500" />
              <span className="font-black text-sm text-[var(--text-primary)] uppercase tracking-wide">Trending</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trending.map(t => (
                <Link key={t.hashtag} href={`/hashtag/${encodeURIComponent(t.hashtag)}`}
                  className="px-3 py-1.5 bg-[var(--bg-elevated)] rounded-xl text-xs font-bold text-[var(--text-primary)] hover:bg-blue-500/10 hover:text-blue-500 transition-all">
                  <span className="text-blue-500">#</span>{t.hashtag}
                  <span className="text-[var(--syn-comment)] ml-1">{t.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="px-4 pb-20">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)]" />
                  <div className="space-y-2 flex-1">
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
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post: any) => (
            <PostDisplay
              key={post._id}
              post={post}
              currentUserId={user?.id}
              onLike={handleLike}
              onRepost={handleRepost}
              onShare={handleShare}
              onReport={handleReport}
              onMention={() => {}}
              onBookmark={handleBookmark}
              onReact={handleReact}
            />
          ))
        ) : (
          <div className="py-20 text-center space-y-3">
            <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-3xl flex items-center justify-center mx-auto text-[var(--syn-comment)] shadow-lg">
              <Search size={48} />
            </div>
            <p className="text-[var(--syn-comment)] font-bold text-sm uppercase tracking-wide">
              {searchQuery ? `No posts match "${searchQuery}"` : 'No posts found'}
            </p>
            <p className="text-[var(--syn-comment)] text-xs opacity-70">
              {searchQuery ? 'Try a different search term.' : 'Be the first to post something amazing! 🚀'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
