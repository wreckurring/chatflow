import { useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { ChatPanel } from '../components/chat/ChatPanel'
import { EmptyState } from '../components/chat/EmptyState'

export function ChatPage() {
  const [activeRoom, setActiveRoom] = useState(null)

  const handleLeave = () => setActiveRoom(null)

  return (
    <div className="h-full flex bg-surface overflow-hidden">
      <Sidebar activeRoomId={activeRoom?.id} onSelectRoom={setActiveRoom} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeRoom
          ? <ChatPanel key={activeRoom.id} room={activeRoom} onLeave={handleLeave} />
          : <EmptyState />
        }
      </main>
    </div>
  )
}
