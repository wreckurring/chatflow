import client from './client'

export const getMe = () => client.get('/users/me').then(r => r.data)
export const getUser = (username) => client.get(`/users/${username}`).then(r => r.data)
export const openDm = (username) => client.post(`/users/${username}/dm`).then(r => r.data)
