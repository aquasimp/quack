import { NextRequest, NextResponse } from 'next/server';
import { analyzeResume } from '@/lib/ai/resumeAnalyzer';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, targetRole } = await req.json();

    if (!resumeText) {
      return NextResponse.json({ error: 'Resume text is required' }, { status: 400 });
    }

    const analysis = await analyzeResume(resumeText, targetRole);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Resume score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
