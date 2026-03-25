import { generateContent } from './gemini';

export interface ResumeAnalysis {
  readinessScore: number;
  identifiedSkills: string[];
  missingCompetencies: string[];
  strengths: string[];
  weaknesses: string[];
  roadmap: { phase: string; duration: string; tasks: string[] }[];
  summary: string;
}

export async function analyzeResume(resumeText: string, targetRole?: string): Promise<ResumeAnalysis> {
  const prompt = `You are an expert career advisor and placement readiness analyst. Analyze the following resume text and provide a comprehensive evaluation.

${targetRole ? `Target Role: ${targetRole}` : 'General placement readiness assessment'}

Resume Text:
---
${resumeText}
---

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "readinessScore": <number 0-100>,
  "identifiedSkills": ["skill1", "skill2", ...],
  "missingCompetencies": ["competency1", "competency2", ...],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "roadmap": [
    {
      "phase": "Phase name",
      "duration": "X weeks/months",
      "tasks": ["task1", "task2", ...]
    }
  ],
  "summary": "Brief 2-3 sentence overall assessment"
}`;

  try {
    const response = await generateContent(prompt);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      readinessScore: 0,
      identifiedSkills: [],
      missingCompetencies: [],
      strengths: [],
      weaknesses: [],
      roadmap: [],
      summary: 'Unable to analyze resume. Please ensure your Gemini API key is configured.',
    };
  }
}
