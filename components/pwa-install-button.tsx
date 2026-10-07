"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Smartphone, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PWAInstallButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  children?: React.ReactNode
}

export default function PWAInstallButton({ 
  className, 
  variant = 'default', 
  size = 'default',
  showIcon = true,
  children 
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if running as PWA on iOS
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired')
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully')
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isInstalled) return

    setIsLoading(true)

    try {
      if (!deferredPrompt) {
        // Manual installation instructions for browsers without install prompt
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
        
        let instructions = ''
        
        if (isIOS && isSafari) {
          instructions = 'To install:\n\n1. Tap the Share button (⬆️)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right'
        } else if (navigator.userAgent.includes('Chrome')) {
          instructions = 'To install:\n\n1. Click the menu (⋮) in the top right\n2. Select "Install Biocure Invoices..."\n3. Click "Install" when prompted'
        } else {
          instructions = 'To install:\n\n1. Look for "Add to Home Screen" or "Install App" in your browser menu\n2. Follow the installation prompts\n3. The app will be added to your device'
        }
        
        alert(`📱 Install Biocure Invoices App\n\n${instructions}`)
        setIsLoading(false)
        return
      }

      // Show the install prompt
      const result = await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`[PWA] Install prompt result: ${outcome}`)
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt')
        setIsInstalled(true)
      } else {
        console.log('[PWA] User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
      
    } catch (error) {
      console.error('[PWA] Install failed:', error)
      alert('Installation failed. Please try installing manually from your browser menu.')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if already installed
  if (isInstalled) {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn("cursor-default", className)}
        disabled
      >
        {showIcon && <Check className="w-4 h-4 mr-2" />}
        App Installed
      </Button>
    )
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant={variant}
      size={size}
      className={cn("transition-all duration-200", className)}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          {showIcon && <Download className="w-4 h-4 mr-2 animate-pulse" />}
          Installing...
        </>
      ) : (
        <>
          {showIcon && <Smartphone className="w-4 h-4 mr-2" />}
          {children || (isInstallable ? 'Install App' : 'Add to Home Screen')}
        </>
      )}
    </Button>
  )
}

// Hook to check PWA installation status
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  
  useEffect(() => {
    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
  
  return { isInstallable, isInstalled }
}
