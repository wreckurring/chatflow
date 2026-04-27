import client from './client'

export const createInvite = (roomId) => client.post(`/rooms/${roomId}/invites`).then(r => r.data)
export const getInvite    = (token)  => client.get(`/invites/${token}`).then(r => r.data)
export const acceptInvite = (token)  => client.post(`/invites/${token}/accept`).then(r => r.data)
