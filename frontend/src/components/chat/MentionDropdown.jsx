import { useEffect, useRef } from 'react'
import { Avatar } from '../shared/Avatar'

export function MentionDropdown({ members, filter, onSelect, activeIndex }) {
  const filtered = members.filter(m =>
    m.username.toLowerCase().startsWith(filter.toLowerCase()) ||
    (m.displayName && m.displayName.toLowerCase().startsWith(filter.toLowerCase()))
  ).slice(0, 6)

  const listRef = useRef(null)

  useEffect(() => {
    const el = listRef.current?.children[activeIndex]
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      className="absolute bottom-full mb-1 left-0 w-56 bg-surface-2 border border-border rounded-lg shadow-lg overflow-hidden z-10"
    >
      {filtered.map((member, i) => (
        <button
          key={member.username}
          onMouseDown={(e) => { e.preventDefault(); onSelect(member) }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
            i === activeIndex ? 'bg-surface-3' : 'hover:bg-surface-3'
          }`}
        >
          <Avatar name={member.displayName || member.username} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate">{member.displayName || member.username}</p>
            <p className="text-2xs text-ink-faint truncate">@{member.username}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// Returns { query, start, end } if cursor is after an @-mention trigger, else null
export function detectMentionTrigger(text, cursorPos) {
  const before = text.slice(0, cursorPos)
  const match = before.match(/@(\w*)$/)
  if (!match) return null
  return {
    query: match[1],
    start: match.index,
    end: cursorPos,
  }
}
