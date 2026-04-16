import { useState, useEffect, useRef, useCallback } from 'react'
import { getRoomHistory } from '../../api/messages'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useAuth } from '../../store/authStore'
import { MessageBubble, DateSeparator } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { Button } from '../shared/Button'
import { leaveRoom } from '../../api/rooms'

function isSameDay(a, b) {
  if (!a || !b) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function isSameSender(a, b) {
  return a && b && a.senderUsername === b.senderUsername && a.type !== 'SYSTEM' && b.type !== 'SYSTEM'
}

export function ChatPanel({ room, onLeave }) {
  const { user, token } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typists, setTypists] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimers = useRef({})
  const isTypingRef = useRef(false)
  const typingDebounce = useRef(null)

  const handleNewMessage = useCallback((msg) => {
    if (msg.roomId !== room.id) return
    setMessages(prev => {
      // deduplicate by content+sender+time window (Redis pub/sub may echo)
      return [...prev, msg]
    })
  }, [room.id])

  const handleTyping = useCallback((event) => {
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
  }, [user?.username])

  const { joinRoom, sendMessage, sendTyping, leaveRoom: wsLeave } = useWebSocket({
    token,
    onMessage: handleNewMessage,
    onTyping: handleTyping,
    roomId: room.id,
  })

  // Load history and subscribe when room changes
  useEffect(() => {
    setMessages([])
    setTypists([])
    setLoadingHistory(true)
    setInput('')

    getRoomHistory(room.id).then(history => {
      setMessages(history)
      setLoadingHistory(false)
    }).catch(() => setLoadingHistory(false))

    joinRoom(room.id)
    inputRef.current?.focus()

    return () => {
      wsLeave(room.id)
      setTypists([])
    }
  }, [room.id])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typists])

  const handleSend = (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return

    sendMessage(room.id, text)
    setInput('')
    isTypingRef.current = false
    sendTyping(room.id, false)
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)

    if (!isTypingRef.current) {
      isTypingRef.current = true
      sendTyping(room.id, true)
    }

    clearTimeout(typingDebounce.current)
    typingDebounce.current = setTimeout(() => {
      isTypingRef.current = false
      sendTyping(room.id, false)
    }, 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleLeave = async () => {
    try { await leaveRoom(room.id) } catch {}
    wsLeave(room.id)
    onLeave?.()
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Room header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-surface-1/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted font-mono text-sm">#</span>
          <h1 className="text-sm font-semibold text-ink">{room.name}</h1>
          {room.description && (
            <>
              <span className="text-border-strong">·</span>
              <p className="text-xs text-ink-muted truncate max-w-xs">{room.description}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs text-ink-faint">{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}</span>
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
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-pulse-dot" style={{ animationDelay: `${i * 0.16}s` }} />
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
              const prev = messages[i - 1]
              const showDate = !isSameDay(prev?.sentAt, msg.sentAt)
              const showAvatar = !isSameSender(prev, msg) || showDate
              const isMine = msg.senderUsername === user?.username

              return (
                <div key={`${msg.id || i}-${msg.sentAt}`}>
                  {showDate && <DateSeparator timestamp={msg.sentAt} />}
                  <MessageBubble message={msg} showAvatar={showAvatar} isMine={isMine} />
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Typing indicator */}
      <TypingIndicator typists={typists} />

      {/* Input */}
      <div className="px-4 pb-4 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-surface-2 border border-border rounded-lg px-3 py-2.5 focus-within:border-border-strong transition-colors">
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
        <p className="text-2xs text-ink-faint mt-1 text-right">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}
