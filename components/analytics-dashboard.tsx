"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Clock,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Lightbulb,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Zap
} from "lucide-react"
import type { SavedInvoice } from "./invoice-manager"

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

interface AnalyticsData {
  totalRevenue: number
  totalInvoices: number
  averageInvoiceValue: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  monthlyGrowth: number
  topClients: Array<{
    name: string
    totalAmount: number
    invoiceCount: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
    invoices: number
    paid: number
    pending: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    amount: number
    color: string
  }>
  paymentTrends: Array<{
    date: string
    paid: number
    pending: number
    overdue: number
  }>
  clientGrowth: Array<{
    month: string
    newClients: number
    totalClients: number
  }>
  insights: BusinessInsight[]
  forecastedRevenue: number
  collectionEfficiency: number
  clientRetentionRate: number
}

interface AnalyticsDashboardProps {
  invoices: SavedInvoice[]
  isVisible: boolean
  onClose: () => void
  onFilterApply?: (filter: string) => void
}

export default function AnalyticsDashboard({ invoices, isVisible, onClose, onFilterApply }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'invoices' | 'clients'>('revenue')
  const [refreshTime, setRefreshTime] = useState(new Date())

  // Filter invoices based on time range
  const filteredInvoices = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
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
        cutoffDate.setFullYear(1900) // Include all
        break
    }

    return invoices.filter(invoice => new Date(invoice.createdAt) >= cutoffDate)
  }, [invoices, timeRange])

  // Calculate comprehensive analytics data
  const analyticsData: AnalyticsData = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalInvoices = filteredInvoices.length
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0
    
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid').length
    const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'sent').length
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

    // Top clients analysis
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

    // Revenue by month
    const monthlyMap = new Map<string, { revenue: number; invoices: number; paid: number; pending: number }>()
    filteredInvoices.forEach(invoice => {
      const month = new Date(invoice.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      if (monthlyMap.has(month)) {
        const existing = monthlyMap.get(month)!
        monthlyMap.set(month, {
          revenue: existing.revenue + invoice.total,
          invoices: existing.invoices + 1,
          paid: existing.paid + (invoice.status === 'paid' ? invoice.total : 0),
          pending: existing.pending + (invoice.status !== 'paid' ? invoice.total : 0)
        })
      } else {
        monthlyMap.set(month, {
          revenue: invoice.total,
          invoices: 1,
          paid: invoice.status === 'paid' ? invoice.total : 0,
          pending: invoice.status !== 'paid' ? invoice.total : 0
        })
      }
    })

    const revenueByMonth = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Status distribution
    const statusMap = new Map<string, { count: number; amount: number }>()
    const statusColors = {
      'paid': '#10B981',
      'pending': '#F59E0B', 
      'sent': '#3B82F6',
      'draft': '#6B7280',
      'overdue': '#EF4444',
      'partially_paid': '#F97316'
    }

    filteredInvoices.forEach(invoice => {
      const status = invoice.status
      if (statusMap.has(status)) {
        const existing = statusMap.get(status)!
        statusMap.set(status, {
          count: existing.count + 1,
          amount: existing.amount + invoice.total
        })
      } else {
        statusMap.set(status, {
          count: 1,
          amount: invoice.total
        })
      }
    })

    const statusDistribution = Array.from(statusMap.entries()).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      ...data,
      color: statusColors[status as keyof typeof statusColors] || '#6B7280'
    }))

    // Payment trends (last 30 days)
    const trendMap = new Map<string, { paid: number; pending: number; overdue: number }>()
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    last30Days.forEach(dateStr => {
      trendMap.set(dateStr, { paid: 0, pending: 0, overdue: 0 })
    })

    filteredInvoices.forEach(invoice => {
      const dateStr = new Date(invoice.createdAt).toISOString().split('T')[0]
      if (trendMap.has(dateStr)) {
        const existing = trendMap.get(dateStr)!
        if (invoice.status === 'paid') {
          existing.paid += invoice.total
        } else if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) {
          existing.overdue += invoice.total
        } else {
          existing.pending += invoice.total
        }
      }
    })

    const paymentTrends = Array.from(trendMap.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...data
    }))

    // Client growth over time
    const clientGrowthMap = new Map<string, Set<string>>()
    filteredInvoices.forEach(invoice => {
      const month = new Date(invoice.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      if (!clientGrowthMap.has(month)) {
        clientGrowthMap.set(month, new Set())
      }
      clientGrowthMap.get(month)!.add(invoice.clientName)
    })

    const allClientsSet = new Set<string>()
    const clientGrowth = Array.from(clientGrowthMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, clients]) => {
        const newClients = clients.size - Array.from(clients).filter(client => allClientsSet.has(client)).length
        clients.forEach(client => allClientsSet.add(client))
        return {
          month,
          newClients,
          totalClients: allClientsSet.size
        }
      })

    // Calculate additional metrics for insights
    const collectionEfficiency = totalRevenue > 0 
      ? (filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0) / totalRevenue) * 100 
      : 0

    const uniqueClients = new Set(filteredInvoices.map(inv => inv.clientName)).size
    const returningClients = clientMap.size - uniqueClients
    const clientRetentionRate = clientMap.size > 0 ? (returningClients / clientMap.size) * 100 : 0

    // Revenue forecasting based on trends
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

    // Growth insights
    if (clientGrowth.length >= 2) {
      const lastTwoMonths = clientGrowth.slice(-2)
      const avgNewClients = lastTwoMonths.reduce((sum, m) => sum + m.newClients, 0) / 2
      
      if (avgNewClients === 0) {
        insights.push({
          id: 'gro-1',
          type: 'warning',
          category: 'growth',
          title: '📉 Stagnant Client Acquisition',
          description: 'No new clients acquired recently.',
          recommendation: 'Launch a marketing campaign, offer referral incentives, or attend networking events to attract new clients.',
          priority: 'high',
          impact: 'Growth stagnation',
          action: 'Initiate marketing campaign'
        })
      } else if (avgNewClients > 5) {
        insights.push({
          id: 'gro-2',
          type: 'success',
          category: 'growth',
          title: '📈 Strong Client Acquisition',
          description: `Acquiring an average of ${avgNewClients.toFixed(0)} new clients per month!`,
          recommendation: 'Excellent growth trajectory. Ensure you have systems in place to maintain service quality as you scale.',
          priority: 'low',
          impact: 'Positive growth',
          action: 'Scale operations accordingly'
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

    // Average invoice value insights
    if (averageInvoiceValue > 0) {
      const industryAvg = 50000 // Example benchmark, adjust for your industry
      if (averageInvoiceValue < industryAvg * 0.5) {
        insights.push({
          id: 'pri-1',
          type: 'info',
          category: 'revenue',
          title: '💡 Low Average Invoice Value',
          description: `Your average invoice value is Rs ${averageInvoiceValue.toFixed(2)}.`,
          recommendation: 'Consider upselling premium services, bundling products, or increasing prices strategically to boost transaction value.',
          priority: 'medium',
          impact: 'Revenue opportunity',
          action: 'Review pricing strategy'
        })
      }
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
      averageInvoiceValue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      monthlyGrowth,
      topClients,
      revenueByMonth,
      statusDistribution,
      paymentTrends,
      clientGrowth,
      insights,
      forecastedRevenue,
      collectionEfficiency,
      clientRetentionRate
    }
  }, [filteredInvoices])

  const exportData = () => {
    const data = {
      summary: {
        totalRevenue: analyticsData.totalRevenue,
        totalInvoices: analyticsData.totalInvoices,
        averageInvoiceValue: analyticsData.averageInvoiceValue,
        monthlyGrowth: analyticsData.monthlyGrowth
      },
      topClients: analyticsData.topClients,
      monthlyRevenue: analyticsData.revenueByMonth,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 bg-background border rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">Analytics Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  Real-time insights and business analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={() => setRefreshTime(new Date())}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              
              <Button variant="outline" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {/* AI Insights Section */}
            {analyticsData.insights.length > 0 && (
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
                  {analyticsData.insights.map((insight) => {
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
                                  <Button size="sm" variant="outline" className="h-7 text-xs">
                                    {insight.action}
                                  </Button>
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

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Collection Efficiency</p>
                      <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {analyticsData.collectionEfficiency.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analyticsData.collectionEfficiency > 80 ? 'Excellent' : analyticsData.collectionEfficiency > 60 ? 'Good' : 'Needs Improvement'}
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
                        Rs {analyticsData.forecastedRevenue.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {analyticsData.forecastedRevenue > analyticsData.totalRevenue / (analyticsData.revenueByMonth.length || 1) ? (
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

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Client Retention</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {analyticsData.clientRetentionRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analyticsData.clientRetentionRate > 70 ? 'Strong loyalty' : 'Room for growth'}
                      </p>
                    </div>
                    <Users className="w-12 h-12 text-green-600/30" />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Key Metrics Cards */}
            <div className="space-y-2 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Key Performance Indicators
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800"
                onClick={() => {
                  if (onFilterApply) {
                    onFilterApply('all')
                    onClose()
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Rs {analyticsData.totalRevenue.toFixed(2)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {analyticsData.monthlyGrowth > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-xs font-semibold ${analyticsData.monthlyGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analyticsData.monthlyGrowth.toFixed(1)}% this month
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800"
                onClick={() => {
                  if (onFilterApply) {
                    onFilterApply('all')
                    onClose()
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total Invoices</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{analyticsData.totalInvoices}</p>
                      <p className="text-xs text-muted-foreground font-medium">
                        Avg: Rs {analyticsData.averageInvoiceValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-800"
                onClick={() => {
                  if (onFilterApply) {
                    onFilterApply('paid')
                    onClose()
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-xl shadow-lg">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Paid Invoices</p>
                      <p className="text-2xl font-bold text-green-600">{analyticsData.paidInvoices}</p>
                      <p className="text-xs text-green-700 dark:text-green-400 font-semibold">
                        {((analyticsData.paidInvoices / Math.max(analyticsData.totalInvoices, 1)) * 100).toFixed(1)}% success rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800"
                onClick={() => {
                  if (onFilterApply) {
                    onFilterApply('overdue')
                    onClose()
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-xl shadow-lg animate-pulse">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{analyticsData.overdueInvoices}</p>
                      <p className="text-xs text-red-700 dark:text-red-400 font-semibold">
                        ⚠️ Need attention
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="space-y-2 mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Visual Analytics & Trends
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="shadow-xl border-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>
                    Monthly revenue and invoice count over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.revenueByMonth}>
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
                          formatter={(value, name) => [
                            name === 'revenue' ? `Rs ${value.toFixed(2)}` : value,
                            name === 'revenue' ? 'Revenue' : 'Invoices'
                          ]}
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          fill="url(#colorRevenue)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card className="shadow-xl border-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-purple-600" />
                    Invoice Status Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of invoice statuses
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ status, count }) => `${status}: ${count}`}
                          outerRadius={85}
                          fill="#8884d8"
                          dataKey="count"
                          animationDuration={1500}
                        >
                          {analyticsData.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value} invoices`, 'Count']} 
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Trends */}
              <Card className="shadow-xl border-2">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Payment Trends (Last 30 Days)
                  </CardTitle>
                  <CardDescription>
                    Daily payment patterns and cash flow
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.paymentTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="date" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          formatter={(value) => `Rs ${value.toFixed(2)}`} 
                          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                        <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={3} name="Paid" animationDuration={1500} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={3} name="Pending" animationDuration={1500} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="overdue" stroke="#EF4444" strokeWidth={3} name="Overdue" animationDuration={1500} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Client Growth */}
              <Card className="shadow-xl border-2">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    Client Growth
                  </CardTitle>
                  <CardDescription>
                    New and total clients over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.clientGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px' }} />
                        <Bar dataKey="newClients" fill="#3B82F6" name="New Clients" radius={[8, 8, 0, 0]} animationDuration={1500} />
                        <Bar dataKey="totalClients" fill="#10B981" name="Total Clients" radius={[8, 8, 0, 0]} animationDuration={1500} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Clients Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Clients
                </CardTitle>
                <CardDescription>
                  Highest value clients by total revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Client Name</th>
                        <th className="text-right p-2">Total Revenue</th>
                        <th className="text-right p-2">Invoice Count</th>
                        <th className="text-right p-2">Avg Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.topClients.map((client, index) => (
                        <tr key={client.name} className="border-b">
                          <td className="p-2 font-medium">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              {client.name}
                            </div>
                          </td>
                          <td className="p-2 text-right font-semibold">
                            Rs {client.totalAmount.toFixed(2)}
                          </td>
                          <td className="p-2 text-right">
                            {client.invoiceCount}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            Rs {(client.totalAmount / client.invoiceCount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>Last updated: {refreshTime.toLocaleString()}</p>
              <p>Showing data for: {timeRange === 'all' ? 'All time' : timeRange}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
