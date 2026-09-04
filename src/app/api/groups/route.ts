import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Group from '@/lib/models/Group';
import Folder from '@/lib/models/Folder';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const groups = await Group.find()
      .populate('folder', 'name icon')
      .populate('createdBy', 'name email')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Groups GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const { name, description, folderId, type } = await req.json();

    const group = await Group.create({
      name,
      description,
      folder: folderId,
      type: type || 'general',
      members: [authUser.userId],
      admins: [authUser.userId],
      createdBy: authUser.userId,
    });

    // Add group to folder
    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, { $push: { groups: group._id } });
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Groups POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
