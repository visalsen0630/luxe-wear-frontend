import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="group">
      <div className="overflow-hidden bg-zinc-100 aspect-[3/4] rounded-xl">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="mt-3 px-0.5">
        <p className="text-xs text-zinc-400 capitalize tracking-wide">{product.category || 'Clothing'}</p>
        <h3 className="font-medium text-zinc-900 mt-0.5 text-sm group-hover:text-black transition-colors">{product.name}</h3>
        <p className="text-zinc-700 mt-1 text-sm font-medium">${Number(product.price).toFixed(2)}</p>
      </div>
    </Link>
  )
}
