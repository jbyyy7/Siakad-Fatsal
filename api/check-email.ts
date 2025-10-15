import type { VercelRequest, VercelResponse } from '@vercel/node'
import serverSupabase from './serverSupabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
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
      console.error('supabase profiles select error', error)
      res.status(500).json({ error: 'Internal error' })
      return
    }

    res.json({ exists: !!data })
  } catch (err) {
    console.error('check-email error', err)
    res.status(500).json({ error: 'Internal error' })
  }
}
