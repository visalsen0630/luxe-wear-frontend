import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export default function Navbar() {
  const { currentUser, userRole, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-semibold tracking-widest uppercase">
          Luxe Waer
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link to="/products" className="hover:text-black text-gray-600 transition-colors">
            Shop
          </Link>

          {currentUser ? (
            <>
              <Link to="/orders" className="hover:text-black text-gray-600 transition-colors">
                Orders
              </Link>
              {userRole === 'admin' && (
                <Link to="/admin" className="hover:text-black text-gray-600 transition-colors">
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hover:text-black text-gray-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-black text-gray-600 transition-colors">
                Login
              </Link>
              <Link to="/signup" className="hover:text-black text-gray-600 transition-colors">
                Sign Up
              </Link>
            </>
          )}

          <Link to="/cart" className="relative hover:text-black text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}
