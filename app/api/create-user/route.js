import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function getCallerProfile(authHeader) {
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const verifyClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
  const { data: { user } } = await verifyClient.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  return profile
}

export async function POST(request) {
  const profile = await getCallerProfile(request.headers.get('Authorization'))
  if (!profile) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, name, role } = await request.json()
  const { error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
