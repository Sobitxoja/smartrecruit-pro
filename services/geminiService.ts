
import { GoogleGenAI, Type } from "@google/genai";
import { Job, User } from "../types";

// Always use named parameter for apiKey and obtain it from process.env.GEMINI_API_KEY
export const getSmartMatch = async (job: Job, candidates: User[]) => {
  if (!candidates.length) return [];

  // Initialize inside the function to ensure the API key is available
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please check your environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const candidatesData = candidates.map(c => ({
    id: c.id,
    name: c.name,
    skills: c.skills || [],
    locations: c.preferredLocations?.map(l => `${l.city}, ${l.country} (${l.workModes.join(', ')})`).join('; ') || 'Open to relocation: ' + (c.openToRelocation ? 'Yes' : 'No'),
    experience: c.experienceList?.map(exp => 
      `${exp.position} at ${exp.company} (${exp.startMonth} ${exp.startYear} - ${exp.isCurrent ? 'Present' : `${exp.endMonth} ${exp.endYear}`}). Responsibilities: ${exp.description}`
    ).join(' | ') || (c.bio ? `Bio only: ${c.bio}` : 'No experience listed')
  }));

  const prompt = `
    Act as an expert technical recruiter. Evaluate the following candidates for the job post below.
    
    Job Title: ${job.title}
    Job Description: ${job.description}
    Requirements: ${job.requirements.join(', ')}
    Locations: ${job.locations.map(l => `${l.city}, ${l.country} (${l.workModes.join(', ')})`).join('; ')}
    
    Candidates:
    ${JSON.stringify(candidatesData)}
    
    Provide a match score (0-100) and a brief reasoning for each candidate based on their skills, location availability, and professional experience alignment with the job requirements.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              candidateId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["candidateId", "score", "reasoning"]
          }
        }
      }
    });

    // Use .text property and trim for parsing JSON
    let jsonStr = response.text?.trim() || '[]';
    
    // Strip markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Matching Error:", error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error("Gemini API key is missing or invalid. Please check your environment variables.");
    }
    return [];
  }
};
