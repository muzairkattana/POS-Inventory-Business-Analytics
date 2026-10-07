"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, User, Smartphone, Wifi, WifiOff, Download, UserPlus, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import PWAInstallPrompt from "@/components/pwa-install-prompt"
import { useAuth } from "@/components/auth-provider"
import { isSupabaseConfigured } from "@/lib/supabase"
import { activityLogger } from "@/lib/activity-logger"
import { BiometricAuth } from "@/lib/biometric-auth"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, loading, user } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [credentials, setCredentials] = useState({
    email: "",
    username: "",
    password: "",
    fullName: ""
  })
  const [isLoading, setIsLoading] = useState(loading)
  const [error, setError] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showCredentials, setShowCredentials] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [logoClicks, setLogoClicks] = useState(0)
  const logoClickTimer = useRef<number | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    // Check if user is authenticated (Supabase or local)
    const authStatus = typeof window !== 'undefined' ? localStorage.getItem("isAuthenticated") : null
    const hasLoggedOut = typeof window !== 'undefined' ? localStorage.getItem("hasLoggedOut") : null
    
    // Only redirect if user is actually authenticated and hasn't explicitly logged out
    if ((user && hasLoggedOut !== "true") || (authStatus === "true" && hasLoggedOut !== "true")) {
      router.push("/")
    }
  }, [user, router])

  // Update loading state
  useEffect(() => {
    setIsLoading(loading)
  }, [loading])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    // Debug logging
    console.log('isSupabaseConfigured:', isSupabaseConfigured)
    console.log('credentials:', { username: credentials.username, email: credentials.email, passwordLength: credentials.password.length })

    try {
      if (isSignUp) {
        // Handle sign up
        if (isSupabaseConfigured) {
          await signUp(credentials.email, credentials.password, credentials.fullName)
          setError("")
          alert("Check your email to verify your account!")
          setIsSignUp(false)
        } else {
          setError("Database not configured. Contact administrator.")
        }
      } else {
        // Handle sign in
        if (isSupabaseConfigured) {
          if (!credentials.email) {
            setError('Please sign in with your email (Supabase authentication required).')
            return
          }
          await signIn(credentials.email, credentials.password)
          // Show install prompt after successful login
          setShowInstallPrompt(true)
          // Redirect after a short delay to show install prompt
          setTimeout(() => {
            router.push("/")
          }, 1500)
        } else {
          // Fallback to local authentication for offline mode only when Supabase is not configured
          if (credentials.username === "Mushtaqkatana55@gmail.com" && credentials.password === "Mushtaq1979") {
            // Clear any previous logout state
            localStorage.removeItem("hasLoggedOut")
            localStorage.setItem("isAuthenticated", "true")
            localStorage.setItem("user-username", credentials.username)
            localStorage.setItem("login-timestamp", new Date().toISOString())
            
            // Log successful login
            activityLogger.log({
              type: 'login_success',
              action: 'User Login',
              description: `User ${credentials.username} logged in successfully`,
              details: {
                username: credentials.username,
                timestamp: new Date().toISOString(),
                sessionStart: new Date().toISOString()
              },
              reversible: false
            })
            
            // Show install prompt after successful login
            setShowInstallPrompt(true)
            // Redirect after a short delay to show install prompt
            setTimeout(() => {
              router.push("/")
            }, 1500)
          } else {
            // Log failed login attempt
            activityLogger.log({
              type: 'login_failed',
              action: 'Login Failed',
              description: `Failed login attempt for ${credentials.username || credentials.email}`,
              details: {
                username: credentials.username || credentials.email,
                timestamp: new Date().toISOString(),
                reason: 'Invalid credentials'
              },
              reversible: false
            })
            setError("Invalid credentials")
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstallDismiss = () => {
    setShowInstallPrompt(false)
    router.push("/")
  }

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1
      if (next >= 8) {
        // Reveal credentials on 8 clicks
        setShowCredentials(true)
        // reset counter and timer
        if (logoClickTimer.current) {
          window.clearTimeout(logoClickTimer.current)
          logoClickTimer.current = null
        }
        return 0
      }
      // start/reset a short window for multi-click detection
      if (!logoClickTimer.current) {
        logoClickTimer.current = window.setTimeout(() => {
          setLogoClicks(0)
          logoClickTimer.current = null
        }, 2000)
      }
      return next
    })
  }

  const formatDateTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: date.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }
  }

  const { time, date } = formatDateTime(currentTime)

  useEffect(() => {
    return () => {
      if (logoClickTimer.current) {
        window.clearTimeout(logoClickTimer.current)
        logoClickTimer.current = null
      }
    }
  }, [])

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

      {/* Online/Offline Status */}
      <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {isOnline ? 'Online' : 'Offline - App works offline!'}
      </div>

      {mounted && (
        <div className="absolute top-4 right-4 text-right text-foreground/70 z-10">
          <div className="text-lg sm:text-2xl font-bold font-mono" suppressHydrationWarning>{time}</div>
          <div className="text-xs sm:text-sm" suppressHydrationWarning>{date}</div>
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        <Card className="login-card border-0 shadow-2xl">
          <CardHeader className="space-y-4 sm:space-y-6 text-center pb-6 sm:pb-8">
            <div className="space-y-3 sm:space-y-4">
              <div
                onClick={handleLogoClick}
                className="w-16 h-16 sm:w-24 sm:h-24 mx-auto bg-accent/10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer select-none"
                title=""
              >
                <img
                  src="/images/biocure-health-care-logo.jpg"
                  alt="Biocure Health Care"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    img.onerror = null
                    img.src = "/images/biocure-health-care-logo.ico"
                  }}
                />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-4xl font-bold text-foreground">Welcome</CardTitle>
                <CardDescription className="text-base sm:text-lg text-muted-foreground">
                  Access your professional dashboard
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 sm:space-y-8 px-4 sm:px-6">
            <form onSubmit={handleAuth} className="space-y-5 sm:space-y-6">
              {isSignUp && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={credentials.fullName}
                      onChange={(e) => setCredentials({ ...credentials, fullName: e.target.value })}
                      className="pl-10 sm:pl-12 h-12 sm:h-14 bg-background/50 border-border/50 rounded-xl text-base sm:text-lg font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              )}

              {(() => {
                console.log('Rendering form - isSupabaseConfigured:', isSupabaseConfigured)
                return isSupabaseConfigured
              })() ? (
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                      className="pl-10 sm:pl-12 h-12 sm:h-14 bg-background/50 border-border/50 rounded-xl text-base sm:text-lg font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      type="text"
                      placeholder="Enter your username"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="pl-10 sm:pl-12 h-12 sm:h-14 bg-background/50 border-border/50 rounded-xl text-base sm:text-lg font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-12 sm:h-14 bg-background/50 border-border/50 rounded-xl text-base sm:text-lg font-medium focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm text-center bg-destructive/10 p-3 sm:p-4 rounded-xl border border-destructive/20">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 sm:h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (isSignUp ? "Creating Account..." : "Signing in...") : (isSignUp ? "Create Account" : "Access Dashboard")}
              </Button>


              {showCredentials && (
                <div className="text-center space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground">Demo Access Credentials</p>
                  <div className="bg-muted/50 p-3 sm:p-4 rounded-xl border border-border/50">
                    <p className="font-mono text-xs sm:text-sm">
                      <span className="text-accent font-semibold">Email:</span> Mushtaqkatana55@gmail.com
                    </p>
                    <p className="font-mono text-xs sm:text-sm">
                      <span className="text-accent font-semibold">Password:</span> Mushtaq1979
                    </p>
                  </div>
                </div>
              )}
            </form>



            {/* PWA Features */}
            <div className="border-t border-border/50 pt-4 sm:pt-6">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-accent">
                  <Smartphone className="w-5 h-5" />
                  <span className="text-sm font-medium">Mobile App Features</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Works 100% offline
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Install like a native app
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Fast and responsive
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-foreground/60 text-sm">
            © 2025 Biocure Health Care. Professional Invoice Management.
          </p>
          {!isSupabaseConfigured && (
            <p className="text-foreground/40 text-xs mt-2">
              Running in offline mode - Database not configured
            </p>
          )}
        </div>
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <PWAInstallPrompt
          onInstall={handleInstallDismiss}
          onDismiss={handleInstallDismiss}
        />
      )}
    </div>
  )
}
