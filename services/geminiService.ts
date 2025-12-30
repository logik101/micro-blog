
import { GoogleGenAI, Type } from "@google/genai";
import { BlogPost, Language } from "../types";

/**
 * GeminiService is now used only for the Admin Dashboard to help 
 * content creators generate posts. It is not used by readers,
 * ensuring zero API costs for normal blog traffic.
 */
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates a complete blog post structure from a given topic using Gemini.
   */
  async generateBlogPost(topic: string): Promise<Partial<BlogPost>> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write a compelling and professional blog post about: ${topic}. 
        Return ONLY a JSON object with the following fields: 
        title, excerpt, description, and content (Markdown).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              description: { type: Type.STRING },
              content: { type: Type.STRING },
            },
            required: ["title", "excerpt", "description", "content"],
          },
        },
      });

      const jsonStr = response.text || "{}";
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error("AI blog generation failed:", error);
      throw error;
    }
  }

  /**
   * Translates a blog post's metadata and content into a target language.
   */
  async translateBlogPost(post: { title: string, excerpt?: string, content: string }, targetLang: Language): Promise<any> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following blog post content to ${targetLang}:
        Title: ${post.title}
        Excerpt: ${post.excerpt || ''}
        Content: ${post.content}
        Return ONLY a JSON object with the following fields: title, excerpt, content.`,
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

      const jsonStr = response.text || "{}";
      return JSON.parse(jsonStr.trim());
    } catch (error) {
      console.error("AI translation failed:", error);
      throw error;
    }
  }
}

export const gemini = new GeminiService();
