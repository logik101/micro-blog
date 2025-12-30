
export interface BlogPost {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  readingTime: string;
  author: string;
  isPublished: boolean;
  translations?: Partial<Record<Language, {
    title: string;
    excerpt: string;
    content: string;
  }>>;
}

export type ViewState = 'home' | 'login' | 'dashboard' | 'editor' | 'article';

export type Language = 'en' | 'fr' | 'ht';

export interface User {
  isLoggedIn: boolean;
  username: string | null;
}
