import { useState, useCallback, useEffect, useRef } from 'react'

let _addToast = null

export function toast(message, type = 'error') {
  _addToast?.({ message, type, id: Date.now() + Math.random() })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const add = useCallback((t) => {
    setToasts(prev => [...prev.slice(-4), t]) // keep max 5
  }, [])

  useEffect(() => { _addToast = add; return () => { _addToast = null } }, [add])

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={remove} />
      ))}
    </div>
  )
}

function ToastItem({ toast: t, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), 4000)
    return () => clearTimeout(timer)
  }, [t.id, onDismiss])

  const colors = {
    error:   'bg-surface-3 border-danger/30 text-ink',
    success: 'bg-surface-3 border-accent/30 text-ink',
    info:    'bg-surface-3 border-border text-ink',
  }

  const icons = {
    error:   <span className="text-danger">✕</span>,
    success: <span className="text-accent">✓</span>,
    info:    <span className="text-ink-muted">ℹ</span>,
  }

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm shadow-lg animate-slide-up ${colors[t.type]}`}>
      <span className="text-xs font-bold">{icons[t.type]}</span>
      <span className="text-xs">{t.message}</span>
      <button onClick={() => onDismiss(t.id)} className="ml-1 text-ink-faint hover:text-ink transition-colors text-xs">
        ✕
      </button>
    </div>
  )
}
