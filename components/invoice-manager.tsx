"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FolderOpen, Search, Calendar, DollarSign, User, Trash2, Eye, Copy, Database, Wifi, WifiOff } from "lucide-react"
import { offlineStorage, type OfflineInvoice } from "@/lib/offline-storage"

export interface SavedInvoice {
  id: string
  invoiceNumber: string
  clientName: string
  date: string
  dueDate: string
  total: number
  paidAmount?: number
  pendingAmount?: number
  status: "draft" | "sent" | "paid" | "overdue" | "partially_paid"
  items: any[]
  clientInfo: any
  companyInfo: any
  tableColumns: any[]
  createdAt: Date
  updatedAt: Date
}

interface InvoiceManagerProps {
  currentInvoice: any
  onLoadInvoice: (invoice: SavedInvoice) => void
  onSaveInvoice: (invoice: SavedInvoice) => void
}

export default function InvoiceManager({ currentInvoice, onLoadInvoice, onSaveInvoice }: InvoiceManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([])
  const [offlineInvoices, setOfflineInvoices] = useState<OfflineInvoice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [isOnline, setIsOnline] = useState(true)

  // Load invoices from both localStorage and IndexedDB on component mount
  useEffect(() => {
    const loadInvoices = async () => {
      // Load from localStorage (existing behavior)
      const saved = localStorage.getItem("saved-invoices")
      if (saved) {
        const invoices = JSON.parse(saved).map((inv: any) => ({
          ...inv,
          createdAt: new Date(inv.createdAt),
          updatedAt: new Date(inv.updatedAt),
        }))
        setSavedInvoices(invoices)
      }

      // Load from offline storage (IndexedDB)
      try {
        const offlineInvs = await offlineStorage.getAllInvoices()
        setOfflineInvoices(offlineInvs)
      } catch (error) {
        console.error('Failed to load offline invoices:', error)
      }
    }

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadInvoices()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save invoices to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem("saved-invoices", JSON.stringify(savedInvoices))
  }, [savedInvoices])

  const saveCurrentInvoice = () => {
    const invoice: SavedInvoice = {
      id: currentInvoice.id || Date.now().toString(),
      invoiceNumber: currentInvoice.invoiceNumber,
      clientName: currentInvoice.clientInfo.name,
      date: currentInvoice.invoiceDate,
      dueDate: currentInvoice.dueDate,
      total: currentInvoice.grandTotal,
      status: "draft",
      items: currentInvoice.items,
      clientInfo: currentInvoice.clientInfo,
      companyInfo: currentInvoice.companyInfo,
      tableColumns: currentInvoice.tableColumns,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const existingIndex = savedInvoices.findIndex((inv) => inv.id === invoice.id)
    if (existingIndex >= 0) {
      const updated = [...savedInvoices]
      updated[existingIndex] = { ...invoice, createdAt: updated[existingIndex].createdAt }
      setSavedInvoices(updated)
    } else {
      setSavedInvoices([invoice, ...savedInvoices])
    }

    // Fire-and-forget cloud save (if Supabase configured and user is authenticated)
    ;(async () => {
      try {
        const { isSupabaseConfigured } = await import("@/lib/supabase")
        if (!isSupabaseConfigured) return
        const { supabaseService } = await import("@/lib/supabase-service")
        await supabaseService.saveInvoice(invoice as any)
      } catch (e) {
        console.warn('Cloud save (invoice) skipped/failed:', e)
      }
    })()

    onSaveInvoice(invoice)
  }

  const deleteInvoice = (id: string) => {
    setSavedInvoices(savedInvoices.filter((inv) => inv.id !== id))
  }

  const duplicateInvoice = (invoice: SavedInvoice) => {
    const duplicate: SavedInvoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber: `${invoice.invoiceNumber}-COPY`,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSavedInvoices([duplicate, ...savedInvoices])
  }

  const updateInvoiceStatus = (id: string, status: SavedInvoice["status"]) => {
    setSavedInvoices(savedInvoices.map((inv) => (inv.id === id ? { ...inv, status, updatedAt: new Date() } : inv)))
  }

  const filteredInvoices = savedInvoices
    .filter((invoice) => {
      const matchesSearch =
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || invoice.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "client":
          return a.clientName.localeCompare(b.clientName)
        case "total":
          return b.total - a.total
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  const getStatusColor = (status: SavedInvoice["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "paid":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <FolderOpen className="w-4 h-4" />
          Manage Invoices
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice Management</span>
            <Button onClick={saveCurrentInvoice} className="text-sm">
              Save Current Invoice
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="client">Sort by Client</option>
              <option value="total">Sort by Total</option>
              <option value="status">Sort by Status</option>
            </select>

            <div className="ml-auto text-sm text-gray-600">
              {filteredInvoices.length} of {savedInvoices.length} invoices
            </div>
          </div>

          {/* Invoice List */}
          <div className="flex-1 overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No invoices found</p>
                <p className="text-sm text-gray-400">
                  {savedInvoices.length === 0
                    ? "Save your first invoice to get started"
                    : "Try adjusting your search or filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                      {/* Main Info Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg whitespace-nowrap">{invoice.invoiceNumber}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)} whitespace-nowrap`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{invoice.clientName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{new Date(invoice.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-semibold">Rs {invoice.total.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">
                            Updated: {invoice.updatedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons Section */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <select
                          value={invoice.status}
                          onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as SavedInvoice["status"])}
                          className="text-xs px-2 py-1.5 border border-gray-300 rounded whitespace-nowrap"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onLoadInvoice(invoice)
                            setIsOpen(false)
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 h-8 w-8"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateInvoice(invoice)}
                          className="text-green-600 hover:text-green-800 p-2 h-8 w-8"
                          title="Duplicate Invoice"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-800 p-2 h-8 w-8"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
