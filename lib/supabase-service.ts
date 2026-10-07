import { createSupabaseClient, Database, isSupabaseConfigured } from './supabase'
import { SavedInvoice } from '@/components/invoice-manager'

import { cloudKV } from '@/lib/cloud-kv'

export class SupabaseInvoiceService {
  private supabase = createSupabaseClient()
  
  private checkSupabaseAvailable() {
    if (!isSupabaseConfigured || !this.supabase) {
      throw new Error('Supabase not configured - running in offline mode')
    }
  }

  // Get current user
  async getCurrentUser() {
    this.checkSupabaseAvailable()
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) throw error
    return user
  }

  // Get user profile with company info
  async getUserProfile(userId: string) {
    this.checkSupabaseAvailable()
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  // Save invoice to Supabase
  async saveInvoice(invoice: SavedInvoice): Promise<Database['public']['Tables']['invoices']['Row']> {
    this.checkSupabaseAvailable()
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Normalize status to match DB enum to avoid insert errors
    const uiStatus = (invoice.status || 'draft') as string
    const allowed = new Set(['draft','sent','paid','overdue','cancelled'])
    const normalizedStatus = allowed.has(uiStatus) ? uiStatus : (uiStatus === 'pending' || uiStatus === 'partially_paid') ? 'sent' : 'draft'

    const invoiceData = {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.clientInfo?.name || invoice.clientName,
      customer_email: invoice.clientInfo?.email || '',
      customer_phone: invoice.clientInfo?.phone || '',
      customer_address: `${invoice.clientInfo?.address || ''}, ${invoice.clientInfo?.city || ''}`.trim().replace(/^,|,$/, ''),
      items: invoice.items || [],
      subtotal: this.calculateSubtotal(invoice.items || []),
      discount: this.calculateTotalDiscount(invoice.items || []),
      tax: this.calculateTotalTax(invoice.items || []),
      total: invoice.total,
      status: normalizedStatus as any,
      due_date: invoice.dueDate || null,
      user_id: user.id,
      company_info: invoice.companyInfo || {},
      table_columns: invoice.tableColumns || [],
      created_at: invoice.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: invoice.updatedAt?.toISOString() || new Date().toISOString()
    }

    // Try to update first, if not exists then insert
    const { data: existingInvoice } = await this.supabase
      .from('invoices')
      .select('id')
      .eq('id', invoice.id)
      .single()

    if (existingInvoice) {
      // Update existing invoice
      const { data, error } = await this.supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', invoice.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Insert new invoice
      const { data, error } = await this.supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  // Get all invoices for current user
  async getInvoices(): Promise<Database['public']['Tables']['invoices']['Row'][]> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: string): Promise<Database['public']['Tables']['invoices']['Row'] | null> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await this.supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  // Delete invoice
  async deleteInvoice(invoiceId: string): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Update invoice status
  async updateInvoiceStatus(invoiceId: string, status: 'draft' | 'sent' | 'paid' | 'overdue'): Promise<void> {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await this.supabase
      .from('invoices')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Convert Supabase invoice to SavedInvoice format
  supabaseToSavedInvoice(supabaseInvoice: Database['public']['Tables']['invoices']['Row']): SavedInvoice {
    return {
      id: supabaseInvoice.id,
      invoiceNumber: supabaseInvoice.invoice_number,
      clientName: supabaseInvoice.customer_name,
      date: new Date(supabaseInvoice.created_at).toISOString().split('T')[0],
      dueDate: supabaseInvoice.due_date || '',
      total: Number(supabaseInvoice.total),
      status: supabaseInvoice.status as any,
      items: supabaseInvoice.items,
      clientInfo: {
        name: supabaseInvoice.customer_name,
        email: supabaseInvoice.customer_email || '',
        phone: supabaseInvoice.customer_phone || '',
        address: supabaseInvoice.customer_address?.split(',')[0] || '',
        city: supabaseInvoice.customer_address?.split(',').slice(1).join(',').trim() || ''
      },
      companyInfo: supabaseInvoice.company_info || {},
      tableColumns: supabaseInvoice.table_columns || [],
      createdAt: new Date(supabaseInvoice.created_at),
      updatedAt: new Date(supabaseInvoice.updated_at)
    }
  }

  // Sync localStorage invoices to Supabase
  async syncLocalInvoicesToSupabase(): Promise<{ success: number; errors: number }> {
    try {
      const localInvoices = JSON.parse(localStorage.getItem('saved-invoices') || '[]') as SavedInvoice[]
      let success = 0
      let errors = 0

      for (const invoice of localInvoices) {
        try {
          await this.saveInvoice(invoice)
          success++
        } catch (error) {
          console.error(`Failed to sync invoice ${invoice.id}:`, error)
          errors++
        }
      }

      return { success, errors }
    } catch (error) {
      console.error('Failed to sync local invoices:', error)
      return { success: 0, errors: 1 }
    }
  }

  // Sync Supabase invoices to localStorage (for offline support)
  async syncSupabaseToLocalStorage(): Promise<{ success: number; errors: number }> {
    try {
      const supabaseInvoices = await this.getInvoices()
      const savedInvoices = supabaseInvoices.map(invoice => this.supabaseToSavedInvoice(invoice))

      // Do NOT wipe local data if cloud has no invoices yet
      if (savedInvoices.length > 0) {
        localStorage.setItem('saved-invoices', JSON.stringify(savedInvoices))
        return { success: savedInvoices.length, errors: 0 }
      }

      return { success: 0, errors: 0 }
    } catch (error) {
      console.error('Failed to sync Supabase invoices to localStorage:', error)
      return { success: 0, errors: 1 }
    }
  }

  // Helper methods for calculations
  private calculateSubtotal(items: any[]): number {
    return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)
  }

  private calculateTotalDiscount(items: any[]): number {
    return items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0)
      return sum + (subtotal * (item.discount || 0)) / 100
    }, 0)
  }

  private calculateTotalTax(items: any[]): number {
    return items.reduce((sum, item) => {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0)
      const afterDiscount = subtotal - (subtotal * (item.discount || 0)) / 100
      return sum + (afterDiscount * (item.taxRate || 0)) / 100
    }, 0)
  }
  // Generic collection save/load using KV table
  async saveCollection(collection: string, key: string, data: any) {
    try {
      return await cloudKV.save(collection, key, data)
    } catch (e) {
      console.warn(`[Supabase] saveCollection failed for ${collection}/${key}:`, e)
      return null
    }
  }

  async loadCollection<T = any>(collection: string, key: string): Promise<T | null> {
    try {
      return await cloudKV.load<T>(collection, key)
    } catch (e) {
      console.warn(`[Supabase] loadCollection failed for ${collection}/${key}:`, e)
      return null
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseInvoiceService()
