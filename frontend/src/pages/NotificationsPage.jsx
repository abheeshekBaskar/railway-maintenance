// NotificationsPage
import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import api from '../services/api'

const typeColors = { info:'bg-blue-50 border-blue-200', warning:'bg-yellow-50 border-yellow-200', alert:'bg-red-50 border-red-200', success:'bg-green-50 border-green-200' }
const typeIconColors = { info:'text-blue-600', warning:'text-yellow-600', alert:'text-red-600', success:'text-green-600' }

export function NotificationsPage() {
  const [notifs, setNotifs] = useState([]); const [loading, setLoading] = useState(true)
  const load = async () => { try { setNotifs((await api.get('/notifications')).data) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const markAll = async () => { try { await api.put('/notifications/mark-all-read'); load() } catch {} }
  const markOne = async id => { try { await api.put(`/notifications/${id}/read`); load() } catch {} }
  const unread = notifs.filter(n => !n.is_read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Notifications</h1><p className="text-slate-500 text-sm mt-1">{unread} unread</p></div>
        {unread > 0 && <button onClick={markAll} className="btn-secondary flex items-center gap-2"><CheckCheck className="w-4 h-4"/>Mark all read</button>}
      </div>
      {loading ? <div className="text-center py-10 text-slate-400">Loading…</div>
        : notifs.length === 0 ? <div className="card p-10 text-center text-slate-400"><Bell className="w-10 h-10 mx-auto mb-2 opacity-30"/><p>No notifications</p></div>
        : <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.notification_id} className={`card p-4 border-l-4 ${typeColors[n.type] || 'bg-white border-slate-200'} ${n.is_read ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-semibold ${typeIconColors[n.type] || 'text-slate-700'}`}>{n.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && <button onClick={() => markOne(n.notification_id)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">Mark read</button>}
              </div>
            </div>
          ))}
        </div>}
    </div>
  )
}
export default NotificationsPage
