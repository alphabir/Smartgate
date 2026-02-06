
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, RecognitionResult } from "../types.ts";

/**
 * Robust API Key recovery. 
 */
const safeGetApiKey = (): string => {
  try {
    // Check global window.process shim first, then environment
    const key = (window as any).process?.env?.API_KEY || process?.env?.API_KEY;
    if (!key) {
      console.warn("Biometric Alert: API_KEY is undefined. Gate recognition features will be offline.");
      return "";
    }
    return key;
  } catch (e) {
    return "";
  }
};

// Lazy initialization of the AI client inside service methods to prevent boot-time crashes
let aiClient: GoogleGenAI | null = null;
const getClient = () => {
  if (!aiClient) {
    const key = safeGetApiKey();
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
};

export const GeminiService = {
  async generateVisualSignature(images: string[]): Promise<string> {
    const key = safeGetApiKey();
    if (!key) throw new Error("Registry Access Denied: Biometric API Key missing.");

    const ai = getClient();
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `
      Analyze these enrollment photos for an academic identity registry. 
      Generate a technical "Academic Visual Signature" that describes this member's facial structure.
      Focus on skeletal structure, eye characteristics, and permanent marks.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [...imageParts, { text: prompt }] },
      });
      return response.text || "Unsigned Profile";
    } catch (error) {
      console.error("Enrollment Failure:", error);
      throw error;
    }
  },

  async identifyFace(frameBase64: string, members: Employee[]): Promise<RecognitionResult> {
    if (members.length === 0) return { matched: false, confidence: 0 };
    
    const key = safeGetApiKey();
    if (!key) return { matched: false, confidence: 0, message: "System Restricted: Key Missing" };

    const ai = getClient();
    const livePart = {
      inlineData: { data: frameBase64.split(',')[1], mimeType: 'image/jpeg' }
    };

    const memberContext = members.map(m => `[ID: ${m.id}, NAME: ${m.name}] BIO: ${m.visualSignature}`).join("\n");

    const prompt = `
      Compare the person in the live feed against these profiles:
      ${memberContext}
      Output ONLY JSON: { "matched": boolean, "employeeId": string | null, "confidence": number, "message": string }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [livePart, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matched: { type: Type.BOOLEAN },
              employeeId: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              message: { type: Type.STRING }
            },
            required: ["matched", "confidence"]
          }
        }
      });

      return JSON.parse(response.text || '{}') as RecognitionResult;
    } catch (error) {
      console.error("Identification Failure:", error);
      return { matched: false, confidence: 0 };
    }
  },

  async verifyLiveness(frames: string[]): Promise<{ isLive: boolean; confidence: number }> {
    const key = safeGetApiKey();
    if (!key) return { isLive: false, confidence: 0 };

    const ai = getClient();
    const imageParts = frames.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: 'image/jpeg' }
    }));

    const prompt = `Perform anti-spoofing analysis. Output JSON: { "isLive": boolean, "confidence": number }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isLive: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER }
            },
            required: ["isLive", "confidence"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Liveness Check Failure:", error);
      return { isLive: false, confidence: 0 };
    }
  }
};
