// TasksPage
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'

const priorityColors = { critical:'bg-red-100 text-red-700', high:'bg-orange-100 text-orange-700', medium:'bg-yellow-100 text-yellow-700', low:'bg-slate-100 text-slate-600' }
const statusColors = { pending:'bg-slate-100 text-slate-600', in_progress:'bg-blue-100 text-blue-700', completed:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-500' }
const emptyTask = { title:'', description:'', equipment_id:'', assigned_to:'', priority:'medium', status:'pending', due_date:'', notes:'' }

export function TasksPage() {
  const { hasRole } = useAuth()
  const [tasks, setTasks] = useState([]); const [equipment, setEquipment] = useState([]); const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true); const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyTask); const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = async () => {
    try {
      const [t, e, u] = await Promise.all([api.get('/tasks', { params: { status: filterStatus || undefined } }), api.get('/equipment'), api.get('/users')])
      setTasks(t.data); setEquipment(e.data); setUsers(u.data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filterStatus])

  const openAdd = () => { setForm(emptyTask); setEditId(null); setError(''); setModal(true) }
  const openEdit = t => { setForm({ ...t, due_date: t.due_date ? t.due_date.slice(0,10) : '', equipment_id: t.equipment_id||'', assigned_to: t.assigned_to||'' }); setEditId(t.task_id); setError(''); setModal(true) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editId) await api.put(`/tasks/${editId}`, form)
      else await api.post('/tasks', form)
      setModal(false); load()
    } catch (err) { setError(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this task?')) return
    try { await api.delete(`/tasks/${id}`); load() } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Maintenance Tasks</h1><p className="text-slate-500 text-sm mt-1">{tasks.length} tasks</p></div>
        {hasRole('admin','supervisor','operator') && <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>New Task</button>}
      </div>
      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <select className="input-field w-48" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {['pending','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Task','Equipment','Assigned To','Priority','Status','Due Date',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={7} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
                : tasks.map(t => (
                  <tr key={t.task_id} className="hover:bg-slate-50">
                    <td className="table-cell"><p className="font-medium">{t.title}</p>{t.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{t.notes}</p>}</td>
                    <td className="table-cell text-slate-500 text-xs">{t.equipment_name || '—'}</td>
                    <td className="table-cell">{t.assigned_name || '—'}</td>
                    <td className="table-cell"><span className={`badge ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                    <td className="table-cell"><span className={`badge ${statusColors[t.status]}`}>{t.status?.replace('_',' ')}</span></td>
                    <td className="table-cell text-xs text-slate-500">{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(t)} className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                        {hasRole('admin','supervisor') && <button onClick={() => handleDelete(t.task_id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <Modal title={editId ? 'Edit Task' : 'New Task'} onClose={() => setModal(false)} size="lg">
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
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username} ({u.role})</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select className="input-field" value={form.priority} onChange={f('priority')}>
                  {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select className="input-field" value={form.status} onChange={f('status')}>
                  {['pending','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label><input className="input-field" type="date" value={form.due_date} onChange={f('due_date')}/></div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Task'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default TasksPage
