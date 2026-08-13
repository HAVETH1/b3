import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, txnCountRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  return (
    <SettingsClient
      profile={profileRes.data}
      email={user.email ?? ''}
      txnCount={txnCountRes.count ?? 0}
      userId={user.id}
    />
  )
}
