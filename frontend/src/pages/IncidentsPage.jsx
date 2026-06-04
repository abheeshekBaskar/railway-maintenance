import { useEffect, useState } from 'react'
import { Plus, Edit } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'

const sevColors = { critical:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-slate-100 text-slate-600' }
const statColors = { open:'bg-red-100 text-red-700', investigating:'bg-yellow-100 text-yellow-700', resolved:'bg-green-100 text-green-700', closed:'bg-slate-100 text-slate-500' }
const empty = { title:'', description:'', equipment_id:'', severity:'medium', location:'', resolution:'' }

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]); const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty); const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  const load = async () => {
    try { const [i, e] = await Promise.all([api.get('/incidents'), api.get('/equipment')]); setIncidents(i.data); setEquipment(e.data) }
    catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = i => { setForm({ ...i, equipment_id: i.equipment_id || '' }); setEditId(i.incident_id); setError(''); setModal(true) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) await api.put(`/incidents/${editId}`, form)
      else await api.post('/incidents', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Incidents</h1><p className="text-slate-500 text-sm mt-1">{incidents.filter(i => i.status === 'open').length} open incidents</p></div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Report Incident</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Title','Equipment','Reported By','Severity','Status','Location','Occurred At',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={8} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
              : incidents.map(i => (
                <tr key={i.incident_id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{i.title}</td>
                  <td className="table-cell text-xs text-slate-500">{i.equipment_name || '—'}</td>
                  <td className="table-cell">{i.reporter_name || '—'}</td>
                  <td className="table-cell"><span className={`badge ${sevColors[i.severity]}`}>{i.severity}</span></td>
                  <td className="table-cell"><span className={`badge ${statColors[i.status]}`}>{i.status}</span></td>
                  <td className="table-cell text-slate-500">{i.location || '—'}</td>
                  <td className="table-cell text-xs text-slate-500">{new Date(i.occurred_at).toLocaleDateString()}</td>
                  <td className="table-cell"><button onClick={() => openEdit(i)} className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editId ? 'Edit Incident' : 'Report Incident'} onClose={() => setModal(false)} size="lg">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input className="input-field" value={form.title} onChange={f('title')} required/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={f('description')}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Equipment</label>
                <select className="input-field" value={form.equipment_id} onChange={f('equipment_id')}>
                  <option value="">None</option>
                  {equipment.map(e => <option key={e.equipment_id} value={e.equipment_id}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Location</label><input className="input-field" value={form.location} onChange={f('location')}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                <select className="input-field" value={form.severity} onChange={f('severity')}>
                  {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {editId && <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={f('status')}>
                  {['open','investigating','resolved','closed'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>}
            </div>
            {editId && <div><label className="block text-sm font-medium text-slate-700 mb-1">Resolution</label><textarea className="input-field" rows={2} value={form.resolution || ''} onChange={f('resolution')}/></div>}
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : editId ? 'Update Incident' : 'Report Incident'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
