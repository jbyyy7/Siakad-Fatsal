import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE env');
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { classId, date } = req.query;
    let q = serverSupabase.from('attendances').select('student:profiles(full_name), status, occurred_at, class_id');
    if (classId) q = q.eq('class_id', classId as string);
    if (date) q = q.eq('occurred_at', date as string);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: String(error.message || error) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data || []).map((r: any) => ({ student: r.student?.full_name || '', status: r.status, occurred_at: r.occurred_at }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const csv = ['student,status,occurred_at'].concat(rows.map((r: any) => `${JSON.stringify(r.student)},${JSON.stringify(r.status)},${JSON.stringify(r.occurred_at)}`)).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
    res.send(csv);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
