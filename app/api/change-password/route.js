import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function verifyAdmin(authHeader) {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  })
  if (!res.ok) return null
  const user = await res.json()
  if (!user?.id) return null
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? profile : null
}

export async function POST(request) {
  const caller = await verifyAdmin(request.headers.get('Authorization'))
  if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, password } = await request.json()
  const { error } = await adminClient.auth.admin.updateUserById(id, { password })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
