// InventoryPage
import { useEffect, useState } from 'react'
import { Plus, Edit, RefreshCw } from 'lucide-react'
import api from '../services/api'
import Modal from '../components/common/Modal'

export function InventoryPage() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null); const [form, setForm] = useState({})
  const [editId, setEditId] = useState(null); const [saving, setSaving] = useState(false)
  const [restockId, setRestockId] = useState(null); const [restockQty, setRestockQty] = useState('')

  const load = async () => { try { setItems((await api.get('/inventory')).data) } catch {} finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const empty = { name:'', item_code:'', category:'', unit:'pcs', quantity:0, reorder_level:10, unit_cost:0, supplier:'', location:'' }
  const openAdd = () => { setForm(empty); setEditId(null); setModal('form') }
  const openEdit = i => { setForm({ ...i }); setEditId(i.item_id); setModal('form') }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      if (editId) await api.put(`/inventory/${editId}`, form)
      else await api.post('/inventory', form)
      setModal(null); load()
    } catch (err) { alert(err.response?.data?.error || 'Failed') }
    finally { setSaving(false) }
  }

  const handleRestock = async () => {
    if (!restockQty || restockQty < 1) return
    try { await api.post(`/inventory/${restockId}/restock`, { quantity: parseInt(restockQty) }); setModal(null); setRestockQty(''); load() }
    catch (err) { alert(err.response?.data?.error || 'Failed') }
  }

  const lowCount = items.filter(i => i.quantity <= i.reorder_level).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Spare Parts</h1>
          {lowCount > 0 && <p className="text-red-600 text-sm mt-1">⚠ {lowCount} items below reorder level</p>}
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/>Add Item</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['Item','Code','Category','Location','In Stock','Reorder At','Unit Cost','Supplier',''].map(h => <th key={h} className="table-header">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={9} className="table-cell text-center py-10 text-slate-400">Loading…</td></tr>
              : items.map(i => {
                const low = i.quantity <= i.reorder_level
                return (
                  <tr key={i.item_id} className={`hover:bg-slate-50 ${low ? 'bg-red-50/30' : ''}`}>
                    <td className="table-cell font-medium">{i.name}</td>
                    <td className="table-cell font-mono text-xs text-slate-500">{i.item_code}</td>
                    <td className="table-cell">{i.category || '—'}</td>
                    <td className="table-cell text-slate-500">{i.location || '—'}</td>
                    <td className="table-cell"><span className={`font-bold ${low ? 'text-red-600' : 'text-green-700'}`}>{i.quantity} {i.unit}</span></td>
                    <td className="table-cell text-slate-500">{i.reorder_level}</td>
                    <td className="table-cell">${Number(i.unit_cost).toFixed(2)}</td>
                    <td className="table-cell text-slate-500">{i.supplier || '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(i)} className="text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => { setRestockId(i.item_id); setModal('restock') }} className="text-slate-400 hover:text-green-600" title="Restock"><RefreshCw className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Item' : 'Add Item'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input className="input-field" value={form.name} onChange={f('name')} required/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Item Code *</label><input className="input-field" value={form.item_code} onChange={f('item_code')} required/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Category</label><input className="input-field" value={form.category} onChange={f('category')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit</label><input className="input-field" value={form.unit} onChange={f('unit')}/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label><input className="input-field" type="number" min="0" value={form.quantity} onChange={f('quantity')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label><input className="input-field" type="number" min="0" value={form.reorder_level} onChange={f('reorder_level')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Unit Cost ($)</label><input className="input-field" type="number" min="0" step="0.01" value={form.unit_cost} onChange={f('unit_cost')}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label><input className="input-field" value={form.supplier} onChange={f('supplier')}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Location</label><input className="input-field" value={form.location} onChange={f('location')}/></div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Item'}</button>
            </div>
          </form>
        </Modal>
      )}
      {modal === 'restock' && (
        <Modal title="Restock Item" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Add *</label>
              <input className="input-field" type="number" min="1" value={restockQty} onChange={e => setRestockQty(e.target.value)}/>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleRestock} className="btn-primary">Confirm Restock</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
export default InventoryPage
