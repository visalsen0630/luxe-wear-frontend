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
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative bg-zinc-950 text-white min-h-[90vh] flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black opacity-80" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.5em] uppercase text-zinc-400 mb-6">New Collection 2026</p>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 leading-tight">
            Dress with <span className="font-semibold italic">purpose</span>
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto mb-10 text-base leading-relaxed">
            Timeless pieces crafted for the modern wardrobe. Quality you can feel, style you can trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products"
              className="bg-white text-black px-8 py-3.5 text-sm font-medium tracking-widest uppercase hover:bg-zinc-100 transition-colors rounded-full">
              Shop Now
            </Link>
            <Link to="/products"
              className="border border-zinc-600 text-white px-8 py-3.5 text-sm font-medium tracking-widest uppercase hover:border-white transition-colors rounded-full">
              View Collection
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-zinc-600 animate-pulse" />
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-zinc-400 mb-2">Handpicked for you</p>
              <h2 className="text-3xl font-light tracking-tight">Latest Arrivals</h2>
            </div>
            <Link to="/products" className="text-sm text-zinc-500 hover:text-black underline underline-offset-4 transition-colors hidden sm:block">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center mt-10 sm:hidden">
            <Link to="/products" className="text-sm text-zinc-500 hover:text-black underline underline-offset-4">
              View all products
            </Link>
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="bg-zinc-50 py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On all orders over $100' },
            { icon: '↩️', title: 'Easy Returns', desc: '30-day hassle-free returns' },
            { icon: '✦', title: 'Sustainable', desc: 'Ethically sourced materials' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm">
              <span className="text-2xl mb-3">{item.icon}</span>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-sm text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-black text-white py-20 text-center px-4">
        <p className="text-xs tracking-[0.4em] uppercase text-zinc-400 mb-4">Limited Time</p>
        <h2 className="text-4xl font-light mb-4">Members get early access</h2>
        <p className="text-zinc-400 mb-8 max-w-sm mx-auto">Sign up today and be the first to know about new drops and exclusive deals.</p>
        <Link to="/signup"
          className="inline-block bg-white text-black px-8 py-3.5 text-sm font-medium tracking-widest uppercase hover:bg-zinc-100 transition-colors rounded-full">
          Create Account
        </Link>
      </section>
    </div>
  )
}
