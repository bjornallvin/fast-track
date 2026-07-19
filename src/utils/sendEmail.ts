import nodemailer from 'nodemailer';

// Shared email helper (server-side only).
// Sends via Gmail SMTP as the account owner. Because the sending domain
// (allvin.se) is hosted on Google and lists Google in its SPF, mail sent this
// way passes SPF/DKIM/DMARC and reaches the inbox — unlike third-party relays
// sending "as" the domain without domain authentication.

const GMAIL_USER = process.env.GMAIL_USER;
// App passwords are often shown as "abcd efgh ijkl mnop" — strip spaces.
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

const transporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      })
    : null;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    throw new Error('Email is not configured (set GMAIL_USER and GMAIL_APP_PASSWORD)');
  }
  const fromName = process.env.EMAIL_FROM_NAME || 'Fast Track';
  await transporter.sendMail({
    from: `"${fromName}" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

export function getBaseUrl(): string {
  // Strip any trailing slash so callers can safely append "/group/…".
  return (process.env.NEXT_PUBLIC_BASE_URL || 'https://fast-tracking.vercel.app').replace(/\/+$/, '');
}
