const fromAddress = process.env.NOTIFICATIONS_FROM || 'no-reply@your-school.example';

export async function initSendGrid() {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY is not set');
  // dynamic import to avoid failing installs/builds when dependency absent
  const sgMail = (await import('@sendgrid/mail')).default;
  sgMail.setApiKey(key);
  return sgMail;
}

export async function sendEmailNotification({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string; }) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    // If no API key, just log and resolve so build/deploy in staging doesn't fail.
    console.warn('SENDGRID_API_KEY not set — skipping sendEmailNotification', { to, subject });
    return Promise.resolve({ skipped: true });
  }
  const sgMail = (await import('@sendgrid/mail')).default;
  sgMail.setApiKey(key);
  const msg = {
    to,
    from: fromAddress,
    subject,
    html,
    text,
  } as any;
  return sgMail.send(msg);
}

export default {
  initSendGrid,
  sendEmailNotification,
};
