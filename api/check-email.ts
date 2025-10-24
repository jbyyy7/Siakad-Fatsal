import type { VercelRequest, VercelResponse } from '@vercel/node'
import serverSupabase from './serverSupabase'
import { checkRateLimit, RATE_LIMITS } from '../utils/rateLimiter'
import { logger } from '../utils/logger'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Rate limiting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rateLimitResponse = checkRateLimit(req as any, RATE_LIMITS.CHECK_EMAIL);
  if (rateLimitResponse) {
    const body = await rateLimitResponse.json();
    res.status(429).json(body);
    return;
  }

  const { email } = req.body || {}
  if (!email) {
    res.status(400).json({ error: 'Missing email' })
    return
  }

  try {
    // Query the `profiles` table where we store user emails on creation/upsert.
    const { data, error } = await serverSupabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (error) {
      logger.error('Supabase profiles select error', error, 'check-email')
      res.status(500).json({ error: 'Internal error' })
      return
    }

    res.json({ exists: !!data })
  } catch (err) {
    logger.error('Check-email error', err, 'check-email')
    res.status(500).json({ error: 'Internal error' })
  }
}
