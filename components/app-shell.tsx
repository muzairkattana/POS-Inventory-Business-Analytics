"use client"

import { useState, useEffect } from "react"
import AppHeader from "./app-header"
import AppSidebar from "./app-sidebar"
import Footer from "./footer"

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load collapsed state from localStorage, default to true (collapsed/icon-only)
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed === null) {
      // First time load - default to collapsed (icon-only)
      setSidebarCollapsed(true)
      localStorage.setItem('sidebar-collapsed', 'true')
    } else if (savedCollapsed === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  // Update body data attribute when sidebar state changes
  useEffect(() => {
    if (mounted) {
      document.body.setAttribute('data-sidebar', sidebarOpen ? 'open' : 'closed')
      document.body.setAttribute('data-sidebar-collapsed', sidebarCollapsed ? 'true' : 'false')
    }
  }, [sidebarOpen, sidebarCollapsed, mounted])

  // Handle sidebar collapse/expand
  const handleCollapse = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('sidebar-collapsed', String(newCollapsed))
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar - always visible, can be collapsed to icons only */}
      <div className={`hidden lg:block ${sidebarCollapsed ? 'w-20' : 'w-72'} flex-shrink-0 transition-all duration-300`}>
        <AppSidebar 
          isOpen={true}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={sidebarCollapsed}
          onCollapse={handleCollapse}
        />
      </div>
      
      {/* Mobile sidebar - overlay */}
      <div className="lg:hidden">
        <AppSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isCollapsed={false}
          onCollapse={handleCollapse}
        />
      </div>
      
      {/* Main content area - expands when sidebar is closed */}
      <div className="flex flex-1 flex-col min-h-screen w-full transition-all duration-300 ease-in-out relative">
        <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 bg-gray-50 relative">
          {children}
        </main>
        
        {/* Footer - dynamically positioned based on sidebar state */}
        <Footer />
      </div>
    </div>
  )
}

