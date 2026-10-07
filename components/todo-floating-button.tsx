"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  CheckSquare,
  Target,
  Plus,
  Calendar,
  Star,
  Clock,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import AdvancedTodoPanel from "./advanced-todo-panel"
import { cn } from "@/lib/utils"

interface TodoFloatingButtonProps {
  invoiceContext?: {
    invoiceId: string
    invoiceNumber: string
    clientName: string
  }
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

export default function TodoFloatingButton({ 
  invoiceContext, 
  position = 'bottom-right',
  className 
}: TodoFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [taskCount, setTaskCount] = useState(0)
  const [urgentTasks, setUrgentTasks] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadTaskStats()

    // Listen for storage changes to update stats
    const handleStorageChange = () => {
      loadTaskStats()
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const loadTaskStats = () => {
    try {
      const boards = JSON.parse(localStorage.getItem('todo-boards') || '[]')
      let totalTasks = 0
      let urgent = 0
      let completedTodayCount = 0
      const today = new Date().toDateString()

      boards.forEach((board: any) => {
        board.todos?.forEach((todo: any) => {
          totalTasks++
          
          // Count urgent tasks (high priority or overdue)
          const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed
          if (todo.priority === 'high' || isOverdue) {
            urgent++
          }

          // Count tasks completed today
          if (todo.completed && new Date(todo.updatedAt).toDateString() === today) {
            completedTodayCount++
          }
        })
      })

      setTaskCount(totalTasks)
      setUrgentTasks(urgent)
      setCompletedToday(completedTodayCount)
    } catch (error) {
      console.error('Failed to load task stats:', error)
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-8 lg:left-8'
      case 'top-right':
        return 'top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8'
      case 'top-left':
        return 'top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8'
      default:
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8'
    }
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating Action Button */}
      <div className={cn(
        "fixed z-20 print:hidden",
        getPositionClasses(),
        className
      )}>
        <div className="relative">
          {/* Quick Stats Mini Panel - appears on hover */}
          {isExpanded && (
            <div className="absolute bottom-16 right-0 sm:bottom-20 sm:right-0 bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 min-w-[200px] sm:min-w-[250px] animate-in slide-in-from-bottom-2 duration-200 z-50">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Quick Overview
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    Total Tasks
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {taskCount}
                  </Badge>
                </div>
                {urgentTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-red-600">
                      <Zap className="w-3 h-3" />
                      Urgent
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {urgentTasks}
                    </Badge>
                  </div>
                )}
                {completedToday > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      Done Today
                    </span>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      {completedToday}
                    </Badge>
                  </div>
                )}
                {invoiceContext && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span className="truncate">{invoiceContext.invoiceNumber}</span>
                    </div>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setIsOpen(true)}
                className="w-full mt-3 text-xs h-7"
              >
                Open Todo Manager
              </Button>
            </div>
          )}

          {/* Main FAB */}
          <Button
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => setIsExpanded(false)}
            className={cn(
              "rounded-full transition-all duration-300 group relative overflow-hidden",
              "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16",
              "shadow-lg hover:shadow-xl sm:shadow-xl sm:hover:shadow-2xl",
              "bg-gradient-to-br from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90",
              "border border-primary/20 backdrop-blur-sm",
              "touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              isExpanded && "scale-105 sm:scale-110"
            )}
            title={invoiceContext 
              ? `Todo Manager - ${invoiceContext.invoiceNumber}` 
              : "Open Todo Manager"
            }
            aria-label={invoiceContext 
              ? `Open Todo Manager for ${invoiceContext.invoiceNumber}` 
              : "Open Smart Todo Manager"
            }
            role="button"
            tabIndex={0}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            
            {/* Icon */}
            <div className="relative">
              <CheckSquare className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" style={{ color: "rgb(26,58,164)", opacity: 0.9 }} />
              
              {/* Task count badge */}
              {taskCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-[10px] bg-red-500 text-white border-2 border-white rounded-full flex items-center justify-center">
                  {taskCount > 99 ? '99+' : taskCount}
                </Badge>
              )}

              {/* Urgent indicator */}
              {urgentTasks > 0 && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white animate-pulse" />
              )}
            </div>

            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-full bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-300" />
          </Button>

          {/* Productivity streak indicator */}
          {completedToday > 0 && (
            <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-bounce">
              +{completedToday}
            </div>
          )}

          {/* Invoice link indicator */}
          {invoiceContext && (
            <div className="absolute -bottom-1 -left-1 bg-blue-500 text-white p-1 rounded-full">
              <Users className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      </div>

      {/* Todo Panel */}
      <AdvancedTodoPanel
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          loadTaskStats() // Refresh stats when panel closes
        }}
        invoiceContext={invoiceContext}
      />
    </>
  )
}
