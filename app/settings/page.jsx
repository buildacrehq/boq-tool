'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const router = useRouter()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    if (u.role !== 'admin') { router.push('/dashboard'); return }
    fetchStaff()
  }, [])

  async function fetchStaff() {
    const { data } = await supabase.from('users').select('id, name, email, role, created_at').order('created_at')
    setStaff(data || [])
    setLoading(false)
  }

  async function addStaff() {
    if (!form.name || !form.email || !form.password) {
      setError('All fields required')
      return
    }
    setSaving(true)
    setError('')
    const { error } = await supabase.from('users').insert({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    })
    if (error) {
      setError(error.message)
    } else {
      setForm({ name: '', email: '', password: '', role: 'staff' })
      setAdding(false)
      fetchStaff()
    }
    setSaving(false)
  }

  async function removeStaff(id) {
    if (id === user?.id) { alert("Can't remove yourself!"); return }
    if (!confirm('Remove this staff member?')) return
    await supabase.from('users').delete().eq('id', id)
    fetchStaff()
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage staff access</p>
          </div>
          {!adding && (
            <Button onClick={() => setAdding(true)}>+ Add Staff</Button>
          )}
        </div>

        {/* Add Staff Form */}
        {adding && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">New Staff Member</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="Full name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@buildacre.com" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" placeholder="Set a password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={form.role} onChange={e => setForm(p => ({...p, role: e.target.value}))}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <div className="flex gap-3 mt-4">
              <Button onClick={addStaff} disabled={saving}>{saving ? 'Adding...' : 'Add Staff'}</Button>
              <Button variant="outline" onClick={() => { setAdding(false); setError('') }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Staff List */}
        {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Added</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">
                      {s.name} {s.id === user?.id && <span className="text-xs text-blue-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-3 text-right">
                      {s.id !== user?.id && (
                        <button onClick={() => removeStaff(s.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}