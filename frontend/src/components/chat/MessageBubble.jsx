import { useState, useCallback, useRef, useEffect } from 'react'
import { Avatar } from '../shared/Avatar'
import { editMessage, deleteMessage, toggleReaction } from '../../api/messages'
import { togglePin } from '../../api/rooms'
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

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🔥', '👀']

function EmojiPicker({ onPick, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-20 bottom-full mb-1 bg-surface-2 border border-border rounded-lg p-1.5 flex gap-1 shadow-lg"
    >
      {QUICK_EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => { onPick(e); onClose() }}
          className="text-base w-7 h-7 flex items-center justify-center rounded hover:bg-surface-3 transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  )
}

function ReactionBar({ reactions, messageId, currentUsername }) {
  if (!reactions || Object.keys(reactions).length === 0) return null

  const handleClick = async (emoji) => {
    try { await toggleReaction(messageId, emoji) }
    catch { toast('Failed to update reaction') }
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(reactions).map(([emoji, users]) => {
        const mine = users.includes(currentUsername)
        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
              mine
                ? 'bg-accent-subtle border-accent/40 text-ink'
                : 'bg-surface-3 border-border text-ink-muted hover:border-border-strong hover:text-ink'
            }`}
          >
            <span>{emoji}</span>
            <span className="text-2xs font-medium">{users.length}</span>
          </button>
        )
      })}
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
    <button onClick={handleCopy} className="text-ink-faint hover:text-ink p-1 rounded transition-colors" title="Copy">
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

// Markdown + code rendering
function MessageContent({ text, currentUsername }) {
  const parts = []
  const blockRe = /```([\s\S]*?)```/g
  let last = 0, match

  while ((match = blockRe.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: 'text', value: text.slice(last, match.index) })
    parts.push({ type: 'block', value: match[1].replace(/^\n/, '').replace(/\n$/, '') })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })

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
        return <InlineMarkdown key={i} text={part.value} currentUsername={currentUsername} />
      })}
    </>
  )
}

function InlineMarkdown({ text, currentUsername }) {
  // Parse inline tokens: `code`, **bold**, *italic*, ~~strike~~, [text](url), @mention
  const tokenRe = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|@\w+)/g
  const segments = text.split(tokenRe)

  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, i) => {
        if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
          return <code key={i} className="px-1 py-0.5 bg-surface rounded text-xs font-mono text-accent">{seg.slice(1, -1)}</code>
        }
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return <strong key={i} className="font-semibold text-ink">{seg.slice(2, -2)}</strong>
        }
        if (seg.startsWith('*') && seg.endsWith('*')) {
          return <em key={i} className="italic">{seg.slice(1, -1)}</em>
        }
        if (seg.startsWith('~~') && seg.endsWith('~~')) {
          return <span key={i} className="line-through text-ink-muted">{seg.slice(2, -2)}</span>
        }
        const linkMatch = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
               className="text-accent underline underline-offset-2 hover:text-accent/80">
              {linkMatch[1]}
            </a>
          )
        }
        if (seg.startsWith('@') && seg.length > 1) {
          const mentioned = seg.slice(1)
          const isMe = currentUsername && mentioned.toLowerCase() === currentUsername.toLowerCase()
          return (
            <span key={i} className={`rounded px-0.5 font-medium ${
              isMe ? 'bg-accent/20 text-accent' : 'bg-surface text-ink-muted'
            }`}>
              {seg}
            </span>
          )
        }
        return <span key={i}>{seg}</span>
      })}
    </span>
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
        onKeyDown={e => {
          if (e.key === 'Escape') { onDone(null); return }
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() }
        }}
        disabled={saving}
        className="w-full max-w-[72%] px-3 py-2 rounded-lg text-sm font-mono leading-relaxed bg-surface-2 border border-accent/40 text-ink resize-none focus:outline-none"
        style={{ minHeight: '2rem' }}
      />
      <div className="flex items-center gap-2 text-2xs text-ink-faint">
        <span>↵ save</span><span>·</span>
        <button onClick={() => onDone(null)} className="hover:text-ink transition-colors">esc cancel</button>
      </div>
    </div>
  )
}

export function MessageBubble({ message, showAvatar, isMine, currentUsername, onReply, roomId }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pinned, setPinned] = useState(message.pinned ?? false)

  if (message.type === 'SYSTEM') return <SystemMessage content={message.content} />

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    try { await deleteMessage(message.id) }
    catch { toast('Failed to delete message'); setDeleting(false) }
  }

  const handleReact = async (emoji) => {
    try { await toggleReaction(message.id, emoji) }
    catch { toast('Failed to add reaction') }
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
          <InlineEditor messageId={message.id} initialContent={message.content} isMine={isMine} onDone={() => setEditing(false)} />
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

        {/* Reply quote */}
        {message.replyToId && (
          <div className={`flex items-start gap-1.5 mb-1 max-w-full ${isMine ? 'flex-row-reverse' : ''}`}>
            <div className="w-0.5 rounded-full bg-accent/50 shrink-0 self-stretch" />
            <p className="text-2xs text-ink-faint truncate max-w-xs">
              <span className="font-medium text-ink-muted">{message.replyToSenderDisplayName || message.replyToSenderUsername}</span>
              {': '}
              {message.replyToContent
                ? <span>{message.replyToContent.slice(0, 80)}{message.replyToContent.length > 80 ? '…' : ''}</span>
                : <span className="italic">deleted message</span>
              }
            </p>
          </div>
        )}

        {/* Bubble + action buttons */}
        <div className={`flex items-start gap-1.5 ${isMine ? 'flex-row-reverse' : ''}`}>
          <div
            className={`px-3 py-2 rounded-lg text-sm leading-relaxed break-words ${
              isMine
                ? 'bg-accent-subtle border border-accent/20 text-ink rounded-tr-sm font-mono'
                : 'bg-surface-3 border border-border text-ink rounded-tl-sm font-mono'
            }`}
          >
            <MessageContent text={message.content} currentUsername={currentUsername} />
            {message.editedAt && (
              <span className="text-2xs text-ink-faint ml-1">(edited)</span>
            )}
          </div>

          {/* Hover actions */}
          <div className={`relative flex items-center gap-0.5 self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`}>
            <CopyButton text={message.content} />
            <button
              onClick={() => onReply?.(message)}
              className="text-ink-faint hover:text-ink p-1 rounded transition-colors"
              title="Reply"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
              </svg>
            </button>
            <button
              onClick={() => setShowPicker(v => !v)}
              className="text-ink-faint hover:text-ink p-1 rounded transition-colors"
              title="React"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>
              </svg>
            </button>
            {showPicker && (
              <EmojiPicker onPick={handleReact} onClose={() => setShowPicker(false)} />
            )}
            {roomId && (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  try { await togglePin(roomId, message.id); setPinned(v => !v) }
                  catch { toast('Failed to pin message') }
                }}
                className={`p-1 rounded transition-colors ${pinned ? 'text-accent' : 'text-ink-faint hover:text-ink'}`}
                title={pinned ? 'Unpin' : 'Pin'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
                </svg>
              </button>
            )}
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

        {/* Reactions */}
        <ReactionBar reactions={message.reactions} messageId={message.id} currentUsername={currentUsername} />

        {!showAvatar && (
          <span className="text-2xs text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            {formatTime(message.sentAt)}
          </span>
        )}
      </div>
    </div>
  )
}
