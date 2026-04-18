import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { openDm } from '../../api/users'

export function NewDmModal({ onClose, onOpen }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setError(''); setLoading(true)
    try {
      const room = await openDm(username.trim())
      onOpen(room)
    } catch (err) {
      setError(err.response?.data?.message || 'User not found')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-1 border border-border rounded-xl w-full max-w-xs mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">New direct message</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Input
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="@someone"
            autoFocus
          />
          {error && <p className="text-xs text-danger bg-danger-subtle border border-danger/20 rounded px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} disabled={!username.trim()} className="flex-1">Open DM</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
