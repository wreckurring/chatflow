import { useState, useCallback } from 'react'
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
    <div className="flex items-center gap-3 my-4 px-4">
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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-faint hover:text-ink p-1 rounded"
      title="Copy"
    >
      {copied ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      )}
    </button>
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

        {/* Bubble + copy button row */}
        <div className={`flex items-start gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <div
            className={`px-3 py-2 rounded-lg text-sm font-mono leading-relaxed break-words ${
              isMine
                ? 'bg-accent-subtle border border-accent/20 text-ink rounded-tr-sm'
                : 'bg-surface-3 border border-border text-ink rounded-tl-sm'
            }`}
          >
            {message.content}
          </div>
          <div className="self-center shrink-0">
            <CopyButton text={message.content} />
          </div>
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
