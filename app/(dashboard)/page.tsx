import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import { getCurrentMonth, getMonthRange, getPreviousMonth } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  // Auth is already enforced by layout.tsx — reuse the session directly
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const month = getCurrentMonth()
  const { start, end } = getMonthRange(month)
  const prevMonth = getPreviousMonth(month)
  const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth)

  const [
    profileRes,
    txnRes,
    prevTxnRes,
    budgetRes,
    goalsRes,
    recentRes,
    expenseTxnRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('type,amount').gte('date', start).lte('date', end).eq('user_id', user.id),
    supabase.from('transactions').select('type,amount').gte('date', prevStart).lte('date', prevEnd).eq('user_id', user.id),
    supabase.from('budgets').select('*').eq('month', month).eq('user_id', user.id),
    supabase.from('goals').select('*').eq('user_id', user.id).limit(3),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
    supabase.from('transactions').select('category,amount').eq('type', 'expense').eq('user_id', user.id).gte('date', start).lte('date', end),
  ])

  const transactions = txnRes.data ?? []
  const prevTransactions = prevTxnRes.data ?? []
  const budgets = budgetRes.data ?? []
  const profile = profileRes.data

  // KPI calculations
  const monthlyIncome   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevIncome      = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevExpenses    = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalBalance    = monthlyIncome - monthlyExpenses
  const savingsRate     = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0

  // Build real spending map per category for budget tracking
  const spentMap: Record<string, number> = {}
  for (const t of expenseTxnRes.data ?? []) {
    spentMap[t.category] = (spentMap[t.category] ?? 0) + t.amount
  }

  return (
    <DashboardClient
      profile={profile}
      userId={user.id}
      kpi={{ totalBalance, monthlyIncome, monthlyExpenses, savingsRate, prevMonthExpenses: prevExpenses, prevMonthIncome: prevIncome }}
      budgets={budgets}
      spentMap={spentMap}
      goals={goalsRes.data ?? []}
      recentTransactions={recentRes.data ?? []}
      currency={profile?.currency ?? 'INR'}
    />
  )
}

