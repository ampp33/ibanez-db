/**
 * Nightly scrape job: fetches guitar data from ibanez.fandom.com,
 * normalizes fields, upserts into Postgres, and syncs images to MinIO.
 */
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../mikro-orm.config';
import { scrapeAllGuitars, type ScrapedGuitar } from '../adapters/scraper/wiki-scraper';
import { MinioStorageAdapter } from '../adapters/storage/minio.adapter';
import { GuitarService } from '../services/guitar.service';
import { logger } from '../config/logger';
import { env } from '../config/env';

/** Download an image from a URL and return the buffer with metadata. */
async function downloadImage(
  url: string,
): Promise<{ data: Buffer; mimeType: string; originalName: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    // Extract original filename from URL (Fandom CDN paths end in /revision/latest/…)
    const parts = new URL(url).pathname.split('/');
    const namePart = parts.find((p) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p));
    const originalName = decodeURIComponent(namePart ?? parts.pop() ?? 'image.jpg');

    return { data, mimeType: contentType, originalName };
  } catch (err) {
    logger.warn({ err }, `Failed to download image: ${url}`);
    return null;
  }
}

/** Extract the original filename from a wiki image URL.
 * Fandom CDN URLs have the form: /wiki/images/.../Filename.png/revision/latest[/...]
 * so we look for the path segment that has a known image extension rather than
 * blindly taking the last segment (which would be "latest").
 */
function extractImageName(url: string): string {
  const parts = new URL(url).pathname.split('/');
  const namePart = parts.find((p) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p));
  return decodeURIComponent(namePart ?? parts.pop() ?? 'image.jpg');
}

/** Process a single scraped guitar: upsert DB record and sync images. */
async function processGuitar(
  service: GuitarService,
  scraped: ScrapedGuitar,
): Promise<void> {
  // Upsert the guitar record
  const guitar = await service.upsertGuitar({
    model: scraped.model,
    name: scraped.name,
    productCategory: scraped.productCategory,
    series: scraped.series,
    bodyType: scraped.bodyType,
    bodyMaterial: scraped.bodyMaterial,
    bodyMaterialList: scraped.bodyMaterialList,
    neckType: scraped.neckType,
    neckMaterial: scraped.neckMaterial,
    neckMaterialList: scraped.neckMaterialList,
    fretboardMaterial: scraped.fretboardMaterial,
    fretboardMaterialList: scraped.fretboardMaterialList,
    fretboardRadius: scraped.fretboardRadius,
    numberOfFrets: scraped.numberOfFrets,
    numberOfFretsList: scraped.numberOfFretsList,
    numberOfStrings: scraped.numberOfStrings,
    scaleLength: scraped.scaleLength,
    pickupConfiguration: scraped.pickupConfiguration,
    pickupConfigurationList: scraped.pickupConfigurationList,
    neckPickup: scraped.neckPickup,
    middlePickup: scraped.middlePickup,
    bridgePickup: scraped.bridgePickup,
    bridgeType: scraped.bridgeType,
    tremolo: scraped.tremolo,
    hardwareColor: scraped.hardwareColor,
    finishes: scraped.finishes,
    countryOfOrigin: scraped.countryOfOrigin,
    countryOfOriginList: scraped.countryOfOriginList,
    yearsProduced: scraped.yearsProduced,
    productionStart: scraped.productionStart,
    productionEnd: scraped.productionEnd,
    msrp: scraped.msrp,
    descriptionHtml: scraped.descriptionHtml,
    wikiUrl: scraped.wikiUrl,
    rawAttributes: scraped.rawAttributes,
  });

  // Download and sync images, skipping ones already stored
  if (env.scraper.scrapeImages && scraped.imageUrls.length > 0) {
    const existingImages = await service.getExistingImageMap(scraped.model);
    const imageEntries = [];

    for (let i = 0; i < scraped.imageUrls.length; i++) {
      const name = extractImageName(scraped.imageUrls[i]);
      if (existingImages.has(name)) {
        continue; // Already have this image, skip download
      }

      const downloaded = await downloadImage(scraped.imageUrls[i]);
      if (downloaded) {
        imageEntries.push({
          ...downloaded,
          isPrimary: i === 0,
        });
      }
    }

    if (imageEntries.length > 0) {
      await service.syncImages(guitar, imageEntries);
    }
  }
}

/** Main scrape execution. Can be run as a standalone script or called from the cron scheduler. */
export async function runScrape(): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting guitar scrape job...');

  const orm = await MikroORM.init(ormConfig);
  const storage = new MinioStorageAdapter();

  try {
    await storage.ensureBucket();

    const em = orm.em.fork();
    const service = new GuitarService(em, storage);

    const guitars = await scrapeAllGuitars((current, total) => {
      logger.info(`Scrape progress: ${current}/${total}`);
    });

    logger.info(`Processing ${guitars.length} scraped guitars...`);

    let processed = 0;
    let errors = 0;

    for (const scraped of guitars) {
      try {
        // Fork a new EM for each guitar to keep transactions isolated
        const forkEm = orm.em.fork();
        const forkService = new GuitarService(forkEm, storage);
        await processGuitar(forkService, scraped);
        processed++;

        if (processed % 50 === 0) {
          logger.info(`Processed ${processed}/${guitars.length} guitars`);
        }
      } catch (err) {
        errors++;
        logger.error({ err }, `Error processing guitar "${scraped.model}"`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info(
      `Scrape job complete: ${processed} processed, ${errors} errors, ${elapsed}s elapsed`,
    );
  } finally {
    await orm.close();
  }
}

// Allow running directly as a script
if (require.main === module) {
  runScrape()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Scrape job failed');
      process.exit(1);
    });
}
