import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [adminOpen,      setAdminOpen]      = useState(false)
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false)
  const adminRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const ADMIN_LINKS = [
    { to: '/admin',          icon: 'fa-table-columns', label: 'Dashboard' },
    { to: '/admin/sales',    icon: 'fa-receipt',       label: 'Sales' },
    { to: '/admin/products', icon: 'fa-warehouse',     label: 'Inventory' },
    { to: '/admin/reports',  icon: 'fa-chart-line',    label: 'Reports' },
  ]

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
          <Link to="/products?gender=men"
            className={`text-sm transition-colors duration-200 ${new URLSearchParams(location.search).get('gender') === 'men' && location.pathname === '/products' ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'}`}>
            Men
          </Link>
          <Link to="/products?gender=women"
            className={`text-sm transition-colors duration-200 ${new URLSearchParams(location.search).get('gender') === 'women' && location.pathname === '/products' ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'}`}>
            Women
          </Link>
          {currentUser && <Link to="/orders" className={linkClass('/orders')}>Orders</Link>}
          {userRole === 'admin' && (
            <div className="relative" ref={adminRef}>
              <button onClick={() => setAdminOpen(o => !o)} className={`text-sm transition-colors duration-200 flex items-center gap-1 leading-none ${location.pathname.startsWith('/admin') ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'}`}>
                Admin
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${adminOpen ? 'rotate-180' : ''}`} />
              </button>
              {adminOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-zinc-50">
                    <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">Admin Panel</p>
                  </div>
                  {ADMIN_LINKS.map(l => (
                    <Link key={l.to} to={l.to}
                      onClick={() => setAdminOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-zinc-50 ${location.pathname === l.to ? 'text-zinc-700 font-medium' : 'text-zinc-400'}`}>
                      <i className={`fa-solid ${l.icon} text-xs w-4 text-center text-zinc-300`} />
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
          <button onClick={() => { setMenuOpen(o => { if (o) setMobileAdminOpen(false); return !o }) }} className="md:hidden text-zinc-600 hover:text-black">
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
          <Link to="/products?gender=men" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black pl-3">Men</Link>
          <Link to="/products?gender=women" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black pl-3">Women</Link>
          {currentUser && <Link to="/orders" onClick={() => setMenuOpen(false)} className="block text-sm text-zinc-600 hover:text-black">Orders</Link>}
          {userRole === 'admin' && (
            <div className="space-y-1">
              <button onClick={() => setMobileAdminOpen(o => !o)} className="flex items-center gap-1 text-sm text-zinc-600 hover:text-black w-full">
                Admin
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${mobileAdminOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileAdminOpen && (
                <div className="pl-3 space-y-1 pt-1">
                  {ADMIN_LINKS.map(l => (
                    <Link key={l.to} to={l.to} onClick={() => { setMenuOpen(false); setMobileAdminOpen(false) }}
                      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-700 py-1">
                      <i className={`fa-solid ${l.icon} text-xs w-4 text-center text-zinc-300`} />
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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
