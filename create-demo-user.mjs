// Script to create a demo user via Supabase Admin API and set up the database
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vwxnetkajgegasfqafqx.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_KEY || ''

async function createDemoUser() {
  console.log('Creating demo user via Admin API...')
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: 'demo@financeiq.app',
      password: 'demo1234',
      email_confirm: true,
      user_metadata: { full_name: 'Demo User' }
    })
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Failed to create user:', JSON.stringify(data, null, 2))
    return null
  }

  console.log('✅ User created! ID:', data.id)
  return data.id
}

async function createProfile(userId) {
  console.log('Creating profile row...')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      full_name: 'Demo User',
      currency: 'INR',
      theme: 'light'
    })
  })

  if (res.ok || res.status === 409) {
    console.log('✅ Profile created (or already exists)')
    return true
  } else {
    const err = await res.text()
    console.error('Profile creation failed:', err)
    
    // Check if it's a "table does not exist" error
    if (err.includes('relation') && err.includes('does not exist')) {
      console.error('\n❌ DATABASE TABLES DO NOT EXIST.')
      console.error('Please run the SQL in supabase-setup.sql in your Supabase SQL Editor first.')
    }
    return false
  }
}

async function main() {
  const userId = await createDemoUser()
  if (!userId) {
    console.log('\nTrying to create profile anyway with test ID...')
    // Maybe user already exists — try to list them
    const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=demo@financeiq.app`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    })
    const listData = await listRes.json()
    console.log('Existing users:', JSON.stringify(listData, null, 2))
    return
  }
  
  await createProfile(userId)
  
  console.log('\n🎉 Demo account ready!')
  console.log('   Email:    demo@financeiq.app')
  console.log('   Password: demo1234')
  console.log('\nOpen http://localhost:3000/login to sign in.')
}

main().catch(console.error)
