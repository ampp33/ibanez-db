import type { ProductCategory } from '@ibanez-db/shared';
import type { ScrapedGuitar } from './wiki-scraper'; // type-only — no runtime circular dep
import { cleanText } from './normalizer-maps';
import {
  normalizeBodyMaterial,
  normalizeFretboardMaterial,
  normalizeNeckMaterial,
  normalizeHardwareColor,
  normalizeBridgeType,
  normalizeCountry,
  derivePickupConfiguration,
  parseYearsProduced,
  parseNumberOfFrets,
  parseFinishes,
  hasTremolo,
  deriveBridgeTypeSimple,
  detectSeries,
  extractBodyMaterialList,
  extractNeckMaterialList,
  extractFretboardMaterialList,
  extractPickupConfigurationList,
  extractCountryOfOriginList,
  extractNumberOfFretsList,
  parseNumberOfStrings,
  isBassModel,
} from './field-normalizer';

// ---- Raw attribute key aliases ----
// These are the original (wiki-sourced) key names as stored in rawAttributes.
// Exported so backfill scripts can reuse them without hard-coding.

export const RAW_KEYS_FACTORY_TUNING = ['Factory tuning', 'Strings (factory)', 'String gauge (factory)'] as const;

/** Map raw wiki attribute names to our structured guitar fields. */
export function mapRawToGuitar(
  raw: Record<string, string>,
  title: string,
  url: string,
  imageUrls: string[],
  descriptionHtml: string | null,
  productCategory: ProductCategory,
): ScrapedGuitar {
  // Build a case-insensitive lookup
  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(raw)) {
    lookup.set(key.toLowerCase().trim(), value);
  }

  const get = (...keys: string[]): string | null => {
    for (const k of keys) {
      const val = lookup.get(k.toLowerCase());
      if (val) return cleanText(val);
    }
    return null;
  };

  const model = title.replace(/_/g, ' ').trim();
  const neckPickup = get('neck pickup', 'neck pu', 'neck pick-up');
  const middlePickup = get('middle pickup', 'mid pickup', 'middle pu', 'mid pu');
  const bridgePickup = get('bridge pickup', 'bridge pu', 'bridge pick-up');
  const rawBridge = get('bridge', 'bridge type', 'tremolo');
  const rawYears = get('years', 'years produced', 'year(s) offered', 'production', 'year');
  const years = rawYears ? parseYearsProduced(rawYears) : { start: null, end: null };
  const rawFrets = get('frets', 'number of frets', 'no. of frets');
  const rawFinishes = get('finish', 'finishes', 'color', 'colors', 'colour', 'colours');
  const rawBody = get('body', 'body material', 'body wood');
  const rawNeck = get('neck material', 'neck wood', 'neck');
  const rawFretboard = get('fretboard', 'fretboard material', 'fingerboard', 'fingerboard material');
  const rawHardware = get('hardware', 'hardware color', 'hardware colour', 'hardware finish');
  const rawCountry = get('country', 'country of origin', 'made in', 'origin', 'manufacturing');
  const rawFactoryTuning = get('factory tuning', 'strings (factory)', 'string gauge (factory)');
  const series = get('series') ?? detectSeries(model);

  // Derive number of strings from factory tuning; fall back to series-based default
  let numberOfStrings = parseNumberOfStrings(rawFactoryTuning);
  if (numberOfStrings === null) {
    numberOfStrings = isBassModel(model, series) ? 4 : 6;
  }

  return {
    model,
    name: model,
    productCategory,
    series,
    bodyType: get('body type', 'body shape', 'body style'),
    bodyMaterial: rawBody ? normalizeBodyMaterial(rawBody) : null,
    bodyMaterialList: extractBodyMaterialList(rawBody),
    neckType: get('neck type', 'neck joint', 'neck shape', 'neck profile'),
    neckMaterial: rawNeck ? normalizeNeckMaterial(rawNeck) : null,
    neckMaterialList: extractNeckMaterialList(rawNeck),
    fretboardMaterial: rawFretboard ? normalizeFretboardMaterial(rawFretboard) : null,
    fretboardMaterialList: extractFretboardMaterialList(rawFretboard),
    fretboardRadius: get('fretboard radius', 'radius', 'fingerboard radius'),
    numberOfFrets: rawFrets ? parseNumberOfFrets(rawFrets) : null,
    numberOfFretsList: extractNumberOfFretsList(rawFrets),
    numberOfStrings,
    scaleLength: get('scale length', 'scale'),
    pickupConfiguration: get('pickup configuration', 'pickup config', 'electronics')
      ?? derivePickupConfiguration(neckPickup, middlePickup, bridgePickup),
    pickupConfigurationList: extractPickupConfigurationList(
      get('pickup configuration', 'pickup config', 'electronics')
        ?? derivePickupConfiguration(neckPickup, middlePickup, bridgePickup),
    ),
    neckPickup,
    middlePickup,
    bridgePickup,
    bridgeType: rawBridge ? normalizeBridgeType(rawBridge) : null,
    bridgeTypeSimple: deriveBridgeTypeSimple(rawBridge ? normalizeBridgeType(rawBridge) : null),
    tremolo: rawBridge ? hasTremolo(rawBridge) : null,
    hardwareColor: rawHardware ? normalizeHardwareColor(rawHardware) : null,
    finishes: rawFinishes ? parseFinishes(rawFinishes) : [],
    countryOfOrigin: rawCountry ? normalizeCountry(rawCountry) : null,
    countryOfOriginList: extractCountryOfOriginList(rawCountry),
    yearsProduced: rawYears ?? null,
    productionStart: years.start,
    productionEnd: years.end,
    msrp: get('msrp', 'price', 'list price', 'retail price'),
    descriptionHtml,
    wikiUrl: url,
    rawAttributes: Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, cleanText(v)]),
    ),
    imageUrls,
  };
}
