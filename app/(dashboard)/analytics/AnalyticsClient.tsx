'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { formatCurrency } from '@/lib/utils'
import { getCategoryMeta } from '@/lib/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

interface MonthlyData { month: string; income: number; expense: number }
interface Props { monthlyData: MonthlyData[]; categoryData: Record<string, number>; currency: string }

const MONTH_SHORT: Record<string, string> = {
  '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
  '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'
}

function monthLabel(m: string) {
  const [, mm] = m.split('-')
  return MONTH_SHORT[mm] ?? m
}

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,15,26,0.95)',
      titleColor: '#94A3B8',
      bodyColor: '#F1F5F9',
      borderColor: '#2A2A45',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6B7280', font: { size: 12 } } },
    y: { grid: { color: 'rgba(107,114,128,.12)' }, ticks: { color: '#6B7280', font: { size: 12 } } },
  }
}

export function AnalyticsClient({ monthlyData, categoryData, currency }: Props) {
  const fmt = (n: number) => formatCurrency(n, currency)
  const labels = monthlyData.map(d => monthLabel(d.month))

  const incomeData   = monthlyData.map(d => d.income)
  const expenseData  = monthlyData.map(d => d.expense)
  const savingsData  = monthlyData.map(d => Math.max(d.income - d.expense, 0))

  const totalIncome   = incomeData.reduce((s, n) => s + n, 0)
  const totalExpense  = expenseData.reduce((s, n) => s + n, 0)
  const avgSavingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

  // Category doughnut
  const catEntries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const catLabels  = catEntries.map(([k]) => getCategoryMeta(k).label)
  const catValues  = catEntries.map(([, v]) => v)
  const catColors  = catEntries.map(([k]) => getCategoryMeta(k).color)
  const catIcons   = catEntries.map(([k]) => getCategoryMeta(k).icon)

  const tooltipCallback = (ctx: any) => `${fmt(ctx.parsed.y ?? ctx.parsed)}`

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Income', data: incomeData, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.12)',
        fill: true, tension: 0.4, pointBackgroundColor: '#10B981', pointRadius: 4, pointHoverRadius: 6,
      },
      {
        label: 'Expenses', data: expenseData, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,.08)',
        fill: true, tension: 0.4, pointBackgroundColor: '#EF4444', pointRadius: 4, pointHoverRadius: 6,
      },
    ]
  }

  const barData = {
    labels,
    datasets: [
      { label: 'Income', data: incomeData, backgroundColor: 'rgba(16,185,129,.8)', borderRadius: 6, borderSkipped: false },
      { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(239,68,68,.8)', borderRadius: 6, borderSkipped: false },
    ]
  }

  const savingsLineData = {
    labels,
    datasets: [{
      label: 'Net Savings', data: savingsData, borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,.1)',
      fill: true, tension: 0.4, pointBackgroundColor: '#4F46E5', pointRadius: 4, pointHoverRadius: 6,
    }]
  }

  const doughnutData = {
    labels: catLabels,
    datasets: [{ data: catValues, backgroundColor: catColors.map(c => c + 'CC'), borderColor: catColors, borderWidth: 2 }]
  }

  const hasData = totalIncome > 0 || totalExpense > 0

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Financial trends and insights from the last 6 months</p>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '6-Month Income',   value: fmt(totalIncome),  color: 'var(--color-success)', icon: '💰' },
          { label: '6-Month Expenses', value: fmt(totalExpense), color: 'var(--color-danger)',  icon: '💸' },
          { label: 'Avg Savings Rate', value: `${avgSavingsRate}%`, color: avgSavingsRate >= 20 ? 'var(--color-success)' : 'var(--color-warning)', icon: '📈' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-icon" style={{ background: 'var(--color-border-light)', fontSize: '20px' }}>{icon}</div>
            </div>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value" style={{ fontSize: '1.5rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No data to analyze yet</div>
            <div className="empty-state-desc">Add transactions to see your financial charts and trends appear here.</div>
          </div>
        </div>
      ) : (
        <>
          {/* Line: Income vs Expenses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Income vs Expenses</div>
                  <div className="card-subtitle">Monthly comparison over 6 months</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />Income</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />Expenses</span>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-wrapper" style={{ height: '240px' }}>
                  <Line data={lineData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false }, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: tooltipCallback } } } } as any} />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Monthly Breakdown</div>
                  <div className="card-subtitle">Grouped bar chart</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', background: 'rgba(16,185,129,.8)', display: 'inline-block' }} />Income</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', background: 'rgba(239,68,68,.8)', display: 'inline-block' }} />Expenses</span>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-wrapper" style={{ height: '240px' }}>
                  <Bar data={barData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: tooltipCallback } } } } as any} />
                </div>
              </div>
            </div>
          </div>

          {/* Category Doughnut + Savings trend */}
          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Spending by Category</div>
              </div>
              <div className="card-body">
                {catEntries.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>No expense data</p>
                ) : (
                  <>
                    <div className="chart-wrapper" style={{ height: '220px' }}>
                      <Doughnut data={doughnutData} options={{
                        responsive: true, maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                          legend: { display: false },
                          tooltip: { callbacks: { label: (ctx) => ` ${fmt(ctx.parsed)}` } }
                        }
                      }} />
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {catEntries.slice(0, 5).map(([k, v], i) => {
                        const cat = getCategoryMeta(k)
                        const pct = totalExpense > 0 ? Math.round((v / totalExpense) * 100) : 0
                        return (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                            <span style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{cat.label}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{pct}%</span>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: cat.color }}>{fmt(v)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Net Savings Trend</div>
                  <div className="card-subtitle">Monthly savings (income − expenses)</div>
                </div>
              </div>
              <div className="card-body">
                <div className="chart-wrapper" style={{ height: '300px' }}>
                  <Line data={savingsLineData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, tooltip: { ...chartDefaults.plugins.tooltip, callbacks: { label: tooltipCallback } } } } as any} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
