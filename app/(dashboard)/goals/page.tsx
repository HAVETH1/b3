import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoalsClient } from './GoalsClient'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [goalsRes, profileRes] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('profiles').select('currency').eq('id', user.id).single(),
  ])

  return (
    <GoalsClient
      goals={goalsRes.data ?? []}
      userId={user.id}
      currency={profileRes.data?.currency ?? 'INR'}
    />
  )
}
