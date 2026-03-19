import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { logger } from '../../config/logger';
import type { ProductCategory } from '@ibanez-db/shared';
import type { ScrapedGuitar } from './wiki-scraper'; // type-only — no runtime circular dep
import { fetchPageHtml } from './wiki-http-client';
import { mapRawToGuitar } from './guitar-mapper';

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
export function sanitizeNode($: cheerio.CheerioAPI, node: AnyNode): string {
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
export function sanitizeDescriptionParagraph(
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
export function cleanImageUrl(url: string): string {
  // Fandom CDN URLs often have /revision/latest/scale-to-width-down/NNN
  // or /revision/latest?cb=TIMESTAMP appended. Keep the base image URL.
  return url
    .replace(/\/revision\/latest\/scale-to-width-down\/\d+/, '/revision/latest')
    .replace(/\/revision\/latest\/scale-to-width\/\d+/, '/revision/latest')
    .replace(/\/revision\/latest\/smart\/width\/\d+\/height\/\d+/, '/revision/latest');
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
