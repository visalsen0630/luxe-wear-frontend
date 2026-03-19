import { useEffect, useRef, useState } from 'react'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const EMPTY = { name: '', price: '', category: '', description: '', colors: '', colorImages: {}, colorSizes: {} }
// colorSizes shape: { White: { XS: 10, S: 5 }, Black: { M: 3, L: 2 } }

function convertDriveUrl(url) {
  if (!url) return url
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (m) return `https://drive.google.com/uc?export=view&id=${m[1]}`
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m2 && url.includes('drive.google.com')) return `https://drive.google.com/uc?export=view&id=${m2[1]}`
  return url
}

export default function ManageProducts() {
  const [products, setProducts]           = useState([])
  const [form, setForm]                   = useState(EMPTY)
  const [editId, setEditId]               = useState(null)
  const [loading, setLoading]             = useState(false)
  const [showForm, setShowForm]           = useState(false)
  const [uploadError, setUploadError]     = useState('')
  const [saveError, setSaveError]         = useState('')
  const [uploadingColor, setUploadingColor] = useState(null)
  const [progress, setProgress]           = useState(0)
  const fileRefs = useRef({})

  async function loadProducts() {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { loadProducts() }, [])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleColorImageUrl(color, url) {
    setForm(f => ({ ...f, colorImages: { ...f.colorImages, [color]: convertDriveUrl(url) } }))
  }

  // Toggle size on/off for a color — default qty 1 when added
  function toggleColorSize(color, size) {
    setForm(f => {
      const curr = f.colorSizes[color] || {}
      const next = { ...curr }
      if (next[size] !== undefined) {
        delete next[size]
      } else {
        next[size] = 1
      }
      return { ...f, colorSizes: { ...f.colorSizes, [color]: next } }
    })
  }

  // Update qty for a specific color+size
  function handleSizeQty(color, size, qty) {
    setForm(f => ({
      ...f,
      colorSizes: {
        ...f.colorSizes,
        [color]: { ...(f.colorSizes[color] || {}), [size]: parseInt(qty) || 0 }
      }
    }))
  }

  function parsedColors() {
    return form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : []
  }

  async function uploadImageForColor(file) {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
      const task = uploadBytesResumable(storageRef, file)
      task.on('state_changed',
        snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
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
      const url = await uploadImageForColor(file)
      setForm(f => ({ ...f, colorImages: { ...f.colorImages, [color]: url } }))
    } catch (err) {
      setUploadError(`Upload failed for ${color}: ` + (err.message || ''))
    }
    setUploadingColor(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaveError('')

    // Client-side validation
    if (!form.name.trim()) return setSaveError('Product name is required.')
    if (!form.price || isNaN(parseFloat(form.price))) return setSaveError('A valid price is required.')
    const colors = parsedColors()
    if (colors.length === 0) return setSaveError('Add at least one color.')

    setLoading(true)
    try {
      const colorImages = {}
      const colorSizes  = {}
      colors.forEach(c => {
        if (form.colorImages[c]) colorImages[c] = form.colorImages[c]
        if (form.colorSizes[c] && Object.keys(form.colorSizes[c]).length)
          colorSizes[c] = form.colorSizes[c]
      })

      const stock = Object.values(colorSizes).reduce((sum, sizeMap) =>
        sum + Object.values(sizeMap).reduce((s, q) => s + (q || 0), 0), 0)
      const sizes = [...new Set(colors.flatMap(c => Object.keys(colorSizes[c] || {})))]
      const imageUrl = colors.length > 0 ? (colorImages[colors[0]] || '') : ''

      const data = { name: form.name.trim(), price: parseFloat(form.price),
        category: form.category, description: form.description,
        stock, sizes, colors, colorImages, colorSizes, imageUrl }

      if (editId) {
        await updateDoc(doc(db, 'products', editId), data)
      } else {
        await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() })
      }

      setForm(EMPTY); setEditId(null); setShowForm(false); setSaveError('')
      await loadProducts()
    } catch (err) {
      console.error('Firestore error:', err)
      setSaveError('Failed to save: ' + (err.message || 'Unknown error. Check console.'))
    }
    setLoading(false)
  }

  function startEdit(product) {
    setForm({
      name: product.name, price: product.price,
      category: product.category || '', description: product.description || '',
      colors: (product.colors || []).join(', '),
      colorImages: product.colorImages || {},
      colorSizes: product.colorSizes || {},
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

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-gray-200 p-6 mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h2 className="md:col-span-2 font-medium mb-2">{editId ? 'Edit Product' : 'New Product'}</h2>

          {[
            { name: 'name',     label: 'Product Name' },
            { name: 'price',    label: 'Price ($)',       type: 'number', step: '0.01' },
            { name: 'category', label: 'Category' },
          ].map(({ name, label, type = 'text', step }) => (
            <div key={name}>
              <label className="block text-sm text-gray-600 mb-1">{label}</label>
              <input type={type} name={name} step={step}
                value={form[name]} onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Description</label>
            <textarea name="description" rows={3} value={form.description} onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Colors (comma-separated)</label>
            <input type="text" name="colors" placeholder="White, Black, Navy"
              value={form.colors} onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black" />
          </div>

          {/* Per-color cards */}
          {colors.length > 0 && (
            <div className="md:col-span-2 space-y-4">
              <p className="text-sm text-gray-600">Color Variants <span className="text-gray-400 font-normal">(image + sizes + stock per color)</span></p>

              {colors.map(color => (
                <div key={color} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  {/* Header */}
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color.toLowerCase() }} />
                    {color}
                  </p>

                  {/* Image */}
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Image URL <span className="text-gray-400">(Google Drive links auto-converted)</span></p>
                      <input type="text" placeholder={`Paste URL for ${color}…`}
                        value={form.colorImages[color] || ''}
                        onChange={e => handleColorImageUrl(color, e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black" />
                      <p className="text-xs text-gray-400 mt-1">Or upload a file:</p>
                      <input type="file" accept="image/*"
                        ref={el => fileRefs.current[color] = el}
                        onChange={e => handleFileUpload(color, e.target.files[0])}
                        className="text-sm mt-1" />
                      {uploadingColor === color && <p className="text-xs text-gray-500 mt-1">Uploading… {progress}%</p>}
                    </div>
                    {form.colorImages[color] && (
                      <img src={form.colorImages[color]} alt={color}
                        className="h-16 w-16 object-cover border shrink-0 rounded"
                        onError={e => e.target.style.display = 'none'} />
                    )}
                  </div>

                  {/* Sizes + qty */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Sizes & Stock for {color}</p>
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map(s => {
                        const active = (form.colorSizes[color] || {})[s] !== undefined
                        return (
                          <div key={s} className="flex flex-col items-center gap-1">
                            <button type="button" onClick={() => toggleColorSize(color, s)}
                              className={`w-12 h-9 text-sm border transition-colors ${active ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-black'}`}>
                              {s}
                            </button>
                            {active && (
                              <input
                                type="number" min="0"
                                value={(form.colorSizes[color] || {})[s] ?? ''}
                                onChange={e => handleSizeQty(color, s, e.target.value)}
                                className="w-12 border border-gray-300 px-1 py-0.5 text-xs text-center focus:outline-none focus:border-black"
                                placeholder="qty"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              Upload error: {uploadError}
            </div>
          )}

          {saveError && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {saveError}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => { setShowForm(false); setSaveError('') }}
              className="px-5 py-2 text-sm border border-gray-300 hover:border-black transition-colors">Cancel</button>
            <button type="submit" disabled={loading || uploadingColor !== null}
              className="px-5 py-2 text-sm bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50">
              {loading ? 'Saving…' : editId ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
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
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-12 h-14 object-cover bg-gray-100" />
                    : <div className="w-12 h-14 bg-gray-100 flex items-center justify-center text-gray-300">✦</div>}
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
        {products.length === 0 && <p className="text-center py-12 text-gray-400">No products yet.</p>}
      </div>
    </div>
  )
}
