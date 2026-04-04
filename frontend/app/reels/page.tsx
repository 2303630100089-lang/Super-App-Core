'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, MessageCircle, Share2, Repeat2, Bookmark, BookmarkCheck, VolumeX, Volume2, Music2, ChevronUp, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'

interface Reel {
  _id: string
  userId: string
  userName?: string
  userAvatar?: string
  content: string
  media?: { url: string; mediaType: string }[]
  hashtags?: string[]
  likes?: string[]
  reactions?: Record<string, string[]>
  commentCount?: number
  reposts?: any[]
  savedBy?: string[]
  score?: number
  createdAt: string
}

function ReelCard({
  reel,
  isActive,
  currentUserId,
  onLike,
  onBookmark,
}: {
  reel: Reel
  isActive: boolean
  currentUserId?: string
  onLike: (id: string) => void
  onBookmark: (id: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(reel.likes?.includes(currentUserId || '') || false)
  const [likeCount, setLikeCount] = useState(reel.likes?.length || 0)
  const [bookmarked, setBookmarked] = useState(reel.savedBy?.includes(currentUserId || '') || false)

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isActive])

  const handleLike = () => {
    const nowLiked = !liked
    setLiked(nowLiked)
    setLikeCount(c => c + (nowLiked ? 1 : -1))
    onLike(reel._id)
  }

  const handleBookmark = () => {
    setBookmarked(b => !b)
    onBookmark(reel._id)
  }

  const videoUrl = reel.media?.[0]?.url || ''

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* Video */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
          onClick={() => setMuted(m => !m)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
          <p className="text-white/60 text-sm font-bold">No video</p>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Right-side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <div className={clsx(
            'w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-75',
            liked ? 'bg-red-500' : 'bg-black/40 backdrop-blur-sm'
          )}>
            <Heart size={22} className="text-white" fill={liked ? 'white' : 'none'} />
          </div>
          <span className="text-white text-[11px] font-black drop-shadow">{likeCount}</span>
        </button>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle size={22} className="text-white" />
          </div>
          <span className="text-white text-[11px] font-black drop-shadow">{reel.commentCount || 0}</span>
        </div>

        {/* Bookmark */}
        <button onClick={handleBookmark} className="flex flex-col items-center gap-1">
          <div className={clsx(
            'w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-75',
            bookmarked ? 'bg-yellow-500' : 'bg-black/40 backdrop-blur-sm'
          )}>
            {bookmarked ? <BookmarkCheck size={22} className="text-white" /> : <Bookmark size={22} className="text-white" />}
          </div>
        </button>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 size={22} className="text-white" />
          </div>
        </div>

        {/* Spinning music disc */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-gray-600 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
            <Music2 size={10} className="text-white" />
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 left-4 right-16">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={reel.userAvatar || `https://i.pravatar.cc/40?u=${reel.userId}`}
            className="w-9 h-9 rounded-full border-2 border-white object-cover"
            alt=""
          />
          <span className="text-white font-black text-sm drop-shadow">{reel.userName || 'User'}</span>
        </div>
        {reel.content && (
          <p className="text-white text-sm drop-shadow line-clamp-2 mb-2">{reel.content}</p>
        )}
        {reel.hashtags && reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reel.hashtags.slice(0, 4).map(h => (
              <span key={h} className="text-blue-300 text-xs font-bold">#{h}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReelsPage() {
  const { user } = useAuthStore()
  const [reels, setReels] = useState<Reel[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  const fetchReels = useCallback(async (p = 1) => {
    try {
      setLoading(true)
      const res = await api.get(`/social/reels?page=${p}&limit=10`)
      const data: Reel[] = res.data?.data || []
      setReels(prev => p === 1 ? data : [...prev, ...data])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchReels(1) }, [fetchReels])

  // Load more when near end
  useEffect(() => {
    if (activeIndex >= reels.length - 2 && reels.length > 0) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchReels(nextPage)
    }
  }, [activeIndex, reels.length, page, fetchReels])

  const handleLike = async (reelId: string) => {
    try {
      await api.post('/social/posts/like', { postId: reelId, userId: user?.id })
    } catch (e) { console.error(e) }
  }

  const handleBookmark = async (reelId: string) => {
    try {
      await api.post('/social/posts/bookmark', { postId: reelId, userId: user?.id })
    } catch (e) { console.error(e) }
  }

  const goNext = () => setActiveIndex(i => Math.min(i + 1, reels.length - 1))
  const goPrev = () => setActiveIndex(i => Math.max(i - 1, 0))

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [reels.length])

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev()
    }
  }

  if (loading && reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/60 text-sm font-bold">Loading Reels...</p>
        </div>
      </div>
    )
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center px-8">
          <p className="text-5xl mb-4">🎬</p>
          <p className="text-white font-black text-xl mb-2">No Reels Yet</p>
          <p className="text-white/60 text-sm">Be the first to post a reel!</p>
          <a href="/feed" className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-full font-bold text-sm hover:brightness-110">
            Create Reel
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Reel cards - translate to show active */}
      <div
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateY(-${activeIndex * 100}%)` }}
      >
        {reels.map((reel, idx) => (
          <div key={reel._id} className="w-full h-screen">
            <ReelCard
              reel={reel}
              isActive={idx === activeIndex}
              currentUserId={user?.id}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        <button
          onClick={goPrev}
          disabled={activeIndex === 0}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-all"
        >
          <ChevronUp size={18} />
        </button>
        <button
          onClick={goNext}
          disabled={activeIndex >= reels.length - 1}
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-white/20 transition-all"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {reels.slice(Math.max(0, activeIndex - 2), activeIndex + 3).map((_, i) => {
          const actualIdx = Math.max(0, activeIndex - 2) + i
          return (
            <div key={actualIdx} className={clsx(
              'rounded-full transition-all',
              actualIdx === activeIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'
            )} />
          )
        })}
      </div>

      {/* Back to feed */}
      <a
        href="/feed"
        className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white text-xs font-bold hover:bg-black/60 transition-all"
      >
        ← Feed
      </a>
    </div>
  )
}
