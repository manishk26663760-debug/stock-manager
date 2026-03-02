// Mock data service using localStorage when Supabase is not configured
import type { Product, StockTransaction } from '../types'

const PRODUCTS_KEY = 'stock_products'
const TRANSACTIONS_KEY = 'stock_transactions'

const defaultProducts: Product[] = [
  { id: '1', name: 'Light Blue T-Shirt', current_stock: 0 },
  { id: '2', name: 'Dark Blue T-Shirt', current_stock: 0 },
  { id: '3', name: 'Black Jacket', current_stock: 0 },
  { id: '4', name: 'Blue Jacket', current_stock: 0 },
]

export const mockData = {
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(PRODUCTS_KEY)
    if (stored) return JSON.parse(stored)
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultProducts))
    return defaultProducts
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  },

  getTransactions: (): StockTransaction[] => {
    const stored = localStorage.getItem(TRANSACTIONS_KEY)
    return stored ? JSON.parse(stored) : []
  },

  saveTransactions: (transactions: StockTransaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
  },

  updateProductStock: (productId: string, quantity: number, type: 'IN' | 'OUT') => {
    const products = mockData.getProducts()
    const product = products.find(p => p.id === productId)
    if (!product) return { error: 'Product not found' }

    if (type === 'OUT' && product.current_stock < quantity) {
      return { error: 'Insufficient stock' }
    }

    const newStock = type === 'IN' 
      ? product.current_stock + quantity 
      : product.current_stock - quantity

    product.current_stock = newStock
    mockData.saveProducts(products)

    // Add transaction
    const transactions = mockData.getTransactions()
    transactions.unshift({
      id: Date.now().toString(),
      product_id: productId,
      type,
      quantity,
      created_at: new Date().toISOString(),
      products: product
    })
    mockData.saveTransactions(transactions)

    return { success: true }
  },

  addTransaction: (productId: string, type: 'IN' | 'OUT', quantity: number) => {
    const products = mockData.getProducts()
    const product = products.find(p => p.id === productId)
    if (!product) return

    const transactions = mockData.getTransactions()
    transactions.unshift({
      id: Date.now().toString(),
      product_id: productId,
      type,
      quantity,
      created_at: new Date().toISOString(),
      products: product
    })
    mockData.saveTransactions(transactions)
  },

  importExcel: (updates: { productName: string; quantity: number }[]) => {
    const products = mockData.getProducts()
    const results: { success: boolean; message: string; productName: string; quantity: number }[] = []

    updates.forEach(({ productName, quantity }) => {
      const product = products.find(p => 
        p.name.toLowerCase() === productName.toLowerCase()
      )

      if (!product) {
        results.push({ success: false, message: 'Product not found', productName, quantity })
        return
      }

      product.current_stock += quantity

      // Add transaction
      const transactions = mockData.getTransactions()
      transactions.unshift({
        id: Date.now().toString() + Math.random(),
        product_id: product.id,
        type: 'IN',
        quantity,
        created_at: new Date().toISOString(),
        products: product
      })
      mockData.saveTransactions(transactions)

      results.push({ success: true, message: 'Stock updated successfully', productName, quantity })
    })

    mockData.saveProducts(products)
    return results
  }
}
