'use client'

import { useState, useEffect, useRef } from 'react'
import useAuthStore from '@/store/useAuthStore'
import api from '@/services/api'
import { Send, Image as ImageIcon, Smile, Check, CheckCheck, MoreVertical, Trash2, Edit3, Reply, Star, Gamepad2, Phone, Video, Mic, StopCircle, EyeOff, Sparkles, Timer, Bot } from 'lucide-react'
import ChatGamePanel from '@/components/chat/ChatGamePanel'
import { EngagementBanners } from '@/components/chat/EngagementBanners'
import PollCard from '@/components/chat/PollCard'
import GroupInfoPanel from '@/components/chat/GroupInfoPanel'
import CallUI from '@/components/chat/CallUI'
import CommandOverlay from '@/components/chat/CommandOverlay'

export default function SuperChatPage() {
  const { user } = useAuthStore()
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  // Advanced Toggles
  const [showGamePanel, setShowGamePanel] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [activeCall, setActiveCall] = useState<{ isVideo: boolean, callerName: string } | null>(null)
  const [overlayConfig, setOverlayConfig] = useState<{ type: 'command' | 'mention' | 'hashtag', query: string } | null>(null)
  
  // Phase AI State
  const [smartReplies, setSmartReplies] = useState<string[]>([])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isViewOnceMode, setIsViewOnceMode] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // MOCK: Engagements for testing the banner UI
  const mockEngagements = [
    { _id: '1', type: 'alert', title: 'Emergency Maintenance in 5 mins!' }
  ]

  // MOCK: Poll for testing Poll UI
  const mockPoll = {
    _id: 'poll1', question: 'Where should we go for lunch?', options: [{ id: 'opt1', text: 'Pizza', votes: ['user1'] }, { id: 'opt2', text: 'Sushi', votes: [] }], allowMultiple: false, showResults: 'always'
  }

  // MOCK: Group Info
  const mockGroupData = { groupDetails: { description: 'Welcome to the super squad.', admins: ['user1'], avatar: '' }, chatDetails: { chatName: 'Super Squad', participants: ['user1', 'user2'] }, memberCount: 2, media: [] }

  useEffect(() => {
    // Fetch user chats on load
  }, [])

  // Command Detection
  useEffect(() => {
    if (newMessage.startsWith('/')) {
      setOverlayConfig({ type: 'command', query: newMessage.substring(1).split(' ')[0] })
    } else if (newMessage.includes(' @')) {
      const parts = newMessage.split(' @')
      setOverlayConfig({ type: 'mention', query: parts[parts.length - 1] })
    } else if (newMessage.includes(' #')) {
      const parts = newMessage.split(' #')
      setOverlayConfig({ type: 'hashtag', query: parts[parts.length - 1] })
    } else {
      setOverlayConfig(null)
    }
  }, [newMessage])

  // Phase AI3: Smart Reply Trigger
  useEffect(() => {
    const fetchSmartReplies = async () => {
      if (messages.length > 0 && messages[messages.length - 1].senderId !== user?.id && messages[messages.length - 1].senderId !== 'ai') {
        try {
          const { data } = await api.post('/ai/reply', { userId: user?.id, contextMessages: messages.slice(-5) });
          setSmartReplies(data.suggestions || []);
        } catch (e) {}
      } else {
        setSmartReplies([]);
      }
    };
    fetchSmartReplies();
  }, [messages])

  const handleCommandSelect = (cmd: string) => {
    setNewMessage(cmd + ' ')
    setOverlayConfig(null)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat) return

    // Phase AI4 & AI2: AI Command Handlers
    if (newMessage.startsWith('/ask ')) {
      setIsAiLoading(true);
      const question = newMessage.replace('/ask ', '');
      try {
        const { data } = await api.post('/ai/ask', { userId: user?.id, question });
        setMessages(prev => [...prev, { _id: Date.now().toString(), senderId: 'ai', content: `🤖 AI: ${data.answer}` }]);
      } catch (err) {}
      setNewMessage('');
      setIsAiLoading(false);
      scrollToBottom();
      return;
    }

    if (newMessage.trim() === '/summarize') {
      setIsAiLoading(true);
      try {
        const { data } = await api.post('/ai/summarize', { userId: user?.id, messages });
        setMessages(prev => [...prev, { _id: Date.now().toString(), senderId: 'ai', content: `⚡ AI Summary:\n${data.summary}` }]);
      } catch (err) {}
      setNewMessage('');
      setIsAiLoading(false);
      scrollToBottom();
      return;
    }

    try {
      const { data } = await api.post('/super-comm/chat/message', {
        chatId: selectedChat._id,
        senderId: user?.id,
        content: newMessage,
        viewOnce: isViewOnceMode
      })
      
      // If we simulated a viewOnce media
      if (isViewOnceMode) {
        data.attachments = [{ type: 'image', url: 'mock_url' }];
      }

      setMessages([...messages, data])
      setNewMessage('')
      setIsViewOnceMode(false)
      scrollToBottom()
    } catch (err) {
      console.error(err)
    }
  }

  const handleViewOnceClick = async (msgId: string) => {
    try {
      await api.delete(`/super-comm/chat/message/view-once/${msgId}`);
      setMessages(messages.map(m => m._id === msgId ? { ...m, isDeletedEveryone: true, content: '📷 Media viewed', attachments: [] } : m));
    } catch (err) {
      console.error(err);
    }
  }

  const sendVoiceNote = async () => {
    setIsRecording(false)
    setMessages([...messages, { senderId: user?.id, content: 'Voice Message', attachments: [{ type: 'voice', url: '#', length: '0:05' }] }])
    scrollToBottom()
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100);
  }

  const startCall = (isVideo: boolean) => setActiveCall({ isVideo, callerName: selectedChat.name })

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col z-10">
        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold dark:text-white flex items-center gap-2"><Sparkles className="text-blue-500"/> Super Chat</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3].map(i => (
            <div key={i} onClick={() => setSelectedChat({ _id: `chat_${i}`, name: `Group ${i}` })} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">G{i}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold dark:text-white truncate">Group {i}</h3>
                  <span className="text-[10px] text-gray-500">12:45 PM</span>
                </div>
                <p className="text-xs text-gray-500 truncate italic">How are you today?</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-slate-50 dark:bg-slate-900 min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex flex-center flex-col items-center justify-center text-gray-400">
            <Send size={48} className="mb-4 opacity-20" />
            <p>Select a chat to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-4 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 z-30 shadow-sm">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowGroupInfo(true)}>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold group-hover:opacity-80 transition-opacity">G</div>
                <div>
                  <h3 className="font-bold dark:text-white group-hover:underline">{selectedChat.name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
                    {/* Disappearing Messages Indicator */}
                    <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Timer size={10} /> 24h
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-500">
                <button onClick={() => startCall(false)} className="hover:text-blue-500 transition-colors hidden sm:block"><Phone size={20} /></button>
                <button onClick={() => startCall(true)} className="hover:text-blue-500 transition-colors hidden sm:block"><Video size={20} /></button>
                <button onClick={() => setShowGamePanel(!showGamePanel)} className={`p-2 rounded-full transition-colors ${showGamePanel ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                  <Gamepad2 size={20} />
                </button>
                <button onClick={() => setShowGroupInfo(!showGroupInfo)} className="hover:text-blue-500 transition-colors"><MoreVertical size={20} /></button>
              </div>
            </div>

            {/* Engagement Banners Overlay */}
            <div className="relative z-20">
              <EngagementBanners engagements={mockEngagements} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pt-6">
              
              {/* Mock Poll rendering */}
              <div className="flex justify-start">
                <PollCard poll={mockPoll} currentUserId={user?.id || 'user1'} />
              </div>

              {messages.map((msg: any, index: number) => {
                const isMe = msg.senderId === user?.id
                const isAI = msg.senderId === 'ai'

                return (
                  <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : (isAI ? 'justify-center' : 'justify-start')}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] group relative px-4 py-2 rounded-2xl shadow-sm 
                      ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 
                        (isAI ? 'bg-indigo-900 text-white border border-indigo-700 w-full max-w-[90%]' : 'bg-white dark:bg-gray-800 dark:text-white rounded-bl-none border dark:border-gray-700')}`}
                    >
                      {msg.replyTo && (
                        <div className="mb-2 p-2 bg-black/10 rounded-lg text-[10px] border-l-4 border-white/50">
                          Replying to a message...
                        </div>
                      )}
                      
                      {msg.attachments?.[0]?.type === 'voice' ? (
                        <div className="flex items-center gap-3 py-1">
                          <button className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center"><Send size={12} className="ml-1" /></button>
                          <div className="flex-1 h-2 bg-white/30 rounded-full w-24"><div className="h-full w-1/3 bg-white rounded-full"></div></div>
                          <span className="text-xs font-mono">{msg.attachments[0].length}</span>
                        </div>
                      ) : msg.viewOnce && !msg.isDeletedEveryone ? (
                        // Phase AI6: View Once Media Rendering
                        <button onClick={() => handleViewOnceClick(msg._id)} className="flex items-center gap-2 p-4 bg-gray-200 dark:bg-gray-700 rounded-xl text-blue-600 font-bold animate-pulse hover:bg-gray-300 dark:hover:bg-gray-600">
                          <EyeOff size={20} /> View Photo (Once)
                        </button>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {!isAI && (
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {msg.expiryTime && <Timer size={10} className="opacity-50" />}
                          <span className="text-[9px] opacity-70">12:45 PM</span>
                          {isMe && <div className="text-blue-200">{msg.status === 'read' ? <CheckCheck size={12} /> : <Check size={12} />}</div>}
                        </div>
                      )}

                      {/* Reaction Bubble Overlay */}
                      {msg.reactions?.length > 0 && (
                        <div className="absolute -bottom-3 left-2 flex gap-1 z-10">
                          {msg.reactions.map((r: any, idx: number) => (
                            <span key={idx} className="bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5 text-[10px] shadow-sm border dark:border-gray-600">{r.emoji}</span>
                          ))}
                        </div>
                      )}

                      {/* Quick Action Overlay on Hover */}
                      <div className="absolute top-0 right-0 hidden group-hover:flex gap-1 -translate-y-1/2 bg-white dark:bg-gray-700 rounded-full px-2 py-1 shadow-md border dark:border-gray-600 z-10">
                        <Smile size={14} className="text-gray-500 hover:text-yellow-500 cursor-pointer" />
                        <Reply size={14} className="text-gray-500 hover:text-blue-500 cursor-pointer" />
                        <Star size={14} className="text-gray-500 hover:text-yellow-500 cursor-pointer" />
                        <Edit3 size={14} className="text-gray-500 hover:text-green-500 cursor-pointer" />
                        <Trash2 size={14} className="text-gray-500 hover:text-red-500 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )
              })}

              {isAiLoading && (
                <div className="flex justify-center">
                  <div className="bg-indigo-900 text-white px-4 py-2 rounded-2xl flex items-center gap-2 animate-pulse text-sm font-bold">
                    <Bot size={16} /> AI is thinking...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Smart Replies Overlay */}
            {smartReplies.length > 0 && (
              <div className="flex gap-2 p-2 px-4 overflow-x-auto bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md absolute bottom-[72px] w-full z-10 scrollbar-hide">
                <Sparkles size={16} className="text-blue-500 mt-1 flex-shrink-0" />
                {smartReplies.map((reply, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => { setNewMessage(reply); setSmartReplies([]); }} 
                    className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm hover:scale-105 transition-transform"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 relative z-20">
              
              <CommandOverlay type={overlayConfig?.type as any} query={overlayConfig?.query || ''} onSelect={handleCommandSelect} />

              {isRecording ? (
                <div className="flex items-center gap-4 bg-red-50 dark:bg-red-900/20 p-2 rounded-full shadow-inner border border-red-100 dark:border-red-900">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse ml-4"></div>
                  <span className="text-red-500 font-mono tracking-widest text-sm flex-1">00:03</span>
                  <button onClick={() => setIsRecording(false)} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                  <button onClick={sendVoiceNote} className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-lg transition-all active:scale-95"><StopCircle size={20} /></button>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-2 items-center">
                  <button 
                    type="button" 
                    onClick={() => setIsViewOnceMode(!isViewOnceMode)} 
                    className={`p-2 rounded-full transition-colors ${isViewOnceMode ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
                    title="Send View Once Media"
                  >
                    <EyeOff size={20} />
                  </button>
                  <button type="button" className="p-2 text-gray-500 hover:text-blue-500 transition-colors"><ImageIcon size={24} /></button>
                  
                  <input
                    type="text"
                    className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                    placeholder="Type a message or use / command..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  
                  {newMessage.trim() ? (
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-all active:scale-95 flex-shrink-0"><Send size={20} /></button>
                  ) : (
                    <button type="button" onClick={() => setIsRecording(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-all active:scale-95 flex-shrink-0"><Mic size={20} /></button>
                  )}
                </form>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide-out Panels */}
      {showGamePanel && selectedChat && <ChatGamePanel chatId={selectedChat._id} />}
      {showGroupInfo && selectedChat && <GroupInfoPanel groupData={mockGroupData} onClose={() => setShowGroupInfo(false)} />}
      {activeCall && <CallUI isVideo={activeCall.isVideo} callerName={activeCall.callerName} onEndCall={() => setActiveCall(null)} />}
    </div>
  )
}
