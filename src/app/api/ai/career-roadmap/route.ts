import { NextRequest, NextResponse } from 'next/server';
import { generateCareerRoadmap } from '@/lib/ai/careerAdvisor';

export async function POST(req: NextRequest) {
  try {
    const { profile, targetRole } = await req.json();

    if (!profile || !targetRole) {
      return NextResponse.json({ error: 'Profile and target role are required' }, { status: 400 });
    }

    const roadmap = await generateCareerRoadmap(profile, targetRole);
    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error('Career roadmap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
