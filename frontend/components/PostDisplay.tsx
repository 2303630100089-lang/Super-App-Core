'use client'

import React, { useState } from 'react'
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Repeat2, Flag,
  Globe, X, Send, AlertCircle, Users, Calendar, Clock, Bookmark,
  BookmarkCheck, ChevronDown, Pencil, Trash2
} from 'lucide-react'
import clsx from 'clsx'
import api from '@/services/api'
import useAuthStore from '@/store/useAuthStore'

interface PostDisplayProps {
  post: any
  currentUserId?: string
  onLike: (postId: string) => void
  onRepost: (postId: string) => void
  onShare: (postId: string, targetUserIds: string[]) => void
  onReport: (postId: string, reason: string, description: string) => void
  onMention: (userId: string, userName: string) => void
  onComment?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onReact?: (postId: string, reaction: string | null) => void
  onEditPost?: (postId: string, content: string) => void
  onDeletePost?: (postId: string) => void
}

const REACTIONS = [
  { key: 'like', emoji: '👍', label: 'Like' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'haha', emoji: '😂', label: 'Haha' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
  { key: 'angry', emoji: '😡', label: 'Angry' },
]

function getMyReaction(post: any, userId?: string): string | null {
  if (!userId || !post.reactions) return null
  for (const r of REACTIONS) {
    const users: string[] = post.reactions?.[r.key] || []
    if (users.includes(userId)) return r.key
  }
  return null
}

function getTotalReactions(post: any): number {
  if (!post.reactions) return post.likes?.length || 0
  return REACTIONS.reduce((sum, r) => sum + (post.reactions?.[r.key]?.length || 0), 0) + (post.likes?.length || 0)
}

export default function PostDisplay({
  post,
  currentUserId,
  onLike,
  onRepost,
  onShare,
  onReport,
  onMention,
  onComment,
  onBookmark,
  onReact,
  onEditPost,
  onDeletePost
}: PostDisplayProps) {
  const [showReportModal, setShowReportModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [shareInput, setShareInput] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')

  const isLiked = post.likes?.includes(currentUserId) || false
  const isBookmarked = post.savedBy?.includes(currentUserId) || false
  const myReaction = getMyReaction(post, currentUserId)
  const totalReactions = getTotalReactions(post)
  const isDeleted = post.isDeleted
  const isOwner = currentUserId && post.userId === currentUserId

  const handleReport = async () => {
    await onReport(post._id, reportReason, reportDescription)
    setShowReportModal(false)
    setReportReason('')
    setReportDescription('')
  }

  const handleReaction = (reactionKey: string) => {
    if (onReact) {
      // Toggle off if same reaction; otherwise apply new one
      onReact(post._id, myReaction === reactionKey ? null : reactionKey)
    }
    setShowReactionPicker(false)
  }

  const handleEditSave = () => {
    if (onEditPost) onEditPost(post._id, editContent)
    setEditMode(false)
  }

  if (isDeleted) {
    return (
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-red-500/30 p-6 mb-4 flex items-center gap-3">
        <AlertCircle className="text-red-500" size={24} />
        <div>
          <p className="font-bold text-red-500">Post Removed</p>
          <p className="text-xs text-[var(--syn-comment)]">{post.deletionReason || 'This post has been removed'}</p>
        </div>
      </div>
    )
  }

  const currentReactionData = myReaction ? REACTIONS.find(r => r.key === myReaction) : null

  return (
    <>
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 shadow-xl overflow-hidden mb-6">
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-elevated)] overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
              onClick={() => onMention(post.userId, post.userName)}>
              <img src={post.userAvatar || `https://i.pravatar.cc/100?u=${post.userId}`} className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight text-[var(--text-primary)] cursor-pointer hover:text-blue-500"
                onClick={() => onMention(post.userId, post.userName)}>
                {post.userName || 'Anonymous User'}
              </p>
              <p className="text-[10px] text-[var(--syn-comment)] font-bold flex items-center gap-1">
                <Globe size={10} /> {new Date(post.createdAt).toLocaleDateString()} {post.location?.address && `· ${post.location.address}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 relative">
            {post.reportCount > 0 && (
              <span className="text-[10px] text-red-500 font-bold px-2 py-1 bg-red-500/10 rounded-lg">
                {post.reportCount} reports
              </span>
            )}
            <button className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-colors"
              onClick={() => setShowMenu(v => !v)}>
              <MoreHorizontal size={18} className="text-[var(--syn-comment)]" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 z-30 bg-[var(--bg-card)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl shadow-xl min-w-[150px] overflow-hidden">
                {isOwner && (
                  <>
                    <button onClick={() => { setEditMode(true); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--bg-elevated)] text-sm font-bold text-[var(--text-primary)]">
                      <Pencil size={14} /> Edit Post
                    </button>
                    <button onClick={() => { onDeletePost?.(post._id); setShowMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-500/10 text-sm font-bold text-red-500">
                      <Trash2 size={14} /> Delete Post
                    </button>
                  </>
                )}
                <button onClick={() => { setShowReportModal(true); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--bg-elevated)] text-sm font-bold text-[var(--text-primary)]">
                  <Flag size={14} /> Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content - Varies by Type */}
        <div className="px-4 pb-3">
          {post.type === 'poll' && (
            <>
              <p className="font-black text-lg text-blue-500 mb-4">{post.content}</p>
              <div className="space-y-2">
                {post.metadata?.options?.map((opt: any, idx: number) => {
                  const votes = post.pollVotes?.[idx] || []
                  const percentage = post.metadata.options.reduce((sum: any) => sum + (votes?.length || 0), 0) > 0
                    ? Math.round((votes?.length || 0) / post.metadata.options.reduce((sum: any) => sum + (votes?.length || 0), 0) * 100)
                    : 0
                  return (
                    <button key={idx} className="w-full text-left p-2 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[var(--text-primary)]">{opt.text}</span>
                        <span className="text-xs text-blue-500 font-bold">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${percentage}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {post.type === 'event' && (
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 p-4 rounded-xl mb-3">
              <p className="font-black text-lg text-blue-500 mb-3">{post.metadata?.title || post.content}</p>
              <div className="space-y-2 text-sm text-[var(--text-primary)]">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  <span>{post.metadata?.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-500" />
                  <span>{post.metadata?.location}</span>
                </div>
              </div>
            </div>
          )}

          {post.type === 'reminder' && (
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-4 rounded-xl mb-3">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={20} className="text-purple-500" />
                <div>
                  <p className="font-black text-purple-500">{post.metadata?.date} at {post.metadata?.time}</p>
                </div>
              </div>
              <p className="text-[var(--text-primary)] font-medium">{post.metadata?.description}</p>
            </div>
          )}

          {post.type === 'alert' && (
            <div className={clsx(
              'border-l-4 p-4 rounded-lg mb-3',
              post.metadata?.level === 'critical' ? 'bg-red-500/10 border-red-500' :
              post.metadata?.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
              'bg-blue-500/10 border-blue-500'
            )}>
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className={
                  post.metadata?.level === 'critical' ? 'text-red-500' :
                  post.metadata?.level === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                } />
                <p className={clsx(
                  'font-black text-sm',
                  post.metadata?.level === 'critical' ? 'text-red-500' :
                  post.metadata?.level === 'warning' ? 'text-yellow-500' :
                  'text-blue-500'
                )}>
                  {post.metadata?.level?.toUpperCase()} - {post.content}
                </p>
              </div>
            </div>
          )}

          {post.type === 'notice' && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 p-4 rounded-xl mb-3">
              <p className="font-black text-lg text-yellow-600">{post.content}</p>
            </div>
          )}

          {['text', 'image', 'video'].includes(post.type) && (
            editMode ? (
              <div className="mb-3">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-blue-500/50 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleEditSave}
                    className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-bold hover:brightness-110">
                    Save
                  </button>
                  <button onClick={() => { setEditMode(false); setEditContent(post.content) }}
                    className="px-4 py-1.5 border border-gray-300/30 rounded-lg text-xs font-bold text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)]">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text-primary)] font-medium mb-3">
                {post.content}
              </p>
            )
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.hashtags.map((h: string) => (
                <a key={h} href={`/hashtag/${h}`} className="text-[10px] font-black text-blue-500 uppercase hover:text-blue-600">
                  #{h}
                </a>
              ))}
            </div>
          )}

          {/* Mentions */}
          {post.mentions && post.mentions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.mentions.map((m: string) => (
                <button key={m} onClick={() => onMention('', m)}
                  className="text-[10px] font-black text-purple-500 uppercase hover:text-purple-600">
                  @{m}
                </button>
              ))}
            </div>
          )}

          {/* Reactions summary */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex -space-x-1">
                {REACTIONS.filter(r => (post.reactions?.[r.key]?.length || 0) > 0).slice(0, 3).map(r => (
                  <span key={r.key} className="text-sm">{r.emoji}</span>
                ))}
              </div>
              <span className="text-xs text-[var(--syn-comment)] font-bold">{totalReactions}</span>
            </div>
          )}
        </div>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <div className="px-2">
            <div className="rounded-[1.5rem] overflow-hidden bg-[var(--bg-elevated)]">
              {post.media[0]?.mediaType === 'video' ? (
                <video src={post.media[0].url} controls className="w-full h-auto" />
              ) : (
                <img src={post.media[0].url} className="w-full h-auto object-cover max-h-[500px]" alt="" />
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex items-center justify-between border-t border-gray-200/20 dark:border-gray-800/50 mt-2">
          <div className="flex items-center gap-3">
            {/* Reaction button */}
            <div className="relative">
              <button
                onClick={() => onReact ? setShowReactionPicker(v => !v) : onLike(post._id)}
                onMouseEnter={() => onReact && setShowReactionPicker(true)}
                className={clsx(
                  "flex items-center gap-1.5 p-2 rounded-xl transition-all active:scale-90",
                  (isLiked || myReaction) ? "text-red-500 bg-red-900/20" : "text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)]"
                )}>
                {currentReactionData ? (
                  <span className="text-base leading-none">{currentReactionData.emoji}</span>
                ) : (
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                )}
                <span className="text-xs font-black">{totalReactions || post.likes?.length || 0}</span>
              </button>

              {showReactionPicker && onReact && (
                <div
                  className="absolute bottom-10 left-0 z-30 bg-[var(--bg-card)] border border-gray-200/20 dark:border-gray-800/40 rounded-2xl shadow-2xl p-2 flex gap-1"
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {REACTIONS.map(r => (
                    <button key={r.key} onClick={() => handleReaction(r.key)}
                      className={clsx(
                        "p-1.5 rounded-xl transition-all hover:scale-125 text-xl",
                        myReaction === r.key ? "bg-blue-500/20" : "hover:bg-[var(--bg-elevated)]"
                      )}
                      title={r.label}>
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setShowComments(prev => !prev)}
              className={clsx(
                "flex items-center gap-1.5 p-2 rounded-xl transition-all",
                showComments ? "text-blue-500 bg-blue-500/10" : "text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)]"
              )}>
              <MessageCircle size={20} />
              <span className="text-xs font-black">{post.commentCount || 0}</span>
            </button>
            <button onClick={() => onRepost(post._id)}
              className="flex items-center gap-1.5 p-2 text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)] hover:text-green-500 rounded-xl transition-all">
              <Repeat2 size={20} />
              <span className="text-xs font-black">{post.reposts?.length || 0}</span>
            </button>
            <button onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 p-2 text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)] hover:text-blue-500 rounded-xl transition-all">
              <Share2 size={20} />
            </button>
          </div>
          {onBookmark && (
            <button onClick={() => onBookmark(post._id)}
              className={clsx(
                "p-2 rounded-xl transition-all",
                isBookmarked ? "text-yellow-500 bg-yellow-500/10" : "text-[var(--syn-comment)] hover:bg-[var(--bg-elevated)] hover:text-yellow-500"
              )}>
              {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          )}
        </div>

        {/* Inline Comments Panel */}
        {showComments && (
          <CommentPanel postId={post._id} currentUserId={currentUserId} onClose={() => setShowComments(false)} />
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--text-primary)]">Share Post</h3>
              <button onClick={() => setShowShareModal(false)}><X size={20} /></button>
            </div>
            <input
              type="text"
              value={shareInput}
              onChange={e => setShareInput(e.target.value)}
              placeholder="Enter user IDs to share with (comma separated)"
              className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-lg p-3 text-sm mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowShareModal(false)}
                className="flex-1 py-2 border border-gray-200/20 dark:border-gray-800/40 rounded-lg font-bold hover:bg-[var(--bg-elevated)]">
                Cancel
              </button>
              <button onClick={() => { onShare(post._id, shareInput.split(',').map(s => s.trim()).filter(Boolean)); setShowShareModal(false) }}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg font-bold hover:brightness-110 flex items-center justify-center gap-2">
                <Send size={14} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--text-primary)]">Report Post</h3>
              <button onClick={() => setShowReportModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {['offensive', 'spam', 'inappropriate', 'scam', 'harassment'].map(reason => (
                <label key={reason} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[var(--bg-elevated)] rounded-lg">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-bold text-[var(--text-primary)] capitalize">{reason}</span>
                </label>
              ))}
            </div>
            <textarea
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              placeholder="Additional details..."
              className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-lg p-2 text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 border border-gray-200/20 dark:border-gray-800/40 rounded-lg font-bold hover:bg-[var(--bg-elevated)]">
                Cancel
              </button>
              <button onClick={handleReport}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:brightness-110">
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Inline Comment Panel ─────────────────────────────────────────────────────

function CommentPanel({ postId, currentUserId, onClose }: { postId: string; currentUserId?: string; onClose: () => void }) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sort, setSort] = useState<'top' | 'new'>('top')

  React.useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/social/posts/${postId}/comments?sort=${sort}`)
        setComments(res.data?.data || [])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchComments()
  }, [postId, sort])

  const handleSubmit = async () => {
    if (!newComment.trim() || !currentUserId) return
    setSubmitting(true)
    try {
      const res = await api.post('/social/posts/comment', {
        postId,
        parentId: replyTo?.id || null,
        userId: currentUserId,
        userName: user?.name || 'User',
        userAvatar: user?.avatar || '',
        content: newComment.trim(),
      })
      if (res.data.status === 'success') {
        setComments(prev => [res.data.data, ...prev])
        setNewComment('')
        setReplyTo(null)
      }
    } catch (e) { console.error(e) } finally { setSubmitting(false) }
  }

  const topLevel = React.useMemo(() => comments.filter(c => !c.parentId && !c.isDeleted), [comments])
  const repliesMap = React.useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const c of comments) {
      if (c.parentId && !c.isDeleted) {
        const key = String(c.parentId)
        if (!map[key]) map[key] = []
        map[key].push(c)
      }
    }
    return map
  }, [comments])
  const getReplies = React.useCallback((id: string) => repliesMap[id] || [], [repliesMap])

  return (
    <div className="border-t border-gray-200/20 dark:border-gray-800/40 bg-[var(--bg-elevated)] rounded-b-[2rem]">
      {/* Sort bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-black text-[var(--syn-comment)] uppercase">Comments · {comments.length}</span>
        <div className="flex gap-2">
          {(['top', 'new'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={clsx('text-[10px] font-black uppercase px-2 py-1 rounded-lg', sort === s ? 'bg-blue-500 text-white' : 'text-[var(--syn-comment)] hover:bg-[var(--bg-card)]')}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Comment input */}
      <div className="px-4 py-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-blue-500 font-bold mb-1">
            <span>Replying to @{replyTo.name}</span>
            <button onClick={() => setReplyTo(null)} className="text-[var(--syn-comment)]"><X size={12} /></button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
            placeholder="Add a comment..."
            className="flex-1 bg-[var(--bg-card)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            rows={1}
          />
          <button onClick={handleSubmit} disabled={submitting || !newComment.trim()}
            className="p-2.5 bg-blue-500 text-white rounded-xl disabled:opacity-50 hover:brightness-110 transition-all">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="max-h-72 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="text-center py-4 text-xs text-[var(--syn-comment)]">Loading...</div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-4 text-xs text-[var(--syn-comment)]">No comments yet. Be first! 💬</div>
        ) : (
          topLevel.map(c => (
            <CommentItem key={c._id} comment={c} replies={getReplies(c._id)} onReply={setReplyTo} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, replies, onReply, currentUserId }: {
  comment: any; replies: any[]; onReply: (r: { id: string; name: string }) => void; currentUserId?: string
}) {
  const [showReplies, setShowReplies] = useState(false)
  const timeSince = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }
  return (
    <div>
      <div className="flex gap-2.5">
        <img src={comment.userAvatar || `https://i.pravatar.cc/40?u=${comment.userId}`}
          className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" alt="" />
        <div className="flex-1">
          <div className="bg-[var(--bg-card)] rounded-2xl px-3 py-2">
            <p className="text-[10px] font-black text-blue-500 uppercase mb-0.5">{comment.userName || 'User'}</p>
            <p className="text-xs text-[var(--text-primary)]">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[9px] text-[var(--syn-comment)]">{timeSince(comment.createdAt)}</span>
            <span className="text-[9px] text-[var(--syn-comment)]">👍 {(comment.upvotes?.length || 0) - (comment.downvotes?.length || 0)}</span>
            <button onClick={() => onReply({ id: comment._id, name: comment.userName || 'user' })}
              className="text-[9px] font-black text-blue-500 hover:text-blue-600">Reply</button>
            {replies.length > 0 && (
              <button onClick={() => setShowReplies(v => !v)}
                className="text-[9px] font-black text-[var(--syn-comment)] flex items-center gap-0.5">
                <ChevronDown size={10} className={clsx('transition-transform', showReplies && 'rotate-180')} />
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          {showReplies && replies.length > 0 && (
            <div className="ml-3 mt-2 space-y-2 border-l-2 border-gray-200/20 dark:border-gray-800/40 pl-3">
              {replies.map(r => (
                <CommentItem key={r._id} comment={r} replies={[]} onReply={onReply} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
