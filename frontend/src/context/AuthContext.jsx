import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (localStorage.getItem('token')) {
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => logout()).finally(() => setLoading(false))
    } else setLoading(false)
  }, [])
  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', r.data.token); localStorage.setItem('user', JSON.stringify(r.data.user))
    setUser(r.data.user); return r.data.user
  }
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null) }
  const hasRole = (...roles) => roles.includes(user?.role)
  return <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
