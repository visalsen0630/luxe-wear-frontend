// Dynamic KHQR generator (EMVCo QR standard used by NBC Cambodia)
// Generates a QR payload with amount pre-filled for ABA Merchant accounts

function tlv(id, value) {
  const len = String(value.length).padStart(2, '0')
  return `${id}${len}${value}`
}

// CRC-16/CCITT-FALSE
function crc16(str) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

export function generateKHQR({ merchantId, merchantName, amount, currency = 'usd' }) {
  const currencyCode = currency === 'usd' ? '840' : '116'
  const amountStr = currency === 'usd'
    ? Number(amount).toFixed(2)
    : String(Math.round(Number(amount) * 4100))

  // Tag 29: ABA Merchant account info
  const merchantAccount = tlv('00', 'com.ababank') + tlv('01', merchantId)

  let payload = ''
  payload += tlv('00', '01')                  // Payload format indicator
  payload += tlv('01', '12')                  // Dynamic QR (12 = dynamic)
  payload += tlv('29', merchantAccount)        // Merchant account (ABA)
  payload += tlv('52', '5999')                // MCC - general retail
  payload += tlv('53', currencyCode)           // Currency
  payload += tlv('54', amountStr)              // Amount (pre-filled)
  payload += tlv('58', 'KH')                  // Country code
  payload += tlv('59', merchantName.slice(0, 25).toUpperCase()) // Merchant name
  payload += tlv('60', 'PHNOM PENH')          // City
  payload += '6304'                            // CRC tag placeholder

  const checksum = crc16(payload)
  return payload + checksum
}
