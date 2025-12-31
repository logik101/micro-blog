
import React from 'react';
import { BlogPost, Language } from '../types';
import { Icons, TRANSLATIONS, getPostImage } from '../constants';

interface BlogCardProps {
  post: BlogPost;
  language: Language;
  onClick?: () => void;
  onShowToast?: (msg: string) => void;
  highlightQuery?: string;
}

const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[#1a3a8a]/10 text-[#1a3a8a] px-0.5 rounded-sm inline-block">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const BlogCard: React.FC<BlogCardProps> = ({ post, language, onClick, onShowToast, highlightQuery = "" }) => {
  const t = TRANSLATIONS[language];
  const shareUrl = window.location.href;
  const postImage = getPostImage(post);

  const handleShare = async (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: post.title, url: shareUrl });
        return;
      } catch (err) {}
    }
    await navigator.clipboard.writeText(shareUrl);
    if (onShowToast) onShowToast(language === 'fr' ? 'Lien copié !' : 'Link copied!');
  };

  return (
    <div 
      className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer h-full group"
      onClick={onClick}
    >
      <div className="h-48 sm:h-64 w-full overflow-hidden relative">
        <img 
          src={postImage} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <span className="bg-white/90 backdrop-blur-sm text-[#1a3a8a] text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
            {post.readTimeMinutes} min
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-8 flex flex-col flex-grow">
        <div className="text-[#1a3a8a] text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3 opacity-60">
          {post.author} • {post.publicationDate}
        </div>
        
        <h3 className="text-[#111827] text-lg sm:text-2xl font-black leading-tight mb-3 sm:mb-4 line-clamp-2 group-hover:text-[#1a3a8a] transition-colors tracking-tight">
          <HighlightText text={post.title} query={highlightQuery} />
        </h3>
        
        <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 line-clamp-3 font-medium">
          <HighlightText text={post.description} query={highlightQuery} />
        </p>

        <div className="mt-auto pt-4 sm:pt-6 border-t border-gray-50 flex justify-between items-center">
          <button 
            onClick={(e) => handleShare('native', e)}
            className="text-[9px] sm:text-[10px] font-black tracking-widest text-gray-300 uppercase hover:text-[#1a3a8a]"
          >
            {t.share}
          </button>
          <div className="flex space-x-2 sm:space-x-3">
            {['facebook', 'twitter', 'whatsapp', 'copy'].map((p) => (
              <div key={p} onClick={(e) => handleShare(p, e)} className="transform hover:scale-110 active:scale-90 opacity-60 hover:opacity-100 scale-90 sm:scale-100">
                {p === 'facebook' && <Icons.Facebook />}
                {p === 'twitter' && <Icons.Twitter />}
                {p === 'whatsapp' && <Icons.WhatsApp />}
                {p === 'copy' && <Icons.Link />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
