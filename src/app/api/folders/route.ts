import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Folder from '@/lib/models/Folder';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const folders = await Folder.find()
      .populate('groups')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Folders GET error:', error);
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
      return NextResponse.json({ error: 'Only TPO/Faculty can create folders' }, { status: 403 });
    }

    // Rate limit: 10 folder creations per minute
    const rl = rateLimit(`folder:${authUser.userId}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Folder creation limit exceeded. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { name, icon, description, visibility } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    const safeName = name.trim().slice(0, 100);
    const safeDesc = typeof description === 'string' ? description.trim().slice(0, 500) : '';
    const safeIcon = typeof icon === 'string' ? icon.trim().slice(0, 10) : '📁';
    const safeVisibility = visibility === 'private' ? 'private' : 'public';

    await connectDB();

    const folder = await Folder.create({
      name: safeName,
      icon: safeIcon,
      description: safeDesc,
      createdBy: authUser.userId,
      visibility: safeVisibility,
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Folders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
