import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'

const STATUS_COLORS = {
  pending:    'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped:    'bg-purple-100 text-purple-700',
  delivered:  'bg-green-100 text-green-700',
}

const RANGES = [
  { label: 'Yesterday',     key: 'yesterday' },
  { label: 'Today',         key: 'today' },
  { label: 'Last 7 days',   key: '7days' },
  { label: 'Last 3 months', key: '3months' },
  { label: 'Custom',        key: 'custom' },
]

function getRange(key, customFrom, customTo) {
  const now = new Date()
  const start = new Date()
  if (key === 'today') {
    start.setHours(0, 0, 0, 0)
    return { from: start, to: now }
  }
  if (key === 'yesterday') {
    const s = new Date(); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0)
    const e = new Date(); e.setDate(e.getDate() - 1); e.setHours(23, 59, 59, 999)
    return { from: s, to: e }
  }
  if (key === '7days') { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); return { from: start, to: now } }
  if (key === '3months') { start.setMonth(start.getMonth() - 3); start.setHours(0, 0, 0, 0); return { from: start, to: now } }
  if (key === 'custom' && customFrom && customTo) return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') }
  return { from: new Date(0), to: now }
}

export default function AdminPanel() {
  const [orders, setOrders]       = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [range, setRange]         = useState('7days')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]     = useState('')

  useEffect(() => {
    async function load() {
      const [ordersSnap, productsSnap] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'products')),
      ])
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  // ── Filter by range ──────────────────────────────────────────────────────────
  const { from, to } = getRange(range, customFrom, customTo)
  const filtered = orders.filter(o => {
    if (!o.createdAt) return false
    const t = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
    return t >= from && t <= to
  })

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalOrders   = filtered.length
  const totalRevenue  = filtered.reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
  const pendingOrders = filtered.filter(o => !o.status || o.status === 'pending').length
  const totalProducts = products.length

  // ── Sales last 7 days ────────────────────────────────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const salesByDay = last7.map(day => {
    const dayStr = day.toDateString()
    const dayOrders = filtered.filter(o => {
      if (!o.createdAt) return false
      const t = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
      return t.toDateString() === dayStr
    })
    return {
      label:   day.toLocaleDateString('en-US', { weekday: 'short' }),
      count:   dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
    }
  })
  const maxRevenue = Math.max(...salesByDay.map(d => d.revenue), 1)

  // ── Status breakdown ─────────────────────────────────────────────────────────
  const statusCounts = {
    pending:    filtered.filter(o => !o.status || o.status === 'pending').length,
    processing: filtered.filter(o => o.status === 'processing').length,
    shipped:    filtered.filter(o => o.status === 'shipped').length,
    delivered:  filtered.filter(o => o.status === 'delivered').length,
  }

  // ── Top products ─────────────────────────────────────────────────────────────
  const productSales = {}
  filtered.forEach(o => {
    ;(o.items || []).forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 }
      const q = item.quantity || item.qty || 1
      productSales[item.name].qty     += q
      productSales[item.name].revenue += parseFloat(item.price || 0) * q
    })
  })
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5)
  const maxQty = Math.max(...topProducts.map(([, v]) => v.qty), 1)

  const recentOrders = filtered.slice(0, 6)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-sm text-zinc-400 animate-pulse">Loading dashboard…</div>
    </div>
  )

  return (
    <div className="bg-zinc-50 w-full overflow-x-hidden">


      <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Date range filter ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                range === r.key ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}>
              {r.key === 'custom' && <i className="fa-regular fa-calendar text-xs" />}
              {r.label}
            </button>
          ))}
          {range === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-black" />
              <span className="text-zinc-400 text-sm">to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-black" />
            </div>
          )}
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders',  value: totalOrders,                    icon: 'fa-box',            iconBg: 'bg-blue-50 text-blue-500',   alert: false },
            { label: 'Revenue (USD)', value: `$${totalRevenue.toFixed(2)}`,  icon: 'fa-dollar-sign',    iconBg: 'bg-emerald-50 text-emerald-500', alert: false },
            { label: 'Pending',       value: pendingOrders,                  icon: 'fa-clock',          iconBg: 'bg-yellow-50 text-yellow-500', alert: pendingOrders > 0 },
            { label: 'Avg Order',     value: totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : '$0.00', icon: 'fa-chart-line', iconBg: 'bg-purple-50 text-purple-500', alert: false },
          ].map(c => (
            <div key={c.label}
              className={`bg-white rounded-2xl p-5 border transition-shadow hover:shadow-sm ${c.alert ? 'border-yellow-300' : 'border-zinc-100'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                  <i className={`fa-solid ${c.icon} text-sm`} />
                </div>
                {c.alert && (
                  <span className="text-[10px] font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Action needed
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-zinc-900 tabular-nums">{c.value}</div>
              <div className="text-xs text-zinc-400 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Revenue chart + Status ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar chart */}
          <div className="lg:col-span-2 rounded-2xl p-6 bg-white border border-zinc-300 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800">Revenue Overview</h2>
                <p className="text-xs text-zinc-400">Last 7 days · USD</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-zinc-900">${totalRevenue.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-400">{totalOrders} orders</div>
              </div>
            </div>

            <div className="flex items-end gap-2 h-40">
              {salesByDay.map((day, i) => {
                const barH = Math.max((day.revenue / maxRevenue) * 128, day.revenue > 0 ? 12 : 4)
                const isToday = i === salesByDay.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    {day.revenue > 0 && (
                      <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${day.revenue.toFixed(0)}
                      </span>
                    )}
                    <div className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${barH}px`,
                        background: day.revenue > 0
                          ? isToday
                            ? 'linear-gradient(to top, #6366f1, #818cf8)'
                            : 'linear-gradient(to top, #a5b4fc, #c7d2fe)'
                          : '#f1f5f9',
                      }}
                    />
                    <span className={`text-[10px] ${isToday ? 'text-indigo-600 font-semibold' : 'text-zinc-400'}`}>
                      {day.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Order status — donut */}
          <div className="rounded-2xl p-6 bg-white border border-zinc-300 relative overflow-hidden">
            <h2 className="text-sm font-semibold text-zinc-800 mb-1">Order Status</h2>
            <p className="text-xs text-zinc-400 mb-5">Breakdown</p>

            {/* Donut chart via SVG */}
            {(() => {
              const segments = [
                { key: 'pending',    label: 'Pending',    color: '#facc15', dark: '#713f12' },
                { key: 'processing', label: 'Processing', color: '#60a5fa', dark: '#1e3a5f' },
                { key: 'shipped',    label: 'Shipped',    color: '#c084fc', dark: '#4a1d96' },
                { key: 'delivered',  label: 'Delivered',  color: '#34d399', dark: '#064e3b' },
              ]
              const total = segments.reduce((s, g) => s + statusCounts[g.key], 0) || 1
              const r = 40, cx = 60, cy = 60, stroke = 14
              let offset = 0
              const circumference = 2 * Math.PI * r
              return (
                <div className="flex items-center gap-6">
                  <svg width="120" height="120" className="shrink-0">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
                    {segments.map(seg => {
                      const pct = statusCounts[seg.key] / total
                      const dash = pct * circumference
                      const gap  = circumference - dash
                      const el = (
                        <circle key={seg.key} cx={cx} cy={cy} r={r} fill="none"
                          stroke={seg.color} strokeWidth={stroke}
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={-offset * circumference}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 6px ${seg.color}88)` }}
                          transform={`rotate(-90 ${cx} ${cy})`}
                        />
                      )
                      offset += pct
                      return el
                    })}
                    <text x={cx} y={cy - 6} textAnchor="middle" fill="#18181b" fontSize="16" fontWeight="bold">{totalOrders}</text>
                    <text x={cx} y={cy + 10} textAnchor="middle" fill="#a1a1aa" fontSize="8">orders</text>
                  </svg>
                  <div className="flex flex-col gap-2.5 flex-1">
                    {segments.map(seg => (
                      <div key={seg.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}` }} />
                          <span className="text-xs text-zinc-500">{seg.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-zinc-800 tabular-nums">{statusCounts[seg.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* ── Top products + Recent orders ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top products */}
          <div className="rounded-2xl p-6 bg-white border border-zinc-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800">Top Products</h2>
                <p className="text-xs text-zinc-400">By quantity sold</p>
              </div>
              <i className="fa-solid fa-fire text-orange-400 text-sm" />
            </div>
            {topProducts.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-10">No sales data yet</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map(([name, data], i) => {
                  const colors = ['#6366f1','#10b981','#f43f5e','#f97316','#3b82f6']
                  const pct = (data.qty / maxQty) * 100
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="flex items-center gap-2 text-zinc-700 font-medium">
                          <span className="text-zinc-300 w-4 tabular-nums">#{i+1}</span>
                          {name}
                        </span>
                        <span className="text-zinc-400 tabular-nums">{data.qty} sold · ${data.revenue.toFixed(2)}</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div className="rounded-2xl p-6 bg-white border border-zinc-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800">Recent Orders</h2>
                <p className="text-xs text-zinc-400">Latest activity</p>
              </div>
              <Link to="/admin/sales"
                className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">
                View all <i className="fa-solid fa-arrow-right text-[10px]" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-xs text-zinc-400 text-center py-10">No orders yet</div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map(order => {
                  const statusStyle = {
                    pending:    { bg: '#fef9c3', text: '#854d0e' },
                    processing: { bg: '#dbeafe', text: '#1e40af' },
                    shipped:    { bg: '#f3e8ff', text: '#6b21a8' },
                    delivered:  { bg: '#dcfce7', text: '#166534' },
                  }[order.status] || { bg: '#f4f4f5', text: '#71717a' }
                  const initials = (order.fullName || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <div key={order.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-zinc-50">
                      <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-800 truncate">{order.fullName}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {order.items?.length || 0} item(s) · {order.phone}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-zinc-800 tabular-nums">
                          {(order.currency || '').toLowerCase() === 'khr' ? '៛' : '$'}{typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: statusStyle.bg, color: statusStyle.text }}>
                          {order.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
