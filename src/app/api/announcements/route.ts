import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Announcement from '@/lib/models/Announcement';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
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

    await connectDB();
    const { title, content, targetFolders, targetGroups, priority } = await req.json();

    const announcement = await Announcement.create({
      title,
      content,
      sender: authUser.userId,
      targetFolders: targetFolders || [],
      targetGroups: targetGroups || [],
      priority: priority || 'normal',
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('Announcements POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
