import { useState, useCallback, useRef, useEffect } from 'react'
import { Avatar } from '../shared/Avatar'
import { editMessage, deleteMessage } from '../../api/messages'
import { toast } from '../shared/Toast'

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

// Renders text with inline `code` and ```code block``` support
function MessageContent({ text }) {
  const parts = []
  // Split on triple-backtick blocks first
  const blockRe = /```([\s\S]*?)```/g
  let last = 0
  let match

  while ((match = blockRe.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) })
    }
    parts.push({ type: 'block', value: match[1].replace(/^\n/, '').replace(/\n$/, '') })
    last = match.index + match[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) })
  }

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'block') {
          return (
            <pre key={i} className="mt-1.5 mb-0.5 px-3 py-2 bg-surface rounded border border-border text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
              {part.value}
            </pre>
          )
        }
        // inline `code` within text segments
        const inline = part.value.split(/(`[^`]+`)/)
        return (
          <span key={i}>
            {inline.map((seg, j) => {
              if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
                return (
                  <code key={j} className="px-1 py-0.5 bg-surface rounded text-xs font-mono text-accent">
                    {seg.slice(1, -1)}
                  </code>
                )
              }
              return <span key={j} style={{ whiteSpace: 'pre-wrap' }}>{seg}</span>
            })}
          </span>
        )
      })}
    </>
  )
}

function InlineEditor({ messageId, initialContent, isMine, onDone }) {
  const [value, setValue] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  const handleKey = (e) => {
    if (e.key === 'Escape') { onDone(null); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
  }

  const handleSave = async () => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === initialContent) { onDone(null); return }
    setSaving(true)
    try {
      await editMessage(messageId, trimmed)
      onDone(trimmed)
    } catch {
      toast('Failed to edit message')
      onDone(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`flex flex-col gap-1 w-full ${isMine ? 'items-end' : 'items-start'}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => {
          setValue(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
        onKeyDown={handleKey}
        disabled={saving}
        className="w-full max-w-[72%] px-3 py-2 rounded-lg text-sm font-mono leading-relaxed bg-surface-2 border border-accent/40 text-ink resize-none focus:outline-none"
        style={{ minHeight: '2rem' }}
      />
      <div className="flex items-center gap-2 text-2xs text-ink-faint">
        <span>↵ save</span>
        <span>·</span>
        <button onClick={() => onDone(null)} className="hover:text-ink transition-colors">esc cancel</button>
      </div>
    </div>
  )
}

export function MessageBubble({ message, showAvatar, isMine }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (message.type === 'SYSTEM') return <SystemMessage content={message.content} />

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    try {
      await deleteMessage(message.id)
    } catch {
      toast('Failed to delete message')
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <div className={`flex gap-2.5 px-4 py-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
        <div className="w-8 shrink-0 flex items-end">
          {showAvatar && <Avatar name={message.senderDisplayName || message.senderUsername} size="sm" />}
        </div>
        <div className={`flex flex-col max-w-[72%] w-full ${isMine ? 'items-end' : 'items-start'}`}>
          {showAvatar && (
            <div className={`flex items-baseline gap-2 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs font-medium text-ink">{message.senderDisplayName || message.senderUsername}</span>
              <span className="text-2xs text-ink-faint">{formatTime(message.sentAt)}</span>
            </div>
          )}
          <InlineEditor
            messageId={message.id}
            initialContent={message.content}
            isMine={isMine}
            onDone={() => setEditing(false)}
          />
        </div>
      </div>
    )
  }

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

        {/* Bubble + action buttons row */}
        <div className={`flex items-start gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <div
            className={`px-3 py-2 rounded-lg text-sm font-mono leading-relaxed break-words ${
              isMine
                ? 'bg-accent-subtle border border-accent/20 text-ink rounded-tr-sm'
                : 'bg-surface-3 border border-border text-ink rounded-tl-sm'
            }`}
          >
            <MessageContent text={message.content} />
            {message.editedAt && (
              <span className="text-2xs text-ink-faint ml-1">(edited)</span>
            )}
          </div>

          {/* Action buttons — shown on hover */}
          <div className={`flex items-center gap-0.5 self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <CopyButton text={message.content} />
            {isMine && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-ink-faint hover:text-ink p-1 rounded transition-colors"
                  title="Edit"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-ink-faint hover:text-danger p-1 rounded transition-colors"
                  title="Delete"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </>
            )}
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
