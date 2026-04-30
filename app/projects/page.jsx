'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  const filtered = projects.filter(p =>
    p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.site_address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Projects</h1>
          <Button onClick={() => router.push('/projects/new')}>+ New BOQ</Button>
        </div>

        <input
          type="text"
          placeholder="Search by client name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">No projects found.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Dimension</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Floors</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                    <td className="px-6 py-3 font-medium text-gray-800">{p.client_name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.site_address || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.dimension_width}×{p.dimension_length} ft</td>
                    <td className="px-4 py-3 text-gray-600">{p.floors === 1 ? 'G only' : `G+${p.floors - 1}`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'draft' ? 'bg-amber-100 text-amber-700' : p.status === 'shared' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-xs text-blue-600 hover:underline">View →</button>
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