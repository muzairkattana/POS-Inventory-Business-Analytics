"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts"
import { 
  TrendingUp, TrendingDown, DollarSign, Users, FileText, Clock, Calendar,
  Target, AlertCircle, CheckCircle2, BarChart3, PieChart as PieChartIcon,
  Activity, Download, RefreshCw, Plus, Trash2, Edit3, ShoppingBag, Receipt,
  Sparkles, Zap, ShieldCheck, ArrowUpRight, ArrowDownRight, Layers
} from "lucide-react"
import type { SavedInvoice } from "./invoice-manager"
import { ExpenseStorage, type ExpenseItem, EXPENSE_CATEGORIES } from "@/lib/expense-storage"

interface BusinessAnalyticsHubProps {
  invoices: SavedInvoice[]
}

export default function BusinessAnalyticsHub({ invoices }: BusinessAnalyticsHubProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly" | "expenses" | "products">("daily")
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Expense modal state
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "cogs" as ExpenseItem["category"],
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash" as ExpenseItem["paymentMethod"],
    notes: ""
  })

  // Load expenses on mount
  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = () => {
    setExpenses(ExpenseStorage.getExpenses())
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpense.title || !newExpense.amount) return

    ExpenseStorage.addExpense({
      title: newExpense.title,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
      paymentMethod: newExpense.paymentMethod,
      notes: newExpense.notes
    })

    setNewExpense({
      title: "",
      category: "cogs",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      notes: ""
    })
    setIsExpenseDialogOpen(false)
    loadExpenses()
  }

  const handleDeleteExpense = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      ExpenseStorage.deleteExpense(id)
      loadExpenses()
    }
  }

  // High Level Core Metrics Calculation
  const totalGrossRevenue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
  }, [invoices])

  const totalCollectedRevenue = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
  }, [invoices])

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0)
  }, [expenses])

  const netProfit = useMemo(() => {
    return totalGrossRevenue - totalExpensesAmount
  }, [totalGrossRevenue, totalExpensesAmount])

  const profitMarginPercent = useMemo(() => {
    return totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0
  }, [netProfit, totalGrossRevenue])

  // 1. DAY-BY-DAY (DAILY) REVENUE & PROFIT ANALYSIS
  const dailyAnalytics = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-')
    const targetYear = parseInt(yearStr, 10)
    const targetMonth = parseInt(monthStr, 10) - 1 // 0-indexed

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
    const dailyMap: Record<number, { day: number; dateStr: string; revenue: number; expenses: number; netProfit: number; invoiceCount: number }> = {}

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(targetYear, targetMonth, day)
      const dateStr = dateObj.toISOString().split('T')[0]
      dailyMap[day] = {
        day,
        dateStr,
        revenue: 0,
        expenses: 0,
        netProfit: 0,
        invoiceCount: 0
      }
    }

    // Populate daily revenue from invoices
    invoices.forEach(inv => {
      const invDate = new Date(inv.date || inv.createdAt)
      if (invDate.getFullYear() === targetYear && invDate.getMonth() === targetMonth) {
        const day = invDate.getDate()
        if (dailyMap[day]) {
          dailyMap[day].revenue += inv.total || 0
          dailyMap[day].invoiceCount += 1
        }
      }
    })

    // Populate daily expenses
    expenses.forEach(exp => {
      const [expY, expM, expD] = exp.date.split('-').map(Number)
      if (expY === targetYear && expM === targetMonth + 1) {
        if (dailyMap[expD]) {
          dailyMap[expD].expenses += exp.amount
        }
      }
    })

    // Calculate net profit per day
    const chartData = Object.values(dailyMap).map(item => ({
      ...item,
      netProfit: item.revenue - item.expenses,
      label: `Day ${item.day}`
    }))

    const monthRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
    const monthExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0)
    const monthProfit = monthRevenue - monthExpenses

    return {
      chartData,
      monthRevenue,
      monthExpenses,
      monthProfit,
      daysInMonth
    }
  }, [invoices, expenses, selectedMonth])

  // 2. WEEKLY REVENUE & PROFIT ANALYSIS
  const weeklyAnalytics = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-')
    const targetYear = parseInt(yearStr, 10)
    const targetMonth = parseInt(monthStr, 10) - 1

    const weeks = [
      { weekName: "Week 1 (Days 1-7)", revenue: 0, expenses: 0, netProfit: 0, invoices: 0 },
      { weekName: "Week 2 (Days 8-14)", revenue: 0, expenses: 0, netProfit: 0, invoices: 0 },
      { weekName: "Week 3 (Days 15-21)", revenue: 0, expenses: 0, netProfit: 0, invoices: 0 },
      { weekName: "Week 4 (Days 22-End)", revenue: 0, expenses: 0, netProfit: 0, invoices: 0 }
    ]

    invoices.forEach(inv => {
      const invDate = new Date(inv.date || inv.createdAt)
      if (invDate.getFullYear() === targetYear && invDate.getMonth() === targetMonth) {
        const day = invDate.getDate()
        let weekIdx = 0
        if (day >= 1 && day <= 7) weekIdx = 0
        else if (day >= 8 && day <= 14) weekIdx = 1
        else if (day >= 15 && day <= 21) weekIdx = 2
        else weekIdx = 3

        weeks[weekIdx].revenue += inv.total || 0
        weeks[weekIdx].invoices += 1
      }
    })

    expenses.forEach(exp => {
      const [expY, expM, expD] = exp.date.split('-').map(Number)
      if (expY === targetYear && expM === targetMonth + 1) {
        let weekIdx = 0
        if (expD >= 1 && expD <= 7) weekIdx = 0
        else if (expD >= 8 && expD <= 14) weekIdx = 1
        else if (expD >= 15 && expD <= 21) weekIdx = 2
        else weekIdx = 3

        weeks[weekIdx].expenses += exp.amount
      }
    })

    const chartData = weeks.map(w => ({
      ...w,
      netProfit: w.revenue - w.expenses
    }))

    return chartData
  }, [invoices, expenses, selectedMonth])

  // 3. MONTHLY (MoM) REVENUE & PROFIT ANALYSIS
  const monthlyAnalytics = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]

    const monthlyMap = months.map((monthName, index) => ({
      month: monthName,
      monthIndex: index,
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      invoices: 0
    }))

    invoices.forEach(inv => {
      const invDate = new Date(inv.date || inv.createdAt)
      if (invDate.getFullYear() === selectedYear) {
        const mIdx = invDate.getMonth()
        if (monthlyMap[mIdx]) {
          monthlyMap[mIdx].revenue += inv.total || 0
          monthlyMap[mIdx].invoices += 1
        }
      }
    })

    expenses.forEach(exp => {
      const [expY, expM] = exp.date.split('-').map(Number)
      if (expY === selectedYear) {
        const mIdx = expM - 1
        if (monthlyMap[mIdx]) {
          monthlyMap[mIdx].expenses += exp.amount
        }
      }
    })

    const chartData = monthlyMap.map(m => ({
      ...m,
      netProfit: m.revenue - m.expenses
    }))

    return chartData
  }, [invoices, expenses, selectedYear])

  // 4. YEARLY (YoY) MACRO COMPARISON
  const yearlyAnalytics = useMemo(() => {
    const yearsMap: Record<number, { year: number; revenue: number; expenses: number; netProfit: number; invoices: number }> = {}

    // Track range of years e.g. 2024 to 2026
    const currentY = new Date().getFullYear()
    for (let y = currentY - 2; y <= currentY; y++) {
      yearsMap[y] = { year: y, revenue: 0, expenses: 0, netProfit: 0, invoices: 0 }
    }

    invoices.forEach(inv => {
      const y = new Date(inv.date || inv.createdAt).getFullYear()
      if (!yearsMap[y]) {
        yearsMap[y] = { year: y, revenue: 0, expenses: 0, netProfit: 0, invoices: 0 }
      }
      yearsMap[y].revenue += inv.total || 0
      yearsMap[y].invoices += 1
    })

    expenses.forEach(exp => {
      const y = parseInt(exp.date.split('-')[0], 10)
      if (!yearsMap[y]) {
        yearsMap[y] = { year: y, revenue: 0, expenses: 0, netProfit: 0, invoices: 0 }
      }
      yearsMap[y].expenses += exp.amount
    })

    return Object.values(yearsMap).map(y => ({
      ...y,
      netProfit: y.revenue - y.expenses
    })).sort((a, b) => a.year - b.year)
  }, [invoices, expenses])

  // 5. PRODUCT / ITEM LEVEL PERFORMANCE
  const productPerformance = useMemo(() => {
    const itemMap = new Map<string, { name: string; quantity: number; totalRevenue: number; avgPrice: number }>()

    invoices.forEach(inv => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach(item => {
          const itemName = item.description || item.name || item.title || 'General Product/Service'
          const qty = Number(item.quantity || item.qty || 1)
          const amount = Number(item.amount || item.total || (item.price * qty) || 0)

          if (itemMap.has(itemName)) {
            const existing = itemMap.get(itemName)!
            itemMap.set(itemName, {
              name: itemName,
              quantity: existing.quantity + qty,
              totalRevenue: existing.totalRevenue + amount,
              avgPrice: (existing.totalRevenue + amount) / (existing.quantity + qty)
            })
          } else {
            itemMap.set(itemName, {
              name: itemName,
              quantity: qty,
              totalRevenue: amount,
              avgPrice: qty > 0 ? amount / qty : amount
            })
          }
        })
      }
    })

    return Array.from(itemMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [invoices])

  // Expense Category Breakdown
  const expenseCategoryBreakdown = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
    })

    return Object.entries(categoryTotals).map(([catKey, total]) => ({
      name: EXPENSE_CATEGORIES[catKey as ExpenseItem['category']]?.label || catKey,
      value: total,
      color: EXPENSE_CATEGORIES[catKey as ExpenseItem['category']]?.color || '#6B7280'
    }))
  }, [expenses])

  return (
    <div className="space-y-6">
      {/* Financial Health Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Gross Revenue</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  Rs {totalGrossRevenue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Total from {invoices.length} invoices
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-2 border-rose-200 dark:border-rose-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Total Expenses</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  Rs {totalExpensesAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  COGS, Rent, Utilities & Salaries
                </p>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl">
                <Receipt className="w-7 h-7 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Business Profit */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Net Business Profit</p>
                <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
                  Rs {netProfit.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  {netProfit >= 0 ? (
                    <span className="text-green-600 font-semibold flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> Positive Cash Flow</span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" /> Operating at Loss</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <BarChart3 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin % */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wider">Profit Margin %</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {profitMarginPercent.toFixed(1)}%
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {profitMarginPercent > 30 ? '🚀 High Margin Business' : profitMarginPercent > 15 ? '✅ Healthy Margin' : '⚠️ Low Margin Alert'}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Target className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-2 rounded-xl border">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full sm:w-auto h-auto">
            <TabsTrigger value="daily" className="text-xs sm:text-sm py-2">📅 Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm py-2">📆 Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm py-2">🗓️ Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="text-xs sm:text-sm py-2">📊 Yearly</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs sm:text-sm py-2">💸 Expenses</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm py-2">📦 Products</TabsTrigger>
          </TabsList>

          {/* Time Selector Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {(activeTab === "daily" || activeTab === "weekly") && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Select Month:</span>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-40 h-8 text-xs bg-background"
                />
              </div>
            )}

            {activeTab === "monthly" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Select Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-8 px-2 text-xs border rounded-md bg-background"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 1. DAILY TAB */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Day-by-Day Financial Breakdown ({selectedMonth})
                </CardTitle>
                <CardDescription>Daily revenue, expenses, and net profit tracking per calendar day</CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30">
                Month Total: Rs {dailyAnalytics.monthRevenue.toFixed(2)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daily Chart */}
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyAnalytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`Rs ${Number(value).toFixed(2)}`, '']} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="Net Profit" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Day-by-Day Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Invoices</th>
                      <th className="p-3">Revenue (Rs)</th>
                      <th className="p-3">Expenses (Rs)</th>
                      <th className="p-3">Net Profit (Rs)</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAnalytics.chartData.map((d) => (
                      <tr key={d.day} className={`border-t hover:bg-muted/40 ${d.revenue > 0 || d.expenses > 0 ? 'bg-background' : 'opacity-60'}`}>
                        <td className="p-3 font-medium">{d.dateStr} (Day {d.day})</td>
                        <td className="p-3">{d.invoiceCount}</td>
                        <td className="p-3 font-semibold text-green-600">Rs {d.revenue.toFixed(2)}</td>
                        <td className="p-3 text-red-600">Rs {d.expenses.toFixed(2)}</td>
                        <td className={`p-3 font-bold ${d.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          Rs {d.netProfit.toFixed(2)}
                        </td>
                        <td className="p-3">
                          {d.revenue > 0 ? (
                            <Badge className="bg-green-100 text-green-800 text-[10px]">Active Sales</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">No Sales</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. WEEKLY TAB */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Weekly Performance Matrix ({selectedMonth})
              </CardTitle>
              <CardDescription>4-Week breakdown to evaluate week-over-week growth within the month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="weekName" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`Rs ${Number(value).toFixed(2)}`, '']} />
                    <Legend />
                    <Bar dataKey="revenue" name="Weekly Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Weekly Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="Weekly Net Profit" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {weeklyAnalytics.map((w, idx) => (
                  <Card key={idx} className="border-l-4 border-l-purple-600">
                    <CardContent className="p-4">
                      <p className="text-xs font-bold text-muted-foreground uppercase">{w.weekName}</p>
                      <p className="text-xl font-bold text-green-600 mt-1">Rs {w.revenue.toFixed(2)}</p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Invoices Issued:</span>
                          <span className="font-semibold">{w.invoices}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expenses:</span>
                          <span className="text-red-500 font-semibold">Rs {w.expenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t">
                          <span>Net Profit:</span>
                          <span className={`font-bold ${w.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            Rs {w.netProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. MONTHLY TAB */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Month-over-Month (MoM) Financial Report ({selectedYear})
              </CardTitle>
              <CardDescription>Full 12-month comparative view of Gross Revenue vs Expenses vs Net Profit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyAnalytics}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`Rs ${Number(value).toFixed(2)}`, '']} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" name="Monthly Revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="netProfit" name="Net Profit" stroke="#3B82F6" fillOpacity={1} fill="url(#colorProf)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted font-semibold">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3">Invoices</th>
                      <th className="p-3">Revenue (Rs)</th>
                      <th className="p-3">Expenses (Rs)</th>
                      <th className="p-3">Net Profit (Rs)</th>
                      <th className="p-3">Profit Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyAnalytics.map((m) => {
                      const margin = m.revenue > 0 ? (m.netProfit / m.revenue) * 100 : 0
                      return (
                        <tr key={m.month} className="border-t hover:bg-muted/40">
                          <td className="p-3 font-bold">{m.month} {selectedYear}</td>
                          <td className="p-3">{m.invoices}</td>
                          <td className="p-3 font-semibold text-green-600">Rs {m.revenue.toFixed(2)}</td>
                          <td className="p-3 text-red-600">Rs {m.expenses.toFixed(2)}</td>
                          <td className={`p-3 font-bold ${m.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            Rs {m.netProfit.toFixed(2)}
                          </td>
                          <td className="p-3">
                            <Badge className={margin >= 20 ? 'bg-green-100 text-green-800' : margin >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                              {margin.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. YEARLY TAB */}
        <TabsContent value="yearly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Multi-Year (YoY) Financial Digest
              </CardTitle>
              <CardDescription>Year-over-Year macro company growth and annual tax totals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`Rs ${Number(value).toFixed(2)}`, '']} />
                    <Legend />
                    <Bar dataKey="revenue" name="Annual Gross Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Annual Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="Annual Net Profit" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {yearlyAnalytics.map((y) => (
                  <Card key={y.year} className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-bold">{y.year} Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Revenue:</span>
                        <span className="font-bold text-green-600">Rs {y.revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Expenses:</span>
                        <span className="font-bold text-red-600">Rs {y.expenses.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-semibold">Net Profit:</span>
                        <span className={`font-bold text-base ${y.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                          Rs {y.netProfit.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. EXPENSES MANAGER TAB */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold">Business Expense Ledger</h3>
              <p className="text-xs text-muted-foreground">Log purchases, salaries, rent, and utility bills for accurate profit calculation</p>
            </div>
            
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-rose-600 hover:bg-rose-700 text-white">
                  <Plus className="w-4 h-4" /> Add New Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Business Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Expense Title / Description</label>
                    <Input
                      placeholder="e.g. Pharmacy Medicine Stock Restock"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Category</label>
                      <select
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                        className="w-full p-2 border rounded-md"
                      >
                        {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                          <option key={key} value={key}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1">Amount (Rs)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 5000"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold block mb-1">Date</label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1">Payment Method</label>
                      <select
                        value={newExpense.paymentMethod}
                        onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value as any })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="jazzcash">JazzCash</option>
                        <option value="easypaisa">EasyPaisa</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Notes (Optional)</label>
                    <Input
                      placeholder="e.g. Invoice / Receipt Ref Number"
                      value={newExpense.notes}
                      onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white mt-2">
                    Save Expense Record
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Category Pie Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Expense Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex flex-col items-center justify-center">
                {expenseCategoryBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No expenses recorded yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {expenseCategoryBreakdown.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => `Rs ${Number(val).toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Expenses List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Recorded Business Expenses</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted font-semibold">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Amount (Rs)</th>
                      <th className="p-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-muted-foreground">
                          No expenses recorded. Click "Add New Expense" to start tracking business expenses.
                        </td>
                      </tr>
                    ) : (
                      expenses.map((exp) => (
                        <tr key={exp.id} className="border-t hover:bg-muted/40">
                          <td className="p-2 whitespace-nowrap">{exp.date}</td>
                          <td className="p-2 font-medium">{exp.title}</td>
                          <td className="p-2">
                            <Badge variant="outline" style={{ borderColor: EXPENSE_CATEGORIES[exp.category]?.color, color: EXPENSE_CATEGORIES[exp.category]?.color }}>
                              {EXPENSE_CATEGORIES[exp.category]?.label || exp.category}
                            </Badge>
                          </td>
                          <td className="p-2 uppercase text-[10px]">{exp.paymentMethod.replace('_', ' ')}</td>
                          <td className="p-2 font-bold text-red-600 whitespace-nowrap">Rs {exp.amount.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 6. TOP PRODUCTS TAB */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
                Product & Medicine Sales Performance
              </CardTitle>
              <CardDescription>Top revenue-generating items and sales volume analytics</CardDescription>
            </CardHeader>
            <CardContent>
              {productPerformance.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p>No product sales data found in current invoices.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productPerformance.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(val: any) => [`Rs ${Number(val).toFixed(2)}`, 'Revenue']} />
                        <Bar dataKey="totalRevenue" fill="#0D9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted font-semibold">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">Product / Service Name</th>
                          <th className="p-3">Units Sold</th>
                          <th className="p-3">Average Price (Rs)</th>
                          <th className="p-3">Gross Sales Revenue (Rs)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productPerformance.map((p, idx) => (
                          <tr key={idx} className="border-t hover:bg-muted/40">
                            <td className="p-3 font-bold text-muted-foreground">#{idx + 1}</td>
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3">{p.quantity}</td>
                            <td className="p-3">Rs {p.avgPrice.toFixed(2)}</td>
                            <td className="p-3 font-bold text-teal-600">Rs {p.totalRevenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
