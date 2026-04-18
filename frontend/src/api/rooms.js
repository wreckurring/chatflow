import client from './client'

export const getPublicRooms = () => client.get('/rooms').then(r => r.data)
export const getMyRooms = () => client.get('/rooms/my-rooms').then(r => r.data)
export const getRoomById = (id) => client.get(`/rooms/${id}`).then(r => r.data)
export const createRoom = (data) => client.post('/rooms', data).then(r => r.data)
export const joinRoom = (id) => client.post(`/rooms/${id}/join`).then(r => r.data)
export const leaveRoom = (id) => client.delete(`/rooms/${id}/leave`).then(r => r.data)
export const searchRooms   = (q) => client.get(`/rooms/search?q=${encodeURIComponent(q)}`).then(r => r.data)
export const getRoomMembers = (id) => client.get(`/rooms/${id}/members`).then(r => r.data)
export const updateRoom = (id, data) => client.patch(`/rooms/${id}`, data).then(r => r.data)
export const deleteRoom = (id) => client.delete(`/rooms/${id}`)
export const getPinnedMessages = (id) => client.get(`/rooms/${id}/pins`).then(r => r.data)
export const togglePin = (roomId, messageId) => client.post(`/rooms/${roomId}/pins/${messageId}`)
