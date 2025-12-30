
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BlogPost, Language } from './types';
import { TRANSLATIONS, Icons, getPostImage, POSTS_PER_PAGE } from './constants';
import BlogCard from './components/BlogCard';
import LanguageSwitcher from './components/LanguageSwitcher';
import Logo from './components/Logo';
import { marked } from 'marked';

// Using the raw content URL to ensure fetch works correctly with JSON data
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
  const [view, setView] = useState<string>('home'); // home, article
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
      // Append timestamp to URL to bypass browser and CDN caching for instant updates
      const cacheBuster = `?t=${Date.now()}`;
      const response = await fetch(`${GITHUB_RAW_URL}${cacheBuster}`);
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const text = await response.text();
      
      let cleanText = text.trim();
      // Handle potential markdown code block wrappers in post.md
      const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanText = codeBlockMatch[1];
      }
      
      const jsonMatch = cleanText.match(/[{\[][\s\S]*[}\]]/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        let extractedPosts: BlogPost[] = [];
        
        if (Array.isArray(data)) {
          extractedPosts = data;
        } else if (data.posts && Array.isArray(data.posts)) {
          extractedPosts = data.posts;
        } else if (typeof data === 'object' && data !== null) {
          extractedPosts = [data as BlogPost];
        }
        
        const validPosts = extractedPosts.map((p, idx) => {
          const id = p.id || `post-${idx}`;
          return {
            ...p,
            id,
            author: p.author || 'Admin',
            publicationDate: p.publicationDate || new Date().toLocaleDateString(),
            readTimeMinutes: p.readTimeMinutes || 5,
            title: p.title || p.title_fr || p.title_en || 'Untitled Post',
            description: p.description || p.description_fr || p.description_en || '',
            content: p.content || p.content_fr || p.content_en || ''
          };
        });
        
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
    // Poll every 10 seconds to detect new additions immediately
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);
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
    if (view === 'article') {
      window.addEventListener('scroll', handleScroll);
    }
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
      
      const titleMatch = title.toLowerCase().includes(q);
      const descMatch = desc.toLowerCase().includes(q);
      const contentMatch = content.toLowerCase().includes(q);
      const authorMatch = author.toLowerCase().includes(q);

      if (titleMatch || descMatch || contentMatch || authorMatch) {
        let snippet = "";
        let matchedType = 'title';
        
        if (authorMatch) {
          matchedType = 'author';
        } else if (titleMatch) {
          matchedType = 'title';
        } else if (descMatch) {
          matchedType = 'description';
        } else if (contentMatch) {
          matchedType = 'content';
          const index = content.toLowerCase().indexOf(q);
          const start = Math.max(0, index - 40);
          const end = Math.min(content.length, index + q.length + 40);
          snippet = (start > 0 ? "..." : "") + content.substring(start, end).replace(/[\n\r]/g, " ") + (end < content.length ? "..." : "");
        }
        
        return { post: p, title, snippet, author, type: matchedType };
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (blogContainerRef.current) {
      blogContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Chargement...</p>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="min-h-screen bg-[#f9fafb]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <a href="https://microforms.org" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
            <Logo className="cursor-pointer" size="md" showText={false} />
          </a>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
      </nav>

      <header className="max-w-4xl mx-auto text-center py-24 px-6">
        <h1 className="text-5xl md:text-6xl font-black text-[#111827] mb-6 tracking-tight">{t.blog}</h1>
        <p className="text-gray-500 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">{t.heroSubtitle}</p>

        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4" ref={searchRef}>
          <div className="relative flex-1 w-full">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
              type="text"
              className={`w-full bg-white border-2 rounded-2xl px-6 py-4 pl-14 shadow-sm focus:outline-none focus:border-[#1a3a8a] focus:ring-4 focus:ring-[#1a3a8a]/5 transition-all font-medium text-gray-900 ${isSearchFocused ? 'border-[#1a3a8a]' : 'border-gray-100'}`}
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[400px] overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 font-medium">{t.noResults}</div>
                  ) : (
                    searchResults.map(({ post, title, snippet, author, type }) => (
                      <button
                        key={post.id}
                        onClick={() => handleArticleOpen(post.id)}
                        className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                            <img src={getPostImage(post)} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-gray-900 truncate group-hover:text-[#1a3a8a] transition-colors">
                              <HighlightText text={title} query={searchQuery} />
                            </h4>
                            {snippet ? (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic font-medium">
                                "<HighlightText text={snippet} query={searchQuery} />"
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1 font-medium">
                                <HighlightText text={author} query={searchQuery} /> • {post.publicationDate}
                              </p>
                            )}
                          </div>
                          <div className={`text-[10px] font-black uppercase tracking-widest ${type === 'author' ? 'text-blue-500' : 'text-gray-300'} group-hover:text-blue-200`}>
                            {type}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white border-2 border-gray-100 rounded-2xl px-4 py-4 shadow-sm shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t.sortBy}:</span>
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none cursor-pointer"
            >
              <option value="newest">{t.newest}</option>
              <option value="oldest">{t.oldest}</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24" ref={blogContainerRef}>
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-400">{t.noResults}</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
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
              <div className="mt-20 flex justify-center items-center gap-3">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    currentPage === 1 
                      ? 'text-gray-300 border-gray-100 cursor-not-allowed' 
                      : 'text-[#1a3a8a] border border-gray-200 hover:bg-gray-50 active:scale-95'
                  }`}
                >
                  {t.prev}
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                        currentPage === page
                          ? 'bg-[#1a3a8a] text-white shadow-lg shadow-blue-900/20'
                          : 'text-gray-400 hover:bg-gray-50 border border-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    currentPage === totalPages 
                      ? 'text-gray-300 border-gray-100 cursor-not-allowed' 
                      : 'text-[#1a3a8a] border border-gray-200 hover:bg-gray-50 active:scale-95'
                  }`}
                >
                  {t.next}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="py-12 text-center border-t border-gray-100">
        <p className="text-gray-400 text-sm font-medium mb-2">© 2025 MicroFormS Blog</p>
        <div className="flex justify-center items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
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
    const postImage = getPostImage(post);
    const shareUrl = window.location.href;
    const shareText = `${title} - MicroFormS`;

    const handleShare = async (platform: string) => {
      let url = '';
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedText = encodeURIComponent(shareText);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (platform === 'native' && navigator.share) {
        try {
          await navigator.share({ title: shareText, url: shareUrl });
          return;
        } catch (e) {
          return;
        }
      }

      await navigator.clipboard.writeText(shareUrl);

      switch (platform) {
        case 'facebook': 
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`; 
          break;
        case 'twitter': 
          url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`; 
          break;
        case 'linkedin': 
          url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`; 
          break;
        case 'whatsapp': 
          url = isMobile ? `whatsapp://send?text=${encodedText}%20${encodedUrl}` : `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`; 
          break;
        case 'copy':
          showToast(language === 'fr' ? 'Lien copié !' : 'Link copied!');
          return;
        default:
          showToast(language === 'fr' ? 'Lien copié !' : 'Link copied!');
          return;
      }

      if (url) {
        if (isMobile && platform === 'whatsapp') {
          window.location.href = url;
        } else {
          const win = window.open(url, '_blank', 'noopener,noreferrer');
          if (!win && platform !== 'whatsapp') showToast(language === 'fr' ? 'Lien copié !' : 'Link copied!');
        }
      }
    };

    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-gray-100">
          <div 
            className="h-full bg-[#1a3a8a] transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-1 z-50">
          <button 
            onClick={() => setView('home')} 
            className="group text-sm font-bold text-gray-500 flex items-center hover:text-[#1a3a8a] transition-colors"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> {t.backToPosts}
          </button>
          <a href="https://microforms.org" target="_blank" rel="noopener noreferrer" className="hover:opacity-90 transition-opacity">
            <Logo showText={false} size="sm" />
          </a>
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
        </nav>
        
        <article className="max-w-4xl mx-auto py-16 px-6">
          <header className="mb-16 text-center">
            <div className="flex justify-center items-center gap-4 mb-8">
              <span className="bg-blue-50 text-[#1a3a8a] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Article</span>
              <span className="text-gray-400 text-xs font-medium">{post.publicationDate}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400 text-xs font-medium">{post.readTimeMinutes} min {t.readTime}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-10 leading-[1.15] tracking-tight max-w-3xl mx-auto">
              {title}
            </h1>

            <div className="flex justify-center items-center gap-4 mb-12">
               <div className="w-12 h-12 bg-gradient-to-tr from-[#1a3a8a] to-blue-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                 {post.author ? post.author.charAt(0) : 'A'}
               </div>
               <div className="text-left">
                 <div className="text-sm font-black text-gray-900">{post.author || 'Admin'}</div>
                 <div className="text-xs text-gray-400 font-medium">Expert en Microfinance</div>
               </div>
            </div>

            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 aspect-[16/9]">
              <img src={postImage} alt={title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000" />
            </div>
          </header>

          <div className="max-w-2xl mx-auto">
            <div 
              className="prose prose-lg md:prose-xl prose-blue max-w-none text-gray-700 leading-relaxed font-medium mb-20"
              dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
            />

            <div className="border-t border-b border-gray-100 py-10 mb-20 flex flex-col md:flex-row items-center justify-between gap-6">
              <button 
                onClick={() => handleShare('native')}
                className="text-sm font-black text-gray-900 uppercase tracking-widest hover:text-[#1a3a8a] transition-colors"
              >
                {t.share} ARTICLE
              </button>
              <div className="flex gap-4">
                {['facebook', 'twitter', 'linkedin', 'whatsapp', 'instagram', 'tiktok', 'copy'].map((p) => (
                  <button 
                    key={p} 
                    onClick={() => handleShare(p)}
                    className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:border-gray-200 transition-all text-gray-400 hover:text-[#1a3a8a]"
                  >
                    {p === 'facebook' && <Icons.Facebook />}
                    {p === 'twitter' && <Icons.Twitter />}
                    {p === 'linkedin' && <Icons.LinkedIn />}
                    {p === 'whatsapp' && <Icons.WhatsApp />}
                    {p === 'instagram' && <Icons.Instagram />}
                    {p === 'tiktok' && <Icons.TikTok />}
                    {p === 'copy' && <Icons.Link />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-[2rem] p-8 flex items-start gap-6 border border-gray-100 mb-16">
               <div className="w-16 h-16 bg-[#1a3a8a] rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-2xl">
                 {post.author ? post.author.charAt(0) : 'A'}
               </div>
               <div>
                 <h4 className="text-lg font-black text-gray-900 mb-2">{post.author || 'Admin'}</h4>
                 <p className="text-sm text-gray-500 leading-relaxed font-medium">
                   Passionné par l'intersection de la technologie et de la finance, {post.author || 'notre expert'} écrit régulièrement sur la manière dont les solutions numériques peuvent favoriser l'inclusion financière.
                 </p>
               </div>
            </div>
          </div>
        </article>

        <footer className="bg-gray-900 py-24 text-center px-6">
           <h3 className="text-white text-2xl font-black mb-8">Prêt à explorer davantage ?</h3>
           <button 
             onClick={() => setView('home')}
             className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black text-sm hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95"
           >
             {t.backToPosts}
           </button>
           <p className="text-gray-500 mt-12 text-sm font-medium">© 2025 MicroFormS. All Rights Reserved.</p>
        </footer>
      </div>
    );
  };

  const renderContent = () => {
    switch(view) {
      case 'article':
        return renderArticle();
      case 'home':
      default:
        return renderHome();
    }
  };

  return (
    <>
      {renderContent()}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          {toast}
        </div>
      )}
    </>
  );
};

export default App;
