// ============================================================
// BOQ CALCULATION ENGINE
// Standard dimensions and their areas
// ============================================================

const STANDARD_SIZES = [
  { key: '20x30', area: 600 },
  { key: '20x40', area: 800 },
  { key: '30x40', area: 1200 },
  { key: '30x50', area: 1500 },
  { key: '40x40', area: 1600 },
  { key: '40x60', area: 2400 },
]

// Vehicle type lookup — returns vehicle cost key for market prices
const VEHICLE_COST = {
  'Tractor': 'M Sand_tractor',
  '709': 'M Sand_709',
  '6W': 'M Sand_6w',
  '10W': 'M Sand_10w',
}

// ============================================================
// MASTER BOQ LOOKUP TABLE — directly from your Excel sheet
// Non-divisible items use vehicle type (Tractor/709/6W/10W)
// Divisible items use actual quantity numbers
// ============================================================

const BOQ_TABLE = {

  // --- SITE PREPARATION (fixed costs per dimension) ---
  site_cleaning:     { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 20000, divisible: false },
  survey:            { '20x30': 8000,  '20x40': 8000,  '30x40': 8000,  '30x50': 8000,  '40x40': 8000,  '40x60': 8000,  divisible: false },
  soil_test:         { '20x30': 20000, '20x40': 20000, '30x40': 20000, '30x50': 20000, '40x40': 20000, '40x60': 20000, divisible: false },
  excavation:        { '20x30': 20000, '20x40': 20000, '30x40': 25000, '30x50': 30000, '40x40': 30000, '40x60': 30000, divisible: false },

  // --- FOOTING ---
  footing_cement:    { '20x30': 50, '20x40': 50, '30x40': 50, '30x50': 75, '40x40': 75, '40x60': 75, divisible: true },
  footing_msand:     { '20x30': '6W', '20x40': '6W', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '10W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  footing_20mm:      { '20x30': '6W', '20x40': '6W', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '10W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  footing_40mm:      { '20x30': '709', '20x40': '709', '30x40': '709', '30x50': '709', '40x40': '709', '40x60': '6W', divisible: false, isVehicle: true, sandType: '40mm Aggregate' },
  footing_concrete:  { '20x30': 20, '20x40': 24, '30x40': 30, '30x50': 35, '40x40': 35, '40x60': 50, divisible: true },
  anti_termite:      { '20x30': 5000, '20x40': 5000, '30x40': 5000, '30x50': 5000, '40x40': 5000, '40x60': 5000, divisible: false },
  cover_blocks:      { '20x30': 5000, '20x40': 5000, '30x40': 5000, '30x50': 5000, '40x40': 5000, '40x60': 5000, divisible: false },

  // --- SOIL REFILLING ---
  soil_refilling:    { '20x30': 15000, '20x40': 20000, '30x40': 25000, '30x50': 35000, '40x40': 30000, '40x60': 40000, divisible: false },

  // --- PLINTH ---
  plinth_cement:     { '20x30': 30, '20x40': 30, '30x40': 50, '30x50': 60, '40x40': 60, '40x60': 100, divisible: true },
  plinth_msand:      { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '10W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  plinth_20mm:       { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '10W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  plinth_40mm:       { '20x30': '709', '20x40': '709', '30x40': '709', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '40mm Aggregate' },

  // --- SSM (Size Stone) ---
  ssm_sizestone:     { '20x30': 15000, '20x40': 25000, '30x40': 50000, '30x50': 60000, '40x40': 60000, '40x60': 100000, divisible: true },
  ssm_40mm:          { '20x30': '709', '20x40': '709', '30x40': '709', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '40mm Aggregate' },
  ssm_cement_2c:     { '20x30': 20, '20x40': 25, '30x40': 35, '30x50': 50, '40x40': 50, '40x60': 75, divisible: true },
  ssm_msand_2c:      { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },

  // --- GROUND FLOOR — Only Parking / Parking+Lift ---
  gf_parking_blocks: { '20x30': 300, '20x40': 300, '30x40': 300, '30x50': 300, '40x40': 300, '40x60': 300, divisible: false },
  gf_parking_bricks: { '20x30': 1000, '20x40': 1000, '30x40': 1000, '30x50': 1000, '40x40': 1000, '40x60': 1000, divisible: false },
  gf_parking_cement: { '20x30': 50, '20x40': 50, '30x40': 75, '30x50': 80, '40x40': 80, '40x60': 100, divisible: true },
  gf_parking_msand:  { '20x30': '709', '20x40': '6W', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  gf_parking_20mm:   { '20x30': '709', '20x40': '6W', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  gf_parking_slab:   { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  gf_parking_elec:   { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  gf_parking_misc:   { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- GROUND FLOOR — 1BHK+Parking ---
  gf_1bhk_blocks:    { '20x30': 0, '20x40': 1000, '30x40': 1500, '30x50': 1500, '40x40': 1500, '40x60': 2000, divisible: false },
  gf_1bhk_bricks:    { '20x30': 0, '20x40': 6000, '30x40': 6000, '30x50': 6000, '40x40': 6000, '40x60': 8000, divisible: false },
  gf_1bhk_cement:    { '20x30': 0, '20x40': 60, '30x40': 85, '30x50': 110, '40x40': 90, '40x60': 120, divisible: true },
  gf_1bhk_msand:     { '20x30': '709', '20x40': '6W', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  gf_1bhk_20mm:      { '20x30': '709', '20x40': '6W', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  gf_1bhk_slab:      { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  gf_1bhk_elec:      { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  gf_1bhk_misc:      { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- GROUND FLOOR — 2BHK+Parking ---
  gf_2bhk_blocks:    { '20x30': 0, '20x40': 0, '30x40': 1800, '30x50': 1800, '40x40': 1800, '40x60': 2000, divisible: false },
  gf_2bhk_bricks:    { '20x30': 0, '20x40': 0, '30x40': 8000, '30x50': 8000, '40x40': 8000, '40x60': 10000, divisible: false },
  gf_2bhk_cement:    { '20x30': 50, '20x40': 50, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 130, divisible: true },
  gf_2bhk_msand:     { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  gf_2bhk_20mm:      { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  gf_2bhk_slab:      { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  gf_2bhk_elec:      { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  gf_2bhk_misc:      { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- GROUND FLOOR — Duplex GF ---
  gf_duplex_blocks:  { '20x30': 1000, '20x40': 1000, '30x40': 1500, '30x50': 1800, '40x40': 1500, '40x60': 2000, divisible: false },
  gf_duplex_bricks:  { '20x30': 5000, '20x40': 5000, '30x40': 8000, '30x50': 8000, '40x40': 8000, '40x60': 10000, divisible: false },
  gf_duplex_cement:  { '20x30': 50, '20x40': 50, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 130, divisible: true },
  gf_duplex_msand:   { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  gf_duplex_20mm:    { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  gf_duplex_slab:    { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  gf_duplex_elec:    { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  gf_duplex_misc:    { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- UPPER FLOORS — 1BHK Single ---
  uf_1bhk_blocks:    { '20x30': 1500, '20x40': 1500, '30x40': 1800, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_1bhk_bricks:    { '20x30': 5000, '20x40': 5000, '30x40': 8000, '30x50': 10000, '40x40': 10000, '40x60': 12000, divisible: false },
  uf_1bhk_cement:    { '20x30': 60, '20x40': 60, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_1bhk_msand:     { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_1bhk_20mm:      { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_1bhk_slab:      { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  uf_1bhk_elec:      { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_1bhk_misc:      { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- UPPER FLOORS — 1BHK 2 Units ---
  uf_1bhk2_blocks:   { '20x30': 0, '20x40': 0, '30x40': 1800, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_1bhk2_bricks:   { '20x30': 0, '20x40': 0, '30x40': 8000, '30x50': 10000, '40x40': 10000, '40x60': 12000, divisible: false },
  uf_1bhk2_cement:   { '20x30': 0, '20x40': 0, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_1bhk2_msand:    { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_1bhk2_20mm:     { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_1bhk2_slab:     { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 28, '40x40': 30, '40x60': 38, divisible: true },
  uf_1bhk2_elec:     { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_1bhk2_misc:     { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- UPPER FLOORS — 2BHK ---
  uf_2bhk_blocks:    { '20x30': 1500, '20x40': 1500, '30x40': 1800, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_2bhk_bricks:    { '20x30': 5000, '20x40': 5000, '30x40': 7000, '30x50': 8000, '40x40': 8000, '40x60': 12000, divisible: false },
  uf_2bhk_cement:    { '20x30': 60, '20x40': 60, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_2bhk_msand:     { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_2bhk_20mm:      { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_2bhk_slab:      { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  uf_2bhk_elec:      { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_2bhk_misc:      { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- UPPER FLOORS — 3BHK ---
  uf_3bhk_blocks:    { '20x30': 0, '20x40': 0, '30x40': 1800, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_3bhk_bricks:    { '20x30': 0, '20x40': 0, '30x40': 7000, '30x50': 8000, '40x40': 8000, '40x60': 12000, divisible: false },
  uf_3bhk_cement:    { '20x30': 0, '20x40': 0, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_3bhk_msand:     { '20x30': '0', '20x40': '0', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_3bhk_20mm:      { '20x30': '0', '20x40': '0', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_3bhk_slab:      { '20x30': 0, '20x40': 0, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  uf_3bhk_elec:      { '20x30': 0, '20x40': 0, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_3bhk_misc:      { '20x30': 0, '20x40': 0, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- UPPER FLOORS — 1BHK+2BHK Mix ---
  uf_1bhk2bhk_blocks: { '20x30': 0, '20x40': 0, '30x40': 2000, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_1bhk2bhk_bricks: { '20x30': 0, '20x40': 0, '30x40': 8000, '30x50': 10000, '40x40': 10000, '40x60': 12000, divisible: false },
  uf_1bhk2bhk_cement: { '20x30': 0, '20x40': 0, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_1bhk2bhk_msand:  { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_1bhk2bhk_20mm:   { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_1bhk2bhk_slab:   { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  uf_1bhk2bhk_elec:   { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_1bhk2bhk_misc:   { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- UPPER FLOORS — 2BHK+3BHK Mix (use 2BHK data) ---
  uf_2bhk3bhk_blocks: { '20x30': 1500, '20x40': 1500, '30x40': 1800, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_2bhk3bhk_bricks: { '20x30': 5000, '20x40': 5000, '30x40': 7000, '30x50': 8000, '40x40': 8000, '40x60': 12000, divisible: false },
  uf_2bhk3bhk_cement: { '20x30': 60, '20x40': 60, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_2bhk3bhk_msand:  { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_2bhk3bhk_20mm:   { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_2bhk3bhk_slab:   { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  uf_2bhk3bhk_elec:   { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_2bhk3bhk_misc:   { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- DUPLEX FF/SF (same as upper floors duplex) ---
  uf_duplex_blocks:  { '20x30': 1500, '20x40': 1500, '30x40': 1800, '30x50': 2000, '40x40': 2000, '40x60': 2500, divisible: false },
  uf_duplex_bricks:  { '20x30': 5000, '20x40': 5000, '30x40': 8000, '30x50': 10000, '40x40': 10000, '40x60': 12000, divisible: false },
  uf_duplex_cement:  { '20x30': 60, '20x40': 60, '30x40': 100, '30x50': 100, '40x40': 100, '40x60': 120, divisible: true },
  uf_duplex_msand:   { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'M Sand' },
  uf_duplex_20mm:    { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: '20mm Aggregate' },
  uf_duplex_slab:    { '20x30': 14, '20x40': 15, '30x40': 21, '30x50': 33, '40x40': 30, '40x60': 38, divisible: true },
  uf_duplex_elec:    { '20x30': 10000, '20x40': 10000, '30x40': 15000, '30x50': 20000, '40x40': 20000, '40x60': 25000, divisible: false },
  uf_duplex_misc:    { '20x30': 5000, '20x40': 5000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 15000, divisible: false },

  // --- TERRACE ---
  terrace_blocks:    { '20x30': 500, '20x40': 500, '30x40': 1000, '30x50': 1000, '40x40': 1000, '40x60': 1500, divisible: false },
  terrace_cement:    { '20x30': 30, '20x40': 30, '30x40': 40, '30x50': 50, '40x40': 50, '40x60': 70, divisible: true },
  terrace_msand:     { '20x30': '709', '20x40': '709', '30x40': '709', '30x50': '709', '40x40': '709', '40x60': '709', divisible: false, isVehicle: true, sandType: 'M Sand' },
  terrace_slab:      { '20x30': 4, '20x40': 4, '30x40': 4, '30x50': 4, '40x40': 4, '40x60': 4, divisible: true },
  terrace_elec:      { '20x30': 5000, '20x40': 5000, '30x40': 5000, '30x50': 5000, '40x40': 5000, '40x60': 5000, divisible: false },
  terrace_misc:      { '20x30': 5000, '20x40': 5000, '30x40': 5000, '30x50': 5000, '40x40': 5000, '40x60': 5000, divisible: false },

  // --- SCREED ---
  screed_cement:     { '20x30': 20, '20x40': 30, '30x40': 40, '30x50': 40, '40x40': 40, '40x60': 60, divisible: true },
  screed_psand:      { '20x30': '709', '20x40': '709', '30x40': '6W', '30x50': '6W', '40x40': '6W', '40x60': '6W', divisible: false, isVehicle: true, sandType: 'P Sand' },
  screed_misc:       { '20x30': 10000, '20x40': 10000, '30x40': 10000, '30x50': 10000, '40x40': 10000, '40x60': 10000, divisible: false },

  // --- COMPOUND WALL ---
  cw_blocks:         { '20x30': 600, '20x40': 800, '30x40': 1000, '30x50': 1400, '40x40': 1200, '40x60': 2000, divisible: false },
  cw_labour:         { '20x30': 10000, '20x40': 20000, '30x40': 30000, '30x50': 50000, '40x40': 40000, '40x60': 60000, divisible: false },
  cw_plastering:     { '20x30': 10000, '20x40': 20000, '30x40': 30000, '30x50': 50000, '40x40': 40000, '40x60': 60000, divisible: false },
  cw_cement:         { '20x30': 30, '20x40': 40, '30x40': 50, '30x50': 70, '40x40': 60, '40x60': 80, divisible: true },
}

// PLASTERING — separate table per floor count (G+1 to G+5)
const PLASTERING_TABLE = {
  1: { cement: { '20x30': 120, '20x40': 120, '30x40': 220, '30x50': 250, '40x40': 250, '40x60': 370 }, psand: { '20x30': 2, '20x40': 2, '30x40': 4, '30x50': 4, '40x40': 4, '40x60': 4 }, misc: 10000 },
  2: { cement: { '20x30': 145, '20x40': 145, '30x40': 250, '30x50': 300, '40x40': 300, '40x60': 430 }, psand: { '20x30': 3, '20x40': 3, '30x40': 6, '30x50': 6, '40x40': 6, '40x60': 8 }, misc: 10000 },
  3: { cement: { '20x30': 200, '20x40': 200, '30x40': 340, '30x50': 400, '40x40': 400, '40x60': 450 }, psand: { '20x30': 4, '20x40': 4, '30x40': 7, '30x50': 7, '40x40': 7, '40x60': 8 }, misc: 20000 },
  4: { cement: { '20x30': 250, '20x40': 250, '30x40': 370, '30x50': 425, '40x40': 425, '40x60': 500 }, psand: { '20x30': 5, '20x40': 5, '30x40': 8, '30x50': 8, '40x40': 8, '40x60': 9 }, misc: 25000 },
  5: { cement: { '20x30': 300, '20x40': 300, '30x40': 400, '30x50': 460, '40x40': 460, '40x60': 580 }, psand: { '20x30': 6, '20x40': 6, '30x40': 9, '30x50': 9, '40x40': 9, '40x60': 10 }, misc: 25000 },
  6: { cement: { '20x30': 300, '20x40': 300, '30x40': 400, '30x50': 460, '40x40': 460, '40x60': 580 }, psand: { '20x30': 6, '20x40': 6, '30x40': 9, '30x50': 9, '40x40': 9, '40x60': 10 }, misc: 25000 },
}

// FLOORING (per floor)
const FLOORING_TABLE = {
  cement: { '20x30': 15, '20x40': 15, '30x40': 25, '30x50': 30, '40x40': 30, '40x60': 50 },
  msand:  { '20x30': '709', '20x40': '709', '30x40': '6', '30x50': '6', '40x40': '6', '40x60': '6' },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Find nearest standard size key (equal or just above input area)
function getNearestUpperSize(inputArea) {
  const sorted = [...STANDARD_SIZES].sort((a, b) => a.area - b.area)
  const match = sorted.find(s => s.area >= inputArea)
  return match ? match.key : sorted[sorted.length - 1].key
}

// Get value from BOQ table row — handles divisible and non-divisible
function getValue(row, inputArea, prices) {
  const sizeKey = getNearestUpperSize(inputArea)
  const standardSize = STANDARD_SIZES.find(s => s.key === sizeKey)
  const standardArea = standardSize.area

  if (row.isVehicle) {
    // Non-divisible vehicle load — return cost as-is
    const vehicleType = row[sizeKey]
    if (!vehicleType || vehicleType === '0') return 0
    const sandType = row.sandType || 'M Sand'
    const vehiclePriceKey = `${sandType}_${vehicleType.toLowerCase().replace(' ', '')}`
    // Map vehicle type to price key
    const vehiclePriceMap = {
      'Tractor': prices[`${sandType}`] || 5000,
      '709': prices[`${sandType}_709`] || 8000,
      '6W': prices[`${sandType}_6w`] || 17000,
      '10W': prices[`${sandType}_10w`] || 28000,
    }
    return { vehicleType, cost: vehiclePriceMap[vehicleType] || 0 }
  }

  if (row.divisible) {
    // Divisible — scale by area ratio
    const standardQty = row[sizeKey]
    if (!standardQty || standardQty === 0) return 0
    return Math.ceil(standardQty * (inputArea / standardArea))
  }

  // Non-divisible fixed value — use as-is
  return row[sizeKey] || 0
}

// Map floor type to BOQ table prefix
function getFloorPrefix(floorType, isGround) {
  if (isGround) {
    if (['parking_only', 'parking_lift', 'commercial_parking'].includes(floorType)) return 'gf_parking'
    if (floorType === '1bhk_parking') return 'gf_1bhk'
    if (floorType === '2bhk_parking') return 'gf_2bhk'
    if (floorType === 'duplex_gf') return 'gf_duplex'
    return 'gf_parking' // default
  } else {
    if (['1bhk'].includes(floorType)) return 'uf_1bhk'
    if (floorType === '1bhk_2units') return 'uf_1bhk2'
    if (floorType === '2bhk') return 'uf_2bhk'
    if (floorType === '3bhk') return 'uf_3bhk'
    if (floorType === '1bhk_2bhk') return 'uf_1bhk2bhk'
    if (floorType === '2bhk_3bhk') return 'uf_2bhk3bhk'
    if (['duplex_ff', 'duplex_sf'].includes(floorType)) return 'uf_duplex'
    return 'uf_2bhk' // default
  }
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export function calculateFullBOQ(project, prices) {
  const items = []
  const w = parseFloat(project.dimension_width)
  const l = parseFloat(project.dimension_length)
  const inputArea = w * l
  const floorCount = parseInt(project.floors) || 1
  const useBlocks = project.masonry_type !== 'brick'
  const floorsData = project.floors_data || []

  const cementPrice = parseFloat(prices['Cement']) || 400
  const blockPrice = parseFloat(prices['Blocks']) || 49
  const brickPrice = parseFloat(prices['Bricks']) || 8
  const masonryPrice = useBlocks ? blockPrice : brickPrice
  const masonryName = useBlocks ? 'Blocks' : 'Bricks'

  // All rates from DB
  const concreteCumPrice     = parseFloat(prices['Concrete CUM']) || 4500
  const ohtRate              = parseFloat(prices['OHT Water Tank']) || 7
  const chainStaircaseRate   = parseFloat(prices['Chain Staircase']) || 2300
  const flooringLabourRate   = parseFloat(prices['Flooring Labour']) || 30
  const epoxyGroutingRate    = parseFloat(prices['Epoxy Grouting']) || 10
  const sumpRccRate          = parseFloat(prices['Sump RCC']) || 13
  const sumpBlockCost        = parseFloat(prices['Sump Block']) || 30000
  const gasRate              = parseFloat(prices['Gas Pipeline']) || 200
  const rainwaterCost        = parseFloat(prices['Rainwater Harvesting']) || 20000
  const mainGateSmall        = parseFloat(prices['Main Gate Small']) || 30000
  const mainGateLarge        = parseFloat(prices['Main Gate Large']) || 50000
  const drainCoversSmall     = parseFloat(prices['Drain Covers Small']) || 20000
  const drainCoversLarge     = parseFloat(prices['Drain Covers Large']) || 30000
  const labourShedCost       = parseFloat(prices['Labour Shed']) || 50000
  const watchmanCost         = parseFloat(prices['Watchman']) || 50000
  const miscExpenseCost      = parseFloat(prices['Misc Expense']) || 150000

  const mainDoorPrices = {
    teak_3x7:        parseFloat(prices['Main Door Teak 3x7']) || 50000,
    teak_3x7_window: parseFloat(prices['Main Door Teak 3x7 Window']) || 70000,
    teak_4x8:        parseFloat(prices['Main Door Teak 4x8']) || 70000,
    teak_4x8_window: parseFloat(prices['Main Door Teak 4x8 Window']) || 100000,
    teak_5x8:        parseFloat(prices['Main Door Teak 5x8']) || 120000,
    teak_5x8_window: parseFloat(prices['Main Door Teak 5x8 Window']) || 135000,
    normal:          parseFloat(prices['Main Door Normal']) || 15000,
  }
  const bedroomDoorRate   = parseFloat(prices['Bedroom Door']) || 12000
  const washroomDoorRate  = parseFloat(prices['Washroom Door']) || 10000
  const balconyDoorRate   = parseFloat(prices['Balcony Door']) || 12000
  const utilityDoorRate   = parseFloat(prices['Utility Door']) || 10000
  const poojaRoomDoorRate = parseFloat(prices['Pooja Room Door']) || 20000

  const windowRates = {
    upvc_white: parseFloat(prices['Window UPVC White']) || 600,
    upvc_wood:  parseFloat(prices['Window UPVC Wood']) || 1000,
    wood_saal:  parseFloat(prices['Window Wood Saal']) || 1500,
  }

  const railingRates = {
    ms:         parseFloat(prices['Railing MS']) || 600,
    ss:         parseFloat(prices['Railing SS']) || 900,
    ss_glass:   parseFloat(prices['Railing SS Glass']) || 1300,
    glass_wood: parseFloat(prices['Railing Glass Wood']) || 1800,
  }

  const plumbingPipesRate          = parseFloat(prices['Plumbing Pipes']) || 40000
  const plumbingFittingsRate       = parseFloat(prices['Plumbing Fittings']) || 30000
  const plumbingLabourRate         = parseFloat(prices['Plumbing Labour']) || 10000
  const washroomWaterproofingRate  = parseFloat(prices['Washroom Waterproofing']) || 2000
  const cinderBackfillingRate      = parseFloat(prices['Cinder Backfilling']) || 4000
  const kitchenPlumbingRate        = parseFloat(prices['Kitchen Plumbing']) || 20000

  const paintingRates = {
    premium_emulsion: parseFloat(prices['Painting Premium+Emulsion']) || 8500,
    tractor_emulsion: parseFloat(prices['Painting Tractor+Emulsion']) || 7500,
    royal_emulsion:   parseFloat(prices['Painting Royal+Emulsion']) || 10000,
    royal_ultima:     parseFloat(prices['Painting Royal+Ultima']) || 13000,
  }

  const acProvisionRate   = parseFloat(prices['AC Provision']) || 10000
  const cctvProvisionRate = parseFloat(prices['CCTV Provision']) || 10000
  const evChargingRate    = parseFloat(prices['EV Charging Point']) || 10000
  const earthingPitCost   = parseFloat(prices['Earthing Pit']) || 18000
  const solarCost         = parseFloat(prices['Solar Provision']) || 30000
  const upsCost           = parseFloat(prices['UPS Provision']) || 20000
  const wifiCost          = parseFloat(prices['Wifi Cable Provision']) || 10000

  // Vehicle cost — reads from DB price map, falls back to hardcoded
  function vehicleCost(sandType, vehicleType) {
    if (!vehicleType || vehicleType === '0') return 0
    const unitKey = vehicleType === '6W' ? '6w' : vehicleType === '10W' ? '10w' : vehicleType.toLowerCase()
    const fallback = { 'Tractor': 5000, '709': 8000, '6W': 17000, '10W': 28000 }
    return parseFloat(prices[`${sandType}_${unitKey}`]) || fallback[vehicleType] || 0
  }

  // Helper to get BOQ row value
  function boq(rowKey, area) {
    const row = BOQ_TABLE[rowKey]
    if (!row) return 0
    return getValue(row, area, prices)
  }

  // Helper — add item
  function add(stage, name, unit, qty, unitPrice, total) {
    if (!qty && !total) return
    items.push({ stage, item_name: name, unit, quantity: qty, unit_price: unitPrice, total_price: total || (qty * unitPrice) })
  }

  // Helper — add vehicle item
  function addVehicle(stage, name, sandType, vehicleType, area) {
    if (!vehicleType || vehicleType === '0') return
    const cost = vehicleCost(sandType, vehicleType)
    if (!cost) return
    add(stage, `${name} (${vehicleType})`, vehicleType, 1, cost, cost)
  }

  // ============================================================
  // STAGE 1 — SITE PREPARATION
  // ============================================================
  const siteKey = getNearestUpperSize(inputArea)

  add('Site Preparation', 'Site Cleaning', 'JCB+Tractor', 1, BOQ_TABLE.site_cleaning[siteKey], BOQ_TABLE.site_cleaning[siteKey])
  add('Site Preparation', 'Survey', 'Lumpsum', 1, BOQ_TABLE.survey[siteKey], BOQ_TABLE.survey[siteKey])
  add('Site Preparation', 'Soil Test', 'Lumpsum', 1, BOQ_TABLE.soil_test[siteKey], BOQ_TABLE.soil_test[siteKey])
  add('Site Preparation', 'Excavation', 'JCB+Tractor', 1, BOQ_TABLE.excavation[siteKey], BOQ_TABLE.excavation[siteKey])

  // ============================================================
  // STAGE 2 — FOOTING
  // ============================================================
  const footingCement = boq('footing_cement', inputArea)
  add('Footing', 'Cement', 'Bags', footingCement, cementPrice, footingCement * cementPrice)

  const footingMSand = BOQ_TABLE.footing_msand[siteKey]
  addVehicle('Footing', 'M Sand', 'M Sand', footingMSand, inputArea)

  const footing20mm = BOQ_TABLE.footing_20mm[siteKey]
  addVehicle('Footing', '20mm Aggregate', '20mm Aggregate', footing20mm, inputArea)

  const footing40mm = BOQ_TABLE.footing_40mm[siteKey]
  addVehicle('Footing', '40mm Aggregate', '40mm Aggregate', footing40mm, inputArea)

  const footingCum = boq('footing_concrete', inputArea)
  add('Footing', 'Footing Concrete', 'CUM', footingCum, concreteCumPrice, footingCum * concreteCumPrice)

  add('Footing', 'Anti Termite Treatment', 'Lumpsum', 1, BOQ_TABLE.anti_termite[siteKey], BOQ_TABLE.anti_termite[siteKey])
  add('Footing', 'Cover Blocks', 'Lumpsum', 1, BOQ_TABLE.cover_blocks[siteKey], BOQ_TABLE.cover_blocks[siteKey])

  // ============================================================
  // STAGE 3 — SUMP (if selected)
  // ============================================================
  if (project.has_sump && project.sump_capacity) {
    const sumpCost = project.sump_type === 'rcc'
      ? Math.ceil(parseFloat(project.sump_capacity) * sumpRccRate)
      : sumpBlockCost
    add('Sump', `${project.sump_type?.toUpperCase()} Sump (${project.sump_capacity}L)`, 'Lumpsum', 1, sumpCost, sumpCost)
  }

  // ============================================================
  // STAGE 4 — SOIL REFILLING
  // ============================================================
  add('Soil Refilling', 'Soil Refilling', 'Lumpsum', 1, BOQ_TABLE.soil_refilling[siteKey], BOQ_TABLE.soil_refilling[siteKey])

  // ============================================================
  // STAGE 5 — PLINTH
  // ============================================================
  const plinthCement = boq('plinth_cement', inputArea)
  add('Plinth', 'Cement', 'Bags', plinthCement, cementPrice, plinthCement * cementPrice)
  addVehicle('Plinth', 'M Sand', 'M Sand', BOQ_TABLE.plinth_msand[siteKey], inputArea)
  addVehicle('Plinth', '20mm Aggregate', '20mm Aggregate', BOQ_TABLE.plinth_20mm[siteKey], inputArea)
  addVehicle('Plinth', '40mm Aggregate', '40mm Aggregate', BOQ_TABLE.plinth_40mm[siteKey], inputArea)

  // ============================================================
  // STAGE 6 — SSM (if selected)
  // ============================================================
  if (project.has_ssm && project.ssm_courses) {
    const courses = parseInt(project.ssm_courses) || 2
    const ssm_sizestone = boq('ssm_sizestone', inputArea)
    add('SSM Work', `Sizestone (${courses} courses)`, 'Lumpsum', 1, ssm_sizestone, ssm_sizestone)
    addVehicle('SSM Work', '40mm Aggregate', '40mm Aggregate', BOQ_TABLE.ssm_40mm[siteKey], inputArea)
    const ssmCement = boq('ssm_cement_2c', inputArea)
    add('SSM Work', 'Cement', 'Bags', ssmCement, cementPrice, ssmCement * cementPrice)
    addVehicle('SSM Work', 'M Sand', 'M Sand', BOQ_TABLE.ssm_msand_2c[siteKey], inputArea)
  }

  // ============================================================
  // STAGE 7 — STEEL (calculated 4.5 kg per sqft of total slab area)
  // ============================================================
  const totalSlabArea = floorsData.length > 0
  ? floorsData.reduce((sum, f) => sum + (parseFloat(f.sqft) || inputArea), 0)
  : inputArea * floorCount
  const steelKg = totalSlabArea * 4.5
  const steelTonnes = Math.ceil(steelKg / 1000)
  const steelPrice = parseFloat(prices['Steel Primary (JSW/Tata)']) || 83000
  add('Steel', 'Steel (4.5 kg/sqft of slab area)', 'Tonnes', steelTonnes, steelPrice, steelTonnes * steelPrice)

  // ============================================================
  // STAGE 8 — FLOORS (per floor from floors_data)
  // ============================================================
  floorsData.forEach((floor, index) => {
    if (!floor.type) return
    const stageName = floor.name || `Floor ${index}`
    const floorArea = parseFloat(floor.sqft) || inputArea
    const isGround = index === 0
    const prefix = getFloorPrefix(floor.type, isGround)
    const floorSizeKey = getNearestUpperSize(floorArea)
    const isParking = ['parking_only', 'parking_lift', 'commercial_parking'].includes(floor.type)

    // Masonry
    if (!isParking) {
      const masonryKey = `${prefix}_${useBlocks ? 'blocks' : 'bricks'}`
      const masonryRow = BOQ_TABLE[masonryKey] || BOQ_TABLE[`${prefix}_blocks`]
      if (masonryRow) {
        const qty = masonryRow[floorSizeKey] || 0
        if (qty > 0) add(stageName, masonryName, 'Nos', qty, masonryPrice, qty * masonryPrice)
      }
    }

    // Cement
    const cementRow = BOQ_TABLE[`${prefix}_cement`]
    if (cementRow) {
      const standardSizeForFloor = STANDARD_SIZES.find(s => s.key === floorSizeKey)
      const qty = cementRow.divisible
        ? Math.ceil((cementRow[floorSizeKey] || 0) * (floorArea / standardSizeForFloor.area))
        : cementRow[floorSizeKey] || 0
      if (qty > 0) add(stageName, 'Cement (B/W+Column+Lintel+Staircase)', 'Bags', qty, cementPrice, qty * cementPrice)
    }

    // M Sand
    const msandRow = BOQ_TABLE[`${prefix}_msand`]
    if (msandRow) addVehicle(stageName, 'M Sand', 'M Sand', msandRow[floorSizeKey], floorArea)

    // 20mm Aggregate
    const aggRow = BOQ_TABLE[`${prefix}_20mm`]
    if (aggRow) addVehicle(stageName, '20mm Aggregate', '20mm Aggregate', aggRow[floorSizeKey], floorArea)

    // Slab Concrete
    const slabRow = BOQ_TABLE[`${prefix}_slab`]
    if (slabRow) {
      const standardSizeForFloor = STANDARD_SIZES.find(s => s.key === floorSizeKey)
      const slabCum = slabRow.divisible
        ? Math.ceil((slabRow[floorSizeKey] || 0) * (floorArea / standardSizeForFloor.area))
        : slabRow[floorSizeKey] || 0
      if (slabCum > 0) add(stageName, 'Slab Concrete', 'CUM', slabCum, concreteCumPrice, slabCum * concreteCumPrice)
    }

    // Electrical
    const elecRow = BOQ_TABLE[`${prefix}_elec`]
    if (elecRow) {
      const elecCost = elecRow[floorSizeKey] || 0
      if (elecCost > 0) add(stageName, 'Electrical (Slab & Wall) Material', 'Lumpsum', 1, elecCost, elecCost)
    }

    // Misc
    const miscRow = BOQ_TABLE[`${prefix}_misc`]
    if (miscRow) {
      const miscCost = miscRow[floorSizeKey] || 0
      if (miscCost > 0) add(stageName, 'Misc (Oil, Cover, Chape)', 'Lumpsum', 1, miscCost, miscCost)
    }

    // Chain Staircase
    if (floor.staircaseType === 'chain') {
      const steps = parseInt(floor.staircaseSteps) || 19
      const stairCost = steps * chainStaircaseRate
      add(stageName, `Chain Staircase (${steps} steps)`, 'Per Step', steps, chainStaircaseRate, stairCost)
    }
  })

  // ============================================================
  // STAGE 9 — TERRACE
  // ============================================================
  const terraceSizeKey = getNearestUpperSize(inputArea)
  const terraceBlocks = BOQ_TABLE.terrace_blocks[terraceSizeKey] || 0
  if (terraceBlocks > 0) add('Terrace', `Parapet Wall ${masonryName}`, 'Nos', terraceBlocks, masonryPrice, terraceBlocks * masonryPrice)

  const terraceCement = boq('terrace_cement', inputArea)
  add('Terrace', 'Cement', 'Bags', terraceCement, cementPrice, terraceCement * cementPrice)
  addVehicle('Terrace', 'M Sand', 'M Sand', BOQ_TABLE.terrace_msand[terraceSizeKey], inputArea)

  const terraceSlab = boq('terrace_slab', inputArea)
  add('Terrace', 'Slab Concrete', 'CUM', terraceSlab, concreteCumPrice, terraceSlab * concreteCumPrice)

  add('Terrace', 'Electrical (Slab & Wall)', 'Lumpsum', 1, BOQ_TABLE.terrace_elec[terraceSizeKey], BOQ_TABLE.terrace_elec[terraceSizeKey])
  add('Terrace', 'Misc (Oil, Cover, Chape)', 'Lumpsum', 1, BOQ_TABLE.terrace_misc[terraceSizeKey], BOQ_TABLE.terrace_misc[terraceSizeKey])

  // OHT / Staircase headroom
  if (project.has_oht) {
    const ohtCap = parseFloat(project.oht_capacity) || 1000
    const ohtCost = Math.ceil(ohtCap * ohtRate)
    add('Terrace', `OHT (${ohtCap}L)`, 'Lumpsum', 1, ohtCost, ohtCost)
  }

  // ============================================================
  // STAGE 10 — SCREED CONCRETE
  // ============================================================
  const screedCement = boq('screed_cement', inputArea)
  add('Screed Concrete', 'Cement', 'Bags', screedCement, cementPrice, screedCement * cementPrice)
  addVehicle('Screed Concrete', 'P Sand', 'P Sand', BOQ_TABLE.screed_psand[terraceSizeKey], inputArea)
  add('Screed Concrete', 'Misc', 'Lumpsum', 1, BOQ_TABLE.screed_misc[terraceSizeKey], BOQ_TABLE.screed_misc[terraceSizeKey])

  // ============================================================
  // STAGE 11 — PLASTERING
  // ============================================================
  const floorKey = Math.min(floorCount, 6)
  const plasterData = PLASTERING_TABLE[floorKey] || PLASTERING_TABLE[6]
  const plasterCement = boq_plastering(plasterData.cement, inputArea)
  add('Plastering', 'Cement', 'Bags', plasterCement, cementPrice, plasterCement * cementPrice)

  const plasterPSandCount = plasterData.psand[terraceSizeKey] || 6
  const pSandPrice = parseFloat(prices['P Sand_6w']) || 24000
  add('Plastering', 'P Sand (6W)', 'Per Load', plasterPSandCount, pSandPrice, plasterPSandCount * pSandPrice)
  add('Plastering', 'Misc (Sponge, Mesh)', 'Lumpsum', 1, plasterData.misc, plasterData.misc)

  function boq_plastering(row, area) {
    const sk = getNearestUpperSize(area)
    const std = STANDARD_SIZES.find(s => s.key === sk)
    const baseQty = row[sk] || 0
    return Math.ceil(baseQty * (area / std.area))
  }

  // ============================================================
  // STAGE 12 — FLOORING (per floor)
  // ============================================================
  floorsData.forEach((floor, index) => {
    if (!floor.type) return
    const stageName = 'Flooring'
    const floorArea = parseFloat(floor.sqft) || inputArea
    const floorSizeKey = getNearestUpperSize(floorArea)
    const standardSizeForFloor = STANDARD_SIZES.find(s => s.key === floorSizeKey)

    // Cement per floor
    const floorCementBase = FLOORING_TABLE.cement[floorSizeKey] || 25
    const floorCement = Math.ceil(floorCementBase * (floorArea / standardSizeForFloor.area))
    add(stageName, `Cement — ${floor.name}`, 'Bags', floorCement, cementPrice, floorCement * cementPrice)

    // Roof Cement per toilet
    const toilets = parseInt(floor.toilets) || 0
    if (toilets > 0) {
      add(stageName, `Roof Cement — ${floor.name} (${toilets} toilets)`, 'Bags', toilets * 6, cementPrice, toilets * 6 * cementPrice)
    }

    // Tiles — (floorArea + 200*toilets + 80*kitchens) + 15% of floorArea
    const kitchens = parseInt(floor.kitchens) || 0
    const tilesAutoArea = Math.ceil(floorArea * 1.15 + 200 * toilets + 80 * kitchens)
    const tilesArea = parseFloat(floor.tilesSquft) || tilesAutoArea
    const tilesPrice = parseFloat(floor.tilesPricePerSqft) || 50
    if (tilesArea > 0) {
      add(stageName, `Tiles — ${floor.name}`, 'Sqft', tilesArea, tilesPrice, tilesArea * tilesPrice)
    }

    // Flooring Labour & Epoxy — use tilesArea (same surface as tiles)
    add(stageName, `Flooring Labour — ${floor.name}`, 'Per Sqft', tilesArea, flooringLabourRate, tilesArea * flooringLabourRate)
    add(stageName, `Epoxy Grouting — ${floor.name}`, 'Per Sqft', tilesArea, epoxyGroutingRate, tilesArea * epoxyGroutingRate)
  })

  // ============================================================
  // STAGE 13 — DOORS
  // ============================================================
  floorsData.forEach(floor => {
    if (!floor.type || ['parking_only', 'parking_lift', 'commercial_parking'].includes(floor.type)) return
    const stageName = `Doors — ${floor.name}`

    if (floor.mainDoor && mainDoorPrices[floor.mainDoor]) {
      add(stageName, 'Main Door', 'Per Door', 1, mainDoorPrices[floor.mainDoor], mainDoorPrices[floor.mainDoor])
    }
    if (parseInt(floor.bedroomDoors) > 0) add(stageName, 'Bedroom Doors', 'Per Door', parseInt(floor.bedroomDoors), bedroomDoorRate, parseInt(floor.bedroomDoors) * bedroomDoorRate)
    if (parseInt(floor.washroomDoors) > 0) add(stageName, 'Washroom Doors', 'Per Door', parseInt(floor.washroomDoors), washroomDoorRate, parseInt(floor.washroomDoors) * washroomDoorRate)
    if (parseInt(floor.balconyDoors) > 0) add(stageName, 'Balcony Doors', 'Per Door', parseInt(floor.balconyDoors), balconyDoorRate, parseInt(floor.balconyDoors) * balconyDoorRate)
    if (parseInt(floor.utilityDoors) > 0) add(stageName, 'Utility Doors', 'Per Door', parseInt(floor.utilityDoors), utilityDoorRate, parseInt(floor.utilityDoors) * utilityDoorRate)
    if (floor.poojaRoom) {
      const poojaRate = parseFloat(floor.poojaRoomPrice) || poojaRoomDoorRate
      add(stageName, 'Pooja Room Door', 'Per Door', 1, poojaRate, poojaRate)
    }
  })

  // ============================================================
  // STAGE 14 — WINDOWS (per floor)
  // ============================================================

  floorsData.forEach(floor => {
    if (!floor.type || ['parking_only', 'parking_lift', 'commercial_parking'].includes(floor.type)) return
    if (!floor.railingType && !floor.windowSqft) return
    const floorArea = parseFloat(floor.sqft) || inputArea
    const windowArea = parseFloat(floor.windowSqft) || Math.ceil(floorArea * 0.10)
    const windowRate = windowRates[project.window_type] || 600
    if (windowArea > 0 && project.window_type) {
      add(`Windows — ${floor.name}`, 'Windows', 'Sqft', windowArea, windowRate, windowArea * windowRate)
    }
  })

  // ============================================================
  // STAGE 15 — RAILING (per floor)
  // ============================================================

  floorsData.forEach(floor => {
    if (!floor.railingType || !floor.railingRft) return
    const rft = parseFloat(floor.railingRft) || 0
    const rate = railingRates[floor.railingType] || 600
    if (rft > 0) add(`Railing — ${floor.name}`, `Railing (${floor.railingType.toUpperCase()})`, 'Per RFT', rft, rate, rft * rate)
  })

  // ============================================================
  // STAGE 16 — ELECTRICAL
  // ============================================================
  const chadra = Math.round(totalSlabArea / 100)
  const elecMaterial = parseFloat(prices['Electrical Material']) || 9000
  const elecLabour = parseFloat(prices['Electrical Labour']) || 3000
  add('Electrical', 'Electrical Material', 'Per Chadra', chadra, elecMaterial, chadra * elecMaterial)
  add('Electrical', 'Electrical Labour', 'Per Chadra', chadra, elecLabour, chadra * elecLabour)

  // ============================================================
  // STAGE 17 — PLUMBING (per floor based on toilet count)
  // ============================================================
  floorsData.forEach(floor => {
    if (!floor.type || ['parking_only', 'parking_lift', 'commercial_parking'].includes(floor.type)) return
    const toilets = parseInt(floor.toilets) || 0
    const kitchens = parseInt(floor.kitchens) || 0
    if (toilets > 0) {
      add(`Plumbing — ${floor.name}`, 'Plumbing Pipes', 'Per Toilet', toilets, plumbingPipesRate, toilets * plumbingPipesRate)
      add(`Plumbing — ${floor.name}`, 'Plumbing Fittings', 'Per Toilet', toilets, plumbingFittingsRate, toilets * plumbingFittingsRate)
      add(`Plumbing — ${floor.name}`, 'Plumbing Labour', 'Per Toilet', toilets, plumbingLabourRate, toilets * plumbingLabourRate)
      add(`Plumbing — ${floor.name}`, 'Washroom Waterproofing', 'Per Toilet', toilets, washroomWaterproofingRate, toilets * washroomWaterproofingRate)
      add(`Plumbing — ${floor.name}`, 'Cinder Backfilling', 'Per Toilet', toilets, cinderBackfillingRate, toilets * cinderBackfillingRate)
    }
    if (kitchens > 0) {
      add(`Plumbing — ${floor.name}`, 'Kitchen Plumbing', 'Per Kitchen', kitchens, kitchenPlumbingRate, kitchens * kitchenPlumbingRate)
    }
  })

  // ============================================================
  // STAGE 18 — PAINTING
  // ============================================================
  if (project.painting_grade) {
    const paintRate = paintingRates[project.painting_grade] || 8500
    add('Painting', 'Painting', 'Per Chadra', chadra, paintRate, chadra * paintRate)
  }

  // ============================================================
  // STAGE 19 — LABOUR
  // ============================================================
  const labourRate = parseFloat(prices['Labour']) || 36000
  add('Labour', 'Construction Labour', 'Per Chadra', chadra, labourRate, chadra * labourRate)

  // ============================================================
  // STAGE 20 — COMPOUND WALL
  // ============================================================
  if (project.has_compound_wall) {
    const cwMasonryQty = BOQ_TABLE.cw_blocks[siteKey] || 0
    const cwBricksQty = cwMasonryQty * 5
    const cwQty = useBlocks ? cwMasonryQty : cwBricksQty
    add('Compound Wall', `${masonryName} (4 sides)`, 'Nos', cwQty, masonryPrice, cwQty * masonryPrice)
    add('Compound Wall', 'Labour', 'Lumpsum', 1, BOQ_TABLE.cw_labour[siteKey], BOQ_TABLE.cw_labour[siteKey])
    add('Compound Wall', 'Plastering & Painting', 'Lumpsum', 1, BOQ_TABLE.cw_plastering[siteKey], BOQ_TABLE.cw_plastering[siteKey])
    const cwCement = boq('cw_cement', inputArea)
    add('Compound Wall', 'Cement', 'Bags', cwCement, cementPrice, cwCement * cementPrice)
  }

  // ============================================================
  // STAGE 21 — SERVICES
  // ============================================================
  const isLargeSite = BOQ_TABLE.site_cleaning[siteKey] >= 20000
  if (project.has_main_gate) add('Services', 'Main Gate', 'Lumpsum', 1, isLargeSite ? mainGateLarge : mainGateSmall, isLargeSite ? mainGateLarge : mainGateSmall)
  if (project.has_rainwater) add('Services', 'Rainwater Harvesting', 'Lumpsum', 1, rainwaterCost, rainwaterCost)
  if (project.has_gas) {
    const gasRft = 15 * floorCount
    add('Services', 'Gas Pipeline', 'Per RFT', gasRft, gasRate, gasRft * gasRate)
  }
  add('Services', 'Drain Covers & Ramp', 'Lumpsum', 1, isLargeSite ? drainCoversLarge : drainCoversSmall, isLargeSite ? drainCoversLarge : drainCoversSmall)
  add('Services', 'Labour Shed', 'Lumpsum', 1, labourShedCost, labourShedCost)
  add('Services', 'Watchman', 'Lumpsum', 1, watchmanCost, watchmanCost)
  add('Services', 'Misc Expense', 'Lumpsum', 1, miscExpenseCost, miscExpenseCost)

  // ============================================================
  // STAGE 22 — PROVISIONS
  // ============================================================
  if (project.has_ac) {
    const totalAcPoints = floorsData.reduce((sum, f) => sum + (parseInt(f.acPoints) || 0), 0)
    if (totalAcPoints > 0) add('Provisions', 'AC Provision', 'Per Point', totalAcPoints, acProvisionRate, totalAcPoints * acProvisionRate)
  }
  if (project.has_cctv) add('Provisions', 'CCTV Provision', 'Per Floor', floorCount, cctvProvisionRate, floorCount * cctvProvisionRate)
  if (project.has_ev) add('Provisions', 'EV Charging Point', 'Lumpsum', 1, evChargingRate, evChargingRate)
  add('Provisions', 'Earthing Pit', 'Lumpsum', 1, earthingPitCost, earthingPitCost)
  if (project.has_solar) add('Provisions', 'Solar Provision', 'Lumpsum', 1, solarCost, solarCost)
  if (project.has_ups) add('Provisions', 'UPS Provision', 'Lumpsum', 1, upsCost, upsCost)
  if (project.has_wifi) add('Provisions', 'WiFi & Cable Provision', 'Lumpsum', 1, wifiCost, wifiCost)

  // ============================================================
  // STAGE 23 — ELEVATION (1% of total civil cost)
  // ============================================================
  const civilTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0)
  const elevationCost = Math.ceil(civilTotal * 0.01)
  add('Elevation', 'Elevation (1% of civil cost)', 'Lumpsum', 1, elevationCost, elevationCost)

  return items
}