import { useState, useEffect, useRef, useCallback } from 'react'
import { getRoomHistory } from '../../api/messages'
import { leaveRoom as apiLeaveRoom, getRoomMembers } from '../../api/rooms'
import { useAuth } from '../../store/authStore'
import { MessageBubble, DateSeparator } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { MembersPanel } from './MembersPanel'
import { SearchPanel } from './SearchPanel'
import { PinnedMessagesPanel } from './PinnedMessagesPanel'
import { MentionDropdown, detectMentionTrigger } from './MentionDropdown'
import { openDm } from '../../api/users'
import { RoomSettingsModal } from '../rooms/RoomSettingsModal'
import { Button } from '../shared/Button'
import { useAutoResize } from '../../hooks/useAutoResize'
import { toast } from '../shared/Toast'

const PAGE_SIZE = 50

function isSameDay(a, b) {
  if (!a || !b) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function isSameSender(a, b) {
  return a && b && a.senderUsername === b.senderUsername && a.type !== 'SYSTEM' && b.type !== 'SYSTEM'
}

export function ChatPanel({ room, ws, onMessageRef, onTypingRef, onLeave, onToggleSidebar, onRoomUpdated, onRoomDeleted, onSelectRoom, isOnline }) {
  const { user } = useAuth()
  const [messages, setMessages]       = useState([])
  const [input, setInput]             = useState('')
  const [typists, setTypists]         = useState([])
  const [loadingHistory, setLoading]  = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [page, setPage]               = useState(0)
  const [showMembers, setShowMembers] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSearch, setShowSearch]   = useState(false)
  const [showPins, setShowPins]       = useState(false)
  const [pinCount, setPinCount]       = useState(0)
  const [replyTo, setReplyTo]         = useState(null)
  const [members, setMembers]         = useState([])
  const [mention, setMention]         = useState(null)   // { query, start, end }
  const [mentionIdx, setMentionIdx]   = useState(0)
  const [atBottom, setAtBottom]       = useState(true)
  const [newMsgCount, setNewMsgCount] = useState(0)

  const isOwner = room.createdBy === user?.username

  const bottomRef      = useRef(null)
  const scrollRef      = useRef(null)   // the messages scroll container
  const inputRef       = useRef(null)
  const typingTimers   = useRef({})
  const isTypingRef    = useRef(false)
  const typingDebounce = useRef(null)
  const isNearBottom   = useRef(true)

  useAutoResize(inputRef, input)

  // Wire handlers into shared refs
  useEffect(() => {
    onMessageRef.current = (msg) => {
      if (msg.roomId !== room.id) return
      if (msg.eventType === 'EDITED') {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: msg.content, editedAt: msg.editedAt } : m))
      } else if (msg.eventType === 'DELETED') {
        setMessages(prev => prev.filter(m => m.id !== msg.id))
      } else if (msg.eventType === 'REACTION_UPDATE') {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: msg.reactions } : m))
      } else if (msg.eventType === 'PIN_UPDATE') {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: msg.pinned } : m))
        setPinCount(prev => msg.pinned ? prev + 1 : Math.max(0, prev - 1))
      } else {
        setMessages(prev => [...prev, msg])
        if (!isNearBottom.current) setNewMsgCount(c => c + 1)
      }
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
    return () => { onMessageRef.current = null; onTypingRef.current = null }
  }, [room.id, user?.username, onMessageRef, onTypingRef])

  // Load members for @mention autocomplete
  useEffect(() => {
    getRoomMembers(room.id).then(setMembers).catch(() => {})
  }, [room.id])

  // Load initial history + join room
  useEffect(() => {
    setMessages([])
    setTypists([])
    setLoading(true)
    setHasMore(true)
    setPage(0)
    setInput('')
    setAtBottom(true)
    setNewMsgCount(0)

    getRoomHistory(room.id, 0, PAGE_SIZE)
      .then(history => {
        setMessages(history)
        setHasMore(history.length === PAGE_SIZE)
      })
      .catch(() => toast('Failed to load message history'))
      .finally(() => setLoading(false))

    ws.joinRoom(room.id)
    inputRef.current?.focus()
    return () => ws.leaveRoom(room.id)
  }, [room.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    isNearBottom.current = near
    setAtBottom(near)
    if (near) setNewMsgCount(0)

    if (el.scrollTop < 120 && hasMore && !loadingMore && !loadingHistory) {
      loadOlderMessages()
    }
  }, [hasMore, loadingMore, loadingHistory]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const nextPage = page + 1
    const scrollEl = scrollRef.current
    // Capture scroll height before prepend so we can restore position
    const prevHeight = scrollEl?.scrollHeight ?? 0

    try {
      const older = await getRoomHistory(room.id, nextPage, PAGE_SIZE)
      if (older.length === 0) {
        setHasMore(false)
        return
      }
      setMessages(prev => [...older, ...prev])
      setPage(nextPage)
      setHasMore(older.length === PAGE_SIZE)

      // Restore scroll position so viewport doesn't jump
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight - prevHeight
        }
      })
    } catch {
      toast('Failed to load older messages')
    } finally {
      setLoadingMore(false)
    }
  }, [room.id, page, loadingMore, hasMore])

  // Auto-scroll to bottom only when user is already near the bottom
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: messages.length <= PAGE_SIZE ? 'instant' : 'smooth' })
    }
  }, [messages.length])

  // Always scroll on new typists (they're at the bottom)
  useEffect(() => {
    if (isNearBottom.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [typists.length])

  const handleSend = useCallback((e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return
    try {
      ws.sendMessage(room.id, text, replyTo?.id ?? null)
      setInput('')
      setReplyTo(null)
      setMention(null)
      isNearBottom.current = true
      isTypingRef.current = false
      ws.sendTyping(room.id, false)
    } catch {
      toast('Failed to send — check your connection')
    }
  }, [input, room.id, ws, replyTo])

  const handleInputChange = (e) => {
    const val = e.target.value
    setInput(val)

    // @mention detection
    const cursor = e.target.selectionStart
    const trigger = detectMentionTrigger(val, cursor)
    setMention(trigger)
    setMentionIdx(0)

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

  const filteredMembers = mention
    ? members.filter(m =>
        m.username.toLowerCase().startsWith(mention.query.toLowerCase()) ||
        (m.displayName && m.displayName.toLowerCase().startsWith(mention.query.toLowerCase()))
      ).slice(0, 6)
    : []

  const completeMention = (member) => {
    if (!mention) return
    const before = input.slice(0, mention.start)
    const after  = input.slice(mention.end)
    const completed = `${before}@${member.username} ${after}`
    setInput(completed)
    setMention(null)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (mention && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, filteredMembers.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Tab' || (e.key === 'Enter' && mention)) {
        e.preventDefault()
        completeMention(filteredMembers[mentionIdx])
        return
      }
      if (e.key === 'Escape') { setMention(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setNewMsgCount(0)
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
            <button onClick={onToggleSidebar} className="md:hidden text-ink-muted hover:text-ink mr-1 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            {room.type !== 'DIRECT' && <span className="text-ink-muted font-mono text-sm shrink-0">#</span>}
            <h1 className="text-sm font-semibold text-ink">
              {room.type === 'DIRECT'
                ? (room.otherDisplayName || room.otherUsername || room.name)
                : room.name}
            </h1>
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
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="hidden sm:inline">{room.memberCount}</span>
            </button>
            <button
              onClick={() => setShowPins(v => !v)}
              className={`relative flex items-center gap-1 text-ink-faint hover:text-ink transition-colors px-2 py-1 rounded hover:bg-surface-3 ${showPins ? 'text-accent bg-accent-subtle' : ''}`}
              title="Pinned messages"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
              </svg>
              {pinCount > 0 && (
                <span className="text-2xs font-semibold text-accent">{pinCount}</span>
              )}
            </button>
            <button
              onClick={() => setShowSearch(v => !v)}
              className={`text-ink-faint hover:text-ink transition-colors px-2 py-1 rounded hover:bg-surface-3 ${showSearch ? 'text-accent bg-accent-subtle' : ''}`}
              title="Search messages"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            {isOwner && (
              <button
                onClick={() => setShowSettings(true)}
                className="text-ink-faint hover:text-ink transition-colors px-2 py-1 rounded hover:bg-surface-3"
                title="Room settings"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            )}
            {room.type !== 'DIRECT' && (
              <button
                onClick={handleLeave}
                className="text-xs text-ink-faint hover:text-danger transition-colors px-2 py-1 rounded hover:bg-danger-subtle"
              >
                leave
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-4 flex flex-col">

          {/* Load-more indicator at top */}
          {loadingMore && (
            <div className="flex justify-center py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1 h-1 rounded-full bg-ink-faint animate-pulse-dot" style={{ animationDelay: `${i * 0.16}s` }} />
                ))}
              </div>
            </div>
          )}

          {!hasMore && messages.length > 0 && (
            <p className="text-center text-2xs text-ink-faint py-3">Beginning of #{room.name}</p>
          )}

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
                const prev     = messages[i - 1]
                const showDate = !isSameDay(prev?.sentAt, msg.sentAt)
                const showAv   = !isSameSender(prev, msg) || showDate
                const isMine   = msg.senderUsername === user?.username

                return (
                  <div key={`${msg.id ?? i}-${i}`}>
                    {showDate && <DateSeparator timestamp={msg.sentAt} />}
                    <MessageBubble message={msg} showAvatar={showAv} isMine={isMine} currentUsername={user?.username} onReply={setReplyTo} roomId={room.id} />
                  </div>
                )
              })}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Scroll-to-bottom FAB */}
        {!atBottom && (
          <div className="flex justify-center pb-1 shrink-0">
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-surface-3 border border-border rounded-full text-ink-muted hover:text-ink hover:border-border-strong transition-colors shadow-md"
            >
              {newMsgCount > 0 && (
                <span className="text-2xs font-semibold bg-accent text-surface rounded-full px-1.5 py-0.5 leading-none">
                  {newMsgCount}
                </span>
              )}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              <span>scroll to bottom</span>
            </button>
          </div>
        )}

        {/* Typing indicator */}
        <TypingIndicator typists={typists} />

        {/* Input bar */}
        <div className="px-4 pb-4 shrink-0 relative">
          {mention && filteredMembers.length > 0 && (
            <MentionDropdown
              members={filteredMembers}
              filter={mention.query}
              onSelect={completeMention}
              activeIndex={mentionIdx}
            />
          )}
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1 bg-surface-2 border border-border border-b-0 rounded-t-lg text-xs text-ink-muted">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-accent">
                <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
              </svg>
              <span className="truncate flex-1">
                <span className="font-medium text-ink">{replyTo.senderDisplayName || replyTo.senderUsername}</span>
                {': '}
                <span className="text-ink-faint">{replyTo.content?.slice(0, 80)}{replyTo.content?.length > 80 ? '…' : ''}</span>
              </span>
              <button onClick={() => setReplyTo(null)} className="shrink-0 hover:text-ink transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
          <form
            onSubmit={handleSend}
            className={`flex items-end gap-2 bg-surface-2 border border-border focus-within:border-border-strong transition-colors px-3 py-2.5 ${replyTo ? 'rounded-b-lg rounded-t-none border-t-0' : 'rounded-lg'}`}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={room.type === 'DIRECT'
                ? `Message ${room.otherDisplayName || room.otherUsername || ''}`
                : `Message #${room.name}`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-ink placeholder-ink-faint font-mono resize-none focus:outline-none leading-relaxed overflow-hidden"
              style={{ minHeight: '1.5rem', maxHeight: '8rem' }}
            />
            <Button type="submit" size="sm" disabled={!input.trim()} className="shrink-0 self-end">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m22 2-7 20-4-9-9-4 20-7z"/>
              </svg>
            </Button>
          </form>
          <p className="text-2xs text-ink-faint mt-1 text-right">↵ send · ⇧↵ newline</p>
        </div>

      </div>{/* end flex-col */}

      {showMembers && (
        <MembersPanel
          roomId={room.id}
          isOnline={isOnline}
          onClose={() => setShowMembers(false)}
          onOpenDm={async (username) => {
            try {
              const dmRoom = await openDm(username)
              onSelectRoom?.(dmRoom)
            } catch {}
            setShowMembers(false)
          }}
        />
      )}

      {showSearch && (
        <SearchPanel roomId={room.id} roomName={room.name} onClose={() => setShowSearch(false)} />
      )}

      {showPins && (
        <PinnedMessagesPanel
          roomId={room.id}
          onClose={() => setShowPins(false)}
          onUnpin={() => setPinCount(c => Math.max(0, c - 1))}
        />
      )}

      {showSettings && (
        <RoomSettingsModal
          room={room}
          onClose={() => setShowSettings(false)}
          onUpdated={(updated) => { onRoomUpdated?.(updated); setShowSettings(false) }}
          onDeleted={(id) => { onRoomDeleted?.(id) }}
        />
      )}
    </div>
  )
}
