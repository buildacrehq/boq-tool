'use client'
import AppLayout from '@/components/layout/AppLayout'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateFullBOQ } from '@/lib/calculate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const FLOOR_NAMES = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor', 'Sixth Floor']

const GROUND_TYPES = [
  { value: '1bhk',            label: '1 BHK (Single Unit)' },
  { value: '1bhk_2units',     label: '1 BHK (2 Units)' },
  { value: '1bhk_parking',    label: '1 BHK + Parking' },
  { value: '2bhk',            label: '2 BHK (Single Unit)' },
  { value: '2bhk_parking',    label: '2 BHK + Parking' },
  { value: '1bhk_2bhk',       label: '1 BHK + 2 BHK Mix' },
  { value: '2bhk_3bhk',       label: '2 BHK + 3 BHK Mix' },
  { value: '3bhk',            label: '3 BHK' },
  { value: 'duplex_gf',       label: 'Duplex Starts in GF' },
  { value: 'parking_only',    label: 'Only Parking' },
  { value: 'parking_lift',    label: 'Only Parking + Lift' },
  { value: 'commercial_parking', label: 'Commercial + Parking' },
]

const UPPER_TYPES = [
  { value: '1bhk',        label: '1 BHK (Single Unit)' },
  { value: '1bhk_2units', label: '1 BHK (2 Units)' },
  { value: '2bhk',        label: '2 BHK (Single Unit)' },
  { value: '1bhk_2bhk',  label: '1 BHK + 2 BHK Mix' },
  { value: '2bhk_3bhk',  label: '2 BHK + 3 BHK Mix' },
  { value: '3bhk',        label: '3 BHK' },
  { value: 'duplex_ff',   label: 'Duplex Starts in FF' },
  { value: 'duplex_sf',   label: 'Duplex Starts in SF' },
]

const GROUND_GROUPS = [
  { label: '1 BHK',     values: ['1bhk', '1bhk_2units', '1bhk_parking'] },
  { label: '2 BHK',     values: ['2bhk', '2bhk_parking', '1bhk_2bhk', '2bhk_3bhk'] },
  { label: '3 BHK',     values: ['3bhk'] },
  { label: 'Duplex',    values: ['duplex_gf'] },
  { label: 'Parking',   values: ['parking_only', 'parking_lift'] },
  { label: 'Commercial',values: ['commercial_parking'] },
]

const UPPER_GROUPS = [
  { label: '1 BHK',  values: ['1bhk', '1bhk_2units'] },
  { label: '2 BHK',  values: ['2bhk', '1bhk_2bhk', '2bhk_3bhk'] },
  { label: '3 BHK',  values: ['3bhk'] },
  { label: 'Duplex', values: ['duplex_ff', 'duplex_sf'] },
]

const DUPLEX_END_TYPES = [
  { value: 'duplex_end_2mb', label: 'Duplex End — 2 Master Bedrooms' },
  { value: 'duplex_end_study', label: 'Duplex End — 2 Master Beds + Study Room' },
]

const MAIN_DOOR_TYPES = [
  { value: 'teak_3x7',        label: 'Teak 3×7',                  priceKey: 'Main Door Teak 3x7',        fallback: 50000 },
  { value: 'teak_3x7_window', label: 'Teak 3×7 with Window',       priceKey: 'Main Door Teak 3x7 Window', fallback: 70000 },
  { value: 'teak_4x8',        label: 'Teak 4×8',                  priceKey: 'Main Door Teak 4x8',        fallback: 70000 },
  { value: 'teak_4x8_window', label: 'Teak 4×8 with Window',       priceKey: 'Main Door Teak 4x8 Window', fallback: 100000 },
  { value: 'teak_5x8',        label: 'Teak 5×8',                  priceKey: 'Main Door Teak 5x8',        fallback: 120000 },
  { value: 'teak_5x8_window', label: 'Teak 5×8 with Window',       priceKey: 'Main Door Teak 5x8 Window', fallback: 135000 },
  { value: 'normal',          label: 'Normal Door',                priceKey: 'Main Door Normal',          fallback: 15000 },
]

const RAILING_TYPES = [
  { value: 'ms',         label: 'MS Railing',              priceKey: 'Railing MS',         fallback: 600 },
  { value: 'ss',         label: 'SS Railing',              priceKey: 'Railing SS',         fallback: 900 },
  { value: 'ss_glass',   label: 'SS with Glass',           priceKey: 'Railing SS Glass',   fallback: 1300 },
  { value: 'glass_wood', label: 'Glass with Wooden Top',   priceKey: 'Railing Glass Wood', fallback: 1800 },
]

const PAINTING_TYPES = [
  { value: 'premium_emulsion', label: 'Interior Premium + Exterior Emulsion', priceKey: 'Painting Premium+Emulsion', fallback: 8500 },
  { value: 'tractor_emulsion', label: 'Interior Tractor + Exterior Emulsion', priceKey: 'Painting Tractor+Emulsion', fallback: 7500 },
  { value: 'royal_emulsion',   label: 'Interior Royal + Exterior Emulsion',   priceKey: 'Painting Royal+Emulsion',   fallback: 10000 },
  { value: 'royal_ultima',     label: 'Interior Royal + Exterior Ultima',     priceKey: 'Painting Royal+Ultima',     fallback: 13000 },
]

const WINDOW_TYPES = [
  { value: 'upvc_white', label: 'UPVC White Profile',  priceKey: 'Window UPVC White', fallback: 600 },
  { value: 'upvc_wood',  label: 'UPVC Wooden Profile', priceKey: 'Window UPVC Wood',  fallback: 1000 },
  { value: 'wood_saal',  label: 'Wooden Saal Wood',    priceKey: 'Window Wood Saal',  fallback: 1500 },
]

const OHT_OPTIONS = ['500', '1000', '2000', '5000', '10000', 'custom']

function getDefaultDoors(floorType) {
  switch (floorType) {
    case '1bhk':
    case '1bhk_parking':
      return { mainDoor: 'teak_3x7', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 1, utilityDoors: 0, poojaRoom: false, kitchens: 1 }
    case '1bhk_2units':
      return { mainDoor: 'teak_3x7', bedroomDoors: 2, washroomDoors: 2, toilets: 2, balconyDoors: 2, utilityDoors: 0, poojaRoom: false, kitchens: 2 }
    case '2bhk':
    case '2bhk_parking':
      return { mainDoor: 'teak_3x7', bedroomDoors: 2, washroomDoors: 2, toilets: 2, balconyDoors: 1, utilityDoors: 1, poojaRoom: true, kitchens: 1 }
    case '1bhk_2bhk':
      return { mainDoor: 'teak_3x7', bedroomDoors: 3, washroomDoors: 3, toilets: 3, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 2 }
    case '2bhk_3bhk':
      return { mainDoor: 'teak_3x7', bedroomDoors: 5, washroomDoors: 4, toilets: 4, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 2 }
    case '3bhk':
      return { mainDoor: 'teak_3x7', bedroomDoors: 3, washroomDoors: 2, toilets: 2, balconyDoors: 2, utilityDoors: 1, poojaRoom: true, kitchens: 1 }
    case 'duplex_gf':
    case 'duplex_ff':
    case 'duplex_sf':
      return { mainDoor: 'teak_4x8', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 1, utilityDoors: 0, poojaRoom: false, kitchens: 1 }
    case 'duplex_end_2mb':
      return { mainDoor: '', bedroomDoors: 2, washroomDoors: 2, toilets: 2, balconyDoors: 1, utilityDoors: 0, poojaRoom: false, kitchens: 0 }
    case 'duplex_end_study':
      return { mainDoor: '', bedroomDoors: 3, washroomDoors: 3, toilets: 3, balconyDoors: 1, utilityDoors: 0, poojaRoom: false, kitchens: 0 }
    case 'duplex_end':
      return { mainDoor: '', bedroomDoors: 2, washroomDoors: 2, toilets: 2, balconyDoors: 1, utilityDoors: 0, poojaRoom: false, kitchens: 0 }
    case 'parking_only':
    case 'parking_lift':
    case 'commercial_parking':
      return { mainDoor: '', bedroomDoors: 0, washroomDoors: 1, toilets: 1, balconyDoors: 0, utilityDoors: 0, poojaRoom: false, kitchens: 0 }
    default:
      return { mainDoor: 'teak_3x7', bedroomDoors: 1, washroomDoors: 1, toilets: 1, balconyDoors: 0, utilityDoors: 0, poojaRoom: false, kitchens: 1 }
  }
}

function createFloor(index, defaultTilePrice = 50) {
  return {
    index,
    name: FLOOR_NAMES[index],
    type: '',
    sqft: '',
    mainDoor: 'teak_3x7',
    bedroomDoors: 1,
    washroomDoors: 1,
    toilets: 1,
    balconyDoors: 0,
    utilityDoors: 0,
    poojaRoom: false,
    poojaRoomPrice: '',
    kitchens: 1,
    staircaseType: 'normal',
    staircaseSteps: 19,
    tilesSquft: '',
    tilesPricePerSqft: defaultTilePrice,
    railingType: 'ss',
    railingRft: 25,
    acPoints: 0,
    evPoints: 0,
    upsUnits: 1,
    windowSqft: '',
  }
}

const DRAFT_KEY = 'boq_new_draft'

export default function NewProjectPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [marketPrices, setMarketPrices] = useState({})
  const [boqData, setBoqData] = useState({})
  const [vehicleData, setVehicleData] = useState({})
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [mobileTab, setMobileTab] = useState('form')
  const autoSaveReady = useRef(false)
  const submittingRef = useRef(false)

  // All state declarations must come before useEffect hooks that reference them
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientLocation, setClientLocation] = useState('')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [isIrregular, setIsIrregular] = useState(false)
  const [sideFront, setSideFront] = useState('')
  const [sideBack, setSideBack] = useState('')
  const [sideLeft, setSideLeft] = useState('')
  const [sideRight, setSideRight] = useState('')
  const [masonryType, setMasonryType] = useState('block')
  const [customBlockPrice, setCustomBlockPrice] = useState('')
  const [customBrickPrice, setCustomBrickPrice] = useState('')
  const [floorCount, setFloorCount] = useState(1)
  const [floors, setFloors] = useState([createFloor(0)])
  const [hasLift, setHasLift] = useState(false)
  const [hasSump, setHasSump] = useState(true)
  const [sumpCapacity, setSumpCapacity] = useState('')
  const [sumpType, setSumpType] = useState('rcc')
  const [sumpRateOverride, setSumpRateOverride] = useState('')
  const [hasSsm, setHasSsm] = useState(false)
  const [ssmCourses, setSsmCourses] = useState('')
  const [hasCompoundWall, setHasCompoundWall] = useState(true)
  const [hasRainwater, setHasRainwater] = useState(true)
  const [hasGas, setHasGas] = useState(true)
  const [hasOht, setHasOht] = useState(true)
  const [ohtCapacity, setOhtCapacity] = useState('1000')
  const [ohtCustom, setOhtCustom] = useState('')
  const [ohtCustomPrice, setOhtCustomPrice] = useState('')
  const [mainGateCustomPrice, setMainGateCustomPrice] = useState('')
  const [hasMainGate, setHasMainGate] = useState(true)
  const [hasAc, setHasAc] = useState(false)
  const [hasCctv, setHasCctv] = useState(false)
  const [hasSolar, setHasSolar] = useState(false)
  const [hasUps, setHasUps] = useState(false)
  const [hasWifi, setHasWifi] = useState(false)
  const [paintingGrade, setPaintingGrade] = useState('royal_emulsion')
  const [windowType, setWindowType] = useState('upvc_white')
  const [railingType, setRailingType] = useState('')
  const [flooringType, setFlooringType] = useState('')
  const [customItems, setCustomItems] = useState([{ item_name: '', quantity: '', unit_price: '', notes: '' }])

  const mp = (key, fallback) => parseFloat(marketPrices[key]) || fallback
  const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`

  const r = {
    bedroomDoor:   mp('Bedroom Door', 12000),
    washroomDoor:  mp('Washroom Door', 10000),
    balconyDoor:   mp('Balcony Door', 12000),
    utilityDoor:   mp('Utility Door', 10000),
    poojaRoomDoor: mp('Pooja Room Door', 20000),
    oht:           mp('OHT Water Tank', 7),
    sumpRcc:       mp('Sump RCC', 13),
    sumpBlock:     mp('Sump Block', 30000),
    rainwater:     mp('Rainwater Harvesting', 20000),
    gas:           mp('Gas Pipeline', 200),
    mainGateS:     mp('Main Gate Small', 30000),
    mainGateL:     mp('Main Gate Large', 50000),
    ac:            mp('AC Provision', 10000),
    cctv:          mp('CCTV Provision', 10000),
    ev:            mp('EV Charging Point', 10000),
    solar:         mp('Solar Provision', 30000),
    ups:           mp('UPS Provision', 20000),
    wifi:          mp('Wifi Cable Provision', 10000),
    railing: {
      ms:         mp('Railing MS', 600),
      ss:         mp('Railing SS', 900),
      ss_glass:   mp('Railing SS Glass', 1300),
      glass_wood: mp('Railing Glass Wood', 1800),
    },
  }

  useEffect(() => {
    const stored = localStorage.getItem('boq_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    fetchMarketPrices()
    if (localStorage.getItem(DRAFT_KEY)) setShowRestorePrompt(true)
    setTimeout(() => { autoSaveReady.current = true }, 500)
  }, [])

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!autoSaveReady.current) return
    const draft = {
      clientName, clientPhone, clientLocation, width, length, isIrregular, sideFront, sideBack, sideLeft, sideRight, masonryType,
      floorCount, floors, hasLift, hasSump, sumpCapacity, sumpType, sumpRateOverride, hasSsm, ssmCourses,
      hasCompoundWall, hasRainwater, hasGas, hasOht, ohtCapacity, ohtCustom, ohtCustomPrice, mainGateCustomPrice,
      hasMainGate, hasAc, hasCctv, hasSolar, hasUps, hasWifi,
      paintingGrade, windowType, railingType, flooringType, customItems,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [clientName, clientPhone, clientLocation, width, length, isIrregular, sideFront, sideBack, sideLeft, sideRight, masonryType,
      floorCount, floors, hasLift, hasSump, sumpCapacity, sumpType, sumpRateOverride, hasSsm, ssmCourses,
      hasCompoundWall, hasRainwater, hasGas, hasOht, ohtCapacity, ohtCustom, ohtCustomPrice, mainGateCustomPrice,
      hasMainGate, hasAc, hasCctv, hasSolar, hasUps, hasWifi,
      paintingGrade, windowType, railingType, flooringType, customItems])

  // Warn on browser back / tab close
  useEffect(() => {
    const handle = (e) => {
      if (clientName || width || length) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handle)
    return () => window.removeEventListener('beforeunload', handle)
  }, [clientName, width, length])

  function restoreDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}')
      if (d.clientName !== undefined) setClientName(d.clientName)
      if (d.clientPhone !== undefined) setClientPhone(d.clientPhone)
      if (d.clientLocation !== undefined) setClientLocation(d.clientLocation)
      if (d.width !== undefined) setWidth(d.width)
      if (d.length !== undefined) setLength(d.length)
      if (d.isIrregular !== undefined) setIsIrregular(d.isIrregular)
      if (d.sideFront !== undefined) setSideFront(d.sideFront)
      if (d.sideBack !== undefined) setSideBack(d.sideBack)
      if (d.sideLeft !== undefined) setSideLeft(d.sideLeft)
      if (d.sideRight !== undefined) setSideRight(d.sideRight)
      if (d.masonryType !== undefined) setMasonryType(d.masonryType)
      if (d.floorCount !== undefined) setFloorCount(d.floorCount)
      if (d.floors !== undefined) setFloors(d.floors)
      if (d.hasLift !== undefined) setHasLift(d.hasLift)
      if (d.hasSump !== undefined) setHasSump(d.hasSump)
      if (d.sumpCapacity !== undefined) setSumpCapacity(d.sumpCapacity)
      if (d.sumpType !== undefined) setSumpType(d.sumpType)
      if (d.sumpRateOverride !== undefined) setSumpRateOverride(d.sumpRateOverride)
      if (d.hasSsm !== undefined) setHasSsm(d.hasSsm)
      if (d.ssmCourses !== undefined) setSsmCourses(d.ssmCourses)
      if (d.hasCompoundWall !== undefined) setHasCompoundWall(d.hasCompoundWall)
      if (d.hasRainwater !== undefined) setHasRainwater(d.hasRainwater)
      if (d.hasGas !== undefined) setHasGas(d.hasGas)
      if (d.hasOht !== undefined) setHasOht(d.hasOht)
      if (d.ohtCapacity !== undefined) setOhtCapacity(d.ohtCapacity)
      if (d.ohtCustom !== undefined) setOhtCustom(d.ohtCustom)
      if (d.ohtCustomPrice !== undefined) setOhtCustomPrice(d.ohtCustomPrice)
      if (d.mainGateCustomPrice !== undefined) setMainGateCustomPrice(d.mainGateCustomPrice)
      if (d.hasMainGate !== undefined) setHasMainGate(d.hasMainGate)
      if (d.hasAc !== undefined) setHasAc(d.hasAc)
      if (d.hasCctv !== undefined) setHasCctv(d.hasCctv)
      if (d.hasSolar !== undefined) setHasSolar(d.hasSolar)
      if (d.hasUps !== undefined) setHasUps(d.hasUps)
      if (d.hasWifi !== undefined) setHasWifi(d.hasWifi)
      if (d.paintingGrade !== undefined) setPaintingGrade(d.paintingGrade)
      if (d.windowType !== undefined) setWindowType(d.windowType)
      if (d.railingType !== undefined) setRailingType(d.railingType)
      if (d.flooringType !== undefined) setFlooringType(d.flooringType)
      if (d.customItems !== undefined) setCustomItems(d.customItems)
    } catch {}
    setShowRestorePrompt(false)
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setShowRestorePrompt(false)
  }

  function handleCancel() {
    const hasData = clientName || width || length || floors.some(f => f.type)
    if (hasData) setShowDiscardModal(true)
    else { localStorage.removeItem(DRAFT_KEY); router.push('/projects') }
  }

  async function fetchMarketPrices() {
    const [{ data: pricesData }, { data: boqRows }, { data: vRows }] = await Promise.all([
      supabase.from('market_prices').select('*'),
      supabase.from('boq_quantities').select('*'),
      supabase.from('boq_vehicle_types').select('*'),
    ])
    const map = {}
    pricesData?.forEach(p => {
      const price = parseFloat(p.price)
      map[p.item_name] = price
      if (['tractor', '709', '6 wheeler', '10 wheeler'].includes(p.unit)) {
        const unitKey = p.unit === '6 wheeler' ? '6w' : p.unit === '10 wheeler' ? '10w' : p.unit
        map[`${p.item_name}_${unitKey}`] = price
      }
    })
    setMarketPrices(map)
    const boqMap = {}
    boqRows?.forEach(r => {
      boqMap[r.row_key] = { '20x30': r.s20x30, '20x40': r.s20x40, '30x40': r.s30x40, '30x50': r.s30x50, '40x40': r.s40x40, '40x60': r.s40x60, divisible: r.divisible }
    })
    setBoqData(boqMap)
    const vMap = {}
    vRows?.forEach(r => {
      vMap[r.row_key] = { '20x30': r.s20x30, '20x40': r.s20x40, '30x40': r.s30x40, '30x50': r.s30x50, '40x40': r.s40x40, '40x60': r.s40x60 }
    })
    setVehicleData(vMap)
  }

  function brahmaguptaArea(a, b, c, d) {
    const s = (a + b + c + d) / 2
    return Math.sqrt((s - a) * (s - b) * (s - c) * (s - d))
  }

  const sqft = isIrregular
    ? (sideFront && sideBack && sideLeft && sideRight
        ? Math.round(brahmaguptaArea(parseFloat(sideFront), parseFloat(sideBack), parseFloat(sideLeft), parseFloat(sideRight)))
        : null)
    : (width && length ? parseFloat(width) * parseFloat(length) : null)


  function handleFloorCountChange(count) {
    const newCount = parseInt(count)
    setFloorCount(newCount)
    setFloors(prev => Array.from({ length: newCount }, (_, i) => prev[i] || createFloor(i, marketPrices['Tiles Basic'] || 50)))
  }

  function handleFloorTypeChange(index, type) {
    const defaults = getDefaultDoors(type)
    const isDuplexEnd = ['duplex_end_2mb', 'duplex_end_study', 'duplex_end'].includes(type)
    const isDuplex = ['duplex_gf', 'duplex_ff', 'duplex_sf'].includes(type) || isDuplexEnd
    const isParkingType = ['parking_only', 'parking_lift', 'commercial_parking'].includes(type)
    setFloors(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index], type, ...defaults,
        railingType: isDuplex ? 'ss_glass' : 'ss',
        staircaseType: isDuplex ? 'chain' : 'normal',
        acPoints: isParkingType ? 0 : 2,
        evPoints: (index === 0 && !isParkingType) ? 2 : 0,
      }
      // When a duplex start is selected, clear the next floor so user must pick an end option
      if (['duplex_gf', 'duplex_ff', 'duplex_sf'].includes(type) && index + 1 < updated.length) {
        updated[index + 1] = { ...updated[index + 1], type: '' }
      }
      return updated
    })
  }

  function copyFloor(fromIndex, toIndex) {
    setFloors(prev => {
      const updated = [...prev]
      const from = updated[fromIndex]
      updated[toIndex] = {
        ...updated[toIndex],
        type: from.type,
        sqft: from.sqft,
        mainDoor: from.mainDoor,
        bedroomDoors: from.bedroomDoors,
        washroomDoors: from.washroomDoors,
        toilets: from.toilets,
        balconyDoors: from.balconyDoors,
        utilityDoors: from.utilityDoors,
        poojaRoom: from.poojaRoom,
        poojaRoomPrice: from.poojaRoomPrice,
        kitchens: from.kitchens,
        staircaseType: from.staircaseType,
        staircaseSteps: from.staircaseSteps,
        tilesSquft: from.tilesSquft,
        tilesPricePerSqft: from.tilesPricePerSqft,
        railingType: from.railingType,
        railingRft: from.railingRft,
        acPoints: from.acPoints,
        evPoints: from.evPoints,
        upsUnits: from.upsUnits,
        windowSqft: from.windowSqft,
      }
      return updated
    })
  }

  function updateFloor(index, field, value) {
    setFloors(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function adjustSteps(index, delta) {
    setFloors(prev => {
      const updated = [...prev]
      const current = parseInt(updated[index].staircaseSteps) || 19
      updated[index] = { ...updated[index], staircaseSteps: Math.max(1, current + delta) }
      return updated
    })
  }

  function addCustomItem() {
    setCustomItems(prev => [...prev, { item_name: '', quantity: '', unit_price: '', notes: '' }])
  }

  function removeCustomItem(index) {
    setCustomItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateCustomItem(index, field, value) {
    setCustomItems(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  function getCustomItemTotal(item) {
    return ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString('en-IN')
  }

  // Totals summary
  const totalDoors = floors.reduce((acc, f) => ({
    bedroom: acc.bedroom + (parseInt(f.bedroomDoors) || 0),
    washroom: acc.washroom + (parseInt(f.washroomDoors) || 0),
    toilets: acc.toilets + (parseInt(f.toilets) || 0),
    balcony: acc.balcony + (parseInt(f.balconyDoors) || 0),
    utility: acc.utility + (parseInt(f.utilityDoors) || 0),
    kitchens: acc.kitchens + (parseInt(f.kitchens) || 0),
    poojaRoom: acc.poojaRoom + (f.poojaRoom ? 1 : 0),
  }), { bedroom: 0, washroom: 0, toilets: 0, balcony: 0, utility: 0, kitchens: 0, poojaRoom: 0 })

  const isParking = (type) => ['parking_only', 'parking_lift', 'commercial_parking'].includes(type)
  const isPureParking = (type) => ['parking_only', 'parking_lift'].includes(type)

  const { liveTotal, liveItems, liveMetrics } = useMemo(() => {
    if (!sqft) return { liveTotal: 0, liveItems: [], liveMetrics: null }

    const td = floors.reduce((acc, f) => ({
      bedroom: acc.bedroom + (parseInt(f.bedroomDoors) || 0),
      washroom: acc.washroom + (parseInt(f.washroomDoors) || 0),
      toilets: acc.toilets + (parseInt(f.toilets) || 0),
      balcony: acc.balcony + (parseInt(f.balconyDoors) || 0),
      utility: acc.utility + (parseInt(f.utilityDoors) || 0),
      kitchens: acc.kitchens + (parseInt(f.kitchens) || 0),
      poojaRoom: acc.poojaRoom + (f.poojaRoom ? 1 : 0),
    }), { bedroom: 0, washroom: 0, toilets: 0, balcony: 0, utility: 0, kitchens: 0, poojaRoom: 0 })

    const project = {
      dimension_width: isIrregular ? parseFloat(sideFront) : parseFloat(width),
      dimension_length: isIrregular ? parseFloat(sideLeft) : parseFloat(length),
      floors: floorCount,
      masonry_type: masonryType,
      custom_block_price: customBlockPrice ? parseFloat(customBlockPrice) : null,
      custom_brick_price: customBrickPrice ? parseFloat(customBrickPrice) : null,
      floors_data: floors.map((f, i) => {
        if (i !== 0) return f
        return {
          ...f,
          ...(sumpRateOverride ? { sumpRateOverride: parseFloat(sumpRateOverride) } : {}),
          ...(ohtCustomPrice ? { ohtCustomPrice: parseFloat(ohtCustomPrice) } : {}),
          ...(mainGateCustomPrice ? { mainGateCustomPrice: parseFloat(mainGateCustomPrice) } : {}),
        }
      }),
      has_sump: hasSump, sump_capacity: sumpCapacity || null, sump_type: sumpType,
      has_ssm: hasSsm, ssm_courses: ssmCourses || null,
      has_compound_wall: hasCompoundWall,
      has_rainwater: hasRainwater, has_gas: hasGas,
      has_oht: hasOht, oht_capacity: ohtCapacity === 'custom' ? parseFloat(ohtCustom) : parseFloat(ohtCapacity),
      has_main_gate: hasMainGate, has_ac: hasAc, has_cctv: hasCctv,
      has_ev: (parseInt(floors[0]?.evPoints) || 0) > 0,
      has_solar: hasSolar, has_ups: hasUps, has_wifi: hasWifi,
      painting_grade: paintingGrade, flooring_type: flooringType,
      window_type: windowType, railing_type: railingType,
      bedroom_doors: td.bedroom, washroom_doors: td.washroom,
      balcony_doors: td.balcony, utility_doors: td.utility,
      has_pooja_room_door: td.poojaRoom > 0,
    }

    const effectivePrices = {
      ...marketPrices,
      ...(customBlockPrice ? { 'Blocks': parseFloat(customBlockPrice) } : {}),
      ...(customBrickPrice ? { 'Bricks': parseFloat(customBrickPrice) } : {}),
    }
    const items = calculateFullBOQ(project, effectivePrices, boqData, vehicleData)
    const liveTotal = items.reduce((s, i) => s + (i.total_price || 0), 0)

    const totalSlabArea = floors.reduce((sum, f) => sum + (parseFloat(f.sqft) || sqft), 0)
    const chadra = Math.round(totalSlabArea / 100)
    const steelTonnes = Math.ceil(totalSlabArea * 4.5 / 1000)

    return { liveTotal, liveItems: items, liveMetrics: { totalSlabArea, chadra, steelTonnes } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sqft, floors, masonryType, floorCount, sumpRateOverride, hasSump, sumpCapacity, sumpType,
      hasSsm, ssmCourses, hasCompoundWall, hasRainwater, hasGas, hasOht, ohtCapacity, ohtCustom,
      hasMainGate, hasAc, hasCctv, hasSolar, hasUps, hasWifi, paintingGrade, flooringType,
      windowType, railingType, marketPrices, customBlockPrice, customBrickPrice, boqData,
      ohtCustomPrice, mainGateCustomPrice])

  async function handleSave() {
    if (submittingRef.current) return
    const hasDimensions = isIrregular
      ? (sideFront && sideBack && sideLeft && sideRight)
      : (width && length)
    if (!clientName || !hasDimensions) {
      alert('Please fill Client Name and Dimensions')
      return
    }
    submittingRef.current = true
    setSaving(true)

    const finalOhtCapacity = ohtCapacity === 'custom' ? parseFloat(ohtCustom) : parseFloat(ohtCapacity)

    const projectData = {
      client_name: clientName,
      client_phone: clientPhone,
      site_address: clientLocation,
      dimension_width: isIrregular ? parseFloat(sideFront) : parseFloat(width),
      dimension_length: isIrregular ? parseFloat(sideLeft) : parseFloat(length),
      total_sqft: sqft,
      is_irregular: isIrregular,
      side_front: isIrregular ? parseFloat(sideFront) : null,
      side_back: isIrregular ? parseFloat(sideBack) : null,
      side_left: isIrregular ? parseFloat(sideLeft) : null,
      side_right: isIrregular ? parseFloat(sideRight) : null,
      floors: floorCount,
      floor_count: floorCount,
      floors_data: floors.map((f, i) => {
        if (i !== 0) return f
        return {
          ...f,
          ...(sumpRateOverride ? { sumpRateOverride: parseFloat(sumpRateOverride) } : {}),
          ...(ohtCustomPrice ? { ohtCustomPrice: parseFloat(ohtCustomPrice) } : {}),
          ...(mainGateCustomPrice ? { mainGateCustomPrice: parseFloat(mainGateCustomPrice) } : {}),
        }
      }),
      ground_floor_type: floors[0]?.type || '',
      upper_floor_type: floors[1]?.type || '',
      has_lift: hasLift,
      has_sump: hasSump,
      sump_capacity: sumpCapacity ? parseFloat(sumpCapacity) : null,
      sump_type: sumpType,
      has_ssm: hasSsm,
      ssm_courses: ssmCourses ? parseInt(ssmCourses) : null,
      has_compound_wall: hasCompoundWall,
      has_rainwater: hasRainwater,
      has_gas: hasGas,
      has_oht: hasOht,
      oht_capacity: finalOhtCapacity,
      has_main_gate: hasMainGate,
      has_ac: hasAc,
      has_cctv: hasCctv,
      has_ev: (parseInt(floors[0]?.evPoints) || 0) > 0,
      has_solar: hasSolar,
      has_ups: hasUps,
      has_wifi: hasWifi,
      painting_grade: paintingGrade,
      flooring_type: flooringType,
      window_type: windowType,
      railing_type: railingType,
      bedroom_doors: totalDoors.bedroom,
      washroom_doors: totalDoors.washroom,
      balcony_doors: totalDoors.balcony,
      utility_doors: totalDoors.utility,
      has_pooja_room_door: totalDoors.poojaRoom > 0,
      masonry_type: masonryType,
      status: 'draft',
      created_by: user?.name,
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      alert('Error saving: ' + error.message)
      submittingRef.current = false
      setSaving(false)
      return
    }

    const validCustomItems = customItems.filter(i => i.item_name && i.unit_price)
    if (validCustomItems.length > 0) {
      await supabase.from('custom_items').insert(
        validCustomItems.map(item => ({
          project_id: project.id,
          item_name: item.item_name,
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price),
          total_price: (parseFloat(item.quantity) || 1) * parseFloat(item.unit_price),
          notes: item.notes,
        }))
      )
    }

    localStorage.removeItem(DRAFT_KEY)
    router.push(`/projects/${project.id}`)
    setSaving(false)
  }

  return (
    <AppLayout>
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* Restore draft prompt */}
      {showRestorePrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-blue-200 rounded-xl shadow-lg px-6 py-4 flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Unsaved draft found</p>
            <p className="text-xs text-gray-400">You have a previous unfinished BOQ. Restore it?</p>
          </div>
          <button onClick={restoreDraft} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Restore</button>
          <button onClick={discardDraft} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">Discard</button>
        </div>
      )}

      {/* Discard confirmation modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <h3 className="text-base font-semibold text-gray-800">Unsaved changes</h3>
            <p className="text-sm text-gray-500">You have unsaved data. What would you like to do?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowDiscardModal(false); handleSave() }} className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700">Save & Close</button>
              <button onClick={() => { localStorage.removeItem(DRAFT_KEY); router.push('/projects') }} className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">Discard & Close</button>
              <button onClick={() => setShowDiscardModal(false)} className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100">Stay & Continue Editing</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-gray-200 bg-white shrink-0">
        <button
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${mobileTab === 'form' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          Form
        </button>
        <button
          onClick={() => setMobileTab('boq')}
          className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${mobileTab === 'boq' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
        >
          Live BOQ{liveTotal > 0 ? ` · ₹${(liveTotal / 100000).toFixed(1)}L` : ''}
        </button>
      </div>

      {/* Split content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">

      {/* ── LEFT: Form (40%) ── */}
      <div className={`flex flex-col overflow-y-auto border-r border-gray-200 bg-gray-50 ${mobileTab === 'boq' ? 'hidden md:flex md:w-[40%]' : 'w-full md:w-[40%]'}`}>

        {/* Sticky form header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-800">New BOQ Estimate</h1>
            <p className="text-xs text-gray-400">Live estimate updates on the right →</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">

        {/* Section 1 — Client Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input placeholder="e.g. Rajesh Kumar" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input placeholder="e.g. 9876543210" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Site Location</Label>
              <Input placeholder="e.g. Whitefield, Bangalore" value={clientLocation} onChange={e => setClientLocation(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Section 2 — Site Dimension */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              Site Dimension
              <button
                onClick={() => setIsIrregular(p => !p)}
                className={`ml-auto text-xs px-3 py-1 rounded-full border transition-all ${isIrregular ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
              >
                {isIrregular ? 'Irregular Site' : 'Regular Site'}
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isIrregular ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label>Width (ft) *</Label>
                  <Input type="number" placeholder="e.g. 30" value={width} onChange={e => setWidth(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Length (ft) *</Label>
                  <Input type="number" placeholder="e.g. 40" value={length} onChange={e => setLength(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Total Area</Label>
                  <div className="h-10 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-sm flex items-center">
                    {sqft ? `${sqft} sq.ft` : '— sq.ft'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Enter all 4 side measurements. Area calculated using Brahmagupta's formula.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label>Front (ft) *</Label>
                    <Input type="number" placeholder="e.g. 30" value={sideFront} onChange={e => setSideFront(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Back (ft) *</Label>
                    <Input type="number" placeholder="e.g. 32" value={sideBack} onChange={e => setSideBack(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Left (ft) *</Label>
                    <Input type="number" placeholder="e.g. 40" value={sideLeft} onChange={e => setSideLeft(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Right (ft) *</Label>
                    <Input type="number" placeholder="e.g. 42" value={sideRight} onChange={e => setSideRight(e.target.value)} />
                  </div>
                </div>
                <div className="h-10 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-semibold text-sm flex items-center w-48">
                  {sqft ? `${sqft} sq.ft` : '— sq.ft'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SSM — right after site dimensions */}
        <Card>
          <CardContent className="pt-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">SSM Work (Size Stone Masonry)</p>
                  <p className="text-xs text-gray-400">Stone masonry below plinth level. Minimum 2 courses.</p>
                </div>
                <Switch checked={hasSsm} onCheckedChange={setHasSsm} />
              </div>
              {hasSsm && (
                <div className="pl-4 border-l-2 border-blue-100">
                  <div className="space-y-1.5 w-48">
                    <Label>Number of Courses</Label>
                    <Input type="number" min="2" placeholder="minimum 2" value={ssmCourses} onChange={e => setSsmCourses(e.target.value)} />
                    <p className="text-xs text-gray-400">Each course = one layer of stone masonry</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2b — Masonry Type */}
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <Badge variant="outline">2b</Badge>
      Masonry Type
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setMasonryType('block')} className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${masonryType === 'block' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
          <p className="font-semibold text-gray-800 text-sm">Blocks</p>
          <p className="text-xs text-gray-400">Cement · ₹{customBlockPrice || 49}/block</p>
        </button>
        <button onClick={() => setMasonryType('brick')} className={`px-3 py-2 rounded-lg border-2 text-left transition-all ${masonryType === 'brick' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
          <p className="font-semibold text-gray-800 text-sm">Bricks</p>
          <p className="text-xs text-gray-400">Red clay · ₹{customBrickPrice || 8}/brick</p>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Block Price (₹/block)</Label>
          <Input type="number" placeholder="49" value={customBlockPrice} onChange={e => setCustomBlockPrice(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Brick Price (₹/brick)</Label>
          <Input type="number" placeholder="8" value={customBrickPrice} onChange={e => setCustomBrickPrice(e.target.value)} />
        </div>
      </div>
    </div>
  </CardContent>
</Card>

        {/* Section 3 — Floor Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              Floor Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Floor count */}
            <div className="space-y-2">
              <Label>Total Floors *</Label>
              <div className="flex flex-wrap gap-2">
                {[1,2,3,4,5,6,7].map((n, i) => (
  <button
    key={n}
    onClick={() => handleFloorCountChange(n)}
    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
      floorCount === n
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
    }`}
  >
    {n === 1 ? 'G only' : `G+${n - 1}`}
  </button>
  
))}
              </div>
              <p className="text-xs text-gray-400">G only = Ground floor only. G+1 = Ground + First floor. And so on.</p>
            </div>

            {/* Per floor cards */}
            {floors.map((floor, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">

                {/* Floor header */}
                <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm font-semibold">{floor.name}</span>
                  {floor.type && (
                    <Badge className={`ml-2 text-xs border-0 ${['duplex_end_2mb', 'duplex_end_study'].includes(floor.type) ? 'bg-purple-600' : 'bg-blue-600'} text-white`}>
                      {[...GROUND_TYPES, ...UPPER_TYPES, ...DUPLEX_END_TYPES].find(t => t.value === floor.type)?.label || floor.type}
                    </Badge>
                  )}
                  {['duplex_end_2mb', 'duplex_end_study'].includes(floor.type) && (
                    <span className="text-xs text-purple-300 ml-1">duplex upper floor</span>
                  )}
                  {index > 0 && !['duplex_end_2mb', 'duplex_end_study'].includes(floor.type) && floors[index - 1]?.type && (
                    <button
                      onClick={() => copyFloor(index - 1, index)}
                      className="ml-auto text-xs px-2 py-0.5 rounded bg-blue-700 text-blue-100 hover:bg-blue-600"
                    >
                      ↓ Copy {floors[index - 1].name}
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-4 bg-white">

                  {/* Row 1 — Type + Sqft */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Floor Type *</Label>
                      <select
                        className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                        value={floor.type}
                        onChange={e => handleFloorTypeChange(index, e.target.value)}
                      >
                        <option value="">— Select floor type —</option>
                        {(() => {
                          const prevType = index > 0 ? floors[index - 1]?.type : null
                          const isDuplexNext = ['duplex_gf', 'duplex_ff', 'duplex_sf'].includes(prevType)
                          if (isDuplexNext) return DUPLEX_END_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)
                          const groups = index === 0 ? GROUND_GROUPS : UPPER_GROUPS
                          const types = index === 0 ? GROUND_TYPES : UPPER_TYPES
                          return groups.map(g => (
                            <optgroup key={g.label} label={g.label}>
                              {g.values.map(v => { const t = types.find(x => x.value === v); return t ? <option key={t.value} value={t.value}>{t.label}</option> : null })}
                            </optgroup>
                          ))
                        })()}
                      </select>
                      <p className="text-xs text-gray-400">
                        {index === 0 ? 'Select what is being constructed on ground floor' : `Select the unit type for ${floor.name}`}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Construction Area (sqft)</Label>
                      <Input
                        type="number"
                        placeholder={sqft ? `Max ${sqft} sqft` : 'Enter sqft'}
                        value={floor.sqft}
                        onChange={e => updateFloor(index, 'sqft', e.target.value)}
                      />
                      <p className="text-xs text-gray-400">How much area is being constructed on this floor</p>
                    </div>
                  </div>

                  {/* Staircase — show on all floors except last */}
                  <div className="space-y-1.5">
                    <Label>Staircase</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">Staircase Type</Label>
                        <select
                          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                          value={floor.staircaseType}
                          onChange={e => updateFloor(index, 'staircaseType', e.target.value)}
                        >
                          <option value="none">No Staircase on this floor</option>
                          <option value="normal">Normal Staircase (included in labour)</option>
                          <option value="chain">Chain Staircase — ₹2,300 per step</option>
                        </select>
                        <p className="text-xs text-gray-400">Chain staircase is a premium decorative staircase</p>
                      </div>
                      {floor.staircaseType === 'chain' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">Number of Steps</Label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adjustSteps(index, -1)}
                              className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-bold text-lg flex items-center justify-center"
                            >−</button>
                            <div className="flex-1 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center font-semibold text-gray-800">
                              {floor.staircaseSteps} steps
                            </div>
                            <button
                              onClick={() => adjustSteps(index, 1)}
                              className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-bold text-lg flex items-center justify-center"
                            >+</button>
                          </div>
                          <p className="text-xs text-gray-400">
                            Cost: ₹{(floor.staircaseSteps * 2300).toLocaleString('en-IN')} (default 19 steps = 1 floor)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Guard Washroom — for parking floors */}
                  {isParking(floor.type) && (
                    <>
                      <Separator />
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-2">Guard / Security Washroom</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Toilets</Label>
                            <Input type="number" min="0" value={floor.toilets} onChange={e => updateFloor(index, 'toilets', e.target.value)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Washroom Doors</Label>
                            <Input type="number" min="0" value={floor.washroomDoors} onChange={e => updateFloor(index, 'washroomDoors', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Doors + Rooms — skip for parking */}
                  {!isParking(floor.type) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Doors &amp; Rooms
                          {['duplex_end_2mb', 'duplex_end_study'].includes(floor.type) && <span className="text-xs font-normal text-purple-500 ml-2">Upper duplex — no main door / kitchen</span>}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {!['duplex_end_2mb', 'duplex_end_study'].includes(floor.type) && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Main Door Type</Label>
                              <select
                                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                                value={floor.mainDoor}
                                onChange={e => updateFloor(index, 'mainDoor', e.target.value)}
                              >
                                <option value="">No main door</option>
                                {MAIN_DOOR_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label} — {fmt(mp(t.priceKey, t.fallback))}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label className="text-xs">Bedroom Doors</Label>
                            <Input type="number" min="0" value={floor.bedroomDoors} onChange={e => updateFloor(index, 'bedroomDoors', e.target.value)} />
                            <p className="text-xs text-gray-400">
                              {parseInt(floor.bedroomDoors) > 0 ? `${floor.bedroomDoors} × ${fmt(r.bedroomDoor)} = ${fmt(parseInt(floor.bedroomDoors) * r.bedroomDoor)}` : `Typical: ${fmt(r.bedroomDoor)}/door`}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Washrooms</Label>
                            <Input type="number" min="0" value={floor.washroomDoors} onChange={e => {
                              const v = e.target.value
                              setFloors(prev => { const u = [...prev]; u[index] = { ...u[index], washroomDoors: v, toilets: v }; return u })
                            }} />
                            <p className="text-xs text-gray-400">
                              {parseInt(floor.washroomDoors) > 0 ? `${floor.washroomDoors} × door (${fmt(r.washroomDoor)}) + plumbing` : 'Door + plumbing per washroom'}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Balcony Doors</Label>
                            <Input type="number" min="0" value={floor.balconyDoors} onChange={e => updateFloor(index, 'balconyDoors', e.target.value)} />
                            <p className="text-xs text-gray-400">
                              {parseInt(floor.balconyDoors) > 0 ? `${floor.balconyDoors} × ${fmt(r.balconyDoor)} = ${fmt(parseInt(floor.balconyDoors) * r.balconyDoor)}` : `Typical: ${fmt(r.balconyDoor)}/door`}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Utility Doors</Label>
                            <Input type="number" min="0" value={floor.utilityDoors} onChange={e => updateFloor(index, 'utilityDoors', e.target.value)} />
                            <p className="text-xs text-gray-400">
                              {parseInt(floor.utilityDoors) > 0 ? `${floor.utilityDoors} × ${fmt(r.utilityDoor)} = ${fmt(parseInt(floor.utilityDoors) * r.utilityDoor)}` : `Typical: ${fmt(r.utilityDoor)}/door`}
                            </p>
                          </div>
                          {!['duplex_end_2mb', 'duplex_end_study'].includes(floor.type) && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Kitchens</Label>
                              <Input type="number" min="0" value={floor.kitchens} onChange={e => updateFloor(index, 'kitchens', e.target.value)} />
                              <p className="text-xs text-gray-400">For plumbing calculation</p>
                            </div>
                          )}
                          <div className="space-y-1.5">
                            <Label className="text-xs">Pooja Room Door</Label>
                            <div className="flex flex-col gap-1.5">
                              <div className="h-10 flex items-center gap-2">
                                <Switch checked={floor.poojaRoom} onCheckedChange={val => updateFloor(index, 'poojaRoom', val)} />
                                <span className="text-xs text-gray-400">Market: {fmt(r.poojaRoomDoor)}</span>
                              </div>
                              {floor.poojaRoom && (
                                <Input
                                  type="number"
                                  placeholder={`Custom price (default: ${r.poojaRoomDoor})`}
                                  value={floor.poojaRoomPrice}
                                  onChange={e => updateFloor(index, 'poojaRoomPrice', e.target.value)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Tiles */}
                  {!isParking(floor.type) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Flooring Tiles</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Tiles Area (sqft)</Label>
                            <Input
                              type="number"
                              placeholder={floor.sqft
                                ? `Auto: ${Math.ceil(parseFloat(floor.sqft) * 1.15 + 200 * (parseInt(floor.toilets) || 0) + 80 * (parseInt(floor.kitchens) || 0))} sqft`
                                : 'Enter sqft'}
                              value={floor.tilesSquft}
                              onChange={e => updateFloor(index, 'tilesSquft', e.target.value)}
                            />
                            <p className="text-xs text-gray-400">Leave empty to auto-calc (floor × 1.15 + washroom + kitchen area)</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Tile Type</Label>
                            <select
                              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                              value={flooringType}
                              onChange={e => setFlooringType(e.target.value)}
                            >
                              <option value="">Select type</option>
                              <option value="tiles">Basic Tiles</option>
                              <option value="vitrified">Vitrified</option>
                              <option value="marble">Marble</option>
                              <option value="granite">Granite</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Price per sqft (₹)</Label>
                            <Input
                              type="number"
                              placeholder="e.g. 80"
                              value={floor.tilesPricePerSqft}
                              onChange={e => updateFloor(index, 'tilesPricePerSqft', e.target.value)}
                            />
                            <p className="text-xs text-gray-400">
                              {(() => {
                                const autoArea = floor.sqft
                                  ? Math.ceil(parseFloat(floor.sqft) * 1.15 + 200 * (parseInt(floor.toilets) || 0) + 80 * (parseInt(floor.kitchens) || 0))
                                  : 0
                                const usedArea = parseFloat(floor.tilesSquft) || autoArea
                                const price = parseFloat(floor.tilesPricePerSqft) || 0
                                return usedArea > 0 && price > 0
                                  ? `Total: ₹${(usedArea * price).toLocaleString('en-IN')} (${usedArea} sqft)`
                                  : 'Enter price per sqft'
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Windows */}
                  {!isPureParking(floor.type) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Windows</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Window Type</Label>
                            <select
                              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                              value={windowType}
                              onChange={e => setWindowType(e.target.value)}
                            >
                              <option value="">No windows / decide later</option>
                              {WINDOW_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label} — {fmt(mp(t.priceKey, t.fallback))}/sqft</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Window Area (sqft)</Label>
                            <Input
                              type="number"
                              placeholder={`Auto: ${Math.ceil((parseFloat(floor.sqft) || sqft || 0) * 0.1)} sqft`}
                              value={floor.windowSqft}
                              onChange={e => updateFloor(index, 'windowSqft', e.target.value)}
                            />
                            <p className="text-xs text-gray-400">10% of floor area. Override if needed.</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Railing */}
                  {floor.type && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Railing</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">Railing Type</Label>
                            <select
                              className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                              value={floor.railingType}
                              onChange={e => updateFloor(index, 'railingType', e.target.value)}
                            >
                              <option value="">No railing on this floor</option>
                              {RAILING_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label} — {fmt(mp(t.priceKey, t.fallback))}/rft</option>
                              ))}
                            </select>
                          </div>
                          {floor.railingType && (
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">Running Feet (rft)</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 30"
                                value={floor.railingRft}
                                onChange={e => updateFloor(index, 'railingRft', e.target.value)}
                              />
                              <p className="text-xs text-gray-400">
                                {floor.railingRft && floor.railingType
                                  ? `${floor.railingRft} rft × ${fmt(r.railing[floor.railingType] || 0)} = ${fmt((parseFloat(floor.railingRft) || 0) * (r.railing[floor.railingType] || 0))}`
                                  : 'Enter running feet'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* AC Points — only if AC is ON */}
                  {hasAc && !isParking(floor.type) && (
                    <>
                      <Separator />
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">AC Points on this floor</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 2"
                            value={floor.acPoints}
                            onChange={e => updateFloor(index, 'acPoints', e.target.value)}
                          />
                          <p className="text-xs text-gray-400">
                            {parseInt(floor.acPoints) > 0 ? `${floor.acPoints} × ${fmt(r.ac)} = ${fmt(parseInt(floor.acPoints) * r.ac)}` : `${fmt(r.ac)} per AC point`}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* EV Charging — ground floor only */}
                  {index === 0 && !isPureParking(floor.type) && (
                    <>
                      <Separator />
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">EV Charging Points (Ground Floor)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 2"
                            value={floor.evPoints}
                            onChange={e => updateFloor(index, 'evPoints', e.target.value)}
                          />
                          <p className="text-xs text-gray-400">
                            {parseInt(floor.evPoints) > 0 ? `${floor.evPoints} × ${fmt(r.ev)} = ${fmt(parseInt(floor.evPoints) * r.ev)}` : `${fmt(r.ev)} per EV point — 0 = not included`}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* UPS Units — only if UPS is ON */}
                  {hasUps && !isParking(floor.type) && (
                    <>
                      <Separator />
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-500">UPS / Inverter Units on this floor</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 1"
                            value={floor.upsUnits}
                            onChange={e => updateFloor(index, 'upsUnits', e.target.value)}
                          />
                          <p className="text-xs text-gray-400">
                            {parseInt(floor.upsUnits) > 0 ? `${floor.upsUnits} unit(s) × ${fmt(r.ups)} = ${fmt(parseInt(floor.upsUnits) * r.ups)}` : `${fmt(r.ups)} per unit`}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            ))}

            {/* Doors + Slab summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase mb-3">Total Summary Across All Floors</p>
                <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-center">
                  {[
                    { label: 'Bedroom Doors', value: totalDoors.bedroom },
                    { label: 'Washroom Doors', value: totalDoors.washroom },
                    { label: 'Toilets', value: totalDoors.toilets },
                    { label: 'Balcony Doors', value: totalDoors.balcony },
                    { label: 'Utility Doors', value: totalDoors.utility },
                    { label: 'Kitchens', value: totalDoors.kitchens },
                    { label: 'Pooja Room', value: totalDoors.poojaRoom },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 border border-blue-100">
                      <p className="text-lg font-bold text-blue-700">{item.value}</p>
                      <p className="text-xs text-blue-500 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              {floors.some(f => f.type) && (
                <div className="border-t border-blue-100 pt-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Slab Area Breakdown</p>
                  <div className="flex flex-wrap gap-2">
                    {floors.filter(f => f.type).map((f, i) => {
                      const area = parseFloat(f.sqft) || sqft || 0
                      return (
                        <span key={i} className="bg-white text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-lg">
                          {f.name.replace(' Floor', '')}: {area ? `${area} sqft` : '—'}
                        </span>
                      )
                    })}
                    {(() => {
                      const total = floors.reduce((sum, f) => sum + (parseFloat(f.sqft) || sqft || 0), 0)
                      return total > 0 ? (
                        <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold">
                          Total: {total.toLocaleString('en-IN')} sqft
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Section 4 — Optional Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline">4</Badge>
              Optional Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Lift */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Lift</p>
                <p className="text-xs text-gray-400">Include lift shaft and machine room provision</p>
              </div>
              <Switch checked={hasLift} onCheckedChange={setHasLift} />
            </div>

            <Separator />

            {/* Sump */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Underground Sump</p>
                  <p className="text-xs text-gray-400">Water storage tank below ground</p>
                </div>
                <Switch checked={hasSump} onCheckedChange={setHasSump} />
              </div>
              {hasSump && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-100">
                  <div className="space-y-1.5">
                    <Label>Capacity (litres)</Label>
                    <Input type="number" placeholder="e.g. 5000" value={sumpCapacity} onChange={e => setSumpCapacity(e.target.value)} />
                    <p className="text-xs text-gray-400">
                      {sumpCapacity
                        ? sumpType === 'rcc'
                          ? `${sumpCapacity}L × ${fmt(r.sumpRcc)}/L = ${fmt(parseFloat(sumpCapacity) * r.sumpRcc)}`
                          : `Fixed cost: ${fmt(r.sumpBlock)}`
                        : `RCC: ${fmt(r.sumpRcc)}/litre · Block: ${fmt(r.sumpBlock)} fixed`}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sump Type</Label>
                    <select className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white" value={sumpType} onChange={e => setSumpType(e.target.value)}>
                      <option value="rcc">RCC Sump ({fmt(r.sumpRcc)}/litre)</option>
                      <option value="block">Block Sump ({fmt(r.sumpBlock)} fixed)</option>
                    </select>
                  </div>
                  {sumpType === 'rcc' && (
                    <div className="space-y-1.5 col-span-2">
                      <Label>Custom Rate Override (₹/litre)</Label>
                      <Input
                        type="number"
                        placeholder={`Leave empty to use market rate (${fmt(r.sumpRcc)}/L)`}
                        value={sumpRateOverride}
                        onChange={e => setSumpRateOverride(e.target.value)}
                      />
                      {sumpRateOverride && sumpCapacity && (
                        <p className="text-xs text-gray-400">Override: {sumpCapacity}L × {fmt(parseFloat(sumpRateOverride))}/L = {fmt(parseFloat(sumpCapacity) * parseFloat(sumpRateOverride))}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Section 5 — Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline">5</Badge>
              Services &amp; Provisions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              {
                label: 'Compound Wall',
                sub: 'Boundary wall on all 4 sides of the site',
                state: hasCompoundWall,
                set: setHasCompoundWall,
                isDefault: true,
              },
              {
                label: 'Main Gate',
                sub: mainGateCustomPrice ? `Custom price: ${fmt(parseFloat(mainGateCustomPrice))}` : `Entry gate — ${fmt(r.mainGateS)} (small) to ${fmt(r.mainGateL)} (large)`,
                state: hasMainGate,
                set: setHasMainGate,
                isDefault: true,
                extra: hasMainGate && (
                  <div className="pl-4 border-l-2 border-blue-100 mt-1 pb-2">
                    <div className="w-56 space-y-1">
                      <Label className="text-xs">Custom Price (₹) — leave blank to use auto</Label>
                      <Input type="number" placeholder={`Auto: ${fmt(r.mainGateS)}–${fmt(r.mainGateL)}`} value={mainGateCustomPrice} onChange={e => setMainGateCustomPrice(e.target.value)} />
                    </div>
                  </div>
                ),
              },
              {
                label: 'Overhead Tank (OHT)',
                sub: (() => {
                  if (ohtCustomPrice) return `Custom price: ${fmt(parseFloat(ohtCustomPrice))}`
                  const cap = ohtCapacity === 'custom' ? parseFloat(ohtCustom) : parseFloat(ohtCapacity)
                  return cap ? `${ohtCapacity === 'custom' ? ohtCustom : ohtCapacity}L × ${fmt(r.oht)}/L = ${fmt(cap * r.oht)}` : `Select capacity below — ${fmt(r.oht)}/litre`
                })(),
                state: hasOht,
                set: setHasOht,
                isDefault: true,
                extra: hasOht && (
                  <div className="pl-4 border-l-2 border-blue-100 mt-2 pb-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">OHT Capacity</Label>
                        <select
                          className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                          value={ohtCapacity}
                          onChange={e => setOhtCapacity(e.target.value)}
                        >
                          {[500, 1000, 2000, 5000, 10000].map(cap => (
                            <option key={cap} value={String(cap)}>{cap.toLocaleString('en-IN')} Litres — {fmt(cap * r.oht)}</option>
                          ))}
                          <option value="custom">Custom capacity</option>
                        </select>
                      </div>
                      {ohtCapacity === 'custom' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Custom Litres</Label>
                          <Input
                            type="number"
                            placeholder="e.g. 3000"
                            value={ohtCustom}
                            onChange={e => setOhtCustom(e.target.value)}
                          />
                          {ohtCustom && !ohtCustomPrice && <p className="text-xs text-gray-400">{ohtCustom}L × {fmt(r.oht)}/L = {fmt(parseFloat(ohtCustom) * r.oht)}</p>}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Custom Price (₹) — leave blank for auto</Label>
                        <Input
                          type="number"
                          placeholder={(() => {
                            const cap = ohtCapacity === 'custom' ? parseFloat(ohtCustom) : parseFloat(ohtCapacity)
                            return cap ? `Auto: ${fmt(cap * r.oht)}` : 'e.g. 9500'
                          })()}
                          value={ohtCustomPrice}
                          onChange={e => setOhtCustomPrice(e.target.value)}
                        />
                        {ohtCustomPrice && <p className="text-xs text-gray-400">Fixed: {fmt(parseFloat(ohtCustomPrice))}</p>}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                label: 'Rainwater Harvesting',
                sub: `Drain covers, pit and recharge system — ${fmt(r.rainwater)}`,
                state: hasRainwater,
                set: setHasRainwater,
                isDefault: true,
              },
              {
                label: 'Gas Pipeline',
                sub: `${floorCount} floor${floorCount > 1 ? 's' : ''} × 15 rft × ${fmt(r.gas)}/rft = ${fmt(floorCount * 15 * r.gas)}`,
                state: hasGas,
                set: setHasGas,
                isDefault: true,
              },
              {
                label: 'AC Provision',
                sub: (() => {
                  const pts = floors.reduce((s, f) => s + (parseInt(f.acPoints) || 0), 0)
                  return pts > 0 ? `${pts} points × ${fmt(r.ac)} = ${fmt(pts * r.ac)}` : `${fmt(r.ac)} per point — set points per floor above`
                })(),
                state: hasAc,
                set: setHasAc,
                isDefault: false,
              },
              {
                label: 'CCTV Provision',
                sub: `2 cameras × ${floorCount} floor${floorCount > 1 ? 's' : ''} × ${fmt(r.cctv)} = ${fmt(2 * floorCount * r.cctv)}`,
                state: hasCctv,
                set: setHasCctv,
                isDefault: false,
              },
              {
                label: 'Solar Provision',
                sub: `Wiring and mounting structure — ${fmt(r.solar)}`,
                state: hasSolar,
                set: setHasSolar,
                isDefault: false,
              },
              {
                label: 'UPS Provision',
                sub: (() => {
                  const kFloors = floors.filter(f => !['parking_only','parking_lift','commercial_parking'].includes(f.type) && (parseInt(f.kitchens)||0) > 0).length
                  const total = hasUps
                    ? floors.filter(f => !['parking_only','parking_lift','commercial_parking'].includes(f.type)).length
                    : kFloors
                  return `Auto for ${kFloors} kitchen floor${kFloors !== 1 ? 's' : ''}${hasUps ? ` + all floors` : ''} — ${fmt(total * r.ups)} total`
                })(),
                state: hasUps,
                set: setHasUps,
                isDefault: false,
              },
              {
                label: 'WiFi & Cable Provision',
                sub: `Conduit and junction boxes for WiFi and cable TV — ${fmt(r.wifi)}`,
                state: hasWifi,
                set: setHasWifi,
                isDefault: false,
              },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between py-3 px-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.isDefault && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
                            default on
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
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
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline">6</Badge>
              Painting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Painting Grade</Label>
              <select
                className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
                value={paintingGrade}
                onChange={e => setPaintingGrade(e.target.value)}
              >
                <option value="">— Select painting grade —</option>
                {PAINTING_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label} — {fmt(mp(t.priceKey, t.fallback))}/chadra</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Cost is calculated per chadra (1 chadra = 100 sqft of slab area)</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 7 — Custom Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">7</Badge>
                Custom Add-on Items
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addCustomItem}>+ Add Item</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-400">Add any extra items not covered above — landscaping, interior design, special work etc.</p>
            {customItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-1.5">
                  {index === 0 && <Label className="text-xs">Item Name</Label>}
                  <Input placeholder="e.g. Landscaping" value={item.item_name} onChange={e => updateCustomItem(index, 'item_name', e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  {index === 0 && <Label className="text-xs">Qty</Label>}
                  <Input type="number" placeholder="1" value={item.quantity} onChange={e => updateCustomItem(index, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-3 space-y-1.5">
                  {index === 0 && <Label className="text-xs">Unit Price (₹)</Label>}
                  <Input type="number" placeholder="0" value={item.unit_price} onChange={e => updateCustomItem(index, 'unit_price', e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  {index === 0 && <Label className="text-xs">Total</Label>}
                  <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 flex items-center">
                    ₹{getCustomItemTotal(item)}
                  </div>
                </div>
                <div className="col-span-1">
                  {index === 0 && <div className="h-5" />}
                  {customItems.length > 1 && (
                    <button onClick={() => removeCustomItem(index)} className="h-10 w-full text-red-400 hover:text-red-600 text-xl flex items-center justify-center">×</button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bottom save (inside scroll area) */}
        <div className="flex justify-end gap-3 py-6 px-1">
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button size="lg" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save BOQ'}
          </Button>
        </div>

        </div>{/* end form sections scroll */}
      </div>{/* end left panel */}

      {/* ── RIGHT: Live BOQ (60%) ── */}
      <div className={`flex flex-col bg-white ${mobileTab === 'form' ? 'hidden md:flex md:w-[60%]' : 'w-full md:w-[60%]'}`}>

        {/* BOQ table */}
        <div className="flex-1 overflow-y-auto">
          {liveItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-gray-500 font-medium">No estimate yet</p>
              <p className="text-sm text-gray-400 mt-1">Fill in site dimensions and floor type on the left to see the full BOQ here</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rate</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const grouped = liveItems.reduce((acc, item) => {
                    if (!acc[item.stage]) acc[item.stage] = []
                    acc[item.stage].push(item)
                    return acc
                  }, {})
                  return Object.entries(grouped).map(([stage, items]) => {
                    const stageTotal = items.reduce((s, i) => s + (i.total_price || 0), 0)
                    return (
                      <>
                        <tr key={stage} className="bg-blue-50 border-t-2 border-blue-100">
                          <td className="px-4 py-2 text-xs font-bold text-blue-700 uppercase tracking-wide" colSpan={5}>{stage}</td>
                        </tr>
                        {items.map((item, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/60">
                            <td className="px-4 py-2 text-gray-700 pl-6">{item.item_name}</td>
                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{item.quantity ?? '—'}</td>
                            <td className="px-3 py-2 text-right text-gray-400 text-xs">{item.unit}</td>
                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">₹{(item.unit_price || 0).toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-800 tabular-nums">₹{(item.total_price || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50 border-b-2 border-blue-100">
                          <td colSpan={4} className="px-4 py-1.5 text-xs text-blue-500 text-right italic">Stage Total</td>
                          <td className="px-4 py-1.5 text-right text-xs font-bold text-blue-700 tabular-nums">₹{stageTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      </>
                    )
                  })
                })()}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom footer — Grand Total + metrics */}
        <div className="shrink-0 bg-gray-900 text-white border-t border-gray-700">
          <div className="px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-gray-400 shrink-0">Grand Total</span>
            {liveMetrics && (
              <div className="hidden md:flex items-center divide-x divide-gray-600 shrink-0">
                <span className="px-2 text-xs text-gray-300">{liveMetrics.totalSlabArea.toLocaleString('en-IN')} sqft</span>
                <span className="px-2 text-xs text-gray-300">{liveMetrics.chadra} chadra</span>
                <span className="px-2 text-xs text-gray-300">{liveMetrics.steelTonnes}T steel</span>
                {liveTotal > 0 && liveMetrics.totalSlabArea > 0 && <span className="px-2 text-xs text-gray-300">₹{Math.round(liveTotal / liveMetrics.totalSlabArea).toLocaleString('en-IN')}/sqft</span>}
              </div>
            )}
            <div className="ml-auto flex items-baseline gap-2 shrink-0">
              {liveTotal > 0 ? (
                <>
                  <span className="text-sm font-bold tabular-nums">₹{liveTotal.toLocaleString('en-IN')}</span>
                  <span className="text-lg font-bold text-blue-400 tabular-nums">₹{(liveTotal / 100000).toFixed(1)}<span className="text-xs text-gray-400">L</span></span>
                </>
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </div>
        </div>

      </div>{/* end right panel */}

      </div>{/* end split */}
    </div>{/* end outer */}
    </AppLayout>
  )
}