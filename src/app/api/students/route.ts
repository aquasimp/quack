import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const minCgpa = searchParams.get('minCgpa');
    const skills = searchParams.get('skills');

    const filter: Record<string, unknown> = {};
    if (branch) filter.branch = branch;
    if (minCgpa) filter.cgpa = { $gte: parseFloat(minCgpa) };
    if (skills) filter.skills = { $all: skills.split(',').map(s => s.trim()) };

    const profiles = await Profile.find(filter)
      .populate('userId', 'name email avatar role')
      .sort({ cgpa: -1 })
      .limit(50);

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Students GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    // Ensure user exists
    await User.findById(authUser.userId);

    const profile = await Profile.findOneAndUpdate(
      { userId: authUser.userId },
      { $set: data },
      { new: true, upsert: true }
    );

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Students PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
