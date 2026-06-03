'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppLayout from '@/components/layout/AppLayout'

const SIZES = ['20x30', '20x40', '30x40', '30x50', '40x40', '40x60']

const SSM_ROWS = [
  { key: 'ssm_sizestone', label: 'Sizestone',      unit: '₹',       divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'ssm_40mm',      label: '40mm Aggregate', unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'ssm_cement_2c', label: 'Cement',         unit: 'Bags',    divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'ssm_msand_2c',  label: 'M Sand',         unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'ssm_labour_2c', label: 'Labour',         unit: '₹',       divisible: false, type: 'number',  table: 'boq_quantities' },
]

const SSM_DEFAULTS = {
  ssm_sizestone: { s20x30: 15000, s20x40: 25000, s30x40: 50000, s30x50: 60000, s40x40: 60000, s40x60: 100000 },
  ssm_40mm:      { s20x30: '709', s20x40: '709', s30x40: '709', s30x50: '6W', s40x40: '6W', s40x60: '6W' },
  ssm_cement_2c: { s20x30: 20, s20x40: 25, s30x40: 35, s30x50: 50, s40x40: 50, s40x60: 75 },
  ssm_msand_2c:  { s20x30: '709', s20x40: '709', s30x40: '6W', s30x50: '6W', s40x40: '6W', s40x60: '6W' },
  ssm_labour_2c: { s20x30: 15000, s20x40: 15000, s30x40: 30000, s30x50: 30000, s40x40: 30000, s40x60: 40000 },
}

const TERRACE_ROWS = [
  { key: 'terrace_cement', label: 'Cement',        unit: 'Bags',    divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'terrace_msand',  label: 'M Sand',         unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'terrace_slab',   label: 'Slab Concrete',  unit: 'CUM',     divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'terrace_elec',   label: 'Electrical',     unit: '₹',       divisible: false, type: 'number',  table: 'boq_quantities' },
  { key: 'terrace_misc',   label: 'Misc',           unit: '₹',       divisible: false, type: 'number',  table: 'boq_quantities' },
]

const TERRACE_DEFAULTS = {
  terrace_cement: { s20x30: 30,   s20x40: 30,   s30x40: 40,   s30x50: 50,   s40x40: 50,   s40x60: 70 },
  terrace_msand:  { s20x30: '709', s20x40: '709', s30x40: '709', s30x50: '709', s40x40: '709', s40x60: '709' },
  terrace_slab:   { s20x30: 4,    s20x40: 4,    s30x40: 4,    s30x50: 4,    s40x40: 4,    s40x60: 4 },
  terrace_elec:   { s20x30: 5000, s20x40: 5000, s30x40: 5000, s30x50: 5000, s40x40: 5000, s40x60: 5000 },
  terrace_misc:   { s20x30: 5000, s20x40: 5000, s30x40: 5000, s30x50: 5000, s40x40: 5000, s40x60: 5000 },
}

const SCREED_ROWS = [
  { key: 'screed_cement', label: 'Cement',          unit: 'Bags',    divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'screed_psand',  label: 'P Sand',           unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'screed_12mm',   label: '12mm Aggregates',  unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'screed_misc',   label: 'Misc',             unit: '₹',       divisible: false, type: 'number',  table: 'boq_quantities' },
]

const SCREED_DEFAULTS = {
  screed_cement: { s20x30: 20,    s20x40: 30,    s30x40: 40,    s30x50: 40,    s40x40: 40,    s40x60: 60 },
  screed_psand:  { s20x30: '709', s20x40: '709', s30x40: '6W',  s30x50: '6W',  s40x40: '6W',  s40x60: '6W' },
  screed_12mm:   { s20x30: '709', s20x40: '709', s30x40: '709', s30x50: '709', s40x40: '709', s40x60: '709' },
  screed_misc:   { s20x30: 10000, s20x40: 10000, s30x40: 10000, s30x50: 10000, s40x40: 10000, s40x60: 10000 },
}

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

const VEHICLE_OPTIONS = ['', 'Tractor', '709', '6W', '10W']

const SITE_PREP_ROWS = [
  { key: 'site_cleaning', label: 'Site Cleaning', unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'survey',        label: 'Survey',        unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'soil_test',     label: 'Soil Test',     unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'excavation',    label: 'Excavation',    unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'soil_refilling',label: 'Soil Refilling',unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'anti_termite',  label: 'Anti Termite',  unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'cover_blocks',  label: 'Cover Blocks',  unit: '₹', divisible: false, type: 'number', table: 'boq_quantities' },
]
const SITE_PREP_DEFAULTS = {
  site_cleaning:  { s20x30: 10000, s20x40: 10000, s30x40: 15000, s30x50: 20000, s40x40: 20000, s40x60: 20000 },
  survey:         { s20x30: 8000,  s20x40: 8000,  s30x40: 8000,  s30x50: 8000,  s40x40: 8000,  s40x60: 8000  },
  soil_test:      { s20x30: 20000, s20x40: 20000, s30x40: 20000, s30x50: 20000, s40x40: 20000, s40x60: 20000 },
  excavation:     { s20x30: 20000, s20x40: 20000, s30x40: 25000, s30x50: 30000, s40x40: 30000, s40x60: 30000 },
  soil_refilling: { s20x30: 15000, s20x40: 20000, s30x40: 25000, s30x50: 35000, s40x40: 30000, s40x60: 40000 },
  anti_termite:   { s20x30: 5000,  s20x40: 5000,  s30x40: 5000,  s30x50: 5000,  s40x40: 5000,  s40x60: 5000  },
  cover_blocks:   { s20x30: 5000,  s20x40: 5000,  s30x40: 5000,  s30x50: 5000,  s40x40: 5000,  s40x60: 5000  },
}

const FOOTING_VEHICLE_ROWS = [
  { key: 'footing_msand', label: 'M Sand',          unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'footing_20mm',  label: '20mm Aggregate',  unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'footing_40mm',  label: '40mm Aggregate',  unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
]
const FOOTING_VEHICLE_DEFAULTS = {
  footing_msand: { s20x30: '6W',  s20x40: '6W',  s30x40: '6W',  s30x50: '6W',  s40x40: '6W',  s40x60: '10W' },
  footing_20mm:  { s20x30: '6W',  s20x40: '6W',  s30x40: '6W',  s30x50: '6W',  s40x40: '6W',  s40x60: '10W' },
  footing_40mm:  { s20x30: '709', s20x40: '709', s30x40: '709', s30x50: '709', s40x40: '709', s40x60: '6W'  },
}

const PLINTH_VEHICLE_ROWS = [
  { key: 'plinth_msand', label: 'M Sand',         unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'plinth_20mm',  label: '20mm Aggregate', unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'plinth_40mm',  label: '40mm Aggregate', unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
]
const PLINTH_VEHICLE_DEFAULTS = {
  plinth_msand: { s20x30: '709', s20x40: '709', s30x40: '6W', s30x50: '6W', s40x40: '6W', s40x60: '10W' },
  plinth_20mm:  { s20x30: '709', s20x40: '709', s30x40: '6W', s30x50: '6W', s40x40: '6W', s40x60: '10W' },
  plinth_40mm:  { s20x30: '709', s20x40: '709', s30x40: '709',s30x50: '6W', s40x40: '6W', s40x60: '6W'  },
}

const PARAPET_ROWS = [
  { key: 'parapet_blocks', label: 'Blocks',         unit: 'Nos',     divisible: false, type: 'number',  table: 'boq_quantities' },
  { key: 'parapet_cement', label: 'Cement',         unit: 'Bags',    divisible: false, type: 'number',  table: 'boq_quantities' },
  { key: 'parapet_msand',  label: 'M Sand',         unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'parapet_20mm',   label: '20mm Aggregate', unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
]
const PARAPET_DEFAULTS = {
  parapet_blocks: { s20x30: 500,   s20x40: 500,   s30x40: 1000,  s30x50: 1000,  s40x40: 1000,  s40x60: 1500  },
  parapet_cement: { s20x30: 25,    s20x40: 30,    s30x40: 40,    s30x50: 40,    s40x40: 50,    s40x60: 50    },
  parapet_msand:  { s20x30: '709', s20x40: '709', s30x40: '709', s30x50: '709', s40x40: '709', s40x60: '709' },
  parapet_20mm:   { s20x30: '709', s20x40: '709', s30x40: '709', s30x50: '709', s40x40: '709', s40x60: '709' },
}

const CW_ROWS = [
  { key: 'cw_blocks',  label: 'Blocks',    unit: 'Nos', divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'cw_cement',  label: 'Cement',    unit: 'Bags',divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'cw_labour',  label: 'Labour',    unit: '₹',   divisible: false, type: 'number', table: 'boq_quantities' },
  { key: 'cw_plaster', label: 'Plaster',   unit: '₹',   divisible: false, type: 'number', table: 'boq_quantities' },
]
const CW_DEFAULTS = {
  cw_blocks:  { s20x30: 600,   s20x40: 800,   s30x40: 1000,  s30x50: 1200,  s40x40: 1400,  s40x60: 2000  },
  cw_cement:  { s20x30: 30,    s20x40: 40,    s30x40: 50,    s30x50: 60,    s40x40: 70,    s40x60: 80    },
  cw_labour:  { s20x30: 10000, s20x40: 20000, s30x40: 30000, s30x50: 40000, s40x40: 50000, s40x60: 60000 },
  cw_plaster: { s20x30: 10000, s20x40: 20000, s30x40: 30000, s30x50: 40000, s40x40: 50000, s40x60: 60000 },
}

const ROWS = [
  { key: 'blocks', label: 'Blocks',         unit: 'Nos',     divisible: false, type: 'number',  table: 'boq_quantities' },
  { key: 'bricks', label: 'Bricks',         unit: 'Nos',     divisible: false, type: 'number',  table: 'boq_quantities' },
  { key: 'cement', label: 'Cement',         unit: 'Bags',    divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'slab',   label: 'Slab Concrete',  unit: 'CUM',     divisible: true,  type: 'number',  table: 'boq_quantities' },
  { key: 'msand',  label: 'M Sand',         unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: '20mm',   label: '20mm Aggregate', unit: 'Vehicle', divisible: false, type: 'vehicle', table: 'boq_vehicle_types' },
  { key: 'elec',   label: 'Electrical',     unit: '₹',       divisible: false, type: 'number',  table: 'boq_quantities' },
  { key: 'misc',   label: 'Misc',           unit: '₹',       divisible: false, type: 'number',  table: 'boq_quantities' },
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
    const [{ data: qData }, { data: vData }] = await Promise.all([
      supabase.from('boq_quantities').select('*'),
      supabase.from('boq_vehicle_types').select('*'),
    ])
    const map = {}
    qData?.forEach(r => { map[r.row_key] = r })
    vData?.forEach(r => { map[r.row_key] = r })
    setRows(map)

    const knownPrefixes = new Set(DEFAULT_FLOOR_GROUPS.map(g => g.prefix))
    const customPrefixes = new Set()
    qData?.forEach(r => {
      if (!r.row_key.endsWith('_blocks')) return
      const prefix = r.row_key.replace(/_blocks$/, '')
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
    const now = new Date().toISOString()

    const baseNum = (suffix) => {
      if (copyFrom) {
        const r = rows[`${copyFrom}_${suffix}`]
        if (r) return { s20x30: r.s20x30, s20x40: r.s20x40, s30x40: r.s30x40, s30x50: r.s30x50, s40x40: r.s40x40, s40x60: r.s40x60 }
      }
      return { s20x30: 0, s20x40: 0, s30x40: 0, s30x50: 0, s40x40: 0, s40x60: 0 }
    }

    const baseVehicle = (suffix) => {
      if (copyFrom) {
        const r = rows[`${copyFrom}_${suffix}`]
        if (r) return { s20x30: r.s20x30, s20x40: r.s20x40, s30x40: r.s30x40, s30x50: r.s30x50, s40x40: r.s40x40, s40x60: r.s40x60 }
      }
      return { s20x30: null, s20x40: null, s30x40: null, s30x50: null, s40x40: null, s40x60: null }
    }

    await supabase.from('boq_quantities').upsert([
      { row_key: `${prefix}_blocks`, ...baseNum('blocks'), divisible: false, updated_by: user?.name, updated_at: now },
      { row_key: `${prefix}_bricks`, ...baseNum('bricks'), divisible: false, updated_by: user?.name, updated_at: now },
      { row_key: `${prefix}_cement`, ...baseNum('cement'), divisible: true,  updated_by: user?.name, updated_at: now },
      { row_key: `${prefix}_slab`,   ...baseNum('slab'),   divisible: true,  updated_by: user?.name, updated_at: now },
      { row_key: `${prefix}_elec`,   ...baseNum('elec'),   divisible: false, updated_by: user?.name, updated_at: now },
      { row_key: `${prefix}_misc`,   ...baseNum('misc'),   divisible: false, updated_by: user?.name, updated_at: now },
    ], { onConflict: 'row_key' })

    await supabase.from('boq_vehicle_types').upsert([
      { row_key: `${prefix}_msand`, ...baseVehicle('msand'), updated_by: user?.name, updated_at: now },
      { row_key: `${prefix}_20mm`,  ...baseVehicle('20mm'),  updated_by: user?.name, updated_at: now },
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

  async function saveRow(rowKey, rowDef) {
    const current = rows[rowKey] || {}
    const changes = edited[rowKey] || {}
    setSaving(rowKey)

    if (rowDef.type === 'vehicle') {
      const payload = {
        row_key: rowKey,
        s20x30: changes.s20x30 !== undefined ? (changes.s20x30 || null) : (current.s20x30 || null),
        s20x40: changes.s20x40 !== undefined ? (changes.s20x40 || null) : (current.s20x40 || null),
        s30x40: changes.s30x40 !== undefined ? (changes.s30x40 || null) : (current.s30x40 || null),
        s30x50: changes.s30x50 !== undefined ? (changes.s30x50 || null) : (current.s30x50 || null),
        s40x40: changes.s40x40 !== undefined ? (changes.s40x40 || null) : (current.s40x40 || null),
        s40x60: changes.s40x60 !== undefined ? (changes.s40x60 || null) : (current.s40x60 || null),
        updated_by: user?.name,
        updated_at: new Date().toISOString(),
      }
      await supabase.from('boq_vehicle_types').upsert(payload, { onConflict: 'row_key' })
    } else {
      const payload = {
        row_key: rowKey,
        s20x30: parseFloat(changes.s20x30 ?? current.s20x30) || 0,
        s20x40: parseFloat(changes.s20x40 ?? current.s20x40) || 0,
        s30x40: parseFloat(changes.s30x40 ?? current.s30x40) || 0,
        s30x50: parseFloat(changes.s30x50 ?? current.s30x50) || 0,
        s40x40: parseFloat(changes.s40x40 ?? current.s40x40) || 0,
        s40x60: parseFloat(changes.s40x60 ?? current.s40x60) || 0,
        divisible: rowDef.divisible,
        updated_by: user?.name,
        updated_at: new Date().toISOString(),
      }
      await supabase.from('boq_quantities').upsert(payload, { onConflict: 'row_key' })
    }

    setSaving(null)
    setSaved(rowKey)
    setTimeout(() => setSaved(null), 1500)
    setEdited(prev => { const n = { ...prev }; delete n[rowKey]; return n })
    fetchData()
  }

  const sizeColMap = { '20x30': 's20x30', '20x40': 's20x40', '30x40': 's30x40', '30x50': 's30x50', '40x40': 's40x40', '40x60': 's40x60' }

  function ssmCellValue(rowKey, sizeCol) {
    return cellValueWithDefaults(rowKey, sizeCol, SSM_DEFAULTS)
  }

  function cellValueWithDefaults(rowKey, sizeCol, defaults) {
    const e = edited[rowKey]?.[sizeCol]
    if (e !== undefined) return e
    return rows[rowKey]?.[sizeCol] ?? defaults[rowKey]?.[sizeCol] ?? ''
  }

  const activeGroupData = floorGroups.find(g => g.prefix === activeGroup)

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">BOQ Quantities</h1>
            <p className="text-sm text-gray-400 mt-0.5">Masonry, slab, M&amp;A and electrical quantities per floor type and site size</p>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 w-36">Material</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">Unit</th>
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
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {row.unit}
                        {row.divisible ? ' *' : ''}
                        {row.type === 'vehicle' && <span className="ml-1 text-purple-400">†</span>}
                      </td>
                      {SIZES.map(s => {
                        const col = sizeColMap[s]
                        const val = cellValue(rowKey, col)
                        const changed = edited[rowKey]?.[col] !== undefined
                        return (
                          <td key={s} className="px-2 py-2 text-center">
                            {row.type === 'vehicle' ? (
                              <select
                                className={`w-24 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                  changed ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                                }`}
                                value={val || ''}
                                onChange={e => handleChange(rowKey, col, e.target.value)}
                              >
                                {VEHICLE_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt || '— None'}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                className={`w-20 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  changed ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                                }`}
                                value={val}
                                onChange={e => handleChange(rowKey, col, e.target.value)}
                              />
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right">
                        {wasSaved ? (
                          <span className="text-xs text-green-600 font-medium">Saved</span>
                        ) : (
                          <button
                            onClick={() => saveRow(rowKey, row)}
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

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 space-y-1">
              <p className="text-xs text-gray-400">* Cement and Slab are divisible — quantity scales with actual floor area vs standard size area.</p>
              <p className="text-xs text-gray-400">† M Sand and 20mm Aggregate use vehicle type (Tractor / 709 / 6W / 10W). Price is pulled from Market Prices.</p>
            </div>
          </div>
        )}

        {/* SSM Work quantities */}
        <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">SSM Work (Size Stone Masonry)</p>
            <p className="text-xs text-gray-400 mt-0.5">Quantities per site size — baseline is 2 courses. If more courses are selected, quantities scale proportionally.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 w-36">Material</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">Unit</th>
                {SIZES.map(s => (
                  <th key={s} className="text-center px-2 py-3 text-xs font-medium text-gray-500">{s}</th>
                ))}
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {SSM_ROWS.map(row => {
                const rowKey = row.key
                const dirty = isDirty(rowKey)
                const isSaving = saving === rowKey
                const wasSaved = saved === rowKey
                return (
                  <tr key={rowKey} className={`border-b border-gray-50 ${dirty ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-3 font-medium text-gray-800">{row.label}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {row.unit}
                      {row.divisible && <span> *</span>}
                      {row.type === 'vehicle' && <span className="ml-1 text-purple-400">†</span>}
                    </td>
                    {SIZES.map(s => {
                      const col = sizeColMap[s]
                      const val = ssmCellValue(rowKey, col)
                      const changed = edited[rowKey]?.[col] !== undefined
                      return (
                        <td key={s} className="px-2 py-2 text-center">
                          {row.type === 'vehicle' ? (
                            <select
                              className={`w-24 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                changed ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                              }`}
                              value={val || ''}
                              onChange={e => handleChange(rowKey, col, e.target.value)}
                            >
                              {VEHICLE_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt || '— None'}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              className={`w-20 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                changed ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
                              }`}
                              value={val}
                              onChange={e => handleChange(rowKey, col, e.target.value)}
                            />
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2 text-right">
                      {wasSaved ? (
                        <span className="text-xs text-green-600 font-medium">Saved</span>
                      ) : (
                        <button
                          onClick={() => saveRow(rowKey, row)}
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
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 space-y-1">
            <p className="text-xs text-gray-400">* Sizestone and Cement scale with actual site area vs standard size area.</p>
            <p className="text-xs text-gray-400">† 40mm Aggregate and M Sand use vehicle type (709 / 6W / 10W). Price is pulled from Market Prices.</p>
          </div>
        </div>

        {/* Additional editable sections */}
        {[
          { title: 'Site Preparation & Soil', note: 'Site cleaning, survey, soil test, excavation, soil refilling, anti-termite, cover blocks — cost per site size', rows: SITE_PREP_ROWS, defaults: SITE_PREP_DEFAULTS },
          { title: 'Footing — Sand & Aggregate Vehicles', note: 'M Sand, 20mm and 40mm aggregate vehicle types for footing stage', rows: FOOTING_VEHICLE_ROWS, defaults: FOOTING_VEHICLE_DEFAULTS },
          { title: 'Plinth — Sand & Aggregate Vehicles', note: 'M Sand, 20mm and 40mm aggregate vehicle types for plinth stage', rows: PLINTH_VEHICLE_ROWS, defaults: PLINTH_VEHICLE_DEFAULTS },
          { title: 'Compound Wall', note: 'Blocks, cement, labour and plastering quantities per site size', rows: CW_ROWS, defaults: CW_DEFAULTS },
          { title: 'Parapet Wall', note: 'Blocks, cement and sand/aggregate vehicles for parapet wall', rows: PARAPET_ROWS, defaults: PARAPET_DEFAULTS },
          { title: 'Terrace Floor', note: 'Quantities for the topmost slab and headroom', rows: TERRACE_ROWS, defaults: TERRACE_DEFAULTS },
          { title: 'Screed Concrete', note: 'Terrace floor screed — cement, P Sand, 12mm aggregates and misc', rows: SCREED_ROWS, defaults: SCREED_DEFAULTS },
        ].map(({ title, note, rows: sectionRows, defaults }) => (
          <div key={title} className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-semibold text-gray-800">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{note}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 w-36">Material</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-20">Unit</th>
                  {SIZES.map(s => (
                    <th key={s} className="text-center px-2 py-3 text-xs font-medium text-gray-500">{s}</th>
                  ))}
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {sectionRows.map(row => {
                  const rowKey = row.key
                  const dirty = isDirty(rowKey)
                  const isSaving = saving === rowKey
                  const wasSaved = saved === rowKey
                  return (
                    <tr key={rowKey} className={`border-b border-gray-50 ${dirty ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-3 font-medium text-gray-800">{row.label}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {row.unit}
                        {row.divisible && <span> *</span>}
                        {row.type === 'vehicle' && <span className="ml-1 text-purple-400">†</span>}
                      </td>
                      {SIZES.map(s => {
                        const col = sizeColMap[s]
                        const val = cellValueWithDefaults(rowKey, col, defaults)
                        const changed = edited[rowKey]?.[col] !== undefined
                        return (
                          <td key={s} className="px-2 py-2 text-center">
                            {row.type === 'vehicle' ? (
                              <select
                                className={`w-24 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${changed ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}
                                value={val || ''}
                                onChange={e => handleChange(rowKey, col, e.target.value)}
                              >
                                {VEHICLE_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt || '— None'}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                className={`w-20 text-center border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${changed ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}
                                value={val}
                                onChange={e => handleChange(rowKey, col, e.target.value)}
                              />
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-2 text-right">
                        {wasSaved ? (
                          <span className="text-xs text-green-600 font-medium">Saved</span>
                        ) : (
                          <button
                            onClick={() => saveRow(rowKey, row)}
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
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 space-y-1">
              <p className="text-xs text-gray-400">* Cement and Slab Concrete are divisible — quantity scales with actual site area.</p>
              <p className="text-xs text-gray-400">† Vehicle rows (M Sand, P Sand, 12mm) use Tractor / 709 / 6W / 10W. Price from Market Prices.</p>
            </div>
          </div>
        ))}

      </div>
    </AppLayout>
  )
}
