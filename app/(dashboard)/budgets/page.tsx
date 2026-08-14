import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BudgetsClient } from './BudgetsClient'
import { getCurrentMonth, getMonthRange } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month = getCurrentMonth()
  const { start, end } = getMonthRange(month)

  const [budgetRes, txnRes, profileRes] = await Promise.all([
    supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('transactions').select('category,amount,date').eq('type', 'expense').eq('user_id', user.id).gte('date', start).lte('date', end),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  // Compute spent per category for the current month
  const spentMap: Record<string, number> = {}
  for (const t of txnRes.data ?? []) {
    spentMap[t.category] = (spentMap[t.category] ?? 0) + t.amount
  }

  return (
    <BudgetsClient
      budgets={budgetRes.data ?? []}
      spentMap={spentMap}
      userId={user.id}
      currentMonth={month}
      currency={profileRes.data?.currency ?? 'INR'}
    />
  )
}
