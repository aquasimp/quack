import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';
import { validateProfileUpdate } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch');
    const minCgpa = searchParams.get('minCgpa');
    const skills = searchParams.get('skills');

    const filter: Record<string, unknown> = {};

    if (branch && typeof branch === 'string') {
      const sanitizedBranch = branch.trim().slice(0, 30);
      if (/^[A-Za-z0-9\s-]{1,30}$/.test(sanitizedBranch)) {
        filter.branch = sanitizedBranch;
      }
    }

    if (minCgpa) {
      const parsedCgpa = parseFloat(minCgpa);
      if (!isNaN(parsedCgpa) && parsedCgpa >= 0 && parsedCgpa <= 10) {
        filter.cgpa = { $gte: parsedCgpa };
      }
    }

    if (skills) {
      const sanitizedSkills = skills
        .split(',')
        .map((s) => s.trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 10);
      if (sanitizedSkills.length > 0) {
        filter.skills = { $all: sanitizedSkills };
      }
    }

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
    const rawData = await req.json();

    // Strict allowlist validation to eliminate mass-assignment vulnerabilities
    const validation = validateProfileUpdate(rawData);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid profile data' }, { status: 400 });
    }

    // Verify user account exists
    const user = await User.findById(authUser.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: authUser.userId },
      { $set: validation.data },
      { new: true, upsert: true }
    );

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Students PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
