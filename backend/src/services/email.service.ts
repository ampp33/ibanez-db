import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

/** Creates a reusable transporter using the configured SMTP settings. */
function createTransporter() {
  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: env.email.user
      ? { user: env.email.user, pass: env.email.pass }
      : undefined,
  });
}

export interface ProblemReport {
  message: string;
  pageUrl: string;
  submittedAt: Date;
}

/**
 * Send a "Report a Problem" email to the configured admin address.
 * Logs a warning (but does not throw) if no admin email is configured.
 */
export async function sendProblemReport(report: ProblemReport): Promise<void> {
  if (!env.email.adminAddress) {
    logger.warn('ADMIN_EMAIL not configured — problem report not sent via email');
    logger.info({ report }, 'Problem report content');
    return;
  }

  const transporter = createTransporter();

  const dateString = report.submittedAt.toUTCString();

  await transporter.sendMail({
    from: env.email.from,
    to: env.email.adminAddress,
    subject: `[Ibanez DB] Problem reported on ${report.pageUrl}`,
    text: [
      'A problem was reported on the Ibanez Guitar Database.',
      '',
      `Submitted:  ${dateString}`,
      `Page URL:   ${report.pageUrl}`,
      '',
      'User message:',
      '─────────────────────────────────────',
      report.message,
      '─────────────────────────────────────',
    ].join('\n'),
    html: `
      <p>A problem was reported on the Ibanez Guitar Database.</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap"><strong>Submitted</strong></td><td>${dateString}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap"><strong>Page URL</strong></td><td><a href="${report.pageUrl}">${report.pageUrl}</a></td></tr>
      </table>
      <p><strong>User message:</strong></p>
      <blockquote style="margin:0;padding:12px;background:#f5f5f5;border-left:4px solid #ccc;white-space:pre-wrap">${report.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</blockquote>
    `,
  });

  logger.info({ pageUrl: report.pageUrl }, 'Problem report email sent');
}
