import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

export function usePresence(ws) {
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    client.get('/presence/online')
      .then(r => setOnlineUsers(new Set(r.data.users ?? [])))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!ws?.connected) return
    const unsub = ws.subscribe('/topic/presence', ({ username, online }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        if (online) next.add(username)
        else next.delete(username)
        return next
      })
    })
    return unsub
  }, [ws?.connected]) // eslint-disable-line react-hooks/exhaustive-deps

  const isOnline = useCallback((username) => onlineUsers.has(username), [onlineUsers])

  return { isOnline, onlineUsers }
}
