'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, ArrowLeftRight, PieChart, BarChart2,
  Target, Lightbulb, Settings, TrendingUp, LogOut, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { Profile } from '@/types'

const NAV = [
  { label: 'Dashboard',    href: '/',             icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions',  icon: ArrowLeftRight  },
  { label: 'Budgets',      href: '/budgets',       icon: PieChart        },
  { label: 'Analytics',    href: '/analytics',     icon: BarChart2       },
  { label: 'Goals',        href: '/goals',         icon: Target          },
  { label: 'Insights',     href: '/insights',      icon: Lightbulb       },
]

interface SidebarProps {
  profile: Profile | null
  open: boolean
  onClose: () => void
}

export function Sidebar({ profile, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    showToast('Signed out successfully', 'success')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 'calc(var(--z-sidebar) - 1)',
            display: 'none',
          }}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💸</div>
          <div>
            <div className="sidebar-logo-text">FinanceIQ</div>
            <div className="sidebar-logo-sub">Personal Finance</div>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', display: 'none' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}

          <div className="sidebar-section-label" style={{ marginTop: 8 }}>Account</div>
          <Link
            href="/settings"
            className={`sidebar-item ${pathname === '/settings' ? 'active' : ''}`}
            onClick={onClose}
          >
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        {/* Footer / User */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name">{profile?.full_name ?? 'User'}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-icon"
              style={{ color: 'rgba(255,255,255,0.4)', padding: '6px' }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
