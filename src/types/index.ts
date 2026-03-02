export interface Product {
  id: string
  name: string
  current_stock: number
}

export interface StockTransaction {
  id: string
  product_id: string
  type: 'IN' | 'OUT'
  quantity: number
  created_at: string
  products?: Product
}

export interface ExcelRow {
  productName: string
  quantity: number
}
