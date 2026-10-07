"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { activityLogger } from '@/lib/activity-logger'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Dashboard / Invoice Creator',
  '/invoices': 'All Invoices',
  '/clients': 'Clients Management',
  '/reports': 'Reports',
  '/admin-logs': 'Admin Activity Logs',
  '/help': 'Help Center',
  '/settings': 'Settings',
  '/login': 'Login Page',
  '/logout': 'Logout Page',
}

export default function PageVisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const pageName = PAGE_NAMES[pathname] || pathname
    const visitTime = new Date()
    
    // Log page visit
    activityLogger.log({
      type: 'page_visit',
      action: 'Page Visit',
      description: `Visited ${pageName}`,
      details: {
        page: pageName,
        path: pathname,
        visitTime: visitTime.toISOString(),
        referrer: typeof document !== 'undefined' ? document.referrer : 'direct',
        screenResolution: typeof window !== 'undefined' 
          ? `${window.screen.width}x${window.screen.height}` 
          : 'unknown'
      },
      reversible: false
    })

    // Track page leave time
    const handleBeforeUnload = () => {
      const leaveTime = new Date()
      const duration = leaveTime.getTime() - visitTime.getTime()
      const seconds = Math.floor(duration / 1000)
      const minutes = Math.floor(seconds / 60)
      
      let timeSpent = seconds < 60 
        ? `${seconds}s` 
        : `${minutes}m ${seconds % 60}s`
      
      activityLogger.log({
        type: 'page_leave',
        action: 'Page Leave',
        description: `Left ${pageName} after ${timeSpent}`,
        details: {
          page: pageName,
          path: pathname,
          leaveTime: leaveTime.toISOString(),
          timeSpent,
          durationMs: duration
        },
        reversible: false
      })
    }

    // Track when user leaves the page
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Also log when component unmounts (route change)
      handleBeforeUnload()
    }
  }, [pathname])

  return null
}
