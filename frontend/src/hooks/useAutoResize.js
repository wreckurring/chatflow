import { useEffect } from 'react'

/**
 * Automatically grows a textarea to fit its content.
 * Pass the ref and the current value — resizes on every value change.
 */
export function useAutoResize(ref, value) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [ref, value])
}
