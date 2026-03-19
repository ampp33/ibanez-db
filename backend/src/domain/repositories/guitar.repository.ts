import { EntityManager, type FilterQuery } from '@mikro-orm/postgresql';
import { Guitar } from '../entities/Guitar';
import type {
  GuitarFilterParams,
  GuitarFacets,
  FacetBucket,
} from '@ibanez-db/shared';

export class GuitarRepository {
  constructor(private readonly em: EntityManager) {}

  /** Build a where clause from filter params, including async jsonb array ID pre-filtering. */
  async buildWhereClause(params: GuitarFilterParams): Promise<FilterQuery<Guitar>> {
    const arrayFilterIds = await this.getArrayFilterIds(params);
    return this.buildWhere(params, arrayFilterIds);
  }

  async findPaginated(
    where: FilterQuery<Guitar>,
    limit: number,
    offset: number,
    orderBy: Record<string, 'asc' | 'desc'>,
  ): Promise<{ guitars: Guitar[]; total: number }> {
    const [guitars, total] = await this.em.findAndCount(Guitar, where, {
      orderBy,
      limit,
      offset,
      populate: ['images'],
    });
    return { guitars, total };
  }

  async findByIdOrSlug(idOrSlug: string): Promise<Guitar | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where = isUuid ? { id: idOrSlug } : { slug: idOrSlug };
    return this.em.findOne(Guitar, where, { populate: ['images'] });
  }

  async findByModel(model: string): Promise<Guitar | null> {
    return this.em.findOne(Guitar, { model });
  }

  async findByWikiUrls(wikiUrls: string[]): Promise<Pick<Guitar, 'wikiUrl' | 'slug'>[]> {
    return this.em.find(Guitar, { wikiUrl: { $in: wikiUrls } }, { fields: ['wikiUrl', 'slug'] }) as unknown as Pick<Guitar, 'wikiUrl' | 'slug'>[];
  }

  async computeFacets(baseWhere: FilterQuery<Guitar>): Promise<GuitarFacets> {
    const knex = this.em.getConnection().getKnex();

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
      'bridge_type_simple',
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

  // ---- Private helpers ----

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

  private buildWhere(params: GuitarFilterParams, arrayFilterIds?: string[]): FilterQuery<Guitar> {
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
    arrayFilter('bridgeType', params.bridgeType);
    arrayFilter('bridgeTypeSimple', params.bridgeTypeSimple as string | string[] | undefined);
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

    // Year-range overlap filter: guitar's [productionStart, productionEnd] must overlap [min, max].
    // Requires a non-null productionStart; guitars with no year data are excluded when filter is active.
    if (params.productionYearMin !== undefined || params.productionYearMax !== undefined) {
      conditions.push({ productionStart: { $ne: null } } as FilterQuery<Guitar>);

      if (params.productionYearMax !== undefined) {
        // Guitar must have started by the end of the selected range
        conditions.push({ productionStart: { $lte: params.productionYearMax } } as FilterQuery<Guitar>);
      }

      if (params.productionYearMin !== undefined) {
        // Guitar must still be in production at the start of the selected range:
        // ended on or after min, or hasn't ended (null = still in production)
        conditions.push({
          $or: [
            { productionEnd: { $gte: params.productionYearMin } },
            { productionEnd: null },
          ],
        } as FilterQuery<Guitar>);
      }
    }

    if (arrayFilterIds !== undefined) {
      if (arrayFilterIds.length === 0) {
        conditions.push({ id: null } as FilterQuery<Guitar>);
      } else {
        conditions.push({ id: { $in: arrayFilterIds } } as FilterQuery<Guitar>);
      }
    }

    return conditions.length > 0 ? { $and: conditions } as FilterQuery<Guitar> : {};
  }
}
