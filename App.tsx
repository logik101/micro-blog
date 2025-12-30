
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlogPost, ViewState, User, Language } from './types';
import { INITIAL_BLOGS, TRANSLATIONS } from './constants';
import BlogCard from './components/BlogCard';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import LanguageSwitcher from './components/LanguageSwitcher';

const App: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [view, setView] = useState<ViewState>('home');
  const [user, setUser] = useState<User>({ isLoggedIn: false, username: null });
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [language, setLanguage] = useState<Language>('fr');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  // Helper to get translated content for a post
  const getDisplayContent = (post: BlogPost) => {
    // If a translation for the current language exists, use it
    if (post.translations?.[language]) {
      return {
        title: post.translations[language]!.title,
        excerpt: post.translations[language]!.excerpt,
        content: post.translations[language]!.content,
      };
    }
    // Fallback to original
    return {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
    };
  };

  // Load from local storage or use initial
  useEffect(() => {
    const saved = localStorage.getItem('micro_blogs');
    const savedLang = localStorage.getItem('micro_lang') as Language;
    if (saved) {
      setBlogs(JSON.parse(saved));
    } else {
      setBlogs(INITIAL_BLOGS);
    }
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (blogs.length > 0) {
      localStorage.setItem('micro_blogs', JSON.stringify(blogs));
    }
  }, [blogs]);

  useEffect(() => {
    localStorage.setItem('micro_lang', language);
  }, [language]);

  // Handle clicking outside search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (username: string) => {
    setUser({ isLoggedIn: true, username });
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, username: null });
    setView('home');
  };

  const addPost = (post: BlogPost) => {
    setBlogs([post, ...blogs]);
  };

  const updatePost = (updated: BlogPost) => {
    setBlogs(blogs.map(b => b.id === updated.id ? updated : b));
    if (selectedPost?.id === updated.id) {
      setSelectedPost(updated);
    }
  };

  const deletePost = (id: string) => {
    if (window.confirm('Are you sure?')) {
      setBlogs(blogs.filter(b => b.id !== id));
    }
  };

  const handleEditorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    if (editingPost.id) {
      updatePost(editingPost);
    } else {
      addPost({ ...editingPost, id: Date.now().toString() });
    }
    setView('dashboard');
    setEditingPost(null);
  };

  // Search logic (Only shows published posts on public home)
  const filteredBlogs = useMemo(() => {
    const baseBlogs = blogs.filter(b => b.isPublished);
    if (!searchQuery.trim()) return baseBlogs;
    const q = searchQuery.toLowerCase();
    return baseBlogs.filter(post => {
      const display = getDisplayContent(post);
      return display.title.toLowerCase().includes(q) ||
             post.category.toLowerCase().includes(q) ||
             display.excerpt.toLowerCase().includes(q) ||
             display.content.toLowerCase().includes(q);
    });
  }, [blogs, searchQuery, language]);

  const suggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return blogs.filter(post => post.isPublished).filter(post => {
      const display = getDisplayContent(post);
      return display.title.toLowerCase().includes(q) ||
             post.category.toLowerCase().includes(q);
    }).slice(0, 5);
  }, [blogs, searchQuery, language]);

  const renderHome = () => (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#1a3a8a] rounded flex items-center justify-center text-white font-bold text-lg">M</div>
          <span className="font-bold text-xl tracking-tight text-[#111827]">MicroFormS</span>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
          <button 
            onClick={() => user.isLoggedIn ? setView('dashboard') : setView('login')}
            className="text-sm font-bold text-[#1a3a8a] border-2 border-[#1a3a8a] px-4 py-1.5 rounded-full hover:bg-[#1a3a8a] hover:text-white transition"
          >
            {user.isLoggedIn ? t.dashboard : t.admin}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto text-center py-20 px-6">
        <h1 className="text-5xl font-black text-[#111827] mb-6">{t.blog}</h1>
        <p className="text-gray-500 text-lg mb-10">
          {t.heroSubtitle}
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative" ref={searchRef}>
          <div className="relative group">
            <input 
              type="text"
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 pl-14 shadow-lg shadow-gray-200/50 focus:outline-none focus:border-[#1a3a8a] focus:ring-4 focus:ring-[#1a3a8a]/5 transition-all text-gray-900 font-medium placeholder-gray-400"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1a3a8a] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-2">
                <div className="px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                  {t.suggestions}
                </div>
                {suggestions.map((post) => {
                  const display = getDisplayContent(post);
                  return (
                    <button
                      key={post.id}
                      onClick={() => {
                        setSelectedPost(post);
                        setView('article');
                        setShowSuggestions(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-gray-900 group-hover:text-[#1a3a8a] transition-colors truncate max-w-[300px]">
                          {display.title}
                        </div>
                        <div className="text-[10px] font-bold text-[#1a3a8a]/60 uppercase tracking-tighter">
                          {post.category}
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-[#1a3a8a] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Blog Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        {filteredBlogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6 text-gray-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{t.noResults}</h3>
            <p className="text-gray-500">Matching "{searchQuery}".</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-8 text-[#1a3a8a] font-bold hover:underline"
            >
              {t.clearFilter}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((post) => {
              const display = getDisplayContent(post);
              return (
                <BlogCard 
                  key={post.id} 
                  post={{...post, ...display}} 
                  language={language}
                  onClick={() => {
                    setSelectedPost(post);
                    setView('article');
                  }}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 text-center">
        <p className="text-gray-400 text-sm">© 2025 MicroFormS. All rights reserved.</p>
      </footer>
    </div>
  );

  const renderArticle = () => {
    if (!selectedPost) return null;
    const display = getDisplayContent(selectedPost);
    
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <button onClick={() => setView('home')} className="text-sm font-bold text-gray-600 flex items-center hover:text-[#1a3a8a] transition-colors">
            <span className="mr-2">←</span> {t.backToPosts}
          </button>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
            <div className="w-8 h-8 bg-[#1a3a8a] rounded flex items-center justify-center text-white font-bold">M</div>
          </div>
        </nav>
        <article className="max-w-4xl mx-auto py-16 px-6">
          <span className="text-[#1a3a8a] text-xs font-bold uppercase tracking-widest">{selectedPost.category}</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 mb-8 leading-tight">{display.title}</h1>
          <div className="flex items-center space-x-4 mb-10 pb-6 border-b border-gray-100">
            <div className="bg-gray-100 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[#1a3a8a] text-lg">
              {selectedPost.author.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{selectedPost.author}</p>
              <p className="text-xs text-gray-400 font-medium">{selectedPost.date} • {selectedPost.readingTime}</p>
            </div>
          </div>
          
          {/* Translation Availability Badge */}
          {selectedPost.translations?.[language] && (
            <div className="mb-6 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Translated by AI for {language.toUpperCase()}
            </div>
          )}

          <div className="relative group overflow-hidden rounded-[2.5rem] mb-12 shadow-2xl">
            <img src={selectedPost.imageUrl} alt={display.title} className="w-full h-[300px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105" />
          </div>
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
            {display.content}
          </div>
        </article>
      </div>
    );
  };

  const renderEditor = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-[#1a3a8a] p-8 text-white flex justify-between items-center">
          <h2 className="text-2xl font-black">{editingPost?.id ? t.editPost : t.createPost}</h2>
          <button onClick={() => setView('dashboard')} className="text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">{t.cancel}</button>
        </div>
        <form onSubmit={handleEditorSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.postTitle}</label>
              <input 
                required
                placeholder="Ex: The Future of AI"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all"
                value={editingPost?.title || ''}
                onChange={e => setEditingPost(prev => prev ? {...prev, title: e.target.value} : null)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.category}</label>
              <input 
                required
                placeholder="Ex: INNOVATION"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all"
                value={editingPost?.category || ''}
                onChange={e => setEditingPost(prev => prev ? {...prev, category: e.target.value} : null)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.imageUrl}</label>
            <input 
              required
              placeholder="https://images.unsplash.com/..."
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all"
              value={editingPost?.imageUrl || ''}
              onChange={e => setEditingPost(prev => prev ? {...prev, imageUrl: e.target.value} : null)}
            />
          </div>
          <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
            <input 
              type="checkbox"
              id="isPublished"
              className="w-5 h-5 text-[#1a3a8a] border-gray-300 rounded focus:ring-[#1a3a8a]"
              checked={editingPost?.isPublished || false}
              onChange={e => setEditingPost(prev => prev ? {...prev, isPublished: e.target.checked} : null)}
            />
            <label htmlFor="isPublished" className="text-sm font-bold text-gray-700">{t.published}</label>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.excerpt}</label>
            <textarea 
              required
              placeholder="..."
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all h-24 resize-none"
              value={editingPost?.excerpt || ''}
              onChange={e => setEditingPost(prev => prev ? {...prev, excerpt: e.target.value} : null)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">{t.fullContent}</label>
            <textarea 
              required
              placeholder="..."
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all h-80 resize-none"
              value={editingPost?.content || ''}
              onChange={e => setEditingPost(prev => prev ? {...prev, content: e.target.value} : null)}
            />
          </div>
          <button 
            type="submit"
            className="w-full py-5 bg-[#1a3a8a] text-white font-black rounded-2xl hover:bg-[#152e6d] transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] uppercase tracking-widest"
          >
            {editingPost?.id ? t.update : t.publish}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {view === 'home' && renderHome()}
      {view === 'article' && renderArticle()}
      {view === 'login' && <Auth onLogin={handleLogin} onBack={() => setView('home')} language={language} />}
      {view === 'dashboard' && (
        <Dashboard 
          posts={blogs} 
          language={language}
          onAdd={addPost} 
          onDelete={deletePost} 
          onLogout={handleLogout}
          onUpdate={updatePost}
          onEdit={(post) => {
            setEditingPost(post);
            setView('editor');
          }}
          onLanguageChange={setLanguage}
        />
      )}
      {view === 'editor' && renderEditor()}
    </>
  );
};

export default App;
