"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Share2, Copy, Mail, MessageSquare, Download, Link, MoreVertical, Edit, Trash2, Send, Printer } from "lucide-react"
import { generateOptimizedPDF, printInvoice } from "@/lib/pdf-utils"

interface InvoiceActionsProps {
  invoice: any
  onDuplicate?: () => void
  onDelete?: () => void
  onUpdate?: () => void
  onWhatsAppShare?: () => void // Added WhatsApp share prop
  onSave?: () => void // Save callback for print functionality
  printRef?: React.RefObject<HTMLDivElement>
}

export default function InvoiceActions({
  invoice,
  onDuplicate,
  onDelete,
  onUpdate,
  onWhatsAppShare,
  onSave,
  printRef,
}: InvoiceActionsProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareMethod, setShareMethod] = useState<"email" | "link" | "whatsapp">("email")
  const [recipientEmail, setRecipientEmail] = useState(invoice?.clientInfo?.email || "")
  const [shareMessage, setShareMessage] = useState(
    `Please find attached invoice ${invoice?.invoiceNumber} for your review.`,
  )

  const generateInvoiceURL = () => {
    // In a real app, this would generate a shareable URL
    const invoiceData = encodeURIComponent(JSON.stringify(invoice))
    return `${window.location.origin}/invoice/view?data=${invoiceData}`
  }

  const handleShare = async (method: "email" | "link" | "whatsapp") => {
    const invoiceURL = generateInvoiceURL()
    const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.companyInfo.name}`
    const message = `${shareMessage}\n\nView Invoice: ${invoiceURL}`

    switch (method) {
      case "email":
        const emailBody = encodeURIComponent(message)
        const emailSubject = encodeURIComponent(subject)
        window.open(`mailto:${recipientEmail}?subject=${emailSubject}&body=${emailBody}`)
        break

      case "whatsapp":
        const whatsappMessage = encodeURIComponent(
          `📄 *Invoice ${invoice.invoiceNumber}*\n\n` +
            `👤 Client: ${invoice.clientInfo?.name || "N/A"}\n` +
            `📅 Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}\n` +
            `💰 Total: $${invoice.grandTotal?.toFixed(2) || "0.00"}\n\n` +
            `${shareMessage}\n\n` +
            `Thank you for your business! 🙏\n\n` +
            `*BioCure Health Care*\n` +
            `📞 0345-5167742\n` +
            `📧 biocurehealthcare1979@gmail.com\n\n` +
            `View Invoice: ${invoiceURL}`,
        )
        window.open(`https://wa.me/?text=${whatsappMessage}`)
        break

      case "link":
        await navigator.clipboard.writeText(invoiceURL)
        alert("Invoice link copied to clipboard!")
        break
    }

    setShareDialogOpen(false)
  }

  const handleDownloadPDF = async () => {
    if (!printRef?.current) {
      alert('Invoice content not available for PDF generation')
      return
    }
    
    try {
      await generateOptimizedPDF(
        printRef.current,
        invoice,
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          format: 'a4',
          orientation: 'portrait'
        }
      )
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handlePrintInvoice = async () => {
    // Save invoice before printing
    if (onSave) {
      try {
        onSave()
      } catch (e) {
        console.warn('Could not save invoice before printing:', e)
      }
    }

    if (!printRef?.current) {
      // Fallback to regular print
      window.print()
      return
    }
    
    try {
      await printInvoice(printRef.current)
    } catch (error) {
      console.error('Error printing invoice:', error)
      // Fallback to regular print
      window.print()
    }
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(invoice, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invoice-${invoice.invoiceNumber}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2 no-print">
      {/* All action buttons removed from main page header */}
      
      {/* Share Dialog - hidden but keeping functionality for future use */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent hidden">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Share Method</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={shareMethod === "email" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShareMethod("email")}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button
                  variant={shareMethod === "whatsapp" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShareMethod("whatsapp")}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button
                  variant={shareMethod === "link" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShareMethod("link")}
                  className="flex items-center gap-2"
                >
                  <Link className="w-4 h-4" />
                  Copy Link
                </Button>
              </div>
            </div>

            {shareMethod === "email" && (
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Email</label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Add a personal message..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleShare(shareMethod)}>
                <Send className="w-4 h-4 mr-2" />
                Share Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
