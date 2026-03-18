import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    async function load() {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4))
      const snap = await getDocs(q)
      setFeatured(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-950 text-white min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-4">New Collection</p>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6">
          Dress with <em className="not-italic font-semibold">purpose</em>
        </h1>
        <p className="text-gray-400 max-w-md mb-8">
          Timeless pieces crafted for the modern wardrobe. Quality you can feel.
        </p>
        <Link
          to="/products"
          className="bg-white text-black px-8 py-3 text-sm uppercase tracking-widest hover:bg-gray-200 transition-colors"
        >
          Shop Now
        </Link>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-light tracking-tight mb-8">Latest Arrivals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/products"
              className="border border-black px-8 py-3 text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { title: 'Free Shipping', desc: 'On all orders over $100' },
            { title: 'Easy Returns', desc: '30-day hassle-free returns' },
            { title: 'Sustainable', desc: 'Ethically sourced materials' },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
