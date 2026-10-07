"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { supabaseService } from '@/lib/supabase-service'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  syncData: () => Promise<{ success: number; errors: number }>
  userProfile: any | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any | null>(null)
  
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Skip auth initialization if Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    // Get initial session - optimized for speed
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        }
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
        
        // Defer profile loading to not block the UI
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id)
          }, 0)
        }
      } catch (err) {
        console.error('Session check failed:', err)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes (only if Supabase is configured)
    if (!supabase) {
      setLoading(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
        
        if (session?.user) {
          // Defer profile loading to not block UI
          setTimeout(() => {
            loadUserProfile(session.user.id)
          }, 0)
          
          // Sync data when user signs in - run in background
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              syncData()
            }, 1000)
          }
        } else {
          setUserProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    if (!isSupabaseConfigured) return
    
    try {
      const profile = await supabaseService.getUserProfile(userId)
      setUserProfile(profile)
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Authentication not available in offline mode')
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      // Sync local data to Supabase after successful sign in
      setTimeout(async () => {
        await syncData()
      }, 1000)
      
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Registration not available in offline mode')
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })
      if (error) throw error
      
      // The user will be automatically added to the users table via the trigger
      
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured || !supabase) {
      // For offline mode, just clear local state
      setUser(null)
      setSession(null)
      setUserProfile(null)
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Password reset not available in offline mode')
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  const syncData = async (): Promise<{ success: number; errors: number }> => {
    if (!user) return { success: 0, errors: 0 }
    
    try {
      // First sync local invoices to Supabase
      const localToSupabase = await supabaseService.syncLocalInvoicesToSupabase()
      
      // Then sync Supabase back to localStorage for consistency
      const supabaseToLocal = await supabaseService.syncSupabaseToLocalStorage()
      
      return {
        success: localToSupabase.success + supabaseToLocal.success,
        errors: localToSupabase.errors + supabaseToLocal.errors
      }
    } catch (error) {
      console.error('Failed to sync data:', error)
      return { success: 0, errors: 1 }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    syncData,
    userProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}