import { useState, useEffect } from 'react'
import { ArrowDownCircle, CheckCircle, Search } from 'lucide-react'
import { db } from '../lib/db'
import type { Product } from '../types'

export default function StockIn() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data } = await db.getProducts()
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setSearchQuery(product.name)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!selectedProduct) {
      setError('Please search and select a product')
      return
    }

    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    setLoading(true)

    try {
      const result = await db.updateStock(selectedProduct.id, qty, 'IN')

      if (!result.success) {
        setError(result.error || 'Failed to add stock')
        setLoading(false)
        return
      }

      setSuccess(true)
      setSelectedProduct(null)
      setSearchQuery('')
      setQuantity('')
      
      // Refresh products list
      fetchProducts()
      
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error adding stock:', err)
      setError('Failed to add stock. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show suggestions only when typing and no product selected
  const showSuggestions = searchQuery.length > 0 && 
    (!selectedProduct || selectedProduct.name !== searchQuery)

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Stock In</h2>
            <p className="text-sm text-gray-500">Add stock to inventory</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Stock added successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Product
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSelectedProduct(null)
                  setError('')
                }}
                placeholder="Type product name..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">Current: {product.current_stock} units</p>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && filteredProducts.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-gray-500 text-center">
                No products found
              </div>
            )}
          </div>

          {/* Selected Product Display */}
          {selectedProduct && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-600 font-medium">Selected Product:</p>
              <p className="text-gray-800 font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-gray-500">Current Stock: {selectedProduct.current_stock}</p>
            </div>
          )}

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-5 h-5" />
                Add Stock
              </>
            )}
          </button>
        </form>

        {/* Quick Select Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Quick Select:</p>
          <div className="flex flex-wrap gap-2">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleProductSelect(product)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  selectedProduct?.id === product.id
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {product.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
