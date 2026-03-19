import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen,        setMenuOpen]        = useState(false)
  const [adminOpen,       setAdminOpen]       = useState(false)
  const [shopOpen,        setShopOpen]        = useState(false)
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false)
  const [mobileShopOpen,  setMobileShopOpen]  = useState(false)
  const adminRef = useRef(null)
  const shopRef  = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false)
      if (shopRef.current  && !shopRef.current.contains(e.target))  setShopOpen(false)
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
          {/* Shop dropdown */}
          <div className="relative" ref={shopRef}>
            <button onClick={() => setShopOpen(o => !o)}
              className={`text-sm transition-colors duration-200 flex items-center gap-1 leading-none ${location.pathname === '/products' ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'}`}>
              Shop
              <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`} />
            </button>
            {shopOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-50">
                {[
                  { to: '/products',          label: 'All Products' },
                  { to: '/products?gender=men',   label: 'Men' },
                  { to: '/products?gender=women', label: 'Women' },
                ].map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setShopOpen(false)}
                    className="block px-4 py-2.5 text-sm text-zinc-500 hover:text-black hover:bg-zinc-50 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
          <button onClick={() => { setMenuOpen(o => { if (o) { setMobileAdminOpen(false); setMobileShopOpen(false) } return !o }) }} className="md:hidden p-1 text-zinc-700 hover:text-black">
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-zinc-100 divide-y divide-zinc-100">

          {/* Shop row */}
          <div>
            <button onClick={() => setMobileShopOpen(o => !o)}
              className="flex items-center justify-between w-full px-5 py-4 text-base font-medium text-zinc-800">
              Shop
              <i className={`fa-solid fa-chevron-down text-xs text-zinc-400 transition-transform duration-200 ${mobileShopOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileShopOpen && (
              <div className="bg-zinc-50 border-t border-zinc-100">
                {[
                  { to: '/products',              label: 'All Products' },
                  { to: '/products?gender=men',   label: 'Men' },
                  { to: '/products?gender=women', label: 'Women' },
                ].map(l => (
                  <Link key={l.to} to={l.to}
                    onClick={() => { setMenuOpen(false); setMobileShopOpen(false) }}
                    className="block px-8 py-3 text-base text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Orders */}
          {currentUser && (
            <Link to="/orders" onClick={() => setMenuOpen(false)}
              className="flex items-center px-5 py-4 text-base font-medium text-zinc-800 hover:text-black">
              Orders
            </Link>
          )}

          {/* Admin row */}
          {userRole === 'admin' && (
            <div>
              <button onClick={() => setMobileAdminOpen(o => !o)}
                className="flex items-center justify-between w-full px-5 py-4 text-base font-medium text-zinc-800">
                Admin
                <i className={`fa-solid fa-chevron-down text-xs text-zinc-400 transition-transform duration-200 ${mobileAdminOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileAdminOpen && (
                <div className="bg-zinc-50 border-t border-zinc-100">
                  {ADMIN_LINKS.map(l => (
                    <Link key={l.to} to={l.to}
                      onClick={() => { setMenuOpen(false); setMobileAdminOpen(false) }}
                      className="flex items-center gap-3 px-8 py-3 text-base text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors">
                      <i className={`fa-solid ${l.icon} text-sm w-5 text-center text-zinc-400`} />
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Auth */}
          {currentUser ? (
            <div>
              <div className="px-5 py-3 text-sm text-zinc-400 truncate">{currentUser.displayName || currentUser.email}</div>
              <button onClick={handleLogout}
                className="flex items-center w-full px-5 py-4 text-base font-medium text-zinc-800 hover:text-black border-t border-zinc-100">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-3 px-5 py-4">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-3 text-base font-medium border border-zinc-300 text-zinc-700 rounded-xl hover:border-black transition-colors">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-3 text-base font-medium bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
