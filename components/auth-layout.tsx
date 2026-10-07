"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import AppShell from "./app-shell"
import Footer from "./footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

// Pages that should not use the app shell (login, logout, etc.)
const publicPages = ["/login", "/logout"]

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return <>{children}</>
  }
  
  // Check if current page is a public page
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))
  
  // If it's a public page, render children without shell but with footer
  if (isPublicPage) {
    return (
      <>
        {children}
        {/* Footer for public pages only */}
        {mounted && (
          <div className="no-print">
            {/* Dynamically import Footer to avoid circular dependencies */}
            <Footer />
          </div>
        )}
      </>
    )
  }
  
  // Otherwise, wrap in app shell
  return <AppShell>{children}</AppShell>
}

