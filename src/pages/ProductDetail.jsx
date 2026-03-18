import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { currentUser } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'products', id))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setProduct(data)
        if (data.sizes?.length) setSelectedSize(data.sizes[0])
        if (data.colors?.length) setSelectedColor(data.colors[0])
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleAddToCart() {
    if (!currentUser) return navigate('/login')
    if (!selectedSize || !selectedColor) return
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size: selectedSize,
      color: selectedColor,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading…</div>
  if (!product) return <div className="text-center py-24 text-gray-400">Product not found.</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-gray-100 aspect-[3/4]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
              ✦
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-center">
          <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">
            {product.category || 'Clothing'}
          </p>
          <h1 className="text-3xl font-light mb-2">{product.name}</h1>
          <p className="text-2xl mb-4">${Number(product.price).toFixed(2)}</p>

          {product.description && (
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{product.description}</p>
          )}

          {/* Color */}
          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium mb-2">Color: <span className="font-normal">{selectedColor}</span></p>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1 text-sm border transition-colors ${
                      selectedColor === c ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-12 h-10 text-sm border transition-colors ${
                      selectedSize === s ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-6">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="bg-black text-white py-4 uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors disabled:opacity-40"
          >
            {added ? 'Added to Cart ✓' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
