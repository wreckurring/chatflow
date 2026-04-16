import { Avatar } from '../shared/Avatar'

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function DateSeparator({ timestamp }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-2xs text-ink-faint bg-surface-2 px-2 py-0.5 rounded-full">
        {formatDate(timestamp)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export function SystemMessage({ content }) {
  return (
    <div className="flex justify-center my-1">
      <span className="text-2xs text-ink-faint italic px-2">{content}</span>
    </div>
  )
}

export function MessageBubble({ message, showAvatar, isMine }) {
  if (message.type === 'SYSTEM') return <SystemMessage content={message.content} />

  return (
    <div className={`flex gap-2.5 px-4 py-0.5 group hover:bg-surface-2/40 transition-colors ${isMine ? 'flex-row-reverse' : ''}`}>
      <div className="w-8 shrink-0 flex items-end">
        {showAvatar && <Avatar name={message.senderDisplayName || message.senderUsername} size="sm" />}
      </div>

      <div className={`flex flex-col max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
        {showAvatar && (
          <div className={`flex items-baseline gap-2 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
            <span className="text-xs font-medium text-ink">{message.senderDisplayName || message.senderUsername}</span>
            <span className="text-2xs text-ink-faint">{formatTime(message.sentAt)}</span>
          </div>
        )}
        <div
          className={`px-3 py-2 rounded-lg text-sm font-mono leading-relaxed break-words ${
            isMine
              ? 'bg-accent-subtle border border-accent/20 text-ink rounded-tr-sm'
              : 'bg-surface-3 border border-border text-ink rounded-tl-sm'
          }`}
        >
          {message.content}
        </div>
        {!showAvatar && (
          <span className="text-2xs text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            {formatTime(message.sentAt)}
          </span>
        )}
      </div>
    </div>
  )
}
