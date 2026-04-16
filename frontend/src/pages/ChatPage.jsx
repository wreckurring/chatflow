import { useState, useCallback, useRef } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ChatPanel } from '../components/chat/ChatPanel'
import { EmptyState } from '../components/chat/EmptyState'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../store/authStore'

export function ChatPage() {
  const { token } = useAuth()
  const [activeRoom, setActiveRoom] = useState(null)

  // These are set by ChatPanel each time a room is opened; kept in refs so
  // the WebSocket hook doesn't need to re-subscribe when they change.
  const onMessageRef = useRef(null)
  const onTypingRef  = useRef(null)

  const handleMessage = useCallback((msg) => onMessageRef.current?.(msg), [])
  const handleTyping  = useCallback((evt) => onTypingRef.current?.(evt),  [])

  const ws = useWebSocket({ token, onMessage: handleMessage, onTyping: handleTyping })

  const handleLeave = useCallback(() => setActiveRoom(null), [])

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      <Sidebar activeRoomId={activeRoom?.id} onSelectRoom={setActiveRoom} wsConnected={ws.connected} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoom ? (
          <ChatPanel
            key={activeRoom.id}
            room={activeRoom}
            ws={ws}
            onMessageRef={onMessageRef}
            onTypingRef={onTypingRef}
            onLeave={handleLeave}
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
