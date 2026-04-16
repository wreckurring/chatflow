import { useState, useEffect } from 'react'
import { createRoom } from '../../api/rooms'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'

export function CreateRoomModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'PUBLIC' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const room = await createRoom(form)
      onCreated(room)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-1 border border-border rounded-xl w-full max-w-sm mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">New room</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <Input
            label="Room name"
            placeholder="engineering"
            value={form.name}
            onChange={set('name')}
            required
            minLength={3}
            maxLength={50}
            autoFocus
          />
          <Input
            label="Description"
            placeholder="What's this room for?"
            value={form.description}
            onChange={set('description')}
            maxLength={255}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-ink-muted font-medium tracking-wide uppercase">Visibility</label>
            <div className="flex gap-2">
              {['PUBLIC', 'PRIVATE'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${
                    form.type === t
                      ? 'bg-accent-subtle border-accent/40 text-accent-text'
                      : 'border-border text-ink-muted hover:border-border-strong hover:text-ink'
                  }`}
                >
                  {t === 'PUBLIC' ? '# Public' : '🔒 Private'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-danger bg-danger-subtle border border-danger/20 rounded-md px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Create room</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
