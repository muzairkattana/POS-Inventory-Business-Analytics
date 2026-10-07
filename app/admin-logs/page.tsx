"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Download,
  Trash2,
  Filter,
  RefreshCw,
  Eye,
  Undo2,
  Calendar,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Lock,
  Unlock,
  TrendingUp,
  Database,
  X,
  EyeOff,
  Share2,
  StickyNote,
  LogOut,
  LogIn,
  MousePointer,
  Camera,
} from "lucide-react"
import { activityLogger, type ActivityLog, type ActivityType } from "@/lib/activity-logger"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import PhotoCapturesViewer from "@/components/photo-captures-viewer"

export default function AdminLogsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState("")
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [showReversibleOnly, setShowReversibleOnly] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Check authentication on mount
  useEffect(() => {
    // Check if main user is authenticated
    const isMainUserAuth = localStorage.getItem('isAuthenticated') === 'true'
    const userUsername = localStorage.getItem('user-username')
    
    // If main user is logged in as admin, auto-authenticate admin logs
    if (isMainUserAuth && userUsername === 'Mushtaqkatana55@gmail.com') {
      setIsAuthenticated(true)
      return
    }
    
    // Otherwise check admin logs specific auth
    const adminAuth = localStorage.getItem('admin-logs-auth')
    const authTime = localStorage.getItem('admin-logs-auth-time')
    
    if (adminAuth === 'true' && authTime) {
      // Check if session is less than 24 hours old (increased from 1 hour)
      const timeDiff = Date.now() - parseInt(authTime)
      if (timeDiff < 86400000) { // 24 hours in milliseconds
        setIsAuthenticated(true)
      } else {
        // Session expired
        localStorage.removeItem('admin-logs-auth')
        localStorage.removeItem('admin-logs-auth-time')
      }
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadLogs()
      loadStats()
      
      // Debug: Check localStorage
      if (typeof window !== 'undefined') {
        const storedLogs = localStorage.getItem('activity-logs')
        console.log('📋 Activity Logs in localStorage:', storedLogs ? JSON.parse(storedLogs).length : 0)
      }
    }
  }, [isAuthenticated])

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    
    // Check credentials - same as login page
    if (adminEmail === "Mushtaqkatana55@gmail.com" && adminPassword === "Mushtaq1979") {
      localStorage.setItem('admin-logs-auth', 'true')
      localStorage.setItem('admin-logs-auth-time', Date.now().toString())
      setIsAuthenticated(true)
    } else {
      setAuthError("Invalid admin credentials")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin-logs-auth')
    localStorage.removeItem('admin-logs-auth-time')
    setIsAuthenticated(false)
    setAdminEmail("")
    setAdminPassword("")
  }

  // Quick filter handlers
  const handleQuickFilter = (filter: string) => {
    setSearchTerm("")
    setShowReversibleOnly(false)
    
    switch (filter) {
      case 'all':
        setTypeFilter('all')
        setDateFilter('all')
        break
      case 'today':
        setTypeFilter('all')
        setDateFilter('today')
        break
      case 'reversible':
        setTypeFilter('all')
        setDateFilter('all')
        setShowReversibleOnly(true)
        break
      case 'reversed':
        // Show only reversed logs
        setTypeFilter('all')
        setDateFilter('all')
        // We'll need to filter in the filterLogs function
        break
      case 'failed_logins':
        setTypeFilter('login_failed')
        setDateFilter('all')
        break
    }
  }

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, typeFilter, dateFilter, showReversibleOnly])

  const loadLogs = () => {
    const allLogs = activityLogger.getAllLogs()
    console.log('📊 Loaded logs:', allLogs.length)
    setLogs(allLogs)
  }

  const loadStats = () => {
    const statistics = activityLogger.getStatistics()
    setStats(statistics)
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      filtered = activityLogger.searchLogs(searchTerm)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((log) => log.type === typeFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate = new Date()

      switch (dateFilter) {
        case "today":
          startDate.setHours(0, 0, 0, 0)
          break
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((log) => new Date(log.timestamp) >= startDate)
    }

    // Reversible only filter
    if (showReversibleOnly) {
      filtered = filtered.filter((log) => log.reversible && !log.reversed)
    }

    setFilteredLogs(filtered)
  }

  const handleDeleteLog = (logId: string) => {
    if (confirm("Are you sure you want to delete this log entry?")) {
      activityLogger.deleteLog(logId)
      loadLogs()
      loadStats()
    }
  }

  const handleClearOldLogs = () => {
    if (confirm("Clear logs older than 30 days?")) {
      const deleted = activityLogger.clearOldLogs(30)
      alert(`Deleted ${deleted} old log entries`)
      loadLogs()
      loadStats()
    }
  }

  const handleClearAllLogs = () => {
    if (confirm("⚠️ WARNING: This will delete ALL activity logs. Are you sure?")) {
      activityLogger.clearAllLogs()
      loadLogs()
      loadStats()
    }
  }

  const handleExportJSON = () => {
    const data = activityLogger.exportLogs()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity-logs-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const data = activityLogger.exportLogsAsCSV()
    const blob = new Blob([data], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleUndo = (log: ActivityLog) => {
    if (!log.reversible || log.reversed) return

    if (confirm(`Undo action: ${log.action}?`)) {
      // Handle undo based on type
      switch (log.type) {
        case "invoice_deleted":
          // Restore deleted invoice
          const invoices = JSON.parse(localStorage.getItem("saved-invoices") || "[]")
          invoices.push(log.reverseData)
          localStorage.setItem("saved-invoices", JSON.stringify(invoices))
          activityLogger.markAsReversed(log.id)
          alert("Invoice restored successfully!")
          break

        case "payment_updated":
          // Revert payment amount
          const allInvoices = JSON.parse(localStorage.getItem("saved-invoices") || "[]")
          const invoice = allInvoices.find((inv: any) => inv.invoiceNumber === log.reverseData.invoiceNumber)
          if (invoice) {
            invoice.paidAmount = log.reverseData.amount
            localStorage.setItem("saved-invoices", JSON.stringify(allInvoices))
            activityLogger.markAsReversed(log.id)
            alert("Payment reverted successfully!")
          }
          break

        default:
          alert("Undo not implemented for this action type yet")
      }

      loadLogs()
      loadStats()
    }
  }

  const getTypeIcon = (type: ActivityType) => {
    switch (type) {
      case "invoice_created":
      case "invoice_edited":
      case "invoice_deleted":
        return <FileText className="w-4 h-4" />
      case "invoice_viewed":
        return <Eye className="w-4 h-4" />
      case "invoice_shared":
        return <Share2 className="w-4 h-4" />
      case "login_success":
        return <LogIn className="w-4 h-4" />
      case "login_failed":
        return <XCircle className="w-4 h-4" />
      case "logout":
        return <LogOut className="w-4 h-4" />
      case "payment_updated":
        return <TrendingUp className="w-4 h-4" />
      case "note_added":
      case "note_edited":
      case "note_deleted":
        return <StickyNote className="w-4 h-4" />
      case "page_visit":
      case "page_leave":
        return <MousePointer className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: ActivityType) => {
    if (type.includes("delete")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (type.includes("create")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (type.includes("edit")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (type.includes("failed")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (type.includes("success")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (type.includes("viewed")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (type.includes("shared")) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
    if (type.includes("logout")) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    if (type.includes("page")) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
    if (type.includes("note")) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen login-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Authentication</CardTitle>
            <CardDescription>
              Enter admin credentials to access activity logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Admin Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {authError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                </div>
              )}
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                <Lock className="w-4 h-4 mr-2" />
                Access Admin Logs
              </Button>
              <Link href="/">
                <Button type="button" variant="outline" className="w-full mt-2">
                  <X className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-violet-900 to-purple-900 text-white p-3 sm:p-4 md:p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Admin Activity Logs</h1>
                <p className="text-purple-200 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">
                  Comprehensive system activity monitoring and management
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <Unlock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Logout</span>
              </Button>
              <Link href="/" className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full text-xs sm:text-sm">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Close</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => handleQuickFilter('all')}
            className="bg-card p-2 sm:p-3 md:p-4 rounded-lg border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-left"
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-2 md:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">Total Logs</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.total || 0}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickFilter('today')}
            className="bg-card p-2 sm:p-3 md:p-4 rounded-lg border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-left"
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-2 md:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">Today</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.today || 0}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickFilter('reversible')}
            className="bg-card p-2 sm:p-3 md:p-4 rounded-lg border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-left"
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-2 md:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">Reversible</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.reversible || 0}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickFilter('reversed')}
            className="bg-card p-2 sm:p-3 md:p-4 rounded-lg border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-left"
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-2 md:gap-3">
              <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Undo2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">Reversed</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.reversed || 0}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleQuickFilter('failed_logins')}
            className="bg-card p-2 sm:p-3 md:p-4 rounded-lg border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-left"
          >
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1 sm:gap-2 md:gap-3">
              <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Failed Logins</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.byType?.login_failed || 0}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 items-stretch sm:items-center">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 sm:w-4 sm:h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm w-full sm:w-auto"
            >
              <option value="all">All Types</option>
              <optgroup label="Invoices">
                <option value="invoice_created">Invoice Created</option>
                <option value="invoice_edited">Invoice Edited</option>
                <option value="invoice_deleted">Invoice Deleted</option>
                <option value="invoice_viewed">Invoice Viewed</option>
                <option value="invoice_shared">Invoice Shared</option>
                <option value="payment_updated">Payment Updated</option>
              </optgroup>
              <optgroup label="Authentication">
                <option value="login_success">Login Success</option>
                <option value="login_failed">Login Failed</option>
                <option value="logout">User Logout</option>
              </optgroup>
              <optgroup label="Navigation">
                <option value="page_visit">Page Visits</option>
                <option value="page_leave">Page Leaves</option>
              </optgroup>
              <optgroup label="Notes">
                <option value="note_added">Notes Opened</option>
                <option value="note_edited">Notes Edited</option>
                <option value="note_deleted">Notes Deleted</option>
              </optgroup>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-input bg-background rounded-md text-xs sm:text-sm w-full sm:w-auto"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <Button
              variant={showReversibleOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowReversibleOnly(!showReversibleOnly)}
              className="w-full sm:w-auto text-xs sm:text-sm h-9"
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Reversible Only</span>
              <span className="xs:hidden">Reversible</span>
            </Button>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto sm:ml-auto">
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="flex-1 sm:flex-none h-9 text-xs sm:text-sm">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex-1 sm:flex-none h-9 text-xs sm:text-sm">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearOldLogs} className="flex-1 sm:flex-none h-9 text-xs sm:text-sm">
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden lg:inline">Clear Old</span>
                <span className="lg:hidden">Clear</span>
              </Button>
              <Button variant="outline" size="sm" onClick={loadLogs} className="flex-1 sm:flex-none text-blue-600 h-9 text-xs sm:text-sm">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Timestamp</th>
                  <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Type</th>
                  <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Action</th>
                  <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Description</th>
                  <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Status</th>
                  <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No logs found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => (
                    <tr key={log.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <div>
                            <div className="text-xs sm:text-sm">{new Date(log.timestamp).toLocaleDateString()}</div>
                            <div className="text-[10px] sm:text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 whitespace-nowrap">
                        <Badge className={`${getTypeColor(log.type)} border-0 flex items-center gap-1 w-fit text-[10px] sm:text-xs`}>
                          {getTypeIcon(log.type)}
                          <span>{log.type.replace(/_/g, " ")}</span>
                        </Badge>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 font-medium text-xs sm:text-sm whitespace-nowrap">{log.action}</td>
                      <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm text-muted-foreground max-w-xs">
                        <div className="truncate" title={log.description}>{log.description}</div>
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 whitespace-nowrap">
                        {log.reversed ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] sm:text-xs">
                            <Undo2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            <span>Reversed</span>
                          </Badge>
                        ) : log.reversible ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] sm:text-xs">
                            <Unlock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            <span>Reversible</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px] sm:text-xs">
                            <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            <span>Permanent</span>
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 sm:p-3 md:p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              setSelectedLog(log)
                              setShowDetails(true)
                            }}
                            title="View Details"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          {log.reversible && !log.reversed && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-orange-600 hover:text-orange-800"
                              onClick={() => handleUndo(log)}
                              title="Undo Action"
                            >
                              <Undo2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteLog(log.id)}
                            title="Delete Log"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {/* Security Photos Section */}
        <div className="mt-4 sm:mt-6 bg-card rounded-lg border shadow-sm p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Security Photos</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                View captured photos from login and logout events
              </p>
            </div>
          </div>
          <PhotoCapturesViewer />
        </div>

        {/* Danger Zone */}
        <div className="mt-4 sm:mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            <h3 className="text-base sm:text-lg font-bold text-red-900 dark:text-red-200">Danger Zone</h3>
          </div>
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mb-3 sm:mb-4">
            Permanent actions that cannot be undone. Use with extreme caution.
          </p>
          <Button variant="destructive" onClick={handleClearAllLogs} className="w-full sm:w-auto text-sm">
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Clear All Activity Logs
          </Button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
          <div
            className="fixed inset-2 sm:inset-4 bg-background border rounded-lg shadow-lg overflow-hidden max-w-3xl mx-auto my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full max-h-[90vh] sm:max-h-[80vh]">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-purple-900 to-violet-900">
                <h2 className="text-lg sm:text-xl font-bold text-white">Log Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetails(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">ID</p>
                      <p className="font-mono text-xs sm:text-sm break-all">{selectedLog.id}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Timestamp</p>
                      <p className="font-semibold text-xs sm:text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Type</p>
                      <Badge className={`${getTypeColor(selectedLog.type)} text-xs`}>{selectedLog.type}</Badge>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">Action</p>
                      <p className="font-semibold text-xs sm:text-sm">{selectedLog.action}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-foreground">{selectedLog.description}</p>
                  </div>

                  {selectedLog.userName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">User</p>
                      <p className="font-semibold flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {selectedLog.userName}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <div className="flex gap-2">
                      {selectedLog.reversed ? (
                        <Badge className="bg-orange-100 text-orange-700">Reversed</Badge>
                      ) : selectedLog.reversible ? (
                        <Badge className="bg-green-100 text-green-700">Reversible</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">Permanent</Badge>
                      )}
                    </div>
                  </div>

                  {selectedLog.details && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Details</p>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-60">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.userAgent && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">User Agent</p>
                      <p className="text-xs font-mono">{selectedLog.userAgent}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

