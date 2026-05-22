'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'

const SIZES = ['20x30', '20x40', '30x40', '30x50', '40x40', '40x60']

const DEFAULT_FLOOR_GROUPS = [
  { prefix: 'gf_parking',     label: 'GF — Parking / Commercial',       note: 'parking_only · parking_lift · commercial_parking' },
  { prefix: 'gf_1bhk',        label: 'GF — 1 BHK',                      note: '1bhk · 1bhk_parking' },
  { prefix: 'gf_1bhk2',       label: 'GF — 1 BHK (2 Units)',             note: '1bhk_2units' },
  { prefix: 'gf_2bhk',        label: 'GF — 2 BHK',                      note: '2bhk · 2bhk_parking' },
  { prefix: 'gf_1bhk2bhk',    label: 'GF — 1 BHK + 2 BHK Mix',          note: '1bhk_2bhk' },
  { prefix: 'gf_3bhk',        label: 'GF — 3 BHK',                      note: '3bhk' },
  { prefix: 'gf_2bhk3bhk',    label: 'GF — 2 BHK + 3 BHK Mix',          note: '2bhk_3bhk' },
  { prefix: 'gf_duplex',      label: 'GF — Duplex',                      note: 'duplex_gf' },
  { prefix: 'uf_1bhk',        label: 'UF — 1 BHK (Single)',              note: '1bhk (upper floors)' },
  { prefix: 'uf_1bhk2',       label: 'UF — 1 BHK (2 Units)',             note: '1bhk_2units (upper floors)' },
  { prefix: 'uf_2bhk',        label: 'UF — 2 BHK',                      note: '2bhk (upper floors)' },
  { prefix: 'uf_3bhk',        label: 'UF — 3 BHK',                      note: '3bhk (upper floors)' },
  { prefix: 'uf_1bhk2bhk',    label: 'UF — 1 BHK + 2 BHK Mix',          note: '1bhk_2bhk (upper floors)' },
  { prefix: 'uf_2bhk3bhk',    label: 'UF — 2 BHK + 3 BHK Mix',          note: '2bhk_3bhk (upper floors)' },
  { prefix: 'uf_duplex',      label: 'UF — Duplex FF / SF',              note: 'duplex_ff · duplex_sf' },
  { prefix: 'uf_duplex2mb',   label: 'UF — Duplex End (2 Master Beds)',  note: 'duplex_end_2mb' },
  { prefix: 'uf_duplexstudy', label: 'UF — Duplex End (+ Study Room)',   note: 'duplex_end_study' },
]

const ROWS = [
  { key: 'blocks', label: 'Blocks',  unit: 'Nos',  divisible: false },
  { key: 'bricks', label: 'Bricks',  unit: 'Nos',  divisible: false },
  { key: 'cement', label: 'Cement',  unit: 'Bags', divisible: true  },
]

export default function CalcSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [rows, setRows] = useState({})
  const [edited, setEdited] = useState({})
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)
  const [loading, setLoading] = useState(true)
  const [floorGroups, setFloorGroups] = useState(DEFAULT_FLOOR_GROUPS)
  const [activeGroup, setActiveGroup] = useState(DEFAULT_FLOOR_GROUPS[0].prefix)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPrefix, setNewPrefix] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [copyFrom, setCopyFrom] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'admin') { router.push('/dashboard'); return }
    setUser(u)
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase.from('boq_quantities').select('*')
    const map = {}
    data?.forEach(r => { map[r.row_key] = r })
    setRows(map)
    // Add any custom prefixes found in DB that aren't in DEFAULT_FLOOR_GROUPS
    const knownPrefixes = new Set(DEFAULT_FLOOR_GROUPS.map(g => g.prefix))
    const customPrefixes = new Set()
    data?.forEach(r => {
      const prefix = r.row_key.replace(/_blocks$|_bricks$|_cement$/, '')
      if (!knownPrefixes.has(prefix)) customPrefixes.add(prefix)
    })
    if (customPrefixes.size > 0) {
      setFloorGroups([
        ...DEFAULT_FLOOR_GROUPS,
        ...[...customPrefixes].map(p => ({ prefix: p, label: p, note: 'Custom floor type' }))
      ])
    }
    setLoading(false)
  }

  async function addFloorType() {
    const prefix = newPrefix.trim().toLowerCase().replace(/\s+/g, '_')
    if (!prefix || !newLabel.trim()) return
    setAddingSaving(true)
    const source = copyFrom ? rows : null
    const base = (suffix) => {
      if (source && copyFrom) {
        const r = source[`${copyFrom}_${suffix}`]
        if (r) return { s20x30: r.s20x30, s20x40: r.s20x40, s30x40: r.s30x40, s30x50: r.s30x50, s40x40: r.s40x40, s40x60: r.s40x60 }
      }
      return { s20x30: 0, s20x40: 0, s30x40: 0, s30x50: 0, s40x40: 0, s40x60: 0 }
    }
    await supabase.from('boq_quantities').upsert([
      { row_key: `${prefix}_blocks`, ...base('blocks'), divisible: false, updated_by: user?.name, updated_at: new Date().toISOString() },
      { row_key: `${prefix}_bricks`, ...base('bricks'), divisible: false, updated_by: user?.name, updated_at: new Date().toISOString() },
      { row_key: `${prefix}_cement`, ...base('cement'), divisible: true,  updated_by: user?.name, updated_at: new Date().toISOString() },
    ], { onConflict: 'row_key' })
    setFloorGroups(prev => [...prev, { prefix, label: newLabel.trim(), note: 'Custom floor type' }])
    setActiveGroup(prefix)
    setNewPrefix(''); setNewLabel(''); setCopyFrom(''); setShowAddForm(false)
    setAddingSaving(false)
    fetchData()
  }

  function cellValue(rowKey, sizeCol) {
    const e = edited[rowKey]?.[sizeCol]
    if (e !== undefined) return e
    return rows[rowKey]?.[sizeCol] ?? ''
  }

  function handleChange(rowKey, sizeCol, val) {
    setEdited(prev => ({
      ...prev,
      [rowKey]: { ...(prev[rowKey] || {}), [sizeCol]: val }
    }))
  }

  function isDirty(rowKey) {
    return !!edited[rowKey] && Object.keys(edited[rowKey]).length > 0
  }

  async function saveRow(rowKey, divisible) {
    const current = rows[rowKey] || {}
    const changes = edited[rowKey] || {}
    const payload = {
      row_key: rowKey,
      s20x30: parseFloat(changes.s20x30 ?? current.s20x30) || 0,
      s20x40: parseFloat(changes.s20x40 ?? current.s20x40) || 0,
      s30x40: parseFloat(changes.s30x40 ?? current.s30x40) || 0,
      s30x50: parseFloat(changes.s30x50 ?? current.s30x50) || 0,
      s40x40: parseFloat(changes.s40x40 ?? current.s40x40) || 0,
      s40x60: parseFloat(changes.s40x60 ?? current.s40x60) || 0,
      divisible,
      updated_by: user?.name,
      updated_at: new Date().toISOString(),
    }
    setSaving(rowKey)
    await supabase.from('boq_quantities').upsert(payload, { onConflict: 'row_key' })
    setSaving(null)
    setSaved(rowKey)
    setTimeout(() => setSaved(null), 1500)
    setEdited(prev => { const n = { ...prev }; delete n[rowKey]; return n })
    fetchData()
  }

  const sizeColMap = { '20x30': 's20x30', '20x40': 's20x40', '30x40': 's30x40', '30x50': 's30x50', '40x40': 's40x40', '40x60': 's40x60' }

  const activeGroupData = floorGroups.find(g => g.prefix === activeGroup)

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">BOQ Quantities</h1>
            <p className="text-sm text-gray-400 mt-0.5">Masonry quantities per floor type and site size — changes apply to all new estimates</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAddForm(v => !v)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              {showAddForm ? 'Cancel' : '+ Add Floor Type'}
            </button>
            <button onClick={() => router.push('/settings')} className="text-sm text-blue-600 hover:underline">← Staff Settings</button>
          </div>
        </div>

        {/* Add Floor Type form */}
        {showAddForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4">
            <p className="text-sm font-semibold text-gray-800">Add New Floor Type</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Prefix key (no spaces)</label>
                <input
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. gf_4bhk"
                  value={newPrefix}
                  onChange={e => setNewPrefix(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Display label</label>
                <input
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. GF — 4 BHK"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Copy values from (optional)</label>
                <select
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={copyFrom}
                  onChange={e => setCopyFrom(e.target.value)}
                >
                  <option value="">— Start with zeros —</option>
                  {floorGroups.map(g => <option key={g.prefix} value={g.prefix}>{g.label}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={addFloorType}
              disabled={!newPrefix.trim() || !newLabel.trim() || addingSaving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {addingSaving ? 'Creating...' : 'Create Floor Type'}
            </button>
          </div>
        )}

        {/* Floor type tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {floorGroups.map(g => (
            <button
              key={g.prefix}
              onClick={() => setActiveGroup(g.prefix)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeGroup === g.prefix
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-800">{activeGroupData?.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">Used for: {activeGroupData?.note}</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 w-32">Material</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-16">Unit</th>
                  {SIZES.map(s => (
                    <th key={s} className="text-center px-2 py-3 text-xs font-medium text-gray-500">{s}</th>
                  ))}
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => {
                  const rowKey = `${activeGroup}_${row.key}`
                  const dirty = isDirty(rowKey)
                  const isSaving = saving === rowKey
                  const wasSaved = saved === rowKey
                  return (
                    <tr key={rowKey} className={`border-b border-gray-50 ${dirty ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-3 font-medium text-gray-800">{row.label}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{row.unit}{row.divisible ? ' *' : ''}</td>
                      {SIZES.map(s => {
                        const col = sizeColMap[s]
                        return (
                          <td key={s} className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              className={`w-20 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                dirty && edited[rowKey]?.[col] !== undefined ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                              }`}
                              value={cellValue(rowKey, col)}
                              onChange={e => handleChange(rowKey, col, e.target.value)}
                            />
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right">
                        {wasSaved ? (
                          <span className="text-xs text-green-600 font-medium">Saved</span>
                        ) : (
                          <button
                            onClick={() => saveRow(rowKey, row.divisible)}
                            disabled={!dirty || isSaving}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">* Cement is divisible — quantity scales proportionally with the actual floor area vs the standard size area.</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
