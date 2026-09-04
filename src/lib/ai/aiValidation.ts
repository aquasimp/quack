import { ResumeAnalysis } from './resumeAnalyzer';
import { CareerAdvice } from './careerAdvisor';

/**
 * Validates and normalizes raw model output into a guaranteed ResumeAnalysis shape.
 */
export function validateResumeAnalysis(data: unknown): ResumeAnalysis {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      readinessScore: 0,
      identifiedSkills: [],
      missingCompetencies: [],
      strengths: [],
      weaknesses: [],
      roadmap: [],
      summary: 'Could not parse resume evaluation from model output.',
    };
  }

  const obj = data as Record<string, unknown>;

  const rawScore = typeof obj.readinessScore === 'number' ? obj.readinessScore : 0;
  const readinessScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const cleanStringArray = (arr: unknown, maxLen = 50): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().slice(0, 100))
      .filter(Boolean)
      .slice(0, maxLen);
  };

  const identifiedSkills = cleanStringArray(obj.identifiedSkills, 50);
  const missingCompetencies = cleanStringArray(obj.missingCompetencies, 50);
  const strengths = cleanStringArray(obj.strengths, 20);
  const weaknesses = cleanStringArray(obj.weaknesses, 20);

  const roadmap: { phase: string; duration: string; tasks: string[] }[] = [];
  if (Array.isArray(obj.roadmap)) {
    for (const item of obj.roadmap.slice(0, 10)) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const rItem = item as Record<string, unknown>;
        roadmap.push({
          phase: typeof rItem.phase === 'string' ? rItem.phase.trim().slice(0, 100) : 'Next Steps',
          duration: typeof rItem.duration === 'string' ? rItem.duration.trim().slice(0, 50) : 'Ongoing',
          tasks: cleanStringArray(rItem.tasks, 10),
        });
      }
    }
  }

  const summary = typeof obj.summary === 'string' ? obj.summary.trim().slice(0, 1000) : 'Assessment completed.';

  return {
    readinessScore,
    identifiedSkills,
    missingCompetencies,
    strengths,
    weaknesses,
    roadmap,
    summary,
  };
}

/**
 * Validates and normalizes raw model output into a guaranteed CareerAdvice shape.
 */
export function validateCareerAdvice(data: unknown, targetRole: string): CareerAdvice {
  const safeTargetRole = targetRole.slice(0, 100);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      currentLevel: 'Entry-level',
      targetRole: safeTargetRole,
      gapAnalysis: [],
      studyPlan: [],
      recommendations: ['Review foundational requirements for target role.'],
    };
  }

  const obj = data as Record<string, unknown>;

  const currentLevel = typeof obj.currentLevel === 'string'
    ? obj.currentLevel.trim().slice(0, 50)
    : 'Entry-level';

  const gapAnalysis: { area: string; current: string; required: string }[] = [];
  if (Array.isArray(obj.gapAnalysis)) {
    for (const item of obj.gapAnalysis.slice(0, 10)) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const gItem = item as Record<string, unknown>;
        gapAnalysis.push({
          area: typeof gItem.area === 'string' ? gItem.area.trim().slice(0, 100) : 'General',
          current: typeof gItem.current === 'string' ? gItem.current.trim().slice(0, 100) : 'Needs development',
          required: typeof gItem.required === 'string' ? gItem.required.trim().slice(0, 100) : 'Proficient',
        });
      }
    }
  }

  const studyPlan: { week: string; focus: string; resources: string[] }[] = [];
  if (Array.isArray(obj.studyPlan)) {
    for (const item of obj.studyPlan.slice(0, 12)) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const sItem = item as Record<string, unknown>;
        const resources = Array.isArray(sItem.resources)
          ? sItem.resources
              .filter((r): r is string => typeof r === 'string')
              .map((r) => r.trim().slice(0, 150))
              .slice(0, 5)
          : [];
        studyPlan.push({
          week: typeof sItem.week === 'string' ? sItem.week.trim().slice(0, 50) : 'Week 1',
          focus: typeof sItem.focus === 'string' ? sItem.focus.trim().slice(0, 150) : 'Fundamentals',
          resources,
        });
      }
    }
  }

  const recommendations = Array.isArray(obj.recommendations)
    ? obj.recommendations
        .filter((r): r is string => typeof r === 'string')
        .map((r) => r.trim().slice(0, 300))
        .slice(0, 10)
    : ['Continue building hands-on projects.'];

  return {
    currentLevel,
    targetRole: safeTargetRole,
    gapAnalysis,
    studyPlan,
    recommendations,
  };
}
