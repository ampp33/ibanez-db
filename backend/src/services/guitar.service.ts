import { EntityManager } from '@mikro-orm/postgresql';
import { Guitar } from '../domain/entities/Guitar';
import type { StorageAdapter } from '../adapters/storage/storage.interface';
import type {
  GuitarDetailDto,
  GuitarFilterParams,
  GuitarListResponse,
} from '@ibanez-db/shared';
import { GuitarRepository } from '../domain/repositories/guitar.repository';
import { GuitarDtoMapper } from '../adapters/dto/guitar-dto-mapper';
import { ImageService } from './image.service';
import { WIKI_BASE } from '../adapters/scraper/wiki-http-client';

export class GuitarService {
  private readonly repo: GuitarRepository;
  private readonly mapper: GuitarDtoMapper;
  private readonly imageService: ImageService;

  constructor(em: EntityManager, storage: StorageAdapter) {
    this.repo = new GuitarRepository(em);
    this.mapper = new GuitarDtoMapper(storage);
    this.imageService = new ImageService(em, storage);
    // em is accessed via repo; store only for upsertGuitar which uses it directly
    this.em = em;
  }

  private readonly em: EntityManager;

  /**
   * List guitars with faceted filtering, pagination, and sorting.
   */
  async listGuitars(params: GuitarFilterParams): Promise<GuitarListResponse> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 24, 100);
    const offset = (page - 1) * limit;

    const sortBy = params.sortBy ?? 'model';
    const sortOrder = params.sortOrder ?? 'asc';
    const orderBy: Record<string, 'asc' | 'desc'> = { [sortBy]: sortOrder };

    try {
      const where = await this.repo.buildWhereClause(params);
      const { guitars, total } = await this.repo.findPaginated(where, limit, offset, orderBy);
      const facets = await this.repo.computeFacets(where);

      return {
        data: guitars.map((g) => this.mapper.toDto(g)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        facets,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  /**
   * Get a single guitar by ID or slug with all images and details.
   */
  async getGuitarById(idOrSlug: string): Promise<GuitarDetailDto | null> {
    const guitar = await this.repo.findByIdOrSlug(idOrSlug);
    if (!guitar) return null;
    const resolvedDesc = await this.resolveDescriptionLinks(guitar.descriptionHtml);
    return this.mapper.toDetailDto(guitar, resolvedDesc);
  }

  /**
   * Create or update a guitar record (used by scraper and admin endpoint).
   */
  async upsertGuitar(data: Partial<Guitar> & { model: string }): Promise<Guitar> {
    let guitar = await this.repo.findByModel(data.model);

    const slug = this.slugify(data.model);

    if (guitar) {
      this.em.assign(guitar, { ...data, slug, updatedAt: new Date() });
    } else {
      guitar = new Guitar();
      Object.assign(guitar, { ...data, slug });
      this.em.persist(guitar);
    }

    await this.em.flush();
    return guitar;
  }

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
    return this.imageService.syncImages(guitar, imageEntries);
  }

  /**
   * Get a set of existing image original names and sizes for a guitar model.
   */
  async getExistingImageMap(model: string): Promise<Map<string, number>> {
    return this.imageService.getExistingImageMap(model);
  }

  // ---- Private helpers ----

  /**
   * Resolve data-wiki-link placeholders in description HTML to local guitar links.
   * Links whose wiki path matches a guitar's wikiUrl become /guitars/{slug} links;
   * unmatched links are stripped to plain text.
   */
  private async resolveDescriptionLinks(html: string | null): Promise<string | null> {
    if (!html) return null;

    const linkRegex = /<a\s+data-wiki-link="([^"]*)">(.*?)<\/a>/g;
    const wikiPaths = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      wikiPaths.add(match[1]);
    }

    if (wikiPaths.size === 0) return html;

    const fullUrls = [...wikiPaths].map((path) => `${WIKI_BASE}${path}`);
    const guitars = await this.repo.findByWikiUrls(fullUrls);

    const urlToSlug = new Map<string, string>();
    for (const g of guitars) {
      if (g.wikiUrl) urlToSlug.set(g.wikiUrl as string, g.slug as string);
    }

    return html.replace(linkRegex, (_match, wikiPath: string, linkText: string) => {
      const fullUrl = `${WIKI_BASE}${wikiPath}`;
      const slug = urlToSlug.get(fullUrl);
      if (slug) {
        return `<a href="/guitars/${slug}">${linkText}</a>`;
      }
      return linkText;
    });
  }

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
}
