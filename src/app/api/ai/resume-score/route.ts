import { NextRequest, NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/ai/resumeAnalyzer';
import { getAuthUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limiting: 10 resume analyses per minute per user
    const rl = rateLimit(`resume-ai:${authUser.userId}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Resume analysis rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.reset) } }
      );
    }

    const { resumeText, targetRole } = await req.json();

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Valid resume text is required (minimum 50 characters)' },
        { status: 400 }
      );
    }

    if (resumeText.length > 30_000) {
      return NextResponse.json(
        { error: 'Resume text exceeds maximum length (30,000 characters)' },
        { status: 400 }
      );
    }

    const safeTargetRole = typeof targetRole === 'string' ? targetRole.trim().slice(0, 100) : undefined;

    const analysis = await analyzeResume(resumeText, safeTargetRole);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Resume score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
