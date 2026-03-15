import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GuitarService } from '../../services/guitar.service';
import type { GuitarFilterParams } from '@ibanez-db/shared';

/**
 * Register guitar REST endpoints.
 */
export async function guitarRoutes(
  fastify: FastifyInstance,
  opts: { guitarService: GuitarService },
): Promise<void> {
  const { guitarService } = opts;

  /**
   * GET /guitars
   * Supports faceted filtering via query parameters.
   */
  fastify.get('/guitars', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string | string[] | undefined>;

    const params: GuitarFilterParams = {
      search: asString(query.search),
      page: asInt(query.page) ?? 1,
      limit: asInt(query.limit) ?? 24,
      series: asStringArray(query.series),
      bodyType: asStringArray(query.bodyType),
      bodyMaterial: asStringArray(query.bodyMaterial),
      neckType: asStringArray(query.neckType),
      neckMaterial: asStringArray(query.neckMaterial),
      fretboardMaterial: asStringArray(query.fretboardMaterial),
      pickupConfiguration: asStringArray(query.pickupConfiguration),
      bridgeType: asStringArray(query.bridgeType),
      hardwareColor: asStringArray(query.hardwareColor),
      countryOfOrigin: asStringArray(query.countryOfOrigin),
      numberOfFrets: asIntArray(query.numberOfFrets),
      numberOfStrings: asIntArray(query.numberOfStrings),
      tremolo: asBool(query.tremolo),
      productionStart: asInt(query.productionStart),
      productionEnd: asInt(query.productionEnd),
      sortBy: asString(query.sortBy) as GuitarFilterParams['sortBy'],
      sortOrder: asString(query.sortOrder) as GuitarFilterParams['sortOrder'],
    };

    const result = await guitarService.listGuitars(params);

    return reply.send(result);
  });

  /**
   * GET /guitars/:id
   * Returns full guitar detail with all images.
   */
  fastify.get('/guitars/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const guitar = await guitarService.getGuitarById(id);

    if (!guitar) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: `Guitar with id "${id}" not found`,
      });
    }

    return reply.send(guitar);
  });

  /**
   * POST /guitars
   * Create/upsert a guitar (for admin/testing).
   */
  fastify.post('/guitars', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    if (!body.model || typeof body.model !== 'string') {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: '"model" is required and must be a string',
      });
    }

    const guitar = await guitarService.upsertGuitar(body as { model: string });
    return reply.status(201).send(guitar);
  });
}

// ---- Query parameter parsing helpers ----

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  return undefined;
}

function asInt(value: unknown): number | undefined {
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return undefined;
}

function asBool(value: unknown): boolean | undefined {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

/** Parse comma-separated or repeated query params into a string array. */
function asStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.length > 0) {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

function asIntArray(value: unknown): number[] | undefined {
  const strs = asStringArray(value);
  if (!strs) return undefined;
  const nums = strs.map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
  return nums.length > 0 ? nums : undefined;
}
