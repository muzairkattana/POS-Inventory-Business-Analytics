"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, 
  Shield, 
  Activity, 
  Database, 
  RefreshCw, 
  Trash2, 
  Download, 
  Upload, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  Users,
  FileText,
  Monitor,
  Zap,
  Globe,
  Key,
  Eye,
  EyeOff,
  ArrowLeft,
  RotateCcw
} from "lucide-react"
import Link from "next/link"
import { useFeatureFlags, featureFlagsManager } from "@/lib/feature-flags"
import type { FeatureFlags } from "@/lib/feature-flags"

export default function AdminPage() {
  const router = useRouter()
  const { flags, updateFlags, resetFlags, isEnabled } = useFeatureFlags()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [systemStats, setSystemStats] = useState({
    invoiceCount: 0,
    storageUsed: "0 KB",
    lastBackup: "Never",
    uptime: "0 minutes",
    activeUsers: 1,
    errorCount: 0
  })

  // Admin authentication
  const ADMIN_KEY = "uzairaistudioadmin2025"

  useEffect(() => {
    // Check if already authenticated
    const storedAuth = sessionStorage.getItem("admin-authenticated")
    if (storedAuth === "true") {
      setIsAuthenticated(true)
      loadSystemStats()
    }
  }, [])

  const handleAuthentication = () => {
    if (adminKey === ADMIN_KEY) {
      setIsAuthenticated(true)
      sessionStorage.setItem("admin-authenticated", "true")
      loadSystemStats()
    } else {
      alert("Invalid admin key!")
    }
  }

  const loadSystemStats = () => {
    try {
      // Load invoices count
      const savedInvoices = localStorage.getItem("saved-invoices")
      const invoiceCount = savedInvoices ? JSON.parse(savedInvoices).length : 0

      // Calculate storage usage
      let storageUsed = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          storageUsed += localStorage.getItem(key)?.length || 0
        }
      }
      
      const storageKB = (storageUsed / 1024).toFixed(2)

      // Get last backup timestamp
      const lastBackup = localStorage.getItem("last-backup") || "Never"

      setSystemStats({
        invoiceCount,
        storageUsed: `${storageKB} KB`,
        lastBackup: lastBackup === "Never" ? "Never" : new Date(lastBackup).toLocaleString(),
        uptime: `${Math.floor(performance.now() / 60000)} minutes`,
        activeUsers: 1,
        errorCount: 0
      })
    } catch (error) {
      console.error("Error loading system stats:", error)
    }
  }

  const handleFlagToggle = (flagKey: keyof FeatureFlags, value: boolean) => {
    updateFlags({ [flagKey]: value })
  }

  const handleExportData = () => {
    try {
      const data = {
        invoices: JSON.parse(localStorage.getItem("saved-invoices") || "[]"),
        settings: JSON.parse(localStorage.getItem("app-settings") || "{}"),
        featureFlags: JSON.parse(localStorage.getItem("app-feature-flags") || "{}"),
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `biocure-healthcare-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      localStorage.setItem("last-backup", new Date().toISOString())
      loadSystemStats()

      alert("Data exported successfully!")
    } catch (error) {
      console.error("Export error:", error)
      alert("Error exporting data!")
    }
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (confirm("This will overwrite existing data. Continue?")) {
          if (data.invoices) localStorage.setItem("saved-invoices", JSON.stringify(data.invoices))
          if (data.settings) localStorage.setItem("app-settings", JSON.stringify(data.settings))
          if (data.featureFlags) localStorage.setItem("app-feature-flags", JSON.stringify(data.featureFlags))
          
          loadSystemStats()
          alert("Data imported successfully! Please refresh the page.")
          window.location.reload()
        }
      } catch (error) {
        console.error("Import error:", error)
        alert("Error importing data! Please check the file format.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }

  const handleClearAllData = () => {
    if (confirm("Are you sure you want to clear ALL application data? This cannot be undone!")) {
      if (confirm("This will delete all invoices, settings, and feature flags. Are you absolutely sure?")) {
        localStorage.clear()
        sessionStorage.clear()
        alert("All data cleared! Redirecting to home page...")
        router.push("/")
      }
    }
  }

  const handleClearInvoices = () => {
    if (confirm("Are you sure you want to delete all invoices?")) {
      localStorage.removeItem("saved-invoices")
      loadSystemStats()
      alert("All invoices deleted!")
    }
  }

  const handleResetFlags = () => {
    if (confirm("Reset all feature flags to default values?")) {
      resetFlags()
      alert("Feature flags reset to defaults!")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>
              Enter the admin key to access system controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminKey">Admin Key</Label>
              <div className="relative">
                <Input
                  id="adminKey"
                  type={showKey ? "text" : "password"}
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  onKeyPress={(e) => e.key === "Enter" && handleAuthentication()}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleAuthentication} className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Access Admin Panel
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const flagCategories = featureFlagsManager.getFlagCategories()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </Link>
              <div className="h-6 border-l border-gray-300" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">BioCure Health Care System Control</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                System Online
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  sessionStorage.removeItem("admin-authenticated")
                  setIsAuthenticated(false)
                }}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{systemStats.invoiceCount}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                  <p className="text-2xl font-bold">{systemStats.storageUsed}</p>
                </div>
                <Database className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                  <p className="text-2xl font-bold">{systemStats.uptime}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{systemStats.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Feature Flags
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Maintenance
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Feature Flags Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Feature Flag Control Panel
                </CardTitle>
                <CardDescription>
                  Enable or disable application features in real-time. Changes are applied immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {flagCategories.map((category) => (
                    <div key={category.name} className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.flags.map((flag) => (
                          <div key={flag.key} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="space-y-1">
                              <Label htmlFor={flag.key} className="font-medium">
                                {flag.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {flag.description}
                              </p>
                            </div>
                            <Switch
                              id={flag.key}
                              checked={isEnabled(flag.key as keyof FeatureFlags)}
                              onCheckedChange={(checked) => handleFlagToggle(flag.key as keyof FeatureFlags, checked)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <Button onClick={handleResetFlags} variant="outline" className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Reset All to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Application Settings
                  </CardTitle>
                  <CardDescription>
                    Core application configuration and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Application Name</Label>
                    <Input defaultValue="BioCure Health Care Invoice System" />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input defaultValue="Rs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-save Interval (seconds)</Label>
                    <Input type="number" defaultValue="2" />
                  </div>
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    System Information
                  </CardTitle>
                  <CardDescription>
                    Current system status and information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Version:</span>
                      <span className="ml-2">v2.0.0</span>
                    </div>
                    <div>
                      <span className="font-medium">Environment:</span>
                      <span className="ml-2">Production</span>
                    </div>
                    <div>
                      <span className="font-medium">Last Backup:</span>
                      <span className="ml-2">{systemStats.lastBackup}</span>
                    </div>
                    <div>
                      <span className="font-medium">Browser:</span>
                      <span className="ml-2">{navigator.userAgent.split(' ')[0]}</span>
                    </div>
                  </div>
                  <Button onClick={loadSystemStats} variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Stats
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Export, import, and manage application data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleExportData} className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>
                  <div>
                    <Label htmlFor="import-data">Import Data</Label>
                    <Input
                      id="import-data"
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Destructive actions that cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleClearInvoices} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Invoices
                  </Button>
                  <Button 
                    onClick={handleClearAllData} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Application Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>
                    Real-time system monitoring and health checks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span>Application Status</span>
                      </div>
                      <Badge variant="default" className="bg-green-600">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <span>Local Storage</span>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-green-600" />
                        <span>Network Status</span>
                      </div>
                      <Badge variant="default" className="bg-green-600">Online</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common administrative tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open("/", "_blank")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open Invoice App
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={loadSystemStats}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh System Stats
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => console.log("Feature flags:", flags)}
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Log Current Config
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
