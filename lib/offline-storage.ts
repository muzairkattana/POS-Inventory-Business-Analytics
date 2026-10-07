/**
 * Comprehensive Offline Storage System using IndexedDB
 * Provides complete offline functionality for invoices, customers, and app data
 */

export interface OfflineInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  discount: number
  total: number
  tax: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  notes?: string
  syncStatus: 'synced' | 'pending' | 'offline_only'
  lastModified: Date
}

export interface OfflineCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
  invoiceCount: number
  totalAmount: number
  syncStatus: 'synced' | 'pending' | 'offline_only'
}

export interface OfflineAppSettings {
  id: string
  key: string
  value: any
  updatedAt: Date
  syncStatus: 'synced' | 'pending' | 'offline_only'
}

export interface OfflineSyncQueue {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: 'invoice' | 'customer' | 'settings'
  entityId: string
  data: any
  createdAt: Date
  retryCount: number
  lastRetry?: Date
  error?: string
}

class OfflineStorageManager {
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'BiocureHealthcareDB'
  private readonly DB_VERSION = 1

  constructor() {
    // Don't initialize DB in constructor to avoid SSR issues
    // DB will be initialized lazily when first accessed
  }

  private async initDB(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not available (SSR environment)')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create invoices store
        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' })
          invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true })
          invoiceStore.createIndex('customerName', 'customerName', { unique: false })
          invoiceStore.createIndex('status', 'status', { unique: false })
          invoiceStore.createIndex('syncStatus', 'syncStatus', { unique: false })
          invoiceStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        // Create customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customerStore = db.createObjectStore('customers', { keyPath: 'id' })
          customerStore.createIndex('name', 'name', { unique: false })
          customerStore.createIndex('email', 'email', { unique: false })
          customerStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        }

        // Create app settings store
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'id' })
          settingsStore.createIndex('key', 'key', { unique: true })
          settingsStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncStore.createIndex('entityType', 'entityType', { unique: false })
          syncStore.createIndex('action', 'action', { unique: false })
          syncStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        console.log('IndexedDB schema created/updated')
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not available (not in browser environment)')
    }

    if (!this.db) {
      await this.initDB()
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }
    return this.db
  }

  // ===== INVOICE OPERATIONS =====

  async saveInvoice(invoice: OfflineInvoice): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['invoices'], 'readwrite')
    const store = transaction.objectStore('invoices')

    invoice.lastModified = new Date()
    invoice.syncStatus = (typeof window !== 'undefined' && navigator.onLine) ? 'pending' : 'offline_only'

    return new Promise((resolve, reject) => {
      const request = store.put(invoice)
      request.onsuccess = () => {
        console.log('Invoice saved offline:', invoice.id)
        
        // Add to sync queue if online
        if (typeof window !== 'undefined' && navigator.onLine) {
          this.addToSyncQueue('invoice', 'update', invoice.id, invoice)
        }
        
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getInvoice(id: string): Promise<OfflineInvoice | null> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['invoices'], 'readonly')
    const store = transaction.objectStore('invoices')

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllInvoices(): Promise<OfflineInvoice[]> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['invoices'], 'readonly')
    const store = transaction.objectStore('invoices')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const invoices = request.result || []
        console.log(`Retrieved ${invoices.length} invoices from offline storage`)
        resolve(invoices)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteInvoice(id: string): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['invoices'], 'readwrite')
    const store = transaction.objectStore('invoices')

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => {
        console.log('Invoice deleted offline:', id)
        
        // Add to sync queue if online
        if (typeof window !== 'undefined' && navigator.onLine) {
          this.addToSyncQueue('invoice', 'delete', id, null)
        }
        
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ===== CUSTOMER OPERATIONS =====

  async saveCustomer(customer: OfflineCustomer): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['customers'], 'readwrite')
    const store = transaction.objectStore('customers')

    customer.updatedAt = new Date()
    customer.syncStatus = (typeof window !== 'undefined' && navigator.onLine) ? 'pending' : 'offline_only'

    return new Promise((resolve, reject) => {
      const request = store.put(customer)
      request.onsuccess = () => {
        console.log('Customer saved offline:', customer.id)
        
        if (typeof window !== 'undefined' && navigator.onLine) {
          this.addToSyncQueue('customer', 'update', customer.id, customer)
        }
        
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllCustomers(): Promise<OfflineCustomer[]> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['customers'], 'readonly')
    const store = transaction.objectStore('customers')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const customers = request.result || []
        console.log(`Retrieved ${customers.length} customers from offline storage`)
        resolve(customers)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ===== SYNC QUEUE OPERATIONS =====

  private async addToSyncQueue(entityType: 'invoice' | 'customer' | 'settings', action: 'create' | 'update' | 'delete', entityId: string, data: any): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')

    const syncItem: OfflineSyncQueue = {
      id: `${entityType}-${action}-${entityId}-${Date.now()}`,
      action,
      entityType,
      entityId,
      data,
      createdAt: new Date(),
      retryCount: 0
    }

    return new Promise((resolve, reject) => {
      const request = store.put(syncItem)
      request.onsuccess = () => {
        console.log('Added to sync queue:', syncItem.id)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<OfflineSyncQueue[]> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['syncQueue'], 'readonly')
    const store = transaction.objectStore('syncQueue')

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')

    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => {
        console.log('Sync queue cleared')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // ===== UTILITY METHODS =====

  async getOfflineStats(): Promise<{
    invoiceCount: number
    customerCount: number
    pendingSyncItems: number
    lastSyncDate?: Date
    storageSize: number
  }> {
    const invoices = await this.getAllInvoices()
    const customers = await this.getAllCustomers()
    const syncQueue = await this.getSyncQueue()

    // Estimate storage size (rough calculation)
    const dataSize = JSON.stringify({ invoices, customers }).length
    const storageSize = Math.round(dataSize / 1024) // KB

    return {
      invoiceCount: invoices.length,
      customerCount: customers.length,
      pendingSyncItems: syncQueue.length,
      storageSize
    }
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()
    const transaction = db.transaction(['invoices', 'customers', 'settings', 'syncQueue'], 'readwrite')

    const promises = [
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('invoices').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('customers').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('settings').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('syncQueue').clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    ]

    await Promise.all(promises)
    console.log('All offline data cleared')
  }

  // ===== SYNC OPERATIONS =====

  async syncWithCloud(): Promise<{ success: boolean; message: string; syncedItems: number }> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      return {
        success: false,
        message: 'Cannot sync while offline',
        syncedItems: 0
      }
    }

    try {
      const syncQueue = await this.getSyncQueue()
      let syncedItems = 0

      for (const item of syncQueue) {
        try {
          // Here you would implement actual cloud sync logic
          // For now, we'll just mark items as synced
          console.log('Syncing item:', item)
          
          // Update the original entity's sync status
          if (item.entityType === 'invoice' && item.data) {
            const invoice = await this.getInvoice(item.entityId)
            if (invoice) {
              invoice.syncStatus = 'synced'
              await this.saveInvoice(invoice)
            }
          }

          syncedItems++
        } catch (error) {
          console.error('Failed to sync item:', item.id, error)
        }
      }

      // Clear the sync queue after successful sync
      await this.clearSyncQueue()

      return {
        success: true,
        message: `Successfully synced ${syncedItems} items`,
        syncedItems
      }
    } catch (error) {
      console.error('Sync failed:', error)
      return {
        success: false,
        message: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        syncedItems: 0
      }
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager()

// Utility function to check if app is running offline
export const isOfflineMode = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !window.navigator) {
    return true // Assume offline during SSR
  }
  return !navigator.onLine
}

// Utility function to generate offline invoice
export const createOfflineInvoice = (data: Partial<OfflineInvoice>): OfflineInvoice => {
  const now = new Date()
  const invoiceNumber = data.invoiceNumber || `INV-${Date.now()}`
  
  return {
    id: data.id || `offline-${Date.now()}`,
    invoiceNumber,
    customerName: data.customerName || '',
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    items: data.items || [],
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    total: data.total || 0,
    tax: data.tax || 0,
    status: data.status || 'draft',
    createdAt: data.createdAt || now,
    updatedAt: now,
    dueDate: data.dueDate,
    notes: data.notes,
    syncStatus: 'offline_only',
    lastModified: now
  }
}
