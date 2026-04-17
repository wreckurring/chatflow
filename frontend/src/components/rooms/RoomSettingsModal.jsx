import { useState, useEffect } from 'react'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'
import { updateRoom, deleteRoom } from '../../api/rooms'
import { toast } from '../shared/Toast'

export function RoomSettingsModal({ room, onClose, onUpdated, onDeleted }) {
  const [name, setName] = useState(room.name)
  const [description, setDescription] = useState(room.description || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setError(''); setSaving(true)
    try {
      const updated = await updateRoom(room.id, { name: name.trim(), description: description.trim() })
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRoom(room.id)
      onDeleted(room.id)
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete room')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-1 border border-border rounded-xl w-full max-w-sm mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Room settings</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Input
              label="Room name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={50}
              autoFocus
            />
            <Input
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional"
              maxLength={255}
            />
            {error && <p className="text-xs text-danger bg-danger-subtle border border-danger/20 rounded px-3 py-2">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={saving} disabled={!name.trim()} className="flex-1">Save</Button>
            </div>
          </form>

          <div className="border-t border-border pt-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-xs text-danger hover:bg-danger-subtle border border-danger/20 rounded px-3 py-2 transition-colors"
              >
                Delete room
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-ink-muted text-center">Delete <span className="font-semibold text-ink">#{room.name}</span>? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
                  <Button
                    type="button"
                    loading={deleting}
                    onClick={handleDelete}
                    className="flex-1 !bg-danger !border-danger/40 hover:!bg-danger/90"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
