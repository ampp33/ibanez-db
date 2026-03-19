import {
  cleanText,
  BODY_MATERIAL_MAP,
  NECK_MATERIAL_MAP,
  FRETBOARD_MATERIAL_MAP,
  yearSplitPattern,
} from './normalizer-maps';

/**
 * Strip year-range prefixes like "2016–2018:", "1987-1994:", "\"1978-1980\":" from segments.
 * Also strips quoted year ranges.
 */
export function stripYearPrefix(s: string): string {
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
export function extractMaterialsFromRaw(
  raw: string,
  map: Record<string, string>,
): string[] {
  const cleaned = cleanText(raw);
  const found = new Set<string>();

  // Split on year-range boundaries (lines like "2016–2018: mahogany2019: nyatoh" run together)
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
