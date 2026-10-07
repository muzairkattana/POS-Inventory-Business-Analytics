/**
 * Expense Storage Utility for BioCure Healthcare
 * Handles business expense tracking, categories, and Net Profit calculations
 */

export interface ExpenseItem {
  id: string
  title: string
  category: 'cogs' | 'utilities' | 'salaries' | 'rent' | 'marketing' | 'maintenance' | 'other'
  amount: number
  date: string // YYYY-MM-DD
  paymentMethod: 'cash' | 'bank_transfer' | 'jazzcash' | 'easypaisa' | 'card'
  notes?: string
  createdAt: string
  updatedAt: string
}

export const EXPENSE_CATEGORIES: Record<ExpenseItem['category'], { label: string; color: string }> = {
  cogs: { label: 'Purchases / COGS', color: '#EF4444' },
  utilities: { label: 'Utilities (Electricity/Water/Net)', color: '#F59E0B' },
  salaries: { label: 'Staff Salaries', color: '#8B5CF6' },
  rent: { label: 'Shop/Office Rent', color: '#EC4899' },
  marketing: { label: 'Marketing & Ads', color: '#3B82F6' },
  maintenance: { label: 'Maintenance & Repairs', color: '#10B981' },
  other: { label: 'Miscellaneous Expenses', color: '#6B7280' }
}

const STORAGE_KEY = 'biocure_business_expenses'

// Pre-populate initial sample expenses if none exist so user has instant business insights
const INITIAL_DEMO_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    title: 'Monthly Pharmacy Inventory Stock Purchase',
    category: 'cogs',
    amount: 35000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: 'Medicines & clinic supplies restock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'exp-2',
    title: 'Clinic Utility & Electricity Bill',
    category: 'utilities',
    amount: 4500,
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: 'Lesco electricity bill',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'exp-3',
    title: 'Staff Assistant Salary',
    category: 'salaries',
    amount: 18000,
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    notes: 'Monthly salary payout',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export class ExpenseStorage {
  static getExpenses(): ExpenseItem[] {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        // Initialize demo expenses for immediate evaluation
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_EXPENSES))
        return INITIAL_DEMO_EXPENSES
      }
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  static addExpense(expense: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt'>): ExpenseItem {
    const expenses = this.getExpenses()
    const now = new Date().toISOString()
    const newExpense: ExpenseItem = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    }
    const updated = [newExpense, ...expenses]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return newExpense
  }

  static updateExpense(id: string, updates: Partial<ExpenseItem>): ExpenseItem | null {
    const expenses = this.getExpenses()
    const index = expenses.findIndex(e => e.id === id)
    if (index === -1) return null

    const updatedExpense = {
      ...expenses[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    expenses[index] = updatedExpense
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    return updatedExpense
  }

  static deleteExpense(id: string): boolean {
    const expenses = this.getExpenses()
    const filtered = expenses.filter(e => e.id !== id)
    if (filtered.length === expenses.length) return false
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }

  static getTotalExpenses(startDate?: string, endDate?: string): number {
    const expenses = this.getExpenses()
    return expenses
      .filter(exp => {
        if (startDate && exp.date < startDate) return false
        if (endDate && exp.date > endDate) return false
        return true
      })
      .reduce((sum, exp) => sum + exp.amount, 0)
  }
}
