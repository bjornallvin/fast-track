import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';
import { kv } from '@vercel/kv';
import type { FastingSession } from '@/types';
import { SessionLinksEmail } from '@/components/email/SessionLinksEmail';
import { render } from '@react-email/render';

// Initialize Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Scan all session keys and check for matching email
    const normalizedEmail = email.toLowerCase();
    const sessions: FastingSession[] = [];

    // Use SCAN to iterate through all session keys
    let cursor: string | number = 0;
    do {
      const result = await kv.scan(cursor, { match: 'session:*', count: 100 });
      cursor = result[0];
      const keys = result[1] as string[];

      // Fetch all sessions in this batch
      for (const key of keys) {
        const session = await kv.get<FastingSession>(key);
        if (session && session.email && session.email.toLowerCase() === normalizedEmail) {
          sessions.push(session);
        }
      }
    } while (cursor !== 0 && cursor !== '0');

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found' },
        { status: 404 }
      );
    }

    // Prepare session data for email
    const sessionData = sessions.map(s => ({
      id: s.id,
      name: s.name,
      editToken: s.editToken,
      isActive: s.isActive,
      startTime: s.startTime,
      targetDuration: s.targetDuration
    }));

    // Get base URL (production or development)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fast-tracking.vercel.app';

    // Render email HTML using React Email
    const emailHtml = await render(
      SessionLinksEmail({ sessions: sessionData, baseUrl })
    );

    // Get sender info from environment variables
    const fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@example.com';
    const fromName = process.env.BREVO_FROM_NAME || 'Fast Track';

    // Prepare email payload for Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: fromEmail, name: fromName };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = 'Your Fast Track Session Links';
    sendSmtpEmail.htmlContent = emailHtml;

    // Send email via Brevo
    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error: any) {
      console.error('Brevo error:', error);
      if (error.response) {
        console.error('Brevo error body:', error.response.body);
      }
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionCount: sessions.length,
      message: `Sent ${sessions.length} session link(s) to ${email}`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
