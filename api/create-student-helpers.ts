import serverSupabase from './serverSupabase';
import { initSendGrid, sendEmailNotification } from '../services/notificationService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createStudent(row: any) {
  // row: { full_name, email, phone, class_name }
  // Create auth user via Admin API with a random password (not returned)
  const password = Math.random().toString(36).slice(2, 10) + 'A1!';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await serverSupabase.auth.admin.createUser({
    email: row.email,
    password,
    email_confirm: true,
  } as any);
  if (error) throw error;
  const userId = data?.user?.id;
  if (!userId) throw new Error('Failed creating user');

  // insert profile
  await serverSupabase.from('profiles').upsert({
    id: userId,
    full_name: row.full_name || '',
    role: 'Siswa',
    email: row.email,
    phone: row.phone || null,
  });

  // assign to class if provided (create class if missing)
  if (row.class_name) {
    const classRes = await serverSupabase.from('classes').select('id').eq('name', row.class_name).maybeSingle();
    let classId = classRes?.data?.id;
    if (!classId) {
      const createClass = await serverSupabase.from('classes').insert({ name: row.class_name }).select('id').single();
      classId = createClass?.data?.id;
    }
    if (classId) {
      await serverSupabase.from('class_members').insert({ class_id: classId, profile_id: userId, role: 'student' });
    }
  }

  // send welcome email if configured (reset link already created below)
  let emailSent = false;
  try {
    initSendGrid();
    // create a reset token and store it so user can set password securely
    const token = Math.random().toString(36).slice(2, 20) + Math.random().toString(36).slice(2, 8);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await serverSupabase.from('password_resets').insert({ user_id: userId, token, expires_at: expires.toISOString() });
    const appUrl = process.env.APP_URL || 'https://your-app.example';
    const resetLink = `${appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmailNotification({
      to: row.email,
      subject: 'Selamat datang di SIAKAD - Atur password Anda',
      text: `Halo ${row.full_name || ''}, akun Anda telah dibuat. Silakan atur password Anda di: ${resetLink}`,
      html: `<p>Halo ${row.full_name || ''},</p><p>Akun Anda telah dibuat. Klik <a href="${resetLink}">di sini</a> untuk mengatur password Anda.</p>`,
    });
    emailSent = true;
  } catch (e) {
    // don't fail the whole import if email sending fails
    console.warn('welcome email failed', e);
  }

  return { id: userId, email_sent: emailSent };
}
