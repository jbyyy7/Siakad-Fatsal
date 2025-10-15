import serverSupabase from './serverSupabase';

// Simple shared-secret check (set CREATE_USER_SECRET in Vercel env)
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' });

  const secret = req.headers['x-create-user-secret'] as string | undefined;
  if (!secret || secret !== process.env.CREATE_USER_SECRET) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const { email, password, profile } = req.body;
  if (!email || !password || !profile) {
    return res.status(400).send({ error: 'Missing fields' });
  }

  try {
    const { data: authData, error: authError } = await serverSupabase.auth.admin.createUser({
      email,
      password,
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

    return res.status(201).send({ ok: true, userId: authData.user.id });
  } catch (e: any) {
    console.error('create-user error', e);
    return res.status(500).send({ error: e.message || String(e) });
  }
}
