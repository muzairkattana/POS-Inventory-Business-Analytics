"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  X,
  User,
  Camera,
} from "lucide-react"
import Link from "next/link"
import PhotoCapturesViewer from "@/components/photo-captures-viewer"

export default function SecurityPhotosPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState("")

  // Check authentication on mount
  useEffect(() => {
    // Check if main user is authenticated
    const isMainUserAuth = localStorage.getItem('isAuthenticated') === 'true'
    const userUsername = localStorage.getItem('user-username')
    
    // If main user is logged in as admin, auto-authenticate security photos
    if (isMainUserAuth && userUsername === 'Mushtaqkatana55@gmail.com') {
      setIsAuthenticated(true)
      return
    }
    
    // Otherwise check security photos specific auth
    const adminAuth = localStorage.getItem('security-photos-auth')
    const authTime = localStorage.getItem('security-photos-auth-time')
    
    if (adminAuth === 'true' && authTime) {
      // Check if session is less than 24 hours old (increased from 1 hour)
      const timeDiff = Date.now() - parseInt(authTime)
      if (timeDiff < 86400000) { // 24 hours in milliseconds
        setIsAuthenticated(true)
      } else {
        // Session expired
        localStorage.removeItem('security-photos-auth')
        localStorage.removeItem('security-photos-auth-time')
      }
    }
  }, [])

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    
    // Check credentials - same as login page
    if (adminEmail === "Mushtaqkatana55@gmail.com" && adminPassword === "Mushtaq1979") {
      localStorage.setItem('security-photos-auth', 'true')
      localStorage.setItem('security-photos-auth-time', Date.now().toString())
      setIsAuthenticated(true)
    } else {
      setAuthError("Invalid admin credentials")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('security-photos-auth')
    localStorage.removeItem('security-photos-auth-time')
    setIsAuthenticated(false)
    setAdminEmail("")
    setAdminPassword("")
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen login-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Camera className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Security Photos Access</CardTitle>
            <CardDescription>
              Enter admin credentials to view captured security photos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Admin Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {authError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                </div>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <Lock className="w-4 h-4 mr-2" />
                Access Security Photos
              </Button>
              <Link href="/">
                <Button type="button" variant="outline" className="w-full mt-2">
                  <X className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-cyan-900 to-blue-900 text-white p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Security Photos</h1>
                <p className="text-blue-200 text-sm mt-1">
                  View and manage captured login/logout security photos
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Unlock className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Link href="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">Captured Security Photos</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Review photos automatically captured during user login and logout events for security auditing purposes.
            </p>
          </div>
          
          <PhotoCapturesViewer />
        </Card>

        {/* Info Section */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                About Security Photo Capture
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Photos are automatically captured during login and logout events</li>
                <li>• All captures are stored locally in the browser's localStorage</li>
                <li>• Images include metadata: username, timestamp, and event type</li>
                <li>• Enhance security by providing visual audit trails</li>
                <li>• Users must grant camera permission for capture to work</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
