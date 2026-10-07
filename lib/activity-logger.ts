/**
 * Activity Logger - Comprehensive logging system for tracking all operations
 * Tracks invoices, authentication, edits, deletions, and more
 */

export type ActivityType = 
  | 'invoice_created'
  | 'invoice_edited'
  | 'invoice_deleted'
  | 'invoice_status_changed'
  | 'invoice_exported'
  | 'invoice_imported'
  | 'invoice_viewed'
  | 'invoice_shared'
  | 'invoice_printed'
  | 'login_attempt'
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'client_added'
  | 'client_edited'
  | 'client_deleted'
  | 'settings_changed'
  | 'payment_updated'
  | 'note_added'
  | 'note_edited'
  | 'note_deleted'
  | 'bulk_delete'
  | 'bulk_export'
  | 'page_visit'
  | 'page_leave'

export interface ActivityLog {
  id: string
  timestamp: Date
  type: ActivityType
  action: string
  description: string
  details: any
  userId?: string
  userName?: string
  ipAddress?: string
  userAgent?: string
  // For undo functionality
  reversible: boolean
  reverseData?: any
  reversed?: boolean
  reversedAt?: Date
}

class ActivityLogger {
  private storageKey = 'activity-logs'
  private maxLogs = 1000 // Keep last 1000 logs

  /**
   * Log a new activity
   */
  log(activity: Omit<ActivityLog, 'id' | 'timestamp'>): ActivityLog {
    const logs = this.getAllLogs()
    
    const newLog: ActivityLog = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }

    logs.unshift(newLog)

    // Keep only the most recent logs
    if (logs.length > this.maxLogs) {
      logs.splice(this.maxLogs)
    }

    this.saveLogs(logs)
    return newLog
  }

  /**
   * Get all activity logs
   */
  getAllLogs(): ActivityLog[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []

      const logs = JSON.parse(stored)
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        reversedAt: log.reversedAt ? new Date(log.reversedAt) : undefined,
      }))
    } catch (error) {
      console.error('Failed to load activity logs:', error)
      return []
    }
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: ActivityType): ActivityLog[] {
    return this.getAllLogs().filter(log => log.type === type)
  }

  /**
   * Get logs within date range
   */
  getLogsByDateRange(startDate: Date, endDate: Date): ActivityLog[] {
    return this.getAllLogs().filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= startDate && logDate <= endDate
    })
  }

  /**
   * Search logs
   */
  searchLogs(query: string): ActivityLog[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllLogs().filter(log => 
      log.action.toLowerCase().includes(lowerQuery) ||
      log.description.toLowerCase().includes(lowerQuery) ||
      JSON.stringify(log.details).toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Delete a specific log
   */
  deleteLog(logId: string): boolean {
    const logs = this.getAllLogs()
    const filteredLogs = logs.filter(log => log.id !== logId)
    
    if (filteredLogs.length === logs.length) {
      return false // Log not found
    }

    this.saveLogs(filteredLogs)
    return true
  }

  /**
   * Clear all logs
   */
  clearAllLogs(): void {
    localStorage.removeItem(this.storageKey)
  }

  /**
   * Clear logs older than specified days
   */
  clearOldLogs(daysOld: number): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const logs = this.getAllLogs()
    const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate)
    const deletedCount = logs.length - recentLogs.length

    this.saveLogs(recentLogs)
    return deletedCount
  }

  /**
   * Mark a log as reversed (for undo operations)
   */
  markAsReversed(logId: string): boolean {
    const logs = this.getAllLogs()
    const log = logs.find(l => l.id === logId)
    
    if (!log || !log.reversible) {
      return false
    }

    log.reversed = true
    log.reversedAt = new Date()
    this.saveLogs(logs)
    return true
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const logs = this.getAllLogs()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayLogs = logs.filter(log => new Date(log.timestamp) >= today)
    
    const typeCount: Record<string, number> = {}
    logs.forEach(log => {
      typeCount[log.type] = (typeCount[log.type] || 0) + 1
    })

    return {
      total: logs.length,
      today: todayLogs.length,
      byType: typeCount,
      reversible: logs.filter(log => log.reversible && !log.reversed).length,
      reversed: logs.filter(log => log.reversed).length,
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    const logs = this.getAllLogs()
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    const logs = this.getAllLogs()
    
    const headers = ['ID', 'Timestamp', 'Type', 'Action', 'Description', 'User', 'Reversible', 'Reversed']
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.type,
      log.action,
      log.description,
      log.userName || 'Unknown',
      log.reversible ? 'Yes' : 'No',
      log.reversed ? 'Yes' : 'No',
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return csvContent
  }

  // Private helper methods
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private saveLogs(logs: ActivityLog[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(logs))
    } catch (error) {
      console.error('Failed to save activity logs:', error)
    }
  }

  private getClientIP(): string {
    // In a real application, you would get this from the server
    return 'client-side'
  }
}

// Singleton instance
export const activityLogger = new ActivityLogger()

// Helper functions for common operations
export const logInvoiceCreated = (invoiceData: any) => {
  return activityLogger.log({
    type: 'invoice_created',
    action: 'Invoice Created',
    description: `Invoice ${invoiceData.invoiceNumber} created for ${invoiceData.clientName}`,
    details: invoiceData,
    reversible: true,
    reverseData: { invoiceId: invoiceData.id },
  })
}

export const logInvoiceEdited = (invoiceData: any, oldData: any) => {
  return activityLogger.log({
    type: 'invoice_edited',
    action: 'Invoice Edited',
    description: `Invoice ${invoiceData.invoiceNumber} was modified`,
    details: { new: invoiceData, old: oldData },
    reversible: true,
    reverseData: { invoiceId: invoiceData.id, oldData },
  })
}

export const logInvoiceDeleted = (invoiceData: any) => {
  return activityLogger.log({
    type: 'invoice_deleted',
    action: 'Invoice Deleted',
    description: `Invoice ${invoiceData.invoiceNumber} was deleted`,
    details: invoiceData,
    reversible: true,
    reverseData: invoiceData,
  })
}

export const logLoginAttempt = (username: string, success: boolean) => {
  return activityLogger.log({
    type: success ? 'login_success' : 'login_failed',
    action: success ? 'Login Success' : 'Login Failed',
    description: `${success ? 'Successful' : 'Failed'} login attempt for user: ${username}`,
    details: { username, timestamp: new Date() },
    reversible: false,
    userName: username,
  })
}

export const logPaymentUpdate = (invoiceNumber: string, oldAmount: number, newAmount: number) => {
  return activityLogger.log({
    type: 'payment_updated',
    action: 'Payment Updated',
    description: `Payment for invoice ${invoiceNumber} updated from Rs ${oldAmount} to Rs ${newAmount}`,
    details: { invoiceNumber, oldAmount, newAmount },
    reversible: true,
    reverseData: { invoiceNumber, amount: oldAmount },
  })
}

