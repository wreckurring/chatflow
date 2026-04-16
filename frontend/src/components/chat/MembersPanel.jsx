import { useState, useEffect } from 'react'
import { getRoomMembers } from '../../api/rooms'
import { getOnlinePresence } from '../../api/presence'
import { Avatar } from '../shared/Avatar'

export function MembersPanel({ roomId, onClose }) {
  const [members, setMembers] = useState([])
  const [onlineSet, setOnlineSet] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getRoomMembers(roomId), getOnlinePresence()])
      .then(([m, presence]) => {
        setMembers(m)
        setOnlineSet(new Set(presence.users ?? []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [roomId])

  const online  = members.filter(m => onlineSet.has(m.username))
  const offline = members.filter(m => !onlineSet.has(m.username))

  return (
    <aside className="w-52 shrink-0 border-l border-border bg-surface-1 flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-semibold text-ink uppercase tracking-wide">Members</span>
        <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-3">
        {loading ? (
          <div className="flex justify-center pt-6">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-ink-faint animate-pulse-dot" style={{ animationDelay: `${i * 0.16}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {online.length > 0 && (
              <>
                <p className="text-2xs text-ink-faint uppercase tracking-wider mb-1.5">
                  Online — {online.length}
                </p>
                {online.map(m => <MemberRow key={m.id} member={m} online />)}
                <div className="my-3" />
              </>
            )}
            {offline.length > 0 && (
              <>
                <p className="text-2xs text-ink-faint uppercase tracking-wider mb-1.5">
                  Offline — {offline.length}
                </p>
                {offline.map(m => <MemberRow key={m.id} member={m} online={false} />)}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function MemberRow({ member, online }) {
  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <div className="relative">
        <Avatar name={member.displayName || member.username} size="sm" />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-surface-1 ${online ? 'bg-accent' : 'bg-ink-faint'}`}
        />
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium truncate ${online ? 'text-ink' : 'text-ink-muted'}`}>
          {member.displayName || member.username}
        </p>
        <p className="text-2xs text-ink-faint truncate">@{member.username}</p>
      </div>
    </div>
  )
}
