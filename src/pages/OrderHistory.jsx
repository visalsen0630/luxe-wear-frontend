import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { downloadInvoicePDF } from '../lib/invoicePdf'

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100  text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100  text-green-700',
  cancelled:  'bg-red-100    text-red-600',
}

const STATUS_ICONS = {
  pending:    'fa-clock',
  processing: 'fa-gear',
  shipped:    'fa-truck',
  delivered:  'fa-circle-check',
  cancelled:  'fa-circle-xmark',
}

export default function OrderHistory() {
  const { currentUser } = useAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Real-time listener — status updates instantly without refresh
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [currentUser])

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light tracking-tight mb-8">My Orders</h1>

      {loading ? (
        <div className="text-center py-24 text-zinc-400">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 text-zinc-400">No orders yet.</div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const date = order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : '—'
            const status  = order.status || 'pending'
            const total   = order.currency === 'khr'
              ? `៛${Math.round(Number(order.total) * 4100).toLocaleString()}`
              : `$${Number(order.total).toFixed(2)}`

            return (
              <div key={order.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">

                {/* Order header */}
                <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-mono text-sm font-semibold text-zinc-800">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">{date}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full capitalize ${STATUS_COLORS[status] || 'bg-zinc-100 text-zinc-600'}`}>
                    <i className={`fa-solid ${STATUS_ICONS[status] || 'fa-circle'} text-[10px]`} />
                    {status}
                  </span>
                </div>

                {/* Items */}
                <div className="px-6 py-3 divide-y divide-zinc-50">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-zinc-800">{item.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {item.color} · {item.size} · ×{item.quantity || item.qty || 1}
                        </p>
                      </div>
                      <p className="text-zinc-700 font-medium">
                        ${(Number(item.price) * (item.quantity || item.qty || 1)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer: total + download */}
                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-zinc-400">Total</p>
                    <p className="font-bold text-zinc-900 text-lg">{total}</p>
                  </div>
                  <button
                    onClick={() => downloadInvoicePDF(order)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium border border-zinc-300 rounded-xl hover:border-black hover:text-black transition-colors text-zinc-600">
                    <i className="fa-solid fa-file-pdf text-zinc-400" />
                    Download Invoice
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
