
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, RecognitionResult } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  /**
   * Enrollment (Complex Task): Uses Pro for high-precision feature extraction.
   */
  async generateVisualSignature(images: string[]): Promise<string> {
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `
      You are a world-class biometric expert. Analyze these enrollment photos. 
      Generate a technical "Visual Feature Vector" (in text form) that describes this person's permanent facial structure.
      Focus on:
      - Skeletal structure (brow ridge, jawline, cheekbones)
      - Eye characteristics (inter-pupillary distance, fold type)
      - Nose geometry (bridge width, tip shape)
      - Any permanent identifying marks.
      
      This signature will be used to identify them in low light or from different angles.
      BE CONCISE, TECHNICAL, AND STRUCTURED.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro for enrollment accuracy
        contents: { parts: [...imageParts, { text: prompt }] },
      });
      return response.text || "No signature generated";
    } catch (error) {
      console.error("Gemini Enrollment Error:", error);
      throw error;
    }
  },

  /**
   * Identification (Speed Task): Uses Flash for real-time gate responses.
   */
  async identifyFace(frameBase64: string, employees: Employee[]): Promise<RecognitionResult> {
    if (employees.length === 0) return { matched: false, confidence: 0 };

    const livePart = {
      inlineData: { data: frameBase64.split(',')[1], mimeType: 'image/jpeg' }
    };

    const employeeContext = employees.map(e => `[ID: ${e.id}, NAME: ${e.name}] FEATURES: ${e.visualSignature}`).join("\n");

    const prompt = `
      Compare the person in the current live frame against these registered profiles:
      ${employeeContext}

      Perform a high-confidence match. Consider facial expression changes.
      Output ONLY a JSON object:
      {
        "matched": boolean,
        "employeeId": string | null,
        "confidence": number (0-1),
        "message": "Reasoning"
      }
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
      console.error("Gemini Identification Error:", error);
      return { matched: false, confidence: 0 };
    }
  },

  /**
   * Liveness Detection: Temporal analysis for anti-spoofing.
   */
  async verifyLiveness(frames: string[]): Promise<{ isLive: boolean; confidence: number }> {
    const imageParts = frames.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: 'image/jpeg' }
    }));

    const prompt = `
      Analyze this burst of frames. Detect spoofing attempts:
      1. Screen reflection or moiré patterns (indicating a phone/monitor).
      2. Static edges (indicating a printed photo).
      3. Lack of eye-blinking or natural head micro-shifts.
      
      Output JSON: { "isLive": boolean, "confidence": number }
    `;

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
      console.error("Liveness Error:", error);
      return { isLive: false, confidence: 0 };
    }
  }
};
