/**
 * Normalizes scraped field values into consistent representations.
 * Handles common inconsistencies found in wiki-sourced guitar data.
 */

const BODY_MATERIAL_MAP: Record<string, string> = {
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

const FRETBOARD_MATERIAL_MAP: Record<string, string> = {
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

const NECK_MATERIAL_MAP: Record<string, string> = {
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

const HARDWARE_COLOR_MAP: Record<string, string> = {
  chrome: 'Chrome',
  'cosmo black': 'Cosmo Black',
  black: 'Black',
  gold: 'Gold',
  nickel: 'Nickel',
  'black nickel': 'Black Nickel',
  'brushed nickel': 'Brushed Nickel',
};

const BRIDGE_TYPE_MAP: Record<string, string> = {
  edge: 'Edge',
  'edge zero': 'Edge Zero',
  'edge zero ii': 'Edge Zero II',
  'edge-zero ii': 'Edge Zero II',
  'edge iii': 'Edge III',
  'edge pro': 'Edge Pro',
  'edge pro ii': 'Edge Pro II',
  'lo-pro edge': 'Lo-Pro Edge',
  'lo pro edge': 'Lo-Pro Edge',
  'lo-trs ii': 'Lo-TRS II',
  'lo trs ii': 'Lo-TRS II',
  'gibraltar standard ii': 'Gibraltar Standard II',
  gibraltar: 'Gibraltar',
  fixed: 'Fixed',
  'tight-end r': 'Tight-End R',
  'tight end r': 'Tight-End R',
  'tight-end': 'Tight-End',
  'tight end': 'Tight-End',
  'fat-6': 'FAT-6',
  'fat 6': 'FAT-6',
  't1502': 'T1502',
  'mono-rail': 'Mono-rail',
};

const COUNTRY_MAP: Record<string, string> = {
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

/** Normalize a value against a mapping table. */
function normalizeWith(value: string, map: Record<string, string>): string {
  const lower = value.toLowerCase().trim();
  return map[lower] ?? value.trim();
}

/** Strip wiki markup artifacts, HTML tags, and excessive whitespace. */
export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')       // strip HTML tags
    .replace(/\[\[([^\]|]+)\|?([^\]]*)\]\]/g, (_, link, display) => display || link) // [[link|display]]
    .replace(/\{\{[^}]+\}\}/g, '') // strip wiki templates
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeBodyMaterial(raw: string): string {
  return normalizeWith(cleanText(raw), BODY_MATERIAL_MAP);
}

export function normalizeFretboardMaterial(raw: string): string {
  return normalizeWith(cleanText(raw), FRETBOARD_MATERIAL_MAP);
}

export function normalizeNeckMaterial(raw: string): string {
  return normalizeWith(cleanText(raw), NECK_MATERIAL_MAP);
}

export function normalizeHardwareColor(raw: string): string {
  return normalizeWith(cleanText(raw), HARDWARE_COLOR_MAP);
}

export function normalizeBridgeType(raw: string): string {
  return normalizeWith(cleanText(raw), BRIDGE_TYPE_MAP);
}

export function normalizeCountry(raw: string): string {
  return normalizeWith(cleanText(raw), COUNTRY_MAP);
}

// ---- Material list extraction ----

/**
 * Strip year-range prefixes like "2016–2018:", "1987-1994:", "\"1978-1980\":" from segments.
 * Also strips quoted year ranges.
 */
function stripYearPrefix(s: string): string {
  return s
    .replace(/^[""]?\d{4}[""]?\s*[-–—]\s*\d{4}[""]?\s*:\s*/g, '')
    .replace(/^[""]?\d{4}[""]?\s*:\s*/g, '')
    .trim();
}

/**
 * Strip piece-count prefixes: "1-piece", "3-piece", "5pc", etc.
 */
function stripPieceCount(s: string): string {
  return s
    .replace(/^\d+[-\s]?piece\s*/i, '')
    .replace(/^\d+pc\s*/i, '')
    .replace(/^\d+mm\s*/i, '')
    .trim();
}

/**
 * Strip modifier suffixes: "w/ KTS titanium rods", "w/ oil finish", etc.
 * Keeps only the base material part.
 */
function stripModifiers(s: string): string {
  return s
    .replace(/\s+w\//i, ' w/')  // normalize
    .replace(/\s+w\/.*$/i, '')  // strip " w/ ..."
    .replace(/\s+with\s+.*$/i, '') // strip " with ..."
    .replace(/\s+\(.*\)\s*$/, '') // strip trailing parenthetical
    .replace(/\s+(?:top|body|back|sides?)\s*$/i, '') // strip position suffixes
    .trim();
}

/**
 * Extract all unique material names from a raw material string.
 * Handles year-range variants, piece counts, multi-material combos (e.g., "maple/ walnut").
 * Returns only materials found in the provided whitelist map.
 */
function extractMaterialsFromRaw(
  raw: string,
  map: Record<string, string>,
): string[] {
  const cleaned = cleanText(raw);
  const found = new Set<string>();

  // Split on year-range boundaries (lines like "2016–2018: mahogany2019: nyatoh" run together)
  // We split on patterns that look like a year boundary
  const yearSplitPattern = /(?=[""]?\d{4}[""]?\s*[-–—]?\s*\d{0,4}[""]?\s*:)/g;
  const segments = cleaned.split(yearSplitPattern);

  for (const seg of segments) {
    const noYear = stripYearPrefix(seg);
    if (!noYear) continue;

    // Normalize "w/" (shorthand for "with/") to "/" so both materials are captured,
    // e.g. "Mahogany w/ Maple top" → "Mahogany / Maple top"
    const withNormalized = noYear.replace(/\bw\s*\//gi, '/');

    // Split on slash separators (composite materials like "maple/ walnut")
    const parts = withNormalized.split(/\s*\/\s*/);

    for (const part of parts) {
      const noCount = stripPieceCount(part);
      const noModifier = stripModifiers(noCount);
      const lower = noModifier.toLowerCase().trim();

      if (map[lower]) {
        found.add(map[lower]);
      }
    }
  }

  return [...found].sort();
}

/**
 * Extract body materials from a raw body_material string.
 * Handles strings like "Body type:Solid body Body material:Basswood Neck joint:..."
 * as well as plain strings like "Basswood" or "Mahogany with flamed maple top".
 */
export function extractBodyMaterialList(raw: string | null): string[] {
  if (!raw) return [];

  let text = raw;

  // If the string contains "Body material:" extract just that section
  const bodyMatMatch = raw.match(/Body material:\s*([^:]+?)(?:\s+Neck\b|\s+Bridge\b|\s+Pickguard\b|\s*$)/i);
  if (bodyMatMatch) {
    text = bodyMatMatch[1].trim();
  }

  return extractMaterialsFromRaw(text, BODY_MATERIAL_MAP);
}

/**
 * Extract neck materials from a raw neck_material string.
 * Handles multi-year variants like "2016–2018: 1-piece mahogany2019–2026: 1-piece nyatoh".
 */
export function extractNeckMaterialList(raw: string | null): string[] {
  if (!raw) return [];
  return extractMaterialsFromRaw(raw, NECK_MATERIAL_MAP);
}

/**
 * Extract fretboard materials from a raw fretboard_material string.
 */
export function extractFretboardMaterialList(raw: string | null): string[] {
  if (!raw) return [];

  // Strip binding/edge descriptions: "w/ binding", "w/ ivory binding", "w/ rounded edge"
  const withoutBinding = raw
    .replace(/\s+w\/\s+[a-z\s]+binding/gi, '')
    .replace(/\s+with\s+[a-z\s]+binding/gi, '')
    .replace(/\s+w\/\s+rounded edge/gi, '')
    .replace(/\s+\(bound\)/gi, '')
    .replace(/\s+\(polished\)/gi, '')
    .replace(/\s+\(selected\)/gi, '')
    .replace(/\s*\(Radius[^)]*\)/gi, '');

  return extractMaterialsFromRaw(withoutBinding, FRETBOARD_MATERIAL_MAP);
}

/** Extract pickup configuration string from pickup fields. */
export function derivePickupConfiguration(
  neck: string | null,
  middle: string | null,
  bridge: string | null,
): string | null {
  if (!neck && !middle && !bridge) return null;

  const classify = (p: string | null): string => {
    if (!p) return '';
    const lower = p.toLowerCase();
    if (lower.includes('humbucker') || lower.includes('hb') || /\bh\b/.test(lower)) return 'H';
    if (lower.includes('single') || lower.includes('sc') || /\bs\b/.test(lower)) return 'S';
    if (lower.includes('p90') || lower.includes('p-90')) return 'P90';
    // Default to H for named pickups (e.g., "DiMarzio Fusion Edge")
    return 'H';
  };

  const parts = [classify(neck), classify(middle), classify(bridge)].filter(Boolean);
  return parts.length > 0 ? parts.join('') : null;
}

/** Parse a years-produced string to extract start and end year. */
export function parseYearsProduced(raw: string): { start: number | null; end: number | null } {
  const cleaned = cleanText(raw);

  // Match patterns like "1987-1994", "1987-present", "2007-", "1987"
  const rangeMatch = cleaned.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current)?/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const endStr = rangeMatch[2]?.toLowerCase();
    const end = endStr && !['present', 'current'].includes(endStr)
      ? parseInt(endStr, 10)
      : null;
    return { start, end };
  }

  // Single year
  const singleMatch = cleaned.match(/(\d{4})/);
  if (singleMatch) {
    return { start: parseInt(singleMatch[1], 10), end: parseInt(singleMatch[1], 10) };
  }

  return { start: null, end: null };
}

/** Parse number of frets from a raw string. */
export function parseNumberOfFrets(raw: string): number | null {
  const match = cleanText(raw).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Extract finish list from raw text. */
export function parseFinishes(raw: string): string[] {
  const cleaned = cleanText(raw);
  // Split on common delimiters: commas, semicolons, line breaks
  return cleaned
    .split(/[,;\n]+/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && f.length < 100);
}

/** Try to detect if a bridge has a tremolo/vibrato system. */
export function hasTremolo(bridgeType: string | null): boolean | null {
  if (!bridgeType) return null;
  const lower = bridgeType.toLowerCase();
  const tremoloKeywords = [
    'edge', 'lo-pro', 'lo-trs', 'floyd', 'tremolo', 'vibrato',
    'trs', 'fat-6', 'fat 6', 'az-1',
  ];
  const fixedKeywords = ['fixed', 'hardtail', 'tight-end', 'gibraltar', 'mono-rail'];

  if (tremoloKeywords.some((kw) => lower.includes(kw))) return true;
  if (fixedKeywords.some((kw) => lower.includes(kw))) return false;
  return null;
}

/**
 * Detect the Ibanez series from the model name.
 * Extracts the alphabetic prefix (e.g., "RG" from "RG550").
 */
export function detectSeries(model: string): string | null {
  const match = model.match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Derive number of strings from the Factory tuning string.
 * Returns null if tuning info is not available or unparseable.
 */
export function parseNumberOfStrings(factoryTuning: string | null): number | null {
  if (!factoryTuning) return null;
  // Factory tuning looks like "1E,2B,3G,4D,5A,6E (E Std.)" — count the numbered entries
  const matches = factoryTuning.match(/\d+[A-G#b]+/g);
  if (matches && matches.length >= 4) return matches.length;
  // Fallback: count commas + 1 for simple comma-separated tunings
  const commaCount = (factoryTuning.match(/,/g) ?? []).length;
  if (commaCount >= 3) return commaCount + 1;
  return null;
}

/**
 * Extract pickup configuration groups from a raw pickup configuration string.
 * Recognizes H (humbucker), S (single coil), TC (triple coil), Piezo, Synth.
 *
 * Each distinct configuration becomes one entry in the list.
 * Year-range variants produce separate entries (e.g., "2020: HSH 2021: HH" → ["HH", "HSH"]).
 * Piezo and Synth are extracted as standalone entries separate from the H/S/TC group.
 *
 * Examples:
 *   "HSH"              → ["HSH"]
 *   "H"                → ["H"]
 *   "HH"               → ["HH"]
 *   "HSH + Piezo"      → ["HSH", "Piezo"]
 *   "Triple coil"      → ["TC"]
 *   "2020: HSH 2021: HH" → ["HH", "HSH"]
 */
export function extractPickupConfigurationList(raw: string | null): string[] {
  if (!raw) return [];

  const found = new Set<string>();
  let text = cleanText(raw);

  // Normalize long-form names to uppercase compact tokens
  text = text.replace(/\btriple[- ]?coil\b/gi, 'TC');
  text = text.replace(/\bhumbucker\b/gi, 'H');
  text = text.replace(/\bsingle[- ]coil\b/gi, 'S');
  // "single" alone → S, but not "single string" (string count descriptions)
  text = text.replace(/\bsingle\b(?!\s+string)/gi, 'S');

  // Piezo and Synth are standalone add-on types, not part of the H/S group
  if (/\bpiezo\b/i.test(text)) found.add('Piezo');
  if (/\bsynth\b/i.test(text)) found.add('Synth');
  text = text.replace(/\bpiezo\b/gi, '').replace(/\bsynth\b/gi, '');

  // Split on year-range boundaries (handles "2020: HSH 2021: HH" multi-year entries)
  const yearSplitPattern = /(?=[""]?\d{4}[""]?\s*[-–—]?\s*\d{0,4}[""]?\s*:)/g;
  const segments = text.split(yearSplitPattern);

  for (const seg of segments) {
    // Strip leading year prefix from each segment
    const noYear = seg
      .replace(/^[""]?\d{4}[""]?\s*[-–—]\s*\d{4}[""]?\s*:\s*/g, '')
      .replace(/^[""]?\d{4}[""]?\s*:\s*/g, '')
      .trim();
    if (!noYear) continue;

    // Collect H/S/TC tokens in order and join as a single group string.
    // We scan for uppercase H, S, and TC only — after our replacements above all
    // recognized tokens are uppercase, leaving other text (brand names, adjectives) lowercase.
    const tokens: string[] = [];
    const tokenPattern = /TC|[HS]/g;
    let match: RegExpExecArray | null;
    while ((match = tokenPattern.exec(noYear)) !== null) {
      tokens.push(match[0]);
    }

    if (tokens.length > 0) {
      found.add(tokens.join(''));
    }
  }

  return [...found].sort();
}

/**
 * Extract recognized country names from a raw country_of_origin string.
 * Returns a deduplicated sorted list of normalized country names.
 */
export function extractCountryOfOriginList(raw: string | null): string[] {
  if (!raw) return [];

  const cleaned = cleanText(raw);
  const found = new Set<string>();

  for (const [key, value] of Object.entries(COUNTRY_MAP)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(cleaned)) {
      found.add(value);
    }
  }

  return [...found].sort();
}

/**
 * Extract valid fret counts from a raw number_of_frets string.
 * Only includes isolated numbers in the range 10–40, filtering out years and other noise.
 */
export function extractNumberOfFretsList(raw: string | null): number[] {
  if (!raw) return [];

  const cleaned = cleanText(raw);
  const found = new Set<number>();

  const matches = cleaned.match(/\d+/g) ?? [];
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (n >= 10 && n <= 40) found.add(n);
  }

  return [...found].sort((a, b) => a - b);
}

/**
 * Determine if a guitar model is a bass (used as default string count fallback).
 * Bass series include SR, BTB, GSR, GB, etc.
 */
export function isBassModel(model: string, series: string | null): boolean {
  const bassSeries = ['SR', 'BTB', 'GSR', 'GB', 'GWB', 'ATK', 'SDGR', 'EDB', 'EDC', 'SRX', 'SRT', 'SRF', 'SRC', 'SRH', 'EHB', 'SRMS', 'SRMD', 'SRAS'];
  const s = (series ?? '').toUpperCase();
  if (bassSeries.some((b) => s === b || s.startsWith(b))) return true;
  // Also check model prefix directly
  const modelUpper = model.toUpperCase();
  if (bassSeries.some((b) => modelUpper.startsWith(b))) return true;
  return false;
}
