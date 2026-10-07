"use client"

import { useState, useEffect, lazy, Suspense, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Settings, 
  Calculator, 
  Printer, 
  Share2, 
  Download, 
  Bell,
  Smartphone,
  Wifi,
  ChevronRight,
  ArrowLeft,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  Users,
  BarChart3,
  Clock,
  Database,
  Mail,
  Lightbulb,
  Rocket,
  Phone,
  MapPin,
  Edit,
  Hash,
  User,
  StickyNote,
  Keyboard,
  MousePointer,
  Command,
  Save,
  Copy,
  Search,
  Trash2,
  Eye,
  Plus,
  LogOut,
  Menu,
  RefreshCw,
  ArrowUp
} from "lucide-react"
import Link from "next/link"
import AuthGuard from "@/components/auth-guard"
import PWAInstallButton from "@/components/pwa-install-button"
import { useI18n } from "@/components/i18n-provider"

// Lazy load Accordion for better initial load
const Accordion = lazy(() => import("@/components/ui/accordion").then(mod => ({ default: mod.Accordion })))
const AccordionContent = lazy(() => import("@/components/ui/accordion").then(mod => ({ default: mod.AccordionContent })))
const AccordionItem = lazy(() => import("@/components/ui/accordion").then(mod => ({ default: mod.AccordionItem })))
const AccordionTrigger = lazy(() => import("@/components/ui/accordion").then(mod => ({ default: mod.AccordionTrigger })))

export default function HelpPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState("getting-started")
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedCode, setCopiedCode] = useState("")
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [showTop, setShowTop] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const inEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable)
      if (!inEditable && e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleStepComplete = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter(s => s !== step))
    } else {
      setCompletedSteps([...completedSteps, step])
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(""), 2000)
  }

  const progressPercentage = (completedSteps.length / 4) * 100

  const searchIndex: { id: string; title: string; tab: string; keywords: string[] }[] = [
    // Getting Started
    { id: 'getting-started-card', title: 'Quick Start Guide', tab: 'getting-started', keywords: ['login','invoice','print','share','manage','quick start','guide'] },
    // Invoices
    { id: 'invoices-create', title: 'Creating a New Invoice', tab: 'invoices', keywords: ['create invoice','items','quantity','price','tax','discount'] },
    { id: 'invoices-edit', title: 'Editing an Invoice', tab: 'invoices', keywords: ['edit','update','auto-save'] },
    { id: 'invoices-print', title: 'Printing & Sharing', tab: 'invoices', keywords: ['print','pdf','share','whatsapp','export'] },
    { id: 'invoices-manage', title: 'Managing Multiple Invoices', tab: 'invoices', keywords: ['search','filter','bulk','payment tracking'] },
    // Shortcuts
    { id: 'shortcuts-navigation', title: 'Keyboard Shortcuts - Navigation', tab: 'shortcuts', keywords: ['alt+h','navigate','home','invoices','clients','settings'] },
    { id: 'shortcuts-actions', title: 'Keyboard Shortcuts - Actions', tab: 'shortcuts', keywords: ['save','print','new invoice','calculator'] },
    { id: 'shortcuts-editing', title: 'Keyboard Shortcuts - Editing', tab: 'shortcuts', keywords: ['add item','delete','copy','search'] },
    { id: 'shortcuts-general', title: 'Keyboard Shortcuts - General', tab: 'shortcuts', keywords: ['help','refresh','sidebar','logout'] },
    // Features
    { id: 'features-calculator', title: 'Built-in Calculator', tab: 'features', keywords: ['calculator','history'] },
    { id: 'features-offline', title: 'Offline Mode', tab: 'features', keywords: ['offline','no internet','local'] },
    { id: 'features-analytics', title: 'Analytics Dashboard', tab: 'features', keywords: ['analytics','charts','trends'] },
    { id: 'features-reminders', title: 'Payment Reminders', tab: 'features', keywords: ['reminders','overdue','whatsapp'] },
    { id: 'features-export', title: 'Export & Import', tab: 'features', keywords: ['export','import','backup','csv','json'] },
    { id: 'features-pwa', title: 'Install as App', tab: 'features', keywords: ['pwa','install','add to home screen','app'] },
    // Settings
    { id: 'settings-company', title: 'Company Settings', tab: 'settings', keywords: ['company','address','phone','email'] },
    { id: 'settings-invoice', title: 'Invoice Settings', tab: 'settings', keywords: ['tax','payment terms','prefix','number','footer'] },
    { id: 'settings-preferences', title: 'User Preferences', tab: 'settings', keywords: ['theme','currency','date','autosave','notifications'] },
    { id: 'settings-storage', title: 'Storage & Backup', tab: 'settings', keywords: ['backup','export','import','storage','clear data'] },
    { id: 'settings-security', title: 'Security Settings', tab: 'settings', keywords: ['session','password','encryption','offline'] },
    // FAQ
    { id: 'faq-offline', title: 'Does the app work offline?', tab: 'faq', keywords: ['offline','pwa'] },
    { id: 'faq-save', title: 'How is my data saved?', tab: 'faq', keywords: ['localStorage','indexeddb','autosave'] },
    { id: 'faq-print', title: "Why doesn't my invoice fit on one page?", tab: 'faq', keywords: ['print','a4','fit'] },
    { id: 'faq-delete', title: 'Can I recover deleted invoices?', tab: 'faq', keywords: ['delete','recover','backup'] },
    { id: 'faq-devices', title: 'Can I use the app on multiple devices?', tab: 'faq', keywords: ['devices','transfer','import','export'] },
    { id: 'faq-mobile', title: 'How do I install the app on mobile?', tab: 'faq', keywords: ['android','ios','install'] },
    { id: 'faq-calculations', title: 'How are invoice totals calculated?', tab: 'faq', keywords: ['formula','tax','discount','total'] },
    { id: 'faq-support', title: 'How do I get support?', tab: 'faq', keywords: ['support','email','phone','whatsapp'] },
  ]

  const searchResults = searchQuery.trim().length >= 2 
    ? searchIndex.filter(s => 
        (s.title + ' ' + s.keywords.join(' '))
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const goTo = (tab: string, id: string) => {
    setActiveTab(tab)
    setTimeout(() => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Clean Header */}
        <div className="border-b" style={{ backgroundColor: "rgb(228,209,222)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 lg:gap-6">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 w-full sm:w-auto">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                  <img src="/images/biocure-health-care-logo.jpg" alt="Biocure Healthcare Logo" className="h-8 sm:h-10 lg:h-12 w-auto" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                    {t('help.title')}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 truncate">{t('help.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <Input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search help... (Press / to focus)"
                    className="pl-8 w-full sm:w-64 lg:w-80"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setSearchQuery('')
                    }}
                  />
                </div>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="h-9 sm:h-10 lg:h-11 text-sm sm:text-base">
                  <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  {t('help.buttons.print')}
                </Button>
                <Link href="/" className="w-auto">
                  <Button variant="outline" size="sm" className="h-9 sm:h-10 lg:h-11 text-sm sm:text-base">
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {t('nav.back')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {/* Inline search suggestions */}
          {searchResults.length > 0 && (
            <div className="mb-3 sm:mb-4 lg:mb-5 bg-white dark:bg-gray-800 border rounded-lg p-2 sm:p-3">
              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Search results</div>
              <div className="flex flex-wrap gap-2">
                {searchResults.map(r => (
                  <Button key={r.id} variant="secondary" size="sm" className="text-xs" onClick={() => goTo(r.tab, r.id)}>
                    <ChevronRight className="w-3 h-3 mr-1" />{r.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-5 lg:space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-1.5 lg:gap-2 bg-white dark:bg-gray-800 p-0.5 sm:p-0.5 lg:p-1 rounded-md sm:rounded-lg overflow-x-auto">
              <TabsTrigger value="getting-started" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs lg:text-sm">Quick Start</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs lg:text-sm">Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="shortcuts" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                <Keyboard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs lg:text-sm">Shortcuts</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs lg:text-sm">Features</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs lg:text-sm">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm">
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs lg:text-sm">FAQ</span>
              </TabsTrigger>
            </TabsList>

            {/* Getting Started Tab */}
            <TabsContent value="getting-started" className="space-y-4 sm:space-y-5 lg:space-y-6">
              <Card id="getting-started-card">
                <CardHeader className="p-4 sm:p-5 lg:p-6">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl lg:text-2xl">
                    <Rocket className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 flex-shrink-0" />
                    <span>Quick Start Guide</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Get started in 4 simple steps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-3.5 lg:space-y-4 p-4 sm:p-5 lg:p-6">
                  <div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-3.5 lg:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">1</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 lg:mb-2">Login to Your Account</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                          Access the app using your credentials. Works online and offline.
                        </p>
                        <div className="bg-white dark:bg-gray-800 p-2 sm:p-2.5 lg:p-3 rounded border border-blue-200">
                          <p className="text-xs sm:text-sm text-muted-foreground">Navigate to <span className="font-mono bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-[10px] sm:text-xs">/login</span> to access the application.</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-1.5 lg:mt-2">Contact administrator for credentials if needed.</p>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-3.5 lg:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">2</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 lg:mb-2">Create Your First Invoice</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                          Fill in details, add items - calculations happen automatically.
                        </p>
                        <ul className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground">
                          <li>• Enter invoice number and date</li>
                          <li>• Add client information</li>
                          <li>• Add items with quantity and price</li>
                          <li>• Auto-save keeps your work safe</li>
                        </ul>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-3.5 lg:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">3</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 lg:mb-2">Print or Share</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                          Print (A4 optimized) or share via WhatsApp.
                        </p>
                        <div className="flex gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-xs">
                          <Badge variant="outline" className="font-normal text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                            <Printer className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            Print
                          </Badge>
                          <Badge variant="outline" className="font-normal text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                            <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            Share
                          </Badge>
                          <Badge variant="outline" className="font-normal text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                            <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                            Download
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-3.5 lg:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm">4</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 lg:mb-2">Manage All Invoices</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
                          View, search, and manage all invoices from one place.
                        </p>
                        <Link href="/invoices">
                          <Button size="sm" className="mt-1 sm:mt-1.5 lg:mt-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            View All Invoices
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-3.5 lg:p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 text-xs sm:text-sm">
                      <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                      Pro Tips
                    </h3>
                    <ul className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground">
                      <li>• Auto-save every 5 seconds</li>
                      <li>• Works 100% offline</li>
                      <li>• Built-in calculator available</li>
                      <li>• Install as app for faster access</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Working with Invoices
                  </CardTitle>
                  <CardDescription>Complete guide to creating and managing invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="create" id="invoices-create">
                      <AccordionTrigger className="text-lg font-semibold">
                        Creating a New Invoice
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold">Invoice Details</h4>
                          <ul className="space-y-2 ml-4">
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-blue-600 mt-1" />
                              <div>
                                <strong>Invoice Number:</strong> Automatically generated or enter custom number
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-blue-600 mt-1" />
                              <div>
                                <strong>Invoice Date:</strong> Defaults to today, can be changed
                              </div>
                            </li>
                            <li className="flex items-start gap-2">
                              <ChevronRight className="w-4 h-4 text-blue-600 mt-1" />
                              <div>
                                <strong>Due Date:</strong> Optional - set payment deadline
                              </div>
                            </li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold">Client Information</h4>
                          <p className="text-sm text-muted-foreground">Fill in your client's details:</p>
                          <ul className="space-y-1 ml-4 text-sm">
                            <li>• Client Name (required)</li>
                            <li>• Address</li>
                            <li>• City</li>
                            <li>• Phone Number</li>
                            <li>• Email Address</li>
                          </ul>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold">Adding Items</h4>
                          <ol className="space-y-2 ml-4 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-blue-600">1.</span>
                              <span>Click "Add Item" button to add a new row</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-blue-600">2.</span>
                              <span>Enter item description</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-blue-600">3.</span>
                              <span>Enter quantity and unit price</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-blue-600">4.</span>
                              <span>Add tax percentage (optional)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-blue-600">5.</span>
                              <span>Add discount percentage (optional)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-blue-600">6.</span>
                              <span>Total is calculated automatically</span>
                            </li>
                          </ol>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Calculator className="w-4 h-4 text-blue-600" />
                            Automatic Calculations
                          </h4>
                          <p className="text-sm">
                            The app automatically calculates subtotals, discounts, taxes, and grand total as you type. No manual calculation needed!
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="edit" id="invoices-edit">
                      <AccordionTrigger className="text-lg font-semibold">
                        Editing an Invoice
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <p>To edit an existing invoice:</p>
                        <ol className="space-y-2 ml-4">
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">1.</span>
                            <span>Go to "All Invoices" page</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">2.</span>
                            <span>Find the invoice you want to edit</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">3.</span>
                            <span>Click the "Edit" button (pencil icon)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">4.</span>
                            <span>Make your changes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-bold text-purple-600">5.</span>
                            <span>Changes are automatically saved</span>
                          </li>
                        </ol>

                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            Auto-Save Feature
                          </h4>
                          <p className="text-sm">
                            Your changes are automatically saved every 5 seconds. You'll see an "Unsaved" badge if there are pending changes.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="print" id="invoices-print">
                      <AccordionTrigger className="text-lg font-semibold">
                        Printing & Sharing
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Printing Options</h4>
                            <ul className="space-y-2 ml-4 text-sm">
                              <li className="flex items-start gap-2">
                                <Printer className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <strong>Print to Paper:</strong> Optimized for A4 size, fits perfectly on one page
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Download className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <strong>Save as PDF:</strong> Use your browser's print dialog to save as PDF
                                </div>
                              </li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Sharing Options</h4>
                            <ul className="space-y-2 ml-4 text-sm">
                              <li className="flex items-start gap-2">
                                <Share2 className="w-4 h-4 text-green-600 mt-0.5" />
                                <div>
                                  <strong>WhatsApp:</strong> Share invoice details via WhatsApp message
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <Download className="w-4 h-4 text-green-600 mt-0.5" />
                                <div>
                                  <strong>Export:</strong> Download invoice data as CSV or JSON
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="manage" id="invoices-manage">
                      <AccordionTrigger className="text-lg font-semibold">
                        Managing Multiple Invoices
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Search & Filter</h4>
                            <ul className="space-y-2 ml-4 text-sm">
                              <li>• Search by invoice number or client name</li>
                              <li>• Filter by status (Draft, Pending, Paid, Partially Paid, Overdue)</li>
                              <li>• Sort by date, amount, or status</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Bulk Operations</h4>
                            <ul className="space-y-2 ml-4 text-sm">
                              <li>• Select multiple invoices using checkboxes</li>
                              <li>• Export selected invoices to CSV</li>
                              <li>• Delete multiple invoices at once</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Payment Tracking</h4>
                            <p className="text-sm mb-2">Track payments directly from the All Invoices page:</p>
                            <ul className="space-y-2 ml-4 text-sm">
                              <li>• Enter paid amount in the "Paid" column</li>
                              <li>• Status updates automatically</li>
                              <li>• View pending amount at a glance</li>
                              <li>• Track payment history</li>
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shortcuts Tab */}
            <TabsContent value="shortcuts" className="space-y-6">
              {/* Keyboard Shortcuts Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-6 h-6 text-blue-600" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <CardDescription>Speed up your workflow with these shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Navigation Shortcuts */}
                    <div className="space-y-4" id="shortcuts-navigation">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Command className="w-5 h-5 text-blue-600" />
                        Navigation
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Go to Home</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Alt + H</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">View All Invoices</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Alt + I</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Clients Page</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Alt + C</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Settings</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Alt + S</kbd>
                        </div>
                      </div>
                    </div>

                    {/* Actions Shortcuts */}
                    <div className="space-y-4" id="shortcuts-actions">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        Actions
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Save Invoice</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + S</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Print Invoice</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + P</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">New Invoice</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + N</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Open Calculator</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + K</kbd>
                        </div>
                      </div>
                    </div>

                    {/* Editing Shortcuts */}
                    <div className="space-y-4" id="shortcuts-editing">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Edit className="w-5 h-5 text-purple-600" />
                        Editing
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Add Item Row</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + +</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Delete Item</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + Del</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Copy Item</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + C</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Search/Find</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + F</kbd>
                        </div>
                      </div>
                    </div>

                    {/* General Shortcuts */}
                    <div className="space-y-4" id="shortcuts-general">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        General
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Open Help</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">F1</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Refresh Page</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">F5</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Toggle Sidebar</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + B</kbd>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm">Logout</span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-sm">Ctrl + Q</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Workflow Diagram */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="w-6 h-6 text-purple-600" />
                    Invoice Creation Workflow
                  </CardTitle>
                  <CardDescription>Visual guide to creating an invoice</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Flow Diagram */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
                      <div className="grid gap-4">
                        {/* Step 1 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold">Start New Invoice</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">Click "New Invoice" or press Ctrl+N</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>

                        {/* Step 2 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-green-600" />
                              <h4 className="font-semibold">Add Client Info</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">Enter client name, address, phone, email</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>

                        {/* Step 3 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Plus className="w-4 h-4 text-orange-600" />
                              <h4 className="font-semibold">Add Items</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">Add products/services with quantity, price, tax, discount</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>

                        {/* Step 4 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Calculator className="w-4 h-4 text-purple-600" />
                              <h4 className="font-semibold">Review Totals</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">Automatic calculation of subtotal, tax, discount, total</p>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>

                        {/* Step 5 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Save className="w-4 h-4 text-pink-600" />
                              <h4 className="font-semibold">Save & Export</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">Save (Ctrl+S), Print (Ctrl+P), or Share via WhatsApp</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tips for Workflow */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Workflow Tips
                      </h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>Use Tab key to quickly move between fields</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>Auto-save runs every 5 seconds - your work is always protected</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>Calculator button (bottom-right) for quick calculations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                          <span>All features work offline - no internet required</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* App Navigation Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-green-600" />
                    App Navigation Map
                  </CardTitle>
                  <CardDescription>Quick reference to all pages and features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Home/Invoice Page */}
                    <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold">Home / Invoice</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Create new invoices</li>
                        <li>• Edit invoice details</li>
                        <li>• Add/remove items</li>
                        <li>• Print & share</li>
                        <li>• Auto-save feature</li>
                      </ul>
                    </div>

                    {/* All Invoices */}
                    <div className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold">All Invoices</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• View all invoices</li>
                        <li>• Search & filter</li>
                        <li>• Track payments</li>
                        <li>• Bulk operations</li>
                        <li>• Export data</li>
                      </ul>
                    </div>

                    {/* Clients */}
                    <div className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold">Clients</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Manage clients</li>
                        <li>• Add client details</li>
                        <li>• View client history</li>
                        <li>• Edit information</li>
                        <li>• Delete clients</li>
                      </ul>
                    </div>

                    {/* Reports */}
                    <div className="p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold">Reports</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Revenue analytics</li>
                        <li>• Payment tracking</li>
                        <li>• Client insights</li>
                        <li>• Monthly trends</li>
                        <li>• Export reports</li>
                      </ul>
                    </div>

                    {/* Settings */}
                    <div className="p-4 border-2 border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings className="w-5 h-5 text-gray-600" />
                        <h4 className="font-semibold">Settings</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Company info</li>
                        <li>• Invoice defaults</li>
                        <li>• Theme settings</li>
                        <li>• Backup & restore</li>
                        <li>• Security options</li>
                      </ul>
                    </div>

                    {/* Help */}
                    <div className="p-4 border-2 border-pink-200 dark:border-pink-800 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <HelpCircle className="w-5 h-5 text-pink-600" />
                        <h4 className="font-semibold">Help</h4>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Quick start guide</li>
                        <li>• Keyboard shortcuts</li>
                        <li>• Feature overview</li>
                        <li>• FAQs</li>
                        <li>• Contact support</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Calculator */}
                <Card id="features-calculator">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      Built-in Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Access a full-featured calculator while creating invoices.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Click the calculator button (bottom-right)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Desktop: Opens as right-side panel
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Mobile: Opens as popup
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        View calculation history
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Offline Mode */}
                <Card id="features-offline">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-green-600" />
                      Offline Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Work without internet connection - all features available offline.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Create and edit invoices offline
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Print invoices without internet
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Data saved locally on your device
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Syncs when back online
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Analytics */}
                <Card id="features-analytics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      View detailed insights about your invoices and payments.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Total revenue and outstanding amounts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Monthly trends and charts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Top clients by revenue
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Payment status breakdown
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Payment Reminders */}
                <Card id="features-reminders">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-orange-600" />
                      Payment Reminders
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Automated reminders for pending and overdue invoices.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Set custom reminder schedules
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Send reminders via WhatsApp
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Track reminder history
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Automatic overdue notifications
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Export/Import */}
                <Card id="features-export">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Export & Import
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Backup and transfer your invoice data easily.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Export to CSV (Excel compatible)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Export to JSON (full backup)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Import invoices from CSV/JSON
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Bulk export selected invoices
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* PWA Install */}
                <Card id="features-pwa">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      Install as App
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Install on your device for app-like experience.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Works on desktop and mobile
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Faster loading times
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Add to home screen
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Works offline after install
                      </li>
                    </ul>
                    <div className="pt-2">
                      <PWAInstallButton variant="outline" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-6 h-6 text-gray-600" />
                    App Settings
                  </CardTitle>
                  <CardDescription>Customize the app to your preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="company" id="settings-company">
                      <AccordionTrigger>Company Settings</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Update your company information that appears on invoices:</p>
                        <ul className="space-y-2 ml-4 text-sm">
                          <li>• Company Name</li>
                          <li>• Owner Name</li>
                          <li>• Company Address</li>
                          <li>• Primary and Secondary Phone Numbers</li>
                          <li>• Email Address</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-3">
                          These details will automatically appear on all new invoices.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="invoice" id="settings-invoice">
                      <AccordionTrigger>Invoice Settings</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Configure default invoice behavior:</p>
                        <ul className="space-y-2 ml-4 text-sm">
                          <li>• Default Tax Rate</li>
                          <li>• Payment Terms (days)</li>
                          <li>• Invoice Number Prefix</li>
                          <li>• Next Invoice Number</li>
                          <li>• Show/Hide Email in Print</li>
                          <li>• Show/Hide Phone in Print</li>
                          <li>• Footer Text</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="preferences" id="settings-preferences">
                      <AccordionTrigger>User Preferences</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Personalize your experience:</p>
                        <ul className="space-y-2 ml-4 text-sm">
                          <li>• Theme (Light/Dark/System)</li>
                          <li>• Currency Format</li>
                          <li>• Date Format</li>
                          <li>• Auto-save Toggle</li>
                          <li>• Notifications</li>
                          <li>• Sound Effects</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="storage" id="settings-storage">
                      <AccordionTrigger>Storage & Backup</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Manage your data:</p>
                        <ul className="space-y-2 ml-4 text-sm">
                          <li>• View storage usage</li>
                          <li>• Set backup frequency</li>
                          <li>• Export all data</li>
                          <li>• Import backup</li>
                          <li>• Clear all data (with confirmation)</li>
                        </ul>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg mt-3">
                          <p className="text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <span>Regular backups are recommended to prevent data loss.</span>
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="security" id="settings-security">
                      <AccordionTrigger>Security Settings</AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p>Protect your data:</p>
                        <ul className="space-y-2 ml-4 text-sm">
                          <li>• Session Timeout</li>
                          <li>• Require Password on Startup</li>
                          <li>• Enable Data Encryption</li>
                          <li>• Allow Data Export</li>
                          <li>• Offline Mode Settings</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="offline" id="faq-offline">
                      <AccordionTrigger>Does the app work offline?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">Yes! The app works 100% offline on both computer and mobile devices.</p>
                        <ul className="space-y-1 ml-4 text-sm">
                          <li>• All features available without internet</li>
                          <li>• Data saved locally on your device</li>
                          <li>• Syncs when you're back online</li>
                          <li>• Install as PWA for best offline experience</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="save" id="faq-save">
                      <AccordionTrigger>How is my data saved?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">Your data is saved in two places for maximum reliability:</p>
                        <ul className="space-y-1 ml-4 text-sm">
                          <li>• <strong>localStorage:</strong> Browser storage (5-10MB limit)</li>
                          <li>• <strong>IndexedDB:</strong> Offline database (larger capacity)</li>
                          <li>• Auto-save every 5 seconds while editing</li>
                          <li>• Manual backup available via Export function</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="print" id="faq-print">
                      <AccordionTrigger>Why doesn't my invoice fit on one page?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">The print layout is optimized for A4 paper. If it doesn't fit:</p>
                        <ul className="space-y-1 ml-4 text-sm">
                          <li>• Make sure "A4" is selected in print dialog</li>
                          <li>• Check that margins are set to default</li>
                          <li>• Reduce the number of items if necessary</li>
                          <li>• Try "Fit to page" option in print settings</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="delete" id="faq-delete">
                      <AccordionTrigger>Can I recover deleted invoices?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">
                          Once an invoice is deleted, it cannot be recovered unless you have a backup.
                        </p>
                        <p className="text-sm">
                          <strong>Best practice:</strong> Export your data regularly to have backups. 
                          Go to Settings → Storage & Backup → Export Data to create a backup file.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="devices" id="faq-devices">
                      <AccordionTrigger>Can I use the app on multiple devices?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">Yes, but data is stored locally on each device:</p>
                        <ul className="space-y-1 ml-4 text-sm">
                          <li>• Each device has its own data</li>
                          <li>• Use Export/Import to transfer data between devices</li>
                          <li>• Cloud sync coming soon (if Supabase is configured)</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="mobile" id="faq-mobile">
                      <AccordionTrigger>How do I install the app on mobile?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2"><strong>Android (Chrome):</strong></p>
                        <ol className="space-y-1 ml-4 text-sm mb-3">
                          <li>1. Open the app in Chrome browser</li>
                          <li>2. Tap the menu (three dots)</li>
                          <li>3. Select "Add to Home screen"</li>
                          <li>4. Confirm installation</li>
                        </ol>
                        <p className="mb-2"><strong>iOS (Safari):</strong></p>
                        <ol className="space-y-1 ml-4 text-sm">
                          <li>1. Open the app in Safari</li>
                          <li>2. Tap the Share button</li>
                          <li>3. Select "Add to Home Screen"</li>
                          <li>4. Confirm installation</li>
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="calculations" id="faq-calculations">
                      <AccordionTrigger>How are invoice totals calculated?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">The app uses this formula for each item:</p>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs mb-2">
                          Subtotal = Quantity × Unit Price<br />
                          After Discount = Subtotal - (Subtotal × Discount%)<br />
                          Tax Amount = After Discount × Tax%<br />
                          Item Total = After Discount + Tax Amount
                        </div>
                        <p className="text-sm">
                          Grand Total is the sum of all item totals. All calculations are automatic and update in real-time.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="support" id="faq-support">
                      <AccordionTrigger>How do I get support?</AccordionTrigger>
                      <AccordionContent>
                        <p className="mb-2">For support, contact:</p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                          <p className="text-sm"><strong>Email:</strong> kmuzairkhan123@gmail.com</p>
                          <p className="text-sm"><strong>Phone:</strong> +923433885835</p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  </Suspense>
                </CardContent>
              </Card>

              {/* Contact Support Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Need More Help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    Can't find what you're looking for? Our support team is here to help!
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <a href="mailto:kmuzairkhan123@gmail.com?subject=Support%20Request%20-%20Biocure%20Invoices" target="_blank" rel="noreferrer">
                      <Button variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Email Support
                      </Button>
                    </a>
                    <a href="https://wa.me/923433885835?text=Hello%20Biocure%20Support%2C%20I%20need%20help%20with..." target="_blank" rel="noreferrer">
                      <Button variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="bg-muted mt-12 p-6 text-center text-sm text-muted-foreground">
          <p>© 2025 Biocure Health Care - Professional Invoice Management System</p>
          <p className="mt-2">Version 1.0.0 | Last Updated: January 2025</p>
        </div>

        {/* Back to top */}
        {showTop && (
          <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} size="sm" className="fixed bottom-4 right-4 z-50 shadow-lg">
            <ArrowUp className="w-4 h-4 mr-1" /> Top
          </Button>
        )}
      </div>
    </AuthGuard>
  )
}

