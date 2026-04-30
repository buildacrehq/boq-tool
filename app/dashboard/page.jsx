'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ total: 0, draft: 0, shared: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data } = await supabase.from('projects').select('id, client_name, status, dimension_width, dimension_length, created_at, total_sqft').order('created_at', { ascending: false })
    if (!data) return
    setStats({
      total: data.length,
      draft: data.filter(p => p.status === 'draft').length,
      shared: data.filter(p => p.status === 'shared').length,
    })
    setRecent(data.slice(0, 5))
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">Welcome back{user ? `, ${user.name}` : ''}</p>
          </div>
          <Button onClick={() => router.push('/projects/new')}>+ New BOQ</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Projects', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: 'Draft', value: stats.draft, color: 'bg-amber-50 text-amber-700' },
            { label: 'Shared', value: stats.shared, color: 'bg-green-50 text-green-700' },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl p-5 ${s.color}`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm mt-1 opacity-75">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recent Projects</h2>
            <button onClick={() => router.push('/projects')} className="text-xs text-blue-600 hover:underline">View all</button>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">No projects yet. Create your first BOQ!</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Dimension</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{p.client_name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.dimension_width}×{p.dimension_length} ft</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => router.push(`/projects/${p.id}`)} className="text-xs text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}