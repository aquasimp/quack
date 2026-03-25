import { generateContent } from './gemini';

export async function parseRecruiterQuery(query: string): Promise<Record<string, unknown>> {
  const prompt = `You are a query parser. Convert a natural language recruiter search query into a MongoDB filter object.

Available fields:
- branch (string): e.g. "CSE", "ECE", "ME", "IT", "EE"
- cgpa (number): 0-10 scale
- skills (string array): technical skills
- semester (number): 1-8

Query: "${query}"

Respond ONLY with valid JSON MongoDB filter (no markdown, no code blocks). Examples:
- "CSE students with CGPA above 8" → {"branch":"CSE","cgpa":{"$gte":8}}
- "students with Python and ML skills" → {"skills":{"$all":["Python","Machine Learning"]}}
- "ECE students semester 6+" → {"branch":"ECE","semester":{"$gte":6}}`;

  try {
    const response = await generateContent(prompt);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}
