import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Train, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [show, setShow] = useState(false)
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const { login } = useAuth(); const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/dashboard') }
    catch (err) { setError(err.response?.data?.error || 'Login failed') }
    finally { setLoading(false) }
  }

  const demos = [
    { label: 'Admin', email: 'admin@railway.com', pass: 'Admin@123', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { label: 'Supervisor', email: 'supervisor@railway.com', pass: 'Super@123', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Operator', email: 'operator@railway.com', pass: 'Oper@123', color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Technician', email: 'tech@railway.com', pass: 'Tech@123', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-700 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"><Train className="w-7 h-7 text-white"/></div>
            <h1 className="text-2xl font-bold text-slate-900">Railway Maintenance System</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@railway.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input-field pr-10" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"/>
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs text-slate-500 mb-3 font-medium">Demo credentials — click to fill:</p>
            <div className="space-y-2">
              {demos.map(d => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPassword(d.pass) }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border ${d.color} hover:opacity-80 transition-opacity`}>
                  <span className="font-semibold">{d.label}:</span> {d.email} / {d.pass}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
