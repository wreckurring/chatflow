import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  const signIn = useCallback((authResponse) => {
    localStorage.setItem('token', authResponse.token)
    localStorage.setItem('user', JSON.stringify({
      username: authResponse.username,
      email: authResponse.email,
      displayName: authResponse.displayName,
    }))
    setToken(authResponse.token)
    setUser({ username: authResponse.username, email: authResponse.email, displayName: authResponse.displayName })
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
