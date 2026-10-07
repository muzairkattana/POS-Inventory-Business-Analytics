"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Users, 
  FileText, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react'

interface BusinessMetrics {
  totalRevenue: number
  monthlyRevenue: number
  revenueGrowth: number
  totalInvoices: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  activeClients: number
  averageInvoiceValue: number
  collectionRate: number
}

interface RecentActivity {
  id: string
  type: 'invoice_created' | 'payment_received' | 'reminder_sent' | 'client_added'
  description: string
  amount?: number
  date: Date
}

export default function BusinessDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    totalRevenue: 125670.50,
    monthlyRevenue: 23450.75,
    revenueGrowth: 15.8,
    totalInvoices: 156,
    paidInvoices: 142,
    pendingInvoices: 8,
    overdueInvoices: 6,
    activeClients: 34,
    averageInvoiceValue: 805.58,
    collectionRate: 91.0
  })

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'payment_received',
      description: 'Payment received from ABC Corp',
      amount: 2500.00,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '2', 
      type: 'invoice_created',
      description: 'New invoice created for XYZ Services',
      amount: 1200.00,
      date: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: '3',
      type: 'reminder_sent',
      description: 'Payment reminder sent to DEF Ltd',
      date: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: '4',
      type: 'client_added',
      description: 'New client: GHI Enterprises added',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ])

  const formatCurrency = (amount: number) => `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'payment_received': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'invoice_created': return <FileText className="w-4 h-4 text-blue-600" />
      case 'reminder_sent': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'client_added': return <Users className="w-4 h-4 text-purple-600" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const generateReport = () => {
    // Here you would generate a business report
    alert('📊 Generating business report... This would create a PDF with detailed analytics!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance</p>
        </div>
        <Button onClick={generateReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
              +{metrics.revenueGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((metrics.monthlyRevenue / metrics.totalRevenue) * 100)}% of total revenue
            </p>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(metrics.averageInvoiceValue)} per invoice
            </p>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.collectionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.paidInvoices}/{metrics.totalInvoices} invoices paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Invoice Status
            </CardTitle>
            <CardDescription>Current invoice payment status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Paid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metrics.paidInvoices}</span>
                  <Badge className="bg-green-100 text-green-800">
                    {Math.round((metrics.paidInvoices / metrics.totalInvoices) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metrics.pendingInvoices}</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {Math.round((metrics.pendingInvoices / metrics.totalInvoices) * 100)}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Overdue</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{metrics.overdueInvoices}</span>
                  <Badge className="bg-red-100 text-red-800">
                    {Math.round((metrics.overdueInvoices / metrics.totalInvoices) * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest business activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    {activity.amount && (
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {activity.date.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common business tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="w-6 h-6 mb-2" />
              New Invoice
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              Add Client
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Clock className="w-6 h-6 mb-2" />
              Send Reminders
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
