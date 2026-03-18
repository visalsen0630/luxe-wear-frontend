import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
}

export default function OrderHistory() {
  const { currentUser } = useAuth()
  const { state } = useLocation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [currentUser])

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light tracking-tight mb-2">Order History</h1>

      {state?.success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded text-sm mb-6">
          Your order has been placed successfully!
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No orders yet.</div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-gray-400 font-mono">#{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleDateString()
                      : 'Pending'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 text-sm">
                    <p>
                      {item.name} — {item.color} / {item.size} × {item.quantity}
                    </p>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-4 font-medium text-sm border-t border-gray-100 pt-3">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
