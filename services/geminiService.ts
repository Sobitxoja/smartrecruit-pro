
import { GoogleGenAI, Type } from "@google/genai";
import { Job, User } from "../types";

// Always use named parameter for apiKey and obtain it from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartMatch = async (job: Job, candidates: User[]) => {
  if (!candidates.length) return [];

  const candidatesData = candidates.map(c => ({
    id: c.id,
    name: c.name,
    skills: c.skills || [],
    experience: c.experienceList?.map(exp => 
      `${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate}). Responsibilities: ${exp.description}`
    ).join(' | ') || (c.bio ? `Bio only: ${c.bio}` : 'No experience listed')
  }));

  const prompt = `
    Act as an expert technical recruiter. Evaluate the following candidates for the job post below.
    
    Job Title: ${job.title}
    Job Description: ${job.description}
    Requirements: ${job.requirements.join(', ')}
    
    Candidates:
    ${JSON.stringify(candidatesData)}
    
    Provide a match score (0-100) and a brief reasoning for each candidate based on their skills and professional experience alignment with the job requirements.
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
    const jsonStr = response.text?.trim() || '[]';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Matching Error:", error);
    return [];
  }
};
