import { useState, useEffect } from 'react'
import { getPinnedMessages, togglePin } from '../../api/rooms'
import { Avatar } from '../shared/Avatar'
import { toast } from '../shared/Toast'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function PinnedMessagesPanel({ roomId, onClose, onUnpin }) {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPinnedMessages(roomId)
      .then(setPins)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roomId])

  const handleUnpin = async (messageId) => {
    try {
      await togglePin(roomId, messageId)
      setPins(prev => prev.filter(p => p.id !== messageId))
      onUnpin?.(messageId)
    } catch {
      toast('Failed to unpin message')
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface-1 w-72 shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent shrink-0">
          <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
        </svg>
        <span className="text-xs font-semibold text-ink flex-1">Pinned messages</span>
        <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-6">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-ink-faint animate-pulse-dot" style={{ animationDelay: `${i * 0.16}s` }} />
              ))}
            </div>
          </div>
        )}
        {!loading && pins.length === 0 && (
          <p className="text-xs text-ink-faint text-center py-8">No pinned messages</p>
        )}
        {!loading && pins.map(msg => (
          <div key={msg.id} className="group px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar name={msg.senderDisplayName || msg.senderUsername} size="sm" />
              <span className="text-xs font-medium text-ink truncate flex-1">{msg.senderDisplayName || msg.senderUsername}</span>
              <span className="text-2xs text-ink-faint shrink-0">{formatDate(msg.sentAt)}</span>
              <button
                onClick={() => handleUnpin(msg.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-danger p-0.5 rounded"
                title="Unpin"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-ink-muted font-mono leading-relaxed break-words line-clamp-3">
              {msg.content ?? <span className="italic text-ink-faint">deleted message</span>}
            </p>
          </div>
        ))}
      </div>

      {!loading && (
        <div className="px-4 py-2 border-t border-border">
          <p className="text-2xs text-ink-faint">{pins.length} pinned</p>
        </div>
      )}
    </div>
  )
}
