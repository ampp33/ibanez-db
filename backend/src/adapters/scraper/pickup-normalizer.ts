import { cleanText, yearSplitPattern } from './normalizer-maps';
import { stripYearPrefix } from './material-extractor';

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
  const segments = text.split(yearSplitPattern);

  for (const seg of segments) {
    const noYear = stripYearPrefix(seg);
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
