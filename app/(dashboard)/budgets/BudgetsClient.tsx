'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/Progress'
import { createClient } from '@/lib/supabase/client'
import { getCategoryMeta, CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatMonth } from '@/lib/utils'
import { Budget } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface Props { budgets: Budget[]; spentMap: Record<string, number>; userId: string; currentMonth: string; currency: string }

const STATUS_LABEL: Record<string, string> = { safe: 'On Track', warning: 'Near Limit', exceeded: 'Over Budget' }
const STATUS_BADGE: Record<string, string> = { safe: 'badge-success', warning: 'badge-warning', exceeded: 'badge-danger' }

export function BudgetsClient({ budgets, spentMap, userId, currentMonth, currency }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState<Budget | null>(null)
  const [deleting, setDeleting]     = useState<Budget | null>(null)
  const [deleteLoading, setDelLoad] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [category, setCategory]     = useState('')
  const [limit, setLimit]           = useState('')
  const [month, setMonth]           = useState(currentMonth)
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const fmt = (n: number) => formatCurrency(n, currency)
  const expCats = CATEGORIES.expense

  const openAdd = () => { setEditing(null); setCategory(''); setLimit(''); setMonth(currentMonth); setErrors({}); setFormOpen(true) }
  const openEdit = (b: Budget) => { setEditing(b); setCategory(b.category); setLimit(String(b.limit)); setMonth(b.month); setErrors({}); setFormOpen(true) }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!category) e.category = 'Select a category'
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) e.limit = 'Enter a valid limit'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    const payload = { user_id: userId, category, limit: Number(limit), month }
    let err
    if (editing) {
      const res = await supabase.from('budgets').update(payload).eq('id', editing.id)
      err = res.error
    } else {
      const res = await supabase.from('budgets').insert(payload)
      err = res.error
    }
    setLoading(false)
    if (err) { showToast(err.message, 'error'); return }
    showToast(editing ? 'Budget updated!' : 'Budget created!', 'success')
    setFormOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDelLoad(true)
    const supabase = createClient()
    const { error } = await supabase.from('budgets').delete().eq('id', deleting.id)
    setDelLoad(false)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Budget deleted', 'success')
    setDeleting(null)
    router.refresh()
  }

  const budgetsWithSpent = useMemo(() =>
    budgets.map(b => {
      const spent = spentMap[b.category] ?? 0
      const pct   = Math.min(Math.round((spent / b.limit) * 100), 100)
      const status = pct >= 100 ? 'exceeded' : pct >= 75 ? 'warning' : 'safe'
      return { ...b, spent, remaining: Math.max(b.limit - spent, 0), pct, status }
    })
  , [budgets, spentMap])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof budgetsWithSpent>()
    for (const b of budgetsWithSpent) {
      if (!map.has(b.month)) map.set(b.month, [])
      map.get(b.month)!.push(b)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [budgetsWithSpent])

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} · {formatMonth(currentMonth)}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> New Budget</button>
      </div>

      {budgets.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No budgets yet</div>
            <div className="empty-state-desc">Create your first budget to start tracking and controlling your spending by category.</div>
            <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Create Budget</button>
          </div>
        </div>
      ) : (
        grouped.map(([m, bList]) => (
          <div key={m} style={{ marginBottom: '28px' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {formatMonth(m)}
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>({bList.length} budgets)</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {bList.map((b) => {
                const cat = getCategoryMeta(b.category)
                return (
                  <div key={b.id} className="budget-card">
                    <div className="budget-card-header">
                      <div className="budget-category">
                        <div className="budget-icon" style={{ background: `${cat.color}18` }}>{cat.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{cat.label}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatMonth(b.month)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={`badge ${STATUS_BADGE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                        <button onClick={() => openEdit(b)} className="btn btn-ghost btn-icon" title="Edit" aria-label="Edit budget"><Pencil size={14} /></button>
                        <button onClick={() => setDeleting(b)} className="btn btn-ghost btn-icon" title="Delete" aria-label="Delete budget" style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Spent</span>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                          <span style={{ color: b.status === 'exceeded' ? 'var(--color-danger)' : b.status === 'warning' ? 'var(--color-warning)' : 'var(--color-text)' }}>
                            {fmt(b.spent)}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}> / {fmt(b.limit)}</span>
                        </span>
                      </div>
                      <ProgressBar value={b.pct} status={b.status as any} height={10} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{b.pct}% used</span>
                      <span style={{ fontWeight: 600, color: b.status === 'exceeded' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {b.status === 'exceeded' ? `${fmt(b.spent - b.limit)} over` : `${fmt(b.remaining)} left`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Budget' : 'Create Budget'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</button>
            <button form="budget-form" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Budget'}
            </button>
          </>
        }
      >
        <form id="budget-form" onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label htmlFor="b-category" className="form-label required">Category</label>
            <select id="b-category" className={`select ${errors.category ? 'error' : ''}`} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select expense category</option>
              {expCats.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
            {errors.category && <span className="form-error">{errors.category}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="b-limit" className="form-label required">Budget Limit</label>
            <input id="b-limit" type="number" className={`input ${errors.limit ? 'error' : ''}`} placeholder="e.g. 5000" value={limit} onChange={e => setLimit(e.target.value)} min="1" step="1" />
            {errors.limit && <span className="form-error">{errors.limit}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="b-month" className="form-label required">Month</label>
            <input id="b-month" type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Budget"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleting(null)} disabled={deleteLoading}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Delete the budget for <strong style={{ color: 'var(--color-text)' }}>{deleting ? getCategoryMeta(deleting.category).label : ''}</strong>?
          <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-danger)', fontSize: '0.875rem' }}>This action cannot be undone.</span>
        </p>
      </Modal>
    </>
  )
}
