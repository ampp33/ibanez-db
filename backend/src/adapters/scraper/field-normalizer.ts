/**
 * Normalizes scraped field values into consistent representations.
 * Handles common inconsistencies found in wiki-sourced guitar data.
 *
 * This file is a barrel — implementation lives in the focused sub-modules.
 */

// ---- Re-exports from sub-modules ----

export {
  cleanText,
  BODY_MATERIAL_MAP,
  FRETBOARD_MATERIAL_MAP,
  NECK_MATERIAL_MAP,
  HARDWARE_COLOR_MAP,
  BRIDGE_TYPE_MAP,
  COUNTRY_MAP,
  yearSplitPattern,
  normalizeWith,
} from './normalizer-maps';

export {
  stripYearPrefix,
  extractMaterialsFromRaw,
  extractBodyMaterialList,
  extractNeckMaterialList,
  extractFretboardMaterialList,
} from './material-extractor';

export {
  derivePickupConfiguration,
  extractPickupConfigurationList,
} from './pickup-normalizer';

// ---- Functions that remain here ----

import {
  cleanText,
  BODY_MATERIAL_MAP,
  FRETBOARD_MATERIAL_MAP,
  NECK_MATERIAL_MAP,
  HARDWARE_COLOR_MAP,
  BRIDGE_TYPE_MAP,
  COUNTRY_MAP,
  normalizeWith,
} from './normalizer-maps';

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
  // When checking prefix matches, require that the remainder is empty or starts with a digit
  // to avoid false positives like SRG (guitar) matching the SR (bass) prefix
  const matchesBass = (s: string, b: string) => s === b || (s.startsWith(b) && /^\d/.test(s.slice(b.length)));
  const s = (series ?? '').toUpperCase();
  if (bassSeries.some((b) => matchesBass(s, b))) return true;
  // Also check model prefix directly
  const modelUpper = model.toUpperCase();
  if (bassSeries.some((b) => matchesBass(modelUpper, b))) return true;
  return false;
}
