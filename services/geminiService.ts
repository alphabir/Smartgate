
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, RecognitionResult } from "../types";

// Safety check for API Key to avoid "process is not defined" or null errors in browser
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const GeminiService = {
  /**
   * Enrollment: Uses Pro for high-precision feature extraction.
   */
  async generateVisualSignature(images: string[]): Promise<string> {
    const key = getApiKey();
    if (!key) throw new Error("Missing API Key for College Advisor Biometrics");

    const imageParts = images.map(img => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `
      You are a world-class biometric expert for "The College Advisor" campus security system. 
      Analyze these enrollment photos for an academic identity registry. 
      Generate a technical "Academic Visual Signature" (text vector) that describes this member's permanent facial structure.
      Focus on:
      - Skeletal structure (brow ridge, jawline, cheekbones)
      - Eye characteristics (inter-pupillary distance, fold type)
      - Nose geometry (bridge width, tip shape)
      - Permanent identifying marks.
      
      This signature will be used to authorize campus entry under varied lighting and angles.
      BE CONCISE, TECHNICAL, AND STRUCTURED.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts: [...imageParts, { text: prompt }] },
      });
      return response.text || "No signature generated";
    } catch (error) {
      console.error("Advisor Enrollment Error:", error);
      throw error;
    }
  },

  /**
   * Identification: Uses Flash for real-time gate responses.
   */
  async identifyFace(frameBase64: string, members: Employee[]): Promise<RecognitionResult> {
    if (members.length === 0) return { matched: false, confidence: 0 };
    const key = getApiKey();
    if (!key) return { matched: false, confidence: 0, message: "System Offline: Key Missing" };

    const livePart = {
      inlineData: { data: frameBase64.split(',')[1], mimeType: 'image/jpeg' }
    };

    const memberContext = members.map(m => `[REGISTRY_ID: ${m.id}, NAME: ${m.name}] BIO_VECTOR: ${m.visualSignature}`).join("\n");

    const prompt = `
      "The College Advisor" Gate Logic:
      Compare the person in the live campus feed against these institutional profiles:
      ${memberContext}

      Perform a high-confidence match. Output ONLY a JSON object:
      {
        "matched": boolean,
        "employeeId": string | null,
        "confidence": number (0-1),
        "message": "Identification rationale"
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
      console.error("Advisor Identification Error:", error);
      return { matched: false, confidence: 0 };
    }
  },

  /**
   * Liveness Detection: Temporal analysis for anti-spoofing.
   */
  async verifyLiveness(frames: string[]): Promise<{ isLive: boolean; confidence: number }> {
    const key = getApiKey();
    if (!key) return { isLive: false, confidence: 0 };

    const imageParts = frames.map(img => ({
      inlineData: { data: img.split(',')[1], mimeType: 'image/jpeg' }
    }));

    const prompt = `
      Campus Gate Security Protocol: Anti-spoofing analysis.
      Analyze these frames for signs of printed photos, digital screens, or lack of physiological movement.
      
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
      console.error("Advisor Liveness Error:", error);
      return { isLive: false, confidence: 0 };
    }
  }
};
