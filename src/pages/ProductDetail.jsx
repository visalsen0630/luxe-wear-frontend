import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'

const COLOR_MAP = {
  black: '#111111', white: '#ffffff', gray: '#9ca3af', grey: '#9ca3af',
  red: '#ef4444', blue: '#3b82f6', navy: '#1e3a5f', green: '#22c55e',
  beige: '#d4b896', cream: '#f5f0e8', brown: '#92400e', pink: '#ec4899',
  purple: '#a855f7', yellow: '#eab308', orange: '#f97316', silver: '#c0c0c0',
}

function getColorHex(name) {
  return COLOR_MAP[name?.toLowerCase()] || '#d1d5db'
}

// Returns { sizeName: qty } for the selected color, or {} if not set
function getSizeMap(product, color) {
  if (product.colorSizes && color && product.colorSizes[color]) {
    return product.colorSizes[color] // { XS: 10, S: 5, ... }
  }
  // Fallback: convert old sizes array with stock=product.stock/sizes.length
  if (product.sizes?.length) {
    const fallbackQty = Math.floor((product.stock || 0) / product.sizes.length) || 0
    return Object.fromEntries(product.sizes.map(s => [s, fallbackQty]))
  }
  return {}
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { currentUser } = useAuth()

  const [product, setProduct]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [selectedSize, setSelectedSize]   = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity]           = useState(1)
  const [added, setAdded]                 = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'products', id))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setProduct(data)
        const firstColor = data.colors?.[0] || ''
        setSelectedColor(firstColor)
        const sizeMap = getSizeMap(data, firstColor)
        setSelectedSize(Object.keys(sizeMap)[0] || '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleColorSelect(color) {
    setSelectedColor(color)
    setQuantity(1)
    const sizeMap = getSizeMap(product, color)
    setSelectedSize(Object.keys(sizeMap)[0] || '')
  }

  function handleSizeSelect(size) {
    setSelectedSize(size)
    setQuantity(1)
  }

  function handleAddToCart() {
    if (!currentUser) return navigate('/login')
    if (!selectedSize || !selectedColor) return
    const src = (product.colorImages && product.colorImages[selectedColor]) || product.imageUrl
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: src, size: selectedSize, color: selectedColor, quantity })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    if (!currentUser) return navigate('/login')
    if (!selectedSize || !selectedColor) return
    const src = (product.colorImages && product.colorImages[selectedColor]) || product.imageUrl
    addItem({ id: product.id, name: product.name, price: product.price, imageUrl: src, size: selectedSize, color: selectedColor, quantity })
    navigate('/checkout')
  }

  if (loading) return <div className="text-center py-24 text-zinc-400">Loading…</div>
  if (!product) return <div className="text-center py-24 text-zinc-400">Product not found.</div>

  const sizeMap    = getSizeMap(product, selectedColor)       // { XS: 10, S: 5, ... }
  const sizeStock  = selectedSize ? (sizeMap[selectedSize] ?? 0) : 0
  const displayImg = (product.colorImages && selectedColor && product.colorImages[selectedColor]) || product.imageUrl

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-zinc-400 mb-8 flex items-center gap-1.5 flex-wrap">
        <span className="hover:text-zinc-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Home</span>
        <span>/</span>
        <span className="hover:text-zinc-600 cursor-pointer transition-colors" onClick={() => navigate('/products')}>
          {product.category || 'Products'}
        </span>
        <span>/</span>
        <span className="text-zinc-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="bg-zinc-100 rounded-2xl overflow-hidden aspect-square max-h-[420px]">
          {displayImg
            ? <img src={displayImg} alt={product.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-zinc-300 text-6xl">✦</div>}
        </div>

        {/* Info */}
        <div className="flex flex-col justify-start pt-2">
          {/* Category badge */}
          <span className="inline-block self-start text-[10px] font-semibold tracking-widest uppercase bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full mb-4">
            {product.category || 'Fashion'}
          </span>

          <h1 className="text-2xl font-semibold text-zinc-900 leading-snug mb-3">{product.name}</h1>

          {/* Stars */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-amber-400 text-sm gap-0.5">{[1,2,3,4,5].map(i => <span key={i}>★</span>)}</div>
            <span className="text-xs text-zinc-400">(4.8 from 128 Reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-semibold text-zinc-900">${Number(product.price).toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-base text-zinc-400 line-through">${Number(product.originalPrice).toFixed(2)}</span>
            )}
          </div>

          {/* Color + Quantity */}
          <div className="flex items-start gap-10 mb-6">
            {product.colors?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-2">Available Color</p>
                <div className="flex gap-2">
                  {product.colors.map(c => (
                    <button key={c} onClick={() => handleColorSelect(c)} title={c}
                      style={{ backgroundColor: getColorHex(c) }}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        selectedColor === c ? 'border-zinc-800 scale-110 shadow-md' : 'border-zinc-200 hover:border-zinc-400'
                      } ${c.toLowerCase() === 'white' ? 'shadow-inner' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-2">Quantity</p>
              <div className="flex items-center border border-zinc-200 rounded-full overflow-hidden w-fit">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-lg leading-none">−</button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(sizeStock || 99, q + 1))}
                  className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors text-lg leading-none">+</button>
              </div>
            </div>
          </div>

          {/* Sizes with stock */}
          {Object.keys(sizeMap).length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-2">Available Size</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sizeMap).map(([s, qty]) => {
                  const outOfStock = qty <= 0
                  const active = selectedSize === s
                  return (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => !outOfStock && handleSizeSelect(s)}
                        disabled={outOfStock}
                        className={`px-4 py-1.5 rounded-full text-sm border transition-all relative ${
                          outOfStock
                            ? 'border-zinc-100 text-zinc-300 cursor-not-allowed line-through'
                            : active
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                        }`}
                      >
                        {s}
                      </button>
                      <span className={`text-[10px] ${outOfStock ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {outOfStock ? 'sold out' : `${qty} left`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={handleBuyNow} disabled={!sizeStock}
              className="flex-1 py-3 rounded-full border-2 border-zinc-900 text-zinc-900 text-sm font-semibold tracking-wide uppercase hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-40">
              Buy It Now
            </button>
            <button onClick={handleAddToCart} disabled={!sizeStock}
              className="flex-1 py-3 rounded-full bg-zinc-900 text-white text-sm font-semibold tracking-wide uppercase hover:bg-zinc-700 transition-all disabled:opacity-40">
              {added ? 'Added ✓' : 'Add to Cart'}
            </button>
          </div>

          {product.description && (
            <p className="text-sm text-zinc-500 mt-6 leading-relaxed border-t border-zinc-100 pt-6">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
