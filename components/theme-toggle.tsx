"use client"

import { Button } from "@/components/ui/button"
import { Sun } from "lucide-react"

export function ThemeToggle() {
  return (
    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
      <Sun className="w-4 h-4" />
      Light Mode
    </Button>
  )
}

export default ThemeToggle
