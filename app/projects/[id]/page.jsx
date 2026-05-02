'use client'

import AppLayout from '@/components/layout/AppLayout'
import * as XLSX from 'xlsx'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { calculateFullBOQ } from '@/lib/calculate'

const FLOOR_NAMES = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor', 'Sixth Floor']

const GROUND_TYPES = [
  { value: 'parking_only', label: 'Only Parking' },
  { value: 'parking_lift', label: 'Only Parking + Lift' },
  { value: '1bhk_parking', label: '1 BHK + Parking' },
  { value: '2bhk_parking', label: '2 BHK + Parking' },
  { value: 'duplex_gf', label: 'Duplex Starts in GF' },
  { value: 'commercial_parking', label: 'Commercial + Parking' },
]

const UPPER_TYPES = [
  { value: '1bhk', label: '1 BHK (Single Unit)' },
  { value: '1bhk_2units', label: '1 BHK (2 Units)' },
  { value: '2bhk', label: '2 BHK (Single Unit)' },
  { value: '1bhk_2bhk', label: '1 BHK + 2 BHK Mix' },
  { value: '2bhk_3bhk', label: '2 BHK + 3 BHK Mix' },
  { value: '3bhk', label: '3 BHK' },
  { value: 'duplex_ff', label: 'Duplex Starts in FF' },
  { value: 'duplex_sf', label: 'Duplex Starts in SF' },
]

const MAIN_DOOR_TYPES = [
  { value: 'teak_3x7', label: 'Teak 3×7 — ₹50,000' },
  { value: 'teak_3x7_window', label: 'Teak 3×7 with Window — ₹70,000' },
  { value: 'teak_4x8', label: 'Teak 4×8 — ₹70,000' },
  { value: 'teak_4x8_window', label: 'Teak 4×8 with Window — ₹1,00,000' },
  { value: 'teak_5x8', label: 'Teak 5×8 — ₹1,20,000' },
  { value: 'teak_5x8_window', label: 'Teak 5×8 with Window — ₹1,35,000' },
  { value: 'normal', label: 'Normal Door — ₹15,000' },
]

const RAILING_TYPES = [
  { value: 'ms', label: 'MS Railing — ₹600/rft' },
  { value: 'ss', label: 'SS Railing — ₹900/rft' },
  { value: 'ss_glass', label: 'SS with Glass — ₹1,300/rft' },
  { value: 'glass_wood', label: 'Glass with Wooden Top — ₹1,800/rft' },
]

const PAINTING_TYPES = [
  { value: 'premium_emulsion', label: 'Interior Premium + Exterior Emulsion — ₹8,500/chadra' },
  { value: 'tractor_emulsion', label: 'Interior Tractor + Exterior Emulsion — ₹7,500/chadra' },
  { value: 'royal_emulsion', label: 'Interior Royal + Exterior Emulsion — ₹10,000/chadra' },
  { value: 'royal_ultima', label: 'Interior Royal + Exterior Ultima — ₹13,000/chadra' },
]

const WINDOW_TYPES = [
  { value: 'upvc_white', label: 'UPVC White Profile — ₹600/sqft' },
  { value: 'upvc_wood', label: 'UPVC Wooden Profile — ₹1,000/sqft' },
  { value: 'wood_saal', label: 'Wooden Saal Wood — ₹1,500/sqft' },
]

function getDefaultDoors(floorType) {
  switch (floorType) {
    case '1bhk': case '1bhk_parking': return { mainDoor: 'teak_3x7', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 1, utilityDoors: 0, poojaRoom: false, kitchens: 1 }
    case '1bhk_2units': return { mainDoor: 'teak_3x7', bedroomDoors: 2, washroomDoors: 2, toilets: 2, balconyDoors: 2, utilityDoors: 0, poojaRoom: false, kitchens: 2 }
    case '2bhk': case '2bhk_parking': return { mainDoor: 'teak_3x7', bedroomDoors: 2, washroomDoors: 2, toilets: 2, balconyDoors: 1, utilityDoors: 1, poojaRoom: true, kitchens: 1 }
    case '1bhk_2bhk': return { mainDoor: 'teak_3x7', bedroomDoors: 3, washroomDoors: 3, toilets: 3, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 2 }
    case '2bhk_3bhk': return { mainDoor: 'teak_3x7', bedroomDoors: 5, washroomDoors: 4, toilets: 4, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 2 }
    case '3bhk': return { mainDoor: 'teak_3x7', bedroomDoors: 3, washroomDoors: 2, toilets: 2, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 1 }
    case 'duplex_gf': case 'duplex_ff': case 'duplex_sf': return { mainDoor: 'teak_4x8', bedroomDoors: 3, washroomDoors: 3, toilets: 3, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 1 }
    case 'parking_only': case 'parking_lift': case 'commercial_parking': return { mainDoor: '', bedroomDoors: 0, washroomDoors: 0, toilets: 0, balconyDoors: 0, utilityDoors: 0, poojaRoom: false, kitchens: 0 }
    default: return { mainDoor: 'teak_3x7', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 0, utilityDoors: 0, poojaRoom: false, kitchens: 1 }
  }
}

function createFloor(index) {
  return { index, name: FLOOR_NAMES[index], type: '', sqft: '', mainDoor: 'teak_3x7', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 0, utilityDoors: 0, poojaRoom: false, poojaRoomPrice: '', kitchens: 1, staircaseType: 'normal', staircaseSteps: 19, tilesSquft: '', tilesPricePerSqft: 50, railingType: '', railingRft: 25, acPoints: 0, windowSqft: '' }
}

const isParking = (type) => ['parking_only', 'parking_lift', 'commercial_parking'].includes(type)

export default function ProjectPage() {
  const router = useRouter()
  const { id } = useParams()

  const [boqOverrides, setBoqOverrides] = useState({})
  const saveTimeoutRef = useRef(null)

  // Shared
  const [project, setProject] = useState(null)
  const [boqItems, setBoqItems] = useState([])
  const [customItems, setCustomItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit form — Client
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientLocation, setClientLocation] = useState('')
  // Edit form — Dimensions
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const sqft = width && length ? parseFloat(width) * parseFloat(length) : null
  // Edit form — Masonry
  const [masonryType, setMasonryType] = useState('block')
  // Edit form — Floors
  const [floorCount, setFloorCount] = useState(1)
  const [floors, setFloors] = useState([createFloor(0)])
  // Edit form — Optional
  const [hasLift, setHasLift] = useState(false)
  const [hasSump, setHasSump] = useState(true)
  const [sumpCapacity, setSumpCapacity] = useState('')
  const [sumpType, setSumpType] = useState('rcc')
  const [hasSsm, setHasSsm] = useState(false)
  const [ssmCourses, setSsmCourses] = useState('')
  // Edit form — Services
  const [hasCompoundWall, setHasCompoundWall] = useState(true)
  const [hasRainwater, setHasRainwater] = useState(true)
  const [hasGas, setHasGas] = useState(true)
  const [hasOht, setHasOht] = useState(true)
  const [ohtCapacity, setOhtCapacity] = useState('1000')
  const [ohtCustom, setOhtCustom] = useState('')
  const [hasMainGate, setHasMainGate] = useState(true)
  const [hasAc, setHasAc] = useState(false)
  const [hasCctv, setHasCctv] = useState(false)
  const [hasEv, setHasEv] = useState(false)
  const [hasSolar, setHasSolar] = useState(false)
  const [hasUps, setHasUps] = useState(false)
  const [hasWifi, setHasWifi] = useState(false)
  // Edit form — Finishes
  const [paintingGrade, setPaintingGrade] = useState('')
  const [windowType, setWindowType] = useState('')
  const [railingType, setRailingType] = useState('')
  const [flooringType, setFlooringType] = useState('')
  // Edit form — Custom items
  const [editCustomItems, setEditCustomItems] = useState([{ item_name: '', quantity: '', unit_price: '', notes: '' }])

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    fetchAll()
  }, [id])

  async function fetchAll() {
    const [{ data: proj }, { data: customs }, { data: prices }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('custom_items').select('*').eq('project_id', id),
      supabase.from('market_prices').select('*'),
    ])

    const priceMap = {}
    if (prices) {
      prices.forEach(p => {
        const price = parseFloat(p.price)
        priceMap[p.item_name] = price
        if (['tractor', '709', '6 wheeler', '10 wheeler'].includes(p.unit)) {
          const unitKey = p.unit === '6 wheeler' ? '6w' : p.unit === '10 wheeler' ? '10w' : p.unit
          priceMap[`${p.item_name}_${unitKey}`] = price
        }
      })
    }

    if (proj) {
      setProject(proj)
      setBoqOverrides(proj.boq_overrides || {})
      setClientName(proj.client_name || '')
      setClientPhone(proj.client_phone || '')
      setClientLocation(proj.site_address || '')
      setWidth(proj.dimension_width || '')
      setLength(proj.dimension_length || '')
      setMasonryType(proj.masonry_type || 'block')
      setFloorCount(proj.floor_count || proj.floors || 1)
      setHasLift(proj.has_lift || false)
      setHasSump(proj.has_sump || false)
      setSumpCapacity(proj.sump_capacity || '')
      setSumpType(proj.sump_type || 'block')
      setHasSsm(proj.has_ssm || false)
      setSsmCourses(proj.ssm_courses || '')
      setHasCompoundWall(proj.has_compound_wall ?? true)
      setHasRainwater(proj.has_rainwater ?? true)
      setHasGas(proj.has_gas ?? true)
      setHasOht(proj.has_oht ?? true)
      setOhtCapacity(proj.oht_capacity ? String(proj.oht_capacity) : '1000')
      setHasMainGate(proj.has_main_gate ?? true)
      setHasAc(proj.has_ac || false)
      setHasCctv(proj.has_cctv || false)
      setHasEv(proj.has_ev || false)
      setHasSolar(proj.has_solar || false)
      setHasUps(proj.has_ups || false)
      setHasWifi(proj.has_wifi || false)
      setPaintingGrade(proj.painting_grade || '')
      setWindowType(proj.window_type || '')
      setRailingType(proj.railing_type || '')
      setFlooringType(proj.flooring_type || '')

      if (proj.floors_data && proj.floors_data.length > 0) {
        setFloors(proj.floors_data)
      } else {
        const count = proj.floor_count || proj.floors || 1
        setFloors(Array.from({ length: count }, (_, i) => createFloor(i)))
      }

      const calculated = calculateFullBOQ(proj, priceMap)
      setBoqItems(calculated)
    }

    setCustomItems(customs || [])
    if (customs && customs.length > 0) {
      setEditCustomItems(customs.map(c => ({ id: c.id, item_name: c.item_name, quantity: c.quantity, unit_price: c.unit_price, notes: c.notes || '' })))
    }

    setLoading(false)
  }

  // BOQ override helpers
  function getDisplayQty(item) {
    const ov = boqOverrides[item._idx]
    return ov?.quantity !== undefined ? ov.quantity : item.quantity
  }

  function getDisplayUnitPrice(item) {
    const ov = boqOverrides[item._idx]
    return ov?.unit_price !== undefined ? ov.unit_price : item.unit_price
  }

  function getDisplayTotal(item) {
    const ov = boqOverrides[item._idx]
    if (!ov) return item.total_price || 0
    const qty = parseFloat(getDisplayQty(item))
    const up = parseFloat(getDisplayUnitPrice(item))
    if (!isNaN(qty) && !isNaN(up)) return qty * up
    if (!isNaN(up)) return up
    return item.total_price || 0
  }

  const overriddenGrandTotal = useMemo(() => {
    const boqTotal = boqItems.reduce((sum, item, i) => {
      const ov = boqOverrides[i]
      if (!ov) return sum + (item.total_price || 0)
      const qty = parseFloat(ov.quantity ?? item.quantity)
      const up = parseFloat(ov.unit_price ?? item.unit_price)
      if (!isNaN(qty) && !isNaN(up)) return sum + qty * up
      if (!isNaN(up)) return sum + up
      return sum + (item.total_price || 0)
    }, 0)
    const customTotal = customItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    return boqTotal + customTotal
  }, [boqItems, boqOverrides, customItems])

  const hasAnyOverride = Object.keys(boqOverrides).length > 0

  async function saveOverrides(overrides) {
    await supabase.from('projects').update({ boq_overrides: overrides }).eq('id', id)
  }

  function handleOverride(idx, field, value) {
    const newOverrides = { ...boqOverrides, [idx]: { ...(boqOverrides[idx] || {}), [field]: value } }
    setBoqOverrides(newOverrides)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => saveOverrides(newOverrides), 800)
  }

  function groupByStageWithIndex(items) {
    return items.reduce((groups, item, i) => {
      const stage = item.stage || 'Other'
      if (!groups[stage]) groups[stage] = []
      groups[stage].push({ ...item, _idx: i })
      return groups
    }, {})
  }

  // Edit form handlers
  function handleFloorCountChange(count) {
    const n = parseInt(count)
    setFloorCount(n)
    setFloors(prev => Array.from({ length: n }, (_, i) => prev[i] || createFloor(i)))
  }

  function handleFloorTypeChange(index, type) {
    const defaults = getDefaultDoors(type)
    setFloors(prev => { const u = [...prev]; u[index] = { ...u[index], type, ...defaults }; return u })
  }

  function updateFloor(index, field, value) {
    setFloors(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u })
  }

  function adjustSteps(index, delta) {
    setFloors(prev => { const u = [...prev]; u[index] = { ...u[index], staircaseSteps: Math.max(1, (parseInt(u[index].staircaseSteps) || 19) + delta) }; return u })
  }

  function addCustomItem() { setEditCustomItems(p => [...p, { item_name: '', quantity: '', unit_price: '', notes: '' }]) }
  function removeCustomItem(i) { setEditCustomItems(p => p.filter((_, idx) => idx !== i)) }
  function updateCustomItem(i, field, value) { setEditCustomItems(p => { const u = [...p]; u[i][field] = value; return u }) }
  function getCustomItemTotal(item) { return ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('en-IN') }

  const totalDoors = floors.reduce((acc, f) => ({
    bedroom: acc.bedroom + (parseInt(f.bedroomDoors) || 0),
    washroom: acc.washroom + (parseInt(f.washroomDoors) || 0),
    toilets: acc.toilets + (parseInt(f.toilets) || 0),
    balcony: acc.balcony + (parseInt(f.balconyDoors) || 0),
    utility: acc.utility + (parseInt(f.utilityDoors) || 0),
    kitchens: acc.kitchens + (parseInt(f.kitchens) || 0),
    poojaRoom: acc.poojaRoom + (f.poojaRoom ? 1 : 0),
  }), { bedroom: 0, washroom: 0, toilets: 0, balcony: 0, utility: 0, kitchens: 0, poojaRoom: 0 })

  async function handleUpdate() {
    if (!clientName || !width || !length) { alert('Please fill Client Name and Dimensions'); return }
    const emptyFloors = floors.filter(f => !f.type)
    if (emptyFloors.length > 0) { alert(`Select floor type for: ${emptyFloors.map(f => f.name).join(', ')}`); return }
    setSaving(true)

    const finalOhtCapacity = ohtCapacity === 'custom' ? parseFloat(ohtCustom) : parseFloat(ohtCapacity)

    const projectData = {
      client_name: clientName, client_phone: clientPhone, site_address: clientLocation,
      dimension_width: parseFloat(width), dimension_length: parseFloat(length), total_sqft: sqft,
      floors: floorCount, floor_count: floorCount, floors_data: floors,
      ground_floor_type: floors[0]?.type || '', upper_floor_type: floors[1]?.type || '',
      masonry_type: masonryType, has_lift: hasLift, has_sump: hasSump,
      sump_capacity: sumpCapacity ? parseFloat(sumpCapacity) : null, sump_type: sumpType,
      has_ssm: hasSsm, ssm_courses: ssmCourses ? parseInt(ssmCourses) : null,
      has_compound_wall: hasCompoundWall, has_rainwater: hasRainwater, has_gas: hasGas,
      has_oht: hasOht, oht_capacity: finalOhtCapacity, has_main_gate: hasMainGate,
      has_ac: hasAc, has_cctv: hasCctv, has_ev: hasEv, has_solar: hasSolar,
      has_ups: hasUps, has_wifi: hasWifi, painting_grade: paintingGrade,
      flooring_type: flooringType, window_type: windowType, railing_type: railingType,
      bedroom_doors: totalDoors.bedroom, washroom_doors: totalDoors.washroom,
      balcony_doors: totalDoors.balcony, utility_doors: totalDoors.utility,
      has_pooja_room_door: totalDoors.poojaRoom > 0,
    }

    const { error } = await supabase.from('projects').update(projectData).eq('id', id)
    if (error) { alert('Error: ' + error.message); setSaving(false); return }

    await supabase.from('custom_items').delete().eq('project_id', id)
    const validItems = editCustomItems.filter(i => i.item_name && i.unit_price)
    if (validItems.length > 0) {
      await supabase.from('custom_items').insert(validItems.map(item => ({
        project_id: id, item_name: item.item_name,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price),
        total_price: (parseFloat(item.quantity) || 1) * parseFloat(item.unit_price),
        notes: item.notes,
      })))
    }

    await supabase.from('projects').update({ boq_overrides: {} }).eq('id', id)
    await fetchAll()
    setBoqOverrides({})
    setSaving(false)
  }

  function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN')
  }

  function formatFloorType(value) {
    const map = {
      parking_only: 'Only Parking', parking_lift: 'Only Parking + Lift',
      '1bhk_parking': '1 BHK + Parking', '2bhk_parking': '2 BHK + Parking',
      commercial_parking: 'Commercial + Parking', duplex_gf: 'Duplex in Ground Floor',
      '1bhk': '1 BHK', '2bhk': '2 BHK', '3bhk': '3 BHK',
      '1bhk_2units': '1 BHK (2 Units)', '1bhk_2bhk': '1 BHK + 2 BHK Mix',
      '2bhk_3bhk': '2 BHK + 3 BHK Mix', duplex_ff: 'Duplex in First Floor',
      duplex_sf: 'Duplex in Second Floor',
    }
    return map[value] || value || '—'
  }

  function exportToExcel() {
    const workbook = XLSX.utils.book_new()

    const detailsData = [
      ['BOQ ESTIMATE — BUILDACRE'], [],
      ['Client Name', project.client_name],
      ['Phone', project.client_phone || '—'],
      ['Location', project.site_address || '—'],
      ['Dimension', `${project.dimension_width} × ${project.dimension_length} ft`],
      ['Total Area', `${project.total_sqft} sqft`],
      ['Floors', project.floors === 1 ? 'G only' : `G+${project.floors - 1}`],
      ['Ground Floor', formatFloorType(project.ground_floor_type)],
      ['Upper Floor', formatFloorType(project.upper_floor_type)],
      ['Status', project.status], [],
      ['FEATURES INCLUDED'],
      ['Lift', project.has_lift ? 'Yes' : 'No'],
      ['Sump', project.has_sump ? `Yes — ${project.sump_capacity}L (${project.sump_type?.toUpperCase()})` : 'No'],
      ['SSM Work', project.has_ssm ? `Yes — ${project.ssm_courses} courses` : 'No'],
      ['Compound Wall', project.has_compound_wall ? 'Yes' : 'No'],
      ['Rainwater Harvesting', project.has_rainwater ? 'Yes' : 'No'],
      ['Gas Pipeline', project.has_gas ? 'Yes' : 'No'],
      ['OHT', project.has_oht ? 'Yes' : 'No'],
      ['Main Gate', project.has_main_gate ? 'Yes' : 'No'],
      ['AC Provision', project.has_ac ? 'Yes' : 'No'],
      ['CCTV', project.has_cctv ? 'Yes' : 'No'],
      ['EV Charging', project.has_ev ? 'Yes' : 'No'],
      ['Solar', project.has_solar ? 'Yes' : 'No'],
      ['UPS', project.has_ups ? 'Yes' : 'No'],
      ['WiFi & Cable', project.has_wifi ? 'Yes' : 'No'], [],
      ['Generated on', new Date().toLocaleDateString('en-IN')],
    ]
    if (hasAnyOverride) detailsData.push(['Note', 'Contains manually adjusted quantities/prices'])

    const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData)
    detailsSheet['!cols'] = [{ wch: 25 }, { wch: 35 }]
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Project Details')

    const grouped = groupByStageWithIndex(boqItems)
    const boqHeader = ['Stage', 'Item', 'Unit', 'Quantity', 'Unit Price (₹)', 'Total (₹)']
    const boqRows = []
    Object.entries(grouped).forEach(([stage, items]) => {
      items.forEach(item => {
        boqRows.push([
          stage, item.item_name,
          item.unit === 'fixed' ? 'Lumpsum' : item.unit || '—',
          getDisplayQty(item), getDisplayUnitPrice(item) || 0, getDisplayTotal(item),
        ])
      })
    })
    if (customItems.length > 0) {
      customItems.forEach(item => {
        boqRows.push(['Custom Add-on', item.item_name, '—', item.quantity, item.unit_price, item.total_price])
      })
    }
    boqRows.push([])
    boqRows.push(['', '', '', '', 'GRAND TOTAL', overriddenGrandTotal])

    const boqSheet = XLSX.utils.aoa_to_sheet([boqHeader, ...boqRows])
    boqSheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(workbook, boqSheet, 'BOQ')
    XLSX.writeFile(workbook, `BOQ_${project.client_name}_${project.dimension_width}x${project.dimension_length}.xlsx`)
  }

  if (loading) return <AppLayout><div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading project...</p></div></AppLayout>
  if (!project) return <AppLayout><div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Project not found</p></div></AppLayout>

  const grouped = groupByStageWithIndex(boqItems)

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/projects')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{project.client_name}</h1>
              <p className="text-sm text-gray-400">{project.site_address} · {project.dimension_width}×{project.dimension_length} ft · {project.total_sqft} sqft</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyOverride && (
              <Button variant="outline" size="sm" onClick={() => { setBoqOverrides({}); saveOverrides({}) }}>Reset Overrides</Button>
            )}
            <Button variant="outline" onClick={exportToExcel}>Export Excel</Button>
            <Button>Export PDF</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

            {/* Project Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Project Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-xs text-gray-400">Client Name</p><p className="text-sm font-medium text-gray-800">{project.client_name}</p></div>
                <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm font-medium text-gray-800">{project.client_phone || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Location</p><p className="text-sm font-medium text-gray-800">{project.site_address || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Dimension</p><p className="text-sm font-medium text-gray-800">{project.dimension_width}×{project.dimension_length} ft ({project.total_sqft} sqft)</p></div>
                <div><p className="text-xs text-gray-400">Floors</p><p className="text-sm font-medium text-gray-800">{project.floors === 1 ? 'G only' : `G+${project.floors - 1}`}</p></div>
                <div><p className="text-xs text-gray-400">Ground Floor</p><p className="text-sm font-medium text-gray-800">{formatFloorType(project.ground_floor_type)}</p></div>
                <div><p className="text-xs text-gray-400">Upper Floor</p><p className="text-sm font-medium text-gray-800">{formatFloorType(project.upper_floor_type)}</p></div>
                <div><p className="text-xs text-gray-400">Status</p><Badge variant="outline">{project.status}</Badge></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.has_lift && <Badge variant="secondary">Lift</Badge>}
                {project.has_sump && <Badge variant="secondary">Sump {project.sump_capacity}L</Badge>}
                {project.has_ssm && <Badge variant="secondary">SSM {project.ssm_courses} courses</Badge>}
                {project.has_compound_wall && <Badge variant="secondary">Compound Wall</Badge>}
                {project.has_rainwater && <Badge variant="secondary">Rainwater Harvesting</Badge>}
                {project.has_gas && <Badge variant="secondary">Gas Pipeline</Badge>}
                {project.has_oht && <Badge variant="secondary">OHT</Badge>}
                {project.has_main_gate && <Badge variant="secondary">Main Gate</Badge>}
                {project.has_ac && <Badge variant="secondary">AC Provision</Badge>}
                {project.has_cctv && <Badge variant="secondary">CCTV</Badge>}
                {project.has_ev && <Badge variant="secondary">EV Charging</Badge>}
                {project.has_solar && <Badge variant="secondary">Solar</Badge>}
                {project.has_ups && <Badge variant="secondary">UPS</Badge>}
                {project.has_wifi && <Badge variant="secondary">WiFi</Badge>}
              </div>
            </div>

            {/* ── Edit Project ── */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center"><span className="px-4 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-widest">Edit Project</span></div>
            </div>

            {/* Section 1 — Client */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">1</Badge>Client Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Client Name *</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Phone Number</Label><Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Site Location</Label><Input value={clientLocation} onChange={e => setClientLocation(e.target.value)} /></div>
              </CardContent>
            </Card>

            {/* Section 2 — Dimensions */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">2</Badge>Site Dimension</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5"><Label>Width (ft) *</Label><Input type="number" value={width} onChange={e => setWidth(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Length (ft) *</Label><Input type="number" value={length} onChange={e => setLength(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Total Area</Label>
                    <div className="h-10 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-sm flex items-center">{sqft ? `${sqft} sq.ft` : '— sq.ft'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2b — Masonry */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">2b</Badge>Masonry Type</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[{ value: 'block', label: 'Blocks', sub: 'Cement blocks · ₹49 per block' }, { value: 'brick', label: 'Bricks', sub: 'Red clay bricks · ₹8 per brick' }].map(m => (
                    <button key={m.value} onClick={() => setMasonryType(m.value)} className={`p-4 rounded-xl border-2 text-left transition-all ${masonryType === m.value ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <p className="font-semibold text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{m.sub}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Section 3 — Floors */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">3</Badge>Floor Plan</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Total Floors *</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1,2,3,4,5,6,7].map(n => (
                      <button key={n} onClick={() => handleFloorCountChange(n)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${floorCount === n ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                        {n === 1 ? 'G only' : `G+${n-1}`}
                      </button>
                    ))}
                  </div>
                </div>

                {floors.map((floor, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-sm font-semibold">{floor.name}</span>
                      {floor.type && <Badge className="ml-2 bg-blue-600 text-white text-xs border-0">{[...GROUND_TYPES, ...UPPER_TYPES].find(t => t.value === floor.type)?.label || floor.type}</Badge>}
                    </div>
                    <div className="p-4 space-y-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Floor Type *</Label>
                          <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={floor.type} onChange={e => handleFloorTypeChange(index, e.target.value)}>
                            <option value="">— Select floor type —</option>
                            {(index === 0 ? GROUND_TYPES : UPPER_TYPES).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Construction Area (sqft)</Label>
                          <Input type="number" placeholder={sqft ? `Max ${sqft} sqft` : 'Enter sqft'} value={floor.sqft} onChange={e => updateFloor(index, 'sqft', e.target.value)} />
                        </div>
                      </div>

                      {/* Staircase */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Staircase Type</Label>
                          <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={floor.staircaseType} onChange={e => updateFloor(index, 'staircaseType', e.target.value)}>
                            <option value="none">No Staircase</option>
                            <option value="normal">Normal Staircase (included in labour)</option>
                            <option value="chain">Chain Staircase — ₹2,300 per step</option>
                          </select>
                        </div>
                        {floor.staircaseType === 'chain' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Steps</Label>
                            <div className="flex items-center gap-2">
                              <button onClick={() => adjustSteps(index, -1)} className="w-10 h-10 rounded-lg border border-gray-200 bg-white font-bold text-lg flex items-center justify-center">−</button>
                              <div className="flex-1 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-semibold">{floor.staircaseSteps} steps</div>
                              <button onClick={() => adjustSteps(index, 1)} className="w-10 h-10 rounded-lg border border-gray-200 bg-white font-bold text-lg flex items-center justify-center">+</button>
                            </div>
                            <p className="text-xs text-gray-400">Cost: ₹{(floor.staircaseSteps * 2300).toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>

                      {/* Doors */}
                      {!isParking(floor.type) && (
                        <>
                          <Separator />
                          <p className="text-sm font-medium text-gray-700">Doors &amp; Rooms</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Main Door</Label>
                              <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={floor.mainDoor} onChange={e => updateFloor(index, 'mainDoor', e.target.value)}>
                                <option value="">No main door</option>
                                {MAIN_DOOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            {[
                              { field: 'bedroomDoors', label: 'Bedroom Doors', note: '₹12,000 each' },
                              { field: 'washroomDoors', label: 'Washroom Doors', note: '₹10,000 each' },
                              { field: 'toilets', label: 'Toilets/Bathrooms', note: 'For plumbing' },
                              { field: 'balconyDoors', label: 'Balcony Doors', note: '₹12,000 each' },
                              { field: 'utilityDoors', label: 'Utility Doors', note: '₹10,000 each' },
                              { field: 'kitchens', label: 'Kitchens', note: 'For plumbing' },
                            ].map(d => (
                              <div key={d.field} className="space-y-1.5">
                                <Label className="text-xs">{d.label}</Label>
                                <Input type="number" min="0" value={floor[d.field]} onChange={e => updateFloor(index, d.field, e.target.value)} />
                                <p className="text-xs text-gray-400">{d.note}</p>
                              </div>
                            ))}
                            <div className="space-y-1.5">
                              <Label className="text-xs">Pooja Room Door</Label>
                              <div className="h-10 flex items-center gap-2">
                                <Switch checked={floor.poojaRoom} onCheckedChange={v => updateFloor(index, 'poojaRoom', v)} />
                                {floor.poojaRoom && (
                                  <Input
                                    type="number"
                                    placeholder="20000"
                                    value={floor.poojaRoomPrice}
                                    onChange={e => updateFloor(index, 'poojaRoomPrice', e.target.value)}
                                    className="w-28 h-8 text-sm"
                                  />
                                )}
                                <span className="text-xs text-gray-400">{floor.poojaRoom && floor.poojaRoomPrice ? `₹${parseFloat(floor.poojaRoomPrice).toLocaleString('en-IN')}` : '₹20,000 default'}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Tiles */}
                      {!isParking(floor.type) && (
                        <>
                          <Separator />
                          <p className="text-sm font-medium text-gray-700">Flooring Tiles</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Tiles Area (sqft)</Label>
                              <Input type="number" placeholder={floor.sqft || 'Enter sqft'} value={floor.tilesSquft} onChange={e => updateFloor(index, 'tilesSquft', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Price per sqft (₹)</Label>
                              <Input type="number" value={floor.tilesPricePerSqft} onChange={e => updateFloor(index, 'tilesPricePerSqft', e.target.value)} />
                              <p className="text-xs text-gray-400">Total: ₹{((parseFloat(floor.tilesSquft) || 0) * (parseFloat(floor.tilesPricePerSqft) || 0)).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Windows */}
                      {!isParking(floor.type) && (
                        <>
                          <Separator />
                          <p className="text-sm font-medium text-gray-700">Windows</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Window Type</Label>
                              <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={windowType} onChange={e => setWindowType(e.target.value)}>
                                <option value="">No windows</option>
                                {WINDOW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Window Area (sqft)</Label>
                              <Input type="number" placeholder={floor.sqft ? `Auto: ${Math.ceil((parseFloat(floor.sqft)||0)*0.1)} sqft` : 'Enter sqft'} value={floor.windowSqft} onChange={e => updateFloor(index, 'windowSqft', e.target.value)} />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Railing */}
                      {!isParking(floor.type) && (
                        <>
                          <Separator />
                          <p className="text-sm font-medium text-gray-700">Railing</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Railing Type</Label>
                              <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={floor.railingType} onChange={e => updateFloor(index, 'railingType', e.target.value)}>
                                <option value="">No railing</option>
                                {RAILING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            {floor.railingType && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Running Feet (rft)</Label>
                                <Input type="number" value={floor.railingRft} onChange={e => updateFloor(index, 'railingRft', e.target.value)} />
                                <p className="text-xs text-gray-400">{floor.railingRft && `Cost: ₹${((parseFloat(floor.railingRft)||0) * ({ms:600,ss:900,ss_glass:1300,glass_wood:1800}[floor.railingType]||0)).toLocaleString('en-IN')}`}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* AC Points */}
                      {hasAc && !isParking(floor.type) && (
                        <>
                          <Separator />
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">AC Points on this floor</Label>
                            <Input type="number" min="0" className="mt-1.5" value={floor.acPoints} onChange={e => updateFloor(index, 'acPoints', e.target.value)} />
                            <p className="text-xs text-gray-400 mt-1">₹10,000 per AC point</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-3">Total Summary</p>
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-center">
                    {[
                      { label: 'Bedroom', value: totalDoors.bedroom },
                      { label: 'Washroom', value: totalDoors.washroom },
                      { label: 'Toilets', value: totalDoors.toilets },
                      { label: 'Balcony', value: totalDoors.balcony },
                      { label: 'Utility', value: totalDoors.utility },
                      { label: 'Kitchens', value: totalDoors.kitchens },
                      { label: 'Pooja', value: totalDoors.poojaRoom },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-lg p-2 border border-blue-100">
                        <p className="text-lg font-bold text-blue-700">{item.value}</p>
                        <p className="text-xs text-blue-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4 — Optional */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">4</Badge>Optional Features</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium">Lift</p><p className="text-xs text-gray-400">Include lift shaft and machine room provision</p></div>
                  <Switch checked={hasLift} onCheckedChange={setHasLift} />
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div><p className="text-sm font-medium">Underground Sump</p><p className="text-xs text-gray-400">RCC: ₹13/litre · Block: ₹30,000 fixed</p></div>
                    <Switch checked={hasSump} onCheckedChange={setHasSump} />
                  </div>
                  {hasSump && (
                    <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-100">
                      <div className="space-y-1.5"><Label>Capacity (litres)</Label><Input type="number" value={sumpCapacity} onChange={e => setSumpCapacity(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Sump Type</Label>
                        <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={sumpType} onChange={e => setSumpType(e.target.value)}>
                          <option value="rcc">RCC Sump (₹13 per litre)</option>
                          <option value="block">Block Sump (₹30,000 fixed)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div><p className="text-sm font-medium">SSM Work</p><p className="text-xs text-gray-400">Size stone masonry — minimum 2 courses</p></div>
                    <Switch checked={hasSsm} onCheckedChange={setHasSsm} />
                  </div>
                  {hasSsm && (
                    <div className="pl-4 border-l-2 border-blue-100 w-48">
                      <Label>Number of Courses</Label>
                      <Input type="number" min="2" className="mt-1.5" value={ssmCourses} onChange={e => setSsmCourses(e.target.value)} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 5 — Services */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">5</Badge>Services &amp; Provisions</CardTitle></CardHeader>
              <CardContent>
                {[
                  { label: 'Compound Wall', sub: 'Boundary wall on all 4 sides', state: hasCompoundWall, set: setHasCompoundWall, isDefault: true },
                  { label: 'Main Gate', sub: 'Entry gate — ₹30,000 to ₹50,000', state: hasMainGate, set: setHasMainGate, isDefault: true },
                  {
                    label: 'Overhead Tank (OHT)', sub: 'Water storage on terrace — ₹7/litre', state: hasOht, set: setHasOht, isDefault: true,
                    extra: hasOht && (
                      <div className="pl-4 border-l-2 border-blue-100 mt-2 pb-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label className="text-xs">OHT Capacity</Label>
                            <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={ohtCapacity} onChange={e => setOhtCapacity(e.target.value)}>
                              <option value="500">500L — ₹3,500</option>
                              <option value="1000">1,000L — ₹7,000</option>
                              <option value="2000">2,000L — ₹14,000</option>
                              <option value="5000">5,000L — ₹35,000</option>
                              <option value="10000">10,000L — ₹70,000</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                          {ohtCapacity === 'custom' && (
                            <div className="space-y-1.5"><Label className="text-xs">Custom Litres</Label>
                              <Input type="number" value={ohtCustom} onChange={e => setOhtCustom(e.target.value)} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  },
                  { label: 'Rainwater Harvesting', sub: 'Drain covers + pit —', state: hasRainwater, set: setHasRainwater, isDefault: true },
                  { label: 'Gas Pipeline', sub: '15 rft per floor ', state: hasGas, set: setHasGas, isDefault: true },
                  { label: 'AC Provision', sub: 'Enter points per floor above', state: hasAc, set: setHasAc, isDefault: false },
                  { label: 'CCTV Provision', sub: '₹10,000 per floor', state: hasCctv, set: setHasCctv, isDefault: false },
                  { label: 'EV Charging Point', sub: '₹10,000 per unit', state: hasEv, set: setHasEv, isDefault: false },
                  { label: 'Solar Provision', sub: '₹30,000', state: hasSolar, set: setHasSolar, isDefault: false },
                  { label: 'UPS Provision', sub: '₹20,000', state: hasUps, set: setHasUps, isDefault: false },
                  { label: 'WiFi & Cable Provision', sub: '₹10,000', state: hasWifi, set: setHasWifi, isDefault: false },
                ].map((item, i) => (
                  <div key={i} className="border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between py-3 px-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.label}</p>
                          {item.isDefault && <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">default on</Badge>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                      </div>
                      <Switch checked={item.state} onCheckedChange={item.set} />
                    </div>
                    {item.extra}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section 6 — Painting */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">6</Badge>Painting</CardTitle></CardHeader>
              <CardContent>
                <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={paintingGrade} onChange={e => setPaintingGrade(e.target.value)}>
                  <option value="">— Select painting grade —</option>
                  {PAINTING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </CardContent>
            </Card>

            {/* Section 7 — Custom Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">7</Badge>Custom Add-on Items</CardTitle>
                  <Button variant="outline" size="sm" onClick={addCustomItem}>+ Add Item</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {editCustomItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1.5">{index === 0 && <Label className="text-xs">Item Name</Label>}<Input placeholder="e.g. Landscaping" value={item.item_name} onChange={e => updateCustomItem(index, 'item_name', e.target.value)} /></div>
                    <div className="col-span-2 space-y-1.5">{index === 0 && <Label className="text-xs">Qty</Label>}<Input type="number" value={item.quantity} onChange={e => updateCustomItem(index, 'quantity', e.target.value)} /></div>
                    <div className="col-span-3 space-y-1.5">{index === 0 && <Label className="text-xs">Unit Price (₹)</Label>}<Input type="number" value={item.unit_price} onChange={e => updateCustomItem(index, 'unit_price', e.target.value)} /></div>
                    <div className="col-span-2 space-y-1.5">{index === 0 && <Label className="text-xs">Total</Label>}
                      <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 flex items-center">₹{getCustomItemTotal(item)}</div>
                    </div>
                    <div className="col-span-1">{index === 0 && <div className="h-5" />}{editCustomItems.length > 1 && <button onClick={() => removeCustomItem(index)} className="h-10 w-full text-red-400 hover:text-red-600 text-xl flex items-center justify-center">×</button>}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pb-4">
              <Button size="lg" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>

            {/* ── Bill of Quantities ── */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center"><span className="px-4 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-widest">Bill of Quantities</span></div>
            </div>

            {hasAnyOverride && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
                Some quantities/prices have been manually adjusted and saved. All admins see these values.
              </div>
            )}

            {/* BOQ Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bill of Quantities</h2>
                <p className="text-xs text-gray-400 mt-0.5">Edit Qty or Unit Price inline — changes auto-save and are visible to all admins</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Item</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Unit</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Unit Price</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([stage, items]) => (
                    <>
                      <tr key={stage} className="bg-blue-50">
                        <td colSpan={5} className="px-6 py-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">{stage}</td>
                      </tr>
                      {items.map((item) => {
                        const ov = boqOverrides[item._idx]
                        const qtyOverridden = ov?.quantity !== undefined
                        const upOverridden = ov?.unit_price !== undefined
                        const isFixed = item.unit === 'fixed'
                        return (
                          <tr key={item._idx} className={`border-b border-gray-50 hover:bg-gray-50/70 ${ov ? 'bg-amber-50/30' : ''}`}>
                            <td className="px-6 py-2 text-gray-700">{item.item_name}</td>
                            <td className="px-4 py-2 text-right text-gray-500 text-xs">{isFixed ? 'Lumpsum' : item.unit || '—'}</td>
                            <td className="px-4 py-2 text-right">
                              {isFixed && item.quantity == null ? (
                                <span className="text-gray-300 text-xs">—</span>
                              ) : (
                                <input
                                  type="number"
                                  value={qtyOverridden ? ov.quantity : (item.quantity ?? '')}
                                  onChange={e => handleOverride(item._idx, 'quantity', e.target.value)}
                                  className={`w-24 text-right px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 ${qtyOverridden ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 bg-white text-gray-600'}`}
                                />
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <input
                                type="number"
                                value={upOverridden ? ov.unit_price : (item.unit_price ?? '')}
                                onChange={e => handleOverride(item._idx, 'unit_price', e.target.value)}
                                className={`w-28 text-right px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 ${upOverridden ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-gray-200 bg-white text-gray-600'}`}
                              />
                            </td>
                            <td className="px-6 py-2 text-right font-medium text-gray-800">{formatCurrency(getDisplayTotal(item))}</td>
                          </tr>
                        )
                      })}
                    </>
                  ))}
                  {customItems.length > 0 && (
                    <>
                      <tr className="bg-amber-50">
                        <td colSpan={5} className="px-6 py-2 text-xs font-semibold text-amber-700 uppercase tracking-wide">Custom Add-on Items</td>
                      </tr>
                      {customItems.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-700">{item.item_name}</td>
                          <td className="px-4 py-3 text-right text-gray-500">—</td>
                          <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-3 text-right font-medium text-gray-800">{formatCurrency(item.total_price)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-800">
                    <td colSpan={4} className="px-6 py-4 text-white font-semibold">Grand Total</td>
                    <td className="px-6 py-4 text-right text-white font-bold text-base">{formatCurrency(overriddenGrandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

      </div>
    </AppLayout>
  )
}
