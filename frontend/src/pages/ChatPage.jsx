import { useState, useCallback, useRef } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ChatPanel } from '../components/chat/ChatPanel'
import { EmptyState } from '../components/chat/EmptyState'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../store/authStore'

export function ChatPage() {
  const { token } = useAuth()
  const [activeRoom, setActiveRoom]   = useState(null)
  const [unread, setUnread]           = useState({}) // roomId → count
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const onMessageRef = useRef(null)
  const onTypingRef  = useRef(null)
  const activeRoomId = useRef(null)

  const handleMessage = useCallback((msg) => {
    // Forward to ChatPanel handler if it's for the active room
    onMessageRef.current?.(msg)

    // Increment unread for background rooms (non-SYSTEM messages only)
    if (msg.type !== 'SYSTEM' && msg.roomId !== activeRoomId.current) {
      setUnread(prev => ({ ...prev, [msg.roomId]: (prev[msg.roomId] ?? 0) + 1 }))
    }
  }, [])

  const handleTyping = useCallback((evt) => onTypingRef.current?.(evt), [])

  const ws = useWebSocket({ token, onMessage: handleMessage, onTyping: handleTyping })

  const handleSelectRoom = useCallback((room) => {
    activeRoomId.current = room.id
    setActiveRoom(room)
    // Clear unread for this room
    setUnread(prev => { const next = { ...prev }; delete next[room.id]; return next })
  }, [])

  const handleLeave = useCallback(() => {
    activeRoomId.current = null
    setActiveRoom(null)
  }, [])

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 md:z-auto h-full transition-transform duration-200`}>
        <Sidebar
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
          />
        ) : (
          <EmptyState onToggleSidebar={() => setSidebarOpen(v => !v)} />
        )}
      </main>
    </div>
  )
}
