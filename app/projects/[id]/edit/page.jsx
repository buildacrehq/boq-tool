'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import AppLayout from '@/components/layout/AppLayout'

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
  return { index, name: FLOOR_NAMES[index], type: '', sqft: '', mainDoor: 'teak_3x7', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 0, utilityDoors: 0, poojaRoom: false, kitchens: 1, staircaseType: 'chain', staircaseSteps: 19, tilesSquft: '', tilesPricePerSqft: 50, railingType: '', railingRft: 25, acPoints: 0, windowSqft: '' }
}

const isParking = (type) => ['parking_only', 'parking_lift', 'commercial_parking'].includes(type)

export default function EditProjectPage() {
  const router = useRouter()
  const { id } = useParams()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [marketPrices, setMarketPrices] = useState({})

  // Section 1
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientLocation, setClientLocation] = useState('')

  // Section 2
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const sqft = width && length ? parseFloat(width) * parseFloat(length) : null

  // Masonry
  const [masonryType, setMasonryType] = useState('block')

  // Floors
  const [floorCount, setFloorCount] = useState(1)
  const [floors, setFloors] = useState([createFloor(0)])

  // Optional
  const [hasLift, setHasLift] = useState(false)
  const [hasSump, setHasSump] = useState(false)
  const [sumpCapacity, setSumpCapacity] = useState('')
  const [sumpType, setSumpType] = useState('block')
  const [hasSsm, setHasSsm] = useState(false)
  const [ssmCourses, setSsmCourses] = useState('')

  // Services
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

  // Finishes
  const [paintingGrade, setPaintingGrade] = useState('')
  const [windowType, setWindowType] = useState('')
  const [railingType, setRailingType] = useState('')
  const [flooringType, setFlooringType] = useState('')

  // Custom items
  const [customItems, setCustomItems] = useState([{ item_name: '', quantity: '', unit_price: '', notes: '' }])

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    fetchAll()
  }, [id])

  async function fetchAll() {
    const [{ data: proj }, { data: customs }, { data: prices }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('custom_items').select('*').eq('project_id', id),
      supabase.from('market_prices').select('*'),
    ])

    if (prices) {
      const map = {}
      prices.forEach(p => {
        const price = parseFloat(p.price)
        map[p.item_name] = price
        if (['tractor', '709', '6 wheeler', '10 wheeler'].includes(p.unit)) {
          const unitKey = p.unit === '6 wheeler' ? '6w' : p.unit === '10 wheeler' ? '10w' : p.unit
          map[`${p.item_name}_${unitKey}`] = price
        }
      })
      setMarketPrices(map)
    }

    if (proj) {
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

      // Load floors_data if exists, else build from floor count
      if (proj.floors_data && proj.floors_data.length > 0) {
        setFloors(proj.floors_data)
      } else {
        const count = proj.floor_count || proj.floors || 1
        setFloors(Array.from({ length: count }, (_, i) => createFloor(i)))
      }
    }

    if (customs && customs.length > 0) {
      setCustomItems(customs.map(c => ({ id: c.id, item_name: c.item_name, quantity: c.quantity, unit_price: c.unit_price, notes: c.notes || '' })))
    }

    setLoading(false)
  }

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

  function addCustomItem() { setCustomItems(p => [...p, { item_name: '', quantity: '', unit_price: '', notes: '' }]) }
  function removeCustomItem(i) { setCustomItems(p => p.filter((_, idx) => idx !== i)) }
  function updateCustomItem(i, field, value) { setCustomItems(p => { const u = [...p]; u[i][field] = value; return u }) }
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
    const validItems = customItems.filter(i => i.item_name && i.unit_price)
    if (validItems.length > 0) {
      await supabase.from('custom_items').insert(validItems.map(item => ({
        project_id: id, item_name: item.item_name,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price),
        total_price: (parseFloat(item.quantity) || 1) * parseFloat(item.unit_price),
        notes: item.notes,
      })))
    }

    router.push(`/projects/${id}`)
    setSaving(false)
  }

  if (loading) return <AppLayout><div className="p-8 text-gray-400">Loading...</div></AppLayout>

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/projects/${id}`)} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">Edit BOQ — {clientName}</h1>
              <p className="text-sm text-gray-400">Changes will recalculate the full BOQ</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push(`/projects/${id}`)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* Section 1 */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Badge variant="outline">1</Badge>Client Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Client Name *</Label><Input value={clientName} onChange={e => setClientName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone Number</Label><Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Site Location</Label><Input value={clientLocation} onChange={e => setClientLocation(e.target.value)} /></div>
            </CardContent>
          </Card>

          {/* Section 2 */}
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

          {/* Masonry */}
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
                  {[1,2,3,4,5,6,7].map((n, i) => (
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
                            <div className="h-10 flex items-center gap-2"><Switch checked={floor.poojaRoom} onCheckedChange={v => updateFloor(index, 'poojaRoom', v)} /><span className="text-xs text-gray-400">₹20,000</span></div>
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
                { label: 'Overhead Tank (OHT)', sub: 'Water storage on terrace — ₹7/litre', state: hasOht, set: setHasOht, isDefault: true,
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
                { label: 'Rainwater Harvesting', sub: 'Drain covers + pit — ₹20,000', state: hasRainwater, set: setHasRainwater, isDefault: true },
                { label: 'Gas Pipeline', sub: `15 rft per floor @ ₹200/rft`, state: hasGas, set: setHasGas, isDefault: true },
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
              {customItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4 space-y-1.5">{index === 0 && <Label className="text-xs">Item Name</Label>}<Input placeholder="e.g. Landscaping" value={item.item_name} onChange={e => updateCustomItem(index, 'item_name', e.target.value)} /></div>
                  <div className="col-span-2 space-y-1.5">{index === 0 && <Label className="text-xs">Qty</Label>}<Input type="number" value={item.quantity} onChange={e => updateCustomItem(index, 'quantity', e.target.value)} /></div>
                  <div className="col-span-3 space-y-1.5">{index === 0 && <Label className="text-xs">Unit Price (₹)</Label>}<Input type="number" value={item.unit_price} onChange={e => updateCustomItem(index, 'unit_price', e.target.value)} /></div>
                  <div className="col-span-2 space-y-1.5">{index === 0 && <Label className="text-xs">Total</Label>}
                    <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 flex items-center">₹{getCustomItemTotal(item)}</div>
                  </div>
                  <div className="col-span-1">{index === 0 && <div className="h-5" />}{customItems.length > 1 && <button onClick={() => removeCustomItem(index)} className="h-10 w-full text-red-400 hover:text-red-600 text-xl flex items-center justify-center">×</button>}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pb-8">
            <Button variant="outline" onClick={() => router.push(`/projects/${id}`)}>Cancel</Button>
            <Button size="lg" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}