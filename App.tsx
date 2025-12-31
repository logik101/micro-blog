
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BlogPost, Language } from './types';
import { TRANSLATIONS, Icons, getPostImage, POSTS_PER_PAGE } from './constants';
import BlogCard from './components/BlogCard';
import LanguageSwitcher from './components/LanguageSwitcher';
import Logo from './components/Logo';
import { marked } from 'marked';

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/logik101/micro-blog/main/public/post.md";

const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[#1a3a8a]/20 text-[#1a3a8a] px-0.5 rounded-sm font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [view, setView] = useState<string>('home'); 
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const blogContainerRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`${GITHUB_RAW_URL}${cacheBuster}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      let cleanText = text.trim();
      const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) cleanText = codeBlockMatch[1];
      const jsonMatch = cleanText.match(/[{\[][\s\S]*[}\]]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        let extractedPosts: BlogPost[] = [];
        if (Array.isArray(data)) extractedPosts = data;
        else if (data.posts && Array.isArray(data.posts)) extractedPosts = data.posts;
        else if (typeof data === 'object' && data !== null) extractedPosts = [data as BlogPost];
        
        const validPosts = extractedPosts.map((p, idx) => ({
          ...p,
          id: p.id || `post-${idx}`,
          author: p.author || 'Admin',
          publicationDate: p.publicationDate || new Date().toLocaleDateString(),
          readTimeMinutes: p.readTimeMinutes || 5,
          title: p.title || p.title_fr || p.title_en || 'Untitled Post',
          description: p.description || p.description_fr || p.description_en || '',
          content: p.content || p.content_fr || p.content_en || ''
        }));
        setPosts(validPosts);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Critical error loading posts:", error);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    const handleFocus = () => fetchData(true);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    if (view === 'article') window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder, language]);

  const getLangField = (post: BlogPost, field: 'title' | 'description' | 'content'): string => {
    const key = `${field}_${language}` as keyof BlogPost;
    return (post[key] as string) || (post[field] as string) || "";
  };

  const handleArticleOpen = (id: string) => {
    setSelectedPostId(id);
    setView('article');
    setIsSearchFocused(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const parseDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return posts.map(p => {
      const title = getLangField(p, 'title');
      const desc = getLangField(p, 'description');
      const content = getLangField(p, 'content');
      const author = p.author || 'Admin';
      if (title.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || content.toLowerCase().includes(q) || author.toLowerCase().includes(q)) {
        return { post: p, title, author, type: title.toLowerCase().includes(q) ? 'title' : author.toLowerCase().includes(q) ? 'author' : 'content' };
      }
      return null;
    }).filter(Boolean) as any[];
  }, [posts, searchQuery, language]);

  const allFilteredBlogs = useMemo(() => {
    const baseList = searchQuery.trim() ? searchResults.map(r => r.post) : posts;
    return [...baseList].sort((a, b) => {
      const dateA = parseDate(a.publicationDate);
      const dateB = parseDate(b.publicationDate);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, searchResults, searchQuery, sortOrder]);

  const totalPages = Math.ceil(allFilteredBlogs.length / POSTS_PER_PAGE);
  const filteredBlogs = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return allFilteredBlogs.slice(start, start + POSTS_PER_PAGE);
  }, [allFilteredBlogs, currentPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <div className="w-10 h-10 border-4 border-[#1a3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="min-h-screen bg-[#f9fafb]">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
        <Logo className="cursor-pointer" size="sm" showText={false} />
        <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
      </nav>

      <header className="max-w-4xl mx-auto text-center py-12 md:py-24 px-6">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-[#111827] mb-4 sm:mb-6 tracking-tight leading-tight">{t.blog}</h1>
        <p className="text-gray-500 text-base sm:text-lg md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">{t.heroSubtitle}</p>

        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4" ref={searchRef}>
          <div className="relative flex-1 w-full">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text"
              className={`w-full bg-white border-2 rounded-xl sm:rounded-2xl px-5 py-3 sm:py-4 pl-12 sm:pl-14 shadow-sm focus:outline-none focus:border-[#1a3a8a] focus:ring-4 focus:ring-[#1a3a8a]/5 transition-all font-medium text-sm sm:text-base text-gray-900 ${isSearchFocused ? 'border-[#1a3a8a]' : 'border-gray-100'}`}
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[60vh] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 font-medium text-sm">{t.noResults}</div>
                  ) : (
                    searchResults.map(({ post, title, author, type }) => (
                      <button
                        key={post.id}
                        onClick={() => handleArticleOpen(post.id)}
                        className="w-full text-left px-5 py-3 sm:px-6 sm:py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                            <img src={getPostImage(post)} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-gray-900 truncate group-hover:text-[#1a3a8a] transition-colors">
                              <HighlightText text={title} query={searchQuery} />
                            </h4>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 font-medium">
                              <HighlightText text={author} query={searchQuery} /> • {post.publicationDate}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 shadow-sm shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.sortBy}:</span>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-xs sm:text-sm font-bold text-gray-900 focus:outline-none cursor-pointer flex-1 sm:flex-none"
            >
              <option value="newest">{t.newest}</option>
              <option value="oldest">{t.oldest}</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24" ref={blogContainerRef}>
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-400">{t.noResults}</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              {filteredBlogs.map(p => (
                <BlogCard 
                  key={p.id} 
                  post={{
                    ...p,
                    title: getLangField(p, 'title'),
                    description: getLangField(p, 'description'),
                    content: getLangField(p, 'content')
                  }} 
                  language={language}
                  highlightQuery={searchQuery}
                  onShowToast={showToast}
                  onClick={() => handleArticleOpen(p.id)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 sm:mt-20 flex flex-wrap justify-center items-center gap-3">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                    currentPage === 1 ? 'text-gray-300 border-gray-100' : 'text-[#1a3a8a] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.prev}
                </button>
                <div className="flex gap-1.5 sm:gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-sm transition-all ${
                        currentPage === page ? 'bg-[#1a3a8a] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                    currentPage === totalPages ? 'text-gray-300 border-gray-100' : 'text-[#1a3a8a] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t.next}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="py-12 text-center border-t border-gray-100 px-6">
        <p className="text-gray-400 text-xs sm:text-sm font-medium mb-2">© 2025 MicroFormS Blog</p>
        <div className="flex justify-center items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[9px] sm:text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {language === 'fr' ? 'Mis à jour en direct' : 'Live updates active'} • {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  );

  const renderArticle = () => {
    const post = posts.find(p => p.id === selectedPostId);
    if (!post) return null;
    const title = getLangField(post, 'title');
    const content = getLangField(post, 'content');
    
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-gray-100">
          <div className="h-full bg-[#1a3a8a] transition-all duration-150 ease-out" style={{ width: `${scrollProgress}%` }} />
        </div>

        <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-1 z-50">
          <button onClick={() => setView('home')} className="group text-xs sm:text-sm font-bold text-gray-500 flex items-center hover:text-[#1a3a8a]">
            <span className="mr-1.5 sm:mr-2 group-hover:-translate-x-1 transition-transform">←</span> {t.backToPosts}
          </button>
          <Logo showText={false} size="sm" />
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
        </nav>
        
        <article className="max-w-4xl mx-auto py-8 sm:py-16 px-4 sm:px-6">
          <header className="mb-10 sm:mb-16 text-center">
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
              <span className="bg-blue-50 text-[#1a3a8a] text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Article</span>
              <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{post.publicationDate}</span>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <span className="text-gray-400 text-[10px] sm:text-xs font-medium">{post.readTimeMinutes} min {t.readTime}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-gray-900 mb-8 sm:mb-10 leading-[1.15] tracking-tight">
              {title}
            </h1>

            <div className="flex justify-center items-center gap-3 sm:gap-4 mb-10 sm:mb-12">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-[#1a3a8a] to-blue-500 rounded-full flex items-center justify-center text-white font-black text-base sm:text-lg shadow-lg">
                 {post.author.charAt(0)}
               </div>
               <div className="text-left">
                 <div className="text-xs sm:text-sm font-black text-gray-900">{post.author}</div>
                 <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Expert Microfinance</div>
               </div>
            </div>

            <div className="rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 aspect-[16/9]">
              <img src={getPostImage(post)} alt={title} className="w-full h-full object-cover" />
            </div>
          </header>

          <div className="max-w-2xl mx-auto">
            <div 
              className="prose prose-sm sm:prose-lg md:prose-xl prose-blue max-w-none text-gray-700 leading-relaxed font-medium mb-12 sm:mb-20 overflow-x-hidden"
              dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
            />

            <div className="bg-gray-50 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 border border-gray-100 mb-12 sm:mb-16">
               <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1a3a8a] rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                 {post.author.charAt(0)}
               </div>
               <div>
                 <h4 className="text-base sm:text-lg font-black text-gray-900 mb-1 sm:mb-2">{post.author}</h4>
                 <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                   Expert en solutions numériques favorisant l'inclusion financière.
                 </p>
               </div>
            </div>
            
            <button 
              onClick={() => setView('home')}
              className="w-full bg-[#111827] text-white py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-black transition-all"
            >
              {t.backToPosts}
            </button>
          </div>
        </article>
      </div>
    );
  };

  /**
   * Helper function to render the appropriate content based on current view state
   * Fixes: Cannot find name 'renderContent'.
   */
  const renderContent = () => {
    switch (view) {
      case 'home':
        return renderHome();
      case 'article':
        return renderArticle();
      default:
        return renderHome();
    }
  };

  return (
    <>
      {renderContent()}
      {toast && (
        <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 w-[90%] sm:w-auto justify-center">
          {toast}
        </div>
      )}
    </>
  );
};

export default App;
