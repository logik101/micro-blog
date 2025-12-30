
export interface BlogPost {
  id: string;
  author: string;
  publicationDate: string;
  readTimeMinutes: number;
  imageUrl: string;
  // Support for both dynamic and fixed language fields
  title: string;
  description: string;
  content: string;
  excerpt?: string;
  category?: string;
  isPublished?: boolean;
  translations?: Record<string, any>;
  // Language specific overrides
  title_en?: string;
  title_fr?: string;
  description_en?: string;
  description_fr?: string;
  content_en?: string;
  content_fr?: string;
}

export type ViewState = 'home' | 'article';

export type Language = 'en' | 'fr';
