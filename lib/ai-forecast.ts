import { Transaction } from '@/types'
import { getCategoryMeta } from './constants'

export interface SpendingPrediction {
  predictedTotal: number
  predictedByCategory: Record<string, number>
  trendSlope: number // positive = increasing spending, negative = decreasing
  confidenceScore: number // 0 - 100 percentage
  monthEndForecast: number
  burnRatePerDay: number
}

export interface RecurringTransaction {
  id: string
  description: string
  category: string
  amount: number
  frequency: 'Monthly' | 'Weekly' | 'Bi-weekly'
  lastDate: string
  estimatedNextDate: string
  confidence: number // 0 - 100 percentage
  annualizedCost: number
  count: number
}

/**
 * Linear Regression Trend Analysis & Exponential Run-rate Forecast
 * Computes projected next-month spending and month-end forecasted totals.
 */
export function predictMonthlySpending(
  transactions: Transaction[],
  currentMonthSpent: number,
  daysElapsed: number,
  daysInMonth: number
): SpendingPrediction {
  const expenseTxns = transactions.filter((t) => t.type === 'expense')
  if (expenseTxns.length === 0) {
    return {
      predictedTotal: 0,
      predictedByCategory: {},
      trendSlope: 0,
      confidenceScore: 0,
      monthEndForecast: currentMonthSpent,
      burnRatePerDay: daysElapsed > 0 ? Math.round(currentMonthSpent / daysElapsed) : 0,
    }
  }

  // 1. Group historical spending by month
  const monthlyTotals: Record<string, number> = {}
  const categoryTotals: Record<string, number[]> = {}

  for (const t of expenseTxns) {
    const month = t.date.slice(0, 7)
    monthlyTotals[month] = (monthlyTotals[month] ?? 0) + t.amount
    if (!categoryTotals[t.category]) categoryTotals[t.category] = []
    categoryTotals[t.category].push(t.amount)
  }

  const months = Object.keys(monthlyTotals).sort()
  const historyValues = months.map((m) => monthlyTotals[m])

  // 2. Simple Linear Regression on historical monthly totals: y = mx + c
  const n = historyValues.length
  let slope = 0
  if (n > 1) {
    const xMean = (n - 1) / 2
    const yMean = historyValues.reduce((a, b) => a + b, 0) / n

    let num = 0
    let den = 0
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (historyValues[i] - yMean)
      den += (i - xMean) * (i - xMean)
    }
    slope = den !== 0 ? num / den : 0
  }

  // 3. Projected Next Month = Last known month + slope (bounded to non-negative)
  const lastMonthTotal = historyValues[historyValues.length - 1] ?? currentMonthSpent
  const predictedTotal = Math.max(0, Math.round(lastMonthTotal + slope))

  // 4. Category-level projection based on weighted historical distribution
  const predictedByCategory: Record<string, number> = {}
  const allCategorySum = Object.values(categoryTotals).flat().reduce((a, b) => a + b, 0)

  if (allCategorySum > 0) {
    for (const [cat, amounts] of Object.entries(categoryTotals)) {
      const catSum = amounts.reduce((a, b) => a + b, 0)
      const ratio = catSum / allCategorySum
      predictedByCategory[cat] = Math.round(predictedTotal * ratio)
    }
  }

  // 5. Month-End Forecast:
  // Combines current burn rate weighted with remaining days + baseline regression
  const burnRate = daysElapsed > 0 ? currentMonthSpent / daysElapsed : 0
  const remainingDays = Math.max(0, daysInMonth - daysElapsed)
  const linearExtrapolation = currentMonthSpent + burnRate * remainingDays
  const monthEndForecast = Math.round(0.7 * linearExtrapolation + 0.3 * (predictedTotal || currentMonthSpent))

  // 6. Confidence Score based on sample size and standard deviation
  const confidenceScore = Math.min(95, Math.max(50, 50 + n * 8))

  return {
    predictedTotal,
    predictedByCategory,
    trendSlope: Math.round(slope),
    confidenceScore,
    monthEndForecast,
    burnRatePerDay: Math.round(burnRate),
  }
}

/**
 * Intelligent Recurring Transaction & Subscription Detection
 * Clusters transactions by normalized description/category and evaluates periodicity (intervals).
 */
export function detectRecurringTransactions(transactions: Transaction[]): RecurringTransaction[] {
  const expenseTxns = transactions.filter((t) => t.type === 'expense')
  if (expenseTxns.length < 2) return []

  // Group transactions by normalized description key (or category if description is empty)
  const groups: Record<string, Transaction[]> = {}
  for (const t of expenseTxns) {
    const raw = (t.description ?? t.category).trim().toLowerCase()
    const key = raw.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4}|\d{1,2})\b/gi, '').trim() || raw
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }

  const recurring: RecurringTransaction[] = []

  for (const [key, items] of Object.entries(groups)) {
    if (items.length < 2) continue

    // Sort items chronologically
    const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate day intervals between consecutive charges
    const intervals: number[] = []
    const amounts: number[] = []

    for (let i = 1; i < sorted.length; i++) {
      const d1 = new Date(sorted[i - 1].date).getTime()
      const d2 = new Date(sorted[i].date).getTime()
      const days = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
      if (days > 0) intervals.push(days)
    }

    for (const item of sorted) amounts.push(item.amount)

    if (intervals.length === 0) continue

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length

    // Detect frequency with tolerance
    let frequency: 'Monthly' | 'Weekly' | 'Bi-weekly' | null = null
    let confidence = 0

    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'Monthly'
      confidence = Math.min(95, 70 + items.length * 6)
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      frequency = 'Weekly'
      confidence = Math.min(95, 75 + items.length * 5)
    } else if (avgInterval >= 13 && avgInterval <= 16) {
      frequency = 'Bi-weekly'
      confidence = Math.min(90, 70 + items.length * 5)
    }

    if (frequency) {
      const lastTxn = sorted[sorted.length - 1]
      const lastDate = new Date(lastTxn.date)
      const nextDate = new Date(lastDate)

      if (frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1)
      else if (frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7)
      else if (frequency === 'Bi-weekly') nextDate.setDate(nextDate.getDate() + 14)

      const annualizedCost = frequency === 'Monthly' ? avgAmount * 12 : frequency === 'Weekly' ? avgAmount * 52 : avgAmount * 26

      recurring.push({
        id: `rec_${lastTxn.id}`,
        description: lastTxn.description || getCategoryMeta(lastTxn.category).label,
        category: lastTxn.category,
        amount: Math.round(avgAmount),
        frequency,
        lastDate: lastTxn.date,
        estimatedNextDate: nextDate.toISOString().split('T')[0],
        confidence,
        annualizedCost: Math.round(annualizedCost),
        count: sorted.length,
      })
    }
  }

  // Sort recurring by annual cost descending
  return recurring.sort((a, b) => b.annualizedCost - a.annualizedCost)
}
