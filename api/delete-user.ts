import serverSupabase from './serverSupabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' });

  const secret = req.headers['x-delete-user-secret'] as string | undefined;
  if (!secret || secret !== process.env.DELETE_USER_SECRET) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const { userId } = req.body;
  if (!userId) return res.status(400).send({ error: 'Missing userId' });

  try {
    // Delete profile
    const { error: profileError } = await serverSupabase.from('profiles').delete().eq('id', userId);
    if (profileError) throw profileError;

    // Delete auth user
    const { error: authError } = await serverSupabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return res.status(200).send({ ok: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error('delete-user error', e);
    return res.status(500).send({ error: e.message || String(e) });
  }
}
