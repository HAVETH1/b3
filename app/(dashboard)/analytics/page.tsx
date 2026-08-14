import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsClient } from './AnalyticsClient'
import { getLast6Months, getMonthRange } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const months = getLast6Months()
  const earliest = getMonthRange(months[0]).start
  const latest   = getMonthRange(months[months.length - 1]).end

  const [txnRes, profileRes] = await Promise.all([
    supabase.from('transactions').select('type,amount,category,date').eq('user_id', user.id).gte('date', earliest).lte('date', latest),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  const transactions = txnRes.data ?? []
  const currency = profileRes.data?.currency ?? 'INR'

  // Build monthly data
  const monthlyData = months.map(m => {
    const { start, end } = getMonthRange(m)
    const monthTxns = transactions.filter(t => t.date >= start && t.date <= end)
    return {
      month: m,
      income:  monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })

  // Category breakdown (all time in range)
  const catMap: Record<string, number> = {}
  for (const t of transactions.filter(t => t.type === 'expense')) {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  }

  return (
    <AnalyticsClient
      monthlyData={monthlyData}
      categoryData={catMap}
      currency={currency}
    />
  )
}
