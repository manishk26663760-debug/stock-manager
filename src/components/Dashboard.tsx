import { useEffect, useState } from 'react'
import { Package, TrendingUp, Box, ArrowDownCircle, ArrowUpCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { db } from '../lib/db'
import type { Product, StockTransaction } from '../types'

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [recentTransactions, setRecentTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const { data: productsData } = await db.getProducts()
      const { data: transactionsData } = await db.getTransactions(5)
      
      setProducts(productsData || [])
      setRecentTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadStockExcel = () => {
    const data = products.map(p => ({
      'Product Name': p.name,
      'Current Stock': p.current_stock
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Current Stock')
    
    // Auto-adjust column widths
    const colWidths = [
      { wch: 25 }, // Product Name
      { wch: 15 }  // Current Stock
    ]
    ws['!cols'] = colWidths

    XLSX.writeFile(wb, `current_stock_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0)
  const lowStockItems = products.filter(p => p.current_stock < 10).length

  const getProductIcon = (name: string) => {
    if (name.toLowerCase().includes('t-shirt')) {
      return <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><span className="text-xl">👕</span></div>
    }
    return <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><span className="text-xl">🧥</span></div>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Stock</p>
              <p className="text-3xl font-bold mt-1">{totalStock}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Box className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Products</p>
              <p className="text-3xl font-bold mt-1">{products.length}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold mt-1">{lowStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid with Download Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Current Stock</h2>
          <button
            onClick={downloadStockExcel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download Excel
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                product.current_stock < 10
                  ? 'border-orange-200 bg-orange-50'
                  : product.current_stock > 50
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {getProductIcon(product.name)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate text-sm">{product.name}</p>
                </div>
              </div>
              <p className={`text-2xl font-bold ${
                product.current_stock < 10 ? 'text-orange-600' : 'text-gray-900'
              }`}>
                {product.current_stock}
              </p>
              <p className="text-xs text-gray-500 mt-1">units in stock</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'IN' ? (
                      <ArrowDownCircle className="w-5 h-5" />
                    ) : (
                      <ArrowUpCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {transaction.products?.name || 'Unknown Product'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.type === 'IN'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type === 'IN' ? '+' : '-'}{transaction.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
