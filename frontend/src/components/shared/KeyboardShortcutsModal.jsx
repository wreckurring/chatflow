import { useEffect } from 'react'

const SHORTCUTS = [
  { keys: ['⌘K', 'Ctrl K'], desc: 'Focus room search' },
  { keys: ['↵'],             desc: 'Send message' },
  { keys: ['⇧↵'],           desc: 'New line in message' },
  { keys: ['↑ / ↓'],        desc: 'Navigate @mention suggestions' },
  { keys: ['Tab'],           desc: 'Accept @mention suggestion' },
  { keys: ['Esc'],           desc: 'Cancel reply / close modal' },
  { keys: ['?'],             desc: 'Show this help' },
]

export function KeyboardShortcutsModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-1 border border-border rounded-xl w-full max-w-xs mx-4 animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Keyboard shortcuts</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="p-4 flex flex-col gap-1">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-1">
              <span className="text-xs text-ink-muted">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="text-2xs font-mono bg-surface-3 border border-border px-1.5 py-0.5 rounded text-ink">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border">
          <p className="text-2xs text-ink-faint text-center">Press <kbd className="font-mono bg-surface-3 border border-border px-1 rounded">?</kbd> to toggle this panel</p>
        </div>
      </div>
    </div>
  )
}
