import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function detectPotholes(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze this road image and detect potholes. Return a JSON object with a list of detected potholes, each with a confidence score (0-1) and a severity level ('low', 'medium', 'high', 'critical'). Also provide a general summary of the road condition." },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            potholes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  confidence: { type: Type.NUMBER },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["confidence", "severity"]
              }
            },
            summary: { type: Type.STRING },
            overallSeverity: { type: Type.STRING }
          },
          required: ["potholes", "summary", "overallSeverity"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    throw error;
  }
}

export async function suggestAlternativeRoute(start: string, end: string, detectedPotholes: any[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest an alternative route from ${start} to ${end} considering these detected road damages: ${JSON.stringify(detectedPotholes)}. Provide a step-by-step navigation guide and explain why this route is safer. Return as JSON with 'steps' (array of strings) and 'safetyReason' (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            safetyReason: { type: Type.STRING },
            estimatedTime: { type: Type.STRING }
          },
          required: ["steps", "safetyReason"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Routing Error:", error);
    throw error;
  }
}
