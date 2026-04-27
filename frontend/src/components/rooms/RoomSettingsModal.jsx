import { useState, useEffect } from 'react'
import { Button } from '../shared/Button'
import { Input } from '../shared/Input'
import { updateRoom, deleteRoom } from '../../api/rooms'
import { createInvite } from '../../api/invites'
import { toast } from '../shared/Toast'

export function RoomSettingsModal({ room, onClose, onUpdated, onDeleted }) {
  const [name, setName] = useState(room.name)
  const [description, setDescription] = useState(room.description || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleGenerateLink = async () => {
    setGeneratingLink(true)
    try {
      const invite = await createInvite(room.id)
      const link = `${window.location.origin}/invite/${invite.token}`
      setInviteLink(link)
    } catch {
      toast('Failed to generate invite link')
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <Input label="Room name" value={name} onChange={e => setName(e.target.value)} maxLength={50} autoFocus />
            <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" maxLength={255} />
            {error && <p className="text-xs text-danger bg-danger-subtle border border-danger/20 rounded px-3 py-2">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" loading={saving} disabled={!name.trim()} className="flex-1">Save</Button>
            </div>
          </form>

          {/* Invite link */}
          <div className="border-t border-border pt-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-ink-muted">Invite link</p>
            {!inviteLink ? (
              <Button type="button" variant="ghost" loading={generatingLink} onClick={handleGenerateLink} className="w-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Generate invite link
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 min-w-0 text-2xs font-mono bg-surface-2 border border-border rounded px-2 py-1.5 text-ink-muted focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`shrink-0 text-xs px-2 py-1.5 rounded border transition-colors ${
                    copied
                      ? 'bg-accent/10 border-accent/30 text-accent'
                      : 'bg-surface-2 border-border text-ink-muted hover:text-ink'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Delete */}
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
                  <Button type="button" loading={deleting} onClick={handleDelete} className="flex-1 !bg-danger !border-danger/40 hover:!bg-danger/90">
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
