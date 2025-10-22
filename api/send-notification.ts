import { initSendGrid, sendEmailNotification } from '../services/notificationService';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

// Simple serverless endpoint to send email notifications. Protect with a secret in env: SEND_NOTIFICATION_SECRET
export default async function handler(req: any, res: any) {
  try {
    // Rate limiting
    const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.SEND_EMAIL);
    if (rateLimitResponse) {
      const body = await rateLimitResponse.json();
      return res.status(429).json(body);
    }

    const secret = process.env.SEND_NOTIFICATION_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server not configured' });
    const provided = req.headers['x-send-secret'] || req.query.secret;
    if (provided !== secret) {
      logger.warn('Unauthorized send-notification attempt', { headers: req.headers });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'Missing to or subject' });

    initSendGrid();
    await sendEmailNotification({ to, subject, html, text });
    logger.info('Email sent successfully', { to, subject });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    logger.error('Send-notification error', err, 'send-notification');
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
