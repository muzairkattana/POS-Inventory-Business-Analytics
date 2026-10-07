"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { Plus, Search, Edit, Trash2, Phone, Mail, Globe, MapPin, Eye, Building2, User, Hash, StickyNote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import AuthGuard from "@/components/auth-guard"

// Lazy load heavy dialog components
const Dialog = lazy(() => import("@/components/ui/dialog").then(mod => ({ default: mod.Dialog })))
const DialogContent = lazy(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogContent })))
const DialogDescription = lazy(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogDescription })))
const DialogFooter = lazy(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogFooter })))
const DialogHeader = lazy(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogHeader })))
const DialogTitle = lazy(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogTitle })))
const AlertDialog = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialog })))
const AlertDialogAction = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogAction })))
const AlertDialogCancel = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogCancel })))
const AlertDialogContent = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogContent })))
const AlertDialogDescription = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogDescription })))
const AlertDialogFooter = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogFooter })))
const AlertDialogHeader = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogHeader })))
const AlertDialogTitle = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogTitle })))

interface Client {
  id: string
  name: string
  email: string
  phone: string
  website?: string
  address: string
  shopName?: string
  businessName: string
  contactPerson?: string
  taxId?: string
  notes?: string
  createdAt: Date
}

const emptyClient: Omit<Client, "id" | "createdAt"> = {
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  shopName: "",
  businessName: "",
  contactPerson: "",
  taxId: "",
  notes: "",
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyClient)

// Load clients from localStorage and cloud (if available)
  useEffect(() => {
    // Defer data loading to not block initial render
    const loadData = () => {
      const stored = localStorage.getItem("clients")
      if (stored) {
        try {
          setClients(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse clients:', e)
        }
      }
      
      // Load from cloud in background
      setTimeout(() => {
        import("@/lib/supabase").then(async ({ isSupabaseConfigured }) => {
          if (!isSupabaseConfigured) return
          try {
            const { supabaseService } = await import("@/lib/supabase-service")
            const cloud = await supabaseService.loadCollection<Client[]>("clients", "list")
            if (cloud && Array.isArray(cloud) && cloud.length > 0) {
              setClients(cloud)
              localStorage.setItem("clients", JSON.stringify(cloud))
            }
          } catch {}
        })
      }, 0)
    }
    
    // Use requestIdleCallback for better performance, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadData)
    } else {
      setTimeout(loadData, 0)
    }
  }, [])

// Save clients to localStorage and cloud (if available)
  const saveClients = (updatedClients: Client[]) => {
    setClients(updatedClients)
    localStorage.setItem("clients", JSON.stringify(updatedClients))
    // Fire-and-forget cloud save
    ;(async () => {
      const { isSupabaseConfigured } = await import("@/lib/supabase")
      if (!isSupabaseConfigured) return
      try {
        const { supabaseService } = await import("@/lib/supabase-service")
        await supabaseService.saveCollection("clients", "list", updatedClients)
      } catch (e) {
        console.warn('Cloud save (clients) failed:', e)
      }
    })()
  }

  const handleAddClient = () => {
    setEditingClient(null)
    setFormData(emptyClient)
    setIsDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      website: client.website || "",
      address: client.address,
      shopName: client.shopName || "",
      businessName: client.businessName,
      contactPerson: client.contactPerson || "",
      taxId: client.taxId || "",
      notes: client.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleViewClient = (client: Client) => {
    setViewingClient(client)
    setIsViewDialogOpen(true)
  }

  const handleDeleteClient = (id: string) => {
    setDeletingClientId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deletingClientId) {
      const updated = clients.filter((c) => c.id !== deletingClientId)
      saveClients(updated)
      setIsDeleteDialogOpen(false)
      setDeletingClientId(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingClient) {
      // Update existing client
      const updated = clients.map((c) =>
        c.id === editingClient.id
          ? { ...editingClient, ...formData }
          : c
      )
      saveClients(updated)
    } else {
      // Add new client
      const newClient: Client = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
      }
      saveClients([...clients, newClient])
    }

    setIsDialogOpen(false)
    setFormData(emptyClient)
  }

  const filteredClients = clients.filter((client) => {
    const query = searchQuery.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.businessName.toLowerCase().includes(query) ||
      client.phone.includes(query)
    )
  })

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your client information and contacts
            </p>
          </div>
          <Button onClick={handleAddClient} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search clients by name, email, business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <Card className="bg-card shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No clients found matching your search." : "No clients yet. Add your first client to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => (
              <div key={client.id} className="relative group">
                <Card className="bg-card hover:shadow-lg transition-all border border-border h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{client.name}</CardTitle>
                        <CardDescription className="truncate">{client.businessName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                <CardContent className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{client.website}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
                  {client.shopName && (
                    <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                      Shop: {client.shopName}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Action Buttons - Outside Card */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-card dark:bg-slate-800 shadow-md hover:shadow-lg border border-border dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => handleViewClient(client)}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-card dark:bg-slate-800 shadow-md hover:shadow-lg border border-border dark:border-slate-700 hover:bg-green-50 dark:hover:bg-green-950 hover:text-green-600 dark:hover:text-green-400"
                  onClick={() => handleEditClient(client)}
                  title="Edit Client"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 bg-card dark:bg-slate-800 shadow-md hover:shadow-lg border border-border dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => handleDeleteClient(client.id)}
                  title="Delete Client"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
              <DialogDescription>
                {editingClient
                  ? "Update the client information below."
                  : "Fill in the client details below."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    value={formData.shopName}
                    onChange={(e) =>
                      setFormData({ ...formData, shopName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Registration Number</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Additional information about this client..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? "Update Client" : "Add Client"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </Suspense>

        {/* View Client Details Dialog */}
        <Suspense fallback={null}>
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Client Details
              </DialogTitle>
              <DialogDescription>
                Complete information for {viewingClient?.name}
              </DialogDescription>
            </DialogHeader>
            
            {viewingClient && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="text-sm font-medium mt-1">{viewingClient.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Business Name</Label>
                      <p className="text-sm font-medium mt-1">{viewingClient.businessName}</p>
                    </div>
                    {viewingClient.contactPerson && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Contact Person</Label>
                        <p className="text-sm font-medium mt-1">{viewingClient.contactPerson}</p>
                      </div>
                    )}
                    {viewingClient.shopName && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Shop Name</Label>
                        <p className="text-sm font-medium mt-1">{viewingClient.shopName}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm font-medium mt-1 break-all">{viewingClient.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm font-medium mt-1">{viewingClient.phone}</p>
                    </div>
                    {viewingClient.website && (
                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Website</Label>
                        <a 
                          href={viewingClient.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium mt-1 text-blue-600 hover:underline block break-all"
                        >
                          {viewingClient.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h3>
                  <div className="pl-6">
                    <p className="text-sm">{viewingClient.address}</p>
                  </div>
                </div>

                {/* Tax ID */}
                {viewingClient.taxId && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Tax Information
                    </h3>
                    <div className="pl-6">
                      <Label className="text-xs text-muted-foreground">Tax ID / Registration Number</Label>
                      <p className="text-sm font-medium mt-1">{viewingClient.taxId}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {viewingClient.notes && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Notes
                    </h3>
                    <div className="pl-6">
                      <p className="text-sm whitespace-pre-wrap">{viewingClient.notes}</p>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Metadata</h3>
                  <div className="pl-6">
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <p className="text-sm mt-1">{new Date(viewingClient.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false)
                if (viewingClient) handleEditClient(viewingClient)
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </Suspense>

        {/* Delete Confirmation Dialog */}
        <Suspense fallback={null}>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the client
                information.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </Suspense>
      </div>
    </AuthGuard>
  )
}

