import { useEffect, useCallback, useRef, useState } from 'react'

function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

export function useNotifications(currentUsername) {
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem('cf_sound') !== 'false'
  )
  const soundRef = useRef(soundEnabled)

  useEffect(() => { soundRef.current = soundEnabled }, [soundEnabled])

  const toggleSound = useCallback(() => {
    setSoundEnabled(v => {
      const next = !v
      localStorage.setItem('cf_sound', String(next))
      return next
    })
  }, [])

  // Request browser notification permission once
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const notify = useCallback((msg, roomName) => {
    if (msg.type === 'SYSTEM' || msg.eventType) return
    if (!document.hidden) return  // only fire when tab is in background

    if (soundRef.current) playPing()

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const isMention = currentUsername && msg.content?.includes(`@${currentUsername}`)
      const title = isMention ? `@${currentUsername} in #${roomName}` : `#${roomName}`
      const body  = `${msg.senderDisplayName || msg.senderUsername}: ${(msg.content ?? '').slice(0, 100)}`
      const n = new Notification(title, { body, tag: `room-${msg.roomId}`, icon: '/favicon.svg' })
      n.onclick = () => { window.focus(); n.close() }
    }
  }, [currentUsername])

  return { notify, soundEnabled, toggleSound }
}
