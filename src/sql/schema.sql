-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  current_stock INTEGER DEFAULT 0
);

-- Create stock_transactions table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON stock_transactions(created_at DESC);

-- Insert initial products
INSERT INTO products (name, current_stock) VALUES
  ('Light Blue T-Shirt', 0),
  ('Dark Blue T-Shirt', 0),
  ('Black Jacket', 0),
  ('Blue Jacket', 0)
ON CONFLICT (name) DO NOTHING;
