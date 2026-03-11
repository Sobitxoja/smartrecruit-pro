import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";

export interface ExtractedResumeData {
  name: string;
  preferredRole: string;
  bio: string;
  skills: string[];
  experience: {
    id: string;
    company: string;
    position: string;
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    isCurrent: boolean;
    description: string;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    startYear: string;
    endYear: string;
    description: string;
  }[];
}

export const extractResumeData = async (file: File): Promise<ExtractedResumeData> => {
  try {
    // Initialize inside the function to ensure the API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please check your environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    let contentPart: any;

    if (file.type === "application/pdf") {
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // result is "data:application/pdf;base64,..."
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      contentPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: base64String,
        },
      };
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      contentPart = {
        text: result.value,
      };
    } else {
      throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
    }

    const prompt = `
      Extract the following information from the resume:
      - Name
      - Preferred Role (e.g., Software Engineer, Product Manager) based on the resume content or title
      - Bio (a short professional summary)
      - Skills (list of technical and soft skills)
      - Work Experience (list of jobs with company name, position, start/end dates, and description)
      - Education (list of degrees/schools with dates)

      Return the data in JSON format matching this schema:
      {
        "name": "string",
        "preferredRole": "string",
        "bio": "string",
        "skills": ["string"],
        "experience": [
          {
            "company": "string",
            "position": "string",
            "startMonth": "string",
            "startYear": "string",
            "endMonth": "string",
            "endYear": "string",
            "isCurrent": boolean,
            "description": "string"
          }
        ],
        "education": [
          {
            "institution": "string",
            "degree": "string",
            "startYear": "string",
            "endYear": "string",
            "description": "string"
          }
        ]
      }
      
      Ensure all dates are extracted accurately. If a date is "Present" or "Current", set isCurrent to true and leave endMonth/endYear empty or null.
      If specific months are not available, use "January" as default or leave empty.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [contentPart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            preferredRole: { type: Type.STRING },
            bio: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  position: { type: Type.STRING },
                  startMonth: { type: Type.STRING },
                  startYear: { type: Type.STRING },
                  endMonth: { type: Type.STRING },
                  endYear: { type: Type.STRING },
                  isCurrent: { type: Type.BOOLEAN },
                  description: { type: Type.STRING },
                },
                required: ["company", "position"],
              },
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  startYear: { type: Type.STRING },
                  endYear: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["institution", "degree"],
              },
            },
          },
          required: ["name", "experience", "education", "skills"],
        },
      },
    });

    let text = response.text?.trim();
    if (!text) {
      throw new Error("Failed to extract data from resume");
    }

    // Strip markdown code blocks if present
    if (text.startsWith('```')) {
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(text);

    // Add IDs to experience and education items
    data.experience = data.experience.map((exp: any) => ({
      ...exp,
      id: Math.random().toString(36).substr(2, 9),
    }));
    data.education = data.education.map((edu: any) => ({
      ...edu,
      id: Math.random().toString(36).substr(2, 9),
    }));

    return data;
  } catch (error) {
    console.error("Error extracting resume data:", error);
    throw error;
  }
};
