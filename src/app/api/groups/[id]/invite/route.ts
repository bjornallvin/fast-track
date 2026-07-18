import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import * as React from 'react';
import { render } from '@react-email/render';
import type { GroupSession } from '@/types';
import { sendEmail, getBaseUrl, EMAIL_REGEX } from '@/utils/sendEmail';
import { GroupLinkEmail } from '@/components/email/GroupLinkEmail';

const MAX_INVITES = 10;

// POST: organizer sends join-link invitations by email.
// Body: { token, emails: string[] } — token must be the group's editToken.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { token, emails } = await request.json();

    const group = await kv.get<GroupSession>(`group:${id}`);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (!token || token !== group.editToken) {
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }
    if (group.endTime) {
      return NextResponse.json({ error: 'This fast has already ended' }, { status: 400 });
    }

    const list: string[] = Array.isArray(emails) ? emails : [];
    const valid = [...new Set(list.map(e => String(e).trim().toLowerCase()))].filter(e =>
      EMAIL_REGEX.test(e)
    );
    if (valid.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses' }, { status: 400 });
    }
    if (valid.length > MAX_INVITES) {
      return NextResponse.json(
        { error: `Max ${MAX_INVITES} invitations at a time` },
        { status: 400 }
      );
    }

    const html = await render(
      GroupLinkEmail({
        kind: 'invite',
        groupName: group.name,
        groupId: id,
        startTime: group.startTime,
        targetDuration: group.targetDuration,
        baseUrl: getBaseUrl(),
      }) as React.ReactElement
    );

    const results = await Promise.allSettled(
      valid.map(to => sendEmail(to, `Join ${group.name} — Fast Track`, html))
    );
    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = valid.filter((_, i) => results[i].status === 'rejected');
    if (failed.length > 0) {
      console.error('Some invites failed:', failed, results);
    }

    return NextResponse.json({ success: sent > 0, sent, failed });
  } catch (error) {
    console.error('Error sending invites:', error);
    return NextResponse.json({ error: 'Failed to send invitations' }, { status: 500 });
  }
}
