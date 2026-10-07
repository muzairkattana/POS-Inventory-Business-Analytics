"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Package, Plus, Search, Filter, ArrowUpDown, Trash2, Edit3, AlertTriangle,
  CheckCircle2, DollarSign, BarChart3, RefreshCw, Download, Layers, Calendar,
  ShieldAlert, Box, Sparkles, TrendingUp, Tag
} from "lucide-react"
import { ProductStorage, type WholesaleProduct } from "@/lib/product-storage"

export default function ProductInventoryManager() {
  const [products, setProducts] = useState<WholesaleProduct[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")

  // Product Add/Edit Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "tablets" as WholesaleProduct["category"],
    purchasePrice: "",
    unitPrice: "",
    stockQuantity: "",
    minStockAlert: "10",
    unit: "Box",
    batchNumber: "",
    expiryDate: "",
    description: ""
  })

  // Quick Restock Modal state
  const [restockItem, setRestockItem] = useState<WholesaleProduct | null>(null)
  const [restockAddQty, setRestockAddQty] = useState<string>("50")

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    setProducts(ProductStorage.getProducts())
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      category: "tablets",
      purchasePrice: "",
      unitPrice: "",
      stockQuantity: "100",
      minStockAlert: "10",
      unit: "Box",
      batchNumber: "",
      expiryDate: "",
      description: ""
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (p: WholesaleProduct) => {
    setEditingId(p.id)
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      purchasePrice: p.purchasePrice.toString(),
      unitPrice: p.unitPrice.toString(),
      stockQuantity: p.stockQuantity.toString(),
      minStockAlert: p.minStockAlert.toString(),
      unit: p.unit,
      batchNumber: p.batchNumber || "",
      expiryDate: p.expiryDate || "",
      description: p.description || ""
    })
    setIsDialogOpen(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.unitPrice) return

    const productPayload = {
      sku: formData.sku || `SKU-${Date.now()}`,
      name: formData.name,
      category: formData.category,
      purchasePrice: parseFloat(formData.purchasePrice) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
      minStockAlert: parseInt(formData.minStockAlert, 10) || 5,
      unit: formData.unit || 'Box',
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      description: formData.description
    }

    if (editingId) {
      ProductStorage.updateProduct(editingId, productPayload)
    } else {
      ProductStorage.addProduct(productPayload)
    }

    setIsDialogOpen(false)
    loadProducts()
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this product from wholesale inventory?")) {
      ProductStorage.deleteProduct(id)
      loadProducts()
    }
  }

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockItem) return
    const addQty = parseInt(restockAddQty, 10) || 0
    if (addQty > 0) {
      ProductStorage.adjustStock(restockItem.id, addQty, 'Restock')
      setRestockItem(null)
      loadProducts()
    }
  }

  // Analytics Metrics
  const totalProducts = products.length
  const totalUnits = useMemo(() => products.reduce((sum, p) => sum + p.stockQuantity, 0), [products])
  const totalInventoryValue = useMemo(() => products.reduce((sum, p) => sum + (p.stockQuantity * p.purchasePrice), 0), [products])
  const lowStockCount = useMemo(() => products.filter(p => p.stockQuantity <= p.minStockAlert).length, [products])

  // Search & Filter
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
        
        let matchesStock = true
        if (stockFilter === "low") matchesStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert
        else if (stockFilter === "out") matchesStock = p.stockQuantity === 0
        else if (stockFilter === "in") matchesStock = p.stockQuantity > p.minStockAlert

        return matchesSearch && matchesCategory && matchesStock
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name)
        if (sortBy === "stock") return b.stockQuantity - a.stockQuantity
        if (sortBy === "price") return b.unitPrice - a.unitPrice
        if (sortBy === "sku") return a.sku.localeCompare(b.sku)
        return 0
      })
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy])

  // CSV Export
  const exportCSV = () => {
    const headers = ["SKU", "Product Name", "Category", "Unit", "Purchase Price (Rs)", "Selling Price (Rs)", "Stock Quantity", "Batch Number", "Expiry Date"]
    const rows = products.map(p => [
      p.sku,
      `"${p.name}"`,
      p.category,
      p.unit,
      p.purchasePrice,
      p.unitPrice,
      p.stockQuantity,
      p.batchNumber || '',
      p.expiryDate || ''
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `wholesale-inventory-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const categoryLabels: Record<WholesaleProduct['category'], string> = {
    tablets: 'Tablets / Capsules',
    syrup: 'Syrups / Liquids',
    injections: 'Injections / Vials',
    supplies: 'Medical Supplies',
    wholesale_pack: 'Wholesale Bundles',
    other: 'Other'
  }

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wholesale Product Entry & POS Inventory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage wholesale medical items, stock levels, wholesale prices, and automated POS stock deduction
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={handleOpenAdd} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4" /> Add Wholesale Product
          </Button>
        </div>
      </div>

      {/* Metric Cards - Soft Tinted Backgrounds with Darker Legible Text */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Catalog Items */}
        <Card className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-300">Total Catalog Items</p>
                <p className="text-xl font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">{totalProducts} Products</p>
                <p className="text-[11px] text-emerald-900 dark:text-emerald-300 font-medium mt-0.5">{totalUnits} total units in stock</p>
              </div>
              <div className="p-2.5 bg-emerald-600 text-white rounded-lg shadow-sm">
                <Box className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-blue-950 dark:text-blue-300">Inventory Value</p>
                <p className="text-xl font-bold text-blue-950 dark:text-blue-100 mt-0.5">
                  Rs {totalInventoryValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-blue-900 dark:text-blue-300 font-medium mt-0.5">At wholesale purchase cost</p>
              </div>
              <div className="p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-amber-950 dark:text-amber-300">Low Stock Alerts</p>
                <p className="text-xl font-bold text-amber-950 dark:text-amber-100 mt-0.5">{lowStockCount} Items</p>
                <p className="text-[11px] text-amber-900 dark:text-amber-300 font-medium mt-0.5">Below alert threshold</p>
              </div>
              <div className="p-2.5 bg-amber-600 text-white rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POS Auto Deduct */}
        <Card className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 shadow-sm">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-purple-950 dark:text-purple-300">POS Auto Deduct</p>
                <p className="text-xl font-bold text-purple-950 dark:text-purple-100 mt-0.5">Enabled</p>
                <p className="text-[11px] text-purple-900 dark:text-purple-300 font-medium mt-0.5">Decreases on invoice sale</p>
              </div>
              <div className="p-2.5 bg-purple-600 text-white rounded-lg shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by Product Name, SKU, or Batch Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-2 border rounded-md bg-background text-xs"
              >
                <option value="all">All Categories</option>
                <option value="tablets">Tablets / Capsules</option>
                <option value="syrup">Syrups / Liquids</option>
                <option value="injections">Injections / Vials</option>
                <option value="supplies">Medical Supplies</option>
                <option value="wholesale_pack">Wholesale Bundles</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Stock Level:</span>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="p-2 border rounded-md bg-background text-xs"
              >
                <option value="all">All Stock Status</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock Alert</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border rounded-md bg-background text-xs"
              >
                <option value="name">Product Name</option>
                <option value="stock">Stock Quantity</option>
                <option value="price">Wholesale Price</option>
                <option value="sku">SKU Code</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Catalog Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Wholesale Inventory Catalog ({filteredProducts.length} Items)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted font-semibold text-muted-foreground">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Product / Medicine Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Purchase Cost</th>
                <th className="p-3">Selling Price</th>
                <th className="p-3">Margin (Rs)</th>
                <th className="p-3">Stock Level</th>
                <th className="p-3">Batch & Expiry</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-8 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No wholesale products matched your search or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.unitPrice - p.purchasePrice
                  const marginPct = p.purchasePrice > 0 ? (margin / p.purchasePrice) * 100 : 0
                  const isLow = p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0
                  const isOut = p.stockQuantity === 0

                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono font-semibold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                        {p.sku}
                      </td>
                      <td className="p-3 font-medium">
                        <div>{p.name}</div>
                        {p.description && <div className="text-[10px] text-muted-foreground truncate max-w-xs">{p.description}</div>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">
                          {categoryLabels[p.category] || p.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">Rs {p.purchasePrice.toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-600 whitespace-nowrap">Rs {p.unitPrice.toFixed(2)} / {p.unit}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-semibold text-blue-600">Rs {margin.toFixed(2)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">({marginPct.toFixed(0)}%)</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-green-600'}`}>
                            {p.stockQuantity} {p.unit}s
                          </span>
                          {isOut && <Badge className="bg-red-100 text-red-800 text-[9px]">OUT OF STOCK</Badge>}
                          {isLow && <Badge className="bg-amber-100 text-amber-800 text-[9px]">LOW STOCK</Badge>}
                        </div>
                      </td>
                      <td className="p-3 text-[11px] whitespace-nowrap">
                        <div>{p.batchNumber ? `Batch: ${p.batchNumber}` : '-'}</div>
                        <div className="text-muted-foreground">{p.expiryDate ? `Exp: ${p.expiryDate}` : ''}</div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRestockItem(p)}
                            className="h-7 text-[11px] px-2 text-teal-700 border-teal-300 hover:bg-teal-50"
                            title="Restock / Add Stock Units"
                          >
                            + Stock
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Wholesale Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Wholesale Product" : "Add New Wholesale Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">SKU / Product Code</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. MED-TAB-101"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full p-2 border rounded-md text-xs bg-background"
                >
                  <option value="tablets">Tablets / Capsules</option>
                  <option value="syrup">Syrups / Liquids</option>
                  <option value="injections">Injections / Vials</option>
                  <option value="supplies">Medical Supplies</option>
                  <option value="wholesale_pack">Wholesale Bundles</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Product Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Paracetamol 500mg Tablets (Box of 200)"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold block mb-1">Unit Type</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full p-2 border rounded-md text-xs bg-background"
                >
                  <option value="Box">Box</option>
                  <option value="Pack">Pack</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Strip">Strip</option>
                  <option value="Vial">Vial</option>
                  <option value="Carton">Carton</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Purchase Cost (Rs)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Selling Price (Rs)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="e.g. 750"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">In-Stock Quantity</label>
                <Input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  placeholder="e.g. 100"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Low Stock Alert Threshold</label>
                <Input
                  type="number"
                  value={formData.minStockAlert}
                  onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                  placeholder="e.g. 10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Batch Number (Optional)</label>
                <Input
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="e.g. BATCH-2025-01"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Expiry Date (Optional)</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Description / Notes</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Wholesale packaging details..."
              />
            </div>

            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white mt-2">
              {editingId ? "Update Wholesale Product" : "Save Wholesale Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Restock Dialog */}
      {restockItem && (
        <Dialog open={!!restockItem} onOpenChange={() => setRestockItem(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Quick Restock Inventory</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleQuickRestockSubmit} className="space-y-4 text-xs">
              <div>
                <p className="font-semibold">{restockItem.name}</p>
                <p className="text-muted-foreground mt-1">
                  Current Stock: <span className="font-bold text-teal-600">{restockItem.stockQuantity} {restockItem.unit}s</span>
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1">Add Units to Stock</label>
                <Input
                  type="number"
                  value={restockAddQty}
                  onChange={(e) => setRestockAddQty(e.target.value)}
                  placeholder="e.g. 50"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                Add Stock Units
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
