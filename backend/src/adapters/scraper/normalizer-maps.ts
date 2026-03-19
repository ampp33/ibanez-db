/**
 * Static lookup maps for normalizing raw wiki field values.
 * All maps key on lowercase trimmed input.
 */

/** Strip wiki markup artifacts, HTML tags, and excessive whitespace. */
export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')       // strip HTML tags
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, link, display) => display || link) // [[link|display]]
    .replace(/\{\{[^}]+\}\}/g, '') // strip wiki templates
    .replace(/\s+/g, ' ')
    .trim();
}

export const BODY_MATERIAL_MAP: Record<string, string> = {
  basswood: 'Basswood',
  'american basswood': 'Basswood',
  alder: 'Alder',
  ash: 'Ash',
  'swamp ash': 'Swamp Ash',
  'light ash': 'Ash',
  'solid ash': 'Ash',
  'selected solid ash': 'Ash',
  mahogany: 'Mahogany',
  'african mahogany': 'African Mahogany',
  'honduran mahogany': 'Mahogany',
  'honduras mahogany': 'Mahogany',
  'solid mahogany': 'Mahogany',
  'laminated mahogany': 'Mahogany',
  'soft maple': 'Soft Maple',
  'light american maple': 'Maple',
  poplar: 'Poplar',
  maple: 'Maple',
  'flamed maple': 'Flamed Maple',
  'quilted maple': 'Quilted Maple',
  'spalted maple': 'Spalted Maple',
  'soft flame maple': 'Flamed Maple',
  walnut: 'Walnut',
  nyatoh: 'Nyatoh',
  meranti: 'Meranti',
  agathis: 'Agathis',
  okoume: 'Okoume',
  nato: 'Nato',
  bubinga: 'Bubinga',
  korina: 'Korina',
  limba: 'Limba',
  sapele: 'Sapele',
  birch: 'Birch',
  linden: 'Linden',
  teak: 'Teak',
  saman: 'Saman',
  jelutong: 'Jelutong',
  camphor: 'Camphor',
  'monkey pod': 'Monkey Pod',
  luthite: 'Luthite',
  resoncast: 'Resoncast',
  acrylic: 'Acrylic',
  plywood: 'Plywood',
  'plywood maple': 'Plywood',
  'hawaiian koa': 'Koa',
  koa: 'Koa',
};

export const FRETBOARD_MATERIAL_MAP: Record<string, string> = {
  rosewood: 'Rosewood',
  'indian rosewood': 'Rosewood',
  'sonokeling rosewood': 'Rosewood',
  'selected rosewood': 'Rosewood',
  'dark rosewood': 'Rosewood',
  'select dark rosewood': 'Rosewood',
  'selected dark rosewood': 'Rosewood',
  'long-grain rosewood': 'Rosewood',
  'marbled rosewood': 'Rosewood',
  's-tech rosewood': 'Rosewood',
  'ebonized rosewood': 'Rosewood',
  'ebonized': 'Rosewood',
  'ebonised rosewood': 'Rosewood',
  'ebonized (rosewood)': 'Rosewood',
  ebony: 'Ebony',
  'black ebony': 'Ebony',
  'selected ebony': 'Ebony',
  'pale moon ebony': 'Ebony',
  'madagascar ebony': 'Ebony',
  'white ebony': 'White Ebony',
  'selected white ebony': 'White Ebony',
  'kalimantan ebony': 'Ebony',
  'selected kalimantan ebony': 'Ebony',
  'selected stripe ebony': 'Ebony',
  'macassar ebony': 'Macassar Ebony',
  'selected macassar ebony': 'Macassar Ebony',
  maple: 'Maple',
  'bound maple': 'Maple',
  'rock maple': 'Maple',
  'hard maple': 'Maple',
  'selected maple': 'Maple',
  'selected figured maple': 'Maple',
  'spalted maple': 'Spalted Maple',
  'spalted maple (stabilized)': 'Spalted Maple',
  'curly maple': 'Maple',
  'flame maple': 'Maple',
  'flamed maple': 'Maple',
  'birdseye maple': 'Birdseye Maple',
  'birds eye maple': 'Birdseye Maple',
  'bound birdseye maple': 'Birdseye Maple',
  'roasted maple': 'Roasted Maple',
  's-tech roasted maple': 'Roasted Maple',
  's-tech roasted flamed maple': 'Roasted Maple',
  's-tech roasted birdseye maple': 'Roasted Maple',
  'roasted birdseye maple': 'Roasted Maple',
  'roasted flamed maple': 'Roasted Maple',
  'thermo aged maple': 'Roasted Maple',
  'thermo-aged maple': 'Roasted Maple',
  'one-piece s-tech roasted maple': 'Roasted Maple',
  'one-piece s-tech roasted flamed maple': 'Roasted Maple',
  'one-piece s-tech roasted birdseye maple': 'Roasted Maple',
  'cultured maple': 'Maple',
  jatoba: 'Jatoba',
  'treated new zealand pine': 'Treated New Zealand Pine',
  'treated new zealand pine (tnzp)': 'Treated New Zealand Pine',
  purpleheart: 'Purpleheart',
  amaranth: 'Amaranth',
  walnut: 'Walnut',
  richlite: 'Richlite',
  'bound rosewood': 'Rosewood',
  'pau ferro': 'Pau Ferro',
  'thermo aged pau ferro': 'Pau Ferro',
  'thermo-aged pau ferro': 'Pau Ferro',
  ovangkol: 'Ovangkol',
  'thermo-aged ovangkol': 'Ovangkol',
  'panga panga': 'Panga Panga',
  laurel: 'Laurel',
  'nandu wood': 'Nandu Wood',
  katalox: 'Katalox',
  cocobolo: 'Cocobolo',
  wenge: 'Wenge',
  'selected wenge': 'Wenge',
  'bolivian rosewood': 'Rosewood',
  'brazilian rosewood': 'Rosewood',
  'honduran rosewood': 'Rosewood',
  'madagascar rosewood': 'Rosewood',
  'hardwood': 'Hardwood',
  'hardwood grained': 'Hardwood',
  merbau: 'Merbau',
  granadillo: 'Granadillo',
};

export const NECK_MATERIAL_MAP: Record<string, string> = {
  maple: 'Maple',
  'hard maple': 'Maple',
  'hard rock maple': 'Maple',
  'quartersawn maple': 'Maple',
  'quartersawn hard rock maple': 'Maple',
  'quartersawn canadian maple': 'Maple',
  'quartersawn canadian hard rock maple': 'Maple',
  'eastern white maple': 'Maple',
  'flamed maple': 'Maple',
  'birdseye maple': 'Birdseye Maple',
  'roasted maple': 'Roasted Maple',
  'one-piece roasted maple': 'Roasted Maple',
  'one-piece s-tech roasted maple': 'Roasted Maple',
  'one-piece s-tech roasted flamed maple': 'Roasted Maple',
  'one-piece s-tech roasted birdseye maple': 'Roasted Maple',
  'one-piece thermo-aged mahogany': 'Mahogany',
  'one-piece thermo-aged nyatoh': 'Nyatoh',
  'one-piece thermo-aged african mahogany': 'African Mahogany',
  'thermo-aged african mahogany': 'African Mahogany',
  '5-piece thermo-aged african mahogany': 'African Mahogany',
  'roasted flamed maple': 'Roasted Maple',
  '5pc roasted flamed maple': 'Roasted Maple',
  '5-piece roasted maple': 'Roasted Maple',
  '5-piece roasted maple/ bubinga': 'Roasted Maple',
  mahogany: 'Mahogany',
  'african mahogany': 'African Mahogany',
  'honduran mahogany': 'Mahogany',
  'honduras mahogany': 'Mahogany',
  walnut: 'Walnut',
  bubinga: 'Bubinga',
  wenge: 'Wenge',
  purpleheart: 'Purpleheart',
  'purple heart': 'Purpleheart',
  nyatoh: 'Nyatoh',
  okoume: 'Okoume',
  meranti: 'Meranti',
  nato: 'Nato',
  natoh: 'Nato',
  birch: 'Birch',
  rosewood: 'Rosewood',
  sapele: 'Sapele',
  korina: 'Korina',
  jatoba: 'Jatoba',
  'panga panga': 'Panga Panga',
  granadillo: 'Granadillo',
  'pau ferro': 'Pau Ferro',
  amaranth: 'Amaranth',
  'rock maple': 'Maple',
};

export const HARDWARE_COLOR_MAP: Record<string, string> = {
  chrome: 'Chrome',
  'cosmo black': 'Cosmo Black',
  black: 'Black',
  gold: 'Gold',
  nickel: 'Nickel',
  'black nickel': 'Black Nickel',
  'brushed nickel': 'Brushed Nickel',
};

export const BRIDGE_TYPE_MAP: Record<string, string> = {
  // ---- Tremolo bridges (all normalized names include "Tremolo") ----

  // Edge family
  'edge': 'Edge Tremolo',
  'edge tremolo': 'Edge Tremolo',
  'original edge': 'Edge Tremolo',
  'lo-pro edge': 'Lo-Pro Edge Tremolo',
  'lo pro edge': 'Lo-Pro Edge Tremolo',
  'lo-pro edge tremolo': 'Lo-Pro Edge Tremolo',
  'edge pro': 'Edge Pro Tremolo',
  'edge pro tremolo': 'Edge Pro Tremolo',
  'edge pro ii': 'Edge Pro II Tremolo',
  'edge pro ii tremolo': 'Edge Pro II Tremolo',
  'edge zero': 'Edge Zero Tremolo',
  'edge zero tremolo': 'Edge Zero Tremolo',
  'edge zero ii': 'Edge Zero II Tremolo',
  'edge-zero ii': 'Edge Zero II Tremolo',
  'edge zero ii tremolo': 'Edge Zero II Tremolo',
  'edge iii': 'Edge III Tremolo',
  'edge iii tremolo': 'Edge III Tremolo',
  'edge s': 'Edge Tremolo',

  // Lo-TRS family
  'lo-trs': 'Lo-TRS Tremolo',
  'lo trs': 'Lo-TRS Tremolo',
  'lo-trs tremolo': 'Lo-TRS Tremolo',
  'lo-trs ii': 'Lo-TRS II Tremolo',
  'lo trs ii': 'Lo-TRS II Tremolo',
  'lo-trs ii tremolo': 'Lo-TRS II Tremolo',

  // FAT-6
  'fat-6': 'FAT-6 Tremolo',
  'fat 6': 'FAT-6 Tremolo',
  'fat-6 tremolo': 'FAT-6 Tremolo',

  // ZR (Zero Resistance)
  'zr': 'ZR Tremolo',
  'zr tremolo': 'ZR Tremolo',
  'zero resistance': 'ZR Tremolo',

  // AZ / AZ-1
  'az-1': 'AZ Tremolo',
  'az1': 'AZ Tremolo',
  'az tremolo': 'AZ Tremolo',

  // Floyd Rose
  'floyd rose': 'Floyd Rose Tremolo',
  'floyd rose tremolo': 'Floyd Rose Tremolo',
  'floyd rose original': 'Floyd Rose Tremolo',
  'floyd rose licensed': 'Floyd Rose Tremolo',
  'double locking tremolo': 'Floyd Rose Tremolo',
  'fr tremolo': 'Floyd Rose Tremolo',

  // Generic tremolo
  'tremolo': 'Tremolo',
  'double tremolo': 'Tremolo',
  'vibrato': 'Tremolo',

  // ---- Fixed bridges (no "Tremolo" in name) ----

  // Gibraltar family
  'gibraltar': 'Gibraltar',
  'gibraltar standard': 'Gibraltar Standard',
  'gibraltar standard ii': 'Gibraltar Standard II',
  'gibraltar standard 4': 'Gibraltar Standard 4',
  'gibraltar standard 4b': 'Gibraltar Standard 4B',
  'gibraltar bass': 'Gibraltar Bass',
  'gibraltar bass ii': 'Gibraltar Bass II',
  'gibraltar plus': 'Gibraltar Plus',

  // Tight-End family
  'tight-end': 'Tight-End',
  'tight end': 'Tight-End',
  'tight-end r': 'Tight-End R',
  'tight end r': 'Tight-End R',

  // Mono-rail (bass)
  'mono-rail': 'Mono-rail',
  'mono rail': 'Mono-rail',
  'mono-rail ii': 'Mono-rail II',
  'mono-rail iii': 'Mono-rail III',
  'mono-rail iv': 'Mono-rail IV',
  'mono-rail v': 'Mono-rail V',
  'mono rail v': 'Mono-rail V',

  // Generic fixed
  'fixed': 'Fixed',
  'hardtail': 'Fixed',
  'hard tail': 'Fixed',
  'tailpiece': 'Fixed',
  'stop-bar': 'Fixed',
  'stopbar': 'Fixed',
  'stop bar': 'Fixed',
  'tune-o-matic': 'Tune-o-matic',
  'tunamatic': 'Tune-o-matic',
  'tune o matic': 'Tune-o-matic',

  // Model-specific fixed
  't1502': 'T1502',
  't106b': 'T106B',
  't-bar': 'T-bar',
  'quick change': 'Quick Change',
  'quick change iii': 'Quick Change III',
};

export const COUNTRY_MAP: Record<string, string> = {
  japan: 'Japan',
  'made in japan': 'Japan',
  'crafted in japan': 'Japan',
  korea: 'South Korea',
  'south korea': 'South Korea',
  'republic of korea': 'South Korea',
  indonesia: 'Indonesia',
  'made in indonesia': 'Indonesia',
  china: 'China',
  'made in china': 'China',
  prc: 'China',
  usa: 'USA',
  'united states': 'USA',
  taiwan: 'Taiwan',
  mexico: 'Mexico',
  'czech republic': 'Czech Republic',
  germany: 'Germany',
  'united kingdom': 'UK',
  uk: 'UK',
};

/**
 * Shared regex for splitting on year-range boundaries
 * (e.g. "2016–2018: mahogany2019: nyatoh").
 */
export const yearSplitPattern = /(?=[""]?\d{4}[""]?\s*[-–—]?\s*\d{0,4}[""]?\s*:)/g;

/** Normalize a value against a mapping table. */
export function normalizeWith(value: string, map: Record<string, string>): string {
  const lower = value.toLowerCase().trim();
  return map[lower] ?? value.trim();
}
