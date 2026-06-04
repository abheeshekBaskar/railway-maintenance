// AuditPage
import { useEffect, useState } from 'react'
import api from '../services/api'

export function AuditPage() {
  const [logs, setLogs] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/audit').then(r => setLogs(r.data)).catch(console.error).finally(() => setLoading(false)) }, [])
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Audit Log</h1><p className="text-slate-500 text-sm mt-1">Last 100 system actions</p></div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['User','Action','Entity','Entity ID','IP','Timestamp'].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
              : logs.length === 0 ? <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">No audit entries yet</td></tr>
              : logs.map(l => (
                <tr key={l.log_id} className="hover:bg-slate-50">
                  <td className="table-cell">{l.username || '—'}</td>
                  <td className="table-cell font-mono text-xs">{l.action}</td>
                  <td className="table-cell text-slate-500">{l.entity || '—'}</td>
                  <td className="table-cell text-slate-500">{l.entity_id || '—'}</td>
                  <td className="table-cell text-xs text-slate-400">{l.ip_address || '—'}</td>
                  <td className="table-cell text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default AuditPage
