import { useEffect, useState } from 'react'
import { History, ArrowDownCircle, ArrowUpCircle, FileSpreadsheet, Download } from 'lucide-react'
import { db } from '../lib/db'
import type { StockTransaction } from '../types'

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data } = await db.getTransactions()
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(t => 
    filter === 'ALL' || t.type === filter
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const downloadCSV = () => {
    const headers = ['Date', 'Product Name', 'Type', 'Quantity']
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        formatDate(t.created_at),
        t.products?.name || 'Unknown',
        t.type,
        t.quantity
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
            <p className="text-sm text-gray-500">View all stock movements</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['ALL', 'IN', 'OUT'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === type
                ? type === 'IN'
                  ? 'bg-emerald-100 text-emerald-700'
                  : type === 'OUT'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === 'ALL' ? 'All' : type === 'IN' ? 'Stock In' : 'Stock Out'}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Product</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">
                        {transaction.products?.name || 'Unknown Product'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'IN' ? (
                          <>
                            <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              IN
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowUpCircle className="w-4 h-4 text-red-500" />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              OUT
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${
                        transaction.type === 'IN' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'IN' ? '+' : '-'}{transaction.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
