'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import useAuthStore from '@/store/useAuthStore'
import { getGameLeaderboard, getPublicRooms, createGameRoom, joinGameRoom } from '@/services/apiServices'
import { Gamepad2, Send, X, RotateCcw, Trophy, Users, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

// ─── Tic Tac Toe ─────────────────────────────────────────────────────────────
function TicTacToe({ onClose, chatMsgs, onSendChat }: { onClose: () => void; chatMsgs: any[]; onSendChat: (t: string) => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')

  const checkWinner = (b: (string | null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (const [a,b2,c] of lines) if (b[a] && b[a] === b[b2] && b[a] === b[c]) return b[a]
    return b.every(Boolean) ? 'Draw' : null
  }

  const handleClick = (i: number) => {
    if (board[i] || winner) return
    const nb = [...board]; nb[i] = xIsNext ? 'X' : 'O'
    setBoard(nb); setXIsNext(!xIsNext)
    const w = checkWinner(nb); if (w) setWinner(w)
  }

  const reset = () => { setBoard(Array(9).fill(null)); setXIsNext(true); setWinner(null) }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <h2 className="font-black text-lg dark:text-white flex items-center gap-2"><Gamepad2 size={18} className="text-blue-500"/> Tic-Tac-Toe</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><X size={16}/></button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Game board */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          {winner ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">{winner === 'Draw' ? '🤝' : '🏆'}</div>
              <p className="font-black text-xl dark:text-white">{winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}</p>
              <button onClick={reset} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm active:scale-95 transition-all">
                <RotateCcw size={14}/> Play Again
              </button>
            </div>
          ) : (
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{xIsNext ? 'X' : 'O'}'s turn</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {board.map((cell, i) => (
              <button key={i} onClick={() => handleClick(i)}
                className={clsx('w-20 h-20 rounded-2xl border-2 text-3xl font-black flex items-center justify-center transition-all active:scale-90',
                  cell === 'X' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600' :
                  cell === 'O' ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-400 text-pink-600' :
                  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300')}>
                {cell}
              </button>
            ))}
          </div>
        </div>
        {/* Mini chat */}
        <div className="w-48 border-l dark:border-gray-800 flex flex-col">
          <div className="p-2 border-b dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Game Chat</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {chatMsgs.map((m, i) => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl px-2.5 py-1.5 text-xs dark:text-white">{m.text}</div>)}
          </div>
          <div className="p-2 border-t dark:border-gray-800 flex gap-1">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { onSendChat(chatInput); setChatInput('') } }}
              placeholder="Chat..." className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-1.5 text-xs dark:text-white outline-none"/>
            <button onClick={() => { if (chatInput.trim()) { onSendChat(chatInput); setChatInput('') } }}
              className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Send size={11}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Word Guess ───────────────────────────────────────────────────────────────
const WORDS = ['APPLE', 'MANGO', 'TIGER', 'OCEAN', 'FLAME', 'CLOUD', 'MUSIC', 'DANCE', 'PIZZA', 'HAPPY']

function WordGuess({ onClose, chatMsgs, onSendChat }: { onClose: () => void; chatMsgs: any[]; onSendChat: (t: string) => void }) {
  const [word] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)])
  const [guesses, setGuesses] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [won, setWon] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const maxGuesses = 6

  const submit = () => {
    if (current.length !== 5 || won || guesses.length >= maxGuesses) return
    const g = current.toUpperCase()
    const ng = [...guesses, g]
    setGuesses(ng)
    setCurrent('')
    if (g === word) setWon(true)
  }

  const getLetterColor = (letter: string, pos: number, guess: string) => {
    if (word[pos] === letter) return 'bg-green-500 text-white border-green-500'
    if (word.includes(letter)) return 'bg-yellow-500 text-white border-yellow-500'
    return 'bg-gray-400 text-white border-gray-400'
  }

  const lost = !won && guesses.length >= maxGuesses

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <h2 className="font-black text-lg dark:text-white flex items-center gap-2"><Gamepad2 size={18} className="text-green-500"/> Word Guess</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><X size={16}/></button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
          {(won || lost) && (
            <div className="text-center space-y-2 mb-2">
              <p className="text-2xl">{won ? '🎉' : '😢'}</p>
              <p className="font-black dark:text-white">{won ? 'You got it!' : `Word was: ${word}`}</p>
            </div>
          )}
          {/* Previous guesses */}
          {guesses.map((g, gi) => (
            <div key={gi} className="flex gap-1.5">
              {g.split('').map((l, li) => (
                <div key={li} className={clsx('w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-sm', getLetterColor(l, li, g))}>
                  {l}
                </div>
              ))}
            </div>
          ))}
          {/* Empty rows */}
          {!won && !lost && Array(maxGuesses - guesses.length).fill(null).map((_, i) => (
            <div key={i} className="flex gap-1.5">
              {Array(5).fill(null).map((_, j) => (
                <div key={j} className={clsx('w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-sm dark:text-white',
                  i === 0 ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700')}>
                  {i === 0 ? current[j] || '' : ''}
                </div>
              ))}
            </div>
          ))}
          {!won && !lost && (
            <div className="flex gap-2 mt-2">
              <input value={current} onChange={e => setCurrent(e.target.value.slice(0, 5))} onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="5-letter word" maxLength={5}
                className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none uppercase font-black tracking-widest w-36 text-center"/>
              <button onClick={submit} disabled={current.length !== 5}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 active:scale-95 transition-all">
                Guess
              </button>
            </div>
          )}
        </div>
        {/* Mini chat */}
        <div className="w-48 border-l dark:border-gray-800 flex flex-col">
          <div className="p-2 border-b dark:border-gray-800"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Game Chat</p></div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {chatMsgs.map((m, i) => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl px-2.5 py-1.5 text-xs dark:text-white">{m.text}</div>)}
          </div>
          <div className="p-2 border-t dark:border-gray-800 flex gap-1">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { onSendChat(chatInput); setChatInput('') } }}
              placeholder="Chat..." className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-2 py-1.5 text-xs dark:text-white outline-none"/>
            <button onClick={() => { if (chatInput.trim()) { onSendChat(chatInput); setChatInput('') } }}
              className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white"><Send size={11}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Games Page ──────────────────────────────────────────────────────────
const GAMES = [
  { id: 'ttt',   name: 'Tic-Tac-Toe', emoji: '⭕', desc: '2 players · Classic',    color: 'from-blue-500 to-indigo-600' },
  { id: 'word',  name: 'Word Guess',  emoji: '🔤', desc: '1 player · Wordle-style', color: 'from-green-500 to-emerald-600' },
  { id: 'quiz',  name: 'Quick Quiz',  emoji: '🧠', desc: 'Coming soon',             color: 'from-purple-500 to-pink-600', disabled: true },
  { id: 'chess', name: 'Chess',       emoji: '♟️', desc: 'Coming soon',             color: 'from-gray-600 to-gray-800', disabled: true },
]

export default function GamesPage() {
  const { user } = useAuthStore()
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'rooms'>('games')
  const [chatMsgs, setChatMsgs] = useState<{ text: string; mine: boolean }[]>([
    { text: '🎮 Game started! Good luck!', mine: false }
  ])

  const { data: leaderboardRes } = useQuery({
    queryKey: ['game-leaderboard'],
    queryFn: async () => {
      try { const res = await getGameLeaderboard(); return res?.data || [] } catch { return [] }
    },
    enabled: activeTab === 'leaderboard',
  })

  const { data: roomsRes } = useQuery({
    queryKey: ['public-rooms'],
    queryFn: async () => {
      try { const res = await getPublicRooms(); return res?.data || [] } catch { return [] }
    },
    enabled: activeTab === 'rooms',
  })

  const leaderboard = leaderboardRes || []
  const rooms = roomsRes || []

  const createRoomMutation = useMutation({
    mutationFn: (data: any) => createGameRoom(data),
    onSuccess: (res: any) => {
      const room = res?.data
      if (room?.roomCode) alert(`Room created! Code: ${room.roomCode}`)
    },
  })

  const sendChat = (text: string) => {
    setChatMsgs(prev => [...prev, { text, mine: true }])
    setTimeout(() => {
      const replies = ['Nice move! 😄', 'Hmm, interesting...', 'GG!', 'You\'re good!', '🔥']
      setChatMsgs(prev => [...prev, { text: replies[Math.floor(Math.random() * replies.length)], mine: false }])
    }, 1000)
  }

  if (activeGame) return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {activeGame === 'ttt' && <TicTacToe onClose={() => setActiveGame(null)} chatMsgs={chatMsgs} onSendChat={sendChat}/>}
      {activeGame === 'word' && <WordGuess onClose={() => setActiveGame(null)} chatMsgs={chatMsgs} onSendChat={sendChat}/>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      <div className="px-5 py-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-20 flex items-center gap-3">
        <Link href="/apps" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl"><ChevronLeft size={18} className="dark:text-white"/></Link>
        <h1 className="text-xl font-black dark:text-white flex-1">Games</h1>
        {activeTab === 'rooms' && (
          <button
            onClick={() => createRoomMutation.mutate({ host: user?.id, hostName: user?.name || 'Player', gameType: 'trivia' })}
            disabled={createRoomMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            {createRoomMutation.isPending ? '...' : '+ Room'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        {(['games', 'leaderboard', 'rooms'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'games' && (
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Play with friends or random opponents. Every game has a mini chat!</p>
          <div className="grid grid-cols-2 gap-4">
            {GAMES.map(g => (
              <button key={g.id} onClick={() => !g.disabled && setActiveGame(g.id)} disabled={g.disabled}
                className={clsx('relative bg-white dark:bg-gray-900 rounded-[2rem] p-5 border dark:border-gray-800 shadow-sm text-left transition-all',
                  g.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:border-blue-300 active:scale-95')}>
                <div className={clsx('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl mb-3', g.color)}>
                  {g.emoji}
                </div>
                <p className="font-black text-sm dark:text-white">{g.name}</p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">{g.desc}</p>
                {!g.disabled && (
                  <div className="mt-3 flex items-center gap-1 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                    <Users size={10}/> Play Now
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="p-5 space-y-3">
          <h2 className="font-black text-sm dark:text-white uppercase tracking-widest text-gray-400">Global Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Trophy size={40} className="mx-auto mb-3 text-gray-300" />
              Play games to appear on the leaderboard!
            </div>
          ) : leaderboard.map((entry: any, i: number) => (
            <div key={entry._id || i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 flex items-center gap-4">
              <span className={`text-lg font-black ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                #{i + 1}
              </span>
              <img src={`https://i.pravatar.cc/40?u=${entry.userId}`} className="w-10 h-10 rounded-xl" alt="" />
              <div className="flex-1">
                <p className="font-bold text-sm dark:text-white">{entry.userName || `Player ${i+1}`}</p>
                <p className="text-xs text-gray-400">{entry.wins || 0} wins · {entry.totalScore || 0} pts</p>
              </div>
              <Trophy size={16} className={i < 3 ? 'text-yellow-500' : 'text-gray-300'} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="p-5 space-y-3">
          <h2 className="font-black text-sm dark:text-white uppercase tracking-widest text-gray-400">Public Rooms</h2>
          {rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 text-gray-300" />
              No open rooms. Create one to invite friends!
            </div>
          ) : rooms.map((room: any) => (
            <div key={room._id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border dark:border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-black text-lg">
                {room.roomCode?.slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm dark:text-white">{room.hostName}'s Room</p>
                <p className="text-xs text-gray-400 capitalize">{room.gameType} · {room.players?.length || 1}/{room.settings?.maxPlayers || 4} players</p>
              </div>
              <button
                onClick={() => joinGameRoom(room.roomCode, user?.id || '', user?.name || 'Player')}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Join
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
