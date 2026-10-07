"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Wait for auth provider to finish initial check
    if (loading) return

    const authStatus = typeof window !== 'undefined' ? localStorage.getItem("isAuthenticated") : null

    // Allow only if Supabase user exists OR explicit local auth flag is set
    if (user || authStatus === "true") {
      setAllowed(true)
      setChecking(false)
      return
    }

    // Not allowed -> redirect once
    setAllowed(false)
    setChecking(false)
    router.replace("/login")
  }, [loading, user, router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}
