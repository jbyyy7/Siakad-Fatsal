import serverSupabase from './serverSupabase';
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimiter';
import { logger } from '../utils/logger';

// Simple shared-secret check (set CREATE_USER_SECRET in Vercel env)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' });

  // Rate limiting
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.CREATE_USER);
  if (rateLimitResponse) {
    const body = await rateLimitResponse.json();
    return res.status(429).send(body);
  }

  const secret = req.headers['x-create-user-secret'] as string | undefined;
  if (!secret || secret !== process.env.CREATE_USER_SECRET) {
    logger.warn('Unauthorized create-user attempt', { headers: req.headers });
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const { email, password, profile } = req.body;
  if (!email || !profile) {
    return res.status(400).send({ error: 'Missing fields' });
  }
  try {
    // Create user via admin.createUser. We avoid returning any password.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: authData, error: authError } = await serverSupabase.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(2, 10) + 'A1!',
      email_confirm: true,
    } as any);

    if (authError) throw authError;
    if (!authData || !authData.user) throw new Error('Failed to create auth user');

    // Insert profile with the same id
    const profilePayload = { id: authData.user.id, ...profile };
    const { error: profileError } = await serverSupabase.from('profiles').insert(profilePayload);
    if (profileError) {
      // Try to cleanup created user
      await serverSupabase.auth.admin.deleteUser(authData.user.id as string);
      throw profileError;
    }

    // Instead of returning password, create a reset token and optionally email it
    const token = Math.random().toString(36).slice(2, 20) + Math.random().toString(36).slice(2, 8);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await serverSupabase.from('password_resets').insert({ user_id: authData.user.id, token, expires_at: expires.toISOString() });

    // If notification service exists, send email with link
    try {
      const { initSendGrid, sendEmailNotification } = await import('../services/notificationService');
      initSendGrid();
      const appUrl = process.env.APP_URL || 'https://your-app.example';
      const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmailNotification({ to: email, subject: 'Atur password Anda', text: `Silakan atur password Anda: ${resetLink}`, html: `<p>Silakan atur password Anda <a href="${resetLink}">di sini</a></p>` });
    } catch (e) {
      logger.warn('Failed to send reset email', e);
    }

    return res.status(201).send({ ok: true, userId: authData.user.id });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('create-user error', e);
    return res.status(500).send({ error: e.message || String(e) });
  }
}
