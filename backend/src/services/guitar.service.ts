import { EntityManager, type FilterQuery } from '@mikro-orm/postgresql';
import { v4 as uuidv4 } from 'uuid';
import { Guitar } from '../domain/entities/Guitar';
import { GuitarImage } from '../domain/entities/GuitarImage';
import type { StorageAdapter } from '../adapters/storage/storage.interface';
import type {
  GuitarDto,
  GuitarDetailDto,
  GuitarImageDto,
  GuitarFilterParams,
  GuitarListResponse,
  GuitarFacets,
  FacetBucket,
} from '@ibanez-db/shared';
import { logger } from '../config/logger';

export class GuitarService {
  constructor(
    private readonly em: EntityManager,
    private readonly storage: StorageAdapter,
  ) {}

  /**
   * List guitars with faceted filtering, pagination, and sorting.
   */
  async listGuitars(params: GuitarFilterParams): Promise<GuitarListResponse> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 24, 100);
    const offset = (page - 1) * limit;

    // Get IDs matching any jsonb array-based material filters first
    const arrayFilterIds = await this.getArrayFilterIds(params);
    const where = this.buildWhereClause(params, arrayFilterIds);

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    const sortBy = params.sortBy ?? 'model';
    const sortOrder = params.sortOrder ?? 'asc';
    orderBy[sortBy] = sortOrder;

    try {
      const [guitars, total] = await this.em.findAndCount(Guitar, where, {
        orderBy,
        limit,
        offset,
        populate: ['images'],
      });

      // Compute facets from all matching guitars (without pagination)
      const facets = await this.computeFacets(where);

      return {
        data: guitars.map((g) => this.toDto(g)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        facets,
      };
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  /**
   * Get a single guitar by ID or slug with all images and details.
   */
  async getGuitarById(idOrSlug: string): Promise<GuitarDetailDto | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };
    const guitar = await this.em.findOne(Guitar, where, { populate: ['images'] });
    if (!guitar) return null;
    return this.toDetailDto(guitar);
  }

  /**
   * Create or update a guitar record (used by scraper and admin endpoint).
   */
  async upsertGuitar(data: Partial<Guitar> & { model: string }): Promise<Guitar> {
    let guitar = await this.em.findOne(Guitar, { model: data.model });

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
    await this.em.populate(guitar, ['images']);
    const existingImages = guitar.images.getItems();

    // Build a map of existing images by original name
    const existingByName = new Map(existingImages.map((img) => [img.originalName, img]));

    const processedNames = new Set<string>();

    for (const entry of imageEntries) {
      processedNames.add(entry.originalName);
      const existing = existingByName.get(entry.originalName);

      if (existing && existing.sizeBytes === entry.data.length) {
        // Image unchanged, just update primary flag if needed
        if (existing.isPrimary !== entry.isPrimary) {
          existing.isPrimary = entry.isPrimary;
        }
        continue;
      }

      if (existing) {
        // Image changed (different size): delete old, upload new
        await this.storage.delete(existing.storageKey);
        this.em.remove(existing);
      }

      // Upload new image
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

    // Remove images that are no longer present on the wiki
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

  /**
   * Query IDs of guitars matching jsonb array-based material filters.
   * Uses EXISTS + jsonb_array_elements_text for "any of these values" matching.
   * Returns undefined if no array filters are active (no restriction needed).
   */
  private async getArrayFilterIds(params: GuitarFilterParams): Promise<string[] | undefined> {
    const hasArr = (v: unknown): boolean =>
      v != null && (Array.isArray(v) ? (v as unknown[]).length > 0 : true);

    const hasBodyFilter = hasArr(params.bodyMaterial);
    const hasNeckFilter = hasArr(params.neckMaterial);
    const hasFretboardFilter = hasArr(params.fretboardMaterial);
    const hasPickupFilter = hasArr(params.pickupConfiguration);
    const hasCountryFilter = hasArr(params.countryOfOrigin);
    const hasFretsFilter = hasArr(params.numberOfFrets);

    if (!hasBodyFilter && !hasNeckFilter && !hasFretboardFilter &&
        !hasPickupFilter && !hasCountryFilter && !hasFretsFilter) return undefined;

    const knex = this.em.getConnection().getKnex();
    let query = knex('guitars').select('id');

    const addStringArrayFilter = (column: string, value: string | string[] | undefined): void => {
      if (!value) return;
      const vals = Array.isArray(value) ? value : [value];
      query = query.whereRaw(
        'EXISTS (SELECT 1 FROM jsonb_array_elements_text(??) m WHERE m = ANY(?))',
        [column, vals],
      );
    };

    addStringArrayFilter('body_material_list', params.bodyMaterial as string | string[] | undefined);
    addStringArrayFilter('neck_material_list', params.neckMaterial as string | string[] | undefined);
    addStringArrayFilter('fretboard_material_list', params.fretboardMaterial as string | string[] | undefined);
    addStringArrayFilter('pickup_configuration_list', params.pickupConfiguration as string | string[] | undefined);
    addStringArrayFilter('country_of_origin_list', params.countryOfOrigin as string | string[] | undefined);

    if (hasFretsFilter) {
      const vals = Array.isArray(params.numberOfFrets) ? params.numberOfFrets : [params.numberOfFrets as number];
      query = query.whereRaw(
        'EXISTS (SELECT 1 FROM jsonb_array_elements(??) m WHERE (m)::int = ANY(?))',
        ['number_of_frets_list', vals],
      );
    }

    const rows = await query as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }

  private buildWhereClause(params: GuitarFilterParams, arrayFilterIds?: string[]): FilterQuery<Guitar> {
    const conditions: FilterQuery<Guitar>[] = [];

    if (params.search) {
      conditions.push({
        $or: [
          { model: { $ilike: `%${params.search}%` } },
          { name: { $ilike: `%${params.search}%` } },
          { series: { $ilike: `%${params.search}%` } },
        ],
      } as FilterQuery<Guitar>);
    }

    const arrayFilter = (field: keyof Guitar, value: string | string[] | undefined): void => {
      if (!value) return;
      const values = Array.isArray(value) ? value : [value];
      conditions.push({ [field]: { $in: values } } as FilterQuery<Guitar>);
    };

    arrayFilter('productCategory', params.productCategory as string | string[] | undefined);
    arrayFilter('series', params.series);
    arrayFilter('bodyType', params.bodyType);
    arrayFilter('neckType', params.neckType);
    // bodyMaterial, neckMaterial, fretboardMaterial, pickupConfiguration,
    // countryOfOrigin, numberOfFrets now filtered via arrayFilterIds (jsonb list columns)
    arrayFilter('bridgeType', params.bridgeType);
    arrayFilter('hardwareColor', params.hardwareColor);

    if (params.numberOfStrings !== undefined) {
      const strings = Array.isArray(params.numberOfStrings) ? params.numberOfStrings : [params.numberOfStrings];
      conditions.push({ numberOfStrings: { $in: strings } } as FilterQuery<Guitar>);
    }

    if (params.tremolo !== undefined) {
      conditions.push({ tremolo: params.tremolo } as FilterQuery<Guitar>);
    }

    if (params.productionStart !== undefined) {
      conditions.push({ productionStart: { $gte: params.productionStart } } as FilterQuery<Guitar>);
    }

    if (params.productionEnd !== undefined) {
      conditions.push({ productionEnd: { $lte: params.productionEnd } } as FilterQuery<Guitar>);
    }

    // Apply array-based material filter by restricting to matching IDs
    if (arrayFilterIds !== undefined) {
      // If no IDs matched, produce an impossible condition
      if (arrayFilterIds.length === 0) {
        conditions.push({ id: null } as FilterQuery<Guitar>);
      } else {
        conditions.push({ id: { $in: arrayFilterIds } } as FilterQuery<Guitar>);
      }
    }

    return conditions.length > 0 ? { $and: conditions } as FilterQuery<Guitar> : {};
  }

  private async computeFacets(baseWhere: FilterQuery<Guitar>): Promise<GuitarFacets> {
    const knex = this.em.getConnection().getKnex();

    // Build a subquery for the filtered set using the ORM where clause
    const matchingIds = await this.em.find(Guitar, baseWhere, {
      fields: ['id'],
      limit: 10000,
    });
    const ids = matchingIds.map((g) => g.id);

    const facets: Record<string, FacetBucket[]> = {};

    // ---- Standard scalar field facets ----
    const scalarFields = [
      'product_category',
      'series',
      'body_type',
      'neck_type',
      'bridge_type',
      'hardware_color',
      'number_of_strings',
    ] as const;

    for (const field of scalarFields) {
      let query = knex('guitars')
        .select(knex.raw(`"${field}" as value`))
        .count('* as count')
        .whereNotNull(field);

      if (field !== 'number_of_strings') {
        query = query.where(field, '!=', '');
      }

      if (ids.length > 0 && ids.length < 10000) {
        query = query.whereIn('id', ids);
      }

      const rows = await query
        .groupBy(field)
        .orderBy('count', 'desc')
        .limit(50);

      const camelField = field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      facets[camelField] = rows.map((r: Record<string, unknown>) => ({
        value: String(r.value),
        count: parseInt(String(r.count), 10),
      }));
    }

    // ---- Jsonb array field facets (unnest via jsonb_array_elements_text) ----
    const listFields: Array<{ column: string; facetKey: string }> = [
      { column: 'body_material_list', facetKey: 'bodyMaterial' },
      { column: 'neck_material_list', facetKey: 'neckMaterial' },
      { column: 'fretboard_material_list', facetKey: 'fretboardMaterial' },
      { column: 'pickup_configuration_list', facetKey: 'pickupConfiguration' },
      { column: 'country_of_origin_list', facetKey: 'countryOfOrigin' },
      { column: 'number_of_frets_list', facetKey: 'numberOfFrets' },
    ];

    for (const { column, facetKey } of listFields) {
      let subquery = knex('guitars')
        .select(knex.raw(`jsonb_array_elements_text(??) as value`, [column]));

      if (ids.length > 0 && ids.length < 10000) {
        subquery = subquery.whereIn('id', ids);
      }

      const rows = await knex
        .from(subquery.as('sub'))
        .select('value')
        .count('* as count')
        .whereNotNull('value')
        .where('value', '!=', '')
        .groupBy('value')
        .orderBy('count', 'desc')
        .limit(50);

      facets[facetKey] = rows.map((r: Record<string, unknown>) => ({
        value: String(r.value),
        count: parseInt(String(r.count), 10),
      }));
    }

    return facets as unknown as GuitarFacets;
  }

  private toDto(guitar: Guitar): GuitarDto {
    const primaryImage = guitar.images.getItems().find((img) => img.isPrimary);
    const firstImage = guitar.images.getItems()[0];
    const displayImage = primaryImage ?? firstImage;

    return {
      id: guitar.id,
      model: guitar.model,
      name: guitar.name,
      slug: guitar.slug,
      productCategory: guitar.productCategory,
      series: guitar.series,
      bodyType: guitar.bodyType,
      bodyMaterial: guitar.bodyMaterial,
      bodyMaterialList: guitar.bodyMaterialList ?? [],
      neckType: guitar.neckType,
      neckMaterial: guitar.neckMaterial,
      neckMaterialList: guitar.neckMaterialList ?? [],
      fretboardMaterial: guitar.fretboardMaterial,
      fretboardMaterialList: guitar.fretboardMaterialList ?? [],
      fretboardRadius: guitar.fretboardRadius,
      numberOfFrets: guitar.numberOfFrets,
      numberOfFretsList: guitar.numberOfFretsList ?? [],
      numberOfStrings: guitar.numberOfStrings,
      scaleLength: guitar.scaleLength,
      pickupConfiguration: guitar.pickupConfiguration,
      pickupConfigurationList: guitar.pickupConfigurationList ?? [],
      neckPickup: guitar.neckPickup,
      middlePickup: guitar.middlePickup,
      bridgePickup: guitar.bridgePickup,
      bridgeType: guitar.bridgeType,
      tremolo: guitar.tremolo,
      hardwareColor: guitar.hardwareColor,
      finishes: guitar.finishes ?? [],
      countryOfOrigin: guitar.countryOfOrigin,
      countryOfOriginList: guitar.countryOfOriginList ?? [],
      yearsProduced: guitar.yearsProduced,
      productionStart: guitar.productionStart,
      productionEnd: guitar.productionEnd,
      msrp: guitar.msrp,
      wikiUrl: guitar.wikiUrl,
      primaryImageUrl: displayImage
        ? this.storage.getPublicUrl(displayImage.storageKey)
        : null,
      createdAt: guitar.createdAt.toISOString(),
      updatedAt: guitar.updatedAt.toISOString(),
    };
  }

  private async toDetailDto(guitar: Guitar): Promise<GuitarDetailDto> {
    return {
      ...this.toDto(guitar),
      images: guitar.images.getItems().map((img) => this.toImageDto(img)),
      descriptionHtml: await this.resolveDescriptionLinks(guitar.descriptionHtml),
      rawAttributes: guitar.rawAttributes ?? {},
    };
  }

  /**
   * Resolve data-wiki-link placeholders in description HTML to local guitar links.
   * Links whose wiki path matches a guitar's wikiUrl become /guitars/{slug} links;
   * unmatched links are stripped to plain text.
   */
  private async resolveDescriptionLinks(html: string | null): Promise<string | null> {
    if (!html) return null;

    // Collect all wiki link paths from the description
    const linkRegex = /<a\s+data-wiki-link="([^"]*)">(.*?)<\/a>/g;
    const wikiPaths = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(html)) !== null) {
      wikiPaths.add(match[1]);
    }

    if (wikiPaths.size === 0) return html;

    // Build full wiki URLs and batch-lookup guitars
    const WIKI_BASE = 'https://ibanez.fandom.com';
    const fullUrls = [...wikiPaths].map((path) => `${WIKI_BASE}${path}`);
    const guitars = await this.em.find(Guitar, {
      wikiUrl: { $in: fullUrls },
    }, { fields: ['wikiUrl', 'slug'] });

    // Map wiki URL → slug
    const urlToSlug = new Map<string, string>();
    for (const g of guitars) {
      if (g.wikiUrl) urlToSlug.set(g.wikiUrl, g.slug);
    }

    // Replace links: matched ones get local hrefs, unmatched become plain text
    return html.replace(linkRegex, (_match, wikiPath: string, linkText: string) => {
      const fullUrl = `${WIKI_BASE}${wikiPath}`;
      const slug = urlToSlug.get(fullUrl);
      if (slug) {
        return `<a href="/guitars/${slug}">${linkText}</a>`;
      }
      return linkText;
    });
  }

  private toImageDto(image: GuitarImage): GuitarImageDto {
    return {
      id: image.id,
      guitarId: image.guitar.id,
      storageKey: image.storageKey,
      originalName: image.originalName,
      sizeBytes: image.sizeBytes,
      mimeType: image.mimeType,
      isPrimary: image.isPrimary,
      url: this.storage.getPublicUrl(image.storageKey),
      createdAt: image.createdAt.toISOString(),
    };
  }

  private slugify(text: string): string {
    return text
      .replace(/\u2160/g, 'I')    // Ⅰ
      .replace(/\u2161/g, 'II')   // Ⅱ
      .replace(/\u2162/g, 'III')  // Ⅲ
      .replace(/\u2163/g, 'IV')   // Ⅳ
      .replace(/\u2164/g, 'V')    // Ⅴ
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
