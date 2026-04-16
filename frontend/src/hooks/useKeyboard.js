import { useEffect } from 'react'

/**
 * Attach a keyboard shortcut to a handler.
 * @param {string} key - e.g. 'Escape', 'k'
 * @param {function} handler
 * @param {{ ctrl?: boolean, meta?: boolean, enabled?: boolean }} options
 */
export function useKeyboard(key, handler, { ctrl = false, meta = false, enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (e) => {
      if (ctrl && !e.ctrlKey && !e.metaKey) return
      if (meta && !e.metaKey) return
      if (e.key === key) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, handler, ctrl, meta, enabled])
}
