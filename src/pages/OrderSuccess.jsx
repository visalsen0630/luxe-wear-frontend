import { useLocation, Link } from 'react-router-dom'
import { useRef } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const USD_TO_KHR = 4100

export default function OrderSuccess() {
  const { state } = useLocation()
  const invoiceRef = useRef()

  if (!state?.order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-zinc-400">No order data found.</p>
          <Link to="/orders" className="text-sm underline text-zinc-600">View My Orders</Link>
        </div>
      </div>
    )
  }

  const { orderId, order } = state
  const { contactInfo, items, total, currency, txRef } = order
  const invoiceNo = orderId.slice(-8).toUpperCase()
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const displayTotal = currency === 'usd'
    ? `$${Number(total).toFixed(2)}`
    : `៛${Math.round(Number(total) * USD_TO_KHR).toLocaleString()}`

  function downloadPDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const W = doc.internal.pageSize.getWidth()

    // Dark header
    doc.setFillColor(10, 10, 10)
    doc.rect(0, 0, W, 48, 'F')

    // Brand
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('LUXE WEAR', 14, 18)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text('Premium Fashion · Cambodia', 14, 25)

    // Invoice label
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('INVOICE', W - 14, 18, { align: 'right' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(`#${invoiceNo}`, W - 14, 25, { align: 'right' })
    doc.text(date, W - 14, 31, { align: 'right' })

    // Bill to
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(150, 150, 150)
    doc.text('BILL TO', 14, 60)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    doc.text(contactInfo.name || '—', 14, 68)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    if (contactInfo.email) doc.text(contactInfo.email, 14, 74)
    if (contactInfo.phone) doc.text(contactInfo.phone, 14, 80)

    // Payment info
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(150, 150, 150)
    doc.text('PAYMENT INFO', W - 14, 60, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Method: ABA KHQR', W - 14, 68, { align: 'right' })
    if (txRef) doc.text(`Ref: ${txRef}`, W - 14, 74, { align: 'right' })
    doc.text('Status: Pending Verification', W - 14, 80, { align: 'right' })

    // Divider
    doc.setDrawColor(230, 230, 230)
    doc.line(14, 88, W - 14, 88)

    // Items table
    autoTable(doc, {
      startY: 94,
      head: [['Product', 'Color', 'Size', 'Qty', 'Unit Price', 'Subtotal']],
      body: items.map(item => [
        item.name,
        item.color || '—',
        item.size || '—',
        String(item.quantity || item.qty || 1),
        `$${Number(item.price).toFixed(2)}`,
        `$${(Number(item.price) * (item.quantity || item.qty || 1)).toFixed(2)}`,
      ]),
      foot: [['', '', '', '', 'TOTAL', displayTotal]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [10, 10, 10], textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 5 },
      footStyles: { fillColor: [245, 245, 245], textColor: [10, 10, 10], fontStyle: 'bold', fontSize: 11 },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      columnStyles: {
        0: { cellWidth: 65 },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
    })

    const finalY = doc.lastAutoTable.finalY + 14
    doc.setDrawColor(220, 220, 220)
    doc.line(14, finalY, W - 14, finalY)
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text('Thank you for shopping with Luxe Wear! · www.luxewear.com', W / 2, finalY + 8, { align: 'center' })

    doc.save(`LuxeWear-Invoice-${invoiceNo}.pdf`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Success banner */}
      <div className="flex items-center gap-4 bg-green-50 border border-green-100 rounded-2xl px-6 py-4 mb-8">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-800">Order placed successfully!</p>
          <p className="text-xs text-green-600 mt-0.5">We'll verify your payment and update your order status shortly.</p>
        </div>
      </div>

      {/* Invoice card */}
      <div ref={invoiceRef} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Header */}
        <div className="bg-zinc-950 px-8 py-7 flex justify-between items-start">
          <div>
            <p className="text-white text-xl font-bold tracking-[0.2em] uppercase">Luxe Wear</p>
            <p className="text-zinc-500 text-xs mt-1">Premium Fashion · Cambodia</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Invoice</p>
            <p className="text-white font-mono font-bold text-xl mt-0.5">#{invoiceNo}</p>
            <p className="text-zinc-500 text-xs mt-1">{date}</p>
          </div>
        </div>

        {/* Bill to + Payment */}
        <div className="px-8 py-6 grid grid-cols-2 gap-6 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">Bill To</p>
            <p className="font-semibold text-zinc-900">{contactInfo.name || '—'}</p>
            <p className="text-sm text-zinc-500 mt-1">{contactInfo.email}</p>
            <p className="text-sm text-zinc-500">{contactInfo.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mb-3">Payment</p>
            <p className="font-semibold text-zinc-900">ABA KHQR</p>
            {txRef && <p className="text-xs text-zinc-500 mt-1 font-mono break-all">{txRef}</p>}
            <span className="inline-block mt-2 text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
              Pending Verification
            </span>
          </div>
        </div>

        {/* Items table */}
        <div className="px-8 py-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Product', 'Color', 'Size', 'Qty', 'Price', 'Total'].map(h => (
                  <th key={h} className={`py-3 text-[10px] font-bold tracking-widest text-zinc-400 uppercase ${h === 'Product' ? 'text-left' : h === 'Price' || h === 'Total' ? 'text-right' : 'text-center'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-zinc-50'}>
                  <td className="py-3 font-medium text-zinc-900">{item.name}</td>
                  <td className="py-3 text-center text-zinc-500 text-xs">{item.color || '—'}</td>
                  <td className="py-3 text-center text-zinc-500 text-xs">{item.size || '—'}</td>
                  <td className="py-3 text-center text-zinc-500">{item.quantity || item.qty || 1}</td>
                  <td className="py-3 text-right text-zinc-500">${Number(item.price).toFixed(2)}</td>
                  <td className="py-3 text-right font-semibold text-zinc-900">
                    ${(Number(item.price) * (item.quantity || item.qty || 1)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total row */}
        <div className="mx-8 border-t-2 border-zinc-900 py-4 flex justify-between items-center">
          <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Total Amount</span>
          <span className="text-2xl font-bold text-zinc-950">{displayTotal}</span>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-100 px-8 py-4 text-center">
          <p className="text-xs text-zinc-400">
            Thank you for shopping with <span className="font-semibold text-zinc-600">Luxe Wear</span>!
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button onClick={downloadPDF}
          className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors">
          <i className="fa-solid fa-file-pdf" />
          Download Invoice PDF
        </button>
        <Link to="/orders"
          className="flex-1 flex items-center justify-center gap-2 border border-zinc-300 text-zinc-700 py-3.5 rounded-xl text-sm font-medium hover:border-black transition-colors">
          <i className="fa-solid fa-list-check" />
          View My Orders
        </Link>
      </div>
    </div>
  )
}
