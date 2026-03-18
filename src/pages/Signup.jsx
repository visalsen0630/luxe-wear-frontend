import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

const BOT_URL = 'https://web-production-ab0b0.up.railway.app'

export default function Signup() {
  const [step, setStep] = useState(1) // 1 = form, 2 = verify code
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState(['', '', '', ''])
  const [savedCode, setSavedCode] = useState('')
  const [codeExpiry, setCodeExpiry] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()
  const codeRefs = [useRef(), useRef(), useRef(), useRef()]

  // Step 1 — send verification code
  async function handleSendCode(e) {
    e.preventDefault()
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setError('')
    setLoading(true)
    try {
      const generated = String(Math.floor(1000 + Math.random() * 9000))
      const expiry = Date.now() + 10 * 60 * 1000 // 10 minutes

      // Store code temporarily in Firestore
      await setDoc(doc(db, 'emailVerifications', email.toLowerCase()), {
        code: generated,
        expiresAt: expiry,
        name,
        createdAt: serverTimestamp(),
      })

      // Send code via bot
      const res = await fetch(`${BOT_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, code: generated }),
      })
      if (!res.ok) throw new Error('Failed to send code')

      setSavedCode(generated)
      setCodeExpiry(expiry)
      setStep(2)
    } catch (err) {
      console.error(err)
      setError('Failed to send verification code. Please try again.')
    }
    setLoading(false)
  }

  // Step 2 — verify code & create account
  async function handleVerify(e) {
    e.preventDefault()
    const entered = code.join('')
    if (entered.length < 4) return setError('Please enter the 4-digit code.')
    if (Date.now() > codeExpiry) return setError('Code expired. Please go back and request a new one.')
    if (entered !== savedCode) return setError('Incorrect code. Please try again.')
    setError('')
    setLoading(true)
    try {
      await signup(email, password, name)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to create account.')
    }
    setLoading(false)
  }

  // Handle code digit input
  function handleCodeInput(index, value) {
    if (!/^\d*$/.test(value)) return
    const updated = [...code]
    updated[index] = value.slice(-1)
    setCode(updated)
    if (value && index < 3) codeRefs[index + 1].current?.focus()
  }

  function handleCodeKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs[index - 1].current?.focus()
    }
  }

  function handleCodePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      setCode(pasted.split(''))
      codeRefs[3].current?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="min-h-screen flex bg-zinc-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-zinc-950 items-center justify-center p-12">
        <div className="text-white max-w-sm">
          <p className="text-xs tracking-[0.4em] uppercase text-zinc-400 mb-4">Join us</p>
          <h2 className="text-4xl font-light leading-tight mb-6">
            Style starts<br />with a <span className="font-semibold italic">story</span>
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Create your account and unlock exclusive access to our latest collections, early drops, and member-only offers.
          </p>
          <div className="mt-12 flex flex-col gap-3">
            {['Free shipping on first order', 'Early access to new arrivals', 'Exclusive member pricing'].map((t) => (
              <div key={t} className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-8">
            <Link to="/" className="text-sm font-semibold tracking-[0.2em] uppercase text-black">Luxe Wear</Link>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-6 mb-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${step >= 1 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-500'}`}>1</div>
                <span className="text-xs text-zinc-400">Details</span>
              </div>
              <div className={`flex-1 h-px ${step >= 2 ? 'bg-black' : 'bg-zinc-200'} transition-colors`} />
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${step >= 2 ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-500'}`}>2</div>
                <span className="text-xs text-zinc-400">Verify</span>
              </div>
            </div>

            <h1 className="text-2xl font-semibold mt-4 mb-1">
              {step === 1 ? 'Create account' : 'Verify your email'}
            </h1>
            <p className="text-sm text-zinc-500">
              {step === 1
                ? 'Fill in your details to get started'
                : `We sent a 4-digit code to ${email}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {/* Step 1 — Details form */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Sen Visal"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending code…
                  </span>
                ) : 'Send Verification Code →'}
              </button>
            </form>
          )}

          {/* Step 2 — Enter code */}
          {step === 2 && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-4">Enter 4-digit code</label>
                <div className="flex gap-3 justify-center" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={codeRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      className="w-14 h-14 text-center text-2xl font-semibold border-2 border-zinc-200 rounded-xl focus:outline-none focus:border-black transition-colors bg-white"
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-400 text-center mt-3">Code expires in 10 minutes</p>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating account…
                  </span>
                ) : 'Verify & Create Account ✓'}
              </button>

              <button type="button" onClick={() => { setStep(1); setCode(['','','','']); setError('') }}
                className="w-full text-sm text-zinc-400 hover:text-black transition-colors py-1">
                ← Back to edit details
              </button>
            </form>
          )}

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-black font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
