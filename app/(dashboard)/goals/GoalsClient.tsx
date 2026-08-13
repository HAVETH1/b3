'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, PlusCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ProgressRing } from '@/components/ui/Progress'
import { createClient } from '@/lib/supabase/client'
import { GOAL_ICONS, GOAL_COLORS } from '@/lib/constants'
import { formatCurrency, getDaysRemaining } from '@/lib/utils'
import { Goal } from '@/types'
import { useToast } from '@/components/ui/Toast'

interface Props { goals: Goal[]; userId: string; currency: string }

export function GoalsClient({ goals, userId, currency }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [formOpen, setFormOpen]       = useState(false)
  const [contributeOpen, setContOpen] = useState(false)
  const [editing, setEditing]         = useState<Goal | null>(null)
  const [deleting, setDeleting]       = useState<Goal | null>(null)
  const [contributing, setContrib]    = useState<Goal | null>(null)
  const [loading, setLoading]         = useState(false)

  // Form state
  const [name, setName]         = useState('')
  const [target, setTarget]     = useState('')
  const [current, setCurrent]   = useState('')
  const [date, setDate]         = useState('')
  const [icon, setIcon]         = useState('🎯')
  const [color, setColor]       = useState('#4F46E5')
  const [contAmount, setContAmt]= useState('')

  const fmt = (n: number) => formatCurrency(n, currency)

  const openAdd = () => {
    setEditing(null); setName(''); setTarget(''); setCurrent('0'); setDate(''); setIcon('🎯'); setColor('#4F46E5')
    setFormOpen(true)
  }
  const openEdit = (g: Goal) => {
    setEditing(g); setName(g.name); setTarget(String(g.target_amount))
    setCurrent(String(g.current_amount)); setDate(g.target_date ?? ''); setIcon(g.icon ?? '🎯'); setColor(g.color ?? '#4F46E5')
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !target) return
    setLoading(true)
    const supabase = createClient()
    const payload = { user_id: userId, name, target_amount: Number(target), current_amount: Number(current) || 0, target_date: date || null, icon, color }
    const { error } = editing
      ? await supabase.from('goals').update(payload).eq('id', editing.id)
      : await supabase.from('goals').insert(payload)
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    showToast(editing ? 'Goal updated!' : 'Goal created!', 'success')
    setFormOpen(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleting) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('goals').delete().eq('id', deleting.id)
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    showToast('Goal deleted', 'success')
    setDeleting(null)
    router.refresh()
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contributing || !contAmount) return
    const addAmt = Number(contAmount)
    if (isNaN(addAmt) || addAmt <= 0) return
    setLoading(true)
    const supabase = createClient()
    const newAmt = Math.min(contributing.current_amount + addAmt, contributing.target_amount)
    const { error } = await supabase.from('goals').update({ current_amount: newAmt }).eq('id', contributing.id)
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    showToast(`Added ${fmt(addAmt)} to ${contributing.name}!`, 'success')
    setContOpen(false)
    setContrib(null)
    setContAmt('')
    router.refresh()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="page-subtitle">{goals.length} active goal{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> New Goal</button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-title">No goals yet</div>
            <div className="empty-state-desc">Set a savings goal and track your progress toward it — whether it's a new gadget, a trip, or an emergency fund.</div>
            <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Create Goal</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {goals.map((g) => {
            const pct     = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100)
            const days    = g.target_date ? getDaysRemaining(g.target_date) : null
            const reached = pct >= 100

            return (
              <div key={g.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{g.icon ?? '🎯'}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{g.name}</div>
                    {days !== null && (
                      <div style={{ fontSize: '0.8rem', color: days < 30 ? 'var(--color-warning)' : 'var(--color-text-muted)', marginTop: '4px' }}>
                        {days > 0 ? `${days} days remaining` : reached ? '🎉 Goal reached!' : 'Past due date'}
                      </div>
                    )}
                    {reached && <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>🎉 Goal reached!</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => openEdit(g)} className="btn btn-ghost btn-icon" aria-label="Edit goal"><Pencil size={14} /></button>
                    <button onClick={() => setDeleting(g)} className="btn btn-ghost btn-icon" aria-label="Delete goal" style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <ProgressRing value={pct} size={80} color={reached ? 'var(--color-success)' : (g.color ?? 'var(--color-primary)')}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>{pct}%</span>
                  </ProgressRing>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Saved</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: reached ? 'var(--color-success)' : 'var(--color-text)' }}>{fmt(g.current_amount)}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>of {fmt(g.target_amount)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {fmt(Math.max(g.target_amount - g.current_amount, 0))} to go
                  </span>
                  {!reached && (
                    <button
                      onClick={() => { setContrib(g); setContAmt(''); setContOpen(true) }}
                      className="btn btn-success btn-sm"
                      style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                    >
                      <PlusCircle size={13} /> Contribute
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Goal' : 'New Savings Goal'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)} disabled={loading}>Cancel</button>
            <button form="goal-form" type="submit" className="btn btn-primary" disabled={loading || !name || !target}>
              {loading ? 'Saving...' : editing ? 'Save Changes' : 'Create Goal'}
            </button>
          </>
        }
      >
        <form id="goal-form" onSubmit={handleSave} noValidate>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {GOAL_ICONS.map(ic => (
                <button key={ic} type="button"
                  style={{ fontSize: '20px', padding: '6px 8px', borderRadius: '8px', border: '2px solid', borderColor: icon === ic ? 'var(--color-primary)' : 'transparent', background: icon === ic ? 'var(--color-primary-light)' : 'var(--color-border-light)', cursor: 'pointer' }}
                  onClick={() => setIcon(ic)}>{ic}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="g-name" className="form-label required">Goal Name</label>
            <input id="g-name" type="text" className="input" placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)} required maxLength={60} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="g-target" className="form-label required">Target Amount</label>
              <input id="g-target" type="number" className="input" placeholder="100000" value={target} onChange={e => setTarget(e.target.value)} min="1" />
            </div>
            <div className="form-group">
              <label htmlFor="g-current" className="form-label">Current Amount</label>
              <input id="g-current" type="number" className="input" placeholder="0" value={current} onChange={e => setCurrent(e.target.value)} min="0" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="g-date" className="form-label">Target Date</label>
            <input id="g-date" type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {GOAL_COLORS.map(c => (
                <button key={c} type="button"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '3px solid', borderColor: color === c ? 'var(--color-text)' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal open={contributeOpen} onClose={() => { setContOpen(false); setContrib(null) }} title={`Contribute to ${contributing?.name ?? ''}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { setContOpen(false); setContrib(null) }} disabled={loading}>Cancel</button>
            <button form="contrib-form" type="submit" className="btn btn-success" disabled={loading || !contAmount}>
              {loading ? 'Saving...' : '+ Add Funds'}
            </button>
          </>
        }
      >
        <form id="contrib-form" onSubmit={handleContribute}>
          {contributing && (
            <div style={{ background: 'var(--color-success-light)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Current progress</div>
              <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.125rem' }}>
                {fmt(contributing.current_amount)} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>of {fmt(contributing.target_amount)}</span>
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="contrib-amount" className="form-label required">Amount to Add</label>
            <input id="contrib-amount" type="number" className="input" placeholder="5000" value={contAmount} onChange={e => setContAmt(e.target.value)} min="1" autoFocus />
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Goal"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleting(null)} disabled={loading}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>{loading ? 'Deleting...' : 'Delete'}</button>
          </>
        }
      >
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Delete the goal <strong style={{ color: 'var(--color-text)' }}>{deleting?.name}</strong>?
          <span style={{ display: 'block', marginTop: '8px', color: 'var(--color-danger)', fontSize: '0.875rem' }}>This cannot be undone.</span>
        </p>
      </Modal>
    </>
  )
}
