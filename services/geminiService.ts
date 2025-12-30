
import { GoogleGenAI, Type } from "@google/genai";
import { BlogPost, Language } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateBlogPost(topic: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a professional blog post about "${topic}" in the context of microfinance and technology.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              readingTime: { type: Type.STRING },
            },
            required: ["title", "category", "excerpt", "content", "readingTime"],
          },
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("AI Generation failed:", error);
      throw error;
    }
  }

  async translateBlogPost(post: { title: string; excerpt: string; content: string }, targetLang: Language) {
    const langNames = {
      en: 'English',
      fr: 'French',
      ht: 'Haitian Creole'
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following blog post content into ${langNames[targetLang]}. 
        Maintain the professional tone and ensure the meaning is preserved perfectly.
        
        Title: ${post.title}
        Excerpt: ${post.excerpt}
        Content: ${post.content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ["title", "excerpt", "content"],
          },
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error(`Translation to ${targetLang} failed:`, error);
      throw error;
    }
  }
}

export const gemini = new GeminiService();
