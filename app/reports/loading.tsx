export default function ReportsLoading() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border p-6 space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Main Card Skeleton */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 w-full bg-gray-100 rounded animate-pulse mt-6"></div>
      </div>
    </div>
  )
}

