
import React, { useState } from 'react';
import { BlogPost, Language } from '../types';
import { gemini } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import LanguageSwitcher from './LanguageSwitcher';

interface DashboardProps {
  posts: BlogPost[];
  language: Language;
  onAdd: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  onEdit: (post: BlogPost) => void;
  onUpdate: (post: BlogPost) => void;
  onLanguageChange: (lang: Language) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ posts, language, onAdd, onDelete, onLogout, onEdit, onUpdate, onLanguageChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const t = TRANSLATIONS[language];

  const handleGenerateAI = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const generated = await gemini.generateBlogPost(topic);
      const newPost: BlogPost = {
        ...generated,
        id: Date.now().toString(),
        imageUrl: `https://picsum.photos/seed/${Math.random()}/800/600`,
        date: new Date().toLocaleDateString(),
        author: 'Admin',
        isPublished: true,
        translations: {}
      };
      onAdd(newPost);
      setTopic('');
    } catch (e) {
      alert("AI generation failed. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoTranslate = async (post: BlogPost) => {
    setTranslatingId(post.id);
    try {
      const targetLangs: Language[] = ['en', 'fr', 'ht'];
      const newTranslations = { ...(post.translations || {}) };

      for (const lang of targetLangs) {
        // Skip translating if already present or if it's the current content language 
        // (Assuming current content is 'fr' for now based on default, but can be smarter)
        if (!newTranslations[lang]) {
          const result = await gemini.translateBlogPost(
            { title: post.title, excerpt: post.excerpt, content: post.content },
            lang
          );
          newTranslations[lang] = result;
        }
      }

      onUpdate({ ...post, translations: newTranslations });
    } catch (e) {
      alert("Translation failed. AI might be temporarily unavailable.");
    } finally {
      setTranslatingId(null);
    }
  };

  const togglePublish = (post: BlogPost) => {
    onUpdate({ ...post, isPublished: !post.isPublished });
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t.dashboard}</h1>
          <p className="text-gray-500 font-medium">Manage your blog content</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} />
          <button 
            onClick={() => onEdit({
              id: '',
              title: '',
              category: '',
              excerpt: '',
              content: '',
              imageUrl: 'https://picsum.photos/800/600',
              date: new Date().toLocaleDateString(),
              readingTime: `5 min ${t.readTime}`,
              author: 'Admin',
              isPublished: true,
              translations: {}
            })}
            className="bg-[#1a3a8a] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#152e6d] transition-all shadow-lg active:scale-95"
          >
            + {t.newPost}
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 border-2 border-red-100 text-red-600 px-6 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
          >
            {t.logout}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100 p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">{t.recentPosts}</h2>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Post</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Languages</th>
                  <th className="px-4 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.status}</th>
                  <th className="px-4 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400 italic">
                      No posts found yet.
                    </td>
                  </tr>
                ) : (
                  posts.map(post => (
                    <tr key={post.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-xl overflow-hidden mr-4 border border-gray-100 shrink-0">
                            <img src={post.imageUrl} className="h-full w-full object-cover" />
                          </div>
                          <div className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{post.title}</div>
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span title="English" className={`text-sm grayscale transition-all ${post.translations?.en || language === 'en' ? 'grayscale-0' : 'opacity-20'}`}>🇺🇸</span>
                          <span title="French" className={`text-sm grayscale transition-all ${post.translations?.fr || language === 'fr' ? 'grayscale-0' : 'opacity-20'}`}>🇫🇷</span>
                          <span title="Haitian Creole" className={`text-sm grayscale transition-all ${post.translations?.ht || language === 'ht' ? 'grayscale-0' : 'opacity-20'}`}>🇭🇹</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap">
                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                           post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                         }`}>
                           {post.isPublished ? t.published : t.draft}
                         </span>
                      </td>
                      <td className="px-4 py-5 whitespace-nowrap text-right text-sm font-bold">
                        <button 
                          onClick={() => handleAutoTranslate(post)}
                          disabled={translatingId === post.id}
                          className={`mr-4 transition-all flex items-center justify-end gap-1 float-right ${translatingId === post.id ? 'text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          <svg className={`w-4 h-4 ${translatingId === post.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {translatingId === post.id ? t.translating : t.translateAction}
                        </button>
                        <div className="clear-both"></div>
                        <div className="mt-2 flex justify-end gap-3">
                          <button 
                            onClick={() => togglePublish(post)}
                            className={`transition-colors text-xs uppercase tracking-tighter ${post.isPublished ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {post.isPublished ? t.unpublishAction : t.publishAction}
                          </button>
                          <button 
                            onClick={() => onEdit(post)}
                            className="text-blue-600 hover:text-blue-800 text-xs uppercase tracking-tighter"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => onDelete(post.id)}
                            className="text-red-400 hover:text-red-600 text-xs uppercase tracking-tighter"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] rounded-[2rem] border border-blue-100 p-8 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.455z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-blue-900">{t.aiAssistant}</h2>
          </div>
          <p className="text-blue-700/80 text-sm mb-8 font-medium leading-relaxed">
            {t.aiAssistantDesc}
          </p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2 ml-1">{t.topicLabel}</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.topicPlaceholder}
                className="w-full px-5 py-4 rounded-2xl border-2 border-blue-200/50 bg-white/50 text-gray-900 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating || !topic}
              className={`group relative w-full py-4 px-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-xl ${isGenerating ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-blue-500/20'} text-white overflow-hidden`}
            >
              <span className="relative z-10">{isGenerating ? t.generating : t.magicGen}</span>
              {!isGenerating && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </button>
            <div className="flex flex-col items-center gap-1 opacity-50">
              <p className="text-[10px] text-blue-900 font-bold uppercase tracking-tighter">{t.poweredBy}</p>
              <div className="w-12 h-0.5 bg-blue-900/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
