import { generateContent } from './gemini';
import { validateCareerAdvice } from './aiValidation';

export interface CareerAdvice {
  currentLevel: string;
  targetRole: string;
  gapAnalysis: { area: string; current: string; required: string }[];
  studyPlan: { week: string; focus: string; resources: string[] }[];
  recommendations: string[];
}

export async function generateCareerRoadmap(
  profile: { skills: string[]; cgpa: number; branch: string; projects: { name: string; tech: string[] }[] },
  targetRole: string
): Promise<CareerAdvice> {
  const prompt = `You are an expert career advisor. Given a student's profile, create a personalized career roadmap to achieve their target role.

Student Profile:
- Branch: ${profile.branch}
- CGPA: ${profile.cgpa}
- Skills: ${profile.skills.join(', ')}
- Projects: ${profile.projects.map(p => `${p.name} (${p.tech.join(', ')})`).join('; ')}

Target Role: ${targetRole}

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "currentLevel": "Beginner/Intermediate/Advanced",
  "targetRole": "${targetRole}",
  "gapAnalysis": [
    {"area": "Area name", "current": "Current level", "required": "Required level"}
  ],
  "studyPlan": [
    {"week": "Week 1-2", "focus": "Topic", "resources": ["resource1", "resource2"]}
  ],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

  try {
    const response = await generateContent(prompt);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return validateCareerAdvice(parsed, targetRole);
  } catch {
    return {
      currentLevel: 'Unknown',
      targetRole,
      gapAnalysis: [],
      studyPlan: [],
      recommendations: ['Please ensure your Gemini API key is configured to get personalized advice.'],
    };
  }
}
