
import React from 'react';
import { Language } from './types';

export const POSTS_PER_PAGE = 6;

export const DEFAULT_BLOG_IMAGES = [
  "https://raw.githubusercontent.com/logik101/microF/main/d1.jpg",
  "https://raw.githubusercontent.com/logik101/microF/main/d2.jpg",
  "https://raw.githubusercontent.com/logik101/microF/main/d3.jpg",
  "https://raw.githubusercontent.com/logik101/microF/main/d4.png"
];

/**
 * Returns the post image or a deterministic fallback based on the post ID
 */
export const getPostImage = (post: { imageUrl?: string; id: string }): string => {
  if (post.imageUrl && post.imageUrl.trim() !== "") return post.imageUrl;
  
  // Use post ID to consistently pick the same random image for a specific post
  const idString = post.id || "0";
  let hash = 0;
  for (let i = 0; i < idString.length; i++) {
    hash = ((hash << 5) - hash) + idString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % DEFAULT_BLOG_IMAGES.length;
  return DEFAULT_BLOG_IMAGES[index];
};

export const TRANSLATIONS: Record<Language, any> = {
  en: {
    blog: "Blog",
    heroSubtitle: "Insights and analysis on the future of microfinance and technology.",
    searchPlaceholder: "Search articles, authors, topics...",
    noResults: "No results found",
    backToPosts: "Back to all posts",
    share: "SHARE",
    readTime: "read",
    adminPortal: "Admin Portal",
    adminSubtitle: "Secure access for editors",
    username: "Username",
    password: "Password",
    signIn: "Sign In",
    backToPublic: "Return to public site",
    credentials: "Demo",
    dashboard: "Dashboard",
    newPost: "New Post",
    logout: "Log out",
    recentPosts: "Recent Posts",
    status: "Status",
    published: "Published",
    draft: "Draft",
    aiAssistant: "AI Writer",
    aiAssistantDesc: "Enter a topic to generate a professional draft.",
    topicLabel: "Blog Topic",
    topicPlaceholder: "e.g., The impact of AI on digital banking",
    generating: "Generating...",
    magicGen: "Generate Draft",
    poweredBy: "Powered by Gemini AI",
    translating: "Translating...",
    translateAction: "Translate",
    publishAction: "Publish",
    unpublishAction: "Unpublish",
    suggestedPosts: "Suggested for you",
    continueReading: "Continue Reading",
    sortBy: "Sort by",
    newest: "Newest First",
    oldest: "Oldest First",
    prev: "Previous",
    next: "Next"
  },
  fr: {
    blog: "Le Blog",
    heroSubtitle: "Perspectives et analyses sur l'avenir de la microfinance et de la technologie.",
    searchPlaceholder: "Rechercher des articles, auteurs, catégories...",
    noResults: "Aucun résultat trouvé",
    backToPosts: "Retour à tous les articles",
    share: "PARTAGER",
    readTime: "lecture",
    adminPortal: "Portail Admin",
    adminSubtitle: "Accès sécurisé pour les éditeurs",
    username: "Identifiant",
    password: "Mot de passe",
    signIn: "Se connecter",
    backToPublic: "Retour au site public",
    credentials: "Démo",
    dashboard: "Tableau de bord",
    newPost: "Nouvel Article",
    logout: "Déconnexion",
    recentPosts: "Articles Récents",
    status: "Statut",
    published: "Publié",
    draft: "Brouillon",
    aiAssistant: "Assistant IA",
    aiAssistantDesc: "Saisissez un sujet pour générer un brouillon professionnel.",
    topicLabel: "Sujet du blog",
    topicPlaceholder: "ex: L'impact de l'IA sur la banque numérique",
    generating: "Génération...",
    magicGen: "Générer Brouillon",
    poweredBy: "Propulsé par Gemini AI",
    translating: "Traduction...",
    translateAction: "Truire",
    publishAction: "Publier",
    unpublishAction: "Dépublier",
    suggestedPosts: "Articles suggérés",
    continueReading: "Continuer la lecture",
    sortBy: "Trier par",
    newest: "Plus récent",
    oldest: "Plus ancien",
    prev: "Précédent",
    next: "Suivant"
  }
};

export const Icons = {
  Facebook: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  ),
  Twitter: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ),
  LinkedIn: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-blue-700 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>
  ),
  WhatsApp: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-green-500 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  ),
  Instagram: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-pink-600 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
  ),
  TikTok: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-cyan-500 cursor-pointer" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.44-.19-.13-.37-.28-.56-.44V15c0 1.51-.43 2.94-1.29 4.14a8.15 8.15 0 0 1-5.69 3.53c-1.4.19-2.82.12-4.21-.21a8.13 8.13 0 0 1-4.82-3.86 8.14 8.14 0 0 1-1.01-6.2c.28-1.55.98-3.03 2.02-4.24a8.17 8.17 0 0 1 6.13-3.02V9.2a4.11 4.11 0 0 0-3.32 1.9 4.12 4.12 0 0 0-.25 4.54 4.14 4.14 0 0 0 4.11 2.16 4.14 4.14 0 0 0 3.32-3.31c.14-.84.1-1.69.1-2.54V.02z"/></svg>
  ),
  Link: () => (
    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
  )
};
