'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getCodingTopics, getCodingDiscussions, createCodingDiscussion, likeDiscussion } from '@/services/apiServices'
import { Code2, Terminal, Cpu, Globe, BookOpen, MessageSquare, Plus, Heart, X, Loader2, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function CodingHubPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', topic: 'web', tags: '' })

  const { data: topicsRes } = useQuery({
    queryKey: ['coding-topics'],
    queryFn: async () => {
      try { const res = await getCodingTopics(); return res?.data || [] } catch { return [] }
    },
  })

  const topics = topicsRes || []

  const { data: discussionsRes, isLoading } = useQuery({
    queryKey: ['coding-discussions', activeTopic],
    queryFn: async () => {
      try { const res = await getCodingDiscussions(activeTopic || undefined); return res?.data || [] } catch { return [] }
    },
  })

  const discussions = discussionsRes || []

  const createMutation = useMutation({
    mutationFn: (data: any) => createCodingDiscussion({ ...data, authorName: user?.name || 'Developer', authorAvatar: user?.avatar }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coding-discussions'] }); setShowNewPost(false); setNewPost({ title: '', content: '', topic: 'web', tags: '' }) },
  })

  const likeMutation = useMutation({
    mutationFn: (id: string) => likeDiscussion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coding-discussions'] }),
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <header className="p-6 md:p-8 bg-indigo-600 text-white rounded-b-[3rem] shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="p-2 bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors">
              <ChevronLeft size={18} />
            </Link>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <Terminal size={32} />
              Coding Hub
            </h1>
          </div>
          <p className="text-indigo-100 opacity-80 max-w-md">The ultimate collaboration space for developers. Solve problems, build projects, and grow together.</p>
          <div className="flex gap-4 mt-6">
            <button onClick={() => setShowNewPost(true)} className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform">
              <Plus size={20} />
              New Discussion
            </button>
            <button className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-indigo-400 hover:bg-indigo-400 transition-colors">
              <BookOpen size={20} />
              DSA Practice
            </button>
          </div>
        </div>
        <Cpu size={200} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Topics */}
        <section>
          <h2 className="text-xl font-bold dark:text-white mb-4">Topics</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setActiveTopic(null)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${!activeTopic ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
            >
              All Topics
            </button>
            {topics.map((topic: any) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTopic === topic.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border dark:border-gray-700'}`}
              >
                {topic.title}
                <span className="ml-2 text-xs opacity-70">{topic.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Discussions */}
        <section>
          <h2 className="text-xl font-bold dark:text-white mb-4">Community Discussions</h2>
          {isLoading ? (
            <div className="text-center py-12"><Loader2 className="mx-auto animate-spin text-indigo-500" size={28} /></div>
          ) : discussions.length > 0 ? (
            <div className="space-y-4">
              {discussions.map((d: any) => (
                <div key={d._id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <img src={d.authorAvatar || `https://i.pravatar.cc/150?u=${d.authorId}`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      <div>
                        <h4 className="font-bold dark:text-white text-sm">{d.title}</h4>
                        <p className="text-[10px] text-gray-500">by {d.authorName} · {new Date(d.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{d.topic}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">{d.content}</p>
                  {d.tags?.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {d.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-lg">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-4 border-t dark:border-gray-700 mt-4">
                    <button onClick={() => likeMutation.mutate(d._id)} className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 text-xs transition-colors">
                      <Heart size={16} className={d.likes?.includes(user?.id) ? 'fill-red-500 text-red-500' : ''} />
                      <span>{d.likes?.length || 0}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <MessageSquare size={16} />
                      <span>{d.replies || 0} replies</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <Code2 size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-gray-400">No discussions yet. Be the first!</p>
              <button onClick={() => setShowNewPost(true)} className="text-indigo-600 font-bold hover:underline">Start a Discussion</button>
            </div>
          )}
        </section>
      </div>

      {/* New Discussion Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-lg border dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg dark:text-white">New Discussion</h3>
              <button onClick={() => setShowNewPost(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={18} className="dark:text-white" />
              </button>
            </div>
            <select value={newPost.topic} onChange={e => setNewPost({ ...newPost, topic: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm dark:text-white outline-none">
              {topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder="Discussion title..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-xl p-3 outline-none dark:text-white text-sm font-medium" autoFocus />
            <textarea value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} placeholder="Share your thoughts, questions, or ideas..." rows={4} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm dark:text-white outline-none resize-none" />
            <input value={newPost.tags} onChange={e => setNewPost({ ...newPost, tags: e.target.value })} placeholder="Tags (comma-separated, e.g. react, node)" className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm dark:text-white outline-none" />
            <button
              onClick={() => createMutation.mutate({ ...newPost, tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean) })}
              disabled={!newPost.title.trim() || createMutation.isPending}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {createMutation.isPending ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
