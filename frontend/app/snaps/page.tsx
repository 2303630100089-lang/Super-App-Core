'use client'

import React, { useState, useEffect } from 'react'
import useAuthStore from '@/store/useAuthStore'
import { CameraModule } from '@/components/snaps/CameraModule'
import { X, Send, User, ChevronRight, Clock, Eye, RotateCcw, Camera, MapPin, Flame, Star, Search, Zap, Trophy, Bell } from 'lucide-react'
import api from '@/services/api'

interface Snap {
  _id: string
  senderId: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  isViewed: boolean
  duration: number
  createdAt: string
}

interface UserProfile {
  userId: string
  name: string
  avatar: string
  streak?: number
}

const FRIENDS_STREAKS = [
  { name: 'Priya', streak: 42, emoji: '🔥', avatar: '' },
  { name: 'Rahul', streak: 18, emoji: '⭐', avatar: '' },
  { name: 'Anjali', streak: 7, emoji: '🌟', avatar: '' },
  { name: 'Dev', streak: 3, emoji: '🔥', avatar: '' },
]

export default function SnapsPage() {
  const [snaps, setSnaps] = useState<Snap[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null)
  const [activeSnap, setActiveSnap] = useState<Snap | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  
  const { user } = useAuthStore()

  useEffect(() => {
    fetchSnaps()
    fetchUsers()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSnap && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    } else if (activeSnap && timeLeft === 0) {
      setActiveSnap(null)
    }
    return () => clearTimeout(timer)
  }, [activeSnap, timeLeft])

  const fetchSnaps = async () => {
    try {
      const response = await api.get('/snaps/inbox')
      if (response.data.success) {
        setSnaps(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching snaps:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/profile/list')
      if (response.data.status === 'success') {
        // Filter out self
        const filtered = response.data.data.filter((u: any) => u.userId !== user?.id)
        setUsers(filtered)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const openSnap = async (snap: Snap) => {
    try {
      const response = await api.post(`/snaps/${snap._id}/open`)
      if (response.data.success) {
        setActiveSnap(snap)
        setTimeLeft(snap.duration || 10)
        fetchSnaps() // Refresh inbox to mark as viewed
      }
    } catch (error) {
      console.error('Error opening snap:', error)
    }
  }

  const handleCapture = (media: { url: string; type: 'image' | 'video' }) => {
    setCapturedMedia(media)
  }

  const sendSnap = async () => {
    if (!capturedMedia || !selectedRecipient) return

    try {
      const response = await api.post('/snaps/send', {
        senderId: user?.id,
        receiverId: selectedRecipient,
        mediaUrl: capturedMedia.url,
        mediaType: capturedMedia.type,
        duration: 10
      })

      if (response.data.success) {
        setIsCameraOpen(false)
        setCapturedMedia(null)
        setSelectedRecipient(null)
        alert('Snap sent!')
      }
    } catch (error) {
      console.error('Error sending snap:', error)
      alert('Failed to send snap')
    }
  }

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {!capturedMedia ? (
          <CameraModule 
            onCapture={handleCapture} 
            onClose={() => setIsCameraOpen(false)} 
          />
        ) : (
          <div className="relative w-full h-full flex flex-col bg-slate-900">
            {/* Preview */}
            <div className="flex-1 relative">
                {capturedMedia.type === 'image' ? (
                  <img src={capturedMedia.url} className="w-full h-full object-cover" />
                ) : (
                  <video src={capturedMedia.url} autoPlay loop className="w-full h-full object-cover" />
                )}
                
                <button 
                  onClick={() => setCapturedMedia(null)}
                  className="absolute top-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white"
                >
                  <RotateCcw size={24} />
                </button>
            </div>

            {/* Recipient Selection Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-widest text-slate-800">Send To</h2>
                    <button onClick={() => setCapturedMedia(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar mb-8">
                    {users.map(u => (
                        <div 
                          key={u.userId}
                          onClick={() => setSelectedRecipient(u.userId)}
                          className={`flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedRecipient === u.userId ? 'border-yellow-400 bg-yellow-50' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} className="w-10 h-10 rounded-full mr-4 border" />
                            <span className="font-bold flex-1">{u.name}</span>
                            {selectedRecipient === u.userId && <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black"><ChevronRight size={16}/></div>}
                        </div>
                    ))}
                </div>

                <button 
                  disabled={!selectedRecipient}
                  onClick={sendSnap}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${selectedRecipient ? 'bg-yellow-400 text-black shadow-xl hover:bg-yellow-300 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  Send Snap <Send size={20} />
                </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-yellow-400 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-6 pb-2 flex justify-between items-center bg-yellow-400 dark:bg-gray-950">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">Snaps</h1>
        </div>
        <div className="flex gap-2">
            <button className="p-3 bg-yellow-300/60 dark:bg-gray-900 rounded-2xl text-black dark:text-slate-400"><Search size={20}/></button>
            <button className="p-3 bg-yellow-300/60 dark:bg-gray-900 rounded-2xl text-black dark:text-slate-400"><Bell size={20}/></button>
            <button 
               onClick={() => setIsCameraOpen(true)}
               className="p-3 bg-black rounded-2xl shadow-lg text-yellow-400 active:scale-90 transition-transform"
            >
               <Camera size={20} />
            </button>
        </div>
      </header>

      {/* Snap Score */}
      <div className="mx-6 my-3 p-4 bg-black/10 dark:bg-gray-800/50 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-300 rounded-2xl flex items-center justify-center font-black text-black text-lg">👻</div>
        <div className="flex-1">
          <p className="font-black text-black dark:text-white text-sm">Snap Score</p>
          <p className="font-black text-2xl text-black dark:text-white">14,820</p>
        </div>
        <div className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full font-black text-xs">
          <Flame size={14} /> 🔥 Streak
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-950 rounded-t-[2.5rem] pt-6 flex flex-col">
        {/* Friends Streaks */}
        <div className="px-6 mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Trophy size={12} /> Best Streaks</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {FRIENDS_STREAKS.map(f => (
              <div key={f.name} className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-black text-white text-lg border-2 border-yellow-200">
                  {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover rounded-full" alt=""/> : f.name[0]}
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-950 rounded-full text-xs px-1 font-black text-orange-500 border border-yellow-200">🔥{f.streak}</div>
                </div>
                <span className="text-[9px] font-black text-gray-500 uppercase">{f.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 mb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12} className="text-purple-500" /> Inbox</p>
        </div>
      
        {/* Inbox */}
        <div className="flex-1 px-6 space-y-3 overflow-y-auto pb-24">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-900 animate-pulse rounded-3xl" />)}
            </div>
          ) : snaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-[2rem] flex items-center justify-center text-4xl mb-4">👻</div>
               <p className="font-black text-sm text-gray-400 uppercase tracking-widest">No Snaps Yet!</p>
               <p className="text-xs text-gray-400 mt-1">Send your first snap to a friend</p>
               <button onClick={() => setIsCameraOpen(true)} className="mt-4 px-6 py-3 bg-yellow-400 text-black font-black rounded-2xl text-xs uppercase tracking-widest">
                 Open Camera
               </button>
            </div>
          ) : (
            <div className="space-y-3">
              {snaps.map(snap => (
                <div 
                  key={snap._id}
                  onClick={() => openSnap(snap)}
                  className="flex items-center p-5 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border dark:border-gray-800 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mr-4 shadow-sm ${snap.isViewed ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 border-2 border-yellow-200/50'}`}>
                    {snap.mediaType === 'image' ? <Eye size={24}/> : <Eye size={24}/>}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-black text-sm uppercase tracking-tight ${snap.isViewed ? 'text-slate-400' : 'text-slate-800 dark:text-white'}`}>{snap.senderId}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {snap.duration}s</p>
                  </div>
                  {!snap.isViewed && <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Snap Map Banner */}
      <div className="fixed bottom-20 left-6 right-6 bg-black/90 backdrop-blur-md text-white rounded-2xl p-4 flex items-center gap-3 shadow-2xl z-30 md:hidden">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
          <MapPin size={20} />
        </div>
        <div className="flex-1">
          <p className="font-black text-sm">Snap Map</p>
          <p className="text-[10px] text-white/60">See where your friends are</p>
        </div>
        <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Open →</button>
      </div>

      {/* Snap Viewer Overlay */}
      {activeSnap && (
        <div className="fixed inset-0 z-[100] bg-black">
            <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400/20 backdrop-blur-md rounded-full flex items-center justify-center font-black text-yellow-400 border border-yellow-400/30">{activeSnap.senderId[0]}</div>
                    <div>
                        <p className="font-black text-white text-xs uppercase tracking-widest">{activeSnap.senderId}</p>
                        <p className="text-[10px] text-white/60 font-bold uppercase">Now</p>
                    </div>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/20" />
                        <circle 
                            cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-yellow-400" 
                            strokeDasharray={126}
                            strokeDashoffset={126 - (timeLeft / (activeSnap.duration || 10)) * 126}
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <span className="absolute font-black text-xs text-white">{timeLeft}</span>
                </div>
            </div>

            {activeSnap.mediaType === 'image' ? (
                <img src={activeSnap.mediaUrl} className="w-full h-full object-cover" alt="snap" />
            ) : (
                <video src={activeSnap.mediaUrl} autoPlay className="w-full h-full object-cover" />
            )}
        </div>
      )}
    </div>
  )
}
