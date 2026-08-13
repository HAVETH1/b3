import { createClient } from '@/lib/supabase/client'
import { Transaction, Budget, Goal } from '@/types'

const supabase = createClient()

// ─────────────────────────────────────────────
// SAMPLE DATA GENERATOR
// ─────────────────────────────────────────────

function getDateNMonthsAgo(n: number, day: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n, day)
  return d.toISOString().split('T')[0]
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getMonthOffset(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function loadSeedData(userId: string) {
  const transactions: Omit<Transaction, 'id' | 'created_at'>[] = [
    // Current month
    { user_id: userId, type: 'income', amount: 85000, category: 'salary', description: 'Monthly salary — August', date: getDateNMonthsAgo(0, 1), payment_method: 'net_banking' },
    { user_id: userId, type: 'income', amount: 12500, category: 'freelance', description: 'UI Design project', date: getDateNMonthsAgo(0, 5), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 450, category: 'food', description: 'Swiggy order', date: getDateNMonthsAgo(0, 2), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 1200, category: 'food', description: 'Weekend grocery', date: getDateNMonthsAgo(0, 7), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 3200, category: 'rent', description: 'Monthly rent', date: getDateNMonthsAgo(0, 3), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 890, category: 'transport', description: 'Ola & Uber rides', date: getDateNMonthsAgo(0, 4), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 2400, category: 'shopping', description: 'Amazon haul', date: getDateNMonthsAgo(0, 6), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 650, category: 'entertainment', description: 'Netflix + Spotify', date: getDateNMonthsAgo(0, 1), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 1500, category: 'healthcare', description: 'Doctor consultation', date: getDateNMonthsAgo(0, 8), payment_method: 'cash' },
    { user_id: userId, type: 'expense', amount: 1800, category: 'bills', description: 'Electricity + Internet', date: getDateNMonthsAgo(0, 5), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 3500, category: 'food', description: 'Friends dinner', date: getDateNMonthsAgo(0, 10), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 500, category: 'fitness', description: 'Gym membership', date: getDateNMonthsAgo(0, 1), payment_method: 'upi' },

    // Previous month
    { user_id: userId, type: 'income', amount: 85000, category: 'salary', description: 'Monthly salary — July', date: getDateNMonthsAgo(1, 1), payment_method: 'net_banking' },
    { user_id: userId, type: 'income', amount: 8000, category: 'freelance', description: 'Logo design project', date: getDateNMonthsAgo(1, 12), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 3800, category: 'food', description: 'Monthly food expenses', date: getDateNMonthsAgo(1, 10), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 22000, category: 'rent', description: 'Monthly rent', date: getDateNMonthsAgo(1, 3), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 5600, category: 'shopping', description: 'Myntra sale', date: getDateNMonthsAgo(1, 18), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 1200, category: 'transport', description: 'Monthly commute', date: getDateNMonthsAgo(1, 15), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 650, category: 'entertainment', description: 'Netflix + Spotify', date: getDateNMonthsAgo(1, 5), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 1800, category: 'bills', description: 'Electricity + Internet', date: getDateNMonthsAgo(1, 7), payment_method: 'upi' },

    // 2 months ago
    { user_id: userId, type: 'income', amount: 85000, category: 'salary', description: 'Monthly salary — June', date: getDateNMonthsAgo(2, 1), payment_method: 'net_banking' },
    { user_id: userId, type: 'income', amount: 15000, category: 'freelance', description: 'App development', date: getDateNMonthsAgo(2, 20), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 4200, category: 'food', description: 'Monthly food', date: getDateNMonthsAgo(2, 10), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 22000, category: 'rent', description: 'Monthly rent', date: getDateNMonthsAgo(2, 3), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 18000, category: 'travel', description: 'Goa trip', date: getDateNMonthsAgo(2, 14), payment_method: 'credit_card' },
    { user_id: userId, type: 'expense', amount: 1800, category: 'bills', description: 'Utilities', date: getDateNMonthsAgo(2, 7), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 3200, category: 'shopping', description: 'Electronics purchase', date: getDateNMonthsAgo(2, 22), payment_method: 'credit_card' },

    // 3 months ago
    { user_id: userId, type: 'income', amount: 85000, category: 'salary', description: 'Monthly salary — May', date: getDateNMonthsAgo(3, 1), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 3900, category: 'food', description: 'Monthly food', date: getDateNMonthsAgo(3, 10), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 22000, category: 'rent', description: 'Monthly rent', date: getDateNMonthsAgo(3, 3), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 1800, category: 'bills', description: 'Utilities', date: getDateNMonthsAgo(3, 7), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 900, category: 'transport', description: 'Monthly commute', date: getDateNMonthsAgo(3, 20), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 8000, category: 'education', description: 'Online course', date: getDateNMonthsAgo(3, 15), payment_method: 'credit_card' },

    // 4 months ago
    { user_id: userId, type: 'income', amount: 85000, category: 'salary', description: 'Monthly salary — April', date: getDateNMonthsAgo(4, 1), payment_method: 'net_banking' },
    { user_id: userId, type: 'income', amount: 6000, category: 'investment', description: 'Dividend income', date: getDateNMonthsAgo(4, 25), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 3600, category: 'food', description: 'Monthly food', date: getDateNMonthsAgo(4, 10), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 22000, category: 'rent', description: 'Monthly rent', date: getDateNMonthsAgo(4, 3), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 1800, category: 'bills', description: 'Utilities', date: getDateNMonthsAgo(4, 7), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 12000, category: 'personal_care', description: 'Skincare products', date: getDateNMonthsAgo(4, 18), payment_method: 'credit_card' },

    // 5 months ago
    { user_id: userId, type: 'income', amount: 85000, category: 'salary', description: 'Monthly salary — March', date: getDateNMonthsAgo(5, 1), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 3400, category: 'food', description: 'Monthly food', date: getDateNMonthsAgo(5, 10), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 22000, category: 'rent', description: 'Monthly rent', date: getDateNMonthsAgo(5, 3), payment_method: 'net_banking' },
    { user_id: userId, type: 'expense', amount: 1800, category: 'bills', description: 'Utilities', date: getDateNMonthsAgo(5, 7), payment_method: 'upi' },
    { user_id: userId, type: 'expense', amount: 2200, category: 'healthcare', description: 'Annual checkup', date: getDateNMonthsAgo(5, 20), payment_method: 'cash' },
  ]

  const budgets: Omit<Budget, 'id' | 'created_at'>[] = [
    { user_id: userId, category: 'food', limit: 8000, month: getCurrentMonth() },
    { user_id: userId, category: 'transport', limit: 3000, month: getCurrentMonth() },
    { user_id: userId, category: 'shopping', limit: 5000, month: getCurrentMonth() },
    { user_id: userId, category: 'entertainment', limit: 2000, month: getCurrentMonth() },
    { user_id: userId, category: 'bills', limit: 3000, month: getCurrentMonth() },
    { user_id: userId, category: 'healthcare', limit: 3000, month: getCurrentMonth() },
    { user_id: userId, category: 'rent', limit: 25000, month: getCurrentMonth() },
    { user_id: userId, category: 'food', limit: 8000, month: getMonthOffset(1) },
    { user_id: userId, category: 'shopping', limit: 5000, month: getMonthOffset(1) },
    { user_id: userId, category: 'bills', limit: 3000, month: getMonthOffset(1) },
  ]

  const goals: Omit<Goal, 'id' | 'created_at'>[] = [
    { user_id: userId, name: 'Emergency Fund', target_amount: 300000, current_amount: 125000, target_date: getDateNMonthsAgo(-6, 1), icon: '🛡️', color: '#10B981' },
    { user_id: userId, name: 'Goa Trip', target_amount: 50000, current_amount: 32000, target_date: getDateNMonthsAgo(-2, 1), icon: '✈️', color: '#4F46E5' },
    { user_id: userId, name: 'New MacBook', target_amount: 150000, current_amount: 45000, target_date: getDateNMonthsAgo(-4, 1), icon: '💻', color: '#8B5CF6' },
    { user_id: userId, name: 'Home Down Payment', target_amount: 1000000, current_amount: 200000, target_date: getDateNMonthsAgo(-24, 1), icon: '🏠', color: '#F59E0B' },
  ]

  await supabase.from('transactions').insert(transactions)
  await supabase.from('budgets').insert(budgets)
  await supabase.from('goals').insert(goals)
}
