'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/services/apiServices'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, X, CalendarDays, Repeat, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { EventCountdownCard } from '@/components/ui/event-countdown-card'

interface CalendarEvent {
  _id: string
  title: string
  date: string
  time: string
  endTime?: string
  color: string
  type: 'meeting' | 'reminder' | 'event' | 'task'
  recurring?: boolean
  location?: string
  description?: string
}

const COLORS = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-cyan-500']

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const [newEvent, setNewEvent] = useState({
    title: '', time: '09:00', endTime: '10:00', type: 'event' as CalendarEvent['type'],
    color: COLORS[0], location: '', description: '', recurring: false
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const today = formatDate(new Date())

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['calendar-events', user?.id, year, month],
    queryFn: async () => {
      try {
        const res = await getCalendarEvents(month + 1, year)
        return (res?.data || []) as CalendarEvent[]
      } catch { return [] as CalendarEvent[] }
    },
    enabled: !!user?.id,
  })

  const events: CalendarEvent[] = eventsData || []

  const createMutation = useMutation({
    mutationFn: (data: any) => createCalendarEvent(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events', user?.id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar-events', user?.id] }),
  })

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [firstDayOfWeek, daysInMonth])

  const getEventsForDate = (dateStr: string) => events.filter(e => e.date === dateStr)

  const handleCreateEvent = () => {
    if (!newEvent.title || !selectedDate) return
    createMutation.mutate({ ...newEvent, date: selectedDate })
    setShowCreateModal(false)
    setNewEvent({ title: '', time: '09:00', endTime: '10:00', type: 'event', color: COLORS[0], location: '', description: '', recurring: false })
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

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
              <h1 className="text-xl font-black dark:text-white tracking-tight">{monthName} {year}</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Calendar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex">
              {(['month', 'week'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${viewMode === mode ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}>
                  {mode}
                </button>
              ))}
            </div>
            <button onClick={() => { if (!selectedDate) setSelectedDate(today); setShowCreateModal(true) }} className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-6 p-4 md:p-6">
        {/* Calendar Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors dark:text-white">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(today) }} className="text-xs font-bold text-blue-600 hover:underline">Today</button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors dark:text-white">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">{day}</div>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12"><Loader2 className="mx-auto animate-spin text-blue-500" size={28} /></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayEvents = getEventsForDate(dateStr)
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDate

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-1 rounded-2xl flex flex-col items-center justify-start gap-0.5 transition-all relative group ${
                      isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none scale-105' :
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                      'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white'
                    }`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e._id} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : e.color}`} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar - Events for selected date */}
        <div className="w-full md:w-80 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-sm dark:text-white uppercase tracking-widest">
              {selectedDate ? new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select a Date'}
            </h2>
            {selectedDate && (
              <button onClick={() => setShowCreateModal(true)} className="text-blue-600 text-xs font-bold hover:underline">+ Add</button>
            )}
          </div>

          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.sort((a, b) => a.time.localeCompare(b.time)).map(event => (
                <div key={event._id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-full min-h-[40px] rounded-full ${event.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm dark:text-white truncate">{event.title}</h3>
                        {event.recurring && <Repeat size={12} className="text-gray-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Clock size={10} /> {event.time} - {event.endTime}
                        </span>
                        {event.location && (
                          <span className="text-xs text-gray-400 font-medium flex items-center gap-1 truncate">
                            <MapPin size={10} /> {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteMutation.mutate(event._id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                      <X size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="text-center py-12 space-y-3">
              <CalendarDays size={40} className="mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-gray-400 text-sm font-medium">No events on this day</p>
              <button onClick={() => setShowCreateModal(true)} className="text-blue-600 text-xs font-bold hover:underline">Create one</button>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm italic">Tap a date to see events</p>
            </div>
          )}

          {/* Upcoming events preview */}
          <div className="pt-4 border-t dark:border-gray-800">
            <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-3">Upcoming</h3>
            <div className="space-y-2">
              {events
                .filter(e => e.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
                .slice(0, 4)
                .map(event => (
                  <div key={event._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => setSelectedDate(event.date)}>
                    <div className={`w-8 h-8 rounded-xl ${event.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {new Date(event.date + 'T00:00').getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold dark:text-white truncate">{event.title}</p>
                      <p className="text-[10px] text-gray-400">{event.time}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Featured event countdown */}
          <div className="pt-4 border-t dark:border-gray-800">
            <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-3">Featured Event</h3>
            <EventCountdownCard className="w-full" />
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md border dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg dark:text-white">New Event</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X size={18} className="dark:text-white" />
              </button>
            </div>

            <input value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title..." className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3 outline-none dark:text-white text-sm font-medium" autoFocus />
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Start</label>
                <input type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm dark:text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">End</label>
                <input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm dark:text-white outline-none" />
              </div>
            </div>

            <input value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Location (optional)" className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm dark:text-white outline-none" />

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Color</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setNewEvent({ ...newEvent, color: c })} className={`w-8 h-8 rounded-full ${c} ${newEvent.color === c ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-110' : 'opacity-60'} transition-all`} />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={newEvent.recurring} onChange={e => setNewEvent({ ...newEvent, recurring: e.target.checked })} className="w-4 h-4 accent-blue-600" />
              <span className="text-sm font-medium dark:text-white flex items-center gap-1"><Repeat size={14} /> Recurring event</span>
            </label>

            <button onClick={handleCreateEvent} disabled={createMutation.isPending} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] disabled:opacity-60">
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


