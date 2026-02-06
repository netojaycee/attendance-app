import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY in environment');
}

export const resend = new Resend(RESEND_API_KEY);

export async function sendOrderConfirmation({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: 'orders@yourdomain.com',
    to,
    subject,
    html,
  });
}
