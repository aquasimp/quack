import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import { parseRecruiterQuery } from '@/lib/ai/recruiterQuery';

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    await connectDB();
    const filter = await parseRecruiterQuery(query);
    const profiles = await Profile.find(filter)
      .populate('userId', 'name email avatar role')
      .sort({ cgpa: -1 })
      .limit(50);

    return NextResponse.json({ profiles, appliedFilter: filter });
  } catch (error) {
    console.error('Recruiter search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
