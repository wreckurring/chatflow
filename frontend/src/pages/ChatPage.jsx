import { useState, useCallback, useRef, useEffect } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ChatPanel } from '../components/chat/ChatPanel'
import { EmptyState } from '../components/chat/EmptyState'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../store/authStore'

export function ChatPage() {
  const { token } = useAuth()
  const [activeRoom, setActiveRoom]   = useState(null)
  const [unread, setUnread]           = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarKey, setSidebarKey]   = useState(0) // force sidebar refresh on room delete

  const onMessageRef = useRef(null)
  const onTypingRef  = useRef(null)
  const activeRoomId = useRef(null)

  // Update tab title with total unread count
  useEffect(() => {
    const total = Object.values(unread).reduce((s, n) => s + n, 0)
    document.title = total > 0 ? `(${total}) chatflow` : 'chatflow'
  }, [unread])

  const handleMessage = useCallback((msg) => {
    onMessageRef.current?.(msg)
    if (msg.type !== 'SYSTEM' && !msg.eventType && msg.roomId !== activeRoomId.current) {
      setUnread(prev => ({ ...prev, [msg.roomId]: (prev[msg.roomId] ?? 0) + 1 }))
    }
  }, [])

  const handleTyping = useCallback((evt) => onTypingRef.current?.(evt), [])

  const ws = useWebSocket({ token, onMessage: handleMessage, onTyping: handleTyping })

  const handleSelectRoom = useCallback((room) => {
    activeRoomId.current = room.id
    setActiveRoom(room)
    setUnread(prev => { const next = { ...prev }; delete next[room.id]; return next })
  }, [])

  const handleLeave = useCallback(() => {
    activeRoomId.current = null
    setActiveRoom(null)
  }, [])

  const handleRoomUpdated = useCallback((updated) => {
    setActiveRoom(updated)
    setSidebarKey(k => k + 1)
  }, [])

  const handleRoomDeleted = useCallback((roomId) => {
    if (activeRoomId.current === roomId) {
      activeRoomId.current = null
      setActiveRoom(null)
    }
    setUnread(prev => { const next = { ...prev }; delete next[roomId]; return next })
    setSidebarKey(k => k + 1)
  }, [])

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 md:z-auto h-full transition-transform duration-200`}>
        <Sidebar
          key={sidebarKey}
          activeRoomId={activeRoom?.id}
          onSelectRoom={(room) => { handleSelectRoom(room); setSidebarOpen(false) }}
          wsConnected={ws.connected}
          unread={unread}
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
    </div>
  )
}
