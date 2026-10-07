"use client"

export default function InvoiceLoadingSkeleton() {
  return (
    <div className="w-full max-w-none mx-auto bg-background relative px-2 sm:px-4 lg:px-6 animate-pulse">
      {/* Control Panel Skeleton */}
      <div className="control-panel p-2 sm:p-4 bg-muted border-b">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="h-8 w-24 bg-gray-300 rounded"></div>
            <div className="hidden sm:block">
              <div className="h-4 w-20 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 w-16 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 bg-gray-300 rounded hidden lg:block"></div>
            <div className="h-8 w-24 bg-gray-300 rounded hidden lg:block"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="h-10 bg-gray-300 rounded"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Invoice Content Skeleton */}
      <div className="bg-card w-full max-w-[210mm] mx-auto mt-4">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6">
          <div className="h-12 w-48 bg-blue-800/50 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-64 bg-blue-800/50 rounded"></div>
            <div className="h-4 w-48 bg-blue-800/50 rounded"></div>
            <div className="h-4 w-56 bg-blue-800/50 rounded"></div>
          </div>
        </div>

        {/* Client Info Skeleton */}
        <div className="p-6">
          <div className="bg-muted p-4 rounded-lg mb-6">
            <div className="h-6 w-32 bg-gray-300 rounded mb-3"></div>
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-300 rounded"></div>
              <div className="h-4 w-64 bg-gray-300 rounded"></div>
              <div className="h-4 w-40 bg-gray-300 rounded"></div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="mb-6">
            <div className="h-12 bg-blue-900/20 rounded-t mb-2"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 border-b"></div>
            ))}
          </div>

          {/* Totals Skeleton */}
          <div className="flex justify-end">
            <div className="w-full sm:w-64 bg-muted p-4 rounded-lg">
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-300 rounded"></div>
                <div className="h-4 w-full bg-gray-300 rounded"></div>
                <div className="h-6 w-full bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

