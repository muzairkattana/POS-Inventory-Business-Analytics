"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppHeaderProps {
  onMenuClick: () => void
}

export default function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 lg:hidden">
      <div className="container flex h-14 md:h-16 items-center px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:mr-4"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
        
        <div className="flex items-center space-x-2 md:space-x-3 lg:hidden">
          <div className="relative">
            <img
              src="/images/biocure-health-care-logo.jpg"
              alt="Biocure Health Care"
              className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover ring-1 ring-gray-200"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <div className="hidden absolute inset-0 h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary items-center justify-center text-primary-foreground font-bold text-sm md:text-base">
              BH
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-lg font-semibold leading-tight">Biocure Healthcare</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Invoice Management</p>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {/* Header kept minimal - All navigation in sidebar */}
        </div>
      </div>
    </header>
  )
}

