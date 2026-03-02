import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { db } from '../lib/db'

interface ImportResult {
  success: boolean
  message: string
  productName: string
  quantity: number
}

export default function ExcelImport() {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setResults([{ success: false, message: 'Please upload an Excel file (.xlsx or .xls)', productName: '', quantity: 0 }])
      setShowResults(true)
      return
    }

    setLoading(true)
    setShowResults(false)
    setResults([])

    try {
      // Read Excel file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

      const updates: { productName: string; quantity: number }[] = []

      // Process each row (skip header if present)
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row || row.length < 2) continue

        const productName = String(row[0] || '').trim()
        const quantity = parseInt(String(row[1] || '0'))

        if (!productName || isNaN(quantity) || quantity <= 0) continue

        updates.push({ productName, quantity })
      }

      if (updates.length === 0) {
        setResults([{ success: false, message: 'No valid data found in Excel file', productName: '', quantity: 0 }])
        setShowResults(true)
        setLoading(false)
        return
      }

      // Import using db service
      const importResults = await db.importExcel(updates)
      setResults(importResults)
      setShowResults(true)
    } catch (error) {
      console.error('Error processing file:', error)
      setResults([{ success: false, message: 'Error processing file', productName: '', quantity: 0 }])
      setShowResults(true)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const clearResults = () => {
    setResults([])
    setShowResults(false)
  }

  const successfulCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success && r.productName).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Excel Import</h2>
          <p className="text-sm text-gray-500">Bulk import stock from Excel files</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-800 mb-2">Expected Format:</h3>
        <div className="overflow-x-auto">
          <table className="text-sm text-blue-700">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="text-left py-2 px-3 font-medium">Column A</th>
                <th className="text-left py-2 px-3 font-medium">Column B</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-blue-100">
                <td className="py-2 px-3">Product Name</td>
                <td className="py-2 px-3">Quantity</td>
              </tr>
              <tr className="bg-white/50">
                <td className="py-2 px-3">Light Blue T-Shirt</td>
                <td className="py-2 px-3">10</td>
              </tr>
              <tr className="bg-white/50">
                <td className="py-2 px-3">Dark Blue T-Shirt</td>
                <td className="py-2 px-3">15</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          Supported products: Light Blue T-Shirt, Dark Blue T-Shirt, Black Jacket, Blue Jacket
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-600 font-medium">Processing file...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-1">
              Drop your Excel file here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports .xlsx and .xls files
            </p>
          </>
        )}
      </div>

      {/* Results */}
      {showResults && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Import Results</h3>
            <button
              onClick={clearResults}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 bg-gray-50 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{successfulCount}</p>
                <p className="text-xs text-gray-500">Successful</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{failedCount}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between px-6 py-3 border-b border-gray-100 last:border-0 ${
                  result.success ? 'bg-emerald-50/50' : 'bg-red-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    {result.productName ? (
                      <>
                        <p className="font-medium text-gray-800">{result.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {result.quantity}</p>
                      </>
                    ) : (
                      <p className="font-medium text-gray-800">{result.message}</p>
                    )}
                  </div>
                </div>
                {result.productName && (
                  <span className={`text-sm font-medium ${
                    result.success ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {result.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
