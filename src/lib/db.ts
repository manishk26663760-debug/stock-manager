import { supabase } from './supabase'
import { mockData } from './mockData'
import type { Product, StockTransaction } from '../types'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  return url && url !== 'https://your-project.supabase.co' && url !== ''
}

export const db = {
  getProducts: async (): Promise<{ data: Product[] | null; error: any }> => {
    if (!isSupabaseConfigured()) {
      return { data: mockData.getProducts(), error: null }
    }
    return await supabase.from('products').select('*').order('name')
  },

  getTransactions: async (limit?: number): Promise<{ data: StockTransaction[] | null; error: any }> => {
    if (!isSupabaseConfigured()) {
      let transactions = mockData.getTransactions()
      if (limit) transactions = transactions.slice(0, limit)
      return { data: transactions, error: null }
    }
    let query = supabase.from('stock_transactions').select('*, products(name)').order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)
    return await query
  },

  updateStock: async (productId: string, quantity: number, type: 'IN' | 'OUT'): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      const result = mockData.updateProductStock(productId, quantity, type)
      return result.error ? { success: false, error: result.error } : { success: true }
    }

    // Get current stock
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', productId)
      .single()

    if (productError) return { success: false, error: 'Failed to get product' }

    const currentStock = productData?.current_stock || 0

    if (type === 'OUT' && quantity > currentStock) {
      return { success: false, error: `Not enough stock. Available: ${currentStock}` }
    }

    const newStock = type === 'IN' ? currentStock + quantity : currentStock - quantity

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', productId)

    if (updateError) return { success: false, error: 'Failed to update stock' }

    // Create transaction
    const { error: transactionError } = await supabase
      .from('stock_transactions')
      .insert({ product_id: productId, type, quantity })

    if (transactionError) return { success: false, error: 'Failed to create transaction' }

    return { success: true }
  },

  importExcel: async (updates: { productName: string; quantity: number }[]): Promise<any[]> => {
    if (!isSupabaseConfigured()) {
      return mockData.importExcel(updates)
    }

    // Get all products
    const { data: products, error: productsError } = await supabase.from('products').select('*')
    if (productsError) return [{ success: false, message: 'Failed to load products', productName: '', quantity: 0 }]

    const results: any[] = []

    for (const { productName, quantity } of updates) {
      const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase())
      
      if (!product) {
        results.push({ success: false, message: 'Product not found', productName, quantity })
        continue
      }

      const newStock = product.current_stock + quantity

      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newStock })
        .eq('id', product.id)

      if (updateError) {
        results.push({ success: false, message: 'Failed to update stock', productName, quantity })
        continue
      }

      const { error: transactionError } = await supabase
        .from('stock_transactions')
        .insert({ product_id: product.id, type: 'IN', quantity })

      if (transactionError) {
        results.push({ success: false, message: 'Stock updated but transaction not recorded', productName, quantity })
        continue
      }

      results.push({ success: true, message: 'Stock updated successfully', productName, quantity })
    }

    return results
  }
}
