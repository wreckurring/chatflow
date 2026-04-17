import client from './client'

export const getRoomHistory = (roomId, page = 0, size = 50) =>
  client.get(`/messages/room/${roomId}?page=${page}&size=${size}`).then(r => r.data)

export const editMessage = (id, content) =>
  client.patch(`/messages/${id}`, { content }).then(r => r.data)

export const deleteMessage = (id) =>
  client.delete(`/messages/${id}`)

export const toggleReaction = (id, emoji) =>
  client.post(`/messages/${id}/reactions`, { emoji }).then(r => r.data)

export const searchMessages = (roomId, q) =>
  client.get(`/messages/room/${roomId}/search?q=${encodeURIComponent(q)}`).then(r => r.data)
