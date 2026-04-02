'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import useAuthStore from '@/store/useAuthStore'
import { 
  getRandomDatingProfiles, 
  swipeDating, 
  getDatingMatches, 
  rewindDating, 
  boostDating,
  updateDatingProfile,
  getDatingProfile,
  joinBlindDate
} from '@/services/apiServices'
import { 
  Heart, X, Star, MapPin, MessageCircle, Sparkles, 
  ChevronLeft, Settings, Filter, RotateCcw, Info, 
  Zap, User, Camera, Check, Plus, Trash2, 
  ShieldQuestion, Loader2, Users, Search
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

// ─── Tinder Card Component ──────────────────────────────────────────────────
const DatingCard = ({ profile, onSwipe, active, index }: { profile: any; onSwipe: (dir: 'left' | 'right' | 'up') => void; active: boolean; index: number }) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  
  const likeOpacity = useTransform(x, [50, 150], [0, 1])
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1])
  const superLikeOpacity = useTransform(y, [-50, -150], [0, 1])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right')
    else if (info.offset.x < -100) onSwipe('left')
    else if (info.offset.y < -100) onSwipe('up')
  }

  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      style={{ x, y, rotate, opacity, zIndex: 50 - index }}
      drag={active ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05 }}
      className={clsx(
        "absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-500",
        !active && "pointer-events-none scale-[0.95] translate-y-4"
      )}
    >
      <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/10 dark:border-gray-800 bg-gray-900">
        <img
          src={profile.photos?.[0] || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80`}
          className="w-full h-full object-cover pointer-events-none"
          alt={profile.name}
        />
        
        {/* Indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 left-10 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[-20deg] z-50">LIKE</motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-12 right-10 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-xl rotate-[20deg] z-50">NOPE</motion.div>
        <motion.div style={{ opacity: superLikeOpacity }} className="absolute bottom-40 left-1/2 -translate-x-1/2 border-4 border-blue-400 text-blue-400 font-black text-3xl px-4 py-2 rounded-xl z-50 whitespace-nowrap">SUPER LIKE</motion.div>

        {/* Info Overlay */}
        <div className={clsx(
          "absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-all duration-500",
          showDetails ? "bg-black/80 backdrop-blur-sm" : "pointer-events-none"
        )} />
        
        <div className={clsx(
          "absolute left-0 right-0 p-8 space-y-4 transition-all duration-500",
          showDetails ? "bottom-0 max-h-full overflow-y-auto scrollbar-hide" : "bottom-0"
        )}>
          <div className="flex items-end justify-between">
            <div className="drop-shadow-lg">
              <h2 className="text-4xl font-black text-white flex items-center gap-2">
                {profile.name}, <span className="font-light">{profile.age || 25}</span>
                {profile.isBoosted && <Zap size={24} className="text-purple-400 fill-purple-400 animate-pulse" />}
              </h2>
              <div className="flex items-center gap-2 text-gray-200 mt-2 font-medium">
                <MapPin size={16} className="text-pink-500" />
                <span>{profile.location?.name || 'Within 5 km'}</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDetails(!showDetails) }}
              className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 hover:bg-white/20 transition-all pointer-events-auto"
            >
              <Info size={20} className={clsx("transition-transform", showDetails && "rotate-180")} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(profile.interests || ['Music', 'Travel', 'Art']).slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/10">{tag}</span>
            ))}
          </div>

          <p className={clsx(
            "text-gray-300 text-sm leading-relaxed drop-shadow-md transition-all",
            !showDetails && "line-clamp-2"
          )}>
            {profile.bio || "Just exploring this amazing app and looking for someone to share coffee and stories with. ✨"}
          </p>

          {showDetails && profile.prompts && profile.prompts.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4 space-y-6"
            >
              {profile.prompts.map((prompt: any, i: number) => (
                <div key={i} className="bg-white/5 rounded-3xl p-6 border border-white/10">
                  <p className="text-xs font-black text-pink-500 uppercase tracking-widest mb-2">{prompt.question}</p>
                  <p className="text-xl font-bold text-white leading-tight italic">"{prompt.answer}"</p>
                </div>
              ))}
              
              <div className="grid grid-cols-2 gap-3 pb-4">
                {profile.photos?.slice(1, 3).map((photo: string, i: number) => (
                  <img key={i} src={photo} className="w-full h-48 object-cover rounded-3xl border border-white/10 shadow-lg" alt="" />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function DatingPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatches, setShowMatches] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [matchPopup, setMatchPopup] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState<'discover' | 'blind'>('discover')
  const [isSearchingBlind, setIsSearchingBlind] = useState(false)
  const [blindMatch, setBlindMatch] = useState<any>(null)
  const [blindError, setBlindError] = useState('')
  const blindPollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blindSearchActiveRef = useRef(false)

  // User Dating Profile
  const { data: myProfile } = useQuery({
    queryKey: ['dating-my-profile', user?.id],
    queryFn: async () => {
      const res = await getDatingProfile(user!.id)
      return res?.data
    },
    enabled: !!user?.id
  })

  const [discoverySettings, setDiscoverySettings] = useState({
    minAge: 18,
    maxAge: 35,
    maxDistance: 50,
    interestedIn: 'everyone'
  })

  useEffect(() => {
    if (myProfile?.preferences) {
      setDiscoverySettings({
        minAge: myProfile.preferences.minAge || 18,
        maxAge: myProfile.preferences.maxAge || 50,
        maxDistance: myProfile.preferences.maxDistance || 50,
        interestedIn: myProfile.interestedIn || 'everyone'
      })
    }
  }, [myProfile])

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['dating-profiles', user?.id, discoverySettings],
    queryFn: async () => {
      try {
        const data = await getRandomDatingProfiles(user?.id)
        return data?.data || []
      } catch {
        return generateFallbackProfiles()
      }
    },
    enabled: !!user?.id && activeTab === 'discover'
  })

  const { data: matches = [] } = useQuery({
    queryKey: ['dating-matches', user?.id],
    queryFn: async () => {
      try {
        const res = await getDatingMatches(user!.id)
        return res?.data || []
      } catch { return [] }
    },
    enabled: !!user?.id
  })

  const swipeMutation = useMutation({
    mutationFn: async ({ targetUserId, action, type }: { targetUserId: string; action: 'like' | 'dislike'; type?: 'like' | 'pass' | 'super_like' }) => {
      return swipeDating(user!.id, targetUserId, action, type)
    },
    onSuccess: (data) => {
      if (data?.matched) {
        setMatchPopup(profiles[currentIndex])
      }
      queryClient.invalidateQueries({ queryKey: ['dating-matches'] })
    }
  })

  const rewindMutation = useMutation({
    mutationFn: async () => rewindDating(user!.id),
    onSuccess: () => {
      if (history.length > 0) {
        const last = history[history.length - 1]
        setHistory(prev => prev.slice(0, -1))
        setCurrentIndex(last.index)
        queryClient.invalidateQueries({ queryKey: ['dating-profiles'] })
      }
    }
  })

  const boostMutation = useMutation({
    mutationFn: async () => boostDating(user!.id),
    onSuccess: () => {
      alert("Profile boosted for 30 minutes! 🚀")
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => updateDatingProfile({ userId: user!.id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating-my-profile'] })
      queryClient.invalidateQueries({ queryKey: ['dating-profiles'] })
      setShowProfileEdit(false)
      setShowSettings(false)
    }
  })

  const joinBlindMutation = useMutation({
    mutationFn: async () => joinBlindDate(user!.id),
    onSuccess: (res) => {
      if (res.matched) {
        setBlindMatch(res.data)
        setIsSearchingBlind(false)
        setBlindError('')
        blindSearchActiveRef.current = false
        if (blindPollingTimerRef.current) {
          clearTimeout(blindPollingTimerRef.current)
          blindPollingTimerRef.current = null
        }
      } else {
        if (blindSearchActiveRef.current) {
          blindPollingTimerRef.current = setTimeout(() => {
            if (blindSearchActiveRef.current) {
              joinBlindMutation.mutate()
            }
          }, 3500)
        }
      }
    },
    onError: (err: any) => {
      setBlindError(err?.response?.data?.message || 'Could not start blind match. Please try again.')
      setIsSearchingBlind(false)
      blindSearchActiveRef.current = false
      if (blindPollingTimerRef.current) {
        clearTimeout(blindPollingTimerRef.current)
        blindPollingTimerRef.current = null
      }
    }
  })

  useEffect(() => {
    return () => {
      blindSearchActiveRef.current = false
      if (blindPollingTimerRef.current) {
        clearTimeout(blindPollingTimerRef.current)
      }
    }
  }, [])

  const handleSwipe = useCallback((dir: 'left' | 'right' | 'up') => {
    if (currentIndex >= profiles.length) return
    const profile = profiles[currentIndex]
    
    let action: 'like' | 'dislike' = 'like'
    let type: 'like' | 'pass' | 'super_like' = 'like'

    if (dir === 'left') {
      action = 'dislike'
      type = 'pass'
    } else if (dir === 'up') {
      action = 'like'
      type = 'super_like'
    } else {
      action = 'like'
      type = 'like'
    }
    
    setHistory(prev => [...prev, { index: currentIndex, profileId: profile.userId }])
    swipeMutation.mutate({ targetUserId: profile.userId, action, type })
    setCurrentIndex(prev => prev + 1)
  }, [currentIndex, profiles, swipeMutation])

  const undoLast = () => {
    if (history.length === 0) return
    rewindMutation.mutate()
  }

  const handleBoost = () => {
    boostMutation.mutate()
  }

  const startBlindDate = () => {
    setBlindError('')
    setIsSearchingBlind(true)
    blindSearchActiveRef.current = true
    joinBlindMutation.mutate()
  }

  const cancelBlindSearch = () => {
    setIsSearchingBlind(false)
    blindSearchActiveRef.current = false
    if (blindPollingTimerRef.current) {
      clearTimeout(blindPollingTimerRef.current)
      blindPollingTimerRef.current = null
    }
  }

  const saveSettings = () => {
    updateProfileMutation.mutate({
      interestedIn: discoverySettings.interestedIn,
      preferences: {
        minAge: discoverySettings.minAge,
        maxAge: discoverySettings.maxAge,
        maxDistance: discoverySettings.maxDistance
      }
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-950 text-white relative overflow-hidden font-sans">
      {/* Top Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-pink-500/10 to-transparent pointer-events-none" />

      {/* Match popup overlay */}
      <AnimatePresence>
        {matchPopup && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6"
          >
            <div className="text-center space-y-8 max-w-sm w-full">
              <motion.div 
                initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                className="relative flex justify-center items-center gap-4"
              >
                <div className="w-32 h-32 rounded-full border-4 border-pink-500 overflow-hidden shadow-2xl">
                  <img src={user?.avatar || `https://i.pravatar.cc/150?u=me`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="w-32 h-32 rounded-full border-4 border-red-500 overflow-hidden shadow-2xl">
                  <img src={matchPopup.photos?.[0] || `https://i.pravatar.cc/300?u=${matchPopup.userId}`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full p-3 shadow-xl">
                    <Heart className="text-pink-500 fill-pink-500" size={32} />
                  </div>
                </div>
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent">It's a Match!</h2>
                <p className="text-gray-300 text-lg">You and <span className="font-bold text-white">{matchPopup.name}</span> liked each other.</p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href={`/chat/${matchPopup.userId}`} className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 shadow-lg shadow-pink-500/20 active:scale-95 transition-all">
                  <MessageCircle size={22} /> SEND A MESSAGE
                </Link>
                <button onClick={() => setMatchPopup(null)} className="w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl font-bold hover:bg-white/20 transition-all text-white border border-white/10 active:scale-95">
                  KEEP SWIPING
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 flex flex-col gap-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link href="/apps" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
               <ChevronLeft size={20} />
             </Link>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <h1 className="text-xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500 uppercase">Super Dating</h1>
             </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowMatches(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 relative group">
              <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
              {matches.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-gray-950 animate-bounce">{matches.length}</span>
              )}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 relative group">
              <Settings size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mx-auto w-full max-w-xs">
          <button 
            onClick={() => setActiveTab('discover')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'discover' ? "bg-white text-gray-950 shadow-lg" : "text-gray-400 hover:text-white"
            )}
          >
            <Users size={14} /> DISCOVER
          </button>
          <button 
            onClick={() => setActiveTab('blind')}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'blind' ? "bg-white text-gray-950 shadow-lg" : "text-gray-400 hover:text-white"
            )}
          >
            <ShieldQuestion size={14} /> BLIND DATE
          </button>
        </div>
      </header>

      {/* Discovery Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl z-[90] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-gray-900 w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            >
               <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                 <h2 className="text-2xl font-black">Discovery Settings</h2>
                 <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
               </div>
               <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
                 <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-pink-500/10 to-red-500/10 rounded-3xl border border-pink-500/20">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-pink-500 border border-white/5 overflow-hidden">
                      {myProfile?.photos?.[0] ? <img src={myProfile.photos[0]} className="w-full h-full object-cover" /> : <User size={32} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{myProfile?.name || 'Complete Your Profile'}</h3>
                      <p className="text-xs text-gray-400 mt-1">Users with full bios get 4x more matches.</p>
                      <button onClick={() => setShowProfileEdit(true)} className="text-xs font-black text-pink-500 mt-2 uppercase tracking-widest">Edit Profile</button>
                    </div>
                 </div>
                 <div className="space-y-4">
                   <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Show Me</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['male', 'female', 'everyone'].map((opt) => (
                       <button key={opt} onClick={() => setDiscoverySettings(prev => ({ ...prev, interestedIn: opt }))}
                         className={clsx("py-3 rounded-2xl font-bold text-sm transition-all border capitalize",
                           discoverySettings.interestedIn === opt ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20" : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10")}>
                         {opt}
                       </button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center"><label className="text-xs font-black text-gray-500 uppercase tracking-widest">Age Range</label><span className="font-bold text-pink-500">{discoverySettings.minAge} - {discoverySettings.maxAge}</span></div>
                    <input type="range" min="18" max="80" value={discoverySettings.maxAge} onChange={(e) => setDiscoverySettings(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))} className="w-full accent-pink-500 bg-white/10 h-1.5 rounded-full appearance-none" />
                 </div>
                 <div className="space-y-6">
                    <div className="flex justify-between items-center"><label className="text-xs font-black text-gray-500 uppercase tracking-widest">Distance</label><span className="font-bold text-pink-500">{discoverySettings.maxDistance} km</span></div>
                    <input type="range" min="2" max="150" value={discoverySettings.maxDistance} onChange={(e) => setDiscoverySettings(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))} className="w-full accent-pink-500 bg-white/10 h-1.5 rounded-full appearance-none" />
                 </div>
               </div>
               <div className="p-6 bg-white/5 border-t border-white/10">
                 <button onClick={saveSettings} disabled={updateProfileMutation.isPending}
                   className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl font-black text-white shadow-xl shadow-pink-500/10 active:scale-95 transition-all disabled:opacity-50">
                   {updateProfileMutation.isPending ? 'SAVING...' : 'APPLY FILTERS'}
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {showProfileEdit && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-[110] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-gray-900 w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col h-[80vh] shadow-2xl"
            >
               <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                 <h2 className="text-2xl font-black">Edit Profile</h2>
                 <button onClick={() => setShowProfileEdit(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20} /></button>
               </div>
               <form 
                 onSubmit={(e) => {
                   e.preventDefault()
                   const formData = new FormData(e.currentTarget)
                   updateProfileMutation.mutate({
                     name: formData.get('name'),
                     age: parseInt(formData.get('age') as string),
                     gender: formData.get('gender'),
                     bio: formData.get('bio'),
                     interests: ((formData.get('interests') as string) || '').split(',').map(s => s.trim()).filter(Boolean),
                   })
                 }}
                 className="p-8 space-y-6 flex-1 overflow-y-auto scrollbar-hide"
               >
                  <div className="space-y-4">
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Photos</label>
                     <div className="grid grid-cols-3 gap-2">
                        {myProfile?.photos?.map((photo: string, i: number) => (
                           <div key={i} className="aspect-square rounded-2xl bg-gray-800 relative overflow-hidden group">
                              <img src={photo} className="w-full h-full object-cover" />
                              <button type="button" className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                           </div>
                        ))}
                        <button type="button" className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-gray-500 hover:bg-white/10 transition-all"><Plus size={24} /></button>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Name</label>
                        <input name="name" defaultValue={myProfile?.name} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-pink-500 outline-none transition-all font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Age</label>
                        <input name="age" type="number" defaultValue={myProfile?.age} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-pink-500 outline-none transition-all font-bold" />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Gender</label>
                     <select name="gender" defaultValue={myProfile?.gender} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-pink-500 outline-none transition-all font-bold appearance-none">
                        <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Bio</label>
                     <textarea name="bio" defaultValue={myProfile?.bio} rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-pink-500 outline-none transition-all font-medium text-sm" placeholder="Write something amazing about yourself..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Interests (comma separated)</label>
                     <input name="interests" defaultValue={myProfile?.interests?.join(', ')} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:border-pink-500 outline-none transition-all font-bold" />
                  </div>
                  <button type="submit" disabled={updateProfileMutation.isPending}
                    className="w-full py-4 bg-white text-gray-950 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                    {updateProfileMutation.isPending ? 'UPDATING...' : 'SAVE CHANGES'}
                  </button>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matches Overlay */}
      <AnimatePresence>
        {showMatches && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 right-0 w-full sm:w-96 bg-gray-950 border-l border-white/5 z-[80] flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5 bg-gray-950/50 backdrop-blur-xl">
              <h2 className="text-2xl font-black">Your Matches</h2>
              <button onClick={() => setShowMatches(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {matches.length > 0 ? matches.map((match: any) => (
                <Link key={match._id} href={`/chat/${match.chatId || match.profile?.userId}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all border border-white/5 group">
                  <div className="relative">
                    <img src={match.profile?.photos?.[0] || `https://i.pravatar.cc/150?u=${match.profile?.userId}`} className="w-16 h-16 rounded-2xl object-cover shadow-lg" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate group-hover:text-pink-500 transition-colors">{match.profile?.name}</h3>
                    <p className="text-xs text-gray-400 font-medium truncate">You matched with {match.profile?.name}!</p>
                  </div>
                  <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                    <MessageCircle size={18} />
                  </div>
                </Link>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-gray-700"><Heart size={48} /></div>
                  <div><h4 className="text-xl font-bold text-gray-300">No matches yet</h4><p className="text-sm text-gray-500 mt-2">Keep swiping to find them!</p></div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        {activeTab === 'discover' ? (
          <div className="w-full max-w-md aspect-[3/4.5] relative">
            <AnimatePresence>
              {isLoading ? (
                <motion.div key="loading" exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900 rounded-[3rem] animate-pulse border-4 border-white/5 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Finding matches...</p>
                  </div>
                </motion.div>
              ) : profiles.length > 0 && currentIndex < profiles.length ? (
                profiles.slice(currentIndex, currentIndex + 3).reverse().map((profile: any, i: number) => {
                  const stackIndex = Math.min(2, profiles.slice(currentIndex, currentIndex + 3).length - 1) - i;
                  return <DatingCard key={profile.userId} profile={profile} active={stackIndex === 0} index={stackIndex} onSwipe={handleSwipe} />
                })
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-8 bg-white/5 rounded-[3rem] border-4 border-dashed border-white/10">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-pink-500 to-red-500 flex items-center justify-center shadow-2xl shadow-pink-500/20"><Sparkles size={48} className="text-white" /></div>
                  <div><h3 className="text-3xl font-black text-white">Out of Profiles</h3><p className="text-gray-400 mt-3 font-medium">Come back later for more!</p></div>
                  <button onClick={() => { setCurrentIndex(0); setHistory([]); queryClient.invalidateQueries({ queryKey: ['dating-profiles'] }) }} className="bg-white text-gray-950 px-10 py-4 rounded-3xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 shadow-xl transition-all"><RotateCcw size={20} /> REFRESH</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full max-w-md aspect-[3/4.5] flex flex-col items-center justify-center text-center space-y-8 p-12 bg-white/5 rounded-[3rem] border-4 border-white/5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-pink-500/20 to-transparent pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {blindMatch ? (
                <motion.div key="matched" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 relative z-10">
                  <div className="w-32 h-32 rounded-full bg-pink-500 mx-auto flex items-center justify-center text-white shadow-2xl shadow-pink-500/40 animate-bounce">
                    <Heart size={64} fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter">IT'S A BLIND MATCH!</h2>
                    <p className="text-gray-400 mt-2 font-medium">You've been paired with a random user. Start chatting anonymously!</p>
                  </div>
                  <Link href={`/chat/${blindMatch.chatId}`} className="block w-full py-5 bg-white text-gray-950 rounded-[2rem] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                    Go to Anonymous Chat
                  </Link>
                </motion.div>
              ) : isSearchingBlind ? (
                <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 relative z-10">
                  <div className="relative">
                    <div className="w-40 h-40 rounded-full border-4 border-dashed border-pink-500/50 animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-pink-500/20 flex items-center justify-center animate-pulse">
                        <Search size={40} className="text-pink-500" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black">Searching...</h3>
                    <p className="text-gray-500 mt-2 font-bold italic tracking-widest uppercase text-xs">Looking for a stranger</p>
                  </div>
                  <button onClick={cancelBlindSearch} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black hover:bg-white/10 transition-all">CANCEL</button>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative z-10">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-pink-500 to-purple-600 mx-auto flex items-center justify-center text-white shadow-2xl rotate-12">
                    <ShieldQuestion size={64} />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic tracking-tighter">Talk to Strangers</h2>
                    <p className="text-gray-400 mt-2 font-medium px-4 leading-relaxed">100% Anonymous. 60 seconds per chat. Be kind and have fun!</p>
                  </div>
                  {blindError && <p className="text-xs text-red-400 font-bold">{blindError}</p>}
                  <div className="w-full space-y-3">
                    <button onClick={startBlindDate} className="w-full py-4 bg-white text-gray-950 rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                      Start Chat
                    </button>
                    <Link href="/random-chat?mode=micro_dating" className="block w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-pink-500/20">
                      Micro-Dating
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Controls - Only for Discover tab */}
      {activeTab === 'discover' && (
        <div className="px-6 py-10 flex items-center justify-center gap-4 sm:gap-6 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent z-10">
          <button onClick={undoLast} disabled={history.length === 0 || rewindMutation.isPending}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-yellow-500 hover:bg-white/10 active:scale-90 transition-all disabled:opacity-30">
            <RotateCcw size={20} className={clsx(rewindMutation.isPending && "animate-spin")} />
          </button>
          <button onClick={() => handleSwipe('left')} disabled={currentIndex >= profiles.length || swipeMutation.isPending}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-red-500 hover:border-red-500 shadow-xl transition-all active:scale-90 disabled:opacity-50">
            <X size={32} strokeWidth={3} />
          </button>
          <button onClick={() => handleSwipe('up')} disabled={currentIndex >= profiles.length || swipeMutation.isPending}
            className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-blue-400 hover:border-blue-400 active:scale-90 transition-all disabled:opacity-50">
            <Star size={24} fill="currentColor" />
          </button>
          <button onClick={() => handleSwipe('right')} disabled={currentIndex >= profiles.length || swipeMutation.isPending}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border-2 border-white/10 rounded-full flex items-center justify-center text-green-500 hover:border-green-500 shadow-xl transition-all active:scale-90 disabled:opacity-50">
            <Heart size={32} fill="currentColor" strokeWidth={0} />
          </button>
          <button onClick={handleBoost} disabled={boostMutation.isPending}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-purple-400 hover:bg-purple-400/10 active:scale-90 transition-all">
            <Zap size={20} fill="currentColor" className={clsx(boostMutation.isPending && "animate-pulse")} />
          </button>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function generateFallbackProfiles() {
  return [
    { userId: '1', name: 'Aavya', age: 24, bio: 'Coffee addict and dog lover 🐶.', interests: ['Coffee', 'Dogs', 'Travel'], location: { name: '2 km away' }, photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80'], prompts: [{ question: "My ideal first date", answer: "A sunset hike followed by tacos and stargazing." }] },
    { userId: '2', name: 'Ishani', age: 23, bio: 'Fitness freak and foodie.', interests: ['Fitness', 'Food', 'Gaming'], location: { name: '4 km away' }, photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80'], prompts: [{ question: "A fun fact about me", answer: "I've visited 15 countries alone." }] },
    { userId: '3', name: 'Zoya', age: 22, bio: 'Artist by day, dreamer by night 🎨.', interests: ['Art', 'Music', 'Nature'], location: { name: '5 km away' }, photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80'] },
    { userId: '4', name: 'Diya', age: 25, bio: 'Solo traveler. 30 countries and counting ✈️.', interests: ['Travel', 'Adventure', 'Yoga'], location: { name: '7 km away' }, photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80'] },
    { userId: '5', name: 'Riya', age: 24, bio: 'Always down for a spontaneous road trip 🚗', interests: ['Roadtrips', 'Music', 'Pizza'], location: { name: '3 km away' }, photos: ['https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80'] },
  ]
}
