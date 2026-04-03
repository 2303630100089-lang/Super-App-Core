'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getCallHistory } from '@/services/apiServices'
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Volume2, VolumeX, Monitor, ChevronLeft, Clock, PhoneCall, PhoneIncoming, PhoneMissed, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { socketService } from '@/lib/socket'

type CallState = 'idle' | 'ringing' | 'connected' | 'ended'

interface CallLog {
  _id: string
  callerId: string
  receiverId: string
  callType: 'voice' | 'video'
  status: 'completed' | 'missed' | 'rejected' | 'ongoing'
  duration?: number
  startedAt: string
  createdAt: string
}

export default function CallsPage() {
  const { user } = useAuthStore()
  const [callState, setCallState] = useState<CallState>('idle')
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [activeCall, setActiveCall] = useState<{ name: string; avatar: string; type: 'voice' | 'video' } | null>(null)

  const { data: callLogs = [], isLoading } = useQuery({
    queryKey: ['call-history', user?.id],
    queryFn: async () => {
      try {
        const res = await getCallHistory()
        return (Array.isArray(res) ? res : res?.data || []) as CallLog[]
      } catch { return [] as CallLog[] }
    },
    enabled: !!user?.id,
  })

  // Real-time call events
  useEffect(() => {
    if (!user) return;
    const socket = socketService.connect(user);

    socket?.on('call_user', (data: any) => {
      if (callState === 'idle') {
        setActiveCall({ name: 'Incoming Call', avatar: `https://i.pravatar.cc/150?u=${data.callerId || 'unknown'}`, type: data.type || 'video' })
        setCallState('ringing')
      }
    });

    socket?.on('answer_call', () => {
      setCallState('connected')
      setCallDuration(0)
    });

    socket?.on('end_call', () => {
      setCallState('ended')
      setTimeout(() => { setCallState('idle'); setActiveCall(null) }, 2000)
    });

    return () => {
      socket?.off('call_user');
      socket?.off('answer_call');
      socket?.off('end_call');
    }
  }, [user, callState])

  // Call timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (callState === 'connected') {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [callState])

  const initiateCall = (name: string, avatar: string, type: 'voice' | 'video') => {
    setActiveCall({ name, avatar, type })
    setCallState('ringing')
    setCallDuration(0)
    socketService.emitCallUser({ callerId: user?.id, type })
  }

  const endCall = () => {
    socketService.emitEndCall({ callerId: user?.id, receiverId: 'target' })
    setCallState('ended')
    setTimeout(() => { setCallState('idle'); setActiveCall(null) }, 1500)
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatCallDuration = (seconds?: number) => {
    if (!seconds) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getDirection = (log: CallLog) => {
    if (!user?.id) return 'outgoing'
    if (log.status === 'missed') return 'missed'
    return log.callerId === user.id ? 'outgoing' : 'incoming'
  }

  // Full screen call UI
  if (callState !== 'idle' && activeCall) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col ${activeCall.type === 'video' ? 'bg-gray-950' : 'bg-gradient-to-b from-indigo-900 via-blue-900 to-gray-950'}`}>
        {activeCall.type === 'video' && callState === 'connected' && (
          <div className="absolute inset-0">
            <img src={activeCall.avatar} className="w-full h-full object-cover opacity-30 blur-xl scale-110" alt="" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
          <div className={`relative ${callState === 'ringing' ? 'animate-pulse' : ''}`}>
            <img src={activeCall.avatar} className={`w-32 h-32 rounded-full object-cover border-4 ${callState === 'connected' ? 'border-green-500' : 'border-white/30'} shadow-2xl`} alt="" />
            {callState === 'ringing' && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>

          <h2 className="text-2xl font-black text-white mt-6">{activeCall.name}</h2>
          <p className={`text-sm font-medium mt-1 ${callState === 'connected' ? 'text-green-400' : callState === 'ended' ? 'text-red-400' : 'text-gray-400'}`}>
            {callState === 'ringing' ? 'Ringing...' : callState === 'connected' ? formatDuration(callDuration) : 'Call ended'}
          </p>

          <div className="mt-3 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
            {activeCall.type === 'video' ? <Video size={14} className="text-white" /> : <Phone size={14} className="text-white" />}
            <span className="text-xs text-white font-medium capitalize">{activeCall.type} Call</span>
          </div>

          {activeCall.type === 'video' && callState === 'connected' && isVideoEnabled && (
            <div className="absolute bottom-40 right-6 w-32 h-44 rounded-2xl bg-gray-800 border-2 border-white/20 shadow-2xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                <Video size={24} />
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 p-6 pb-12">
          <div className="flex justify-center gap-6 mb-8">
            <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/15 backdrop-blur-md text-white hover:bg-white/25'}`}>
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            {activeCall.type === 'video' && (
              <button onClick={() => setIsVideoEnabled(!isVideoEnabled)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isVideoEnabled ? 'bg-red-500 text-white' : 'bg-white/15 backdrop-blur-md text-white hover:bg-white/25'}`}>
                {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
            )}
            <button onClick={() => setIsSpeaker(!isSpeaker)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSpeaker ? 'bg-blue-500 text-white' : 'bg-white/15 backdrop-blur-md text-white hover:bg-white/25'}`}>
              {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
            {activeCall.type === 'video' && (
              <button className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all">
                <Monitor size={22} />
              </button>
            )}
          </div>
          
          <div className="flex justify-center">
            <button onClick={endCall} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 hover:bg-red-700 transition-all active:scale-90">
              <PhoneOff size={28} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b dark:border-gray-800 p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <ChevronLeft size={20} className="dark:text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-black dark:text-white tracking-tight">Calls</h1>
              <p className="text-xs text-gray-400 font-bold">Voice & Video</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-4 md:p-6 space-y-2">
        <h2 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-4 px-2">Recent Calls</h2>
        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="mx-auto animate-spin text-blue-500" size={28} /></div>
        ) : callLogs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Phone size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-gray-400">No recent calls</p>
          </div>
        ) : callLogs.map(log => {
          const direction = getDirection(log)
          const isVideo = log.callType === 'video'
          const peerId = log.callerId === user?.id ? log.receiverId : log.callerId
          const avatar = `https://i.pravatar.cc/150?u=${peerId}`
          const name = `User ${peerId?.slice(-6) || '...'}`
          const timeAgo = new Date(log.createdAt).toLocaleDateString()

          return (
            <div key={log._id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="relative">
                <img src={avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                  direction === 'missed' ? 'bg-red-100 text-red-500' :
                  direction === 'incoming' ? 'bg-green-100 text-green-500' :
                  'bg-blue-100 text-blue-500'
                }`}>
                  {direction === 'missed' ? <PhoneMissed size={10} /> :
                   direction === 'incoming' ? <PhoneIncoming size={10} /> :
                   <PhoneCall size={10} />}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm dark:text-white">{name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold capitalize ${direction === 'missed' ? 'text-red-500' : 'text-gray-400'}`}>{direction}</span>
                  {isVideo ? <Video size={10} className="text-gray-400" /> : <Phone size={10} className="text-gray-400" />}
                  {log.duration ? <span className="text-[10px] text-gray-400">· {formatCallDuration(log.duration)}</span> : null}
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} /> {timeAgo}</span>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => initiateCall(name, avatar, 'voice')} className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl hover:bg-green-100 transition-colors active:scale-90">
                  <Phone size={16} />
                </button>
                <button onClick={() => initiateCall(name, avatar, 'video')} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-90">
                  <Video size={16} />
                </button>
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}


type CallState = 'idle' | 'ringing' | 'connected' | 'ended'

interface CallLog {
  id: string
  name: string
  avatar: string
  type: 'voice' | 'video'
  direction: 'incoming' | 'outgoing' | 'missed'
  duration?: string
  timestamp: string
}

export default function CallsPage() {
  const { user } = useAuthStore()
  const [callState, setCallState] = useState<CallState>('idle')
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [activeCall, setActiveCall] = useState<{ name: string; avatar: string; type: 'voice' | 'video' } | null>(null)

  const [callLogs] = useState<CallLog[]>([
    { id: '1', name: 'Rahul Sharma', avatar: 'https://i.pravatar.cc/150?u=rahul', type: 'video', direction: 'outgoing', duration: '12:30', timestamp: '2 hrs ago' },
    { id: '2', name: 'Priya Gupta', avatar: 'https://i.pravatar.cc/150?u=priya', type: 'voice', direction: 'incoming', duration: '5:45', timestamp: '5 hrs ago' },
    { id: '3', name: 'Amit Singh', avatar: 'https://i.pravatar.cc/150?u=amit', type: 'video', direction: 'missed', timestamp: 'Yesterday' },
    { id: '4', name: 'Sneha Patel', avatar: 'https://i.pravatar.cc/150?u=sneha', type: 'voice', direction: 'outgoing', duration: '23:10', timestamp: 'Yesterday' },
    { id: '5', name: 'Dev Team', avatar: 'https://i.pravatar.cc/150?u=devteam', type: 'video', direction: 'incoming', duration: '1:05:22', timestamp: '2 days ago' },
    { id: '6', name: 'Ravi Kumar', avatar: 'https://i.pravatar.cc/150?u=ravi', type: 'voice', direction: 'missed', timestamp: '3 days ago' },
  ])

  // Real-time call events
  useEffect(() => {
    if (!user) return;
    const socket = socketService.connect(user);

    socket?.on('call_user', (data: any) => {
      if (callState === 'idle') {
        setActiveCall({ name: 'Incoming Call', avatar: `https://i.pravatar.cc/150?u=${data.callerId || 'unknown'}`, type: data.type || 'video' })
        setCallState('ringing')
      }
    });

    socket?.on('answer_call', () => {
      setCallState('connected')
      setCallDuration(0)
    });

    socket?.on('end_call', () => {
      setCallState('ended')
      setTimeout(() => { setCallState('idle'); setActiveCall(null) }, 2000)
    });

    return () => {
      socket?.off('call_user');
      socket?.off('answer_call');
      socket?.off('end_call');
    }
  }, [user, callState])

  // Call timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (callState === 'connected') {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [callState])

  const startCall = (log: CallLog) => {
    setActiveCall({ name: log.name, avatar: log.avatar, type: log.type })
    setCallState('ringing')
    setCallDuration(0)
    
    // Emit real-time call initiation
    socketService.emitCallUser({ callerId: user?.id, receiverId: log.id, type: log.type })

    // UI Fallback Simulation (Remove when WebRTC logic is fully hooked up)
    setTimeout(() => {
       socketService.emitAnswerCall({ callerId: user?.id, status: 'connected' })
       setCallState('connected')
    }, 4000)
  }

  const endCall = () => {
    socketService.emitEndCall({ callerId: user?.id, receiverId: 'target' })
    setCallState('ended')
    setTimeout(() => { setCallState('idle'); setActiveCall(null) }, 1500)
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Full screen call UI
  if (callState !== 'idle' && activeCall) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col ${activeCall.type === 'video' ? 'bg-gray-950' : 'bg-gradient-to-b from-indigo-900 via-blue-900 to-gray-950'}`}>
        {/* Video background */}
        {activeCall.type === 'video' && callState === 'connected' && (
          <div className="absolute inset-0">
            <img src={activeCall.avatar} className="w-full h-full object-cover opacity-30 blur-xl scale-110" alt="" />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
          {/* Avatar */}
          <div className={`relative ${callState === 'ringing' ? 'animate-pulse' : ''}`}>
            <img src={activeCall.avatar} className={`w-32 h-32 rounded-full object-cover border-4 ${callState === 'connected' ? 'border-green-500' : 'border-white/30'} shadow-2xl`} alt="" />
            {callState === 'ringing' && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </div>

          <h2 className="text-2xl font-black text-white mt-6">{activeCall.name}</h2>
          <p className={`text-sm font-medium mt-1 ${callState === 'connected' ? 'text-green-400' : callState === 'ended' ? 'text-red-400' : 'text-gray-400'}`}>
            {callState === 'ringing' ? 'Ringing...' :
             callState === 'connected' ? formatDuration(callDuration) :
             'Call ended'}
          </p>

          {/* Call type indicator */}
          <div className="mt-3 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full">
            {activeCall.type === 'video' ? <Video size={14} className="text-white" /> : <Phone size={14} className="text-white" />}
            <span className="text-xs text-white font-medium capitalize">{activeCall.type} Call</span>
          </div>

          {/* Self video preview (for video calls) */}
          {activeCall.type === 'video' && callState === 'connected' && isVideoEnabled && (
            <div className="absolute bottom-40 right-6 w-32 h-44 rounded-2xl bg-gray-800 border-2 border-white/20 shadow-2xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                <Video size={24} />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="relative z-10 p-6 pb-12">
          <div className="flex justify-center gap-6 mb-8">
            <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/15 backdrop-blur-md text-white hover:bg-white/25'}`}>
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            {activeCall.type === 'video' && (
              <button onClick={() => setIsVideoEnabled(!isVideoEnabled)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isVideoEnabled ? 'bg-red-500 text-white' : 'bg-white/15 backdrop-blur-md text-white hover:bg-white/25'}`}>
                {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
              </button>
            )}
            <button onClick={() => setIsSpeaker(!isSpeaker)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isSpeaker ? 'bg-blue-500 text-white' : 'bg-white/15 backdrop-blur-md text-white hover:bg-white/25'}`}>
              {isSpeaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
            {activeCall.type === 'video' && (
              <button className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 transition-all">
                <Monitor size={22} />
              </button>
            )}
          </div>
          
          <div className="flex justify-center">
            <button onClick={endCall} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 hover:bg-red-700 transition-all active:scale-90">
              <PhoneOff size={28} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b dark:border-gray-800 p-4 md:p-6 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <ChevronLeft size={20} className="dark:text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-black dark:text-white tracking-tight">Calls</h1>
              <p className="text-xs text-gray-400 font-bold">Voice & Video</p>
            </div>
          </div>
        </div>
      </header>

      {/* Call History */}
      <main className="max-w-4xl mx-auto w-full p-4 md:p-6 space-y-2">
        <h2 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-4 px-2">Recent Calls</h2>
        {callLogs.map(log => (
          <div key={log.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group">
            <div className="relative">
              <img src={log.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                log.direction === 'missed' ? 'bg-red-100 text-red-500' :
                log.direction === 'incoming' ? 'bg-green-100 text-green-500' :
                'bg-blue-100 text-blue-500'
              }`}>
                {log.direction === 'missed' ? <PhoneMissed size={10} /> :
                 log.direction === 'incoming' ? <PhoneIncoming size={10} /> :
                 <PhoneCall size={10} />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm dark:text-white">{log.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold capitalize ${log.direction === 'missed' ? 'text-red-500' : 'text-gray-400'}`}>{log.direction}</span>
                {log.type === 'video' && <Video size={10} className="text-gray-400" />}
                {log.type === 'voice' && <Phone size={10} className="text-gray-400" />}
                {log.duration && <span className="text-[10px] text-gray-400">· {log.duration}</span>}
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Clock size={8} /> {log.timestamp}</span>
              </div>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => startCall({ ...log, type: 'voice' })} className="p-2.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl hover:bg-green-100 transition-colors active:scale-90">
                <Phone size={16} />
              </button>
              <button onClick={() => startCall({ ...log, type: 'video' })} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-90">
                <Video size={16} />
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
