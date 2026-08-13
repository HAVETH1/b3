/**
 * FinanceIQ — Utility Function Tests
 * Tests core business logic: currency formatting, date calculations,
 * KPI computations, and financial insight rules.
 */

import {
  formatCurrency,
  formatDate,
  formatMonth,
  getCurrentMonth,
  getPreviousMonth,
  getMonthRange,
  getLast6Months,
  getPercentChange,
  getDaysRemaining,
  getGreeting,
} from '@/lib/utils'

// ─────────────────────────────────────────────
// Currency Formatting
// ─────────────────────────────────────────────
describe('formatCurrency', () => {
  test('formats INR amounts below 1 lakh correctly', () => {
    expect(formatCurrency(45000, 'INR')).toBe('₹45,000')
    expect(formatCurrency(1500, 'INR')).toBe('₹1,500')
    expect(formatCurrency(0, 'INR')).toBe('₹0')
  })

  test('formats INR amounts in lakhs', () => {
    expect(formatCurrency(100000, 'INR')).toBe('₹1.00L')
    expect(formatCurrency(250000, 'INR')).toBe('₹2.50L')
    expect(formatCurrency(1500000, 'INR')).toBe('₹15.00L')
  })

  test('formats INR amounts in crores', () => {
    expect(formatCurrency(10000000, 'INR')).toBe('₹1.00Cr')
    expect(formatCurrency(50000000, 'INR')).toBe('₹5.00Cr')
  })

  test('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000')
  })

  test('formats EUR correctly', () => {
    expect(formatCurrency(500, 'EUR')).toBe('€500')
  })

  test('formats GBP correctly', () => {
    expect(formatCurrency(750, 'GBP')).toBe('£750')
  })

  test('defaults to INR if currency unrecognized', () => {
    expect(formatCurrency(100, 'XYZ')).toBe('₹100')
  })
})

// ─────────────────────────────────────────────
// Month Utilities
// ─────────────────────────────────────────────
describe('getCurrentMonth', () => {
  test('returns YYYY-MM format', () => {
    const result = getCurrentMonth()
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })
})

describe('getPreviousMonth', () => {
  test('returns previous month correctly', () => {
    expect(getPreviousMonth('2024-03')).toBe('2024-02')
    expect(getPreviousMonth('2024-01')).toBe('2023-12')
  })
})

describe('getMonthRange', () => {
  test('returns correct start and end dates for a month', () => {
    const { start, end } = getMonthRange('2024-02')
    expect(start).toBe('2024-02-01')
    expect(end).toBe('2024-02-29') // 2024 is a leap year
  })

  test('returns correct dates for 31-day month', () => {
    const { start, end } = getMonthRange('2024-01')
    expect(start).toBe('2024-01-01')
    expect(end).toBe('2024-01-31')
  })

  test('returns correct dates for 30-day month', () => {
    const { start, end } = getMonthRange('2024-04')
    expect(start).toBe('2024-04-01')
    expect(end).toBe('2024-04-30')
  })
})

describe('getLast6Months', () => {
  test('returns exactly 6 months', () => {
    const months = getLast6Months()
    expect(months).toHaveLength(6)
  })

  test('months are in chronological order', () => {
    const months = getLast6Months()
    for (let i = 1; i < months.length; i++) {
      expect(months[i] > months[i - 1]).toBe(true)
    }
  })

  test('last month in list is current month', () => {
    const months = getLast6Months()
    expect(months[months.length - 1]).toBe(getCurrentMonth())
  })
})

describe('formatMonth', () => {
  test('formats month string into human-readable text', () => {
    const result = formatMonth('2024-01')
    expect(result).toContain('January')
    expect(result).toContain('2024')
  })
})

// ─────────────────────────────────────────────
// Financial Calculations
// ─────────────────────────────────────────────
describe('getPercentChange', () => {
  test('calculates positive change correctly', () => {
    expect(getPercentChange(12000, 10000)).toBe(20)
  })

  test('calculates negative change correctly', () => {
    expect(getPercentChange(8000, 10000)).toBe(-20)
  })

  test('returns null when previous is 0 (avoid division by zero)', () => {
    expect(getPercentChange(5000, 0)).toBeNull()
  })

  test('returns 0 when no change', () => {
    expect(getPercentChange(10000, 10000)).toBe(0)
  })

  test('rounds to nearest integer', () => {
    expect(getPercentChange(10001, 10000)).toBe(0) // 0.01% rounds to 0
    expect(getPercentChange(10100, 10000)).toBe(1)
  })
})

// ─────────────────────────────────────────────
// KPI Business Logic
// ─────────────────────────────────────────────
describe('Savings Rate Calculation', () => {
  const calcSavingsRate = (income: number, expenses: number): number =>
    income > 0 ? Math.round(((income - expenses) / income) * 100) : 0

  test('calculates savings rate correctly', () => {
    expect(calcSavingsRate(100000, 70000)).toBe(30)
    expect(calcSavingsRate(85000, 60000)).toBe(29)
  })

  test('returns 0 when income is 0', () => {
    expect(calcSavingsRate(0, 5000)).toBe(0)
  })

  test('returns negative when expenses exceed income', () => {
    expect(calcSavingsRate(50000, 60000)).toBe(-20)
  })

  test('returns 100 when no expenses', () => {
    expect(calcSavingsRate(50000, 0)).toBe(100)
  })
})

describe('Budget Utilization', () => {
  const calcBudgetPct = (spent: number, limit: number): number =>
    limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0

  const getBudgetStatus = (pct: number): string =>
    pct >= 100 ? 'exceeded' : pct >= 75 ? 'warning' : 'safe'

  test('calculates safe status correctly', () => {
    expect(getBudgetStatus(calcBudgetPct(3000, 10000))).toBe('safe')
    expect(getBudgetStatus(calcBudgetPct(7000, 10000))).toBe('safe') // 70% < 75%
  })

  test('calculates warning status correctly', () => {
    expect(getBudgetStatus(calcBudgetPct(7500, 10000))).toBe('warning')
    expect(getBudgetStatus(calcBudgetPct(9000, 10000))).toBe('warning') // 90%
  })

  test('calculates exceeded status correctly', () => {
    expect(getBudgetStatus(calcBudgetPct(10000, 10000))).toBe('exceeded')
    expect(getBudgetStatus(calcBudgetPct(12000, 10000))).toBe('exceeded')
  })

  test('caps percentage at 100', () => {
    expect(calcBudgetPct(15000, 10000)).toBe(100) // capped at 100
  })

  test('handles zero limit without division error', () => {
    expect(calcBudgetPct(5000, 0)).toBe(0)
  })
})

// ─────────────────────────────────────────────
// Date & Greeting Utilities
// ─────────────────────────────────────────────
describe('getDaysRemaining', () => {
  test('returns positive for future date', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const result = getDaysRemaining(futureDate.toISOString().split('T')[0])
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThanOrEqual(31)
  })

  test('returns negative for past date', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 10)
    const result = getDaysRemaining(pastDate.toISOString().split('T')[0])
    expect(result).toBeLessThan(0)
  })
})

describe('getGreeting', () => {
  test('returns a valid greeting string', () => {
    const greeting = getGreeting()
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting)
  })
})

// ─────────────────────────────────────────────
// Category Constants
// ─────────────────────────────────────────────
describe('getCategoryMeta', () => {
  const { getCategoryMeta } = require('@/lib/constants')

  test('returns known category metadata', () => {
    const food = getCategoryMeta('food')
    expect(food.label).toBe('Food & Dining')
    expect(food.icon).toBeTruthy()
    expect(food.color).toMatch(/^#/)
  })

  test('returns salary income category', () => {
    const salary = getCategoryMeta('salary')
    expect(salary.label).toBe('Salary')
  })

  test('returns fallback for unknown category', () => {
    const unknown = getCategoryMeta('unknown_xyz')
    expect(unknown.value).toBe('unknown_xyz')
    expect(unknown.icon).toBe('📦')
  })

  test('all expense categories have required fields', () => {
    const { CATEGORIES } = require('@/lib/constants')
    for (const cat of CATEGORIES.expense) {
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('value')
      expect(cat).toHaveProperty('icon')
      expect(cat).toHaveProperty('color')
    }
  })

  test('all income categories have required fields', () => {
    const { CATEGORIES } = require('@/lib/constants')
    for (const cat of CATEGORIES.income) {
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('value')
      expect(cat).toHaveProperty('icon')
      expect(cat).toHaveProperty('color')
    }
  })
})

// ─────────────────────────────────────────────
// AI / ML Spending Prediction Tests
// ─────────────────────────────────────────────
describe('AI Spending Prediction Model', () => {
  const { predictMonthlySpending } = require('@/lib/ai-forecast')

  const sampleTransactions = [
    { id: '1', user_id: 'u1', type: 'expense', amount: 20000, category: 'rent', date: '2024-01-05', payment_method: 'net_banking', created_at: '' },
    { id: '2', user_id: 'u1', type: 'expense', amount: 5000, category: 'food', date: '2024-01-15', payment_method: 'upi', created_at: '' },
    { id: '3', user_id: 'u1', type: 'expense', amount: 22000, category: 'rent', date: '2024-02-05', payment_method: 'net_banking', created_at: '' },
    { id: '4', user_id: 'u1', type: 'expense', amount: 6000, category: 'food', date: '2024-02-15', payment_method: 'upi', created_at: '' },
    { id: '5', user_id: 'u1', type: 'expense', amount: 22000, category: 'rent', date: '2024-03-05', payment_method: 'net_banking', created_at: '' },
    { id: '6', user_id: 'u1', type: 'expense', amount: 7000, category: 'food', date: '2024-03-15', payment_method: 'upi', created_at: '' },
  ]

  test('computes linear regression forecast correctly with positive slope', () => {
    const res = predictMonthlySpending(sampleTransactions, 10000, 10, 30)
    expect(res.predictedTotal).toBeGreaterThan(0)
    expect(res.confidenceScore).toBeGreaterThanOrEqual(50)
    expect(res.burnRatePerDay).toBe(1000) // 10000 / 10 days
    expect(res.monthEndForecast).toBeGreaterThan(0)
  })

  test('handles empty transactions gracefully', () => {
    const res = predictMonthlySpending([], 0, 0, 30)
    expect(res.predictedTotal).toBe(0)
    expect(res.burnRatePerDay).toBe(0)
    expect(res.confidenceScore).toBe(0)
  })

  test('distributes predicted spending proportionally across categories', () => {
    const res = predictMonthlySpending(sampleTransactions, 15000, 15, 30)
    expect(res.predictedByCategory).toHaveProperty('rent')
    expect(res.predictedByCategory).toHaveProperty('food')
    expect(res.predictedByCategory.rent).toBeGreaterThan(res.predictedByCategory.food)
  })
})

// ─────────────────────────────────────────────
// Recurring Transaction & Subscription Detection Tests
// ─────────────────────────────────────────────
describe('Recurring Transaction & Subscription Detection', () => {
  const { detectRecurringTransactions } = require('@/lib/ai-forecast')

  const recurringTxns = [
    // Monthly Netflix: 3 consecutive months ~30 days apart
    { id: 'n1', user_id: 'u1', type: 'expense', amount: 649, category: 'entertainment', description: 'Netflix subscription', date: '2024-01-10', payment_method: 'credit_card', created_at: '' },
    { id: 'n2', user_id: 'u1', type: 'expense', amount: 649, category: 'entertainment', description: 'Netflix subscription', date: '2024-02-10', payment_method: 'credit_card', created_at: '' },
    { id: 'n3', user_id: 'u1', type: 'expense', amount: 649, category: 'entertainment', description: 'Netflix subscription', date: '2024-03-10', payment_method: 'credit_card', created_at: '' },

    // Monthly Rent
    { id: 'r1', user_id: 'u1', type: 'expense', amount: 25000, category: 'rent', description: 'Apartment Rent', date: '2024-01-01', payment_method: 'net_banking', created_at: '' },
    { id: 'r2', user_id: 'u1', type: 'expense', amount: 25000, category: 'rent', description: 'Apartment Rent', date: '2024-02-01', payment_method: 'net_banking', created_at: '' },
    { id: 'r3', user_id: 'u1', type: 'expense', amount: 25000, category: 'rent', description: 'Apartment Rent', date: '2024-03-01', payment_method: 'net_banking', created_at: '' },

    // One-off irregular shopping
    { id: 's1', user_id: 'u1', type: 'expense', amount: 4500, category: 'shopping', description: 'Shoes', date: '2024-02-18', payment_method: 'credit_card', created_at: '' },
  ]

  test('identifies monthly subscriptions and computes annualized cost', () => {
    const detected = detectRecurringTransactions(recurringTxns)
    expect(detected.length).toBeGreaterThanOrEqual(2)

    const netflix = detected.find((d: any) => d.description.toLowerCase().includes('netflix'))
    expect(netflix).toBeDefined()
    expect(netflix?.frequency).toBe('Monthly')
    expect(netflix?.amount).toBe(649)
    expect(netflix?.annualizedCost).toBe(649 * 12)
    expect(netflix?.confidence).toBeGreaterThanOrEqual(70)
  })

  test('does not flag single one-off transactions as recurring', () => {
    const detected = detectRecurringTransactions(recurringTxns)
    const shoes = detected.find((d: any) => d.description.toLowerCase().includes('shoes'))
    expect(shoes).toBeUndefined()
  })

  test('returns empty array when fewer than 2 transactions provided', () => {
    const detected = detectRecurringTransactions([])
    expect(detected).toEqual([])
  })
})

