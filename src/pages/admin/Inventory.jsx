import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(null)

  useEffect(() => {
    getDocs(query(collection(db, 'products'), orderBy('name'))).then(snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  async function updateStock(id, value) {
    const stock = parseInt(value)
    if (isNaN(stock) || stock < 0) return
    setSaving(id)
    await updateDoc(doc(db, 'products', id), { stock })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock } : p))
    setSaving(null)
  }

  const totalStock   = products.reduce((s, p) => s + (parseInt(p.stock) || 0), 0)
  const lowStock     = products.filter(p => (parseInt(p.stock) || 0) <= 5)
  const outOfStock   = products.filter(p => (parseInt(p.stock) || 0) === 0)

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400 text-sm animate-pulse">
      Loading inventory…
    </div>
  )

  return (
    <div className="p-6 space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Stock',  value: totalStock,          icon: 'fa-boxes-stacked', bg: 'bg-blue-50',   text: 'text-blue-500' },
          { label: 'Low Stock',    value: lowStock.length,     icon: 'fa-triangle-exclamation', bg: 'bg-yellow-50', text: 'text-yellow-500' },
          { label: 'Out of Stock', value: outOfStock.length,   icon: 'fa-ban',           bg: 'bg-red-50',    text: 'text-red-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-zinc-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${c.bg}`}>
              <i className={`fa-solid ${c.icon} text-sm ${c.text}`} />
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Stock Levels</h2>
            <p className="text-xs text-zinc-400">{products.length} products</p>
          </div>
        </div>
        <div className="divide-y divide-zinc-50">
          {products.map(p => {
            const stock = parseInt(p.stock) || 0
            const status = stock === 0 ? { label: 'Out of stock', color: 'bg-red-100 text-red-600' }
                         : stock <= 5  ? { label: 'Low stock',    color: 'bg-yellow-100 text-yellow-600' }
                         :               { label: 'In stock',     color: 'bg-green-100 text-green-600' }
            return (
              <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                {p.imageUrl
                  ? <img src={p.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  : <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-shirt text-zinc-300 text-sm" />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-800 truncate">{p.name}</div>
                  <div className="text-xs text-zinc-400">{p.category} · ${p.price}</div>
                </div>
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                  {status.label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number" min="0" defaultValue={stock}
                    onBlur={e => updateStock(p.id, e.target.value)}
                    className="w-20 text-center border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-black transition-colors"
                  />
                  {saving === p.id && <i className="fa-solid fa-circle-notch fa-spin text-zinc-400 text-xs" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
