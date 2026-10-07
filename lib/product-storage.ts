/**
 * Wholesale Product & POS Inventory Storage Engine
 * Handles product cataloging, stock levels, low-stock alerts, and POS inventory auto-deduction
 */

export interface WholesaleProduct {
  id: string
  sku: string // Barcode / Product SKU code
  name: string // Medicine / Wholesale product name
  category: 'tablets' | 'syrup' | 'injections' | 'supplies' | 'wholesale_pack' | 'other'
  purchasePrice: number // Wholesale Cost Price (Rs)
  unitPrice: number // Selling Wholesale Price (Rs)
  stockQuantity: number // Current In-Stock Units
  minStockAlert: number // Threshold for low-stock warning
  unit: string // Box, Pack, Bottle, Strip, Vial, Carton
  batchNumber?: string
  expiryDate?: string
  description?: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'biocure_wholesale_products'

// Pre-populated wholesale products for BioCure Healthcare
const INITIAL_DEMO_PRODUCTS: WholesaleProduct[] = [
  {
    id: 'prod-101',
    sku: 'MED-TAB-5001',
    name: 'Panadol 500mg Tablets (Box of 200)',
    category: 'tablets',
    purchasePrice: 450,
    unitPrice: 650,
    stockQuantity: 120,
    minStockAlert: 20,
    unit: 'Box',
    batchNumber: 'BT-2025-08',
    expiryDate: '2027-12-31',
    description: 'Wholesale Paracetamol 500mg 200s pack',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-102',
    sku: 'MED-INJ-1002',
    name: 'Ceftriaxone 1g Injection Vial (Pack of 10)',
    category: 'injections',
    purchasePrice: 1200,
    unitPrice: 1750,
    stockQuantity: 45,
    minStockAlert: 10,
    unit: 'Pack',
    batchNumber: 'INJ-904',
    expiryDate: '2026-10-15',
    description: 'Sterile Ceftriaxone Sodium 1000mg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-103',
    sku: 'MED-SYR-3003',
    name: 'Brufen Oral Suspension 120ml (Carton of 24 Bottles)',
    category: 'syrup',
    purchasePrice: 1800,
    unitPrice: 2400,
    stockQuantity: 15, // Low stock demo!
    minStockAlert: 20,
    unit: 'Carton',
    batchNumber: 'SYR-771',
    expiryDate: '2026-08-30',
    description: 'Ibuprofen 100mg/5ml pediatric syrup',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-104',
    sku: 'MED-SUP-4004',
    name: 'Surgical Latex Gloves Powder-Free (Box of 100 Pairs)',
    category: 'supplies',
    purchasePrice: 850,
    unitPrice: 1250,
    stockQuantity: 80,
    minStockAlert: 15,
    unit: 'Box',
    batchNumber: 'GLV-112',
    expiryDate: '2028-05-20',
    description: 'Medical grade sterile examination gloves',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export class ProductStorage {
  static getProducts(): WholesaleProduct[] {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_PRODUCTS))
        return INITIAL_DEMO_PRODUCTS
      }
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  static addProduct(product: Omit<WholesaleProduct, 'id' | 'createdAt' | 'updatedAt'>): WholesaleProduct {
    const products = this.getProducts()
    const now = new Date().toISOString()
    const newProd: WholesaleProduct = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    const updated = [newProd, ...products]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newProd
  }

  static updateProduct(id: string, updates: Partial<WholesaleProduct>): WholesaleProduct | null {
    const products = this.getProducts()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) return null

    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    products[index] = updatedProduct
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    return updatedProduct
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts()
    const filtered = products.filter(p => p.id !== id)
    if (filtered.length === products.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }

  /**
   * Manual or Stock Adjustment (Restock / Sale / Audit)
   */
  static adjustStock(id: string, deltaQuantity: number, reason?: string): WholesaleProduct | null {
    const products = this.getProducts()
    const product = products.find(p => p.id === id)
    if (!product) return null

    const newStock = Math.max(0, product.stockQuantity + deltaQuantity)
    return this.updateProduct(id, { stockQuantity: newStock })
  }

  /**
   * Automated POS Inventory Stock Deduction:
   * Called whenever an invoice is created/updated.
   * Decreases stock quantity for matched products.
   */
  static deductStockForInvoice(invoiceItems: Array<{ description: string; quantity: number }>): void {
    if (!Array.isArray(invoiceItems) || invoiceItems.length === 0) return

    const products = this.getProducts()
    let updatedAny = false

    invoiceItems.forEach(item => {
      if (!item.description || !item.quantity) return

      // Find matching product by exact name or SKU match
      const matchedProd = products.find(p => 
        p.name.toLowerCase().trim() === item.description.toLowerCase().trim() ||
        p.sku.toLowerCase().trim() === item.description.toLowerCase().trim()
      )

      if (matchedProd) {
        matchedProd.stockQuantity = Math.max(0, matchedProd.stockQuantity - item.quantity)
        matchedProd.updatedAt = new Date().toISOString()
        updatedAny = true
      }
    })

    if (updatedAny) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }
  }
}
