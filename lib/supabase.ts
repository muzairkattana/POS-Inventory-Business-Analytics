import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Environment variables validation (optional for offline mode)
// Use placeholder defaults if not set to prevent build failures
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if Supabase is configured
// Only consider it configured if BOTH URL and key are valid and not placeholder values
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseUrl.includes('supabase.co')
)

// Database types
export interface Database {
  public: {
    Tables: {
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_address: string
          items: any[]
          subtotal: number
          discount: number
          tax: number
          total: number
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          created_at: string
          updated_at: string
          due_date: string | null
          user_id: string
          company_info: any
          table_columns: any[]
        }
        Insert: {
          id?: string
          invoice_number: string
          customer_name: string
          customer_email?: string
          customer_phone?: string
          customer_address?: string
          items: any[]
          subtotal: number
          discount?: number
          tax?: number
          total: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          created_at?: string
          updated_at?: string
          due_date?: string | null
          user_id: string
          company_info?: any
          table_columns?: any[]
        }
        Update: {
          id?: string
          invoice_number?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          customer_address?: string
          items?: any[]
          subtotal?: number
          discount?: number
          tax?: number
          total?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          created_at?: string
          updated_at?: string
          due_date?: string | null
          user_id?: string
          company_info?: any
          table_columns?: any[]
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          role: 'admin' | 'user'
          company_id: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          role?: 'admin' | 'user'
          company_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          role?: 'admin' | 'user'
          company_id?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          owner_name: string
          address: string
          phone1: string
          phone2: string | null
          email: string
          ntn: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_name: string
          address: string
          phone1: string
          phone2?: string | null
          email: string
          ntn?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_name?: string
          address?: string
          phone1?: string
          phone2?: string | null
          email?: string
          ntn?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      app_kv: {
        Row: {
          id: string
          user_id: string
          collection: string
          key: string
          data: any
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          collection: string
          key: string
          data: any
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          collection?: string
          key?: string
          data?: any
          updated_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Client for use in Client Components (browser)
export const createSupabaseClient = () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - running in offline mode')
    return null as any
  }
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // During SSR/prerendering, return a basic client
    return createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  
  // In browser, use the SSR-aware browser client
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Client for use in Server Components
export const createSupabaseServerClient = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - running in offline mode')
    return null as any
  }
  // Use basic client for server-side
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Client for use in Route Handlers  
export const createSupabaseRouteHandlerClient = async () => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - running in offline mode')
    return null as any
  }
  // Use basic client for route handlers
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Legacy client (for backward compatibility)
export const supabase = isSupabaseConfigured ? createClient<Database>(supabaseUrl!, supabaseAnonKey!) : null as any

export default supabase