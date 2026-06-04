import { useEffect, useState } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'
import { useAuth } from '../context/AuthContext'

const typeColors = { document:'bg-blue-100 text-blue-700', video:'bg-purple-100 text-purple-700', guide:'bg-green-100 text-green-700', procedure:'bg-orange-100 text-orange-700' }

export default function TrainingPage() {
  const { hasRole } = useAuth()
  const [resources, setResources] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false); const [form, setForm] = useState({ title:'', description:'', category:'', type:'document', url:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => { try { setResources((await api.get('/training')).data) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/training', form); setModal(false); setForm({ title:'', description:'', category:'', type:'document', url:'' }); load() }
    catch (err) { alert(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }
  const handleDelete = async id => {
    if (!window.confirm('Delete this resource?')) return
    try { await api.delete(`/training/${id}`); load() } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-slate-900">Training Resources</h1><p className="text-slate-500 text-sm mt-1">{resources.length} resources</p></div>
        {hasRole('admin','supervisor') && <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Add Resource</button>}
      </div>
      {loading ? <div className="text-center py-10 text-slate-400">Loading…</div>
        : resources.length === 0 ? <div className="card p-10 text-center text-slate-400"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30"/><p>No training resources</p></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(r => (
            <div key={r.resource_id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${typeColors[r.type] || 'bg-slate-100 text-slate-600'}`}>{r.type}</span>
                {hasRole('admin') && <button onClick={() => handleDelete(r.resource_id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{r.title}</h3>
              {r.category && <p className="text-xs text-slate-500 mb-2">{r.category}</p>}
              {r.description && <p className="text-xs text-slate-600 mb-3 line-clamp-2">{r.description}</p>}
              <p className="text-xs text-slate-400">Added by {r.created_by_name} · {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>}
      {modal && (
        <Modal title="Add Training Resource" onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Title *</label><input className="input-field" value={form.title} onChange={f('title')} required/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><input className="input-field" value={form.category} onChange={f('category')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select className="input-field" value={form.type} onChange={f('type')}>
                  {['document','video','guide','procedure'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea className="input-field" rows={2} value={form.description} onChange={f('description')}/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">URL / Link</label><input className="input-field" value={form.url} onChange={f('url')}/></div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Add Resource'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
