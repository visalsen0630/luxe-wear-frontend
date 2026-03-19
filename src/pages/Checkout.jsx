import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { sendOrderConfirmation } from '../lib/email'
import qrImage from '../assets/qr/QR.jpg'

const MERCHANT_NAME = 'SEN VISAL'
const USD_TO_KHR    = 4100

export default function Checkout() {
  const { cart, total, clearCart } = useCart()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:     currentUser?.displayName || '',
    email:    currentUser?.email || '',
    phone:    '',
    location: '',
  })
  const [currency, setCurrency]   = useState('usd')
  const [txRef,    setTxRef]      = useState('')
  const [step,     setStep]       = useState(1)
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')

  const displayAmount = currency === 'usd'
    ? `$${total.toFixed(2)}`
    : `៛${Math.round(total * USD_TO_KHR).toLocaleString()}`

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleProceed(e) {
    e.preventDefault()
    // Notify bot of new order (non-blocking)
    fetch('https://web-production-ab0b0.up.railway.app/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName:     form.name,
        email:        form.email,
        phone:        form.phone,
        locationLink: form.location,
        currency:     currency.toUpperCase(),
        items:        cart.map((i) => ({
          name:  i.name,
          color: i.color,
          size:  i.size,
          qty:   i.quantity,
          price: i.price.toFixed(2),
        })),
        total: total.toFixed(2),
      }),
    }).catch(console.error)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirm(e) {
    e.preventDefault()
    if (!txRef.trim()) return setError('Please enter your transaction reference.')
    setLoading(true)
    setError('')
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        userId:        currentUser.uid,
        userEmail:     currentUser.email,
        items:         cart.map(({ key: _k, ...rest }) => rest),
        total,
        currency,
        contactInfo:   form,
        txRef:         txRef.trim(),
        status:        'pending',
        paymentStatus: 'pending',
        paymentMethod: 'aba_khqr',
        createdAt:     serverTimestamp(),
      })
      // Notify bot of payment submission (non-blocking)
      fetch('https://web-production-ab0b0.up.railway.app/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:       form.name,
          phone:          form.phone,
          transactionRef: txRef.trim(),
          currency:       currency.toUpperCase(),
          total:          currency === 'usd' ? total.toFixed(2) : Math.round(total * USD_TO_KHR).toString(),
        }),
      }).catch(console.error)

      clearCart()
      // Send confirmation email (non-blocking)
      sendOrderConfirmation({ id: docRef.id, items: cart, total, contactInfo: form, userEmail: currentUser.email }).catch(console.error)
      navigate('/orders', { state: { success: true } })
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400">
        Your cart is empty.
      </div>
    )
  }

  /* ── Step 1: Contact form ── */
  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-light tracking-tight mb-10">Checkout</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          <form onSubmit={handleProceed} className="space-y-4">
            <h2 className="font-medium mb-2">Contact & Delivery</h2>

            {[
              { name: 'name',     label: 'Full Name',      type: 'text' },
              { name: 'email',    label: 'Email',          type: 'email' },
              { name: 'phone',    label: 'Phone Number',   type: 'tel',  placeholder: '012 345 678' },
              { name: 'location', label: 'Location Link',  type: 'url',  placeholder: 'Paste Google Maps link' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm text-gray-600 mb-1">{label}</label>
                <input type={type} name={name} required value={form[name]}
                  onChange={handleChange} placeholder={placeholder}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
              </div>
            ))}

            <div>
              <label className="block text-sm text-gray-600 mb-2">Currency</label>
              <div className="flex gap-3">
                {[['usd','$ USD'],['khr','៛ KHR']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setCurrency(val)}
                    className={`flex-1 py-2.5 text-sm border transition-colors ${
                      currency === val ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit"
              className="w-full bg-black text-white py-4 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Continue to Payment →
            </button>
          </form>

          {/* Order summary */}
          <div>
            <h2 className="font-medium mb-4">Order Summary</h2>
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.key} className="flex gap-3 py-3">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-12 h-14 object-cover bg-gray-100 shrink-0" />}
                  <div className="flex-1 flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.color} · {item.size} · ×{item.quantity}</p>
                    </div>
                    <p>${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-medium">
              <span>Total</span><span>{displayAmount}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Step 2: Payment QR ── */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-lg overflow-hidden">

        {/* Amount */}
        <div className="bg-gray-950 text-white px-6 py-8 text-center">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Amount to Pay</p>
          <p className="text-5xl font-semibold tracking-tight">{displayAmount}</p>
          <p className="text-xs text-gray-400 mt-2">Already set in the QR — just scan &amp; confirm</p>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Code */}
          <div className="flex flex-col items-center border border-gray-100 rounded-xl p-4">
            <img
              src={qrImage}
              alt={`ABA Pay QR - ${currency.toUpperCase()}`}
              className="w-52 h-52 object-contain rounded"
            />
            <p className="text-sm font-semibold mt-3">{MERCHANT_NAME}</p>
            <p className="text-xs text-gray-400">ABA Merchant · KHQR · {currency.toUpperCase()}</p>
          </div>

          <div className="bg-blue-50 rounded-lg px-4 py-3 text-xs text-blue-700 space-y-1">
            <p>1. Open <strong>ABA Mobile</strong> → tap <strong>Scan</strong></p>
            <p>2. Scan the QR — amount is already filled</p>
            <p>3. Confirm payment in your ABA app</p>
            <p>4. Copy the <strong>transaction reference</strong> and enter below</p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-3">
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transaction Reference</label>
              <input type="text" required value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. TXN123456789"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? 'Confirming…' : 'Confirm Payment ✓'}
            </button>
          </form>

          <button onClick={() => setStep(1)}
            className="w-full text-xs text-gray-400 hover:text-black transition-colors py-1">
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
