import emailjs from '@emailjs/browser'

const SERVICE_ID       = import.meta.env.VITE_EMAILJS_SERVICE_ID
const PUBLIC_KEY       = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const CONFIRM_TEMPLATE = import.meta.env.VITE_EMAILJS_ORDER_CONFIRM_TEMPLATE
const STATUS_TEMPLATE  = import.meta.env.VITE_EMAILJS_STATUS_UPDATE_TEMPLATE

emailjs.init(PUBLIC_KEY)

export async function sendOrderConfirmation(order) {
  const items = order.items
    .map((i) => `${i.name} (${i.size}/${i.color}) x${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
    .join('\n')

  return emailjs.send(SERVICE_ID, CONFIRM_TEMPLATE, {
    customer_name: order.contactInfo?.name || 'Customer',
    order_id:      order.id?.slice(-8).toUpperCase() || '—',
    total:         `$${Number(order.total).toFixed(2)}`,
    items,
    to_email:      order.contactInfo?.email || order.userEmail,
  })
}

export async function sendStatusUpdate(order, newStatus) {
  return emailjs.send(SERVICE_ID, STATUS_TEMPLATE, {
    customer_name: order.contactInfo?.name || 'Customer',
    order_id:      order.id?.slice(-8).toUpperCase() || '—',
    total:         `$${Number(order.total).toFixed(2)}`,
    status:        newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
    to_email:      order.contactInfo?.email || order.userEmail,
  })
}
