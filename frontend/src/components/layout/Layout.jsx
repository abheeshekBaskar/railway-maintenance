import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Train, ClipboardList, FileText, Package, AlertTriangle, BarChart3, Bell, BookOpen, Users, ScrollText, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../../services/api'

const nav = [
  { to: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard, roles: ['admin','supervisor','operator','technician'] },
  { to: '/equipment',    label: 'Equipment',        icon: Train,           roles: ['admin','supervisor','operator','technician'] },
  { to: '/tasks',        label: 'Maintenance Tasks',icon: ClipboardList,   roles: ['admin','supervisor','operator','technician'] },
  { to: '/work-orders',  label: 'Work Orders',      icon: FileText,        roles: ['admin','supervisor','operator','technician'] },
  { to: '/inventory',    label: 'Inventory',        icon: Package,         roles: ['admin','supervisor','operator','technician'] },
  { to: '/incidents',    label: 'Incidents',        icon: AlertTriangle,   roles: ['admin','supervisor','operator','technician'] },
  { to: '/reports',      label: 'Reports',          icon: BarChart3,       roles: ['admin','supervisor'] },
  { to: '/notifications',label: 'Notifications',    icon: Bell,            roles: ['admin','supervisor','operator','technician'] },
  { to: '/training',     label: 'Training',         icon: BookOpen,        roles: ['admin','supervisor','operator','technician'] },
  { to: '/users',        label: 'Users',            icon: Users,           roles: ['admin'] },
  { to: '/audit',        label: 'Audit Log',        icon: ScrollText,      roles: ['admin'] },
]

const roleColors = { admin: 'bg-purple-100 text-purple-700', supervisor: 'bg-blue-100 text-blue-700', operator: 'bg-green-100 text-green-700', technician: 'bg-orange-100 text-orange-700' }

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(r => setUnread(r.data.filter(n => !n.is_read).length)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/notifications').then(r => setUnread(r.data.filter(n => !n.is_read).length)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const visible = nav.filter(n => n.roles.includes(user?.role))

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="w-64 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-lg"><Train className="w-5 h-5 text-white"/></div>
            <div>
              <p className="font-semibold text-white text-sm">Railway MS</p>
              <p className="text-xs text-slate-400">Maintenance System</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0"/>
              {label}
              {to === '/notifications' && unread > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <span className={`badge text-xs ${roleColors[user?.role] || 'bg-slate-100 text-slate-600'}`}>{user?.role}</span>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut className="w-4 h-4"/> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto"><div className="p-6 max-w-7xl mx-auto"><Outlet/></div></main>
    </div>
  )
}
