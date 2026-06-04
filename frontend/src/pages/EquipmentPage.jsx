import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'

const statusColors = { operational:'bg-green-100 text-green-700', under_maintenance:'bg-yellow-100 text-yellow-700', out_of_service:'bg-red-100 text-red-700', decommissioned:'bg-slate-100 text-slate-500' }
const healthColor = s => s >= 80 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-600'
const empty = { name:'', equipment_code:'', type:'locomotive', manufacturer:'', model:'', serial_number:'', location:'', status:'operational', health_score:100, notes:'', next_maintenance:'' }

export default function EquipmentPage() {
  const { hasRole } = useAuth()
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(false); const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null); const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  const load = async () => {
    try { const r = await api.get('/equipment', { params: { search, status: filterStatus || undefined } }); setItems(r.data) }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [search, filterStatus])

  const openAdd = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = i => { setForm({ ...i, health_score: i.health_score, next_maintenance: i.next_maintenance ? i.next_maintenance.slice(0,10) : '' }); setEditId(i.equipment_id); setError(''); setModal(true) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) await api.put(`/equipment/${editId}`, form)
      else await api.post('/equipment', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this equipment?')) return
    try { await api.delete(`/equipment/${id}`); load() } catch (e) { alert(e.response?.data?.error || 'Delete failed') }
  }

  const canEdit = hasRole('admin', 'operator')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Equipment</h1><p className="text-slate-500 text-sm mt-1">{items.length} items</p></div>
        {canEdit && <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Add Equipment</button>}
      </div>

      <div className="card mb-4">
        <div className="p-4 border-b border-slate-200 flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input className="input-field pl-9" placeholder="Search equipment…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="input-field w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="out_of_service">Out of Service</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Equipment','Code','Type','Location','Health','Status','Next Maintenance',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={8} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
                : items.length === 0 ? <tr><td colSpan={8} className="table-cell text-center py-10 text-slate-400">No equipment found</td></tr>
                : items.map(i => (
                  <tr key={i.equipment_id} className="hover:bg-slate-50">
                    <td className="table-cell font-medium">{i.name}</td>
                    <td className="table-cell font-mono text-xs text-slate-500">{i.equipment_code}</td>
                    <td className="table-cell capitalize">{i.type?.replace('_',' ')}</td>
                    <td className="table-cell text-slate-500">{i.location || '—'}</td>
                    <td className="table-cell"><span className={`font-bold ${healthColor(i.health_score)}`}>{i.health_score}%</span></td>
                    <td className="table-cell"><span className={`badge capitalize ${statusColors[i.status] || 'bg-slate-100 text-slate-500'}`}>{i.status?.replace('_',' ')}</span></td>
                    <td className="table-cell text-xs text-slate-500">{i.next_maintenance ? new Date(i.next_maintenance).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      {canEdit && <div className="flex gap-2">
                        <button onClick={() => openEdit(i)} className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(i.equipment_id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                      </div>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={editId ? 'Edit Equipment' : 'Add Equipment'} onClose={() => setModal(false)} size="lg">
          {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input className="input-field" value={form.name} onChange={f('name')} required/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Equipment Code *</label><input className="input-field font-mono" value={form.equipment_code} onChange={f('equipment_code')} required/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                <select className="input-field" value={form.type} onChange={f('type')}>
                  {['locomotive','freight_car','track','signal','infrastructure','other'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={f('status')}>
                  {['operational','under_maintenance','out_of_service','decommissioned'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label><input className="input-field" value={form.manufacturer} onChange={f('manufacturer')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Model</label><input className="input-field" value={form.model} onChange={f('model')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Serial Number</label><input className="input-field" value={form.serial_number} onChange={f('serial_number')}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Location</label><input className="input-field" value={form.location} onChange={f('location')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Health Score (0-100)</label><input className="input-field" type="number" min="0" max="100" value={form.health_score} onChange={f('health_score')}/></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Next Maintenance Date</label><input className="input-field" type="date" value={form.next_maintenance} onChange={f('next_maintenance')}/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><textarea className="input-field" rows={2} value={form.notes} onChange={f('notes')}/></div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Equipment'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
