import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const USD_TO_KHR = 4100

export function downloadInvoicePDF(order) {
  const { id: orderId, contactInfo, items, total, currency, txRef, createdAt } = order
  const invoiceNo = (orderId || '').slice(-8).toUpperCase()
  const date = createdAt?.toDate
    ? createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const displayTotal = currency === 'usd'
    ? `$${Number(total).toFixed(2)}`
    : `៛${Math.round(Number(total) * USD_TO_KHR).toLocaleString()}`

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
  const info = contactInfo || {}
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(150, 150, 150)
  doc.text('BILL TO', 14, 60)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text(info.name || '—', 14, 68)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  if (info.email) doc.text(info.email, 14, 74)
  if (info.phone) doc.text(info.phone, 14, 80)

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
  const status = (order.status || 'pending')
  doc.text(`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, W - 14, 80, { align: 'right' })

  // Divider
  doc.setDrawColor(230, 230, 230)
  doc.line(14, 88, W - 14, 88)

  // Items table
  autoTable(doc, {
    startY: 94,
    head: [['Product', 'Color', 'Size', 'Qty', 'Unit Price', 'Subtotal']],
    body: (items || []).map(item => [
      item.name || '—',
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
  doc.text('Thank you for shopping with Luxe Wear!', W / 2, finalY + 8, { align: 'center' })

  doc.save(`LuxeWear-Invoice-${invoiceNo}.pdf`)
}
