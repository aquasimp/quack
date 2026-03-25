import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Folder from '@/lib/models/Folder';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
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

    await connectDB();
    const { name, icon, description, visibility } = await req.json();

    const folder = await Folder.create({
      name,
      icon: icon || '📁',
      description,
      createdBy: authUser.userId,
      visibility: visibility || 'public',
    });

    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    console.error('Folders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
