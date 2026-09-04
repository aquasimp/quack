import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Announcement from '@/lib/models/Announcement';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const announcements = await Announcement.find()
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Announcements GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!['tpo', 'faculty'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Only TPO/Faculty can create announcements' }, { status: 403 });
    }

    // Rate limit: 10 announcements per minute
    const rl = rateLimit(`announce:${authUser.userId}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Announcement creation limit exceeded. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { title, content, targetFolders, targetGroups, priority } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Announcement title is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Announcement content is required' }, { status: 400 });
    }

    const safeTitle = title.trim().slice(0, 200);
    const safeContent = content.trim().slice(0, 5000);
    const safePriority = priority === 'urgent' ? 'urgent' : 'normal';

    const safeFolders = Array.isArray(targetFolders)
      ? targetFolders.filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
      : [];
    const safeGroups = Array.isArray(targetGroups)
      ? targetGroups.filter((id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
      : [];

    await connectDB();

    const announcement = await Announcement.create({
      title: safeTitle,
      content: safeContent,
      sender: authUser.userId,
      targetFolders: safeFolders,
      targetGroups: safeGroups,
      priority: safePriority,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Announcements POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
