"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Cloud, CopyCheck as CloudCheck, Settings, RefreshCw, AlertCircle, CheckCircle, X, Upload, Download, Folder, Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { googleAuthManager, type GoogleAuthResult } from "@/lib/google-auth"
import { backupSyncManager, type BackupStatus } from "@/lib/backup-sync-utils"
import { googleDriveClient } from "@/lib/google-drive-client"

interface CloudAccount {
  id: string
  type: "google-drive"
  email: string
  name: string
  picture: string
  connected: boolean
  autoSync: boolean
  lastSync?: Date
  lastBackup?: Date
  storage: {
    used: number
    total: number
  }
  backupInfo?: {
    hasCloudBackup: boolean
    cloudBackupDate?: Date
    localInvoicesCount: number
  }
}

interface CloudStorageManagerProps {
  onAccountConnect: (account: CloudAccount) => void
  onAccountDisconnect: (accountId: string) => void
  onAutoSyncToggle: (accountId: string, enabled: boolean) => void
}

export default function CloudStorageManager({
  onAccountConnect,
  onAccountDisconnect,
  onAutoSyncToggle,
}: CloudStorageManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [accounts, setAccounts] = useState<CloudAccount[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [showBackupDetails, setShowBackupDetails] = useState(false)

  useEffect(() => {
    loadCloudAccounts()
  }, [])

  const loadCloudAccounts = async () => {
    try {
      // Check if user is authenticated with Google Drive
      const authResult = await googleAuthManager.restoreAuth()
      if (authResult?.success && authResult.user) {
        // Get backup info
        const backupInfo = await backupSyncManager.getBackupInfo()
        
        // Get storage quota
        let storageQuota = { limit: '15000000000', usage: '0', usageInDrive: '0' }
        try {
          storageQuota = await googleDriveClient.getStorageQuota()
        } catch (error) {
          console.warn('Could not get storage quota:', error)
        }

        const account: CloudAccount = {
          id: 'google-drive-1',
          type: 'google-drive',
          email: authResult.user.email,
          name: authResult.user.name,
          picture: authResult.user.picture,
          connected: true,
          autoSync: true, // Default to enabled
          lastSync: backupInfo.lastBackup,
          lastBackup: backupInfo.lastBackup,
          storage: {
            used: Math.round(parseInt(storageQuota.usage) / 1024 / 1024), // Convert to MB
            total: Math.round(parseInt(storageQuota.limit) / 1024 / 1024) // Convert to MB
          },
          backupInfo
        }

        setAccounts([account])
        onAccountConnect(account)
      } else {
        setAccounts([])
      }
    } catch (error) {
      console.error('Error loading cloud accounts:', error)
      setAccounts([])
    }
  }

  const saveCloudAccounts = (updatedAccounts: CloudAccount[]) => {
    setAccounts(updatedAccounts)
    localStorage.setItem("cloud-accounts", JSON.stringify(updatedAccounts))
  }

  const handleConnectGoogleDrive = async () => {
    setIsConnecting(true)
    
    try {
      const authResult = await googleAuthManager.startAuth()
      
      if (authResult.success && authResult.user) {
        // Reload accounts to include the new connection
        await loadCloudAccounts()
        alert('Successfully connected to Google Drive!')
      } else {
        alert(authResult.error || 'Failed to connect to Google Drive')
      }
    } catch (error) {
      console.error('Error connecting to Google Drive:', error)
      alert('Failed to connect to Google Drive. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectAccount = async (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId)
    if (!account) return

    if (confirm(`Are you sure you want to disconnect ${account.email}? This will stop automatic backups.`)) {
      try {
        await googleAuthManager.revokeAccess()
        setAccounts([])
        onAccountDisconnect(accountId)
        alert('Successfully disconnected from Google Drive.')
      } catch (error) {
        console.error('Error disconnecting:', error)
        alert('Error disconnecting from Google Drive. Please try again.')
      }
    }
  }

  const handleToggleAutoSync = (accountId: string) => {
    const updatedAccounts = accounts.map((acc) => (acc.id === accountId ? { ...acc, autoSync: !acc.autoSync } : acc))
    setAccounts(updatedAccounts)

    const account = updatedAccounts.find((acc) => acc.id === accountId)
    if (account) {
      onAutoSyncToggle(accountId, account.autoSync)
      const status = account.autoSync ? 'enabled' : 'disabled'
      alert(`Auto-sync has been ${status} for ${account.email}`)
    }
  }

  const handleManualBackup = async () => {
    setIsBackingUp(true)
    setBackupStatus(null)
    
    try {
      const result = await backupSyncManager.backupInvoices()
      setBackupStatus(result)
      
      if (result.success) {
        // Refresh account info to show updated backup status
        await loadCloudAccounts()
      }
    } catch (error) {
      console.error('Manual backup error:', error)
      setBackupStatus({
        success: false,
        message: 'Backup failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date()
      })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!confirm('This will restore invoices from your Google Drive backup and overwrite your current local invoices. Are you sure?')) {
      return
    }

    setIsRestoring(true)
    setBackupStatus(null)
    
    try {
      const result = await backupSyncManager.restoreInvoices()
      setBackupStatus(result)
      
      if (result.success) {
        // Refresh the page to reload the restored invoices
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error('Restore error:', error)
      setBackupStatus({
        success: false,
        message: 'Restore failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        timestamp: new Date()
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatStorageSize = (sizeInMB: number) => {
    if (sizeInMB >= 1000) {
      return `${(sizeInMB / 1000).toFixed(1)} GB`
    }
    return `${sizeInMB} MB`
  }

  const getStoragePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100)
  }

  const connectedAccounts = accounts.filter((acc) => acc.connected)
  const hasConnectedAccounts = connectedAccounts.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent text-sm px-3 py-2">
          {hasConnectedAccounts ? <CloudCheck className="w-4 h-4 text-green-600" /> : <Cloud className="w-4 h-4" />}
          Cloud Storage
          {hasConnectedAccounts && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {connectedAccounts.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Cloud Storage Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connected Accounts */}
          {connectedAccounts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Connected Accounts</h3>
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          {account.type === "google-drive" ? (
                            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-green-500 rounded" />
                          ) : (
                            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-orange-500 rounded" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{account.type === "google-drive" ? "Google Drive" : "MEGA"}</p>
                          <p className="text-sm text-muted-foreground">{account.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={account.autoSync ? "default" : "secondary"}>
                          {account.autoSync ? "Auto-sync ON" : "Auto-sync OFF"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectAccount(account.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Storage Used</span>
                        <span>
                          {formatStorageSize(account.storage.used)} / {formatStorageSize(account.storage.total)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getStoragePercentage(account.storage.used, account.storage.total)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getStoragePercentage(account.storage.used, account.storage.total)}% used
                      </p>
                    </div>

                    {/* Last Sync */}
                    {account.lastSync && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Last synced: {account.lastSync.toLocaleString()}
                      </div>
                    )}

                    {/* Backup Info */}
                    {account.backupInfo && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Backup Status</span>
                          <Badge variant={account.backupInfo.hasCloudBackup ? "default" : "secondary"}>
                            {account.backupInfo.hasCloudBackup ? "Backed Up" : "No Backup"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Local invoices: {account.backupInfo.localInvoicesCount}</div>
                          {account.backupInfo.cloudBackupDate && (
                            <div>Last backup: {account.backupInfo.cloudBackupDate.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAutoSync(account.id)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        {account.autoSync ? "Disable Auto-sync" : "Enable Auto-sync"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowBackupDetails(!showBackupDetails)}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <Info className="w-4 h-4" />
                        Backup Details
                      </Button>
                    </div>

                    {/* Backup Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualBackup}
                        disabled={isBackingUp}
                        className="flex items-center gap-2"
                      >
                        {isBackingUp ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {isBackingUp ? "Backing Up..." : "Backup Now"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestoreBackup}
                        disabled={isRestoring || !account.backupInfo?.hasCloudBackup}
                        className="flex items-center gap-2"
                      >
                        {isRestoring ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isRestoring ? "Restoring..." : "Restore"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup Status */}
          {backupStatus && (
            <div className={`border rounded-lg p-4 ${backupStatus.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {backupStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <h4 className="font-semibold">
                  {backupStatus.success ? 'Backup Successful' : 'Backup Failed'}
                </h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{backupStatus.message}</p>
              <p className="text-xs text-muted-foreground">
                {backupStatus.timestamp.toLocaleString()}
              </p>
              {backupStatus.success && backupStatus.invoicesBackedUp && (
                <Badge variant="secondary" className="mt-2">
                  {backupStatus.invoicesBackedUp} invoices backed up
                </Badge>
              )}
            </div>
          )}

          {/* Add New Account */}
          {!hasConnectedAccounts && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Connect Google Drive</h3>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Cloud className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="font-semibold mb-2">Connect to Google Drive</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Securely backup your invoices to Google Drive and access them from anywhere.
                  </p>
                </div>

                <Button
                  onClick={handleConnectGoogleDrive}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-2 h-12"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting to Google Drive...
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-green-500 rounded" />
                      Connect Google Drive
                    </>
                  )}
                </Button>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Secure & Private</p>
                      <p className="text-muted-foreground">
                        Your invoices are encrypted and stored securely in your own Google Drive. 
                        We never have access to your files.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Storage Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CloudCheck className="w-4 h-4 text-green-600" />
              Benefits of Cloud Storage
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Automatic backup of all your invoices</li>
              <li>• Access your invoices from any device</li>
              <li>• Never lose important business data</li>
              <li>• Share invoices directly from cloud storage</li>
              <li>• Organize invoices in dedicated folders</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
