export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category: string
  description: string | null
  date: string
  payment_method: string | null
  receipt_url?: string | null
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  limit: number
  month: string // 'YYYY-MM'
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  icon: string | null
  color: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  currency: string
  theme: string
  created_at: string
}

export interface BudgetWithSpent extends Budget {
  spent: number
  remaining: number
  percentage: number
  status: 'safe' | 'warning' | 'exceeded'
}

export interface KPISummary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
  prevMonthExpenses: number
  prevMonthIncome: number
}
