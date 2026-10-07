"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Check } from "lucide-react"
import { activityLogger } from "@/lib/activity-logger"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const performLogout = async () => {
      // Get user info before clearing
      const username = localStorage.getItem("user-username") || "Unknown User"
      const loginTimestamp = localStorage.getItem("login-timestamp")
      
      // Calculate session duration
      let sessionDuration = "N/A"
      if (loginTimestamp) {
        const loginTime = new Date(loginTimestamp)
        const logoutTime = new Date()
        const duration = logoutTime.getTime() - loginTime.getTime()
        const minutes = Math.floor(duration / 60000)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
          sessionDuration = `${hours}h ${minutes % 60}m`
        } else {
          sessionDuration = `${minutes}m`
        }
      }
      
      // Log logout activity
      activityLogger.log({
        type: 'logout',
        action: 'User Logout',
        description: `User ${username} logged out`,
        details: {
          username,
          sessionDuration,
          loginTimestamp,
          logoutTimestamp: new Date().toISOString()
        },
        reversible: false
      })
      
      // Clear authentication
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("user-username")
      localStorage.removeItem("login-timestamp")
      localStorage.setItem("hasLoggedOut", "true") // Set logout flag to prevent auto-redirect
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }

    performLogout()
  }, [router])

  return (
    <div className="min-h-screen login-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, oklch(0.6 0.15 280) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, oklch(0.25 0.08 85) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="login-card border-0 shadow-2xl">
          <CardHeader className="space-y-4 sm:space-y-6 text-center pb-6 sm:pb-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-4xl font-bold text-foreground">
                  Logged Out
                </CardTitle>
                <p className="text-base sm:text-lg text-muted-foreground">
                  You have been successfully logged out
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-center px-4 sm:px-6 pb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <LogOut className="w-5 h-5" />
                <span>Redirecting to login...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-accent h-1 rounded-full animate-pulse" style={{
                  animation: "progress 2s ease-in-out"
                }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  )
}
