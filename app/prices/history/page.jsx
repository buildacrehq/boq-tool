'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'

export default function PriceHistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const { data } = await supabase.from('price_history').select('*').order('changed_at', { ascending: false }).limit(100)
    setHistory(data || [])
    setLoading(false)
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.push('/prices')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-2xl font-semibold text-gray-800">Price History</h1>
        </div>

        {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Item</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Old Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">New Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Change</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Changed By</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No price changes yet</td></tr>
                ) : history.map(h => {
                  const diff = h.new_price - h.old_price
                  const pct = h.old_price ? ((diff / h.old_price) * 100).toFixed(1) : 0
                  return (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-800">{h.item_name}</td>
                      <td className="px-4 py-3 text-right text-gray-500">₹{Number(h.old_price).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">₹{Number(h.new_price).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diff > 0 ? '▲' : '▼'} {Math.abs(pct)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{h.changed_by || '—'}</td>
                      <td className="px-6 py-3 text-gray-400">{new Date(h.changed_at).toLocaleString('en-IN')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}