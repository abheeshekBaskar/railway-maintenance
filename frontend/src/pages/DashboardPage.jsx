import { useEffect, useState } from 'react'
import { Train, ClipboardList, AlertTriangle, Package, CheckCircle, Clock, XCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

function KPI({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4"/></div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [health, setHealth] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/reports/summary'), api.get('/reports/equipment-health')])
      .then(([s, h]) => { setSummary(s.data); setHealth(h.data.slice(0, 8)) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, <span className="font-medium">{user?.username}</span> · {user?.role}</p>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI label="Equipment" value={summary.equipment.total} sub={`${summary.equipment.operational} operational`} icon={Train} color="bg-blue-100 text-blue-700"/>
            <KPI label="Avg Health Score" value={`${summary.equipment.avg_health}%`} sub="Across all equipment" icon={CheckCircle} color="bg-green-100 text-green-700"/>
            <KPI label="Open Tasks" value={parseInt(summary.tasks.pending)+parseInt(summary.tasks.in_progress)} sub={`${summary.tasks.critical_open} critical`} icon={ClipboardList} color={summary.tasks.critical_open > 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}/>
            <KPI label="Open Incidents" value={summary.incidents.open} sub={`${summary.incidents.critical} critical`} icon={AlertTriangle} color={summary.incidents.critical > 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}/>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Work Orders</h3>
              <div className="space-y-3">
                {[
                  { label: 'Open', val: summary.work_orders.open, color: 'bg-blue-100 text-blue-700' },
                  { label: 'In Progress', val: summary.work_orders.in_progress, color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Completed', val: summary.work_orders.completed, color: 'bg-green-100 text-green-700' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`badge ${color}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Equipment Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Operational', val: summary.equipment.operational, color: 'bg-green-100 text-green-700' },
                  { label: 'Under Maintenance', val: summary.equipment.under_maintenance, color: 'bg-yellow-100 text-yellow-700' },
                  { label: 'Out of Service', val: summary.equipment.out_of_service, color: 'bg-red-100 text-red-700' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`badge ${color}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Low Stock Items</span>
                  <span className={`badge ${parseInt(summary.low_stock) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{summary.low_stock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Tasks Completed</span>
                  <span className="badge bg-green-100 text-green-700">{summary.tasks.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Critical Open Tasks</span>
                  <span className={`badge ${summary.tasks.critical_open > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{summary.tasks.critical_open}</span>
                </div>
              </div>
            </div>
          </div>

          {health.length > 0 && (
            <div className="card p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Equipment Health Scores</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={health}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50}/>
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`}/>
                  <Tooltip formatter={v => [`${v}%`, 'Health Score']}/>
                  <Bar dataKey="health_score" fill="#1d4ed8" radius={[4,4,0,0]}
                    label={{ position: 'top', fontSize: 10, formatter: v => `${v}%` }}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
