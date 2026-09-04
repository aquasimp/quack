import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Profile from '@/lib/models/Profile';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!['tpo', 'faculty'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const totalStudents = await User.countDocuments({ role: 'student' });
    const profiles = await Profile.find();

    const avgCgpa = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + p.cgpa, 0) / profiles.length
      : 0;

    const eligibleAbove7 = profiles.filter(p => p.cgpa >= 7).length;
    const eligibleAbove8 = profiles.filter(p => p.cgpa >= 8).length;

    // Skill distribution
    const skillMap: Record<string, number> = {};
    profiles.forEach(p => {
      p.skills.forEach((skill: string) => {
        skillMap[skill] = (skillMap[skill] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Branch distribution
    const branchMap: Record<string, number> = {};
    profiles.forEach(p => {
      if (p.branch) {
        branchMap[p.branch] = (branchMap[p.branch] || 0) + 1;
      }
    });

    const branchDistribution = Object.entries(branchMap)
      .map(([branch, count]) => ({ branch, count }));

    return NextResponse.json({
      analytics: {
        totalStudents,
        totalProfiles: profiles.length,
        avgCgpa: Math.round(avgCgpa * 100) / 100,
        eligibleAbove7,
        eligibleAbove8,
        topSkills,
        branchDistribution,
      },
    });
  } catch (error) {
    console.error('TPO analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
