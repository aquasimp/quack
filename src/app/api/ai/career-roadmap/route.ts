import { NextRequest, NextResponse } from 'next/server';
import { generateCareerRoadmap } from '@/lib/ai/careerAdvisor';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limiting: 10 roadmaps per minute per user
    const rl = rateLimit(`roadmap-ai:${authUser.userId}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Career roadmap generation rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const { profile, targetRole } = await req.json();

    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      return NextResponse.json({ error: 'A valid student profile object is required' }, { status: 400 });
    }

    if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }

    const safeTargetRole = targetRole.trim().slice(0, 100);

    const roadmap = await generateCareerRoadmap(profile, safeTargetRole);
    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error('Career roadmap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
