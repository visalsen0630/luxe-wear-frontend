import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function PaymentReturn() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('checking')

  const tranId = searchParams.get('tran_id')
  const apvCode = searchParams.get('apv')        // approval code from PayWay
  const paymentStatus = searchParams.get('status') // 0 = success

  useEffect(() => {
    async function updateOrder() {
      if (!tranId) return setStatus('error')

      const success = paymentStatus === '0' || apvCode

      // Find and update the order in Firestore
      try {
        const q = query(collection(db, 'orders'), where('tranId', '==', tranId))
        const snap = await getDocs(q)
        if (!snap.empty) {
          await updateDoc(doc(db, 'orders', snap.docs[0].id), {
            paymentStatus: success ? 'paid' : 'failed',
            status: success ? 'processing' : 'pending',
            apvCode: apvCode || null,
          })
        }
        setStatus(success ? 'success' : 'failed')
      } catch {
        setStatus('error')
      }
    }
    updateOrder()
  }, [tranId, apvCode, paymentStatus])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      {status === 'checking' && (
        <p className="text-gray-400">Verifying payment…</p>
      )}

      {status === 'success' && (
        <>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-light mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-6">Your order has been placed and is being processed.</p>
          {apvCode && <p className="text-xs text-gray-400 mb-6">Approval code: {apvCode}</p>}
          <Link to="/orders" className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors">
            View Orders
          </Link>
        </>
      )}

      {status === 'failed' && (
        <>
          <div className="text-5xl mb-4">✗</div>
          <h1 className="text-2xl font-light mb-2">Payment Failed</h1>
          <p className="text-gray-500 mb-6">Your payment was not completed. Please try again.</p>
          <Link to="/checkout" className="bg-black text-white px-8 py-3 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors">
            Try Again
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-light mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-6">We couldn't verify your payment. Contact support if you were charged.</p>
          <Link to="/" className="text-black underline text-sm">Go home</Link>
        </>
      )}
    </div>
  )
}
