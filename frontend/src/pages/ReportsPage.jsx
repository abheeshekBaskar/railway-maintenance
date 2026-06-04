import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import api from '../services/api'

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [health, setHealth] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/reports/summary'), api.get('/reports/equipment-health'), api.get('/reports/maintenance-trend')])
      .then(([s, h, t]) => { setSummary(s.data); setHealth(h.data); setTrend(t.data.map(d => ({ ...d, date: new Date(d.date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) }))) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1></div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Equipment', value: summary.equipment.total, sub:`Avg health: ${summary.equipment.avg_health}%`, color:'bg-blue-100 text-blue-700' },
            { label:'Open Tasks', value: parseInt(summary.tasks.pending)+parseInt(summary.tasks.in_progress), sub:`${summary.tasks.critical_open} critical`, color:'bg-orange-100 text-orange-700' },
            { label:'Open Work Orders', value: summary.work_orders.open, sub:`${summary.work_orders.completed} completed`, color:'bg-purple-100 text-purple-700' },
            { label:'Open Incidents', value: summary.incidents.open, sub:`${summary.incidents.critical} critical`, color: summary.incidents.critical > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="card p-5">
              <p className="text-sm font-medium text-slate-500 mb-2">{label}</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Equipment Health Scores</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={health} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10 }} tickFormatter={v => `${v}%`}/>
              <YAxis dataKey="name" type="category" tick={{ fontSize:9 }} width={130}/>
              <Tooltip formatter={v => [`${v}%`, 'Health']}/>
              <Bar dataKey="health_score" fill="#1d4ed8" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Tasks Completed — Last 30 Days</h2>
          {trend.length === 0
            ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No completed tasks in the last 30 days</div>
            : <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{ fontSize:10 }}/>
                <YAxis tick={{ fontSize:11 }}/>
                <Tooltip/>
                <Line type="monotone" dataKey="completed" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Completed Tasks"/>
              </LineChart>
            </ResponsiveContainer>}
        </div>
      </div>

      <div className="card">
        <div className="p-5 border-b border-slate-200"><h2 className="text-base font-semibold text-slate-900">Equipment Status Overview</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Equipment','Code','Type','Status','Health','Last Maintenance','Next Maintenance'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {health.map(e => (
                <tr key={e.equipment_code} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{e.name}</td>
                  <td className="table-cell font-mono text-xs text-slate-500">{e.equipment_code}</td>
                  <td className="table-cell capitalize">{e.type?.replace('_',' ')}</td>
                  <td className="table-cell"><span className={`badge capitalize ${e.status === 'operational' ? 'bg-green-100 text-green-700' : e.status === 'under_maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{e.status?.replace('_',' ')}</span></td>
                  <td className="table-cell"><span className={`font-bold ${e.health_score >= 80 ? 'text-green-600' : e.health_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{e.health_score}%</span></td>
                  <td className="table-cell text-xs text-slate-500">{e.last_maintenance ? new Date(e.last_maintenance).toLocaleDateString() : '—'}</td>
                  <td className="table-cell text-xs text-slate-500">{e.next_maintenance ? new Date(e.next_maintenance).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
