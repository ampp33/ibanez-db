import * as cheerio from 'cheerio';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import type { ProductCategory } from '@ibanez-db/shared';

export const WIKI_BASE = 'https://ibanez.fandom.com';
export const WIKI_API = `${WIKI_BASE}/api.php`;
const GUITAR_CATEGORY_URL = `${WIKI_BASE}/wiki/Category:Guitar_models`;
const BASS_CATEGORY_URL = `${WIKI_BASE}/wiki/Category:Bass_models`;
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Delay helper to avoid hammering the wiki. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch parsed HTML for a wiki page via the MediaWiki API. */
export async function fetchPageHtml(pageTitle: string): Promise<string> {
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
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

/** Fetch model URLs using the MediaWiki API. */
export async function fetchModelUrlsViaApi(cmtitle: string): Promise<Array<{ title: string; url: string }>> {
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

/** Get all guitar model page URLs from the Category:Guitar_models category. */
export async function fetchGuitarModelUrls(): Promise<Array<{ title: string; url: string; productCategory: ProductCategory }>> {
  return fetchModelUrlsFromCategory(GUITAR_CATEGORY_URL, 'Category:Guitar_models', 'guitar');
}

/** Get all bass model page URLs from the Category:Bass_models category. */
export async function fetchBassModelUrls(): Promise<Array<{ title: string; url: string; productCategory: ProductCategory }>> {
  return fetchModelUrlsFromCategory(BASS_CATEGORY_URL, 'Category:Bass_models', 'bass');
}
