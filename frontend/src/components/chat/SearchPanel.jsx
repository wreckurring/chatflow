import { useState, useRef, useEffect } from 'react'
import { searchMessages } from '../../api/messages'
import { Avatar } from '../shared/Avatar'

function formatDateTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-ink rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function SearchPanel({ roomId, roomName, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const debounce = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchMessages(roomId, query)
        setResults(res)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [query, roomId])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface-1 w-72 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Search #${roomName}`}
          className="flex-1 bg-transparent text-xs text-ink placeholder-ink-faint focus:outline-none"
        />
        <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Results */}
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

        {!loading && results !== null && results.length === 0 && (
          <p className="text-xs text-ink-muted text-center py-8">No messages found</p>
        )}

        {!loading && results === null && query === '' && (
          <p className="text-xs text-ink-faint text-center py-8">Type to search messages</p>
        )}

        {!loading && results && results.map(msg => (
          <div key={msg.id} className="px-4 py-3 border-b border-border hover:bg-surface-2 transition-colors">
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar name={msg.senderDisplayName || msg.senderUsername} size="sm" />
              <span className="text-xs font-medium text-ink truncate">{msg.senderDisplayName || msg.senderUsername}</span>
              <span className="text-2xs text-ink-faint ml-auto shrink-0">{formatDateTime(msg.sentAt)}</span>
            </div>
            <p className="text-xs text-ink-muted font-mono leading-relaxed break-words line-clamp-3">
              {highlight(msg.content, query)}
            </p>
          </div>
        ))}
      </div>

      {results !== null && !loading && (
        <div className="px-4 py-2 border-t border-border">
          <p className="text-2xs text-ink-faint">{results.length} result{results.length !== 1 ? 's' : ''}</p>
        </div>
      )}
    </div>
  )
}
