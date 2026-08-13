import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InsightsClient } from './InsightsClient'
import { getCurrentMonth, getPreviousMonth, getMonthRange } from '@/lib/utils'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month     = getCurrentMonth()
  const prevMonth = getPreviousMonth(month)
  const { start, end }         = getMonthRange(month)
  const { start: ps, end: pe } = getMonthRange(prevMonth)

  const [currTxnRes, prevTxnRes, budgetRes, profileRes, allTxnRes] = await Promise.all([
    supabase.from('transactions').select('type,amount,category').eq('user_id', user.id).gte('date', start).lte('date', end),
    supabase.from('transactions').select('type,amount,category').eq('user_id', user.id).gte('date', ps).lte('date', pe),
    supabase.from('budgets').select('*').eq('month', month).eq('user_id', user.id),
    supabase.from('profiles').select('currency,full_name').eq('id', user.id).single(),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
  ])

  const curr = currTxnRes.data ?? []
  const prev = prevTxnRes.data ?? []
  const allTransactions = allTxnRes.data ?? []

  const currIncome  = curr.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const currExpense = curr.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const prevIncome  = prev.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const prevExpense = prev.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Category maps
  const currCatMap: Record<string, number> = {}
  const prevCatMap: Record<string, number> = {}
  for (const t of curr.filter(t => t.type === 'expense')) currCatMap[t.category] = (currCatMap[t.category] ?? 0) + t.amount
  for (const t of prev.filter(t => t.type === 'expense')) prevCatMap[t.category] = (prevCatMap[t.category] ?? 0) + t.amount

  // Budget spent map
  const budgets = budgetRes.data ?? []
  const budgetWithSpent = budgets.map(b => ({
    ...b, spent: currCatMap[b.category] ?? 0,
    pct: Math.round(((currCatMap[b.category] ?? 0) / b.limit) * 100)
  }))

  return (
    <InsightsClient
      currIncome={currIncome} currExpense={currExpense}
      prevIncome={prevIncome} prevExpense={prevExpense}
      currCatMap={currCatMap} prevCatMap={prevCatMap}
      budgets={budgetWithSpent}
      allTransactions={allTransactions}
      currency={profileRes.data?.currency ?? 'INR'}
    />
  )
}
