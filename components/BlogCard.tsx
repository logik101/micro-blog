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
        await navigator.share({ 
          title: post.title, 
          text: post.description,
          url: shareUrl 
        });
        return;
      } catch (err) {}
    }

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(post.title);
    const encodedText = encodeURIComponent(`${post.title} - ${post.description}`);
    
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
        setTimeout(() => {
          if (document.hasFocus()) window.open(waWebUrl, '_blank');
        }, 500);
        return;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'instagram':
        await navigator.clipboard.writeText(shareUrl);
        if (onShowToast) onShowToast(language === 'fr' ? 'Lien copié ! Ouverture d\'Instagram...' : 'Link copied! Opening Instagram...');
        window.location.href = 'instagram://';
        return;
      case 'tiktok':
        await navigator.clipboard.writeText(shareUrl);
        if (onShowToast) onShowToast(language === 'fr' ? 'Lien copié ! Ouverture de TikTok...' : 'Link copied! Opening TikTok...');
        window.location.href = 'snssdk1128://'; 
        return;
      case 'copy':
      default:
        await navigator.clipboard.writeText(shareUrl);
        if (onShowToast) onShowToast(language === 'fr' ? 'Lien copié !' : 'Link copied!');
        return;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const platforms = [
    { id: 'facebook', icon: <Icons.Facebook />, hoverColor: 'hover:text-[#1877F2]', bgColor: 'hover:bg-[#1877F2]/10' },
    { id: 'twitter', icon: <Icons.Twitter />, hoverColor: 'hover:text-black', bgColor: 'hover:bg-black/10' },
    { id: 'linkedin', icon: <Icons.LinkedIn />, hoverColor: 'hover:text-[#0A66C2]', bgColor: 'hover:bg-[#0A66C2]/10' },
    { id: 'whatsapp', icon: <Icons.WhatsApp />, hoverColor: 'hover:text-[#25D366]', bgColor: 'hover:bg-[#25D366]/10' },
    { id: 'instagram', icon: <Icons.Instagram />, hoverColor: 'hover:text-[#E4405F]', bgColor: 'hover:bg-[#E4405F]/10' },
    { id: 'tiktok', icon: <Icons.TikTok />, hoverColor: 'hover:text-black', bgColor: 'hover:bg-black/10' },
    { id: 'copy', icon: <Icons.Link />, hoverColor: 'hover:text-[#1a3a8a]', bgColor: 'hover:bg-[#1a3a8a]/10' },
  ];

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

        <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-4">
          <div className="flex items-center">
            <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
              {t.share}
            </p>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            {platforms.map((p) => (
              <div 
                key={p.id} 
                onClick={(e) => handleShare(p.id, e)} 
                className={`p-1.5 sm:p-2 rounded-lg bg-gray-50/80 text-gray-500 transform hover:scale-110 active:scale-90 hover:shadow-md transition-all cursor-pointer ${p.hoverColor} ${p.bgColor}`}
                title={p.id.charAt(0).toUpperCase() + p.id.slice(1)}
              >
                {p.icon}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;