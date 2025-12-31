
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BlogPost, Language } from './types';
import { TRANSLATIONS, Icons, getPostImage, POSTS_PER_PAGE } from './constants';
import BlogCard from './components/BlogCard';
import LanguageSwitcher from './components/LanguageSwitcher';
import Logo from './components/Logo';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { marked } from 'marked';

// Updated URL to point to the correct repository source
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
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder]);

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
      const author = p.author || 'Admin';
      if (title.toLowerCase().includes(q) || author.toLowerCase().includes(q)) {
        return { post: p, title, author };
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

  const handleShare = async (post: BlogPost, platform: string) => {
    const shareUrl = window.location.href;
    const title = getLangField(post, 'title');
    const description = getLangField(post, 'description');

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ 
          title: title, 
          text: description,
          url: shareUrl 
        });
        return;
      } catch (err) {}
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(`${title} - ${description}`);
    
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'whatsapp':
        const waUrl = `whatsapp://send?text=${encodedText}%20${encodedUrl}`;
        const waWebUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        window.location.href = waUrl;
        setTimeout(() => { if (document.hasFocus()) window.open(waWebUrl, '_blank'); }, 500);
        return;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'instagram':
        await navigator.clipboard.writeText(shareUrl);
        showToast(language === 'fr' ? 'Lien copié ! Ouverture d\'Instagram...' : 'Link copied! Opening Instagram...');
        window.location.href = 'instagram://';
        return;
      case 'tiktok':
        await navigator.clipboard.writeText(shareUrl);
        showToast(language === 'fr' ? 'Lien copié ! Ouverture de TikTok...' : 'Link copied! Opening TikTok...');
        window.location.href = 'snssdk1128://';
        return;
      case 'copy':
      default:
        await navigator.clipboard.writeText(shareUrl);
        showToast(language === 'fr' ? 'Lien copié !' : 'Link copied!');
        return;
    }

    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderHome = () => (
    <div className="min-h-screen bg-[#f9fafb]">
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-50">
        <Logo className="cursor-pointer" size="sm" showText={false} />
        <div className="flex items-center gap-4">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
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
                    searchResults.map(({ post, title, author }) => (
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
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
          <div className="mt-20 flex justify-center items-center gap-12">
            <button
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className={`group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                currentPage === 1 ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:text-[#1a3a8a] text-gray-600'
              }`}
            >
              <span className="text-xl group-hover:-translate-x-1.5 transition-transform duration-300">←</span>
              {t.prev}
            </button>
            
            <div className="h-10 w-[1px] bg-gray-100 rotate-[30deg]"></div>

            <div className="flex items-center">
              <span className="text-[10px] font-black text-[#1a3a8a] bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                {currentPage} / {totalPages}
              </span>
            </div>

            <div className="h-10 w-[1px] bg-gray-100 rotate-[30deg]"></div>

            <button
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className={`group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                currentPage === totalPages ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:text-[#1a3a8a] text-gray-600'
              }`}
            >
              {t.next}
              <span className="text-xl group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </button>
          </div>
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

    const platforms = [
      { id: 'facebook', icon: <Icons.Facebook />, hoverColor: 'hover:text-[#1877F2]', bgColor: 'hover:bg-[#1877F2]/10' },
      { id: 'twitter', icon: <Icons.Twitter />, hoverColor: 'hover:text-black', bgColor: 'hover:bg-black/10' },
      { id: 'linkedin', icon: <Icons.LinkedIn />, hoverColor: 'hover:text-[#0A66C2]', bgColor: 'hover:bg-[#0A66C2]/10' },
      { id: 'whatsapp', icon: <Icons.WhatsApp />, hoverColor: 'hover:text-[#25D366]', bgColor: 'hover:bg-[#25D366]/10' },
      { id: 'instagram', icon: <Icons.Instagram />, hoverColor: 'hover:text-[#E4405F]', bgColor: 'hover:bg-[#E4405F]/10' },
      { id: 'tiktok', icon: <Icons.TikTok />, hoverColor: 'hover:text-black', bgColor: 'hover:bg-black/10' },
      { id: 'copy', icon: <Icons.Link />, hoverColor: 'hover:text-[#1a3a8a]', bgColor: 'hover:bg-[#1a3a8a]/10' },
    ];

    const suggestedPosts = posts
      .filter(p => p.id !== selectedPostId)
      .slice(0, 3);
    
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
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-[1.15] tracking-tight">{title}</h1>
            <div className="rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 aspect-[16/9]">
              <img src={getPostImage(post)} alt={title} className="w-full h-full object-cover" />
            </div>
          </header>
          <div className="max-w-2xl mx-auto">
            <div 
              className="prose prose-sm sm:prose-lg md:prose-xl prose-blue max-w-none text-gray-700 leading-relaxed font-medium mb-12"
              dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
            />
            
            <div className="mt-20 py-12 border-t border-gray-100">
              <div className="flex flex-col items-center gap-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">{t.share}</p>
                <div className="flex items-center gap-1 sm:gap-3">
                  {platforms.map((p) => (
                    <button 
                      key={p.id} 
                      onClick={() => handleShare(post, p.id)} 
                      className={`p-2 sm:p-3 rounded-2xl bg-gray-50 text-gray-500 transform hover:scale-110 active:scale-90 hover:shadow-xl transition-all ${p.hoverColor} ${p.bgColor}`}
                      title={p.id.charAt(0).toUpperCase() + p.id.slice(1)}
                    >
                      {p.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {suggestedPosts.length > 0 && (
              <div className="mt-24 pt-12 border-t border-gray-100">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-10 text-center uppercase tracking-widest">{t.suggestedPosts}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {suggestedPosts.map(p => {
                    const sTitle = getLangField(p, 'title');
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handleArticleOpen(p.id)}
                        className="group cursor-pointer flex flex-col"
                      >
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 border border-gray-100 shadow-sm transition-shadow group-hover:shadow-md">
                          <img src={getPostImage(p)} alt={sTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <h4 className="text-sm font-black text-gray-900 leading-snug group-hover:text-[#1a3a8a] transition-colors line-clamp-2">{sTitle}</h4>
                        <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {p.author}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button onClick={() => setView('home')} className="mt-24 w-full bg-[#111827] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#1a3a8a] transition-colors">{t.backToPosts}</button>
          </div>
        </article>
      </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case 'home': return renderHome();
      case 'article': return renderArticle();
      case 'login': return <Auth onLogin={() => setView('dashboard')} onBack={() => setView('home')} language={language} />;
      case 'dashboard': return <Dashboard posts={posts} language={language} onLogout={() => setView('home')} onAdd={(p) => setPosts([p, ...posts])} onDelete={(id) => setPosts(posts.filter(x => x.id !== id))} onEdit={() => {}} onUpdate={(p) => setPosts(posts.map(x => x.id === p.id ? p : x))} onLanguageChange={setLanguage} />;
      default: return renderHome();
    }
  };

  return (
    <>
      {renderContent()}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toast}
        </div>
      )}
    </>
  );
};

export default App;
