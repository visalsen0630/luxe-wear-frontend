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
  const hasFilters = filterSize || filterCategory || search

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] uppercase text-zinc-400 mb-2">Collection</p>
        <h1 className="text-3xl font-light tracking-tight">All Products</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-zinc-50 rounded-2xl">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white transition-colors" />
        </div>

        <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)}
          className="border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white transition-colors">
          <option value="">All Sizes</option>
          {SIZES.map((s) => <option key={s}>{s}</option>)}
        </select>

        {categories.length > 0 && (
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white transition-colors">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        )}

        {hasFilters && (
          <button onClick={() => { setFilterSize(''); setFilterCategory(''); setSearch('') }}
            className="text-sm text-zinc-500 hover:text-black underline underline-offset-2 transition-colors whitespace-nowrap">
            Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-zinc-400 mb-6">
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          {hasFilters && ' found'}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-zinc-200 aspect-[3/4] rounded-xl mb-3" />
              <div className="h-3 bg-zinc-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2" />
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-zinc-400 text-lg mb-2">No products found</p>
          {hasFilters && (
            <button onClick={() => { setFilterSize(''); setFilterCategory(''); setSearch('') }}
              className="text-sm text-black underline underline-offset-2">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
