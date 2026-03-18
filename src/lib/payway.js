import HmacSHA512 from 'crypto-js/hmac-sha512'
import Base64 from 'crypto-js/enc-base64'

const MODE = import.meta.env.VITE_PAYWAY_MODE || 'sandbox'
const IS_SANDBOX = MODE === 'sandbox'

export const PAYWAY_CONFIG = {
  merchantId: IS_SANDBOX
    ? import.meta.env.VITE_PAYWAY_SANDBOX_MERCHANT_ID
    : import.meta.env.VITE_PAYWAY_PROD_MERCHANT_ID,
  apiKey: IS_SANDBOX
    ? import.meta.env.VITE_PAYWAY_SANDBOX_API_KEY
    : import.meta.env.VITE_PAYWAY_PROD_API_KEY,
  paymentUrl: IS_SANDBOX
    ? 'https://pay-with-gateway.payway.com.kh/sandbox/api/payment-gateway/v1/payments/purchase'
    : 'https://pay-with-gateway.payway.com.kh/api/payment-gateway/v1/payments/purchase',
  isSandbox: IS_SANDBOX,
}

// Format: YYYYMMDDHHmmss
export function getReqTime() {
  const now = new Date()
  return now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
}

// Generate unique transaction ID
export function generateTranId() {
  return 'TXN' + Date.now()
}

// Generate HMAC-SHA512 hash required by PayWay
export function generateHash({ merchantId, reqTime, tranId, amount, items, shipping, firstname, lastname, phone, email }) {
  const itemsStr = typeof items === 'string' ? items : JSON.stringify(items)
  const str = merchantId + reqTime + tranId + amount + itemsStr + shipping + firstname + lastname + phone + email
  return HmacSHA512(str, PAYWAY_CONFIG.apiKey).toString(Base64)
}

// Build PayWay items array from cart
export function buildPayWayItems(cart) {
  return cart.map((item) => ({
    name: `${item.name} (${item.size}/${item.color})`,
    quantity: String(item.quantity),
    price: Number(item.price).toFixed(2),
  }))
}
