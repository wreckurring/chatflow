import { useState, useEffect, useRef } from 'react'
import { getMyRooms, getPublicRooms, joinRoom, searchRooms } from '../../api/rooms'
import { getOnlinePresence } from '../../api/presence'
import { openDm } from '../../api/users'
import { useAuth } from '../../store/authStore'
import { Avatar } from '../shared/Avatar'
import { CreateRoomModal } from '../rooms/CreateRoomModal'
import { ProfileModal } from '../shared/ProfileModal'
import { NewDmModal } from '../shared/NewDmModal'

export function Sidebar({ activeRoomId, onSelectRoom, wsConnected, unread = {}, soundEnabled = true, onToggleSound, isOnline }) {
  const { user, signOut } = useAuth()
  const [myRooms, setMyRooms] = useState([])
  const [publicRooms, setPublicRooms] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showNewDm, setShowNewDm]   = useState(false)
  const [joining, setJoining]       = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const loadRooms = async () => {
    const [mine, pub] = await Promise.all([getMyRooms(), getPublicRooms()])
    setMyRooms(mine)
    setPublicRooms(pub)
    return { mine, pub }
  }

  useEffect(() => {
    loadRooms()
    const interval = setInterval(async () => {
      const data = await getOnlinePresence()
      setOnlineCount(data.count || 0)
    }, 10000)
    getOnlinePresence().then(d => setOnlineCount(d.count || 0))
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return }
    const t = setTimeout(async () => {
      const results = await searchRooms(search)
      setSearchResults(results)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleJoin = async (room) => {
    setJoining(room.id)
    try {
      const updated = await joinRoom(room.id)
      await loadRooms()
      onSelectRoom(updated)
    } catch {
      // already a member — reload to get fresh data then switch
      const { mine, pub } = await loadRooms()
      const fresh = [...mine, ...pub].find(r => r.id === room.id) || room
      onSelectRoom(fresh)
    } finally {
      setJoining(null)
    }
  }

  const myRoomIds   = new Set(myRooms.map(r => r.id))
  const myChannels  = myRooms.filter(r => r.type !== 'DIRECT')
  const myDms       = myRooms.filter(r => r.type === 'DIRECT')
  const displayRooms = searchResults ?? myChannels

  return (
    <aside className="w-60 shrink-0 bg-surface-1 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-accent-subtle border border-accent/30 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span className="text-sm font-semibold text-ink tracking-tight">chatflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors ${wsConnected ? 'bg-accent' : 'bg-ink-faint'}`}
              title={wsConnected ? 'Connected' : 'Connecting…'}
            />
            <span className="text-2xs text-ink-muted">{onlineCount} online</span>
            <span className="text-2xs text-ink-faint font-mono ml-1 hidden sm:inline" title="Press ? for keyboard shortcuts">?</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-md px-2.5 py-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="bg-transparent text-xs text-ink placeholder-ink-faint w-full focus:outline-none"
          />
          {!search && (
            <span className="text-2xs text-ink-faint font-mono shrink-0">⌘K</span>
          )}
          {search && (
            <button onClick={() => setSearch('')} className="text-ink-muted hover:text-ink">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-1">
        {search && searchResults !== null && (
          <div className="px-3 py-1">
            <p className="text-2xs text-ink-faint uppercase tracking-wider mb-1">Search results</p>
            {searchResults.length === 0 && <p className="text-xs text-ink-muted px-1">No rooms found</p>}
            {searchResults.map(room => (
              <RoomItem
                key={room.id}
                room={room}
                active={room.id === activeRoomId}
                joined={myRoomIds.has(room.id)}
                joining={joining === room.id}
                unreadCount={unread[room.id] ?? 0}
                onSelect={() => handleJoin(room)}
              />
            ))}
          </div>
        )}

        {!search && (
          <>
            <div className="px-3 pt-2 pb-1 flex items-center justify-between">
              <p className="text-2xs text-ink-faint uppercase tracking-wider">My rooms</p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-ink-muted hover:text-accent transition-colors"
                title="New room"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>

            {myChannels.length === 0 && !search && (
              <p className="text-xs text-ink-muted px-4 py-2">No rooms yet. Join or create one.</p>
            )}

            {displayRooms.map(room => (
              <RoomItem
                key={room.id}
                room={room}
                active={room.id === activeRoomId}
                joined={myRoomIds.has(room.id)}
                joining={joining === room.id}
                unreadCount={unread[room.id] ?? 0}
                onSelect={() => onSelectRoom(room)}
              />
            ))}

            {/* Direct Messages */}
            <div className="px-3 pt-3 pb-1 flex items-center justify-between">
              <p className="text-2xs text-ink-faint uppercase tracking-wider">Direct messages</p>
              <button
                onClick={() => setShowNewDm(true)}
                className="text-ink-muted hover:text-accent transition-colors"
                title="New DM"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
            </div>
            {myDms.length === 0 && (
              <p className="text-xs text-ink-muted px-4 py-1">No direct messages yet.</p>
            )}
            {myDms.map(room => (
              <RoomItem
                key={room.id}
                room={room}
                active={room.id === activeRoomId}
                joined={true}
                joining={false}
                unreadCount={unread[room.id] ?? 0}
                onSelect={() => onSelectRoom(room)}
                online={isOnline?.(room.otherUsername)}
              />
            ))}

            {publicRooms.filter(r => !myRoomIds.has(r.id)).length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <p className="text-2xs text-ink-faint uppercase tracking-wider">Discover</p>
                </div>
                {publicRooms.filter(r => !myRoomIds.has(r.id)).map(room => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    active={false}
                    joined={false}
                    joining={joining === room.id}
                    unreadCount={0}
                    onSelect={() => handleJoin(room)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-border px-3 py-2.5 flex items-center gap-2.5">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          <Avatar name={user?.displayName || user?.username} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate">{user?.displayName}</p>
            <p className="text-2xs text-ink-muted truncate">@{user?.username}</p>
          </div>
        </button>
        <button
          onClick={onToggleSound}
          className={`transition-colors shrink-0 ${soundEnabled ? 'text-ink-faint hover:text-ink' : 'text-ink-faint/40 hover:text-ink-faint'}`}
          title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
        >
          {soundEnabled ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
        </button>
        <button
          onClick={signOut}
          className="text-ink-faint hover:text-danger transition-colors shrink-0"
          title="Sign out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(room) => { loadRooms(); onSelectRoom(room) }}
        />
      )}
      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
      {showNewDm && (
        <NewDmModal
          onClose={() => setShowNewDm(false)}
          onOpen={(room) => { loadRooms(); onSelectRoom(room); setShowNewDm(false) }}
        />
      )}
    </aside>
  )
}

function RoomItem({ room, active, joined, joining, unreadCount = 0, onSelect, online }) {
  const hasUnread = unreadCount > 0 && !active
  const isDm      = room.type === 'DIRECT'
  const label     = isDm ? (room.otherDisplayName || room.otherUsername || room.name) : room.name

  return (
    <button
      onClick={onSelect}
      disabled={joining}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md mx-1 text-left transition-colors group ${
        active
          ? 'bg-accent-subtle text-ink'
          : hasUnread
          ? 'text-ink hover:bg-surface-3'
          : 'text-ink-muted hover:text-ink hover:bg-surface-3'
      }`}
      style={{ width: 'calc(100% - 8px)' }}
    >
      {isDm ? (
        <span className="relative w-5 shrink-0 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={active ? 'text-accent' : hasUnread ? 'text-ink' : 'text-ink-faint group-hover:text-ink-muted'}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          {online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border border-surface-1" />}
        </span>
      ) : (
        <span className={`text-base leading-none w-5 shrink-0 text-center ${active ? 'text-accent' : hasUnread ? 'text-accent-text' : 'text-ink-faint group-hover:text-ink-muted'}`}>
          #
        </span>
      )}
      <span className={`flex-1 text-xs truncate ${hasUnread ? 'font-semibold' : 'font-medium'}`}>{label}</span>
      {hasUnread && (
        <span className="text-2xs font-semibold bg-accent text-surface rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {!joined && !hasUnread && (
        <span className="text-2xs text-ink-faint bg-surface-4 px-1 py-0.5 rounded">
          {joining ? '…' : 'join'}
        </span>
      )}
      {room.type === 'PRIVATE' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-faint">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      )}
    </button>
  )
}
