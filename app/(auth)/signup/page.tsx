'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (err) { setError(err.message); setLoading(false); return }

    // Create profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        currency: 'INR',
        theme: 'light',
      })
    }
    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 className="auth-title">Account created!</h1>
          <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
            Please check your email to confirm your account, then sign in.
          </p>
          <Link href="/login" className="btn btn-primary w-full btn-lg">Go to Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">💸</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.3px', color: 'var(--color-text)' }}>FinanceIQ</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Personal Finance</div>
          </div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your finances for free</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name" className="form-label required">Full name</label>
            <input id="name" type="text" className="input" placeholder="Aryan Sharma" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label required">Email address</label>
            <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label required">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password" type={showPw ? 'text' : 'password'} className="input"
                placeholder="Min. 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                autoComplete="new-password" style={{ paddingRight: '40px' }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', padding: '4px' }}
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {password && password.length < 6 && (
              <span className="form-error">Password must be at least 6 characters</span>
            )}
          </div>

          {error && (
            <div style={{ background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.875rem', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading || !name || !email || password.length < 6}>
            {loading ? <><span className="animate-spin" style={{ display: 'inline-block', marginRight: 6 }}>⟳</span>Creating account...</> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
