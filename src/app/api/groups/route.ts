import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Group from '@/lib/models/Group';
import Folder from '@/lib/models/Folder';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

const VALID_GROUP_TYPES = ['academic', 'placement', 'sports', 'cultural', 'hostel', 'general'] as const;

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(authUser.userId);

    // Scoped visibility filter:
    // - TPO/Faculty have campus-wide visibility over their academic/placement domains
    // - Students see groups they belong to, manage, or public 'general' groups
    const filter: Record<string, unknown> = {};
    if (!['tpo', 'faculty'].includes(authUser.role)) {
      filter.$or = [
        { members: userId },
        { admins: userId },
        { createdBy: userId },
        { type: 'general' },
      ];
    }

    const groups = await Group.find(filter)
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

    // Rate limiting: 10 group creations per minute
    const rl = rateLimit(`group-create:${authUser.userId}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many groups created. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { name, description, folderId, type } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const safeName = name.trim().slice(0, 100);
    const safeDesc = typeof description === 'string' ? description.trim().slice(0, 500) : '';
    const safeType = VALID_GROUP_TYPES.includes(type) ? type : 'general';

    if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
      return NextResponse.json({ error: 'Invalid folder ID' }, { status: 400 });
    }

    await connectDB();

    // Verify folder exists if provided
    if (folderId) {
      const folderExists = await Folder.findById(folderId);
      if (!folderExists) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }
    }

    const group = await Group.create({
      name: safeName,
      description: safeDesc,
      folder: folderId || undefined,
      type: safeType,
      members: [authUser.userId],
      admins: [authUser.userId],
      createdBy: authUser.userId,
    });

    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, { $push: { groups: group._id } });
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Groups POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
