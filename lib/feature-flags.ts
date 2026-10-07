"use client"

import { useState, useEffect } from 'react'

// Define all available feature flags
export interface FeatureFlags {
  // UI Feature Toggles
  showPWAButton: boolean
  showCloudStorage: boolean
  showOfflineStatus: boolean
  showCalculatorFAB: boolean
  
  // Action Feature Toggles
  enablePrint: boolean
  enablePDFDownload: boolean
  enableWordDownload: boolean
  enableWhatsAppShare: boolean
  
  // Print Settings
  showEmailInPrint: boolean
  showPhoneInPrint: boolean
  
  // Advanced Features
  enableAutoSave: boolean
  enableOfflineMode: boolean
  enableCloudSync: boolean
  
  // Admin Features
  enableDebugMode: boolean
  showPerformanceMetrics: boolean
}

// Default feature flag values
const DEFAULT_FLAGS: FeatureFlags = {
  // UI Features - enabled by default
  showPWAButton: true,
  showCloudStorage: true,
  showOfflineStatus: true,
  showCalculatorFAB: true,
  
  // Actions - enabled by default
  enablePrint: true,
  enablePDFDownload: true,
  enableWordDownload: true,
  enableWhatsAppShare: true,
  
  // Print settings - enabled by default
  showEmailInPrint: true,
  showPhoneInPrint: true,
  
  // Advanced features - enabled by default
  enableAutoSave: true,
  enableOfflineMode: true,
  enableCloudSync: true,
  
  // Admin features - disabled by default
  enableDebugMode: false,
  showPerformanceMetrics: false,
}

const STORAGE_KEY = 'app-feature-flags'
const BROADCAST_CHANNEL_NAME = 'feature-flags-sync'

class FeatureFlagsManager {
  private broadcastChannel: BroadcastChannel | null = null
  private listeners: Set<(flags: FeatureFlags) => void> = new Set()

  constructor() {
    // Initialize broadcast channel for real-time sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      this.broadcastChannel.addEventListener('message', (event) => {
        if (event.data.type === 'feature-flags-updated') {
          // Notify all listeners of the flag changes
          this.listeners.forEach(listener => listener(event.data.flags))
        }
      })
    }
  }

  // Get current feature flags from localStorage
  getFlags(): FeatureFlags {
    if (typeof window === 'undefined') return DEFAULT_FLAGS
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new flags
        return { ...DEFAULT_FLAGS, ...parsed }
      }
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
    
    return DEFAULT_FLAGS
  }

  // Update feature flags and broadcast changes
  updateFlags(updates: Partial<FeatureFlags>): FeatureFlags {
    const currentFlags = this.getFlags()
    const newFlags = { ...currentFlags, ...updates }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFlags))
      
      // Broadcast changes to other tabs/windows
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'feature-flags-updated',
          flags: newFlags
        })
      }
      
      // Notify local listeners
      this.listeners.forEach(listener => listener(newFlags))
      
      return newFlags
    } catch (error) {
      console.error('Error saving feature flags:', error)
      return currentFlags
    }
  }

  // Subscribe to flag changes
  subscribe(listener: (flags: FeatureFlags) => void): () => void {
    this.listeners.add(listener)
    
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Reset all flags to defaults
  resetToDefaults(): FeatureFlags {
    try {
      localStorage.removeItem(STORAGE_KEY)
      
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'feature-flags-updated',
          flags: DEFAULT_FLAGS
        })
      }
      
      this.listeners.forEach(listener => listener(DEFAULT_FLAGS))
      
      return DEFAULT_FLAGS
    } catch (error) {
      console.error('Error resetting feature flags:', error)
      return this.getFlags()
    }
  }

  // Get flag categories for admin UI
  getFlagCategories() {
    return [
      {
        name: 'UI Components',
        description: 'Control visibility of UI elements',
        flags: [
          { key: 'showPWAButton', label: 'PWA Install Button', description: 'Show the install app button' },
          { key: 'showCloudStorage', label: 'Cloud Storage Manager', description: 'Show cloud storage integration' },
          { key: 'showOfflineStatus', label: 'Offline Status', description: 'Show offline/online status indicator' },
          { key: 'showCalculatorFAB', label: 'Calculator Button', description: 'Show floating calculator button' },
        ]
      },
      {
        name: 'Actions & Downloads',
        description: 'Control available actions and export options',
        flags: [
          { key: 'enablePrint', label: 'Print Function', description: 'Allow printing invoices' },
          { key: 'enablePDFDownload', label: 'PDF Download', description: 'Allow PDF export' },
          { key: 'enableWordDownload', label: 'Word Download', description: 'Allow Word document export' },
          { key: 'enableWhatsAppShare', label: 'WhatsApp Sharing', description: 'Allow sharing via WhatsApp' },
        ]
      },
      {
        name: 'Print Settings',
        description: 'Control what appears in printed invoices',
        flags: [
          { key: 'showEmailInPrint', label: 'Email in Print', description: 'Show email addresses in printed invoices' },
          { key: 'showPhoneInPrint', label: 'Phone in Print', description: 'Show phone numbers in printed invoices' },
        ]
      },
      {
        name: 'Advanced Features',
        description: 'Advanced functionality toggles',
        flags: [
          { key: 'enableAutoSave', label: 'Auto-Save', description: 'Automatically save invoice changes' },
          { key: 'enableOfflineMode', label: 'Offline Mode', description: 'Enable offline functionality' },
          { key: 'enableCloudSync', label: 'Cloud Sync', description: 'Enable cloud synchronization' },
        ]
      },
      {
        name: 'Developer & Debug',
        description: 'Tools for development and troubleshooting',
        flags: [
          { key: 'enableDebugMode', label: 'Debug Mode', description: 'Show debug information and logs' },
          { key: 'showPerformanceMetrics', label: 'Performance Metrics', description: 'Display performance monitoring' },
        ]
      }
    ]
  }

  // Cleanup resources
  destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
    this.listeners.clear()
  }
}

// Global instance
const featureFlagsManager = new FeatureFlagsManager()

// React hook for using feature flags
export function useFeatureFlags(): {
  flags: FeatureFlags
  updateFlags: (updates: Partial<FeatureFlags>) => void
  resetFlags: () => void
  isEnabled: (flag: keyof FeatureFlags) => boolean
} {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS)

  useEffect(() => {
    // Load initial flags
    setFlags(featureFlagsManager.getFlags())

    // Subscribe to changes
    const unsubscribe = featureFlagsManager.subscribe(setFlags)

    return () => {
      unsubscribe()
    }
  }, [])

  const updateFlags = (updates: Partial<FeatureFlags>) => {
    featureFlagsManager.updateFlags(updates)
  }

  const resetFlags = () => {
    featureFlagsManager.resetToDefaults()
  }

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return flags[flag] as boolean
  }

  return {
    flags,
    updateFlags,
    resetFlags,
    isEnabled
  }
}

// Export utilities
export { featureFlagsManager, DEFAULT_FLAGS }
export default FeatureFlagsManager
