import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE env');
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { classId, semesterId } = req.query;
    let q = serverSupabase.from('grades').select('student:profiles(full_name), score, subject:subjects(name), semester_id').order('student_id');
    if (classId) {
      // join class_members to filter by class
      q = serverSupabase.from('grades').select('*, student:profiles(full_name), subject:subjects(name)').eq('class_id', classId as string);
    }
    if (semesterId) {
      q = serverSupabase.from('grades').select('*, student:profiles(full_name), subject:subjects(name)').eq('semester_id', semesterId as string);
    }
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: String(error.message || error) });
    const rows = (data || []).map((r: any) => ({ student: r.student?.full_name || '', subject: Array.isArray(r.subject) ? r.subject[0]?.name : r.subject?.name || '', score: r.score }));
    const csv = ['student,subject,score'].concat(rows.map((r: any) => `${JSON.stringify(r.student)},${JSON.stringify(r.subject)},${r.score}`)).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="grades_export.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
