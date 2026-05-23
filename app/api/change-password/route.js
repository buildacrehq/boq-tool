import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return Response.json({ error: 'No auth header' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  })
  if (!res.ok) return Response.json({ error: `Auth fetch failed: ${res.status}` }, { status: 401 })

  const user = await res.json()
  if (!user?.id) return Response.json({ error: 'No user in token' }, { status: 401 })

  const { data: profile, error: profErr } = await adminClient.from('profiles').select('role').eq('id', user.id).single()
  if (profErr) return Response.json({ error: `Profile error: ${profErr.message}` }, { status: 401 })
  if (!profile) return Response.json({ error: `No profile for ${user.id}` }, { status: 401 })
  if (profile.role !== 'admin') return Response.json({ error: `Role is ${profile.role}, not admin` }, { status: 401 })

  const { id, password } = await request.json()
  const { error } = await adminClient.auth.admin.updateUserById(id, { password })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ success: true })
}
