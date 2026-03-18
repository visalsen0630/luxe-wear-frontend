import { Link } from 'react-router-dom'

export default function AdminPanel() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-light tracking-tight mb-2">Admin Panel</h1>
      <p className="text-gray-400 text-sm mb-10">Manage your store</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/products"
          className="border border-gray-200 p-8 hover:border-black transition-colors group"
        >
          <div className="text-3xl mb-4">👗</div>
          <h2 className="text-lg font-medium mb-1">Products</h2>
          <p className="text-sm text-gray-400">Add, edit, and delete clothing items</p>
        </Link>

        <Link
          to="/admin/orders"
          className="border border-gray-200 p-8 hover:border-black transition-colors group"
        >
          <div className="text-3xl mb-4">📦</div>
          <h2 className="text-lg font-medium mb-1">Orders</h2>
          <p className="text-sm text-gray-400">View and update order statuses</p>
        </Link>
      </div>
    </div>
  )
}
