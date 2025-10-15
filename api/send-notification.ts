import { initSendGrid, sendEmailNotification } from '../services/notificationService';

// Simple serverless endpoint to send email notifications. Protect with a secret in env: SEND_NOTIFICATION_SECRET
export default async function handler(req: any, res: any) {
  try {
    const secret = process.env.SEND_NOTIFICATION_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server not configured' });
    const provided = req.headers['x-send-secret'] || req.query.secret;
    if (provided !== secret) return res.status(401).json({ error: 'Unauthorized' });

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'Missing to or subject' });

    initSendGrid();
    await sendEmailNotification({ to, subject, html, text });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('send-notification error', err?.message || err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
