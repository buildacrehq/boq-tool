'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CATEGORIES = ['material', 'sand', 'aggregate', 'steel', 'masonry', 'labour', 'electrical', 'plumbing', 'painting', 'window', 'railing', 'door', 'sump', 'service', 'provision', 'staircase', 'terrace', 'site', 'tiles', 'concrete']

export default function PricesPage() {
  const router = useRouter()
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [edited, setEdited] = useState({})
  const [activeCategory, setActiveCategory] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    fetchPrices()
  }, [])

  async function fetchPrices() {
    const { data } = await supabase.from('market_prices').select('*').order('category').order('item_name')
    setPrices(data || [])
    setLoading(false)
  }

  async function savePrice(item) {
    const newPrice = parseFloat(edited[item.id] ?? item.price)
    if (isNaN(newPrice)) return
    setSaving(item.id)

    // Save price history
    await supabase.from('price_history').insert({
      item_name: item.item_name,
      old_price: item.price,
      new_price: newPrice,
      changed_by: user?.name,
    })

    // Update price
    await supabase.from('market_prices').update({
      price: newPrice,
      updated_by: user?.name,
      updated_at: new Date().toISOString(),
    }).eq('id', item.id)

    setSaving(null)
    setEdited(prev => { const n = {...prev}; delete n[item.id]; return n })
    fetchPrices()
  }

  const categories = ['all', ...new Set(prices.map(p => p.category).filter(Boolean))]
  const filtered = activeCategory === 'all' ? prices : prices.filter(p => p.category === activeCategory)

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Market Prices</h1>
            <p className="text-sm text-gray-400 mt-0.5">Update daily rates — changes apply to all new estimates</p>
          </div>
          <button onClick={() => router.push('/prices/history')} className="text-sm text-blue-600 hover:underline">View price history →</button>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Current Price (₹)</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">New Price (₹)</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-800">{item.item_name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.unit || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">₹{Number(item.price).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        className="w-32 h-8 text-right text-sm ml-auto"
                        placeholder={item.price}
                        value={edited[item.id] ?? ''}
                        onChange={e => setEdited(prev => ({ ...prev, [item.id]: e.target.value }))}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      {edited[item.id] && (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          disabled={saving === item.id}
                          onClick={() => savePrice(item)}
                        >
                          {saving === item.id ? 'Saving...' : 'Update'}
                        </Button>
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