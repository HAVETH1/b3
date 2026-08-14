import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransactionsClient } from './TransactionsClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [txnRes, profileRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  return (
    <TransactionsClient
      transactions={txnRes.data ?? []}
      userId={user.id}
      currency={profileRes.data?.currency ?? 'INR'}
    />
  )
}
