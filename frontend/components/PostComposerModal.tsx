'use client'

import React, { useRef, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'

interface PostComposerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (postData: any) => Promise<void>
  isLoading?: boolean
}

type PostType = 'text' | 'image' | 'video' | 'poll' | 'event' | 'reminder' | 'notice' | 'alert'

export default function PostComposerModal({ isOpen, onClose, onSubmit, isLoading }: PostComposerProps) {
  const [postType, setPostType] = useState<PostType>('text')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [mentions, setMentions] = useState('')
  const [media, setMedia] = useState<string[]>([])
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  
  // Poll fields
  const [pollOptions, setPollOptions] = useState(['Option 1', 'Option 2'])
  const [allowMultiple, setAllowMultiple] = useState(false)
  
  // Event fields
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  
  // Reminder fields
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  
  // Reel / Schedule / Draft
  const [isReel, setIsReel] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public')

  const postTypeOptions: { value: PostType; label: string; icon: string }[] = [
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'image', label: 'Photo', icon: '🖼️' },
    { value: 'video', label: 'Video', icon: '🎥' },
    { value: 'poll', label: 'Poll', icon: '📊' },
    { value: 'event', label: 'Event', icon: '📅' },
    { value: 'reminder', label: 'Reminder', icon: '⏰' },
    { value: 'notice', label: 'Notice', icon: '📢' },
    { value: 'alert', label: 'Alert', icon: '⚠️' },
  ]

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])
  }

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    }
  }

  const handleUpdatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions]
    newOptions[index] = value
    setPollOptions(newOptions)
  }

  const handleMediaFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploadingMedia(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of files) {
        const safeName = file.name.replace(/\s+/g, '_')
        const path = `posts/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`
        const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
      }
      setMedia(prev => [...prev, ...uploadedUrls])
    } catch (err) {
      console.error('Media upload failed:', err)
      alert('Failed to upload media. Please try again.')
    } finally {
      setUploadingMedia(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async () => {
    const postData: any = {
      type: postType,
      content,
      hashtags: hashtags.split(',').filter(h => h.trim()).map(h => h.trim().replace('#', '')),
      mentions: mentions.split(',').filter(m => m.trim()).map(m => m.trim().replace('@', '')),
      media: media.map(m => ({ url: m, mediaType: postType === 'video' ? 'video' : 'image' })),
      isReel: postType === 'video' ? isReel : false,
      isDraft,
      visibility,
      ...(scheduledAt ? { scheduledAt } : {}),
    }

    if (postType === 'poll') {
      postData.metadata = {
        options: pollOptions.map((opt, idx) => ({ id: String(idx), text: opt })),
        allowMultiple,
      }
    }

    if (postType === 'event') {
      postData.metadata = {
        title: eventTitle,
        date: eventDate,
        location: eventLocation,
      }
    }

    if (postType === 'reminder') {
      postData.metadata = {
        date: reminderDate,
        time: reminderTime,
        description: content,
      }
    }

    if (postType === 'alert') {
      postData.metadata = {
        level: alertLevel,
        message: content,
      }
    }

    try {
      await onSubmit(postData)
      // Reset form
      setContent('')
      setHashtags('')
      setMentions('')
      setMedia([])
      setPollOptions(['Option 1', 'Option 2'])
      setPostType('text')
      setIsReel(false)
      setIsDraft(false)
      setScheduledAt('')
      setVisibility('public')
      onClose()
    } catch (err) {
      console.error('Error submitting post:', err)
    }
  }

  const canSubmit =
    postType === 'image' || postType === 'video'
      ? Boolean(content.trim() || media.length > 0)
      : Boolean(content.trim())

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-gray-200/20 dark:border-gray-800/40 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/20 dark:border-gray-800/40 sticky top-0 bg-[var(--bg-card)]">
          <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Create Post</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-elevated)] rounded-xl transition-colors">
            <X size={20} className="text-[var(--syn-comment)]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Post Type Selector */}
          <div>
            <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-3">Post Type</label>
            <div className="grid grid-cols-4 gap-2">
              {postTypeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPostType(opt.value)}
                  className={clsx(
                    'p-3 rounded-xl border-2 transition-all text-center',
                    postType === opt.value
                      ? 'bg-blue-500/20 border-blue-500 text-blue-500'
                      : 'border-gray-200/20 dark:border-gray-800/40 text-[var(--syn-comment)] hover:border-blue-500/50'
                  )}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className="text-xs font-bold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Common Content Field */}
          {['text', 'notice', 'alert', 'image', 'video'].includes(postType) && (
            <div>
              <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Content</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                rows={4}
              />
            </div>
          )}

          {['image', 'video'].includes(postType) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase">Media</label>
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:brightness-110 disabled:opacity-50"
                >
                  {uploadingMedia ? 'Uploading...' : 'Choose File'}
                </button>
              </div>
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept={postType === 'video' ? 'video/*' : 'image/*'}
                onChange={handleMediaFilesChange}
                className="hidden"
              />
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {media.map((url, idx) => (
                    <div key={url + idx} className="relative rounded-lg overflow-hidden border border-gray-200/20 dark:border-gray-800/40">
                      {postType === 'video' ? (
                        <video src={url} className="w-full h-24 object-cover" />
                      ) : (
                        <img src={url} alt="upload" className="w-full h-24 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setMedia(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Event Fields */}
          {postType === 'event' && (
            <>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Event Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  placeholder="Event name..."
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Location</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  placeholder="Event location..."
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </>
          )}

          {/* Reminder Fields */}
          {postType === 'reminder' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Date</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Time</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={e => setReminderTime(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Description</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="What's the reminder for?"
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Alert Fields */}
          {postType === 'alert' && (
            <div>
              <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Alert Level</label>
              <div className="flex gap-2">
                {['info', 'warning', 'critical'].map(level => (
                  <button
                    key={level}
                    onClick={() => setAlertLevel(level)}
                    className={clsx(
                      'flex-1 py-2 rounded-lg border-2 transition-all capitalize font-bold',
                      alertLevel === level
                        ? 'bg-blue-500/20 border-blue-500 text-blue-500'
                        : 'border-gray-200/20 dark:border-gray-800/40 text-[var(--syn-comment)] hover:border-blue-500/50'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Poll Fields */}
          {postType === 'poll' && (
            <>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Question</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-3">Options</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleUpdatePollOption(idx, e.target.value)}
                        className="flex-1 bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-lg p-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddPollOption}
                  className="mt-3 w-full py-2 border-2 border-dashed border-blue-500/50 text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2 font-bold"
                >
                  <Plus size={16} /> Add Option
                </button>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={e => setAllowMultiple(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-bold text-[var(--text-primary)]">Allow multiple selections</span>
              </label>
            </>
          )}

          {/* Hashtags & Mentions */}
          {['text', 'image', 'video', 'notice'].includes(postType) && (
            <>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Hashtags (comma separated)</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  placeholder="#trending, #news, #tech"
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Mentions (comma separated)</label>
                <input
                  type="text"
                  value={mentions}
                  onChange={e => setMentions(e.target.value)}
                  placeholder="@user1, @user2, @user3"
                  className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] placeholder:text-[var(--syn-comment)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Visibility</label>
            <div className="flex gap-2">
              {(['public', 'friends', 'private'] as const).map(v => (
                <button key={v} onClick={() => setVisibility(v)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg border-2 transition-all capitalize font-bold text-xs',
                    visibility === v
                      ? 'bg-blue-500/20 border-blue-500 text-blue-500'
                      : 'border-gray-200/20 dark:border-gray-800/40 text-[var(--syn-comment)] hover:border-blue-500/50'
                  )}>
                  {v === 'public' ? '🌎' : v === 'friends' ? '👥' : '🔒'} {v}
                </button>
              ))}
            </div>
          </div>

          {/* Reel toggle (video only) */}
          {postType === 'video' && (
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-[var(--bg-elevated)] rounded-xl">
              <input type="checkbox" checked={isReel} onChange={e => setIsReel(e.target.checked)} className="w-4 h-4" />
              <div>
                <span className="text-sm font-black text-[var(--text-primary)]">🎬 Post as Reel</span>
                <p className="text-[10px] text-[var(--syn-comment)]">Appears in the TikTok-style vertical video feed</p>
              </div>
            </label>
          )}

          {/* Schedule post */}
          <div>
            <label className="block text-xs font-black text-[var(--syn-comment)] uppercase mb-2">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 rounded-xl p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200/20 dark:border-gray-800/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200/20 dark:border-gray-800/40 text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => { setIsDraft(true); handleSubmit() }}
            disabled={isLoading || uploadingMedia || !canSubmit}
            className="px-4 py-2 bg-[var(--bg-elevated)] border border-gray-200/20 dark:border-gray-800/40 text-[var(--text-primary)] rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
          >
            Save Draft
          </button>
          <button
            onClick={() => { setIsDraft(false); handleSubmit() }}
            disabled={isLoading || uploadingMedia || !canSubmit}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:brightness-110 transition-all disabled:opacity-50 active:scale-95"
          >
            {scheduledAt ? '📅 Schedule' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
