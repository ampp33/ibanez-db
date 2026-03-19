import { EntityManager } from '@mikro-orm/postgresql';
import { v4 as uuidv4 } from 'uuid';
import { Guitar } from '../domain/entities/Guitar';
import { GuitarImage } from '../domain/entities/GuitarImage';
import type { StorageAdapter } from '../adapters/storage/storage.interface';

export class ImageService {
  constructor(
    private readonly em: EntityManager,
    private readonly storage: StorageAdapter,
  ) {}

  /**
   * Sync images for a guitar: detect adds, removes, and changes.
   */
  async syncImages(
    guitar: Guitar,
    imageEntries: Array<{
      data: Buffer;
      originalName: string;
      mimeType: string;
      isPrimary: boolean;
    }>,
  ): Promise<void> {
    await this.em.populate(guitar, ['images']);
    const existingImages = guitar.images.getItems();

    const existingByName = new Map(existingImages.map((img) => [img.originalName, img]));
    const processedNames = new Set<string>();

    for (const entry of imageEntries) {
      processedNames.add(entry.originalName);
      const existing = existingByName.get(entry.originalName);

      if (existing && existing.sizeBytes === entry.data.length) {
        if (existing.isPrimary !== entry.isPrimary) {
          existing.isPrimary = entry.isPrimary;
        }
        continue;
      }

      if (existing) {
        await this.storage.delete(existing.storageKey);
        this.em.remove(existing);
      }

      const ext = this.getExtension(entry.originalName, entry.mimeType);
      const guitarSlug = this.slugify(guitar.model);
      const key = `${guitarSlug}/${uuidv4()}.${ext}`;

      await this.storage.upload(key, entry.data, entry.mimeType);

      const image = new GuitarImage();
      image.guitar = guitar;
      image.storageKey = key;
      image.originalName = entry.originalName;
      image.sizeBytes = entry.data.length;
      image.mimeType = entry.mimeType;
      image.isPrimary = entry.isPrimary;
      this.em.persist(image);
    }

    for (const existing of existingImages) {
      if (!processedNames.has(existing.originalName)) {
        await this.storage.delete(existing.storageKey);
        this.em.remove(existing);
      }
    }

    await this.em.flush();
  }

  /**
   * Get a set of existing image original names and sizes for a guitar model.
   * Used to skip unnecessary image downloads during scraping.
   */
  async getExistingImageMap(model: string): Promise<Map<string, number>> {
    const guitar = await this.em.findOne(Guitar, { model }, { populate: ['images'] });
    if (!guitar) return new Map();
    return new Map(guitar.images.getItems().map((img) => [img.originalName, img.sizeBytes]));
  }

  // ---- Private helpers ----

  private slugify(text: string): string {
    return text
      .replace(/\u2160/g, 'I')
      .replace(/\u2161/g, 'II')
      .replace(/\u2162/g, 'III')
      .replace(/\u2163/g, 'IV')
      .replace(/\u2164/g, 'V')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getExtension(filename: string, mimeType: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return ext;
    }
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    return mimeMap[mimeType] ?? 'jpg';
  }
}
