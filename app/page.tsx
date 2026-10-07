"use client"

import { Suspense, lazy } from "react"
import AuthGuard from "@/components/auth-guard"
import InvoiceLoadingSkeleton from "@/components/invoice-loading-skeleton"

// Dynamically import heavy component
const ProfessionalInvoice = lazy(() => import("@/components/professional-invoice"))

export default function Home() {
  return (
    <AuthGuard>
      <Suspense fallback={<InvoiceLoadingSkeleton />}>
        <ProfessionalInvoice />
      </Suspense>
    </AuthGuard>
  )
}
