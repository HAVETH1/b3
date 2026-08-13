'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/constants'
import { Transaction } from '@/types'
import { useToast } from '@/components/ui/Toast'
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react'

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Transaction | null
  userId: string
  currency?: string
}

const today = () => new Date().toISOString().split('T')[0]

export function TransactionForm({ open, onClose, onSaved, editing, userId, currency = 'INR' }: TransactionFormProps) {
  const { showToast } = useToast()
  const [type, setType]           = useState<'income' | 'expense'>('expense')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState('')
  const [description, setDesc]    = useState('')
  const [date, setDate]           = useState(today())
  const [paymentMethod, setPM]    = useState('upi')
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setType(editing.type)
      setAmount(String(editing.amount))
      setCategory(editing.category)
      setDesc(editing.description ?? '')
      setDate(editing.date)
      setPM(editing.payment_method ?? 'upi')
      setReceiptUrl(editing.receipt_url ?? null)
    } else {
      setType('expense')
      setAmount('')
      setCategory('')
      setDesc('')
      setDate(today())
      setPM('upi')
      setReceiptUrl(null)
    }
    setErrors({})
  }, [editing, open])

  const cats = CATEGORIES[type]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error')
      return
    }

    setUploadingReceipt(true)
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${userId}/${cleanFileName}`

    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (error) {
        console.warn('Storage upload error:', error.message)
        showToast(`Receipt upload notice: ${error.message}`, 'warning')
        setUploadingReceipt(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)
      setReceiptUrl(publicUrl)
      showToast('Receipt uploaded successfully!', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload receipt', 'error')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid amount'
    if (!category) e.category = 'Select a category'
    if (!date) e.date = 'Select a date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()
    const payload = {
      user_id: userId, type, amount: Number(amount),
      category, description: description || null,
      date, payment_method: paymentMethod,
      receipt_url: receiptUrl,
    }
    let err
    if (editing) {
      const res = await supabase.from('transactions').update(payload).eq('id', editing.id)
      err = res.error
    } else {
      const res = await supabase.from('transactions').insert(payload)
      err = res.error
    }
    setLoading(false)
    if (err) { showToast(err.message, 'error'); return }
    showToast(editing ? 'Transaction updated!' : 'Transaction added!', 'success')
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Transaction' : 'Add Transaction'}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading || uploadingReceipt}>Cancel</button>
          <button form="txn-form" type="submit" className="btn btn-primary" disabled={loading || uploadingReceipt}>
            {loading ? 'Saving...' : uploadingReceipt ? 'Uploading receipt...' : editing ? 'Save Changes' : 'Add Transaction'}
          </button>
        </>
      }
    >
      <form id="txn-form" onSubmit={handleSubmit} noValidate>
        {/* Type Toggle */}
        <div className="form-group">
          <label className="form-label">Transaction Type</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${type === 'income' ? 'active-income' : ''}`}
              onClick={() => { setType('income'); setCategory('') }}
            >💰 Income</button>
            <button
              type="button"
              className={`type-toggle-btn ${type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => { setType('expense'); setCategory('') }}
            >💸 Expense</button>
          </div>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="txn-amount" className="form-label required">Amount</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '1rem' }}>
              {currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
            </span>
            <input
              id="txn-amount" type="number" className={`input ${errors.amount ? 'error' : ''}`}
              placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="0" step="0.01" style={{ paddingLeft: '30px' }}
            />
          </div>
          {errors.amount && <span className="form-error">{errors.amount}</span>}
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="txn-category" className="form-label required">Category</label>
          <select
            id="txn-category" className={`select ${errors.category ? 'error' : ''}`}
            value={category} onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {cats.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          {errors.category && <span className="form-error">{errors.category}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="txn-desc" className="form-label">Description</label>
          <input
            id="txn-desc" type="text" className="input"
            placeholder="e.g. Swiggy order, monthly salary…"
            value={description} onChange={(e) => setDesc(e.target.value)}
            maxLength={120}
          />
        </div>

        {/* Date + Payment in a row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="txn-date" className="form-label required">Date</label>
            <input
              id="txn-date" type="date" className={`input ${errors.date ? 'error' : ''}`}
              value={date} onChange={(e) => setDate(e.target.value)} max={today()}
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="txn-payment" className="form-label">Payment Method</label>
            <select id="txn-payment" className="select" value={paymentMethod} onChange={(e) => setPM(e.target.value)}>
              {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Receipt Attachment (Supabase Storage) */}
        <div className="form-group">
          <label className="form-label">Attach Receipt (Cloud Storage)</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
          />
          {receiptUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <ImageIcon size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  View Attached Receipt
                </a>
              </div>
              <button
                type="button"
                onClick={() => setReceiptUrl(null)}
                className="btn btn-ghost btn-icon"
                title="Remove receipt"
                aria-label="Remove receipt"
                style={{ color: 'var(--color-danger)' }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingReceipt}
              className="btn btn-secondary w-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
            >
              <Upload size={16} />
              {uploadingReceipt ? 'Uploading to Supabase Storage...' : 'Upload Receipt / Bill Image'}
            </button>
          )}
          <span className="form-hint">Supports PNG, JPG, WebP, PDF up to 5MB</span>
        </div>
      </form>
    </Modal>
  )
}
