'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trash2, Pencil, ArrowUpDown, Filter, Radio, Receipt, ExternalLink, Eye } from 'lucide-react'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { getCategoryMeta, CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Transaction } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface Props { transactions: Transaction[]; userId: string; currency: string }

type SortField = 'date' | 'amount' | 'category'
type SortDir   = 'asc' | 'desc'

export function TransactionsClient({ transactions, userId, currency }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [search, setSearch]         = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter, setCatFilter]   = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [sortField, setSortField]   = useState<SortField>('date')
  const [sortDir, setSortDir]       = useState<SortDir>('desc')
  const [txnOpen, setTxnOpen]       = useState(false)
  const [editing, setEditing]       = useState<Transaction | null>(null)
  const [deleting, setDeleting]     = useState<Transaction | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)
  const [deleteLoading, setDelLoad] = useState(false)
  const [realtimeActive, setRealtimeActive] = useState(false)

  const fmt = (n: number) => formatCurrency(n, currency)

  // ─────────────────────────────────────────────
  // SUPABASE REALTIME SUBSCRIPTION
  // ─────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`realtime:transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            showToast('Real-time sync: New transaction added!', 'info')
          } else if (payload.eventType === 'DELETE') {
            showToast('Real-time sync: Transaction removed', 'info')
          } else if (payload.eventType === 'UPDATE') {
            showToast('Real-time sync: Transaction updated', 'info')
          }
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
  }, [userId, router, showToast])

  const allCats = [...CATEGORIES.income, ...CATEGORIES.expense]
  const months = useMemo(() => {
    const s = new Set(transactions.map(t => t.date.slice(0, 7)))
    return [...s].sort().reverse()
  }, [transactions])

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        (t.description ?? '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      )
    }
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter)
    if (catFilter) list = list.filter(t => t.category === catFilter)
    if (monthFilter) list = list.filter(t => t.date.startsWith(monthFilter))

    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date')     cmp = a.date.localeCompare(b.date)
      if (sortField === 'amount')   cmp = a.amount - b.amount
      if (sortField === 'category') cmp = a.category.localeCompare(b.category)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [transactions, search, typeFilter, catFilter, monthFilter, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDelLoad(true)
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', deleting.id)
    setDelLoad(false)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Transaction deleted', 'success')
    setDeleting(null)
    router.refresh()
  }

  const totals = useMemo(() => ({
    income:  filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filtered])

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => toggleSort(field)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0 }}>
      {label}
      {sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
    </button>
  )

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Transactions</h1>
            {realtimeActive && (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px' }} title="Subscribed to Supabase Realtime changes">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Live Sync
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>{transactions.length} transactions · {fmt(totals.income)} in · {fmt(totals.expense)} out</p>
        </div>
        <button onClick={() => { setEditing(null); setTxnOpen(true) }} className="btn btn-primary">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={15} className="input-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input className="input search-input" placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="select" style={{ minWidth: '130px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select className="select" style={{ minWidth: '150px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">All categories</option>
              {allCats.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
            </select>
            <select className="select" style={{ minWidth: '130px' }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
              <option value="">All months</option>
              {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
            </select>
            {(search || typeFilter !== 'all' || catFilter || monthFilter) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setTypeFilter('all'); setCatFilter(''); setMonthFilter('') }}>
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">{transactions.length === 0 ? 'No transactions yet' : 'No results found'}</div>
            <div className="empty-state-desc">
              {transactions.length === 0
                ? 'Start by adding your first income or expense transaction.'
                : 'Try adjusting your search or filters.'}
            </div>
            {transactions.length === 0 && (
              <button onClick={() => setTxnOpen(true)} className="btn btn-primary"><Plus size={16} /> Add Transaction</button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th><SortBtn field="category" label="Category" /></th>
                  <th>Description</th>
                  <th><SortBtn field="date" label="Date" /></th>
                  <th>Method</th>
                  <th>Receipt</th>
                  <th style={{ textAlign: 'right' }}><SortBtn field="amount" label="Amount" /></th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => {
                  const cat = getCategoryMeta(txn.category)
                  const pm = txn.payment_method?.replace('_', ' ') ?? '—'
                  return (
                    <tr key={txn.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '8px', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                            {cat.icon}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.label}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {txn.description || '—'}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{formatDate(txn.date)}</td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', background: 'var(--color-border-light)', padding: '2px 8px', borderRadius: '20px' }}>
                          {pm}
                        </span>
                      </td>
                      <td>
                        {txn.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(txn.receipt_url!)}
                            className="btn btn-ghost btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', padding: '3px 8px', fontSize: '0.78rem' }}
                            title="View receipt"
                          >
                            <Receipt size={13} /> View
                          </button>
                        ) : (
                          <span style={{ color: 'var(--color-text-disabled)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span className={txn.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                          {txn.type === 'income' ? '+' : '−'}{fmt(txn.amount)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditing(txn); setTxnOpen(true) }} className="btn btn-ghost btn-icon" title="Edit" aria-label="Edit transaction">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleting(txn)} className="btn btn-ghost btn-icon" title="Delete" aria-label="Delete transaction" style={{ color: 'var(--color-danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionForm
        open={txnOpen} onClose={() => { setTxnOpen(false); setEditing(null) }}
        onSaved={() => router.refresh()}
        editing={editing} userId={userId} currency={currency}
      />

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Transaction"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleting(null)} disabled={deleteLoading}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Are you sure you want to delete this transaction?
          {deleting && <strong style={{ display: 'block', marginTop: '8px', color: 'var(--color-text)' }}>
            {deleting.description || getCategoryMeta(deleting.category).label} — {fmt(deleting.amount)}
          </strong>}
          <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-danger)', fontSize: '0.875rem' }}>This action cannot be undone.</span>
        </p>
      </Modal>

      {/* Receipt Viewer Modal */}
      <Modal
        open={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        title="Transaction Receipt"
        maxWidth={640}
        footer={
          <>
            {viewingReceipt && (
              <a
                href={viewingReceipt}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> Open in New Tab
              </a>
            )}
            <button className="btn btn-primary" onClick={() => setViewingReceipt(null)}>Close</button>
          </>
        }
      >
        {viewingReceipt && (
          <div style={{ textAlign: 'center', maxHeight: '70vh', overflow: 'auto' }}>
            {viewingReceipt.endsWith('.pdf') ? (
              <iframe src={viewingReceipt} style={{ width: '100%', height: '500px', border: 'none' }} title="PDF Receipt" />
            ) : (
              <img
                src={viewingReceipt}
                alt="Uploaded Receipt"
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 'var(--radius-md)', objectFit: 'contain', margin: '0 auto', boxShadow: 'var(--shadow-md)' }}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
