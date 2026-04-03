'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getLiveStreams, startLiveStream, endLiveStream, joinLiveStream, leaveLiveStream } from '@/services/apiServices'
import { Video, Mic, MicOff, VideoOff, Monitor, Users, MessageCircle, Heart, Radio, Eye, ChevronLeft, X, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LiveStream {
  _id: string
  title: string
  hostId: string
  hostName: string
  hostAvatar?: string
  viewers: number
  category: string
  thumbnail?: string
  isLive: boolean
}

const CATEGORIES = ['All', 'Coding', 'Music', 'Gaming', 'Fitness', 'Food', 'Tech Talk', 'General']

const FALLBACK_STREAMS: LiveStream[] = [
  { _id: '1', title: 'Building a Super App from scratch 🚀', hostId: 'k1', hostName: 'Krishna Dev', hostAvatar: 'https://i.pravatar.cc/150?u=krishna', viewers: 342, category: 'Coding', thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80', isLive: true },
  { _id: '2', title: 'Late Night Music Vibes 🎵', hostId: 'dj1', hostName: 'DJ Pulse', hostAvatar: 'https://i.pravatar.cc/150?u=djpulse', viewers: 1250, category: 'Music', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', isLive: true },
  { _id: '3', title: 'React vs Next.js - Which one?', hostId: 'cm1', hostName: 'Code Master', hostAvatar: 'https://i.pravatar.cc/150?u=codemaster', viewers: 89, category: 'Coding', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', isLive: true },
  { _id: '4', title: 'Sunrise Yoga Session 🧘', hostId: 'y1', hostName: 'Yoga with Ananya', hostAvatar: 'https://i.pravatar.cc/150?u=yoga', viewers: 567, category: 'Fitness', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', isLive: true },
  { _id: '5', title: 'Indian Street Food Tour 🍛', hostId: 'f1', hostName: 'Foodie Rahul', hostAvatar: 'https://i.pravatar.cc/150?u=foodie', viewers: 2100, category: 'Food', thumbnail: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80', isLive: true },
  { _id: '6', title: 'Gaming Night: Valorant 🎮', hostId: 'g1', hostName: 'ProGamer X', hostAvatar: 'https://i.pravatar.cc/150?u=gamer', viewers: 890, category: 'Gaming', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', isLive: true },
]

export default function LivePage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'browse' | 'go-live'>('browse')
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([
    { user: 'Alex', text: 'Hey everyone! 👋' },
    { user: 'Sarah', text: 'Love this stream!' },
    { user: 'Mike', text: 'Can you show the code?' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [streamTitle, setStreamTitle] = useState('')
  const [streamCategory, setStreamCategory] = useState('General')
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null)

  const { data: streamsData, isLoading } = useQuery({
    queryKey: ['live-streams', activeCategory],
    queryFn: async () => {
      try {
        const res = await getLiveStreams(activeCategory)
        const list = Array.isArray(res) ? res : res?.data || []
        return list.length > 0 ? list : FALLBACK_STREAMS
      } catch { return FALLBACK_STREAMS }
    },
    refetchInterval: 30000,
  })

  const streams: LiveStream[] = streamsData || FALLBACK_STREAMS

  const startMutation = useMutation({
    mutationFn: (data: any) => startLiveStream(data),
    onSuccess: (res: any) => {
      const stream = Array.isArray(res) ? res[0] : res
      if (stream?._id) setActiveStreamId(stream._id)
      queryClient.invalidateQueries({ queryKey: ['live-streams'] })
    },
  })

  const endMutation = useMutation({
    mutationFn: (id: string) => endLiveStream(id),
    onSuccess: () => { setActiveStreamId(null); setActiveTab('browse'); queryClient.invalidateQueries({ queryKey: ['live-streams'] }) },
  })

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages([...chatMessages, { user: user?.name || 'You', text: chatInput }])
    setChatInput('')
  }

  const handleWatchStream = async (stream: LiveStream) => {
    setSelectedStream(stream)
    try { await joinLiveStream(stream._id) } catch {}
  }

  const handleLeaveStream = async () => {
    if (selectedStream) {
      try { await leaveLiveStream(selectedStream._id) } catch {}
    }
    setSelectedStream(null)
  }

  // Watching a stream
  if (selectedStream) {
    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-black text-white">
        <div className="flex-1 relative">
          <img src={selectedStream.thumbnail || `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80`} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <button onClick={handleLeaveStream} className="p-2 bg-black/50 backdrop-blur-md rounded-xl hover:bg-black/70 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                <Radio size={12} /> LIVE
              </span>
              <span className="bg-black/50 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                <Eye size={12} /> {selectedStream.viewers.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <img src={selectedStream.hostAvatar || `https://i.pravatar.cc/150?u=${selectedStream.hostId}`} className="w-10 h-10 rounded-full border-2 border-red-500" alt="" />
              <div>
                <h2 className="font-bold text-sm">{selectedStream.hostName}</h2>
                <p className="text-xs text-gray-300">{selectedStream.title}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-red-500 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-600 transition-colors">
                <Heart size={14} /> Follow
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 bg-gray-950 border-l border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2"><MessageCircle size={14} /> Live Chat</h3>
            <span className="text-[10px] font-bold text-gray-400">{chatMessages.length} messages</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[40vh] md:max-h-full">
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-blue-400 text-xs">{msg.user}: </span>
                <span className="text-gray-300 text-xs">{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="p-3 border-t border-gray-800 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Say something..." className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none" />
            <button type="submit" className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b dark:border-gray-800 p-4 md:p-6 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <ChevronLeft size={20} className="dark:text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-black dark:text-white tracking-tight flex items-center gap-2">
                <Radio className="text-red-500" size={20} /> Live
              </h1>
              <p className="text-xs text-gray-400 font-bold">{streams.length} streams live now</p>
            </div>
          </div>
          {activeStreamId ? (
            <button onClick={() => endMutation.mutate(activeStreamId)} disabled={endMutation.isPending} className="px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 flex items-center gap-2">
              <X size={16} /> End Stream
            </button>
          ) : (
            <button onClick={() => setActiveTab(activeTab === 'browse' ? 'go-live' : 'browse')} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${activeTab === 'go-live' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700'}`}>
              {activeTab === 'go-live' ? <><X size={16} /> Cancel</> : <><Video size={16} /> Go Live</>}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-4 md:p-6">
        {activeTab === 'browse' ? (
          <>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900 border dark:border-gray-800 text-gray-500 hover:text-red-600 hover:border-red-500/30'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-20"><Loader2 className="mx-auto animate-spin text-red-500" size={28} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {streams.map(stream => (
                  <button key={stream._id} onClick={() => handleWatchStream(stream)} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group text-left">
                    <div className="relative aspect-video">
                      <img src={stream.thumbnail || `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Radio size={8} /> LIVE
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Eye size={10} /> {stream.viewers.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 flex items-start gap-3">
                      <img src={stream.hostAvatar || `https://i.pravatar.cc/150?u=${stream.hostId}`} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm dark:text-white truncate group-hover:text-blue-600 transition-colors">{stream.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{stream.hostName}</p>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg mt-1 inline-block">{stream.category}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="max-w-lg mx-auto space-y-6 py-8">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                <Video size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black dark:text-white">Start a Live Stream</h2>
              <p className="text-gray-400 text-sm">Share your content with the world in real-time</p>
            </div>

            <div className="space-y-4">
              <input value={streamTitle} onChange={e => setStreamTitle(e.target.value)} placeholder="Stream title..." className="w-full bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-3.5 outline-none dark:text-white font-medium focus:border-blue-500 transition-colors" />
              
              <select value={streamCategory} onChange={e => setStreamCategory(e.target.value)} className="w-full bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-3.5 outline-none dark:text-white">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-700">
                <div className="text-center space-y-2">
                  <Video size={40} className="mx-auto text-gray-600" />
                  <p className="text-gray-500 text-sm font-medium">Camera preview will appear here</p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Mic size={22} />
                </button>
                <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Video size={22} />
                </button>
                <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Monitor size={22} />
                </button>
              </div>

              <button
                onClick={() => startMutation.mutate({ hostId: user?.id, hostName: user?.name, hostAvatar: user?.avatar, title: streamTitle, category: streamCategory })}
                disabled={!streamTitle.trim() || startMutation.isPending}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200 dark:shadow-none active:scale-[0.98]"
              >
                {startMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <Radio size={20} />}
                {startMutation.isPending ? 'Starting...' : 'Go Live'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


interface LiveStream {
  id: string
  title: string
  host: { name: string; avatar: string }
  viewers: number
  category: string
  thumbnail: string
  isLive: boolean
}

export default function LivePage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'browse' | 'go-live'>('browse')
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null)
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([
    { user: 'Alex', text: 'Hey everyone! 👋' },
    { user: 'Sarah', text: 'Love this stream!' },
    { user: 'Mike', text: 'Can you show the code?' },
  ])
  const [chatInput, setChatInput] = useState('')

  // Go Live state
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamTitle, setStreamTitle] = useState('')

  const streams: LiveStream[] = [
    { id: '1', title: 'Building a Super App from scratch 🚀', host: { name: 'Krishna Dev', avatar: 'https://i.pravatar.cc/150?u=krishna' }, viewers: 342, category: 'Coding', thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80', isLive: true },
    { id: '2', title: 'Late Night Music Vibes 🎵', host: { name: 'DJ Pulse', avatar: 'https://i.pravatar.cc/150?u=djpulse' }, viewers: 1250, category: 'Music', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', isLive: true },
    { id: '3', title: 'React vs Next.js - Which one?', host: { name: 'Code Master', avatar: 'https://i.pravatar.cc/150?u=codemaster' }, viewers: 89, category: 'Tech Talk', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', isLive: true },
    { id: '4', title: 'Sunrise Yoga Session 🧘', host: { name: 'Yoga with Ananya', avatar: 'https://i.pravatar.cc/150?u=yoga' }, viewers: 567, category: 'Fitness', thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80', isLive: true },
    { id: '5', title: 'Indian Street Food Tour 🍛', host: { name: 'Foodie Rahul', avatar: 'https://i.pravatar.cc/150?u=foodie' }, viewers: 2100, category: 'Food', thumbnail: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80', isLive: true },
    { id: '6', title: 'Gaming Night: Valorant 🎮', host: { name: 'ProGamer X', avatar: 'https://i.pravatar.cc/150?u=gamer' }, viewers: 890, category: 'Gaming', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', isLive: true },
  ]

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    setChatMessages([...chatMessages, { user: user?.name || 'You', text: chatInput }])
    setChatInput('')
  }

  // Watching a stream
  if (selectedStream) {
    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-black text-white">
        {/* Video Area */}
        <div className="flex-1 relative">
          <img src={selectedStream.thumbnail} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <button onClick={() => setSelectedStream(null)} className="p-2 bg-black/50 backdrop-blur-md rounded-xl hover:bg-black/70 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                <Radio size={12} /> LIVE
              </span>
              <span className="bg-black/50 backdrop-blur-md text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                <Eye size={12} /> {selectedStream.viewers.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <div className="flex items-center gap-3">
              <img src={selectedStream.host.avatar} className="w-10 h-10 rounded-full border-2 border-red-500" alt="" />
              <div>
                <h2 className="font-bold text-sm">{selectedStream.host.name}</h2>
                <p className="text-xs text-gray-300">{selectedStream.title}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="bg-red-500 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-red-600 transition-colors">
                <Heart size={14} /> Follow
              </button>
              <button className="bg-white/10 backdrop-blur-md text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Live Chat */}
        <div className="w-full md:w-80 bg-gray-950 border-l border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2"><MessageCircle size={14} /> Live Chat</h3>
            <span className="text-[10px] font-bold text-gray-400">{chatMessages.length} messages</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[40vh] md:max-h-full">
            {chatMessages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-blue-400 text-xs">{msg.user}: </span>
                <span className="text-gray-300 text-xs">{msg.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} className="p-3 border-t border-gray-800 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Say something..." className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none" />
            <button type="submit" className="p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b dark:border-gray-800 p-4 md:p-6 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <ChevronLeft size={20} className="dark:text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-black dark:text-white tracking-tight flex items-center gap-2">
                <Radio className="text-red-500" size={20} /> Live
              </h1>
              <p className="text-xs text-gray-400 font-bold">{streams.length} streams live now</p>
            </div>
          </div>
          <button onClick={() => setActiveTab(activeTab === 'browse' ? 'go-live' : 'browse')} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 ${activeTab === 'go-live' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white' : 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-700'}`}>
            {activeTab === 'go-live' ? <><X size={16} /> Cancel</> : <><Video size={16} /> Go Live</>}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-4 md:p-6">
        {activeTab === 'browse' ? (
          <>
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
              {['All', 'Coding', 'Music', 'Gaming', 'Fitness', 'Food', 'Tech Talk'].map(cat => (
                <button key={cat} className="px-4 py-2 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl text-xs font-bold whitespace-nowrap text-gray-500 hover:text-blue-600 hover:border-blue-500/30 transition-colors">
                  {cat}
                </button>
              ))}
            </div>

            {/* Stream Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map(stream => (
                <button key={stream.id} onClick={() => setSelectedStream(stream)} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group text-left">
                  <div className="relative aspect-video">
                    <img src={stream.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Radio size={8} /> LIVE
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Eye size={10} /> {stream.viewers.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3">
                    <img src={stream.host.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm dark:text-white truncate group-hover:text-blue-600 transition-colors">{stream.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{stream.host.name}</p>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg mt-1 inline-block">{stream.category}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Go Live Setup */
          <div className="max-w-lg mx-auto space-y-6 py-8">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
                <Video size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black dark:text-white">Start a Live Stream</h2>
              <p className="text-gray-400 text-sm">Share your content with the world in real-time</p>
            </div>

            <div className="space-y-4">
              <input value={streamTitle} onChange={e => setStreamTitle(e.target.value)} placeholder="Stream title..." className="w-full bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-3.5 outline-none dark:text-white font-medium focus:border-blue-500 transition-colors" />
              
              <select className="w-full bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-3.5 outline-none dark:text-white">
                <option>Select Category</option>
                <option>Coding</option>
                <option>Music</option>
                <option>Gaming</option>
                <option>Fitness</option>
                <option>Food</option>
                <option>Tech Talk</option>
              </select>

              {/* Camera Preview */}
              <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-700">
                <div className="text-center space-y-2">
                  <Video size={40} className="mx-auto text-gray-600" />
                  <p className="text-gray-500 text-sm font-medium">Camera preview will appear here</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Mic size={22} />
                </button>
                <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Video size={22} />
                </button>
                <button className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Monitor size={22} />
                </button>
              </div>

              <button onClick={() => setIsStreaming(true)} disabled={!streamTitle.trim()} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200 dark:shadow-none active:scale-[0.98]">
                <Radio size={20} /> Go Live
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
