'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { ToastProvider } from '@/components/ui/Toast'
import { Profile } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/transactions': 'Transactions',
  '/budgets':      'Budgets',
  '/analytics':    'Analytics',
  '/goals':        'Savings Goals',
  '/insights':     'Financial Insights',
  '/settings':     'Settings',
}

interface DashboardShellProps {
  children: React.ReactNode
  profile: Profile | null
}

export function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )?.[1] ?? 'FinanceIQ'

  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) document.documentElement.setAttribute('data-theme', saved)

    // Show hamburger on mobile
    const toggle = document.getElementById('sidebar-toggle')
    if (toggle) toggle.style.display = ''
  }, [])

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
          <main className="page-content">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </ToastProvider>
  )
}
