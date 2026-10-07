"use client"

import { usePathname } from "next/navigation"
import AppShell from "@/components/app-shell"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Pages that should NOT use the app shell
  const excludedPages = ["/login", "/logout"]
  
  const shouldUseShell = !excludedPages.some(page => pathname.startsWith(page))
  
  if (!shouldUseShell) {
    return <>{children}</>
  }
  
  return <AppShell>{children}</AppShell>
}

