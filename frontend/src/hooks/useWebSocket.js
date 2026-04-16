import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export function useWebSocket({ token, onMessage, onTyping, roomId }) {
  const clientRef = useRef(null)
  const roomIdRef = useRef(roomId)

  useEffect(() => { roomIdRef.current = roomId }, [roomId])

  useEffect(() => {
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        if (roomIdRef.current) {
          subscribeToRoom(client, roomIdRef.current)
        }
      },
    })

    client.activate()
    clientRef.current = client

    return () => { client.deactivate() }
  }, [token]) // only reconnect when token changes

  const subscribeToRoom = useCallback((client, id) => {
    if (!client?.connected) return

    client.subscribe(`/topic/room/${id}`, (frame) => {
      const msg = JSON.parse(frame.body)
      onMessage?.(msg)
    })

    client.subscribe(`/topic/room/${id}/typing`, (frame) => {
      const event = JSON.parse(frame.body)
      onTyping?.(event)
    })

    // notify server user joined
    client.publish({
      destination: '/app/chat.join',
      body: JSON.stringify({ roomId: id }),
    })
  }, [onMessage, onTyping])

  const joinRoom = useCallback((id) => {
    const client = clientRef.current
    if (!client?.connected) return
    subscribeToRoom(client, id)
  }, [subscribeToRoom])

  const sendMessage = useCallback((roomId, content) => {
    clientRef.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, content, type: 'TEXT' }),
    })
  }, [])

  const sendTyping = useCallback((roomId, typing) => {
    clientRef.current?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, typing }),
    })
  }, [])

  const leaveRoom = useCallback((id) => {
    clientRef.current?.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify({ roomId: id }),
    })
  }, [])

  return { joinRoom, sendMessage, sendTyping, leaveRoom, client: clientRef }
}
