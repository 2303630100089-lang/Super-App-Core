'use client'

import React, { useState } from 'react'
import {
  Send, Smile, Paperclip, Phone, Video, MoreVertical, Users,
  Hash, Radio, MessageCircle, Search, Plus, Settings, Bell,
  Pin, Volume2, VolumeX, UserPlus, Image, Mic, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'

interface Message {
  id: string
  sender: string
  avatar: string
  content: string
  timestamp: string
  type: 'text' | 'image' | 'video'
  reactions?: { emoji: string; count: number }[]
  isOwn?: boolean
}

interface Channel {
  id: string
  name: string
  type: 'group' | 'channel' | 'broadcast' | 'discord'
  icon: string
  unread?: number
  lastMessage?: string
  members?: number
  isOnline?: boolean
}

const MessagingApp = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isMuted, setIsMuted] = useState(false)

  const channels: Channel[] = [
    {
      id: '1',
      name: 'Design Team',
      type: 'group',
      icon: '🎨',
      unread: 3,
      lastMessage: "Let's review the mockups",
      members: 8,
      isOnline: true,
    },
    {
      id: '2',
      name: 'Product Updates',
      type: 'channel',
      icon: '📢',
      unread: 12,
      lastMessage: 'New feature released!',
      members: 1250,
      isOnline: true,
    },
    {
      id: '3',
      name: 'Company News',
      type: 'broadcast',
      icon: '📡',
      lastMessage: 'Q4 results are in',
      members: 5000,
      isOnline: true,
    },
    {
      id: '4',
      name: 'Gaming Squad',
      type: 'discord',
      icon: '🎮',
      unread: 5,
      lastMessage: 'Anyone up for a match?',
      members: 24,
      isOnline: true,
    },
    {
      id: '5',
      name: 'Marketing Team',
      type: 'group',
      icon: '📊',
      lastMessage: 'Campaign metrics look good',
      members: 6,
      isOnline: false,
    },
    {
      id: '6',
      name: 'Tech Announcements',
      type: 'channel',
      icon: '💻',
      unread: 2,
      lastMessage: 'Server maintenance scheduled',
      members: 890,
      isOnline: true,
    },
  ]

  const messages: Message[] = [
    {
      id: '1',
      sender: 'Sarah Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'Hey everyone! Just finished the new design mockups. What do you think?',
      timestamp: '10:30 AM',
      type: 'text',
      reactions: [
        { emoji: '👍', count: 5 },
        { emoji: '🔥', count: 3 },
      ],
    },
    {
      id: '2',
      sender: 'You',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: 'Looking great! Love the color scheme you chose.',
      timestamp: '10:32 AM',
      type: 'text',
      isOwn: true,
    },
    {
      id: '3',
      sender: 'Mike Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      content: 'Can we schedule a quick call to discuss the user flow?',
      timestamp: '10:35 AM',
      type: 'text',
      reactions: [{ emoji: '👀', count: 2 }],
    },
    {
      id: '4',
      sender: 'Emma Wilson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      content: "I'm available in 15 minutes if that works for everyone",
      timestamp: '10:36 AM',
      type: 'text',
    },
    {
      id: '5',
      sender: 'You',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: 'Perfect! See you all then 👋',
      timestamp: '10:37 AM',
      type: 'text',
      isOwn: true,
      reactions: [{ emoji: '✅', count: 4 }],
    },
  ]

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'group':
        return <Users size={14} />
      case 'channel':
        return <Hash size={14} />
      case 'broadcast':
        return <Radio size={14} />
      case 'discord':
        return <MessageCircle size={14} />
      default:
        return <Hash size={14} />
    }
  }

  const filteredChannels = activeTab === 'all'
    ? channels
    : channels.filter(c => c.type === activeTab)

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    setMessageInput('')
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r border-border bg-card shrink-0">
        {/* Sidebar header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold text-lg">Messages</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Bell size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus size={16} />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 h-8 text-sm" />
          </div>
        </div>

        {/* Channel type tabs */}
        <div className="px-3 pt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-8 text-xs">
              <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
              <TabsTrigger value="group" className="flex-1 text-xs">Groups</TabsTrigger>
              <TabsTrigger value="channel" className="flex-1 text-xs">Channels</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-2">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-0.5 pr-2">
                  {filteredChannels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
                        selectedChannel?.id === channel.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg">
                          {channel.icon}
                        </div>
                        {channel.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{channel.name}</span>
                          {channel.unread && (
                            <Badge className="ml-1 h-5 min-w-5 text-[10px] px-1 shrink-0">
                              {channel.unread}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {getChannelIcon(channel.type)}
                          <span className="text-xs truncate">{channel.lastMessage}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* User footer */}
        <div className="mt-auto p-3 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">You</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <Settings size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      {selectedChannel ? (
        <div className="flex flex-1 min-w-0">
          {/* Chat panel */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base">
                  {selectedChannel.icon}
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{selectedChannel.name}</h2>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={10} />
                    {selectedChannel.members?.toLocaleString()} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Pin size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    {!message.isOwn && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={message.avatar} />
                        <AvatarFallback>{message.sender[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!message.isOwn && (
                        <span className="text-xs font-medium text-muted-foreground px-1">
                          {message.sender}
                        </span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm ${
                          message.isOwn
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted rounded-tl-sm'
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className={`flex items-center gap-2 px-1 ${message.isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1">
                            {message.reactions.map((reaction, i) => (
                              <button
                                key={i}
                                className="inline-flex items-center gap-0.5 bg-muted hover:bg-accent px-1.5 py-0.5 rounded-full text-xs transition-colors"
                              >
                                {reaction.emoji}
                                <span className="text-muted-foreground">{reaction.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="px-4 py-3 border-t border-border bg-card shrink-0">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                  <Paperclip size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                  <Image size={16} />
                </Button>
                <input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={`Message ${selectedChannel.name}...`}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                  <Smile size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                  <Mic size={16} />
                </Button>
                <Button
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>

          {/* Channel info panel */}
          <div className="w-64 border-l border-border bg-card shrink-0 hidden lg:flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">Channel Info</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl">
                    {selectedChannel.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedChannel.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{selectedChannel.type}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Members</p>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-muted-foreground" />
                    <span className="text-sm">{selectedChannel.members?.toLocaleString()} members</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</p>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="sm" className="justify-start gap-2">
                      <UserPlus size={14} />
                      Add Members
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start gap-2">
                      <Bell size={14} />
                      Notifications
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start gap-2 text-destructive hover:text-destructive">
                      <X size={14} />
                      Leave Channel
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <Card className="p-8 text-center max-w-sm border-dashed">
            <MessageCircle size={40} className="mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-semibold text-lg mb-2">Select a conversation</h2>
            <p className="text-sm text-muted-foreground">
              Choose a channel or group from the sidebar to start messaging
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

export default MessagingApp
