import { useEffect, useState } from 'react'
import { collection, getDocs, getDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { sendStatusUpdate } from '../../lib/email'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered']

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
}

export default function ManageOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  async function loadOrders() {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [])

  async function handleDelete(orderId) {
    if (!window.confirm('Delete this order? This cannot be undone.')) return
    await deleteDoc(doc(db, 'orders', orderId))
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  async function deductInventory(items) {
    for (const item of items) {
      const { id, color, size, quantity } = item
      if (!id || !color || !size || !quantity) continue
      const productRef = doc(db, 'products', id)
      const snap = await getDoc(productRef)
      if (!snap.exists()) continue
      const colorSizes = { ...(snap.data().colorSizes || {}) }
      const colorData = { ...(colorSizes[color] || {}) }
      colorData[size] = Math.max(0, (colorData[size] || 0) - quantity)
      colorSizes[color] = colorData
      const newStock = Object.values(colorSizes).reduce((sum, s) =>
        sum + Object.values(s).reduce((a, q) => a + (q || 0), 0), 0)
      await updateDoc(productRef, { colorSizes, stock: newStock })
    }
  }

  async function updateStatus(orderId, newStatus) {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus })
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o))
    // Deduct inventory only when first marked as delivered
    if (newStatus === 'delivered' && order.status !== 'delivered') {
      deductInventory(order.items || []).catch(console.error)
    }
    sendStatusUpdate(order, newStatus).catch(console.error)
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading…</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light tracking-tight mb-8">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200">
              {/* Order Header */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div>
                  <p className="font-mono text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm font-medium mt-0.5">{order.userEmail}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleDateString()
                      : 'Pending'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                  <select
                    value={order.status}
                    onChange={(e) => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                    className={`text-xs px-2 py-1 rounded border-none focus:outline-none capitalize cursor-pointer ${STATUS_COLORS[order.status]}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-white text-black capitalize">{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(order.id) }}
                    className="text-red-400 hover:text-red-600 transition-colors text-xs px-2 py-1 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                  <span className="text-gray-400 text-sm">{expanded === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Order Details */}
              {expanded === order.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Items</h3>
                      <div className="space-y-1">
                        {order.items?.map((item, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {item.name} — {item.color} / {item.size} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
                      {order.shippingAddress && (
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <p>{order.shippingAddress.name}</p>
                          <p>{order.shippingAddress.address}</p>
                          <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                          <p>{order.shippingAddress.country}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
