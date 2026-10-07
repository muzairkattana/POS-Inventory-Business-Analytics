"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, X, Share2, Settings, FileText } from "lucide-react"
import CloudStorageManager from "./cloud-storage-manager"

interface MobileActionMenuProps {
  onPrint: () => void
  onWhatsAppShare?: () => void
  onWordDownload?: () => void
}

export default function MobileActionMenu({ onPrint, onWhatsAppShare, onWordDownload }: MobileActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleCloudAccountConnect = (account: any) => {
    console.log("[uzair] Cloud account connected:", account)
    // Auto-sync will be handled by the parent component
  }

  const handleCloudAccountDisconnect = (accountId: string) => {
    console.log("[uzair] Cloud account disconnected:", accountId)
  }

  const handleAutoSyncToggle = (accountId: string, enabled: boolean) => {
    console.log("[uzair] Auto-sync toggled:", accountId, enabled)
  }

  return (
    <>
      {/* Click-away overlay: closes the menu when clicking on background */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 print:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Action Menu Button - Enhanced for all screen sizes - Bottom Left - Fixed relative to content */}
      <div className="mobile-action-menu fixed bottom-4 left-4 z-20 print:hidden transition-all duration-300 ease-in-out">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 bg-blue-600/60 hover:bg-blue-700/70 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 backdrop-blur-sm border border-white/20"
          aria-label="Open action menu"
        >
          {isOpen ? <X className="w-6 h-6 text-white/80" /> : <Settings className="w-6 h-6 text-white/80" />}
        </Button>

        {/* Action Menu - Enhanced layout for all devices */}
        {isOpen && (
          <div className="absolute bottom-16 left-0 bg-background border rounded-xl shadow-2xl p-3 min-w-[250px] max-w-[300px] animate-in slide-in-from-bottom-2 duration-200">
            <div className="space-y-2">
              <div className="text-center pb-2 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Quick Actions</h3>
              </div>
              {onWhatsAppShare && (
                <Button
                  onClick={() => {
                    onWhatsAppShare()
                    setIsOpen(false)
                  }}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-left hover:bg-green-50"
                >
                  <Share2 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Share on WhatsApp</div>
                    <div className="text-xs text-muted-foreground">Send invoice details</div>
                  </div>
                </Button>
              )}

              <Button
                onClick={() => {
                  onPrint()
                  setIsOpen(false)
                }}
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-left hover:bg-blue-50 border border-blue-200"
              >
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Printer className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-blue-700">Print Invoice</div>
                  <div className="text-xs text-muted-foreground">Print or save as PDF</div>
                </div>
              </Button>


              {onWordDownload && (
                <Button
                  onClick={() => {
                    onWordDownload()
                    setIsOpen(false)
                  }}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 text-left hover:bg-emerald-50 border border-emerald-200"
                >
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-medium text-emerald-700">Download Word</div>
                    <div className="text-xs text-muted-foreground">Save as .docx</div>
                  </div>
                </Button>
              )}


              <div className="pt-2 border-t border-border">
                <CloudStorageManager
                  onAccountConnect={handleCloudAccountConnect}
                  onAccountDisconnect={handleCloudAccountDisconnect}
                  onAutoSyncToggle={handleAutoSyncToggle}
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  )
}
