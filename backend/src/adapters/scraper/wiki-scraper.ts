import { logger } from '../../config/logger';
import { env } from '../../config/env';
import type { ProductCategory } from '@ibanez-db/shared';
import { fetchGuitarModelUrls, fetchBassModelUrls, delay } from './wiki-http-client';
import { scrapeGuitarPage } from './guitar-page-parser';

// ---- Re-exports ----
export { scrapeGuitarPage } from './guitar-page-parser';
export { fetchGuitarModelUrls, fetchBassModelUrls, WIKI_BASE } from './wiki-http-client';
export { RAW_KEYS_FACTORY_TUNING } from './guitar-mapper';

/** Data extracted from a single guitar wiki page. */
export interface ScrapedGuitar {
  model: string;
  name: string;
  productCategory: ProductCategory;
  series: string | null;
  bodyType: string | null;
  bodyMaterial: string | null;
  bodyMaterialList: string[];
  neckType: string | null;
  neckMaterial: string | null;
  neckMaterialList: string[];
  fretboardMaterial: string | null;
  fretboardMaterialList: string[];
  fretboardRadius: string | null;
  numberOfFrets: number | null;
  numberOfFretsList: number[];
  numberOfStrings: number | null;
  scaleLength: string | null;
  pickupConfiguration: string | null;
  pickupConfigurationList: string[];
  neckPickup: string | null;
  middlePickup: string | null;
  bridgePickup: string | null;
  bridgeType: string | null;
  bridgeTypeSimple: 'tremolo' | 'fixed' | null;
  tremolo: boolean | null;
  hardwareColor: string | null;
  finishes: string[];
  countryOfOrigin: string | null;
  countryOfOriginList: string[];
  yearsProduced: string | null;
  productionStart: number | null;
  productionEnd: number | null;
  msrp: string | null;
  descriptionHtml: string | null;
  wikiUrl: string;
  rawAttributes: Record<string, string>;
  imageUrls: string[];
}

/**
 * Run the full scrape: fetch model list from guitar and bass categories,
 * scrape each page with concurrency control.
 */
export async function scrapeAllGuitars(
  onProgress?: (current: number, total: number) => void,
): Promise<ScrapedGuitar[]> {
  const { fetchGuitarModelUrls, fetchBassModelUrls, delay } = await import('./wiki-http-client');
  const { scrapeGuitarPage } = await import('./guitar-page-parser');

  const [guitarUrls, bassUrls] = await Promise.all([
    fetchGuitarModelUrls(),
    fetchBassModelUrls(),
  ]);

  // Merge and deduplicate by URL
  const seen = new Set<string>();
  const modelUrls = [...guitarUrls, ...bassUrls].filter(({ url }) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  const results: ScrapedGuitar[] = [];
  const concurrency = env.scraper.concurrency;

  logger.info(`Starting scrape of ${modelUrls.length} models (${guitarUrls.length} guitars, ${bassUrls.length} basses, concurrency: ${concurrency})`);

  // Process in batches to respect concurrency limits
  for (let i = 0; i < modelUrls.length; i += concurrency) {
    const batch = modelUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(({ url, title, productCategory }) => scrapeGuitarPage(url, title, productCategory)),
    );

    for (const result of batchResults) {
      if (result) results.push(result);
    }

    onProgress?.(Math.min(i + concurrency, modelUrls.length), modelUrls.length);

    // Delay between batches
    if (i + concurrency < modelUrls.length) {
      await delay(env.scraper.delayMs);
    }
  }

  logger.info(`Scrape complete: ${results.length}/${modelUrls.length} models extracted`);
  return results;
}
