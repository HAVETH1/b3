'use client'

import { useMemo } from 'react'
import { getCategoryMeta } from '@/lib/constants'
import { formatCurrency, getPercentChange } from '@/lib/utils'
import { Budget, Transaction } from '@/types'
import { predictMonthlySpending, detectRecurringTransactions } from '@/lib/ai-forecast'
import { Brain, Repeat, Sparkles, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react'

interface Props {
  currIncome: number; currExpense: number
  prevIncome: number; prevExpense: number
  currCatMap: Record<string, number>
  prevCatMap: Record<string, number>
  budgets: (Budget & { spent: number; pct: number })[]
  allTransactions?: Transaction[]
  currency: string
}

interface Insight {
  type: 'success' | 'info' | 'warning' | 'danger'
  icon: string
  title: string
  text: string
}

export function InsightsClient({ currIncome, currExpense, prevIncome, prevExpense, currCatMap, prevCatMap, budgets, allTransactions = [], currency }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency)

  // ─────────────────────────────────────────────
  // 1. AI/ML SPENDING PREDICTION ENGINE
  // ─────────────────────────────────────────────
  const now = new Date()
  const currentDay = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const aiForecast = useMemo(() => {
    return predictMonthlySpending(allTransactions, currExpense, currentDay, daysInMonth)
  }, [allTransactions, currExpense, currentDay, daysInMonth])

  // ─────────────────────────────────────────────
  // 2. RECURRING SUBSCRIPTION DETECTION ENGINE
  // ─────────────────────────────────────────────
  const recurringItems = useMemo(() => {
    return detectRecurringTransactions(allTransactions)
  }, [allTransactions])

  const totalRecurringAnnual = useMemo(() => {
    return recurringItems.reduce((sum, item) => sum + item.annualizedCost, 0)
  }, [recurringItems])

  const totalRecurringMonthly = useMemo(() => {
    return Math.round(totalRecurringAnnual / 12)
  }, [totalRecurringAnnual])

  // ─────────────────────────────────────────────
  // 3. RULE-BASED INSIGHT GENERATION
  // ─────────────────────────────────────────────
  const insights: Insight[] = []
  const hasData = currIncome > 0 || currExpense > 0

  if (hasData) {
    // Savings rate
    const savingsRate = currIncome > 0 ? Math.round(((currIncome - currExpense) / currIncome) * 100) : 0
    const prevRate    = prevIncome > 0 ? Math.round(((prevIncome - prevExpense) / prevIncome) * 100) : 0

    if (savingsRate >= 30) {
      insights.push({ type: 'success', icon: '🚀', title: 'Excellent Savings Rate', text: `You're saving ${savingsRate}% of your income this month — well above the recommended 20%. Great financial discipline!` })
    } else if (savingsRate >= 20) {
      insights.push({ type: 'success', icon: '📈', title: 'Healthy Savings Rate', text: `You're saving ${savingsRate}% of your income this month, which meets the recommended 20% benchmark.` })
    } else if (savingsRate > 0) {
      insights.push({ type: 'warning', icon: '⚠️', title: 'Low Savings Rate', text: `Your savings rate is ${savingsRate}% this month. Aim for at least 20% by reducing discretionary expenses.` })
    } else if (savingsRate < 0) {
      insights.push({ type: 'danger', icon: '🚨', title: 'Spending Exceeds Income', text: `You've spent ${fmt(Math.abs(currIncome - currExpense))} more than you earned this month. Review your expenses immediately.` })
    }

    // Savings rate change
    if (prevRate > 0) {
      const diff = savingsRate - prevRate
      if (diff > 5) {
        insights.push({ type: 'success', icon: '📊', title: 'Savings Rate Improved', text: `Your savings rate improved by ${diff}% compared to last month (${prevRate}% → ${savingsRate}%). Keep it up!` })
      } else if (diff < -5) {
        insights.push({ type: 'warning', icon: '📉', title: 'Savings Rate Declined', text: `Your savings rate dropped by ${Math.abs(diff)}% vs last month (${prevRate}% → ${savingsRate}%). Look for ways to cut spending.` })
      }
    }

    // Expense change
    const expChange = getPercentChange(currExpense, prevExpense)
    if (expChange !== null) {
      if (expChange > 20) {
        insights.push({ type: 'warning', icon: '💸', title: 'Expenses Increased Significantly', text: `Your total expenses are up ${expChange}% compared to last month (${fmt(prevExpense)} → ${fmt(currExpense)}). Identify where the extra spending went.` })
      } else if (expChange < -10) {
        insights.push({ type: 'success', icon: '✅', title: 'Expenses Reduced', text: `Great job! You reduced your expenses by ${Math.abs(expChange)}% vs last month (${fmt(prevExpense)} → ${fmt(currExpense)}).` })
      }
    }

    // Income change
    const incChange = getPercentChange(currIncome, prevIncome)
    if (incChange !== null && incChange > 10) {
      insights.push({ type: 'success', icon: '💰', title: 'Income Increased', text: `Your income grew by ${incChange}% this month (${fmt(prevIncome)} → ${fmt(currIncome)}). Consider investing the extra income.` })
    }

    // Top spending category
    const topCat = Object.entries(currCatMap).sort((a, b) => b[1] - a[1])[0]
    if (topCat) {
      const [catKey, catAmt] = topCat
      const cat = getCategoryMeta(catKey)
      const prevAmt = prevCatMap[catKey] ?? 0
      const catChange = getPercentChange(catAmt, prevAmt)
      if (catChange !== null && catChange > 25) {
        insights.push({ type: 'warning', icon: cat.icon, title: `${cat.label} Spending Up`, text: `Your top spending category "${cat.label}" increased by ${catChange}% this month (${fmt(prevAmt)} → ${fmt(catAmt)}).` })
      } else {
        insights.push({ type: 'info', icon: cat.icon, title: `Top Category: ${cat.label}`, text: `Your highest spending this month is on ${cat.label} at ${fmt(catAmt)}, which is ${currExpense > 0 ? Math.round((catAmt / currExpense) * 100) : 0}% of total expenses.` })
      }
    }

    // Budget alerts
    for (const b of budgets) {
      if (b.pct >= 100) {
        const cat = getCategoryMeta(b.category)
        insights.push({ type: 'danger', icon: '🔴', title: `Budget Exceeded: ${cat.label}`, text: `You've exceeded your ${cat.label} budget by ${fmt(b.spent - b.limit)}. Your limit was ${fmt(b.limit)} but you spent ${fmt(b.spent)}.` })
      } else if (b.pct >= 80) {
        const cat = getCategoryMeta(b.category)
        insights.push({ type: 'warning', icon: '⚡', title: `Budget Alert: ${cat.label}`, text: `You've used ${b.pct}% of your ${cat.label} budget (${fmt(b.spent)} of ${fmt(b.limit)}). Only ${fmt(b.limit - b.spent)} remaining.` })
      }
    }
  }

  const typeOrder = { danger: 0, warning: 1, info: 2, success: 3 }
  const sorted = [...insights].sort((a, b) => typeOrder[a.type] - typeOrder[b.type])

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Financial Insights & AI Intelligence</h1>
        <p className="page-subtitle">Personalized predictive intelligence, spending trends, and detected recurring obligations</p>
      </div>

      {!hasData ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💡</div>
            <div className="empty-state-title">No data to analyze yet</div>
            <div className="empty-state-desc">Add transactions or load sample data to see your AI predictions and financial insights appear here.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {[
              { label: 'This Month Income',   value: fmt(currIncome),  color: 'var(--color-success)' },
              { label: 'This Month Expenses', value: fmt(currExpense), color: 'var(--color-danger)'  },
              { label: 'Net This Month',      value: fmt(currIncome - currExpense), color: (currIncome - currExpense) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
              { label: 'Budgets Monitored',   value: String(budgets.length), color: 'var(--color-primary)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ─────────────────────────────────────────────
              AI/ML SPENDING PREDICTION SECTION
             ───────────────────────────────────────────── */}
          <div className="card" style={{ border: '1px solid var(--color-primary-muted)', background: 'linear-gradient(to bottom right, var(--color-surface), var(--color-primary-light))' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Brain size={18} />
                </div>
                <div>
                  <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    AI Spending Forecast & Burn Rate
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      <Sparkles size={11} style={{ display: 'inline', marginRight: 3 }} /> {aiForecast.confidenceScore}% Confidence
                    </span>
                  </div>
                  <div className="card-subtitle">Statistical linear regression + day-weighted burn rate extrapolation</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '16px' }}>
                <div style={{ padding: '14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>End-of-Month Projected Spend</div>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-text)' }}>{fmt(aiForecast.monthEndForecast)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Based on {currentDay}/{daysInMonth} days elapsed
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Average Daily Burn Rate</div>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-warning)' }}>{fmt(aiForecast.burnRatePerDay)}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)' }}> / day</span></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {daysInMonth - currentDay} days remaining in month
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Next Month Forecast</div>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--color-primary)' }}>{fmt(aiForecast.predictedTotal)}</div>
                  <div style={{ fontSize: '0.75rem', color: aiForecast.trendSlope >= 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {aiForecast.trendSlope >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {aiForecast.trendSlope >= 0 ? `+${fmt(aiForecast.trendSlope)} trend slope` : `${fmt(aiForecast.trendSlope)} trend slope`}
                  </div>
                </div>
              </div>

              {/* Category-wise AI projection chips */}
              {Object.keys(aiForecast.predictedByCategory).length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Projected Spending by Category:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(aiForecast.predictedByCategory).slice(0, 6).map(([catKey, amount]) => {
                      const cat = getCategoryMeta(catKey)
                      return (
                        <div key={catKey} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', fontSize: '0.8rem' }}>
                          <span>{cat.icon}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{cat.label}:</span>
                          <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{fmt(amount)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────
              RECURRING SUBSCRIPTIONS & OBLIGATIONS SECTION
             ───────────────────────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Repeat size={18} />
                  </div>
                  <div>
                    <div className="card-title">Detected Subscriptions & Recurring Bills</div>
                    <div className="card-subtitle">Auto-discovered recurring patterns from your historical transactions</div>
                  </div>
                </div>
                {recurringItems.length > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Estimated Recurring Cost: </span>
                    <strong style={{ color: 'var(--color-text)', fontSize: '0.95rem' }}>{fmt(totalRecurringMonthly)}/mo</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>({fmt(totalRecurringAnnual)}/yr)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="card-body">
              {recurringItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No repeating transaction intervals identified yet. Add regular monthly bills (e.g. Netflix, Rent, Broadband) to activate pattern detection.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {recurringItems.map((item) => {
                    const cat = getCategoryMeta(item.category)
                    return (
                      <div key={item.id} style={{ padding: '14px 16px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{item.description}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cat.label}</div>
                            </div>
                          </div>
                          <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 7px' }}>
                            {item.frequency}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-border-light)' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Charge Amount</div>
                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-danger)' }}>{fmt(item.amount)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Next Est. Bill</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
                              <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
                              {item.estimatedNextDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────
              RULE-BASED INSIGHT DIAGNOSTIC ALERTS
             ───────────────────────────────────────────── */}
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}>
              Spending Diagnostics & Alerts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sorted.length === 0 ? (
                <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  All spending parameters are within normal baseline thresholds!
                </div>
              ) : (
                sorted.map((ins, i) => (
                  <div key={i} className={`insight-card ${ins.type}`}>
                    <div className="insight-icon">{ins.icon}</div>
                    <div className="insight-content">
                      <div className="insight-title">{ins.title}</div>
                      <div className="insight-text">{ins.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
