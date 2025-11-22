import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisType, AnalysisResult, Language } from '../types';

// NOTE: API KEY usage here assumes process.env.API_KEY is available.
// In a real build system, this is injected.
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY
});


const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    condition: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    nextActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['condition', 'recommendations', 'nextActions']
};

export const analyzeImage = async (
  base64Image: string,
  type: AnalysisType,
  language: Language,
  weatherInfo?: string
): Promise<AnalysisResult> => {
  const modelName = 'gemini-2.5-flash';
  
  const typeText = type === AnalysisType.CROP ? 'crop plant' : 'soil sample';
  const langText = language === Language.HINDI ? 'Hindi (Devanagari script)' : 'English';
  
  const weatherContext = weatherInfo ? `Current local weather: ${weatherInfo}. Consider this in your analysis.` : '';

  const prompt = `
    Analyze this image of a ${typeText}. 
    ${weatherContext}
    Provide a health assessment/condition, specific recommendations for improvement or treatment, and immediate next actions for the farmer.
    Output must be in ${langText}.
    If the image does not look like a ${typeText}, state that in the condition field.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        systemInstruction: "You are an expert agricultural agronomist and soil scientist."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};