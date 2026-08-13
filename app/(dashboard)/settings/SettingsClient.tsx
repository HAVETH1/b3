'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Moon, User, Globe, Database, Trash2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CURRENCIES } from '@/lib/constants'
import { Profile } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface Props { profile: Profile | null; email: string; txnCount: number; userId: string }

export function SettingsClient({ profile, email, txnCount, userId }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName]         = useState(profile?.full_name ?? '')
  const [currency, setCurrency] = useState(profile?.currency ?? 'INR')
  const [theme, setTheme]       = useState<'light' | 'dark'>('light')
  const [saving, setSaving]     = useState(false)
  const [deleteOpen, setDelOpen]= useState(false)
  const [deleteLoading, setDL]  = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark') ?? profile?.theme ?? 'light'
    setTheme(saved)
  }, [profile])

  const applyTheme = (t: 'light' | 'dark') => {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('theme', t)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: name, currency, theme }).eq('id', userId)
    setSaving(false)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Profile saved!', 'success')
    router.refresh()
  }

  const handleDeleteAllData = async () => {
    setDL(true)
    const supabase = createClient()
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', userId),
      supabase.from('budgets').delete().eq('user_id', userId),
      supabase.from('goals').delete().eq('user_id', userId),
    ])
    setDL(false)
    setDelOpen(false)
    showToast('All data deleted', 'success')
    router.refresh()
  }

  const handleExportCSV = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false })
    if (!data || data.length === 0) { showToast('No transactions to export', 'warning'); return }
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method']
    const rows = data.map(t => [t.date, t.type, t.category, t.description ?? '', t.amount, t.payment_method ?? ''])
    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `financeiq-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
    showToast('CSV exported!', 'success')
  }

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
          <span className="card-title">{title}</span>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  )

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div style={{ maxWidth: '640px' }}>
        {/* Profile */}
        <Section title="Profile" icon={<User size={18} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="s-name" className="form-label">Display Name</label>
              <input id="s-name" type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="input" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              <span className="form-hint">Email cannot be changed here.</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveProfile} className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Preferences" icon={<Globe size={18} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="s-currency" className="form-label">Currency</label>
              <select id="s-currency" className="select" value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <span className="form-hint">Changes how amounts are displayed throughout the app.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Theme</label>
              <div className="type-toggle" style={{ maxWidth: '240px' }}>
                <button type="button" onClick={() => applyTheme('light')} className={`type-toggle-btn ${theme === 'light' ? 'active-income' : ''}`}>
                  <Sun size={14} style={{ display: 'inline', marginRight: 4 }} /> Light
                </button>
                <button type="button" onClick={() => applyTheme('dark')} className={`type-toggle-btn ${theme === 'dark' ? 'active-expense' : ''}`} style={{ '--active-bg': '#4F46E5' } as any}>
                  <Moon size={14} style={{ display: 'inline', marginRight: 4 }} /> Dark
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSaveProfile} className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </Section>

        {/* Data */}
        <Section title="Data Management" icon={<Database size={18} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface-2)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Export Transactions</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{txnCount} transactions available</div>
              </div>
              <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">Export CSV</button>
            </div>
          </div>
        </Section>

        {/* Danger Zone */}
        <div className="card" style={{ border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-lg)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(239,68,68,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--color-danger)' }}><Trash2 size={18} /></span>
              <span className="card-title" style={{ color: 'var(--color-danger)' }}>Danger Zone</span>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Delete All Data</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Permanently delete all transactions, budgets, and goals.</div>
              </div>
              <button onClick={() => setDelOpen(true)} className="btn btn-danger btn-sm">Delete All</button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => setDelOpen(false)} title="Delete All Data"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDelOpen(false)} disabled={deleteLoading}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteAllData} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Yes, Delete Everything'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          This will permanently delete <strong style={{ color: 'var(--color-text)' }}>all {txnCount} transactions</strong>, all budgets, and all goals from your account.
          <span style={{ display: 'block', marginTop: '10px', color: 'var(--color-danger)', fontWeight: 600 }}>⚠️ This action cannot be undone.</span>
        </p>
      </Modal>
    </>
  )
}
