import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import type { ProductCategory } from '@ibanez-db/shared';
import {
  cleanText,
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

const WIKI_BASE = 'https://ibanez.fandom.com';
const WIKI_API = `${WIKI_BASE}/api.php`;
const GUITAR_CATEGORY_URL = `${WIKI_BASE}/wiki/Category:Guitar_models`;
const BASS_CATEGORY_URL = `${WIKI_BASE}/wiki/Category:Bass_models`;
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

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

/** Delay helper to avoid hammering the wiki. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch parsed HTML for a wiki page via the MediaWiki API. */
async function fetchPageHtml(pageTitle: string): Promise<string> {
  const params = new URLSearchParams({
    action: 'parse',
    page: pageTitle,
    prop: 'text',
    format: 'json',
  });
  const response = await fetch(`${WIKI_API}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching page "${pageTitle}"`);
  }
  const data = await response.json() as {
    parse?: { text?: { '*': string } };
    error?: { info: string };
  };
  if (data.error) {
    throw new Error(`MediaWiki API error: ${data.error.info}`);
  }
  return data.parse?.text?.['*'] ?? '';
}

/** Fetch HTML from a URL with basic error handling (used for category pages). */
async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

/**
 * Get all model page URLs from a category page.
 * Uses pagination (category pages may have "next page" links).
 */
async function fetchModelUrlsFromCategory(
  categoryUrl: string,
  cmtitle: string,
  productCategory: ProductCategory,
): Promise<Array<{ title: string; url: string; productCategory: ProductCategory }>> {
  const models: Array<{ title: string; url: string; productCategory: ProductCategory }> = [];

  // First try MediaWiki API for a more reliable listing
  try {
    const apiModels = await fetchModelUrlsViaApi(cmtitle);
    if (apiModels.length > 0) {
      logger.info(`Fetched ${apiModels.length} models from ${cmtitle} via MediaWiki API`);
      return apiModels.map((m) => ({ ...m, productCategory }));
    }
  } catch (err) {
    logger.warn({ err }, 'MediaWiki API fallback failed, using HTML scraping');
  }

  // Fallback: scrape category HTML pages
  let nextUrl: string | null = categoryUrl;

  while (nextUrl) {
    logger.debug(`Scraping category page: ${nextUrl}`);
    const html = await fetchHtml(nextUrl);
    const $ = cheerio.load(html);

    // Model links are in the category members list
    $('.category-page__member-link').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (href && title) {
        models.push({
          title,
          url: href.startsWith('http') ? href : `${WIKI_BASE}${href}`,
          productCategory,
        });
      }
    });

    // Also check the mw-category style (older wiki format)
    $('#mw-pages .mw-category-group a').each((_, el) => {
      const href = $(el).attr('href');
      const title = $(el).text().trim();
      if (href && title) {
        models.push({
          title,
          url: href.startsWith('http') ? href : `${WIKI_BASE}${href}`,
          productCategory,
        });
      }
    });

    // Find "next page" link
    const nextLink = $('a.category-page__pagination-next').attr('href')
      ?? $('a:contains("next page")').attr('href');

    nextUrl = nextLink
      ? (nextLink.startsWith('http') ? nextLink : `${WIKI_BASE}${nextLink}`)
      : null;

    if (nextUrl) {
      await delay(env.scraper.delayMs);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = models.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  logger.info(`Found ${unique.length} models from ${cmtitle} via HTML scraping`);
  return unique;
}

/** Fetch model URLs using the MediaWiki API. */
async function fetchModelUrlsViaApi(cmtitle: string): Promise<Array<{ title: string; url: string }>> {
  const models: Array<{ title: string; url: string }> = [];
  let cmcontinue: string | undefined;

  do {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle,
      cmlimit: '500',
      cmtype: 'page',
      format: 'json',
    });
    if (cmcontinue) params.set('cmcontinue', cmcontinue);

    const response = await fetch(`${WIKI_API}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json() as {
      query?: { categorymembers?: Array<{ title: string; pageid: number }> };
      continue?: { cmcontinue: string };
    };

    for (const member of data.query?.categorymembers ?? []) {
      models.push({
        title: member.title,
        url: `${WIKI_BASE}/wiki/${encodeURIComponent(member.title.replace(/ /g, '_'))}`,
      });
    }

    cmcontinue = data.continue?.cmcontinue;
  } while (cmcontinue);

  return models;
}

/** Get all guitar model page URLs from the Category:Guitar_models category. */
export async function fetchGuitarModelUrls(): Promise<Array<{ title: string; url: string; productCategory: ProductCategory }>> {
  return fetchModelUrlsFromCategory(GUITAR_CATEGORY_URL, 'Category:Guitar_models', 'guitar');
}

/** Get all bass model page URLs from the Category:Bass_models category. */
export async function fetchBassModelUrls(): Promise<Array<{ title: string; url: string; productCategory: ProductCategory }>> {
  return fetchModelUrlsFromCategory(BASS_CATEGORY_URL, 'Category:Bass_models', 'bass');
}

/**
 * Scrape a single guitar page and extract structured data.
 */
export async function scrapeGuitarPage(
  url: string,
  title: string,
  productCategory: ProductCategory,
): Promise<ScrapedGuitar | null> {
  try {
    const html = await fetchPageHtml(title);
    const $ = cheerio.load(html);

    // Extract raw key-value pairs from the specs table.
    // The MediaWiki parse API returns specs as table cells with "<b>Label:</b> value" format.
    const rawAttributes: Record<string, string> = {};

    // Primary: Ibanez wiki "purplebox" specs — each <td> contains "<b>Key:</b> Value"
    $('.purplebox td').each((_, el) => {
      const bold = $(el).find('b').first();
      if (!bold.length) return;
      const key = bold.text().trim().replace(/:$/, '');
      // Get the text content after the bold label
      bold.remove();
      const value = $(el).text().trim();
      if (key && value) {
        rawAttributes[key] = value;
      }
    });

    // Fallback: portable infobox (some pages may use this)
    if (Object.keys(rawAttributes).length === 0) {
      $('.pi-item.pi-data').each((_, el) => {
        const key = $(el).find('.pi-data-label').text().trim();
        const value = $(el).find('.pi-data-value').text().trim();
        if (key && value) {
          rawAttributes[key] = value;
        }
      });
    }

    // Fallback: standard wiki table with class "infobox" or "wikitable"
    if (Object.keys(rawAttributes).length === 0) {
      $('table.infobox tr, table.wikitable tr').each((_, row) => {
        const cells = $(row).find('th, td');
        if (cells.length >= 2) {
          const key = $(cells[0]).text().trim();
          const value = $(cells[1]).text().trim();
          if (key && value) {
            rawAttributes[key] = value;
          }
        }
      });
    }

    // Extract image URLs from the page.
    // The parse API puts the real URL in src (data-src is only used by
    // client-side lazy-loading on the live site, not in API output).
    // Filter to data-relevant="1" to skip icons/sprites, then also
    // exclude tiny images (e.g. 30×30 icons that still have data-relevant="1").
    const imageUrls: string[] = [];
    $('img[data-relevant="1"]').each((_, img) => {
      const width = parseInt($(img).attr('width') ?? '0', 10);
      const height = parseInt($(img).attr('height') ?? '0', 10);
      if (width > 0 && width < 50 && height > 0 && height < 50) return;
      const src = $(img).attr('data-src') ?? $(img).attr('src');
      if (!src) return;
      const cleaned = cleanImageUrl(src);
      if (!imageUrls.includes(cleaned)) {
        imageUrls.push(cleaned);
      }
    });

    // Extract description paragraphs (content before the Specifications heading).
    // cheerio wraps content in <html><body>, so we need to find the actual
    // mw-parser-output container rather than using $.root().children().first().
    const descriptionParts: string[] = [];
    const contentRoot = $('.mw-parser-output').first();
    const root = contentRoot.length > 0 ? contentRoot : $('body');
    root.children().each((_, el) => {
      const tag = $(el).prop('tagName')?.toLowerCase();
      if (tag === 'h2') return false; // stop at Specifications heading
      if (tag === 'p') {
        const sanitized = sanitizeDescriptionParagraph($, $(el));
        if (sanitized) descriptionParts.push(`<p>${sanitized}</p>`);
      }
    });
    const descriptionHtml = descriptionParts.length > 0 ? descriptionParts.join('\n') : null;

    // Map raw attributes to structured fields
    const guitar = mapRawToGuitar(rawAttributes, title, url, imageUrls, descriptionHtml, productCategory);
    return guitar;
  } catch (err) {
    logger.error({ err }, `Failed to scrape ${url}`);
    return null;
  }
}

/** Escape special characters for safe inclusion in HTML text content. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape special characters for safe inclusion in an HTML attribute value. */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Recursively sanitize a DOM node, keeping only:
 * - text content
 * - <b>/<strong> → <b>
 * - <i>/<em> → <i>
 * - <a href="/wiki/..."> → <a data-guitar-link="Page_Title"> (placeholder for
 *   internal links that may point to other guitars in the DB)
 * All other elements are replaced with their text content.
 */
function sanitizeNode($: cheerio.CheerioAPI, node: AnyNode): string {
  if (node.type === 'text') {
    return escapeHtml((node as { data?: string }).data ?? '');
  }
  if (node.type !== 'tag') return '';

  const el = node as Element;
  const tag = el.tagName?.toLowerCase();
  const children = (el.children ?? [])
    .map((child: AnyNode) => sanitizeNode($, child))
    .join('');

  if (tag === 'b' || tag === 'strong') return `<b>${children}</b>`;
  if (tag === 'i' || tag === 'em') return `<i>${children}</i>`;
  if (tag === 'a') {
    const href = $(el).attr('href') ?? '';
    if (href.startsWith('/wiki/')) {
      // Store the wiki path as a placeholder; the backend resolves these
      // against the DB at API response time to create local guitar links.
      return `<a data-wiki-link="${escapeAttr(href)}">${children}</a>`;
    }
    // Non-wiki link: keep only the text content
    return children;
  }
  // Any other tag: just return children (strips the tag itself)
  return children;
}

/**
 * Sanitize a description <p> element to safe HTML.
 * Returns the inner HTML string, or null if empty.
 */
function sanitizeDescriptionParagraph(
  $: cheerio.CheerioAPI,
  el: cheerio.Cheerio<Element>,
): string | null {
  const inner = (el.contents().toArray())
    .map((child) => sanitizeNode($, child))
    .join('')
    .trim();
  return inner || null;
}

/** Strip Fandom thumbnail transforms from image URLs to get full-size. */
function cleanImageUrl(url: string): string {
  // Fandom CDN URLs often have /revision/latest/scale-to-width-down/NNN
  // or /revision/latest?cb=TIMESTAMP appended. Keep the base image URL.
  return url
    .replace(/\/revision\/latest\/scale-to-width-down\/\d+/, '/revision/latest')
    .replace(/\/revision\/latest\/scale-to-width\/\d+/, '/revision/latest')
    .replace(/\/revision\/latest\/smart\/width\/\d+\/height\/\d+/, '/revision/latest');
}

/** Map raw wiki attribute names to our structured guitar fields. */
function mapRawToGuitar(
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

/**
 * Run the full scrape: fetch model list from guitar and bass categories,
 * scrape each page with concurrency control.
 */
export async function scrapeAllGuitars(
  onProgress?: (current: number, total: number) => void,
): Promise<ScrapedGuitar[]> {
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
