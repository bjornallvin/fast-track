import * as brevo from '@getbrevo/brevo';

// Shared Brevo transactional-email helper (server-side only)
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: process.env.BREVO_FROM_EMAIL || 'noreply@example.com',
    name: process.env.BREVO_FROM_NAME || 'Fast Track',
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://fast-tracking.vercel.app';
}
