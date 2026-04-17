import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Avatar } from './Avatar'
import client from '../../api/client'
import { useAuth } from '../../store/authStore'

export function ProfileModal({ onClose }) {
  const { user, signIn } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setError(''); setSuccess(false); setLoading(true)
    try {
      await client.patch('/users/me', { displayName: displayName.trim() })
      // Update local auth state
      signIn({ ...user, token: localStorage.getItem('token'), displayName: displayName.trim() })
      setSuccess(true)
      setTimeout(onClose, 800)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-1 border border-border rounded-xl w-full max-w-sm mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <Avatar name={displayName || user?.username} size="lg" />
            <div>
              <p className="text-sm font-medium text-ink">{displayName || user?.username}</p>
              <p className="text-xs text-ink-muted">@{user?.username}</p>
              <p className="text-2xs text-ink-faint mt-0.5">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Display name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={user?.username}
              maxLength={50}
              autoFocus
            />

            {error && <p className="text-xs text-danger bg-danger-subtle border border-danger/20 rounded px-3 py-2">{error}</p>}
            {success && <p className="text-xs text-accent bg-accent-subtle border border-accent/20 rounded px-3 py-2">Updated!</p>}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={loading} disabled={!displayName.trim()} className="flex-1">Save</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
