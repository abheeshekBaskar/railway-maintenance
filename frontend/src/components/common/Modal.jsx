import { X } from 'lucide-react'
import { useEffect } from 'react'
export default function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => { const h = e => { if (e.key === 'Escape') onClose() }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h) }, [onClose])
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto shadow-xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
