import { useEffect, useRef, useState } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const EMPTY = { name: '', price: '', category: '', description: '', stock: '', sizes: [], colors: '', colorImages: {} }

export default function ManageProducts() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadingColor, setUploadingColor] = useState(null)
  const fileRefs = useRef({})

  async function loadProducts() {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { loadProducts() }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleColorImageUrl(color, url) {
    setForm((f) => ({ ...f, colorImages: { ...f.colorImages, [color]: url } }))
  }

  function toggleSize(size) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }))
  }

  function parsedColors() {
    return form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : []
  }

  async function uploadImageForColor(file, color) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
      const task = uploadBytesResumable(storageRef, file)
      task.on(
        'state_changed',
        (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      )
    })
  }

  async function handleFileUpload(color, file) {
    if (!file) return
    setUploadingColor(color)
    setUploadError('')
    try {
      const url = await uploadImageForColor(file, color)
      handleColorImageUrl(color, url)
    } catch (err) {
      setUploadError(`Upload failed for ${color}: ` + (err.message || ''))
    }
    setUploadingColor(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const colors = parsedColors()
      const colorImages = {}
      colors.forEach(c => {
        if (form.colorImages[c]) colorImages[c] = form.colorImages[c]
      })
      const imageUrl = colors.length > 0 ? (colorImages[colors[0]] || '') : ''

      const data = {
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        description: form.description,
        stock: parseInt(form.stock) || 0,
        sizes: form.sizes,
        colors,
        colorImages,
        imageUrl,
      }

      if (editId) {
        await updateDoc(doc(db, 'products', editId), data)
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() })
      }

      setForm(EMPTY)
      setEditId(null)
      setShowForm(false)
      await loadProducts()
    } catch (err) {
      console.error(err)
      alert('Error saving product.')
    }
    setLoading(false)
  }

  function startEdit(product) {
    setForm({
      name: product.name,
      price: product.price,
      category: product.category || '',
      description: product.description || '',
      stock: product.stock,
      sizes: product.sizes || [],
      colors: (product.colors || []).join(', '),
      colorImages: product.colorImages || {},
    })
    setEditId(product.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    await deleteDoc(doc(db, 'products', id))
    await loadProducts()
  }

  const colors = parsedColors()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-light tracking-tight">Products</h1>
        <button
          onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(!showForm) }}
          className="bg-black text-white px-5 py-2 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 p-6 mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="md:col-span-2 font-medium mb-2">{editId ? 'Edit Product' : 'New Product'}</h2>

          {[
            { name: 'name', label: 'Product Name' },
            { name: 'price', label: 'Price ($)', type: 'number', step: '0.01' },
            { name: 'category', label: 'Category (e.g. Tops, Bottoms)' },
            { name: 'stock', label: 'Stock Quantity', type: 'number' },
          ].map(({ name, label, type = 'text', step }) => (
            <div key={name}>
              <label className="block text-sm text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                step={step}
                required={name !== 'category'}
                value={form[name]}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-2">Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSize(s)}
                  className={`w-12 h-9 text-sm border transition-colors ${
                    form.sizes.includes(s) ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors input */}
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Colors (comma-separated)</label>
            <input
              type="text"
              name="colors"
              placeholder="White, Black, Navy"
              value={form.colors}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Per-color image inputs */}
          {colors.length > 0 && (
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-3">Product Images <span className="text-gray-400 font-normal">(one per color)</span></label>
              <div className="space-y-4">
                {colors.map((color) => (
                  <div key={color} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      {color}
                    </p>
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Image URL for ${color}`}
                          value={form.colorImages[color] || ''}
                          onChange={(e) => handleColorImageUrl(color, e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                        <p className="text-xs text-gray-400 mt-1">Or upload a file:</p>
                        <input
                          type="file"
                          accept="image/*"
                          ref={el => fileRefs.current[color] = el}
                          onChange={(e) => handleFileUpload(color, e.target.files[0])}
                          className="text-sm mt-1"
                        />
                        {uploadingColor === color && (
                          <p className="text-xs text-gray-500 mt-1">Uploading… {progress}%</p>
                        )}
                      </div>
                      {form.colorImages[color] && (
                        <img
                          src={form.colorImages[color]}
                          alt={color}
                          className="h-16 w-16 object-cover border shrink-0 rounded"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 text-sm border border-gray-300 hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingColor !== null}
              className="px-5 py-2 text-sm bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : editId ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      )}

      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-3 font-medium">Image</th>
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium">Stock</th>
              <th className="pb-3 font-medium">Category</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-14 object-cover bg-gray-100" />
                  ) : (
                    <div className="w-12 h-14 bg-gray-100 flex items-center justify-center text-gray-300">✦</div>
                  )}
                </td>
                <td className="py-3 pr-4 font-medium">{p.name}</td>
                <td className="py-3 pr-4">${Number(p.price).toFixed(2)}</td>
                <td className="py-3 pr-4">{p.stock}</td>
                <td className="py-3 pr-4 capitalize">{p.category || '—'}</td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(p)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="text-center py-12 text-gray-400">No products yet.</p>
        )}
      </div>
    </div>
  )
}
