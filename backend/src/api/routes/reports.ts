import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendProblemReport } from '../../services/email.service';
import { logger } from '../../config/logger';

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /reports
   * Accepts a problem report from the frontend and emails it to the admin.
   */
  fastify.post('/reports', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, unknown>;

    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const pageUrl = typeof body?.pageUrl === 'string' ? body.pageUrl.trim() : '';

    if (!message) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: '"message" is required',
      });
    }

    try {
      await sendProblemReport({
        message,
        pageUrl: pageUrl || '(unknown)',
        submittedAt: new Date(),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to send problem report email');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to send report',
      });
    }

    return reply.status(200).send({ ok: true });
  });
}
