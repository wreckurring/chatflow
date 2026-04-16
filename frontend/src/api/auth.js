import client from './client'

export const login = (data) => client.post('/auth/login', data).then(r => r.data)
export const register = (data) => client.post('/auth/register', data).then(r => r.data)
export const getMe = () => client.get('/users/me').then(r => r.data)
