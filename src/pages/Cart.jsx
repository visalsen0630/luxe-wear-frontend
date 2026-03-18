import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'

export default function Cart() {
  const { cart, removeItem, updateQty, total } = useCart()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-xl">Your cart is empty</p>
        <Link to="/products" className="text-black underline text-sm">Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light tracking-tight mb-8">Your Cart</h1>

      <div className="divide-y divide-gray-100">
        {cart.map((item) => (
          <div key={item.key} className="flex gap-4 py-5">
            <div className="w-20 h-24 bg-gray-100 shrink-0">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{item.color} · {item.size}</p>
                </div>
                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-gray-200">
                  <button
                    onClick={() => item.quantity > 1 ? updateQty(item.key, item.quantity - 1) : removeItem(item.key)}
                    className="px-3 py-1 hover:bg-gray-50"
                  >−</button>
                  <span className="px-3 py-1 text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.key, item.quantity + 1)}
                    className="px-3 py-1 hover:bg-gray-50"
                  >+</button>
                </div>
                <button
                  onClick={() => removeItem(item.key)}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 mt-4 pt-6">
        <div className="flex justify-between text-lg font-medium mb-6">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-black text-white py-4 uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}
