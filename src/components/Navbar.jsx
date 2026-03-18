import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  const linkClass = (path) =>
    `text-sm transition-colors duration-200 ${
      location.pathname === path ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'
    }`

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="text-lg font-semibold tracking-[0.2em] uppercase text-black">
          Luxe Wear
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/products" className={linkClass('/products')}>Shop</Link>
          {currentUser && <Link to="/orders" className={linkClass('/orders')}>Orders</Link>}
          {userRole === 'admin' && <Link to="/admin" className={linkClass('/admin')}>Admin</Link>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs text-zinc-400">{currentUser.displayName || currentUser.email}</span>
              <button onClick={handleLogout} className="text-sm text-zinc-500 hover:text-black transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm text-zinc-500 hover:text-black transition-colors">Login</Link>
              <Link to="/signup" className="text-sm bg-black text-white px-4 py-1.5 rounded-full hover:bg-zinc-800 transition-colors">
                Sign Up
              </Link>
            </div>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative text-zinc-600 hover:text-black transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-zinc-600 hover:text-black">
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-zinc-100 px-4 py-4 space-y-3">
          <Link to="/products" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black">Shop</Link>
          {currentUser && <Link to="/orders" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black">Orders</Link>}
          {userRole === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black">Admin</Link>}
          {currentUser ? (
            <button onClick={handleLogout} className="block text-sm text-zinc-600 hover:text-black">Logout</button>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
