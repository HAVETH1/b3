'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, PieChart, BarChart2, Target, Lightbulb } from 'lucide-react'

const NAV = [
  { label: 'Home',      href: '/',            icon: LayoutDashboard },
  { label: 'Txns',     href: '/transactions', icon: ArrowLeftRight  },
  { label: 'Budgets',  href: '/budgets',      icon: PieChart        },
  { label: 'Analytics',href: '/analytics',    icon: BarChart2       },
  { label: 'Goals',    href: '/goals',        icon: Target          },
  { label: 'Insights', href: '/insights',     icon: Lightbulb       },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav-items">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={`mobile-nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
