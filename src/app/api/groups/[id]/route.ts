import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import * as React from 'react';
import { render } from '@react-email/render';
import type { GroupSession } from '@/types';
import { GROUP_TTL, rehydrateGroup, toPublic } from '@/utils/groups';
import { sendEmail, getBaseUrl, EMAIL_REGEX } from '@/utils/sendEmail';
import { GroupLinkEmail } from '@/components/email/GroupLinkEmail';

// GET: load group; ?token= resolves the caller's role (tokens never returned)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get('token');
  try {
    const group = await kv.get<GroupSession>(`group:${id}`);
    if (!group) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(toPublic(rehydrateGroup(group), token));
  } catch (error) {
    console.error('Error loading group:', error);
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to load group' }, { status: 500 });
  }
}

// POST: create the group, or update shared fields (organizer only).
// Create body: { name, startTime, targetDuration, editToken }
// Update body: { token, name?, startTime?, targetDuration?, endTime? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const existing = await kv.get<GroupSession>(`group:${id}`);

    if (!existing) {
      const { name, startTime, targetDuration, editToken, email } = body;
      if (!name || !startTime || !targetDuration || !editToken) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      const group: GroupSession = {
        id,
        name,
        startTime,
        targetDuration,
        endTime: null,
        createdAt: new Date(),
        editToken,
        ...(email && EMAIL_REGEX.test(email) ? { email: email.toLowerCase() } : {}),
        participants: [],
      };
      await kv.set(`group:${id}`, group, { ex: GROUP_TTL });

      // Email the organizer their edit link — creation succeeds regardless
      if (group.email) {
        try {
          const html = await render(
            GroupLinkEmail({
              kind: 'organizer',
              groupName: name,
              groupId: id,
              token: editToken,
              startTime,
              targetDuration,
              baseUrl: getBaseUrl(),
            }) as React.ReactElement
          );
          await sendEmail(group.email, `Your organizer link for ${name} — Fast Track`, html);
        } catch (err) {
          console.error('Failed to send organizer-link email:', err);
        }
      }
      return NextResponse.json({ success: true, id });
    }

    if (body.token !== existing.editToken) {
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }
    const updated: GroupSession = {
      ...existing,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.startTime !== undefined ? { startTime: body.startTime } : {}),
      ...(body.targetDuration !== undefined ? { targetDuration: body.targetDuration } : {}),
      ...(body.endTime !== undefined ? { endTime: body.endTime } : {}),
    };
    await kv.set(`group:${id}`, updated, { ex: GROUP_TTL });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving group:', error);
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true, id });
    }
    return NextResponse.json({ error: 'Failed to save group' }, { status: 500 });
  }
}

// DELETE: organizer only (?token=)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get('token');
  try {
    const existing = await kv.get<GroupSession>(`group:${id}`);
    if (existing && token !== existing.editToken) {
      return NextResponse.json({ error: 'Invalid edit token' }, { status: 403 });
    }
    await kv.del(`group:${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
