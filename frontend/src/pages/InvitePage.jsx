import { useState, useEffect } from 'react'
import { getInvite, acceptInvite } from '../api/invites'
import { useAuth } from '../store/authStore'
import { Button } from '../components/shared/Button'

export function InvitePage({ token }) {
  const { isAuthed } = useAuth()
  const [invite, setInvite]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError]     = useState('')
  const [joined, setJoined]   = useState(false)

  useEffect(() => {
    getInvite(token)
      .then(setInvite)
      .catch(() => setError('This invite link is invalid or has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleJoin = async () => {
    if (!isAuthed) {
      sessionStorage.setItem('pendingInvite', token)
      window.location.href = '/'
      return
    }
    setJoining(true)
    try {
      await acceptInvite(token)
      setJoined(true)
      setTimeout(() => { window.location.href = '/' }, 1200)
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Failed to join room.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface-1 border border-border rounded-xl p-8 flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded bg-accent-subtle border border-accent/30 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <span className="text-base font-semibold text-ink tracking-tight">chatflow</span>
        </div>

        {loading && (
          <div className="flex gap-1 py-4">
            {[0,1,2].map(i => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-faint animate-pulse-dot" style={{ animationDelay: `${i * 0.16}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center">
            <p className="text-sm text-danger mb-4">{error}</p>
            <a href="/" className="text-xs text-accent hover:underline">Go to chatflow →</a>
          </div>
        )}

        {!loading && invite && !error && (
          <>
            <div className="text-center">
              <p className="text-xs text-ink-faint mb-1">You've been invited to join</p>
              <h1 className="text-xl font-bold text-ink">#{invite.roomName}</h1>
              {invite.roomDescription && (
                <p className="text-sm text-ink-muted mt-1">{invite.roomDescription}</p>
              )}
              <p className="text-xs text-ink-faint mt-3">{invite.memberCount} member{invite.memberCount !== 1 ? 's' : ''}</p>
            </div>

            {joined ? (
              <div className="flex items-center gap-2 text-accent text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Joined! Redirecting…
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <Button onClick={handleJoin} loading={joining} className="w-full justify-center">
                  {isAuthed ? 'Join room' : 'Sign in to join'}
                </Button>
                <a href="/" className="text-center text-xs text-ink-faint hover:text-ink transition-colors">
                  {isAuthed ? 'Back to chatflow' : 'Already have an account? Sign in'}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
