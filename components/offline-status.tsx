"use client"

import React, { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Cloud, 
  HardDrive, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { offlineStorage, isOfflineMode } from '@/lib/offline-storage'

interface OfflineStatusProps {
  className?: string
  showDetails?: boolean
}

export default function OfflineStatus({ className = "", showDetails = true }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [offlineStats, setOfflineStats] = useState({
    invoiceCount: 0,
    customerCount: 0,
    pendingSyncItems: 0,
    storageSize: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      if (showDetails) {
        autoSync()
      }
    }
    
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline stats
    loadOfflineStats()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showDetails])

  const loadOfflineStats = async () => {
    try {
      const stats = await offlineStorage.getOfflineStats()
      setOfflineStats(stats)
    } catch (error) {
      console.error('Failed to load offline stats:', error)
    }
  }

  const autoSync = async () => {
    if (!isOnline || offlineStats.pendingSyncItems === 0) return

    setIsLoading(true)
    try {
      const result = await offlineStorage.syncWithCloud()
      if (result.success) {
        setLastSyncTime(new Date())
        await loadOfflineStats() // Refresh stats after sync
      }
    } catch (error) {
      console.error('Auto-sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSync = async () => {
    setIsLoading(true)
    try {
      const result = await offlineStorage.syncWithCloud()
      if (result.success) {
        setLastSyncTime(new Date())
        await loadOfflineStats()
        alert(`✅ Sync completed! ${result.syncedItems} items synchronized.`)
      } else {
        alert(`❌ Sync failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Manual sync failed:', error)
      alert('❌ Sync failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = () => {
    if (isOnline) {
      return offlineStats.pendingSyncItems > 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200'
    }
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const getStatusText = () => {
    if (isOnline) {
      return offlineStats.pendingSyncItems > 0 ? 'Online - Syncing...' : 'Online & Synced'
    }
    return 'Offline Mode'
  }

  const getStatusIcon = () => {
    if (isOnline) {
      return offlineStats.pendingSyncItems > 0 ? 
        <RefreshCw className="w-4 h-4 animate-spin" /> : 
        <Wifi className="w-4 h-4" />
    }
    return <WifiOff className="w-4 h-4" />
  }

  if (!showDetails) {
    // Simple status badge
    return (
      <Badge variant="outline" className={`flex items-center gap-2 ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
    )
  }

  // Full status component with details
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`flex items-center gap-2 ${getStatusColor()} border ${className}`}
          size="sm"
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
          <span className="sm:hidden">Status</span>
          {offlineStats.pendingSyncItems > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {offlineStats.pendingSyncItems}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            App Connection Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <Card className={`${getStatusColor().replace('text-', 'border-').replace('bg-', 'bg-opacity-20 bg-')}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isOnline ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {getStatusIcon()}
                  </div>
                  <div>
                    <p className="font-semibold">{getStatusText()}</p>
                    <p className="text-sm opacity-75">
                      {isOnline ? 
                        'All features available' : 
                        'Offline mode - all data saved locally'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offline Data Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Invoices: {offlineStats.invoiceCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Customers: {offlineStats.customerCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Storage Used:
                </span>
                <span className="font-mono">{offlineStats.storageSize} KB</span>
              </div>
            </CardContent>
          </Card>

          {/* Sync Status */}
          {isOnline && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Cloud Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending items:</span>
                  <Badge variant={offlineStats.pendingSyncItems > 0 ? "destructive" : "default"}>
                    {offlineStats.pendingSyncItems}
                  </Badge>
                </div>
                
                {lastSyncTime && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3" />
                    Last sync: {lastSyncTime.toLocaleString()}
                  </div>
                )}

                <Button 
                  onClick={handleManualSync}
                  disabled={isLoading || offlineStats.pendingSyncItems === 0}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Syncing...' : 
                   offlineStats.pendingSyncItems === 0 ? 'All Synced' : `Sync ${offlineStats.pendingSyncItems} Items`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Offline Capabilities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Offline Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span>Create & edit invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span>Manage customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span>Print invoices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  <span>View all historical data</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                  <span>WhatsApp sharing (when online)</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                  <span>Cloud backup (when online)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            onClick={loadOfflineStats}
            className="w-full"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
