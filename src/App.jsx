import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPanel from './pages/admin/AdminPanel'
import ManageProducts from './pages/admin/ManageProducts'
import ManageOrders from './pages/admin/ManageOrders'
import Reports from './pages/admin/Reports'
import PaymentReturn from './pages/PaymentReturn'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/payment/return" element={<PaymentReturn />} />

                <Route path="/checkout" element={
                  <ProtectedRoute><Checkout /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute><OrderHistory /></ProtectedRoute>
                } />

                {/* Admin routes */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminPanel />} />
                  <Route path="products"  element={<ManageProducts />} />
                  <Route path="sales"     element={<ManageOrders />} />
                  <Route path="reports"   element={<Reports />} />
                </Route>
              </Routes>
            </main>

            <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
              <p className="font-medium tracking-widest uppercase text-zinc-600 mb-1">Luxe Wear</p>
              <p>© {new Date().getFullYear()} Luxe Wear. All rights reserved.</p>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
