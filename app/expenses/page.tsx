"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search, Trash2, Edit3, Receipt, DollarSign, Calendar, TrendingDown, ArrowUpRight, BarChart3, Tag, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import AuthGuard from "@/components/auth-guard"
import Link from "next/link"
import { ExpenseStorage, type ExpenseItem, EXPENSE_CATEGORIES } from "@/lib/expense-storage"

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    category: "cogs" as ExpenseItem["category"],
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "cash" as ExpenseItem["paymentMethod"],
    notes: ""
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = () => {
    setExpenses(ExpenseStorage.getExpenses())
  }

  const handleOpenAddModal = () => {
    setEditingExpense(null)
    setFormData({
      title: "",
      category: "cogs",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "cash",
      notes: ""
    })
    setIsDialogOpen(true)
  }

  const handleOpenEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense)
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount.toString(),
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || ""
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.amount) return

    const amountNum = parseFloat(formData.amount)

    if (editingExpense) {
      ExpenseStorage.updateExpense(editingExpense.id, {
        title: formData.title,
        category: formData.category,
        amount: amountNum,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      })
    } else {
      ExpenseStorage.addExpense({
        title: formData.title,
        category: formData.category,
        amount: amountNum,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      })
    }

    setIsDialogOpen(false)
    loadExpenses()
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      ExpenseStorage.deleteExpense(id)
      loadExpenses()
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = 
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCat = selectedCategory === "all" || exp.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [expenses, searchQuery, selectedCategory])

  const totalExpenseSum = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0)
  }, [expenses])

  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {}
    expenses.forEach(exp => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount
    })
    return map
  }, [expenses])

  return (
    <AuthGuard>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="w-8 h-8 text-rose-500" />
              Expense Ledger & Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Record business purchases, rent, utility bills, and salaries for profit calculation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/reports">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                View Profit Analytics
              </Button>
            </Link>
            <Button onClick={handleOpenAddModal} className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Outflow</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                Rs {totalExpenseSum.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{expenses.length} Total Records Logged</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">COGS / Purchases</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                Rs {(categoryTotals['cogs'] || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Inventory stock purchases</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Salaries & Rent</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                Rs {((categoryTotals['salaries'] || 0) + (categoryTotals['rent'] || 0)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Payroll & store rent</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Utilities & Misc</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                Rs {((categoryTotals['utilities'] || 0) + (categoryTotals['other'] || 0)).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Bills & repairs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
            <Button
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </Button>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedCategory === key ? "default" : "outline"}
                onClick={() => setSelectedCategory(key)}
              >
                {cat.label.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* Expenses List */}
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-500" />
              Expense Items ({filteredExpenses.length})
            </CardTitle>
            <CardDescription>All recorded business expenditures affecting profit margins</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No expense records match your search or filter.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-xs uppercase font-semibold">
                    <tr>
                      <th className="p-3">Title / Details</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Amount (Rs)</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredExpenses.map((exp) => {
                      const categoryInfo = EXPENSE_CATEGORIES[exp.category] || { label: exp.category, color: '#6B7280' }
                      return (
                        <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3">
                            <p className="font-semibold text-foreground">{exp.title}</p>
                            {exp.notes && <p className="text-xs text-muted-foreground mt-0.5">{exp.notes}</p>}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs" style={{ borderColor: categoryInfo.color, color: categoryInfo.color }}>
                              {categoryInfo.label}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                            Rs {exp.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {exp.date}
                          </td>
                          <td className="p-3 text-xs capitalize">
                            <span className="px-2 py-1 bg-muted rounded-md font-medium">
                              {exp.paymentMethod.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-500 hover:text-blue-700"
                                onClick={() => handleOpenEditModal(exp)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-rose-500 hover:text-rose-700"
                                onClick={() => handleDelete(exp.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Record New Business Expense"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Expense Title / Description *</label>
                <Input
                  placeholder="e.g. Electricity Bill or Stock Purchase"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Amount (Rs) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">EasyPaisa</option>
                    <option value="card">Credit/Debit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Notes / Receipt Ref</label>
                <Input
                  placeholder="Optional notes or voucher number..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">
                  {editingExpense ? "Update Record" : "Save Expense"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
