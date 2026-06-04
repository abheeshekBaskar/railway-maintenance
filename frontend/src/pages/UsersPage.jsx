// UsersPage
import { useEffect, useState } from 'react'
import { Edit } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'

const roleColors = { admin:'bg-purple-100 text-purple-700', supervisor:'bg-blue-100 text-blue-700', operator:'bg-green-100 text-green-700', technician:'bg-orange-100 text-orange-700' }

export function UsersPage() {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [form, setForm] = useState({}); const [editId, setEditId] = useState(null)

  const load = async () => { try { setUsers((await api.get('/users')).data) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const openEdit = u => { setForm({ ...u }); setEditId(u.user_id); setModal(true) }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    try { await api.put(`/users/${editId}`, form); setModal(false); load() }
    catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">Users</h1><p className="text-slate-500 text-sm mt-1">{users.length} system users</p></div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Username','Email','Role','Status','Created',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
              : users.map(u => (
                <tr key={u.user_id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">{u.username}</td>
                  <td className="table-cell text-slate-500">{u.email}</td>
                  <td className="table-cell"><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td className="table-cell"><span className={`badge ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span></td>
                  <td className="table-cell text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="table-cell"><button onClick={() => openEdit(u)} className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Edit User" onClose={() => setModal(false)} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Username</label><input className="input-field" value={form.username} onChange={f('username')} required/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input className="input-field" type="email" value={form.email} onChange={f('email')} required/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select className="input-field" value={form.role} onChange={f('role')}>
                {['admin','supervisor','operator','technician'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={f('status')}>
                <option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
export default UsersPage
