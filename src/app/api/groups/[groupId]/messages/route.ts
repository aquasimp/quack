import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Message from '@/lib/models/Message';
import Group from '@/lib/models/Group';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { validateMessageInput } from '@/lib/validation';
import { canAccessGroup, canPostToGroup } from '@/lib/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { groupId } = await params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await connectDB();

    // Verify group existence and authorization
    const group = await Group.findById(groupId).select('members admins createdBy type');
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!canAccessGroup(group, authUser)) {
      // 404 on unauthorized access to prevent private group enumeration
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 100);
    const before = searchParams.get('before');

    const filter: Record<string, unknown> = { group: groupId };
    if (before) {
      const parsedBefore = new Date(before);
      if (!isNaN(parsedBefore.getTime())) {
        filter.createdAt = { $lt: parsedBefore };
      }
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limiting: 60 messages per minute per user
    const rl = rateLimit(`msg:${authUser.userId}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const { groupId } = await params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await connectDB();

    // Verify group existence and authorization
    const group = await Group.findById(groupId).select('members admins createdBy type');
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!canPostToGroup(group, authUser)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await req.json();
    const validated = validateMessageInput(body);
    if (!validated.valid) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const message = await Message.create({
      content: validated.content,
      sender: authUser.userId,
      group: groupId,
      type: validated.type,
      iv: validated.iv,
      encrypted: validated.encrypted,
    });

    const populated = await message.populate('sender', 'name email avatar');
    return NextResponse.json({ message: populated }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
