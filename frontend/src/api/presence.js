import client from './client'

export const getOnlinePresence = () => client.get('/presence/online').then(r => r.data)
