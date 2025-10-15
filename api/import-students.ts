import { createStudent } from './create-student-helpers';

export default async function handler(req: any, res: any) {
  try {
    const secret = process.env.CREATE_USER_SECRET;
    const provided = req.headers['x-create-secret'] || req.query.secret;
    if (!secret || provided !== secret) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = req.body || {};
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be array' });

    // Process rows and return per-row status in the same order
    const results: Array<{ ok: boolean; id?: string; email_sent?: boolean; error?: string }> = [];
    for (const row of rows) {
      try {
        const r = await createStudent(row);
        results.push({ ok: true, id: r.id, email_sent: r.email_sent });
      } catch (err: any) {
        results.push({ ok: false, error: String(err?.message || err) });
      }
    }
    return res.status(200).json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
