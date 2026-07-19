import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import * as React from 'react';
import type { FastingSession, GroupSession } from '@/types';
import { SessionLinksEmail, type GroupLinkData } from '@/components/email/SessionLinksEmail';
import { render } from '@react-email/render';
import { sendEmail, getBaseUrl } from '@/utils/sendEmail';

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
      const result: [string | number, string[]] = await kv.scan(cursor, { match: 'session:*', count: 100 });
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

    // Also scan group fasts: organizer links + participant report links
    const baseUrlForGroups = getBaseUrl();
    const groupLinks: GroupLinkData[] = [];
    cursor = 0;
    do {
      const result: [string | number, string[]] = await kv.scan(cursor, { match: 'group:*', count: 100 });
      cursor = result[0];
      for (const key of result[1] as string[]) {
        const group = await kv.get<GroupSession>(key);
        if (!group) continue;
        const isActive = !group.endTime;
        if (group.email && group.email.toLowerCase() === normalizedEmail) {
          groupLinks.push({
            groupName: group.name,
            role: 'organizer',
            url: `${baseUrlForGroups}/group/${group.editToken}/${group.id}`,
            isActive,
          });
        }
        for (const p of group.participants) {
          if (p.email && p.email.toLowerCase() === normalizedEmail) {
            groupLinks.push({
              groupName: group.name,
              role: `reporting as ${p.name}`,
              url: `${baseUrlForGroups}/group/report/${p.reportToken}/${group.id}`,
              isActive,
            });
          }
        }
      }
    } while (cursor !== 0 && cursor !== '0');

    if (sessions.length === 0 && groupLinks.length === 0) {
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
    const baseUrl = getBaseUrl();

    // Render email HTML using React Email
    const emailElement = SessionLinksEmail({ sessions: sessionData, groupLinks, baseUrl }) as React.ReactElement;
    const emailHtml = await render(emailElement);

    // Send email via Gmail
    try {
      await sendEmail(email, 'Your Fast Track Session Links', emailHtml);
    } catch (error) {
      console.error('Email send error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionCount: sessions.length,
      groupCount: groupLinks.length,
      message: `Sent ${sessions.length + groupLinks.length} link(s) to ${email}`
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
