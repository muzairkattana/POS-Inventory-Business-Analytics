"use client"

import { useState, useEffect, useMemo } from "react"
import AuthGuard from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  FileText, 
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  Lightbulb,
  Sparkles,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Zap,
  FileQuestion,
  Plus
} from "lucide-react"

interface BusinessInsight {
  id: string
  type: 'success' | 'warning' | 'info' | 'critical'
  category: 'revenue' | 'clients' | 'payments' | 'growth' | 'forecast'
  title: string
  description: string
  recommendation: string
  priority: 'high' | 'medium' | 'low'
  impact: string
  action?: string
}
import type { SavedInvoice } from "@/components/invoice-manager"
import BusinessAnalyticsHub from "@/components/business-analytics-hub"
import Link from "next/link"
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y' | 'all'>('30d')
  const [refreshTime, setRefreshTime] = useState(new Date())

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = () => {
    setLoading(true)
    try {
      const saved = localStorage.getItem("saved-invoices")
      if (saved) {
        const parsedInvoices = JSON.parse(saved)
        setInvoices(parsedInvoices)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadInvoices()
    setRefreshTime(new Date())
  }

  // Filter invoices based on time range
  const filteredInvoices = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
      default:
        cutoffDate.setFullYear(1900)
        break
    }

    return invoices.filter(invoice => new Date(invoice.createdAt) >= cutoffDate)
  }, [invoices, timeRange])

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalInvoices = filteredInvoices.length
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid').length
    const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length
    const overdueInvoices = filteredInvoices.filter(inv => {
      if (!inv.dueDate) return false
      return new Date(inv.dueDate) < new Date() && inv.status !== 'paid'
    }).length

    // Calculate monthly growth
    const thisMonth = filteredInvoices.filter(inv => {
      const invoiceDate = new Date(inv.createdAt)
      const now = new Date()
      return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
    })
    
    const lastMonth = filteredInvoices.filter(inv => {
      const invoiceDate = new Date(inv.createdAt)
      const now = new Date()
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return invoiceDate.getMonth() === lastMonthDate.getMonth() && invoiceDate.getFullYear() === lastMonthDate.getFullYear()
    })

    const thisMonthRevenue = thisMonth.reduce((sum, inv) => sum + inv.total, 0)
    const lastMonthRevenue = lastMonth.reduce((sum, inv) => sum + inv.total, 0)
    const monthlyGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

    const uniqueClients = new Set(filteredInvoices.map(inv => inv.clientName)).size
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
    const collectionEfficiency = totalRevenue > 0 
      ? (filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) / totalRevenue) * 100 
      : 0

    // Revenue by month
    const monthlyMap = new Map<string, number>()
    filteredInvoices.forEach(invoice => {
      const month = new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + invoice.total)
    })

    const revenueByMonth = Array.from(monthlyMap.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6) // Last 6 months

    // Status distribution
    const statusColors: Record<string, string> = {
      'paid': '#10B981',
      'pending': '#F59E0B', 
      'sent': '#3B82F6',
      'draft': '#6B7280',
      'overdue': '#EF4444',
      'partially_paid': '#F97316'
    }

    // Calculate status distribution including dynamic overdue status
    const statusMap = new Map<string, number>()
    filteredInvoices.forEach(invoice => {
      // Check if invoice is overdue (not paid and past due date)
      const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
      const displayStatus = isOverdue ? 'overdue' : invoice.status
      statusMap.set(displayStatus, (statusMap.get(displayStatus) || 0) + 1)
    })

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      color: statusColors[status] || '#6B7280'
    }))

    // Top clients for concentration risk
    const clientMap = new Map<string, { totalAmount: number; invoiceCount: number }>()
    filteredInvoices.forEach(invoice => {
      const clientName = invoice.clientName
      if (clientMap.has(clientName)) {
        const existing = clientMap.get(clientName)!
        clientMap.set(clientName, {
          totalAmount: existing.totalAmount + invoice.total,
          invoiceCount: existing.invoiceCount + 1
        })
      } else {
        clientMap.set(clientName, {
          totalAmount: invoice.total,
          invoiceCount: 1
        })
      }
    })

    const topClients = Array.from(clientMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    // Revenue forecasting
    const avgMonthlyRevenue = revenueByMonth.length > 0 
      ? revenueByMonth.reduce((sum, m) => sum + m.revenue, 0) / revenueByMonth.length 
      : 0
    const forecastedRevenue = avgMonthlyRevenue * (1 + (monthlyGrowth / 100))

    // Generate AI-powered business insights
    const insights: BusinessInsight[] = []

    // Revenue insights
    if (monthlyGrowth > 10) {
      insights.push({
        id: 'rev-1',
        type: 'success',
        category: 'revenue',
        title: '🚀 Strong Revenue Growth',
        description: `Your revenue has grown by ${monthlyGrowth.toFixed(1)}% this month!`,
        recommendation: 'Consider scaling your operations or expanding to new market segments to capitalize on this momentum.',
        priority: 'medium',
        impact: 'Positive momentum',
        action: 'Review capacity for growth'
      })
    } else if (monthlyGrowth < -5) {
      insights.push({
        id: 'rev-2',
        type: 'warning',
        category: 'revenue',
        title: '⚠️ Revenue Decline Detected',
        description: `Revenue has decreased by ${Math.abs(monthlyGrowth).toFixed(1)}% this month.`,
        recommendation: 'Analyze market conditions, review pricing strategy, and reach out to dormant clients with special offers.',
        priority: 'high',
        impact: 'Requires immediate attention',
        action: 'Review marketing & pricing'
      })
    }

    // Payment collection insights
    if (overdueInvoices > 0) {
      const overdueAmount = filteredInvoices
        .filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'paid')
        .reduce((sum, inv) => sum + inv.total, 0)
      
      insights.push({
        id: 'pay-1',
        type: 'critical',
        category: 'payments',
        title: '🔴 Overdue Invoices Alert',
        description: `${overdueInvoices} invoice(s) totaling Rs ${overdueAmount.toFixed(2)} are overdue.`,
        recommendation: 'Send payment reminders immediately. Consider offering early payment discounts or flexible payment plans.',
        priority: 'high',
        impact: `Rs ${overdueAmount.toFixed(2)} at risk`,
        action: 'Send payment reminders'
      })
    }

    if (collectionEfficiency < 70) {
      insights.push({
        id: 'pay-2',
        type: 'warning',
        category: 'payments',
        title: '💰 Low Collection Efficiency',
        description: `Only ${collectionEfficiency.toFixed(1)}% of invoices are being collected.`,
        recommendation: 'Implement automated payment reminders, offer multiple payment methods, and review your credit terms.',
        priority: 'high',
        impact: 'Cash flow impact',
        action: 'Improve collection process'
      })
    } else if (collectionEfficiency > 90) {
      insights.push({
        id: 'pay-3',
        type: 'success',
        category: 'payments',
        title: '✅ Excellent Collection Rate',
        description: `${collectionEfficiency.toFixed(1)}% collection efficiency - Outstanding!`,
        recommendation: 'Your payment collection is excellent. Maintain these practices and consider sharing your strategy.',
        priority: 'low',
        impact: 'Strong cash flow',
        action: 'Maintain current practices'
      })
    }

    // Client insights
    if (topClients.length > 0) {
      const topClientRevenue = topClients.slice(0, 3).reduce((sum, c) => sum + c.totalAmount, 0)
      const topClientPercentage = (topClientRevenue / totalRevenue) * 100
      
      if (topClientPercentage > 60) {
        insights.push({
          id: 'cli-1',
          type: 'warning',
          category: 'clients',
          title: '⚠️ Client Concentration Risk',
          description: `Top 3 clients account for ${topClientPercentage.toFixed(1)}% of your revenue.`,
          recommendation: 'Diversify your client base to reduce dependency. Focus on acquiring new clients and nurturing smaller accounts.',
          priority: 'medium',
          impact: 'Business risk',
          action: 'Diversify client portfolio'
        })
      }
    }

    // Forecast insights
    if (forecastedRevenue > 0) {
      const forecastGrowth = avgMonthlyRevenue > 0 ? ((forecastedRevenue - avgMonthlyRevenue) / avgMonthlyRevenue) * 100 : 0
      insights.push({
        id: 'for-1',
        type: 'info',
        category: 'forecast',
        title: '🔮 Revenue Forecast',
        description: `Based on current trends, next month's projected revenue: Rs ${forecastedRevenue.toFixed(2)}`,
        recommendation: forecastGrowth > 0 
          ? `Expected ${forecastGrowth.toFixed(1)}% growth. Prepare resources and inventory accordingly.`
          : `Projected ${Math.abs(forecastGrowth).toFixed(1)}% decline. Review pricing and marketing strategies.`,
        priority: 'medium',
        impact: 'Planning insight',
        action: 'Plan resources'
      })
    }

    // Seasonal pattern detection
    if (revenueByMonth.length >= 3) {
      const recentMonths = revenueByMonth.slice(-3)
      const revenues = recentMonths.map(m => m.revenue)
      const isIncreasing = revenues.every((val, i) => i === 0 || val >= revenues[i - 1])
      const isDecreasing = revenues.every((val, i) => i === 0 || val <= revenues[i - 1])
      
      if (isIncreasing) {
        insights.push({
          id: 'sea-1',
          type: 'success',
          category: 'growth',
          title: '📊 Consistent Growth Trend',
          description: 'Revenue has increased consistently for the last 3 months.',
          recommendation: 'Capitalize on this trend by investing in marketing and expanding your service offerings.',
          priority: 'medium',
          impact: 'Growth opportunity',
          action: 'Invest in growth initiatives'
        })
      } else if (isDecreasing) {
        insights.push({
          id: 'sea-2',
          type: 'warning',
          category: 'growth',
          title: '📉 Declining Revenue Trend',
          description: 'Revenue has declined for 3 consecutive months.',
          recommendation: 'Urgent action needed: Review competitive position, adjust pricing, enhance marketing, or launch promotions.',
          priority: 'high',
          impact: 'Downward trend',
          action: 'Implement recovery strategy'
        })
      }
    }

    // Sort insights by priority
    insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return {
      totalRevenue,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      monthlyGrowth,
      uniqueClients,
      collectionRate,
      revenueByMonth,
      statusDistribution,
      insights,
      forecastedRevenue,
      collectionEfficiency
    }
  }, [filteredInvoices])

  const exportReport = () => {
    const data = {
      summary: {
        totalRevenue: analytics.totalRevenue,
        totalInvoices: analytics.totalInvoices,
        collectionRate: analytics.collectionRate,
        collectionEfficiency: analytics.collectionEfficiency,
        monthlyGrowth: analytics.monthlyGrowth,
        forecastedRevenue: analytics.forecastedRevenue,
        uniqueClients: analytics.uniqueClients,
        paidInvoices: analytics.paidInvoices,
        pendingInvoices: analytics.pendingInvoices,
        overdueInvoices: analytics.overdueInvoices
      },
      revenueByMonth: analytics.revenueByMonth,
      statusDistribution: analytics.statusDistribution,
      insights: analytics.insights,
      timeRange,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `business-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // Empty state check
  if (!loading && invoices.length === 0) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <FileQuestion className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Invoices Found</h2>
            <p className="text-muted-foreground mb-6">
              Create your first invoice to see analytics and business insights here.
            </p>
            <Link href="/">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Business Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time analytics and business insights
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                📄 Invoices
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="outline" size="sm" className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950">
                💸 Expenses
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={exportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Full-Spectrum Business Analytics Engine (Daily, Weekly, Monthly, Yearly & Expenses) */}
        <BusinessAnalyticsHub invoices={invoices} />

        {/* Time Range Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium mr-2">Time Range:</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={timeRange === '30d' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('30d')}
                >
                  Last 30 Days
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === '90d' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('90d')}
                >
                  Last 90 Days
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === '1y' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('1y')}
                >
                  Last Year
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === 'all' ? 'default' : 'outline'}
                  onClick={() => setTimeRange('all')}
                >
                  All Time
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs {analytics.totalRevenue.toFixed(2)}</div>
              <div className="flex items-center text-xs mt-1">
                {analytics.monthlyGrowth > 0 ? (
                  <><TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600 font-semibold">+{analytics.monthlyGrowth.toFixed(1)}%</span></>
                ) : (
                  <><TrendingDown className="w-3 h-3 mr-1 text-red-600" />
                  <span className="text-red-600 font-semibold">{analytics.monthlyGrowth.toFixed(1)}%</span></>
                )}
                <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.uniqueClients} unique clients
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <Target className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.paidInvoices}/{analytics.totalInvoices} paid
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.uniqueClients}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total business relationships
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collection Efficiency</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {analytics.collectionEfficiency.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.collectionEfficiency > 80 ? 'Excellent' : analytics.collectionEfficiency > 60 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
                <Target className="w-12 h-12 text-purple-600/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Forecasted Revenue</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    Rs {analytics.forecastedRevenue.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {analytics.forecastedRevenue > analytics.totalRevenue / (analytics.revenueByMonth.length || 1) ? (
                      <><ArrowUpRight className="w-3 h-3 text-green-600" /> Projected growth</>
                    ) : (
                      <><ArrowDownRight className="w-3 h-3 text-red-600" /> Projected decline</>
                    )}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-blue-600/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Status Overview */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.paidInvoices}</div>
              <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
                {analytics.totalInvoices > 0 ? ((analytics.paidInvoices / analytics.totalInvoices) * 100).toFixed(0) : 0}% Complete
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.pendingInvoices}</div>
              <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                {analytics.totalInvoices > 0 ? ((analytics.pendingInvoices / analytics.totalInvoices) * 100).toFixed(0) : 0}% Pending
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.overdueInvoices}</div>
              <Badge className="mt-2 bg-red-100 text-red-800 hover:bg-red-100">
                {analytics.overdueInvoices > 0 ? 'Needs Attention' : 'All Clear'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Revenue Trend (Last 6 Months)
              </CardTitle>
              <CardDescription>Monthly revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.revenueByMonth}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      formatter={(value: any) => `Rs ${value.toFixed(2)}`}
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Invoice Status Distribution
              </CardTitle>
              <CardDescription>Breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Section */}
        {analytics.insights && analytics.insights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">AI-Powered Business Insights</h3>
              <Badge variant="outline" className="ml-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
                <Zap className="w-3 h-3 mr-1" />
                Smart Recommendations
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analytics.insights.map((insight) => {
                const bgColors = {
                  success: 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
                  warning: 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800',
                  critical: 'bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800',
                  info: 'bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'
                }
                const textColors = {
                  success: 'text-green-700 dark:text-green-300',
                  warning: 'text-orange-700 dark:text-orange-300',
                  critical: 'text-red-700 dark:text-red-300',
                  info: 'text-blue-700 dark:text-blue-300'
                }
                const icons = {
                  success: <CheckCircle2 className="w-5 h-5" />,
                  warning: <AlertCircle className="w-5 h-5" />,
                  critical: <AlertCircle className="w-5 h-5" />,
                  info: <Info className="w-5 h-5" />
                }
                
                return (
                  <Card 
                    key={insight.id} 
                    className={`${bgColors[insight.type]} border-2 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`${textColors[insight.type]} mt-1`}>
                          {icons[insight.type]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm">{insight.title}</h4>
                            <Badge 
                              variant={insight.priority === 'high' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {insight.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {insight.description}
                          </p>
                          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mb-2">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                              <p className="text-xs font-medium">{insight.recommendation}</p>
                            </div>
                          </div>
                          {insight.action && (
                            <div className="flex items-center justify-between pt-2 border-t border-current/10">
                              <span className="text-xs font-semibold">{insight.impact}</span>
                              <Link href={insight.category === 'payments' ? '/invoices' : '/reports'}>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                  {insight.action}
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>Last updated: {refreshTime.toLocaleString()}</p>
          <p>Showing data for: {timeRange === 'all' ? 'All time' : timeRange}</p>
        </div>
      </div>
    </AuthGuard>
  )
}

