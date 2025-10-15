import sgMail from '@sendgrid/mail';

const fromAddress = process.env.NOTIFICATIONS_FROM || 'no-reply@your-school.example';

export function initSendGrid() {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY is not set');
  sgMail.setApiKey(key);
}

export async function sendEmailNotification({ to, subject, html, text }: { to: string; subject: string; html?: string; text?: string; }) {
  if (!process.env.SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY is not set');
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
