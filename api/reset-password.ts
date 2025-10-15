import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverSupabase from './serverSupabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });

    const qr = await serverSupabase.from('password_resets').select('id,user_id,expires_at,used').eq('token', token).maybeSingle();
    const rec = qr?.data;
    if (!rec) return res.status(400).json({ error: 'Invalid token' });
    if (rec.used) return res.status(400).json({ error: 'Token already used' });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });

    // update password via admin API
    const upd = await serverSupabase.auth.admin.updateUserById(rec.user_id, { password } as any);
    if (upd?.error) return res.status(500).json({ error: String(upd.error.message || upd.error) });

    await serverSupabase.from('password_resets').update({ used: true }).eq('id', rec.id);
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
