import { useState, useCallback, useRef, useEffect } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ChatPanel } from '../components/chat/ChatPanel'
import { EmptyState } from '../components/chat/EmptyState'
import { KeyboardShortcutsModal } from '../components/shared/KeyboardShortcutsModal'
import { useWebSocket } from '../hooks/useWebSocket'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../store/authStore'

function ReconnectBanner({ connected, wasConnected }) {
  const [showReconnected, setShowReconnected] = useState(false)
  const prevRef = useRef(connected)

  useEffect(() => {
    if (!prevRef.current && connected && wasConnected) {
      setShowReconnected(true)
      const t = setTimeout(() => setShowReconnected(false), 2500)
      return () => clearTimeout(t)
    }
    prevRef.current = connected
  }, [connected, wasConnected])

  if (connected && !showReconnected) return null

  return (
    <div className={`fixed top-0 inset-x-0 z-50 flex justify-center py-1.5 text-2xs font-medium transition-colors ${
      connected ? 'bg-accent/20 text-accent' : 'bg-danger-subtle text-danger border-b border-danger/20'
    }`}>
      {connected ? (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
          Reconnected
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block animate-pulse" />
          Connection lost — reconnecting…
        </span>
      )}
    </div>
  )
}

export function ChatPage() {
  const { token, user } = useAuth()
  const [activeRoom, setActiveRoom]     = useState(null)
  const [unread, setUnread]             = useState({})
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [sidebarKey, setSidebarKey]     = useState(0)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [wasConnected, setWasConnected] = useState(false)

  const onMessageRef = useRef(null)
  const onTypingRef  = useRef(null)
  const activeRoomId = useRef(null)
  const roomsRef     = useRef({})  // roomId → room (for notification room name)

  const { notify, soundEnabled, toggleSound } = useNotifications(user?.username)

  // Tab title
  useEffect(() => {
    const total = Object.values(unread).reduce((s, n) => s + n, 0)
    document.title = total > 0 ? `(${total}) chatflow` : 'chatflow'
  }, [unread])

  // Global ? shortcut for keyboard help
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '?' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        setShowShortcuts(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleMessage = useCallback((msg) => {
    onMessageRef.current?.(msg)
    if (msg.type !== 'SYSTEM' && !msg.eventType && msg.roomId !== activeRoomId.current) {
      setUnread(prev => ({ ...prev, [msg.roomId]: (prev[msg.roomId] ?? 0) + 1 }))
      const roomName = roomsRef.current[msg.roomId]?.name ?? `room ${msg.roomId}`
      notify(msg, roomName)
    }
  }, [notify])

  const handleTyping = useCallback((evt) => onTypingRef.current?.(evt), [])

  const ws = useWebSocket({ token, onMessage: handleMessage, onTyping: handleTyping })

  // Track wasConnected for reconnect banner
  useEffect(() => {
    if (ws.connected) setWasConnected(true)
  }, [ws.connected])

  const handleSelectRoom = useCallback((room) => {
    activeRoomId.current = room.id
    roomsRef.current[room.id] = room
    setActiveRoom(room)
    setUnread(prev => { const next = { ...prev }; delete next[room.id]; return next })
  }, [])

  const handleLeave = useCallback(() => {
    activeRoomId.current = null
    setActiveRoom(null)
  }, [])

  const handleRoomUpdated = useCallback((updated) => {
    roomsRef.current[updated.id] = updated
    setActiveRoom(updated)
    setSidebarKey(k => k + 1)
  }, [])

  const handleRoomDeleted = useCallback((roomId) => {
    delete roomsRef.current[roomId]
    if (activeRoomId.current === roomId) {
      activeRoomId.current = null
      setActiveRoom(null)
    }
    setUnread(prev => { const next = { ...prev }; delete next[roomId]; return next })
    setSidebarKey(k => k + 1)
  }, [])

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      <ReconnectBanner connected={ws.connected} wasConnected={wasConnected} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 md:z-auto h-full transition-transform duration-200`}>
        <Sidebar
          key={sidebarKey}
          activeRoomId={activeRoom?.id}
          onSelectRoom={(room) => { handleSelectRoom(room); setSidebarOpen(false) }}
          wsConnected={ws.connected}
          unread={unread}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {activeRoom ? (
          <ChatPanel
            key={activeRoom.id}
            room={activeRoom}
            ws={ws}
            onMessageRef={onMessageRef}
            onTypingRef={onTypingRef}
            onLeave={handleLeave}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            onRoomUpdated={handleRoomUpdated}
            onRoomDeleted={handleRoomDeleted}
          />
        ) : (
          <EmptyState onToggleSidebar={() => setSidebarOpen(v => !v)} />
        )}
      </main>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}
