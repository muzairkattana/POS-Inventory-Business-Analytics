"use client"

import AuthGuard from "@/components/auth-guard"
import ProductInventoryManager from "@/components/product-inventory-manager"

export default function ProductsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <ProductInventoryManager />
      </div>
    </AuthGuard>
  )
}
