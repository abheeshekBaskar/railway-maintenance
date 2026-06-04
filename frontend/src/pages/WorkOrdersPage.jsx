import { useEffect, useState } from 'react'
import { Plus, Edit } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'

const priorityColors = { critical:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-slate-100 text-slate-600' }
const statusColors = { open:'bg-blue-100 text-blue-700', approved:'bg-purple-100 text-purple-700', in_progress:'bg-yellow-100 text-yellow-700', completed:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-500' }
const typeColors = { corrective:'bg-orange-100 text-orange-700', preventive:'bg-blue-100 text-blue-700', inspection:'bg-slate-100 text-slate-600', emergency:'bg-red-100 text-red-700' }
const empty = { title:'', description:'', equipment_id:'', assigned_to:'', priority:'medium', status:'open', type:'corrective', estimated_hours:'', due_date:'' }

export default function WorkOrdersPage() {
  const { hasRole } = useAuth()
  const [wos, setWos] = useState([]); const [equipment, setEquipment] = useState([]); const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty); const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  const load = async () => {
    try {
      const [w, e, u] = await Promise.all([api.get('/work-orders'), api.get('/equipment'), api.get('/users')])
      setWos(w.data); setEquipment(e.data); setUsers(u.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(empty); setEditId(null); setError(''); setModal(true) }
  const openEdit = w => { setForm({ ...w, due_date: w.due_date ? w.due_date.slice(0,10) : '', equipment_id: w.equipment_id||'', assigned_to: w.assigned_to||'' }); setEditId(w.work_order_id); setError(''); setModal(true) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) await api.put(`/work-orders/${editId}`, form)
      else await api.post('/work-orders', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Work Orders</h1><p className="text-slate-500 text-sm mt-1">{wos.length} work orders</p></div>
        {hasRole('admin','supervisor','operator') && <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>New Work Order</button>}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['WO Code','Title','Equipment','Assigned','Type','Priority','Status','Est. Hours',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={9} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
              : wos.map(w => (
                <tr key={w.work_order_id} className="hover:bg-slate-50">
                  <td className="table-cell font-mono text-xs">{w.work_order_code}</td>
                  <td className="table-cell font-medium">{w.title}</td>
                  <td className="table-cell text-xs text-slate-500">{w.equipment_name || '—'}</td>
                  <td className="table-cell">{w.assigned_name || '—'}</td>
                  <td className="table-cell"><span className={`badge ${typeColors[w.type]}`}>{w.type}</span></td>
                  <td className="table-cell"><span className={`badge ${priorityColors[w.priority]}`}>{w.priority}</span></td>
                  <td className="table-cell"><span className={`badge ${statusColors[w.status]}`}>{w.status?.replace('_',' ')}</span></td>
                  <td className="table-cell">{w.estimated_hours ? `${w.estimated_hours}h` : '—'}</td>
                  <td className="table-cell"><button onClick={() => openEdit(w)} className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={editId ? 'Edit Work Order' : 'New Work Order'} onClose={() => setModal(false)} size="lg">
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
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                <select className="input-field" value={form.assigned_to} onChange={f('assigned_to')}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="input-field" value={form.type} onChange={f('type')}>
                  {['corrective','preventive','inspection','emergency'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select className="input-field" value={form.priority} onChange={f('priority')}>
                  {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={f('status')}>
                  {['open','approved','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Est. Hours</label><input className="input-field" type="number" min="0" step="0.5" value={form.estimated_hours} onChange={f('estimated_hours')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label><input className="input-field" type="date" value={form.due_date} onChange={f('due_date')}/></div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Work Order'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
