import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import ProductCard from '../components/ProductCard'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SUBCATEGORIES = {
  men:   ['T-Shirts', 'Shirts', 'Pants', 'Jackets', 'Shorts', 'Sweaters', 'Accessories'],
  women: ['Tops', 'Dresses', 'Pants', 'Jackets', 'Skirts', 'Sweaters', 'Accessories'],
}

function Chevron({ open }) {
  return (
    <svg className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function Section({ title, open, onToggle, children }) {
  return (
    <div className="border-b border-zinc-100 py-3">
      <button className="flex items-center justify-between w-full text-sm font-medium text-zinc-700 py-0.5" onClick={onToggle}>
        {title}<Chevron open={open} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

export default function Products() {
  const [products, setProducts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]           = useState('')
  const [filterSize, setFilterSize]   = useState('')
  const [filterSub, setFilterSub]     = useState('')
  const [filterAvail, setFilterAvail] = useState('')
  const [open, setOpen]               = useState({ size: true, avail: false, cat: true })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const gender = searchParams.get('gender') || ''

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => { setFilterSub('') }, [gender])

  function setGender(g) {
    g ? setSearchParams({ gender: g }) : setSearchParams({})
  }

  const filtered = products.filter(p => {
    if (gender && p.gender && p.gender !== gender && p.gender !== 'both') return false
    if (filterSize && !(p.sizes || []).includes(filterSize)) return false
    if (filterSub && p.category !== filterSub) return false
    if (filterAvail === 'instock'    && !(p.stock > 0)) return false
    if (filterAvail === 'outofstock' && p.stock > 0)    return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const subcats = gender ? (SUBCATEGORIES[gender] || []) : [...new Set([...SUBCATEGORIES.men, ...SUBCATEGORIES.women])]
  const toggle = k => setOpen(o => ({ ...o, [k]: !o[k] }))
  const genderLabel = gender ? gender.charAt(0).toUpperCase() + gender.slice(1) + "'s" : 'All Products'
  const hasFilters = filterSize || filterSub || filterAvail

  const sidebar = (
    <>
      {/* Gender buttons */}
      <div className="flex gap-1.5 mb-5">
        {[['', 'All'], ['men', 'Men'], ['women', 'Women']].map(([g, label]) => (
          <button key={g} onClick={() => setGender(g)}
            className={`flex-1 py-1.5 text-xs uppercase tracking-widest border transition-colors ${gender === g ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'}`}>
            {label}
          </button>
        ))}
      </div>

      <Section title="Size" open={open.size} onToggle={() => toggle('size')}>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map(s => (
            <button key={s} onClick={() => setFilterSize(filterSize === s ? '' : s)}
              className={`w-10 h-9 text-xs border transition-colors ${filterSize === s ? 'border-black bg-black text-white' : 'border-zinc-200 text-zinc-600 hover:border-black'}`}>
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Availability" open={open.avail} onToggle={() => toggle('avail')}>
        <div className="space-y-2">
          {[['', 'All'], ['instock', 'In Stock'], ['outofstock', 'Out of Stock']].map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
              <input type="radio" name="avail" checked={filterAvail === val} onChange={() => setFilterAvail(val)} className="accent-black" />
              {label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Category" open={open.cat} onToggle={() => toggle('cat')}>
        <div className="space-y-1">
          <button onClick={() => setFilterSub('')}
            className={`block text-sm w-full text-left py-0.5 transition-colors ${!filterSub ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'}`}>
            All
          </button>
          {subcats.map(s => (
            <button key={s} onClick={() => setFilterSub(filterSub === s ? '' : s)}
              className={`block text-sm w-full text-left py-0.5 transition-colors ${filterSub === s ? 'text-black font-medium' : 'text-zinc-500 hover:text-black'}`}>
              {s}
            </button>
          ))}
        </div>
      </Section>
    </>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <p className="text-xs text-zinc-400 mb-5 hidden md:block">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-600">Products</span>
        {gender && <><span className="mx-1.5">›</span><span className="text-zinc-800 capitalize">{gender}</span></>}
      </p>

      {/* Mobile: gender tabs */}
      <div className="md:hidden flex border-b border-zinc-200 mb-4 -mx-4 px-4">
        {[['', 'All'], ['men', 'Men'], ['women', 'Women']].map(([g, label]) => (
          <button key={g} onClick={() => setGender(g)}
            className={`flex-1 py-3 text-sm uppercase tracking-widest font-medium transition-colors border-b-2 -mb-px ${gender === g ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-10">
        {/* Sidebar desktop */}
        <aside className="hidden md:block w-52 shrink-0">
          <h1 className="text-2xl font-light tracking-tight mb-1">{genderLabel}</h1>
          <p className="text-xs text-zinc-400 mb-5">{!loading && `${filtered.length} products`}</p>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">Filters</p>
          {sidebar}
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Search + filter row */}
          <div className="flex gap-3 mb-4 items-center">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full border border-zinc-200 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" />
            </div>
            {/* Mobile filter button */}
            <button className="md:hidden flex items-center gap-1.5 border border-zinc-200 rounded-full px-4 py-2.5 text-sm text-zinc-600 hover:border-zinc-400 transition-colors"
              onClick={() => setMobileFiltersOpen(o => !o)}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18M7 12h10M11 20h2" />
              </svg>
              Filter
            </button>
            {/* Desktop count */}
            <span className="hidden md:block text-sm text-zinc-400 whitespace-nowrap">
              {!loading && `${filtered.length} items`}
            </span>
          </div>

          {/* Mobile filter panel */}
          {mobileFiltersOpen && (
            <div className="md:hidden border border-zinc-200 rounded-2xl p-4 mb-5 bg-white shadow-sm">
              {sidebar}
            </div>
          )}

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {filterSize && (
                <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 rounded-full px-3 py-1.5">
                  Size: {filterSize}
                  <button onClick={() => setFilterSize('')} className="ml-0.5 text-zinc-400 hover:text-black">✕</button>
                </span>
              )}
              {filterSub && (
                <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 rounded-full px-3 py-1.5">
                  {filterSub}
                  <button onClick={() => setFilterSub('')} className="ml-0.5 text-zinc-400 hover:text-black">✕</button>
                </span>
              )}
              {filterAvail && (
                <span className="inline-flex items-center gap-1 text-xs bg-zinc-100 rounded-full px-3 py-1.5">
                  {filterAvail === 'instock' ? 'In Stock' : 'Out of Stock'}
                  <button onClick={() => setFilterAvail('')} className="ml-0.5 text-zinc-400 hover:text-black">✕</button>
                </span>
              )}
              <button onClick={() => { setFilterSize(''); setFilterSub(''); setFilterAvail('') }}
                className="text-xs text-zinc-400 hover:text-black underline underline-offset-2">
                Clear all
              </button>
            </div>
          )}

          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-zinc-200 aspect-[3/4] rounded-xl mb-3" />
                  <div className="h-3 bg-zinc-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-zinc-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-zinc-400 text-lg mb-2">No products found</p>
              <button onClick={() => { setFilterSize(''); setFilterSub(''); setFilterAvail(''); setSearch('') }}
                className="text-sm text-black underline underline-offset-2">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
