'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { Bell, CheckCircle2, MessageSquare, Heart, ShoppingBag, Car, Info, Loader2, Users, Calendar, ThumbsUp, ShieldCheck, Clock, Share, Rocket, Zap, Gem } from 'lucide-react'
import clsx from 'clsx'
import { TestimonialStack, Testimonial } from '@/components/ui/glass-testimonial-swiper'

const featuredTestimonials: Testimonial[] = [
  {
    id: 1,
    initials: 'SM',
    name: 'Sarah Mitchell',
    role: 'VP of Engineering at TechFlow',
    quote: "This platform has completely transformed how our team collaborates. The AI-powered analytics provide insights we never had before, and the performance improvements are remarkable. Best investment we've made this year.",
    tags: [{ text: 'FEATURED', type: 'featured' }, { text: 'Enterprise', type: 'default' }],
    stats: [{ icon: Users, text: '200+ team' }, { icon: Calendar, text: '2 years customer' }],
    avatarGradient: 'linear-gradient(135deg, #5e6ad2, #8b5cf6)',
  },
  {
    id: 2,
    initials: 'MC',
    name: 'Marcus Chen',
    role: 'Product Manager at DataSync',
    quote: "The real-time collaboration features are game-changing. Our remote team feels more connected than ever, and the platform's reliability is outstanding. The mobile experience is seamless across all devices.",
    tags: [{ text: 'Startup', type: 'default' }, { text: 'Mobile', type: 'default' }],
    stats: [{ icon: ThumbsUp, text: 'Helpful' }, { icon: ShieldCheck, text: 'Verified' }],
    avatarGradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    id: 3,
    initials: 'AR',
    name: 'Alex Rodriguez',
    role: 'CTO at StartupFlow',
    quote: "Incredible performance boost and the mobile apps are flawless. Support team is responsive and the feature roadmap aligns perfectly with our needs. The customization options are endless.",
    tags: [{ text: 'Enterprise', type: 'default' }, { text: 'API User', type: 'default' }],
    stats: [{ icon: Clock, text: '6 months ago' }, { icon: Share, text: 'Shared 8 times' }],
    avatarGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    id: 4,
    initials: 'EJ',
    name: 'Emily Johnson',
    role: 'Founder of Innovate Inc.',
    quote: "As a new company, speed is everything. This tool allowed us to scale our operations twice as fast without doubling our headcount. A must-have for any ambitious startup.",
    tags: [{ text: 'New', type: 'default' }, { text: 'Growth', type: 'featured' }],
    stats: [{ icon: Rocket, text: 'Scaled 2x' }, { icon: Zap, text: 'Fast Setup' }],
    avatarGradient: 'linear-gradient(135deg, #ec4899, #d946ef)',
  },
  {
    id: 5,
    initials: 'DW',
    name: 'David Wong',
    role: 'Lead Designer at Creative Co.',
    quote: "The user interface is not just beautiful, it's intuitive. Our design team was able to adopt it instantly, streamlining our entire workflow and improving creative output.",
    tags: [{ text: 'Design', type: 'default' }],
    stats: [{ icon: Gem, text: 'Top UI/UX' }],
    avatarGradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  },
]

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data } = await api.get(`/notifications/${user?.id}`)
      // Normalize: backend returns { status, data: [...] }
      return Array.isArray(data) ? data : (data?.data || [])
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
    staleTime: 5000
  })

  const markReadMutation = useMutation({
    mutationFn: (notifId: string) => api.post(`/notifications/${notifId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post(`/notifications/${user?.id}/read-all`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="text-blue-400" />
      case 'like': return <Heart className="text-red-400 fill-red-400" />
      case 'order': return <ShoppingBag className="text-emerald-400" />
      case 'ride': return <Car className="text-orange-400" />
      default: return <Info className="text-gray-400" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen relative bg-[var(--bg-primary)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-80px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-48 left-[-90px] h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="p-6 border-b border-gray-200/20 dark:border-gray-800/40 bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card)]/50 backdrop-blur-xl sticky top-0 z-10 shadow-lg shadow-blue-500/10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text tracking-tight flex items-center gap-2">
            🔔 Notifications
          </h1>
          {(notifications?.length || 0) > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-xs font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-elevated)]/50 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)]/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-[var(--bg-card)]/50 rounded-full" />
                  <div className="h-2 w-48 bg-[var(--bg-card)]/30 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (notifications?.length || 0) > 0 ? (
          notifications.map((notif: any) => {
            const isUnread = !notif.isRead
            const bgClass = notif.type === 'message' ? 'bg-blue-500/20 text-blue-300' :
                           notif.type === 'like' ? 'bg-red-500/20 text-red-300' :
                           notif.type === 'order' ? 'bg-emerald-500/20 text-emerald-300' :
                           notif.type === 'ride' ? 'bg-orange-500/20 text-orange-300' :
                           'bg-gray-500/20 text-gray-300'
            const textClass = isUnread ? 'text-blue-300' : 'group-hover:text-blue-300'

            return (
              <button
                key={notif._id}
                onClick={() => isUnread && markReadMutation.mutate(notif._id)}
                disabled={markReadMutation.isPending}
                className={clsx(
                  'w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98] group disabled:opacity-50',
                  isUnread
                    ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 border-2 border-blue-500/30 hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-blue-500/10 shadow-lg shadow-blue-500/10'
                    : 'bg-[var(--bg-elevated)] border border-gray-200/10 dark:border-gray-700/40 hover:bg-[var(--bg-card)] shadow-md hover:shadow-lg'
                )}
              >
                <div className="flex gap-3 items-start">
                  <div className={clsx(
                    'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md transition-all',
                    bgClass
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <h3 className={clsx('text-sm font-black text-[var(--text-primary)] truncate uppercase tracking-wide', textClass)}>
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-[var(--syn-comment)] whitespace-nowrap font-bold">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--syn-comment)] line-clamp-2 group-hover:text-gray-300 transition-colors">
                      {notif.message}
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-1.5 flex-shrink-0 shadow-lg shadow-blue-500/50 animate-pulse" />
                  )}
                </div>
              </button>
            )
          })
        ) : (
          <div className="py-12 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-3xl flex items-center justify-center mx-auto text-[var(--syn-comment)] shadow-lg">
                <Bell size={48} />
              </div>
              <p className="text-[var(--syn-comment)] font-bold text-sm uppercase tracking-wide">You&apos;re all caught up!</p>
              <p className="text-[var(--syn-comment)] text-xs opacity-70">No new notifications at the moment</p>
            </div>

            {/* Testimonial showcase when inbox is empty */}
            <div className="space-y-4">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-[var(--syn-comment)]">
                What our community says
              </p>
              <div className="relative overflow-hidden rounded-3xl px-1">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop")' }}
                />
                <div className="relative z-10 py-6 px-2">
                  <TestimonialStack testimonials={featuredTestimonials} visibleBehind={2} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
