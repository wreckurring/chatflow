import axios from 'axios'
import { toast } from '../components/shared/Toast'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.reload()
      return Promise.reject(err)
    }
    // Network error (no response) — show a toast
    if (!err.response) {
      toast('Network error — check your connection')
    }
    return Promise.reject(err)
  }
)

export default client
