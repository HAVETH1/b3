'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight, Receipt } from 'lucide-react'
import Link from 'next/link'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { ProgressBar } from '@/components/ui/Progress'
import { formatCurrency, formatDate, getGreeting, getPercentChange } from '@/lib/utils'
import { getCategoryMeta } from '@/lib/constants'
import { KPISummary, Budget, Goal, Transaction, Profile } from '@/types'
import { loadSeedData } from '@/lib/seed'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

interface Props {
  profile: Profile | null
  userId: string
  kpi: KPISummary
  budgets: Budget[]
  spentMap: Record<string, number>
  goals: Goal[]
  recentTransactions: Transaction[]
  currency: string
}

export function DashboardClient({ profile, userId, kpi, budgets, spentMap, goals, recentTransactions, currency }: Props) {
  const [txnOpen, setTxnOpen] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)
  const [realtimeActive, setRealtimeActive] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const fmt = (n: number) => formatCurrency(n, currency)

  // ─────────────────────────────────────────────
  // SUPABASE REALTIME SUBSCRIPTION FOR DASHBOARD
  // ─────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`realtime:dashboard:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  const handleSeedData = async () => {
    setSeedLoading(true)
    try {
      await loadSeedData(userId)
      showToast('Sample data loaded! Refreshing...', 'success')
      router.refresh()
    } catch {
      showToast('Failed to load sample data', 'error')
    } finally {
      setSeedLoading(false)
    }
  }

  const expChange = getPercentChange(kpi.monthlyExpenses, kpi.prevMonthExpenses)
  const incChange  = getPercentChange(kpi.monthlyIncome, kpi.prevMonthIncome)

  const hasData = recentTransactions.length > 0

  // Budget status — uses real spending data passed from server
  const budgetsWithSpent = budgets.slice(0, 4).map(b => {
    const spent = spentMap[b.category] ?? 0
    const pct = b.limit > 0 ? Math.min(Math.round((spent / b.limit) * 100), 100) : 0
    return { ...b, spent, pct, status: (pct >= 100 ? 'exceeded' : pct >= 75 ? 'warning' : 'safe') as 'exceeded' | 'warning' | 'safe' }
  })

  const greeting = getGreeting()
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long' })

  const KPICard = ({
    label, value, icon, changeVal, changeLabel, iconBg, positive
  }: { label: string; value: string; icon: string; changeVal: number | null; changeLabel?: string; iconBg: string; positive?: boolean }) => (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <div className="kpi-icon" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {changeVal !== null && (
        <div className={`kpi-change ${positive ? (changeVal >= 0 ? 'positive' : 'negative') : (changeVal <= 0 ? 'positive' : 'negative')}`}>
          {changeVal >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(changeVal)}% {changeLabel ?? 'vs last month'}
        </div>
      )}
      {changeVal === null && (
        <div className="kpi-change neutral">This month</div>
      )}
    </div>
  )

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.4px', margin: 0 }}>
              {greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
            </h1>
            {realtimeActive && (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px' }} title="Real-time data synchronization enabled">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Live Sync
              </span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Here's your financial overview for {monthName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!hasData && (
            <button onClick={handleSeedData} className="btn btn-secondary" disabled={seedLoading}>
              {seedLoading ? '⟳ Loading...' : '🎲 Load Sample Data'}
            </button>
          )}
          <button onClick={() => setTxnOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <KPICard label="Total Balance" value={fmt(kpi.totalBalance)} icon="💳" iconBg="var(--color-primary-light)" changeVal={null} />
        <KPICard label="Monthly Income" value={fmt(kpi.monthlyIncome)} icon="💰" iconBg="var(--color-success-light)" changeVal={incChange} positive />
        <KPICard label="Monthly Expenses" value={fmt(kpi.monthlyExpenses)} icon="💸" iconBg="var(--color-danger-light)" changeVal={expChange} positive={false} />
        <KPICard label="Savings Rate" value={`${kpi.savingsRate}%`} icon="🏦" iconBg="var(--color-warning-light)" changeVal={null} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent Transactions</div>
              <div className="card-subtitle">Your latest activity</div>
            </div>
            <Link href="/transactions" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!hasData ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No transactions yet</div>
              <div className="empty-state-desc">Start by adding your first transaction or loading sample data to see the dashboard in action.</div>
              <button onClick={() => setTxnOpen(true)} className="btn btn-primary">
                <Plus size={16} /> Add Transaction
              </button>
            </div>
          ) : (
            <div>
              {recentTransactions.map((txn) => {
                const cat = getCategoryMeta(txn.category)
                return (
                  <div key={txn.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 24px', borderBottom: '1px solid var(--color-border-light)', gap: '12px', transition: 'background 150ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {txn.description || cat.label}
                        {txn.receipt_url && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '1px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Receipt attached">
                            <Receipt size={10} /> receipt
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {cat.label} · {formatDate(txn.date)}
                      </div>
                    </div>
                    <div className={txn.type === 'income' ? 'amount-positive' : 'amount-negative'} style={{ fontSize: '0.9375rem', flexShrink: 0 }}>
                      {txn.type === 'income' ? '+' : '−'}{fmt(txn.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Goals */}
          {goals.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Savings Goals</div>
                <Link href="/goals" className="btn btn-ghost btn-sm">View all</Link>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {goals.map((g) => {
                  const pct = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100)
                  const fmt2 = (n: number) => formatCurrency(n, currency)
                  return (
                    <div key={g.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{g.icon ?? '🎯'}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.name}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{pct}%</span>
                      </div>
                      <ProgressBar value={pct} status="safe" height={6} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{fmt2(g.current_amount)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{fmt2(g.target_amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Budget Overview */}
          {budgetsWithSpent.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Budget Overview</div>
                <Link href="/budgets" className="btn btn-ghost btn-sm">View all</Link>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {budgetsWithSpent.map((b) => {
                  const cat = getCategoryMeta(b.category)
                  return (
                    <div key={b.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px' }}>{cat.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cat.label}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: b.status === 'exceeded' ? 'var(--color-danger)' : b.status === 'warning' ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                          {fmt(b.spent)} / {fmt(b.limit)}
                        </span>
                      </div>
                      <ProgressBar value={b.pct} status={b.status} height={6} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="card card-body" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '16px' }}>Quick Summary</div>
            {[
              { label: 'Income this month',  value: fmt(kpi.monthlyIncome),   color: 'var(--color-success)' },
              { label: 'Spent this month',   value: fmt(kpi.monthlyExpenses),  color: 'var(--color-danger)'  },
              { label: 'Net savings',        value: fmt(kpi.totalBalance),     color: kpi.totalBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 700, color, fontSize: '0.9375rem' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Savings rate</span>
              <span style={{ fontWeight: 700, color: kpi.savingsRate >= 20 ? 'var(--color-success)' : 'var(--color-warning)', fontSize: '0.9375rem' }}>{kpi.savingsRate}%</span>
            </div>
          </div>
        </div>
      </div>


      <TransactionForm
        open={txnOpen} onClose={() => setTxnOpen(false)}
        onSaved={() => router.refresh()}
        userId={userId} currency={currency}
      />
    </>
  )
}
