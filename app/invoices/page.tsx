"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Share2,
  Printer,
  Calendar,
  DollarSign,
  User,
  FileText,
  CreditCard,
  Menu,
  Cloud,
  Settings,
  Download,
  Upload,
  BarChart3,
  Bell,
  StickyNote,
  Eye,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { SavedInvoice } from "@/components/invoice-manager"
import dynamic from "next/dynamic"
const PaymentReminderSystem = dynamic(() => import("@/components/payment-reminder-system"), { ssr: false, loading: () => <div className="p-4">Loading reminders...</div> })
const PrintQueueManager = dynamic(() => import("@/components/print-queue-manager"), { ssr: false, loading: () => <div className="p-4">Loading print queue...</div> })
const InvoiceNotesModal = dynamic(() => import("@/components/invoice-notes-modal"), { ssr: false })
import { activityLogger, logInvoiceDeleted, logPaymentUpdate } from "@/lib/activity-logger"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200)
    return () => clearTimeout(t)
  }, [searchTerm])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const [showPrintQueue, setShowPrintQueue] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [selectedInvoiceForNotes, setSelectedInvoiceForNotes] = useState<{ id: string; number: string } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<SavedInvoice | null>(null)
  const tableRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000) // Update every 30 seconds instead of every second

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadInvoices()
    // Try to pull latest from Supabase then refresh local
    ;(async () => {
      try {
        const { isSupabaseConfigured } = await import("@/lib/supabase")
        if (!isSupabaseConfigured) return
        const { supabaseService } = await import("@/lib/supabase-service")
        const res = await supabaseService.syncSupabaseToLocalStorage()
        if (res.success >= 0) {
          loadInvoices()
        }
      } catch (e) {
        console.warn('Supabase sync (pull) failed:', e)
      }
    })()
  }, [])

  const loadInvoices = () => {
    try {
      const saved = localStorage.getItem("saved-invoices")
      if (saved) {
        const parsedInvoices = JSON.parse(saved)
        // Ensure all invoices have required fields for payment tracking
        const normalizedInvoices = parsedInvoices.map((inv: any) => ({
          ...inv,
          paidAmount: inv.paidAmount || 0,
          pendingAmount: inv.pendingAmount || (inv.total - (inv.paidAmount || 0)),
          status: inv.status || 'draft'
        }))
        setInvoices(
          normalizedInvoices.sort(
            (a: SavedInvoice, b: SavedInvoice) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        )
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      // Reset corrupted data
      localStorage.removeItem("saved-invoices")
      setInvoices([])
    }
  }

  const handlePaidAmountChange = (invoiceId: string, newPaidAmount: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId)
    const oldAmount = invoice?.paidAmount || 0
    
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        const paidAmount = Math.max(0, Math.min(newPaidAmount, inv.total))
        const pendingAmount = inv.total - paidAmount
        let newStatus = inv.status
        
        // Auto-update status based on payment
        if (paidAmount === 0) {
          newStatus = 'pending'
        } else if (paidAmount >= inv.total) {
          newStatus = 'paid'
        } else {
          newStatus = 'partially_paid'
        }
        
        return {
          ...inv,
          paidAmount,
          pendingAmount,
          status: newStatus,
          updatedAt: new Date()
        }
      }
      return inv
    })
    
    setInvoices(updatedInvoices)
    localStorage.setItem("saved-invoices", JSON.stringify(updatedInvoices))

    // Fire-and-forget cloud update for the modified invoice
    ;(async () => {
      const { isSupabaseConfigured } = await import("@/lib/supabase")
      if (!isSupabaseConfigured) return
      try {
        const { supabaseService } = await import("@/lib/supabase-service")
        const updated = updatedInvoices.find(inv => inv.id === invoiceId)
        if (updated) await supabaseService.saveInvoice(updated as any)
      } catch (e) {
        console.warn('Cloud update (invoice) failed:', e)
      }
    })()
    
    // Log the payment update
    if (invoice && oldAmount !== newPaidAmount) {
      logPaymentUpdate(invoice.invoiceNumber, oldAmount, newPaidAmount)
    }
  }

  const filteredInvoices = useMemo(() => {
    const s = debouncedSearchTerm.toLowerCase()
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(s) ||
        invoice.clientName.toLowerCase().includes(s)

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [invoices, debouncedSearchTerm, statusFilter])

  const handleDeleteInvoice = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      const updatedInvoices = invoices.filter((inv) => inv.id !== invoiceId)
      setInvoices(updatedInvoices)
      localStorage.setItem("saved-invoices", JSON.stringify(updatedInvoices))

      // Fire-and-forget cloud delete
      ;(async () => {
        const { isSupabaseConfigured } = await import("@/lib/supabase")
        if (!isSupabaseConfigured) return
        try {
          const { supabaseService } = await import("@/lib/supabase-service")
          await supabaseService.deleteInvoice(invoiceId)
        } catch (e) {
          console.warn('Cloud delete (invoice) failed:', e)
        }
      })()
      
      // Log the deletion
      if (invoice) {
        logInvoiceDeleted(invoice)
      }
    }
  }

  const handleOpenNotes = (invoice: SavedInvoice) => {
    activityLogger.log({
      type: 'note_added',
      action: 'Open Notes',
      description: `Opened notes for invoice ${invoice.invoiceNumber}`,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total: invoice.total
      },
      reversible: false
    })
    setSelectedInvoiceForNotes({ id: invoice.id, number: invoice.invoiceNumber })
    setShowNotes(true)
  }

  const handleCloseNotes = () => {
    setShowNotes(false)
    setSelectedInvoiceForNotes(null)
  }

  const handleOpenDetails = (invoice: SavedInvoice) => {
    activityLogger.log({
      type: 'invoice_viewed',
      action: 'View Invoice Details',
      description: `Viewed details for invoice ${invoice.invoiceNumber}`,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total: invoice.total,
        status: invoice.status,
        paidAmount: invoice.paidAmount
      },
      reversible: false
    })
    setSelectedInvoiceForDetails(invoice)
    setShowDetails(true)
  }

  const handleCloseDetails = () => {
    setShowDetails(false)
    setSelectedInvoiceForDetails(null)
  }

  const handleWhatsAppShare = async (invoice: SavedInvoice) => {
    activityLogger.log({
      type: 'invoice_shared',
      action: 'Share Invoice',
      description: `Shared invoice ${invoice.invoiceNumber} via WhatsApp`,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        total: invoice.total,
        shareMethod: 'WhatsApp'
      },
      reversible: false
    })
    
    const message = encodeURIComponent(
      `📄 *Invoice ${invoice.invoiceNumber}*\\n\\n` +
        `👤 Client: ${invoice.clientName}\\n` +
        `📅 Date: ${new Date(invoice.date).toLocaleDateString()}\\n` +
        `💰 Total: Rs ${invoice.total.toFixed(2)}\\\\n` +
        `📊 Status: ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}\\n\\n` +
        `Thank you for your business! 🙏\\n\\n` +
        `*BioCure Health Care*\\n` +
        `📞 03459288499 | 03028191116\\n` +
        `📧 shafiqqahmad81@gmail.com`,
    )

    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  const handlePhoneClick = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    const message = encodeURIComponent("Hello! I'm contacting you regarding your invoice.")
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank")
  }

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, "_blank")
  }

  const formatDateTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
      date: date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }
  }


  const { time, date } = formatDateTime(currentTime)

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prevSelected) =>
      prevSelected.includes(invoiceId) ? prevSelected.filter((id) => id !== invoiceId) : [...prevSelected, invoiceId],
    )
  }

  const handleBulkAction = (action: string) => {
    if (action === "export") {
      exportSelectedInvoices()
    } else if (action === "delete") {
      deleteSelectedInvoices()
    }
  }

  const exportSelectedInvoices = () => {
    const selectedInvoicesData = invoices.filter(invoice => selectedInvoices.includes(invoice.id))
    
    // Export to Excel-like format (CSV)
    const csvHeaders = [
      'Invoice Number',
      'Client Name',
      'Client Phone', 
      'Client Email',
      'Client Address',
      'Client City',
      'Date',
      'Due Date',
      'Total Amount',
      'Paid Amount',
      'Pending Amount',
      'Status',
      'Items Count',
      'Company Name',
      'Company Owner',
      'Company Phone',
      'Company Email',
      'Created At',
      'Updated At'
    ]
    
    const csvData = selectedInvoicesData.map(invoice => [
      invoice.invoiceNumber,
      invoice.clientInfo?.name || invoice.clientName,
      invoice.clientInfo?.phone || '',
      invoice.clientInfo?.email || '',
      invoice.clientInfo?.address || '',
      invoice.clientInfo?.city || '',
      new Date(invoice.date).toLocaleDateString(),
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
      invoice.total.toFixed(2),
      (invoice.paidAmount || 0).toFixed(2),
      (invoice.total - (invoice.paidAmount || 0)).toFixed(2),
      invoice.status,
      invoice.items?.length || 0,
      invoice.companyInfo?.name || '',
      invoice.companyInfo?.owner || '',
      invoice.companyInfo?.phone1 || '',
      invoice.companyInfo?.email || '',
      new Date(invoice.createdAt).toLocaleString(),
      new Date(invoice.updatedAt).toLocaleString()
    ])
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Log export
    activityLogger.log({
      type: 'bulk_export',
      action: 'Bulk Export',
      description: `Exported ${selectedInvoices.length} invoices to CSV`,
      details: { count: selectedInvoices.length, format: 'CSV' },
      reversible: false,
    })
    
    alert(`Exported ${selectedInvoices.length} invoices to CSV file!`)
    setSelectedInvoices([])
  }

  const exportAllInvoices = () => {
    // Export all invoices to Excel-like format (CSV)
    const csvHeaders = [
      'Invoice Number',
      'Client Name', 
      'Client Phone',
      'Client Email',
      'Client Address',
      'Client City',
      'Date',
      'Due Date',
      'Total Amount',
      'Paid Amount',
      'Pending Amount',
      'Status',
      'Items Count',
      'Company Name',
      'Company Owner',
      'Company Phone',
      'Company Email',
      'Created At',
      'Updated At'
    ]
    
    const csvData = invoices.map(invoice => [
      invoice.invoiceNumber,
      invoice.clientInfo?.name || invoice.clientName,
      invoice.clientInfo?.phone || '',
      invoice.clientInfo?.email || '',
      invoice.clientInfo?.address || '',
      invoice.clientInfo?.city || '',
      new Date(invoice.date).toLocaleDateString(),
      invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '',
      invoice.total.toFixed(2),
      (invoice.paidAmount || 0).toFixed(2),
      (invoice.total - (invoice.paidAmount || 0)).toFixed(2),
      invoice.status,
      invoice.items?.length || 0,
      invoice.companyInfo?.name || '',
      invoice.companyInfo?.owner || '',
      invoice.companyInfo?.phone1 || '',
      invoice.companyInfo?.email || '',
      new Date(invoice.createdAt).toLocaleString(),
      new Date(invoice.updatedAt).toLocaleString()
    ])
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `all-invoices-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Log export all
    activityLogger.log({
      type: 'invoice_exported',
      action: 'Export All Invoices',
      description: `Exported all ${invoices.length} invoices to CSV`,
      details: { count: invoices.length, format: 'CSV' },
      reversible: false,
    })
    
    alert(`Exported all ${invoices.length} invoices to CSV file!`)
  }

  const totalAmountAll = useMemo(() => invoices.reduce((sum, inv) => sum + inv.total, 0), [invoices])
  const totalPaid = useMemo(() => invoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.total, 0), [invoices])
  const totalPendingAmount = useMemo(() => invoices.filter((inv) => inv.status === "pending").reduce((sum, inv) => sum + inv.total, 0), [invoices])

  const importInvoices = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        
        if (file.name.endsWith('.json')) {
          // Import JSON backup
          const data = JSON.parse(content)
          if (data.invoices && Array.isArray(data.invoices)) {
            const importedInvoices = data.invoices
            const updatedInvoices = [...invoices, ...importedInvoices]
            setInvoices(updatedInvoices)
            localStorage.setItem("saved-invoices", JSON.stringify(updatedInvoices))
            alert(`Imported ${importedInvoices.length} invoices successfully!`)
          } else {
            alert('Invalid JSON format. Please export from this app and try again.')
          }
        } else if (file.name.endsWith('.csv')) {
          // Import CSV file
          const lines = content.split('\n')
          const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
          
          if (!headers.includes('Invoice Number') || !headers.includes('Client Name')) {
            alert('Invalid CSV format. Required columns: Invoice Number, Client Name')
            return
          }
          
          const importedInvoices = lines.slice(1).filter(line => line.trim()).map((line, index) => {
            const values = line.split(',').map(v => v.replace(/"/g, ''))
            const invoiceData: any = {}
            
            headers.forEach((header, i) => {
              invoiceData[header] = values[i] || ''
            })
            
            return {
              id: `imported-${Date.now()}-${index}`,
              invoiceNumber: invoiceData['Invoice Number'] || `IMP-${index + 1}`,
              clientName: invoiceData['Client Name'] || 'Imported Client',
              date: invoiceData['Date'] ? new Date(invoiceData['Date']).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              dueDate: invoiceData['Due Date'] ? new Date(invoiceData['Due Date']).toISOString().split('T')[0] : '',
              total: parseFloat(invoiceData['Amount']) || 0,
              status: invoiceData['Status']?.toLowerCase() || 'draft',
              items: [],
              clientInfo: {
                name: invoiceData['Client Name'] || 'Imported Client',
                phone: invoiceData['Client Phone'] || '',
                email: invoiceData['Client Email'] || '',
                address: invoiceData['Client Address'] || '',
                city: invoiceData['Client City'] || ''
              },
              companyInfo: {
                name: "BIOCURE HEALTH CARE",
                owner: "Shafiq Ahmad",
                address: "Shop No. 02, Gujra Kaly Main Road, Pirsadi, Shergarh, Mardan Takht Bhai",
                phone1: "03459288499",
                phone2: "03028191116",
                email: "shafiqqahmad81@gmail.com",
              },
              tableColumns: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          
          const validInvoices = importedInvoices.filter(inv => inv.invoiceNumber && inv.clientName)
          const updatedInvoices = [...invoices, ...validInvoices]
          setInvoices(updatedInvoices)
          localStorage.setItem("saved-invoices", JSON.stringify(updatedInvoices))
          alert(`Imported ${validInvoices.length} invoices from CSV successfully!`)
        }
      } catch (error) {
        console.error('Failed to import invoices:', error)
        alert('Failed to import file. Please check the format and try again.')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    event.target.value = ''
  }

  const deleteSelectedInvoices = () => {
    if (confirm(`Are you sure you want to delete ${selectedInvoices.length} selected invoices? This action cannot be undone.`)) {
      const deletedInvoices = invoices.filter(inv => selectedInvoices.includes(inv.id))
      const updatedInvoices = invoices.filter(inv => !selectedInvoices.includes(inv.id))
      setInvoices(updatedInvoices)
      localStorage.setItem("saved-invoices", JSON.stringify(updatedInvoices))
      
      // Log bulk delete
      activityLogger.log({
        type: 'bulk_delete',
        action: 'Bulk Delete',
        description: `Deleted ${selectedInvoices.length} invoices`,
        details: { count: selectedInvoices.length, invoices: deletedInvoices },
        reversible: true,
        reverseData: deletedInvoices,
      })
      
      setSelectedInvoices([])
      alert(`Deleted ${selectedInvoices.length} invoices successfully!`)
    }
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left section with logo and title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href="/"
                  className="bg-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer flex items-center gap-2 min-w-0"
                >
                  <img src="/images/biocure-health-care-logo.jpg" alt="Biocure Health Care" className="h-6 sm:h-8 w-auto shrink-0" />
                  <div className="font-bold text-blue-900 text-sm sm:text-lg truncate">BIOCURE HEALTH CARE</div>
                </Link>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">All Invoices</h1>
                <p className="text-blue-100 text-xs sm:text-sm">Manage all your invoices in one place</p>
              </div>
            </div>
            
            {/* Right section with time and new invoice button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              {mounted && (
                <div className="text-left sm:text-right text-blue-100">
                  <div className="text-base sm:text-lg font-bold font-mono">{time}</div>
                  <div className="text-xs">{date}</div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm px-3 py-2">
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New Invoice</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => setStatusFilter("all")}
            className="bg-card p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("all")}
            className="bg-card p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  Rs {totalAmountAll.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("paid")}
            className="bg-card p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs {totalPaid.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("pending")}
            className="bg-card p-4 rounded-lg border shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  Rs {totalPendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card p-4 rounded-lg border shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportAllInvoices} className="text-sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export All
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={importInvoices}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" className="text-sm">
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowReminders(true)} className="text-sm hidden md:flex">
                  <Bell className="w-4 h-4 mr-1" />
                  Reminders
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPrintQueue(true)} className="text-sm hidden md:flex">
                  <Printer className="w-4 h-4 mr-1" />
                  Print Queue
                </Button>
              </div>
            </div>

            {selectedInvoices.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("export")} className="text-sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export ({selectedInvoices.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete ({selectedInvoices.length})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div ref={tableRef} className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] lg:min-w-[1000px]">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(filteredInvoices.map((inv) => inv.id))
                        } else {
                          setSelectedInvoices([])
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Invoice #</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Client</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Date</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Due Date</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Amount</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Paid</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Pending</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Status</th>
                  <th className="text-left p-3 sm:p-4 font-semibold text-xs sm:text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center p-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No invoices found</p>
                      <p className="text-sm">Create your first invoice to get started</p>
                      <Link href="/">
                        <Button className="mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Invoice
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice, index) => (
                    <tr key={invoice.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => toggleInvoiceSelection(invoice.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="font-medium text-foreground break-all text-sm sm:text-base leading-snug">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <button
                            onClick={() => handlePhoneClick("03459288499")}
                            className="text-foreground hover:text-blue-600 transition-colors cursor-pointer text-left break-words"
                          >
                            {invoice.clientName}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="p-3 sm:p-4 text-muted-foreground">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="font-semibold text-foreground whitespace-nowrap">Rs {invoice.total.toFixed(2)}</span>
                      </td>
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          max={invoice.total}
                          step="0.01"
                          value={(invoice.paidAmount || 0).toFixed(2)}
                          onChange={(e) => handlePaidAmountChange(invoice.id, parseFloat(e.target.value) || 0)}
                          className="w-32 h-9 text-sm font-semibold text-green-600 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="font-semibold text-orange-600 whitespace-nowrap">Rs {(invoice.total - (invoice.paidAmount || 0)).toFixed(2)}</span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <Badge className={`${getStatusColor(invoice.status)} border-0`}>
                          {invoice.status === 'partially_paid' ? 'Partially Paid' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 flex-shrink-0"
                            onClick={() => handleOpenDetails(invoice)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Link href={`/?load=${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" title="Edit Invoice">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 flex-shrink-0"
                            onClick={() => handleOpenNotes(invoice)}
                            title="Add/View Notes"
                          >
                            <StickyNote className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 flex-shrink-0"
                            onClick={() => handleWhatsAppShare(invoice)}
                            title="Share via WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 flex-shrink-0"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invoice Notes Modal */}
      {selectedInvoiceForNotes && (
        <InvoiceNotesModal
          isOpen={showNotes}
          onClose={handleCloseNotes}
          invoiceId={selectedInvoiceForNotes.id}
          invoiceNumber={selectedInvoiceForNotes.number}
        />
      )}

      {/* Payment Reminder System Modal */}
      {showReminders && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-4 bg-background border rounded-lg shadow-lg overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Payment Reminder System</h2>
                <Button variant="outline" size="sm" onClick={() => setShowReminders(false)}>×</Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <PaymentReminderSystem 
                  invoices={invoices}
                  onReminderSent={(reminder) => console.log('Reminder sent:', reminder)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Queue Manager Modal */}
      {showPrintQueue && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-4 bg-background border rounded-lg shadow-lg overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Print Queue Manager</h2>
                <Button variant="outline" size="sm" onClick={() => setShowPrintQueue(false)}>×</Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <PrintQueueManager 
                  invoices={invoices}
                  onPrintStart={(job) => console.log('Print started:', job)}
                  onPrintComplete={(job) => console.log('Print completed:', job)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetails && selectedInvoiceForDetails && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={handleCloseDetails}>
          <div className="fixed inset-4 bg-background border rounded-lg shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-900 to-purple-800">
                <h2 className="text-xl font-bold text-white">Invoice Details</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCloseDetails}
                  className="text-white hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">{selectedInvoiceForDetails.invoiceNumber}</h3>
                        <Badge className={`${getStatusColor(selectedInvoiceForDetails.status)} border-0 text-sm`}>
                          {selectedInvoiceForDetails.status === 'partially_paid' ? 'Partially Paid' : selectedInvoiceForDetails.status.charAt(0).toUpperCase() + selectedInvoiceForDetails.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-foreground">Rs {selectedInvoiceForDetails.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground mt-1">Total Amount</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">Paid Amount</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">Rs {(selectedInvoiceForDetails.paidAmount || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Pending Amount</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">Rs {(selectedInvoiceForDetails.total - (selectedInvoiceForDetails.paidAmount || 0)).toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Due Date</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {selectedInvoiceForDetails.dueDate ? new Date(selectedInvoiceForDetails.dueDate).toLocaleDateString() : 'Not Set'}
                      </p>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Client Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Name</p>
                        <p className="font-semibold text-foreground">{selectedInvoiceForDetails.clientInfo?.name || selectedInvoiceForDetails.clientName}</p>
                      </div>
                      {selectedInvoiceForDetails.clientInfo?.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Phone</p>
                          <p className="font-semibold text-foreground">{selectedInvoiceForDetails.clientInfo.phone}</p>
                        </div>
                      )}
                      {selectedInvoiceForDetails.clientInfo?.email && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Email</p>
                          <p className="font-semibold text-foreground">{selectedInvoiceForDetails.clientInfo.email}</p>
                        </div>
                      )}
                      {selectedInvoiceForDetails.clientInfo?.address && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Address</p>
                          <p className="font-semibold text-foreground">{selectedInvoiceForDetails.clientInfo.address}</p>
                        </div>
                      )}
                      {selectedInvoiceForDetails.clientInfo?.city && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">City</p>
                          <p className="font-semibold text-foreground">{selectedInvoiceForDetails.clientInfo.city}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Items */}
                  {selectedInvoiceForDetails.items && selectedInvoiceForDetails.items.length > 0 && (
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Invoice Items ({selectedInvoiceForDetails.items.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="text-left p-3 font-semibold text-sm">Item</th>
                              <th className="text-right p-3 font-semibold text-sm">Quantity</th>
                              <th className="text-right p-3 font-semibold text-sm">Price</th>
                              <th className="text-right p-3 font-semibold text-sm">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoiceForDetails.items.map((item: any, index: number) => (
                              <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                                <td className="p-3">
                                  <p className="font-medium text-foreground">{item.description || item.name || 'Item'}</p>
                                </td>
                                <td className="p-3 text-right text-muted-foreground">{item.quantity || 1}</td>
                                <td className="p-3 text-right text-muted-foreground">Rs {(item.price || 0).toFixed(2)}</td>
                                <td className="p-3 text-right font-semibold text-foreground">Rs {((item.quantity || 1) * (item.price || 0)).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Company Information */}
                  {selectedInvoiceForDetails.companyInfo && (
                    <div className="bg-card p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-bold text-foreground mb-4">Company Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Company Name</p>
                          <p className="font-semibold text-foreground">{selectedInvoiceForDetails.companyInfo.name}</p>
                        </div>
                        {selectedInvoiceForDetails.companyInfo.owner && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Owner</p>
                            <p className="font-semibold text-foreground">{selectedInvoiceForDetails.companyInfo.owner}</p>
                          </div>
                        )}
                        {selectedInvoiceForDetails.companyInfo.address && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">Address</p>
                            <p className="font-semibold text-foreground">{selectedInvoiceForDetails.companyInfo.address}</p>
                          </div>
                        )}
                        {selectedInvoiceForDetails.companyInfo.phone1 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Phone</p>
                            <p className="font-semibold text-foreground">{selectedInvoiceForDetails.companyInfo.phone1}</p>
                          </div>
                        )}
                        {selectedInvoiceForDetails.companyInfo.email && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                            <p className="font-semibold text-foreground">{selectedInvoiceForDetails.companyInfo.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="bg-card p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">Timeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Invoice Date</p>
                        <p className="font-semibold text-foreground">{new Date(selectedInvoiceForDetails.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Created At</p>
                        <p className="font-semibold text-foreground">{new Date(selectedInvoiceForDetails.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                        <p className="font-semibold text-foreground">{new Date(selectedInvoiceForDetails.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4">
                    <Link href={`/?load=${selectedInvoiceForDetails.id}`}>
                      <Button className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Invoice
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        handleCloseDetails()
                        handleWhatsAppShare(selectedInvoiceForDetails)
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share via WhatsApp
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "partially_paid":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "overdue":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}
