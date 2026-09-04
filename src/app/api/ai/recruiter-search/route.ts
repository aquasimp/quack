import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import { parseRecruiterQuery } from '@/lib/ai/recruiterQuery';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { sanitizeRecruiterFilter } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!['recruiter', 'tpo', 'faculty'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Rate limiting: 20 AI searches per minute per user
    const rl = rateLimit(`recruiter-ai:${authUser.userId}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'AI search rate limit exceeded. Please wait before querying again.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (query.trim().length > 500) {
      return NextResponse.json({ error: 'Search query exceeds maximum length (500 characters)' }, { status: 400 });
    }

    await connectDB();
    const rawFilter = await parseRecruiterQuery(query);
    // Defense-in-depth: guarantee sanitized filter
    const filter = sanitizeRecruiterFilter(rawFilter);

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
