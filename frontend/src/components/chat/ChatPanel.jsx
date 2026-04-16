import { useState, useEffect, useRef, useCallback } from 'react'
import { getRoomHistory } from '../../api/messages'
import { leaveRoom as apiLeaveRoom } from '../../api/rooms'
import { useAuth } from '../../store/authStore'
import { MessageBubble, DateSeparator } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { MembersPanel } from './MembersPanel'
import { Button } from '../shared/Button'

function isSameDay(a, b) {
  if (!a || !b) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function isSameSender(a, b) {
  return a && b && a.senderUsername === b.senderUsername && a.type !== 'SYSTEM' && b.type !== 'SYSTEM'
}

export function ChatPanel({ room, ws, onMessageRef, onTypingRef, onLeave, onToggleSidebar }) {
  const { user } = useAuth()
  const [messages, setMessages]       = useState([])
  const [input, setInput]             = useState('')
  const [typists, setTypists]         = useState([])
  const [loadingHistory, setLoading]  = useState(true)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef      = useRef(null)
  const inputRef       = useRef(null)
  const typingTimers   = useRef({})
  const isTypingRef    = useRef(false)
  const typingDebounce = useRef(null)

  // Wire up handlers into the shared refs so the WS hook gets them
  useEffect(() => {
    onMessageRef.current = (msg) => {
      if (msg.roomId !== room.id) return
      setMessages(prev => [...prev, msg])
    }
    onTypingRef.current = (event) => {
      if (event.username === user?.username) return
      const key = event.username
      if (event.typing) {
        setTypists(prev => prev.find(t => t.username === key) ? prev : [...prev, event])
        clearTimeout(typingTimers.current[key])
        typingTimers.current[key] = setTimeout(() => {
          setTypists(prev => prev.filter(t => t.username !== key))
        }, 3000)
      } else {
        clearTimeout(typingTimers.current[key])
        setTypists(prev => prev.filter(t => t.username !== key))
      }
    }

    return () => {
      onMessageRef.current = null
      onTypingRef.current  = null
    }
  }, [room.id, user?.username, onMessageRef, onTypingRef])

  // Load history + join WS room
  useEffect(() => {
    setMessages([])
    setTypists([])
    setLoading(true)
    setInput('')

    getRoomHistory(room.id)
      .then(history => setMessages(history))
      .catch(() => {})
      .finally(() => setLoading(false))

    ws.joinRoom(room.id)
    inputRef.current?.focus()

    return () => ws.leaveRoom(room.id)
  }, [room.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typists.length])

  const handleSend = useCallback((e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return
    ws.sendMessage(room.id, text)
    setInput('')
    isTypingRef.current = false
    ws.sendTyping(room.id, false)
  }, [input, room.id, ws])

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!isTypingRef.current) {
      isTypingRef.current = true
      ws.sendTyping(room.id, true)
    }
    clearTimeout(typingDebounce.current)
    typingDebounce.current = setTimeout(() => {
      isTypingRef.current = false
      ws.sendTyping(room.id, false)
    }, 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleLeave = async () => {
    try { await apiLeaveRoom(room.id) } catch {}
    ws.leaveRoom(room.id)
    onLeave?.()
  }

  return (
    <div className="flex h-full bg-surface overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-surface-1/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile: hamburger to open sidebar */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-ink-muted hover:text-ink mr-1 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <span className="text-ink-muted font-mono text-sm shrink-0">#</span>
          <h1 className="text-sm font-semibold text-ink">{room.name}</h1>
          {room.description && (
            <>
              <span className="text-border-strong shrink-0 hidden sm:inline">·</span>
              <p className="text-xs text-ink-muted truncate hidden sm:block">{room.description}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMembers(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
              showMembers ? 'text-accent bg-accent-subtle' : 'text-ink-faint hover:text-ink hover:bg-surface-3'
            }`}
            title="Toggle members"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="hidden sm:inline">{room.memberCount}</span>
          </button>
          <button
            onClick={handleLeave}
            className="text-xs text-ink-faint hover:text-danger transition-colors px-2 py-1 rounded hover:bg-danger-subtle"
          >
            leave
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        {loadingHistory ? (
          <div className="flex items-center justify-center flex-1">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-pulse-dot"
                  style={{ animationDelay: `${i * 0.16}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-2">
                <span className="text-3xl">💬</span>
                <p className="text-sm text-ink-muted">No messages yet. Say hello!</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const prev     = messages[i - 1]
              const showDate = !isSameDay(prev?.sentAt, msg.sentAt)
              const showAv   = !isSameSender(prev, msg) || showDate
              const isMine   = msg.senderUsername === user?.username

              return (
                <div key={`${msg.id ?? i}-${i}`}>
                  {showDate && <DateSeparator timestamp={msg.sentAt} />}
                  <MessageBubble message={msg} showAvatar={showAv} isMine={isMine} />
                </div>
              )
            })}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Typing indicator */}
      <TypingIndicator typists={typists} />

      {/* Input bar */}
      <div className="px-4 pb-4 shrink-0">
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2.5 focus-within:border-border-strong transition-colors"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${room.name}`}
            rows={1}
            className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint font-mono resize-none focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '1.5rem' }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim()}
            className="shrink-0 self-end"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m22 2-7 20-4-9-9-4 20-7z"/>
            </svg>
          </Button>
        </form>
        <p className="text-2xs text-ink-faint mt-1 text-right">↵ send · ⇧↵ newline</p>
      </div>
      </div>{/* end flex-col */}

      {showMembers && (
        <MembersPanel roomId={room.id} onClose={() => setShowMembers(false)} />
      )}
    </div>
  )
}
