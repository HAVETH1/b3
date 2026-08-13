'use client'

import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TopBarProps {
  title: string
  onMenuClick: () => void
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return (
    <header className="topbar">
      <button
        className="btn btn-ghost btn-icon"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
        style={{ display: 'none' }}
        id="sidebar-toggle"
      >
        <Menu size={20} />
      </button>
      <h1 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text)', flex: 1, letterSpacing: '-0.2px' }}>
        {title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-icon"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  )
}
