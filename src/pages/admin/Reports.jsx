import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../../firebase/config'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx-js-style'

const TABS = [
  { key: 'category', label: 'Sales By Category' },
  { key: 'products', label: 'Product Sales' },
  { key: 'summary',  label: 'Revenue Summary' },
  { key: 'detail',   label: 'Revenue Detail' },
]

const TH = 'px-4 py-3 text-left text-xs font-semibold text-white'
const THR = 'px-4 py-3 text-right text-xs font-semibold text-white'
const TD  = 'px-4 py-3 text-sm text-zinc-700'
const TDR = 'px-4 py-3 text-sm text-zinc-700 text-right'

function today() {
  return new Date().toISOString().split('T')[0]
}
function monthStart() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

export default function Reports() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('category')
  const [from,    setFrom]    = useState(monthStart())
  const [to,      setTo]      = useState(today())

  useEffect(() => {
    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))).then(snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  // ── Filter by date range ──────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    if (!o.createdAt) return false
    const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
    return d >= new Date(from) && d <= new Date(to + 'T23:59:59')
  })

  // ── Category sales ────────────────────────────────────────────────────────────
  const catMap = {}
  filtered.forEach(o => {
    ;(o.items || []).forEach(item => {
      const cat = item.category || 'Uncategorized'
      const qty = item.quantity || item.qty || 1
      const rev = parseFloat(item.price || 0) * qty
      if (!catMap[cat]) catMap[cat] = { qty: 0, revenue: 0 }
      catMap[cat].qty     += qty
      catMap[cat].revenue += rev
    })
  })
  const catList = Object.entries(catMap).sort((a, b) => b[1].revenue - a[1].revenue)

  // ── Product sales ─────────────────────────────────────────────────────────────
  const prodMap = {}
  filtered.forEach(o => {
    ;(o.items || []).forEach(item => {
      const qty = item.quantity || item.qty || 1
      const rev = parseFloat(item.price || 0) * qty
      if (!prodMap[item.name]) prodMap[item.name] = { qty: 0, revenue: 0, category: item.category || 'Uncategorized' }
      prodMap[item.name].qty     += qty
      prodMap[item.name].revenue += rev
    })
  })
  const prodList = Object.entries(prodMap).sort((a, b) => b[1].revenue - a[1].revenue)

  // ── Monthly summary ───────────────────────────────────────────────────────────
  const monthMap = {}
  filtered.forEach(o => {
    if (!o.createdAt) return
    const d   = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap[key]) monthMap[key] = { orders: 0, revenue: 0 }
    monthMap[key].orders  += 1
    monthMap[key].revenue += parseFloat(o.total) || 0
  })
  const monthList = Object.entries(monthMap).sort((a, b) => b[0].localeCompare(a[0]))

  // ── Totals ────────────────────────────────────────────────────────────────────
  const totalRevenue = filtered.reduce((s, o) => s + (parseFloat(o.total) || 0), 0)
  const totalQty     = catList.reduce((s, [, v]) => s + v.qty, 0)

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

  // ── Download helpers ──────────────────────────────────────────────────────────
  function downloadPDF(title, head, body, foot) {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(title, 14, 16)
    doc.setFontSize(9)
    doc.text(`Period: ${fmtDate(from)} — ${fmtDate(to)}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [head],
      body,
      foot: foot ? [foot] : undefined,
      headStyles:   { fillColor: [30, 58, 110], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      footStyles:   { fillColor: [30, 58, 110], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles:   { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    })
    doc.save(`${title.replace(/ /g, '_')}_${from}_${to}.pdf`)
  }

  function downloadExcel(title, head, rows, foot) {
    const HEADER_STYLE = {
      font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
      fill:      { fgColor: { rgb: '1E3A6E' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top:    { style: 'thin', color: { rgb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
        left:   { style: 'thin', color: { rgb: 'FFFFFF' } },
        right:  { style: 'thin', color: { rgb: 'FFFFFF' } },
      },
    }
    const FOOTER_STYLE = {
      font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
      fill:      { fgColor: { rgb: '1E3A6E' } },
      alignment: { horizontal: 'right', vertical: 'center' },
    }
    const ODD_STYLE = {
      fill:      { fgColor: { rgb: 'FFFFFF' } },
      font:      { sz: 9 },
      alignment: { vertical: 'center' },
    }
    const EVEN_STYLE = {
      fill:      { fgColor: { rgb: 'F5F7FA' } },
      font:      { sz: 9 },
      alignment: { vertical: 'center' },
    }
    const TITLE_STYLE = {
      font:      { bold: true, sz: 14, color: { rgb: '1E3A6E' } },
      alignment: { horizontal: 'left' },
    }
    const PERIOD_STYLE = {
      font:      { sz: 9, color: { rgb: '888888' } },
    }

    const aoa = [
      [title],
      [`Period: ${fmtDate(from)} — ${fmtDate(to)}`],
      [],
      head,
      ...rows,
      ...(foot ? [foot] : []),
    ]

    const ws = XLSX.utils.aoa_to_sheet(aoa)

    // Style title row (row 0)
    head.forEach((_, c) => {
      const cell = XLSX.utils.encode_cell({ r: 0, c })
      if (!ws[cell]) ws[cell] = { v: c === 0 ? title : '', t: 's' }
      ws[cell].s = TITLE_STYLE
    })

    // Style period row (row 1)
    head.forEach((_, c) => {
      const cell = XLSX.utils.encode_cell({ r: 1, c })
      if (!ws[cell]) ws[cell] = { v: '', t: 's' }
      ws[cell].s = PERIOD_STYLE
    })

    // Style header row (row 3)
    head.forEach((h, c) => {
      const cell = XLSX.utils.encode_cell({ r: 3, c })
      if (!ws[cell]) ws[cell] = { v: h, t: 's' }
      ws[cell].s = HEADER_STYLE
    })

    // Style data rows (start at row 4)
    rows.forEach((row, r) => {
      row.forEach((_, c) => {
        const cell = XLSX.utils.encode_cell({ r: r + 4, c })
        if (ws[cell]) ws[cell].s = r % 2 === 0 ? ODD_STYLE : EVEN_STYLE
      })
    })

    // Style footer row
    if (foot) {
      const footRow = rows.length + 4
      foot.forEach((_, c) => {
        const cell = XLSX.utils.encode_cell({ r: footRow, c })
        if (ws[cell]) ws[cell].s = FOOTER_STYLE
      })
    }

    // Column widths
    ws['!cols'] = head.map(() => ({ wch: 18 }))
    ws['!cols'][0] = { wch: 6 }
    ws['!cols'][1] = { wch: 24 }

    // Row heights
    ws['!rows'] = [{ hpt: 22 }, { hpt: 16 }, { hpt: 6 }, { hpt: 22 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))
    XLSX.writeFile(wb, `${title.replace(/ /g, '_')}_${from}_${to}.xlsx`)
  }

  function getReportData() {
    if (tab === 'category') {
      const head = ['#', 'Category', 'Qty Sold', 'Gross Sale', 'Net Sale']
      const body = catList.map(([cat, d], i) => [i+1, cat, d.qty, `$${d.revenue.toFixed(2)}`, `$${d.revenue.toFixed(2)}`])
      const foot = ['', 'Grand Total', totalQty, `$${totalRevenue.toFixed(2)}`, `$${totalRevenue.toFixed(2)}`]
      return { title: 'Sales By Category Report', head, body, foot }
    }
    if (tab === 'products') {
      const head = ['#', 'Product', 'Category', 'Qty Sold', 'Gross Sale', 'Discount', 'Net Sale', 'Share %']
      const body = prodList.map(([name, d], i) => [i+1, name, d.category, d.qty, `$${d.revenue.toFixed(2)}`, '$0.00', `$${d.revenue.toFixed(2)}`, `${totalRevenue > 0 ? ((d.revenue/totalRevenue)*100).toFixed(1) : 0}%`])
      const foot = ['', '', 'Grand Total', prodList.reduce((s,[,v])=>s+v.qty,0), `$${totalRevenue.toFixed(2)}`, '$0.00', `$${totalRevenue.toFixed(2)}`, '100%']
      return { title: 'Product Sales Report', head, body, foot }
    }
    if (tab === 'summary') {
      const head = ['Outlet', 'Date', 'Gross Sale', 'Net Sale', 'Orders', 'ABA (USD)', 'KHR', 'USD']
      const body = monthList.map(([month, d]) => ['Luxe Wear', month, d.revenue.toFixed(2), d.revenue.toFixed(2), d.orders, d.revenue.toFixed(2), '0.00', d.revenue.toFixed(2)])
      const foot = ['Grand Total', '', totalRevenue.toFixed(2), totalRevenue.toFixed(2), filtered.length, totalRevenue.toFixed(2), '0.00', totalRevenue.toFixed(2)]
      return { title: 'Revenue Summary Report', head, body, foot }
    }
    if (tab === 'detail') {
      const head = ['Outlet', 'Date', 'Time', 'Invoice No.', 'Amount', 'VAT', 'Discount%', 'After Dis.', 'ABA', 'KHR', 'USD']
      const body = filtered.map(o => {
        const dt   = o.createdAt ? (o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)) : null
        const amt  = parseFloat(o.total) || 0
        const isKhr = (o.currency||'').toLowerCase() === 'khr'
        return ['Luxe Wear', dt ? dt.toLocaleDateString('en-CA') : '—', dt ? dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '—', o.id?.slice(0,12).toUpperCase()||'—', `$${amt.toFixed(2)}`, '$0.00', '0%', `$${amt.toFixed(2)}`, isKhr ? '0.00' : amt.toFixed(2), isKhr ? amt.toFixed(2) : '0.00', isKhr ? '0.00' : amt.toFixed(2)]
      })
      const foot = ['Grand Total','','','', `$${totalRevenue.toFixed(2)}`,'$0.00','0%',`$${totalRevenue.toFixed(2)}`,'','','']
      return { title: 'Revenue Detail Report', head, body, foot }
    }
    return { title: '', head: [], body: [], foot: null }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-zinc-400 text-sm animate-pulse">Loading reports…</div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Date range picker */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Start Date</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">End Date</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-zinc-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-black transition-colors" />
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Today',     fn: () => { setFrom(today()); setTo(today()) } },
              { label: 'This Month',fn: () => { setFrom(monthStart()); setTo(today()) } },
              { label: 'All Time',  fn: () => { setFrom('2020-01-01'); setTo(today()) } },
            ].map(b => (
              <button key={b.label} onClick={b.fn}
                className="px-3 py-2 text-xs border border-zinc-200 rounded-xl hover:border-black hover:bg-black hover:text-white transition-all">
                {b.label}
              </button>
            ))}
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-400">Period</p>
            <p className="text-sm font-medium text-zinc-700">{fmtDate(from)} — {fmtDate(to)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-2 pt-2">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors ${
                  tab === t.key ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-black'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pb-2">
            <button onClick={() => { const { title, head, body, foot } = getReportData(); downloadExcel(title, head, body, foot) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              <i className="fa-solid fa-file-excel text-xs" /> Excel
            </button>
            <button onClick={() => { const { title, head, body, foot } = getReportData(); downloadPDF(title, head, body, foot) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <i className="fa-solid fa-file-pdf text-xs" /> PDF
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* ── Sales By Category ── */}
          {tab === 'category' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-800 mb-1">Sales By Category Report</h2>
              <p className="text-xs text-zinc-400 mb-6">Period: {fmtDate(from)} — {fmtDate(to)}</p>
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#1e3a6e' }}>
                      <th className={TH}>#</th>
                      <th className={TH}>Category</th>
                      <th className={THR}>Quantities Sold</th>
                      <th className={THR}>Gross Sale</th>
                      <th className={THR}>Net Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catList.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-xs text-zinc-400">No data for this period</td></tr>
                    ) : catList.map(([cat, data], i) => (
                      <tr key={cat} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className={TD}>{i + 1}</td>
                        <td className={TD + ' font-medium'}>{cat}</td>
                        <td className={TDR}>{data.qty}</td>
                        <td className={TDR}>${data.revenue.toFixed(2)}</td>
                        <td className={TDR}>${data.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-blue-700">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">{totalQty}</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">${totalRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-700 text-right">${totalRevenue.toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#1e3a6e' }}>
                      <td colSpan={2} className="px-4 py-3 text-sm font-bold text-white">Grand Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">{totalQty}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">${totalRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">${totalRevenue.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Product Sales ── */}
          {tab === 'products' && (
            <div>
              <h2 className="text-lg font-bold text-zinc-800 mb-1">Product Sales Report</h2>
              <p className="text-xs text-zinc-400 mb-6">Period: {fmtDate(from)} — {fmtDate(to)}</p>
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#1e3a6e' }}>
                      <th className={TH}>#</th>
                      <th className={TH}>Product</th>
                      <th className={TH}>Category</th>
                      <th className={THR}>Qty Sold</th>
                      <th className={THR}>Gross Sale</th>
                      <th className={THR}>Discount</th>
                      <th className={THR}>Net Sale</th>
                      <th className={THR}>Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prodList.length === 0 ? (
                      <tr><td colSpan={8} className="py-10 text-center text-xs text-zinc-400">No data for this period</td></tr>
                    ) : prodList.map(([name, data], i) => (
                      <tr key={name} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                        <td className={TD}>{i + 1}</td>
                        <td className={TD + ' font-medium'}>{name}</td>
                        <td className={TD}>{data.category}</td>
                        <td className={TDR}>{data.qty}</td>
                        <td className={TDR}>${data.revenue.toFixed(2)}</td>
                        <td className={TDR}>$0.00</td>
                        <td className={TDR}>${data.revenue.toFixed(2)}</td>
                        <td className={TDR}>{totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1e3a6e' }}>
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-white">Grand Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">{prodList.reduce((s,[,v])=>s+v.qty,0)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">${totalRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">$0.00</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">${totalRevenue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-white text-right">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Revenue Summary ── */}
          {tab === 'summary' && (() => {
            // Group by date
            const dateMap = {}
            filtered.forEach(o => {
              if (!o.createdAt) return
              const d   = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
              const key = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              if (!dateMap[key]) dateMap[key] = { gross: 0, net: 0, usd: 0, khr: 0, orders: 0 }
              const amt = parseFloat(o.total) || 0
              const cur = (o.currency || '').toLowerCase()
              dateMap[key].gross  += amt
              dateMap[key].net    += amt
              dateMap[key].orders += 1
              if (cur === 'khr') dateMap[key].khr += amt
              else               dateMap[key].usd += amt
            })
            const dateList   = Object.entries(dateMap).sort((a, b) => new Date(b[0]) - new Date(a[0]))
            const grandGross = dateList.reduce((s, [, v]) => s + v.gross, 0)
            const grandUsd   = dateList.reduce((s, [, v]) => s + v.usd, 0)
            const grandKhr   = dateList.reduce((s, [, v]) => s + v.khr, 0)

            return (
              <div>
                <h2 className="text-lg font-bold text-zinc-800 mb-1">Revenue Summary Report</h2>
                <p className="text-xs text-zinc-400 mb-6">Period: {fmtDate(from)} — {fmtDate(to)}</p>
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      {/* Row 1 */}
                      <tr style={{ background: '#1e3a6e' }}>
                        <th className={TH} rowSpan={2}>Outlet</th>
                        <th className={TH} rowSpan={2}>Date</th>
                        <th className={THR} rowSpan={2}>Gross Sale</th>
                        <th className={THR} rowSpan={2}>Net Sale</th>
                        <th className={THR} rowSpan={2}>Orders</th>
                        <th className={THR} colSpan={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}>Payment Type</th>
                      </tr>
                      {/* Row 2 */}
                      <tr style={{ background: '#2d4f8e' }}>
                        <th className={THR} style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}>ABA (USD)</th>
                        <th className={THR}>KHR</th>
                        <th className={THR}>USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateList.length === 0 ? (
                        <tr><td colSpan={8} className="py-10 text-center text-xs text-zinc-400">No data for this period</td></tr>
                      ) : dateList.map(([date, data], i) => (
                        <>
                          <tr key={date} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                            <td className={TD}>Luxe Wear</td>
                            <td className={TD}>{date}</td>
                            <td className={TDR}>{data.gross.toFixed(2)}</td>
                            <td className={TDR}>{data.net.toFixed(2)}</td>
                            <td className={TDR}>{data.orders}</td>
                            <td className={TDR}>{data.usd.toFixed(2)}</td>
                            <td className={TDR}>{data.khr.toFixed(2)}</td>
                            <td className={TDR}>{data.usd.toFixed(2)}</td>
                          </tr>
                          <tr key={date + '-sub'} style={{ background: '#e8f0fb' }}>
                            <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-blue-700">Total Date</td>
                            <td className="px-4 py-2 text-xs font-semibold text-blue-700 text-right">{data.gross.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-blue-700 text-right">{data.net.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-blue-700 text-right">{data.orders}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-blue-700 text-right">{data.usd.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-blue-700 text-right">{data.khr.toFixed(2)}</td>
                            <td className="px-4 py-2 text-xs font-semibold text-blue-700 text-right">{data.usd.toFixed(2)}</td>
                          </tr>
                        </>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#1e3a6e' }}>
                        <td colSpan={2} className="px-4 py-3 text-sm font-bold text-white">Total Outlet</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">{grandGross.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">{grandGross.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">{filtered.length}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">{grandUsd.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">{grandKhr.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">{grandUsd.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}

          {/* ── Revenue Detail ── */}
          {tab === 'detail' && (() => {
            const grandUsd = filtered.filter(o => (o.currency||'').toLowerCase() !== 'khr').reduce((s,o) => s + (parseFloat(o.total)||0), 0)
            const grandKhr = filtered.filter(o => (o.currency||'').toLowerCase() === 'khr').reduce((s,o) => s + (parseFloat(o.total)||0), 0)
            return (
              <div>
                <h2 className="text-lg font-bold text-zinc-800 mb-1">Revenue Detail Report</h2>
                <p className="text-xs text-zinc-400 mb-6">Period: {fmtDate(from)} — {fmtDate(to)}</p>
                <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ background: '#1e3a6e' }}>
                        <th className={TH} rowSpan={2}>Outlet</th>
                        <th className={TH} rowSpan={2}>Date</th>
                        <th className={TH} rowSpan={2}>Time</th>
                        <th className={TH} rowSpan={2}>Invoice No.</th>
                        <th className={THR} rowSpan={2}>Amount</th>
                        <th className={THR} rowSpan={2}>VAT</th>
                        <th className={THR} rowSpan={2}>Discount(%)</th>
                        <th className={THR} rowSpan={2}>After Dis.</th>
                        <th className={THR} colSpan={3} style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}>Payment Type</th>
                      </tr>
                      <tr style={{ background: '#2d4f8e' }}>
                        <th className={THR} style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}>ABA</th>
                        <th className={THR}>KHR</th>
                        <th className={THR}>USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={11} className="py-10 text-center text-xs text-zinc-400">No data for this period</td></tr>
                      ) : filtered.map((o, i) => {
                        const dt    = o.createdAt ? (o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)) : null
                        const date  = dt ? dt.toLocaleDateString('en-CA') : '—'
                        const time  = dt ? dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'
                        const amt   = parseFloat(o.total) || 0
                        const isKhr = (o.currency || '').toLowerCase() === 'khr'
                        const invoiceNo = o.id?.slice(0, 12).toUpperCase() || '—'
                        return (
                          <tr key={o.id} className={i % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-zinc-50 hover:bg-blue-50'} style={{ transition: 'background 0.15s' }}>
                            <td className={TD}>Luxe Wear</td>
                            <td className={TD}>{date}</td>
                            <td className={TD}>{time}</td>
                            <td className="px-4 py-2.5 text-xs text-blue-700 font-medium">{invoiceNo}</td>
                            <td className={TDR}>${amt.toFixed(2)}</td>
                            <td className={TDR}>$0.00</td>
                            <td className={TDR}>0%</td>
                            <td className={TDR + ' font-medium'}>${amt.toFixed(2)}</td>
                            <td className={TDR}>{!isKhr ? amt.toFixed(2) : '0.00'}</td>
                            <td className={TDR}>{isKhr ? amt.toFixed(2) : '0.00'}</td>
                            <td className={TDR}>{!isKhr ? amt.toFixed(2) : '0.00'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#1e3a6e' }}>
                        <td colSpan={4} className="px-4 py-3 text-sm font-bold text-white">Grand Total</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">${totalRevenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">$0.00</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">0%</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">${totalRevenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">${grandUsd.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">${grandKhr.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white text-right">${grandUsd.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}
