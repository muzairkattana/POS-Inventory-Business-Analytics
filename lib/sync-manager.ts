/**
 * Comprehensive Sync Manager for Online/Offline Data Synchronization
 * Handles automatic sync when connection is restored and conflict resolution
 */

import { offlineStorage, type OfflineInvoice, type OfflineCustomer } from './offline-storage'

export interface SyncResult {
  success: boolean
  message: string
  syncedItems: number
  errors: string[]
  conflicts: SyncConflict[]
}

export interface SyncConflict {
  id: string
  type: 'invoice' | 'customer'
  localData: any
  cloudData: any
  resolution: 'local' | 'cloud' | 'merge' | 'pending'
}

class SyncManager {
  private isSyncing = false
  private syncQueue: string[] = []
  private onSyncStatusChange?: (status: 'idle' | 'syncing' | 'error') => void

  constructor() {
    // Listen for online events to trigger auto-sync
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.handleOnlineEvent()
      })

      // Periodic sync check (every 5 minutes when online)
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncIfNeeded()
        }
      }, 5 * 60 * 1000)
    }
  }

  /**
   * Set callback for sync status changes
   */
  onStatusChange(callback: (status: 'idle' | 'syncing' | 'error') => void) {
    this.onSyncStatusChange = callback
  }

  /**
   * Handle when device comes back online
   */
  private async handleOnlineEvent() {
    console.log('[SyncManager] Device came back online, checking for pending sync items')
    
    // Wait a moment for network to stabilize
    setTimeout(() => {
      this.syncIfNeeded()
    }, 2000)
  }

  /**
   * Check if sync is needed and perform if necessary
   */
  private async syncIfNeeded() {
    if (this.isSyncing || !navigator.onLine) {
      return
    }

    try {
      const stats = await offlineStorage.getOfflineStats()
      if (stats.pendingSyncItems > 0) {
        console.log(`[SyncManager] Found ${stats.pendingSyncItems} items pending sync`)
        await this.performSync()
      }
    } catch (error) {
      console.error('[SyncManager] Error checking sync status:', error)
    }
  }

  /**
   * Perform full synchronization
   */
  async performSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        message: 'Sync already in progress',
        syncedItems: 0,
        errors: [],
        conflicts: []
      }
    }

    if (!navigator.onLine) {
      return {
        success: false,
        message: 'Cannot sync while offline',
        syncedItems: 0,
        errors: [],
        conflicts: []
      }
    }

    this.isSyncing = true
    this.onSyncStatusChange?.('syncing')

    console.log('[SyncManager] Starting sync process')

    try {
      const result = await this.syncAllData()
      
      if (result.success) {
        console.log(`[SyncManager] Sync completed successfully. ${result.syncedItems} items synced`)
        this.onSyncStatusChange?.('idle')
      } else {
        console.error('[SyncManager] Sync failed:', result.message)
        this.onSyncStatusChange?.('error')
      }

      return result
    } catch (error) {
      console.error('[SyncManager] Sync process failed:', error)
      this.onSyncStatusChange?.('error')
      
      return {
        success: false,
        message: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        syncedItems: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        conflicts: []
      }
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Sync all data types
   */
  private async syncAllData(): Promise<SyncResult> {
    const errors: string[] = []
    const conflicts: SyncConflict[] = []
    let totalSynced = 0

    try {
      // Get all pending sync items
      const syncQueue = await offlineStorage.getSyncQueue()
      
      // Group by entity type for more efficient processing
      const invoiceItems = syncQueue.filter(item => item.entityType === 'invoice')
      const customerItems = syncQueue.filter(item => item.entityType === 'customer')

      // Sync invoices
      console.log(`[SyncManager] Syncing ${invoiceItems.length} invoice items`)
      for (const item of invoiceItems) {
        try {
          await this.syncSingleItem(item)
          totalSynced++
        } catch (error) {
          console.error(`[SyncManager] Failed to sync invoice ${item.entityId}:`, error)
          errors.push(`Invoice ${item.entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Sync customers
      console.log(`[SyncManager] Syncing ${customerItems.length} customer items`)
      for (const item of customerItems) {
        try {
          await this.syncSingleItem(item)
          totalSynced++
        } catch (error) {
          console.error(`[SyncManager] Failed to sync customer ${item.entityId}:`, error)
          errors.push(`Customer ${item.entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Update sync status for all processed items
      await this.updateSyncStatus(totalSynced)

      // Clear sync queue after successful sync
      if (errors.length === 0) {
        await offlineStorage.clearSyncQueue()
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully synced ${totalSynced} items`
          : `Synced ${totalSynced} items with ${errors.length} errors`,
        syncedItems: totalSynced,
        errors,
        conflicts
      }

    } catch (error) {
      console.error('[SyncManager] Sync process failed:', error)
      return {
        success: false,
        message: 'Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        syncedItems: totalSynced,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
        conflicts
      }
    }
  }

  /**
   * Sync a single item
   */
  private async syncSingleItem(item: any) {
    console.log(`[SyncManager] Syncing ${item.entityType} ${item.entityId} (${item.action})`)

    // For demo purposes, we'll simulate cloud sync
    // In a real implementation, you would make API calls here
    
    if (item.entityType === 'invoice') {
      await this.syncInvoiceToCloud(item)
    } else if (item.entityType === 'customer') {
      await this.syncCustomerToCloud(item)
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Sync invoice to cloud (simulated)
   */
  private async syncInvoiceToCloud(item: any) {
    // In a real implementation, this would make API calls to your backend
    console.log(`[SyncManager] Syncing invoice to cloud:`, {
      action: item.action,
      id: item.entityId,
      invoiceNumber: item.data?.invoiceNumber
    })

    // Simulate different sync actions
    switch (item.action) {
      case 'create':
        // POST to /api/invoices
        await this.simulateApiCall('POST', '/api/invoices', item.data)
        break
      case 'update':
        // PUT to /api/invoices/:id
        await this.simulateApiCall('PUT', `/api/invoices/${item.entityId}`, item.data)
        break
      case 'delete':
        // DELETE to /api/invoices/:id
        await this.simulateApiCall('DELETE', `/api/invoices/${item.entityId}`)
        break
    }

    // Update local record sync status
    if (item.data) {
      const invoice = await offlineStorage.getInvoice(item.entityId)
      if (invoice) {
        invoice.syncStatus = 'synced'
        await offlineStorage.saveInvoice(invoice)
      }
    }
  }

  /**
   * Sync customer to cloud (simulated)
   */
  private async syncCustomerToCloud(item: any) {
    console.log(`[SyncManager] Syncing customer to cloud:`, {
      action: item.action,
      id: item.entityId,
      name: item.data?.name
    })

    // Simulate API calls
    switch (item.action) {
      case 'create':
        await this.simulateApiCall('POST', '/api/customers', item.data)
        break
      case 'update':
        await this.simulateApiCall('PUT', `/api/customers/${item.entityId}`, item.data)
        break
      case 'delete':
        await this.simulateApiCall('DELETE', `/api/customers/${item.entityId}`)
        break
    }
  }

  /**
   * Simulate API call (for demo purposes)
   */
  private async simulateApiCall(method: string, endpoint: string, data?: any): Promise<any> {
    console.log(`[SyncManager] API Call: ${method} ${endpoint}`, data ? 'with data' : 'no data')
    
    // Simulate network request time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error(`Simulated API error for ${method} ${endpoint}`)
    }

    return { success: true, id: Date.now().toString() }
  }

  /**
   * Update sync status for items
   */
  private async updateSyncStatus(syncedCount: number) {
    console.log(`[SyncManager] Updated sync status for ${syncedCount} items`)
    
    // In a real implementation, you might update timestamps, sync flags, etc.
    // For now, we'll just log the update
  }

  /**
   * Force sync (manual trigger)
   */
  async forceSync(): Promise<SyncResult> {
    console.log('[SyncManager] Force sync requested')
    return await this.performSync()
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const stats = await offlineStorage.getOfflineStats()
    return {
      ...stats,
      isSyncing: this.isSyncing,
      isOnline: navigator.onLine
    }
  }

  /**
   * Handle conflicts (for future implementation)
   */
  private async handleConflict(conflict: SyncConflict): Promise<void> {
    // For now, we'll prefer local data
    // In a real implementation, you might show a UI for user to resolve conflicts
    console.log('[SyncManager] Handling conflict:', conflict)
    
    switch (conflict.resolution) {
      case 'local':
        // Keep local data, overwrite cloud
        break
      case 'cloud':
        // Keep cloud data, overwrite local
        break
      case 'merge':
        // Merge both datasets
        break
      default:
        // Leave as pending for user resolution
        break
    }
  }

  /**
   * Reset sync state (for debugging)
   */
  async resetSyncState() {
    console.log('[SyncManager] Resetting sync state')
    await offlineStorage.clearSyncQueue()
    this.isSyncing = false
    this.onSyncStatusChange?.('idle')
  }
}

// Export singleton instance
export const syncManager = new SyncManager()

// Utility functions
export const isSyncAvailable = (): boolean => {
  return navigator.onLine && !syncManager.isSyncInProgress()
}

export const getSyncStatusText = (isOnline: boolean, isSyncing: boolean, pendingItems: number): string => {
  if (!isOnline) return 'Offline - Changes saved locally'
  if (isSyncing) return 'Syncing changes...'
  if (pendingItems > 0) return `${pendingItems} items pending sync`
  return 'All changes synced'
}
