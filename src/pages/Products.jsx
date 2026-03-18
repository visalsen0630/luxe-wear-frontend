import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import ProductCard from '../components/ProductCard'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSize, setFilterSize] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  const filtered = products.filter((p) => {
    const matchesSize = !filterSize || (p.sizes && p.sizes.includes(filterSize))
    const matchesCat = !filterCategory || p.category === filterCategory
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return matchesSize && matchesCat && matchesSearch
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-light tracking-tight mb-8">All Products</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
        />
        <select
          value={filterSize}
          onChange={(e) => setFilterSize(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
        >
          <option value="">All Sizes</option>
          {SIZES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}
        {(filterSize || filterCategory || search) && (
          <button
            onClick={() => { setFilterSize(''); setFilterCategory(''); setSearch('') }}
            className="text-sm text-gray-500 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-24 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
