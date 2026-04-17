import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

/**
 * Single persistent STOMP connection for the app session.
 * - Connection lives as long as token is valid.
 * - Subscriptions are tracked per room; old ones are cleaned up.
 * - Callbacks are stored in refs so they never go stale inside STOMP frames.
 */
export function useWebSocket({ token, onMessage, onTyping }) {
  const clientRef   = useRef(null)
  const subsRef     = useRef({})       // roomId → { msgSub, typingSub }
  const pendingJoin = useRef(null)     // roomId to subscribe once connected
  const onMsgRef    = useRef(onMessage)
  const onTypRef    = useRef(onTyping)
  const [connected, setConnected] = useState(false)

  // Keep callback refs fresh every render — no stale closures
  useEffect(() => { onMsgRef.current = onMessage }, [onMessage])
  useEffect(() => { onTypRef.current = onTyping  }, [onTyping])

  useEffect(() => {
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      onConnect: () => {
        clientRef.current = client
        setConnected(true)
        // flush pending join
        if (pendingJoin.current != null) {
          _subscribe(client, pendingJoin.current)
          pendingJoin.current = null
        }
      },
      onDisconnect: () => {
        subsRef.current = {}
        setConnected(false)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      subsRef.current = {}
      pendingJoin.current = null
      client.deactivate()
    }
  }, [token])

  // Internal subscribe — always use ref callbacks
  const _subscribe = (client, roomId) => {
    // Unsubscribe existing for this room if any
    const existing = subsRef.current[roomId]
    if (existing) {
      existing.msgSub?.unsubscribe()
      existing.typingSub?.unsubscribe()
    }

    const msgSub = client.subscribe(`/topic/room/${roomId}`, (frame) => {
      try { onMsgRef.current?.(JSON.parse(frame.body)) } catch {}
    })

    const typingSub = client.subscribe(`/topic/room/${roomId}/typing`, (frame) => {
      try { onTypRef.current?.(JSON.parse(frame.body)) } catch {}
    })

    subsRef.current[roomId] = { msgSub, typingSub }

    client.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({ roomId }),
    })
  }

  const joinRoom = useCallback((roomId) => {
    const client = clientRef.current
    if (client?.connected) {
      _subscribe(client, roomId)
    } else {
      // Will be flushed once onConnect fires
      pendingJoin.current = roomId
    }
  }, [])

  const leaveRoom = useCallback((roomId) => {
    const client = clientRef.current
    const subs = subsRef.current[roomId]
    if (subs) {
      subs.msgSub?.unsubscribe()
      subs.typingSub?.unsubscribe()
      delete subsRef.current[roomId]
    }
    client?.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify({ roomId }),
    })
  }, [])

  const sendMessage = useCallback((roomId, content, replyToId = null) => {
    clientRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, content, type: 'TEXT', ...(replyToId ? { replyToId } : {}) }),
    })
  }, [])

  const sendTyping = useCallback((roomId, typing) => {
    clientRef.current?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, typing }),
    })
  }, [])

  return { joinRoom, leaveRoom, sendMessage, sendTyping, connected }
}
